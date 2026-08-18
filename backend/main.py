from typing import Annotated, TypedDict, List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import os
import json
from dotenv import load_dotenv
import pypdf
import docx

# LangGraph and LangChain imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, START, END

load_dotenv()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# --- Load FAISS + Pandas once at startup (Preserved for future IP Search) ---
print("Loading model + index...")
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    index = faiss.read_index('patent_index.faiss')
    df = pd.read_pickle('patents_df.pkl')
except Exception as e:
    print(f"Warning: Could not load FAISS index or dataset. IP Search features will fail later. Error: {e}")

try:
    tm_df = pd.read_csv('trademarks_demo.csv')
except Exception as e:
    print(f"Warning: Could not load trademark dataset: {e}")
    tm_df = None

try:
    cr_df = pd.read_csv('copyrights_demo.csv')
except Exception as e:
    print(f"Warning: Could not load copyright dataset: {e}")
    cr_df = None

# --- LLM Config ---
api_key = os.environ.get('GOOGLE_API_KEY')
if not api_key:
    print("WARNING: GOOGLE_API_KEY environment variable not set. LLM features will fail.")

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=api_key)
print("Ready.")


# ==========================================
# Phase 1: AI Understanding (LangGraph)
# ==========================================

# --- Pydantic Models for FastAPI ---
class IdeaInput(BaseModel):
    text: str

class AnalysisData(BaseModel):
    # Old ones for compatibility
    summary: str
    technical_features: List[str]
    key_concepts: List[str]
    potential_claims: List[str]
    # New ones for UI
    title: Optional[str] = None
    technology_domain: Optional[str] = None
    primary_inventor: Optional[str] = None
    keywords: Optional[List[str]] = None
    invention_summary: Optional[str] = None
    problem_statement: Optional[str] = None
    proposed_solution: Optional[str] = None
    components: Optional[List[str]] = None
    working_methodology: Optional[str] = None
    potential_novelty_points: Optional[List[str]] = None
    limitations_or_missing_information: Optional[List[str]] = None

class AnalysisResponse(BaseModel):
    success: bool
    analysis: AnalysisData

# --- Pydantic Models for Structured LLM Output ---
class ExtractionResult(BaseModel):
    title: Optional[str] = Field(None, description="Title of the invention if explicitly stated.")
    technology_domain: Optional[str] = Field(None, description="The general technology domain.")
    primary_inventor: Optional[str] = Field(None, description="Name of the primary inventor if explicitly stated.")
    keywords: Optional[List[str]] = Field(None, description="Key technical terms.")
    invention_summary: str = Field(description="A clear and concise summary of the invention.")
    problem_statement: str = Field(description="The specific technical problem the invention addresses.")
    proposed_solution: str = Field(description="How the invention solves the identified problem.")
    technical_features: List[str] = Field(description="List of specific technical features explicitly disclosed.")
    components: List[str] = Field(description="List of primary components or system elements of the invention.")
    working_methodology: str = Field(description="Step-by-step technical workflow or method of operation.")
    key_concepts: List[str] = Field(description="Broad technical concepts or tags associated with the invention.")
    potential_novelty_points: List[str] = Field(description="Potentially distinguishing features based on the provided information.")
    potential_claims: List[str] = Field(description="AI-generated preliminary drafting suggestions for claims based strictly on disclosed technical features. Not a guarantee of patentability.")
    limitations_or_missing_information: List[str] = Field(description="Limitations or information not present in the source but typically required.")

# --- LangGraph State ---
class AnalysisState(TypedDict):
    input_text: str
    result: Optional[ExtractionResult]

# --- LangGraph Nodes ---
def parse_input(state: AnalysisState):
    """Normalize input text"""
    return {"input_text": state["input_text"].strip(), "result": None}

def extract_understanding(state: AnalysisState):
    """Use LLM to extract structured patent data."""
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a patent analysis assistant.\n"
                   "Analyze ONLY the invention information provided by the user.\n"
                   "Your task is to extract, organize, and summarize the technical content accurately.\n"
                   "Do not invent facts.\n"
                   "Do not assume technical components, algorithms, measurements, performance results, inventors, dates, patents, or implementation details that are not explicitly supported by the source.\n"
                   "When information is unavailable, state: 'Not specified in the provided invention information.'\n"
                   "Distinguish clearly between: 1. facts explicitly supported by the source 2. reasonable structural restatement of those facts\n"
                   "Do not make a legal determination of patentability, infringement, ownership, or validity.\n"
                   "Potential novelty points must be phrased as: 'Potentially distinguishing feature based on the provided information'.\n"
                   "Potential claims are preliminary drafting concepts only and must be grounded strictly in the provided technical content.\n"
                   "Preserve technical terminology from the source where possible.\n"
                   "Produce concise, professional, patent-oriented output."),
        ("user", "Invention Description:\n{input_text}")
    ])
    
    # Enforce structured output via native Langchain+Gemini integration
    structured_llm = llm.with_structured_output(ExtractionResult)
    chain = prompt | structured_llm
    
    result = chain.invoke({"input_text": state["input_text"]})
    return {"result": result}

# --- Build LangGraph Workflow ---
workflow = StateGraph(AnalysisState)
workflow.add_node("parse_input", parse_input)
workflow.add_node("extract_understanding", extract_understanding)

workflow.add_edge(START, "parse_input")
workflow.add_edge("parse_input", "extract_understanding")
workflow.add_edge("extract_understanding", END)

app_graph = workflow.compile()


@app.post("/analyze-invention", response_model=AnalysisResponse)
async def analyze_endpoint(text: Optional[str] = Form(None), file: Optional[UploadFile] = File(None)):
    """
    Analyzes an invention description (via pasted text or file upload) using LangGraph + Gemini.
    """
    content = ""
    
    if file:
        file_ext = file.filename.split('.')[-1].lower() if file.filename else ""
        if file_ext == "pdf":
            reader = pypdf.PdfReader(file.file)
            content = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
        elif file_ext == "docx":
            doc = docx.Document(file.file)
            content = "\n".join([para.text for para in doc.paragraphs])
        elif file_ext == "txt":
            content = (await file.read()).decode("utf-8")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")
    elif text and len(text.strip()) > 0:
        content = text.strip()
        
    if not content or len(content.strip()) == 0:
        raise HTTPException(status_code=400, detail="Invention content cannot be empty.")
        
    try:
        # Run LangGraph pipeline
        state_result = app_graph.invoke({"input_text": content, "result": None})
        extracted: ExtractionResult = state_result["result"]
        
        # Map back to AnalysisData to preserve downstream compatibility
        return AnalysisResponse(
            success=True,
            analysis=AnalysisData(
                summary=extracted.invention_summary,
                technical_features=extracted.technical_features,
                key_concepts=extracted.key_concepts,
                potential_claims=extracted.potential_claims,
                title=extracted.title,
                technology_domain=extracted.technology_domain,
                primary_inventor=extracted.primary_inventor,
                keywords=extracted.keywords,
                invention_summary=extracted.invention_summary,
                problem_statement=extracted.problem_statement,
                proposed_solution=extracted.proposed_solution,
                components=extracted.components,
                working_methodology=extracted.working_methodology,
                potential_novelty_points=extracted.potential_novelty_points,
                limitations_or_missing_information=extracted.limitations_or_missing_information
            )
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error during LangGraph execution: {str(e)}")
        # Never expose raw stack trace to user per instructions
        err_str = str(e).lower()
        if '429' in err_str or 'quota' in err_str or 'resource_exhausted' in err_str:
             raise HTTPException(status_code=429, detail="AI quota exceeded. Please wait a few minutes before trying again.")
        raise HTTPException(status_code=500, detail="AI analysis failed. Please check your quota or try again later.")

# ==========================================
# Phase 2: IP Search
# ==========================================

class SearchQuery(BaseModel):
    query: str
    type: str = "patent"
    limit: int = 50

class SearchResult(BaseModel):
    id: str
    title: str
    type: str
    source: str
    publication_number: str
    applicant: str
    status: str
    abstract: str
    url: str = ""

class SearchResponse(BaseModel):
    success: bool
    query: str
    results: List[SearchResult]
    total: int

@app.post("/search", response_model=SearchResponse)
async def search_endpoint(input_data: SearchQuery):
    """
    Basic keyword search across the local patent dataset (patents_df.pkl).
    """
    if not input_data.query or len(input_data.query.strip()) == 0:
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
        
    query = input_data.query.lower()
    
    # Only accept patent, trademark, and copyright
    if input_data.type.lower() not in ["patent", "trademark", "copyright"]:
        return SearchResponse(success=True, query=input_data.query, results=[], total=0)

    try:
        words = [w.strip() for w in query.split() if len(w.strip()) > 0]
        scores = []

        if input_data.type.lower() == "trademark":
            if 'tm_df' not in globals() or tm_df is None:
                return SearchResponse(success=True, query=input_data.query, results=[], total=0)
                
            for idx, row in tm_df.iterrows():
                mark = str(row.get('mark', row.get('title', ''))).lower()
                description = str(row.get('description', '')).lower()
                owner = str(row.get('owner', '')).lower()
                category = str(row.get('category', '')).lower()
                
                score = 0
                words_found = 0
                
                if query in mark:
                    score += 100
                if query in description:
                    score += 50
                if query in owner:
                    score += 20
                    
                for w in words:
                    found_in_mark = w in mark
                    found_in_desc = w in description
                    found_in_owner = w in owner
                    found_in_cat = w in category
                    
                    if found_in_mark:
                        score += 10
                    if found_in_desc:
                        score += 3
                    if found_in_owner or found_in_cat:
                        score += 2
                    
                if score > 0:
                    scores.append({'row': row, 'score': score})
                    
            scores.sort(key=lambda x: x['score'], reverse=True)
            top_scores = scores[:input_data.limit]
            
            results = []
            for item in top_scores:
                row = item['row']
                results.append(SearchResult(
                    id=str(row.get('id', '')),
                    title=str(row.get('mark', row.get('title', ''))),
                    type=str(row.get('category', 'trademark')),
                    source="Local Dataset",
                    publication_number=str(row.get('id', '')),
                    applicant=str(row.get('owner', 'Unknown')),
                    status=str(row.get('status', 'Active')),
                    abstract=str(row.get('description', '')),
                    url=""
                ))
                
            return SearchResponse(
                success=True,
                query=input_data.query,
                results=results,
                total=len(results)
            )

        elif input_data.type.lower() == "copyright":
            if 'cr_df' not in globals() or cr_df is None:
                return SearchResponse(success=True, query=input_data.query, results=[], total=0)
                
            for idx, row in cr_df.iterrows():
                title = str(row.get('title', '')).lower()
                description = str(row.get('description', '')).lower()
                owner = str(row.get('owner', '')).lower()
                category = str(row.get('category', '')).lower()
                
                score = 0
                words_found = 0
                
                if query in title:
                    score += 100
                if query in description:
                    score += 50
                if query in owner:
                    score += 20
                    
                for w in words:
                    found_in_title = w in title
                    found_in_desc = w in description
                    found_in_owner = w in owner
                    found_in_cat = w in category
                    
                    if found_in_title or found_in_desc or found_in_owner or found_in_cat:
                        words_found += 1
                        
                    if found_in_title:
                        score += 10
                    if found_in_desc:
                        score += 5
                    if found_in_owner or found_in_cat:
                        score += 3
                        
                if words_found == len(words) and len(words) > 0:
                    score += 20
                    
                if score > 0:
                    scores.append({'row': row, 'score': score})
                    
            scores.sort(key=lambda x: x['score'], reverse=True)
            top_scores = scores[:input_data.limit]
            
            results = []
            for item in top_scores:
                row = item['row']
                results.append(SearchResult(
                    id=str(row.get('id', '')),
                    title=str(row.get('title', '')),
                    type=str(row.get('category', 'copyright')),
                    source=str(row.get('source', 'Local Dataset')),
                    publication_number=str(row.get('id', '')),
                    applicant=str(row.get('owner', 'Unknown')),
                    status=str(row.get('status', 'Registered')),
                    abstract=str(row.get('description', '')),
                    url=""
                ))
                
            return SearchResponse(
                success=True,
                query=input_data.query,
                results=results,
                total=len(results)
            )

        elif input_data.type.lower() == "patent":
            if 'df' not in globals() or df is None:
                raise Exception("Patent dataset not loaded.")
                
            for idx, row in df.iterrows():
                title = str(row['title']).lower()
                abstract = str(row['abstract']).lower()
                
                score = 0
                words_found = 0
                
                # 1. exact phrase match in title (highest weight)
                if query in title:
                    score += 100
                # 2. exact phrase match in abstract
                if query in abstract:
                    score += 50
                    
                # Check individual words
                for w in words:
                    found_in_title = w in title
                    found_in_abstract = w in abstract
                    
                    if found_in_title or found_in_abstract:
                        words_found += 1
                        # 3. multiple query words in title
                        if found_in_title:
                            score += 10
                        # 4. multiple query words in abstract
                        if found_in_abstract:
                            score += 3
                            
                # 7. Prefer results containing ALL or most query terms
                if words_found == len(words) and len(words) > 1:
                    score += 30
                    
                if score > 0:
                    scores.append({
                        'row': row,
                        'score': score
                    })
                    
            # 10. Results should be sorted by relevance score descending before applying limit
            scores.sort(key=lambda x: x['score'], reverse=True)
            top_scores = scores[:input_data.limit]
            
            results = []
            for item in top_scores:
                row = item['row']
                results.append(SearchResult(
                    id=str(row['publication_number']),
                    title=str(row['title']),
                    type="patent",
                    source="Local Dataset",
                    publication_number=str(row['publication_number']),
                    applicant="Unknown", # Not present in the dataset
                    status="Published",
                    abstract=str(row['abstract']),
                    url=""
                ))
                
            return SearchResponse(
                success=True,
                query=input_data.query,
                results=results,
                total=len(results)
            )
    except Exception as e:
        print(f"Error during keyword search: {str(e)}")
        raise HTTPException(status_code=500, detail="Search failed")

# ==========================================
# Phase 3: Semantic Search
# ==========================================

class SemanticQuery(BaseModel):
    query: str
    k: int = 5

class SemanticMatch(BaseModel):
    id: str
    publication: str
    technology: str
    title: str
    explanation: str
    similarity: int
    risk: str

class SemanticResponse(BaseModel):
    success: bool
    results: List[SemanticMatch]

@app.post("/semantic-search", response_model=SemanticResponse)
async def semantic_search_endpoint(input_data: SemanticQuery):
    """
    Semantic search across the FAISS index using SentenceTransformers.
    """
    if not input_data.query or len(input_data.query.strip()) == 0:
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
        
    try:
        if 'model' not in globals() or 'index' not in globals() or 'df' not in globals():
            raise Exception("FAISS index or SentenceTransformer model not loaded.")
            
        # Encode the natural language query
        query_vec = model.encode([input_data.query])
        
        # Search the FAISS index
        D, I = index.search(np.array(query_vec), k=input_data.k)
        
        results = []
        for dist, idx in zip(D[0], I[0]):
            # Convert L2 distance to a rough percentage similarity
            similarity_float = 1 / (1 + dist)
            similarity_pct = int(round(similarity_float * 100))
            
            # Temporary naive risk calculation based solely on similarity (since full Risk Analysis is next phase)
            if similarity_pct >= 80:
                risk = "High"
            elif similarity_pct >= 60:
                risk = "Medium"
            else:
                risk = "Low"
                
            row = df.iloc[idx]
            
            results.append(SemanticMatch(
                id=str(row['publication_number']),
                publication=str(row['publication_number']),
                technology="Local Dataset",
                title=str(row['title']),
                explanation=str(row['abstract']), # Using abstract as the "explanation" for now to save LLM tokens
                similarity=similarity_pct,
                risk=risk
            ))
            
        return SemanticResponse(
            success=True,
            results=results
        )
    except Exception as e:
        print(f"Error during semantic search: {str(e)}")
        raise HTTPException(status_code=500, detail="Semantic search failed")

# ==========================================
# Phase 4: Risk Analysis
# ==========================================

class RiskAnalysisRequest(BaseModel):
    summary: str
    technical_features: List[str]

class FeatureRisk(BaseModel):
    id: int
    feature: str
    novelty: str
    similarity: str
    conflict: str
    risk: str
    explanation: str
    matched_patent_id: str
    score: int

class PotentialConflict(BaseModel):
    patent_id: str
    title: str
    similarity_score: int
    risk_level: str
    matched_features: List[str]
    explanation: str

class TechnicalFeature(BaseModel):
    feature: str
    risk_score: int
    level: str

class RiskAnalysisResponse(BaseModel):
    overall_score: int
    overall_risk: str
    conflicts_identified: int
    novel_features: int
    heatmap_data: List[FeatureRisk]
    potential_conflicts: List[PotentialConflict] = []
    technical_features: List[TechnicalFeature] = []
    novel_features_list: List[str] = []

class LLMFeatureEvaluation(BaseModel):
    conflict_level: str
    explanation: str

class LLMFeatureEvaluations(BaseModel):
    evaluations: List[LLMFeatureEvaluation]

@app.post("/risk-analysis", response_model=RiskAnalysisResponse)
async def risk_analysis_endpoint(input_data: RiskAnalysisRequest):
    if not input_data.technical_features:
        raise HTTPException(status_code=400, detail="No technical features provided")

    try:
        if 'model' not in globals() or 'index' not in globals() or 'df' not in globals():
            raise Exception("FAISS index or SentenceTransformer model not loaded.")

        features_data = []
        for i, feature in enumerate(input_data.technical_features):
            # FAISS similarity
            query_vec = model.encode([feature])
            D, I = index.search(np.array(query_vec), k=1)
            dist = D[0][0]
            idx = I[0][0]
            
            similarity_float = 1 / (1 + dist)
            similarity_pct = int(round(similarity_float * 100))
            
            # Novelty inversion
            novelty_level = "High" if similarity_pct < 40 else "Medium" if similarity_pct < 70 else "Low"
            similarity_level = "Low" if similarity_pct < 40 else "Medium" if similarity_pct < 70 else "High"
            
            row = df.iloc[idx]
            
            features_data.append({
                "id": i + 1,
                "feature": feature,
                "similarity_pct": similarity_pct,
                "novelty_level": novelty_level,
                "similarity_level": similarity_level,
                "matched_patent_id": str(row['publication_number']),
                "matched_title": str(row['title']),
                "matched_abstract": str(row['abstract'])
            })

        # Bulk LLM evaluation for actual conflict
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert patent analyst. For each technical feature provided, evaluate the potential conflict against the matched existing patent abstract. Determine a conflict_level (High, Medium, or Low) based on technical overlap, and provide a 1-sentence explanation of the specific conflict or novelty."),
            ("user", "Features to evaluate: {features_json}")
        ])
        
        # Prepare input for LLM
        eval_input = json.dumps([
            {"feature": f["feature"], "matched_patent_abstract": f["matched_abstract"]}
            for f in features_data
        ])
        
        structured_llm = llm.with_structured_output(LLMFeatureEvaluations)
        chain = prompt | structured_llm
        
        llm_result = chain.invoke({"features_json": eval_input})
        
        # Aggregate Risk
        heatmap_data = []
        conflicts = 0
        novel = 0
        total_score = 0
        
        conflict_dict = {}
        technical_features_list = []
        novel_features_list = []
        
        for i, f in enumerate(features_data):
            eval_res = llm_result.evaluations[i] if i < len(llm_result.evaluations) else LLMFeatureEvaluation(conflict_level="Medium", explanation="LLM evaluation missing")
            
            # Map conflict level to penalty
            conflict_penalty = 80 if eval_res.conflict_level.lower() == "high" else 50 if eval_res.conflict_level.lower() == "medium" else 20
            
            # Combined score (similarity vs actual conflict)
            feature_score = int((f["similarity_pct"] * 0.5) + (conflict_penalty * 0.5))
            
            if feature_score >= 70:
                risk_level = "High"
                conflicts += 1
            elif feature_score >= 40:
                risk_level = "Medium"
            else:
                risk_level = "Low"
                novel += 1
                
            total_score += feature_score
            
            heatmap_data.append(FeatureRisk(
                id=f["id"],
                feature=f["feature"],
                novelty=f["novelty_level"],
                similarity=f["similarity_level"],
                conflict=eval_res.conflict_level.capitalize() if eval_res.conflict_level else "Medium",
                risk=risk_level,
                explanation=eval_res.explanation,
                matched_patent_id=f["matched_patent_id"],
                score=feature_score
            ))
            
            technical_features_list.append(TechnicalFeature(
                feature=f["feature"],
                risk_score=feature_score,
                level=risk_level
            ))
            
            if risk_level == "Low" or f["similarity_pct"] < 40:
                if f["feature"] not in novel_features_list:
                    novel_features_list.append(f["feature"])
                    
            if risk_level in ["High", "Medium"]:
                pid = f["matched_patent_id"]
                if pid not in conflict_dict:
                    conflict_dict[pid] = {
                        "patent_id": pid,
                        "title": f["matched_title"],
                        "similarity_score": f["similarity_pct"],
                        "risk_level": risk_level,
                        "matched_features": [],
                        "explanation": eval_res.explanation
                    }
                if f["feature"] not in conflict_dict[pid]["matched_features"]:
                    conflict_dict[pid]["matched_features"].append(f["feature"])
                if f["similarity_pct"] > conflict_dict[pid]["similarity_score"]:
                    conflict_dict[pid]["similarity_score"] = f["similarity_pct"]
                if risk_level == "High":
                    conflict_dict[pid]["risk_level"] = "High"
            
        overall_score = total_score // len(features_data) if features_data else 0
        overall_risk = "High" if overall_score >= 70 else "Medium" if overall_score >= 40 else "Low"

        potential_conflicts_list = [PotentialConflict(**c) for c in conflict_dict.values()]

        return RiskAnalysisResponse(
            overall_score=overall_score,
            overall_risk=overall_risk,
            conflicts_identified=conflicts,
            novel_features=novel,
            heatmap_data=heatmap_data,
            potential_conflicts=potential_conflicts_list,
            technical_features=technical_features_list,
            novel_features_list=novel_features_list
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error during risk analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Risk analysis failed: {str(e)}")

# ==========================================
# Phase 5: Mitigation Recommendations
# ==========================================

class MitigationsRequest(BaseModel):
    features: List[FeatureRisk]

class MitigationStrategy(BaseModel):
    feature: str
    risk_level: str
    matched_patent: str
    why_it_is_risky: str
    recommended_mitigation: str
    suggested_design_around: str
    priority: str

class MitigationsResponse(BaseModel):
    success: bool
    mitigations: List[MitigationStrategy]

@app.post("/mitigations", response_model=MitigationsResponse)
async def mitigations_endpoint(input_data: MitigationsRequest):
    if not input_data.features:
        raise HTTPException(status_code=400, detail="No features provided for mitigation")

    try:
        # Prompt for LLM
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert patent strategist. Review the provided technical features and their identified conflict risks. For each feature, generate a practical mitigation strategy and a suggested technical design-around. Do NOT claim that your mitigation guarantees patentability or legal clearance. If a feature has Low risk, suggest monitoring/documentation instead of a major redesign. Do not invent details about the matched patent that are not present in the input."),
            ("user", "Features and Risks: {features_json}")
        ])
        
        # Prepare input for LLM
        eval_input = json.dumps([
            {
                "feature": f.feature,
                "risk_level": f.risk,
                "matched_patent": f.matched_patent_id,
                "explanation": f.explanation
            }
            for f in input_data.features
        ])
        
        class LLMMitigationList(BaseModel):
            mitigations: List[MitigationStrategy]

        structured_llm = llm.with_structured_output(LLMMitigationList)
        chain = prompt | structured_llm
        
        llm_result = chain.invoke({"features_json": eval_input})
        
        return MitigationsResponse(
            success=True,
            mitigations=llm_result.mitigations
        )
    except Exception as e:
        print(f"Error during mitigation generation: {str(e)}")
        raise HTTPException(status_code=500, detail="Mitigation generation failed")

# ==========================================
# Phase 6: What-If Simulator
# ==========================================

class WhatIfRequest(BaseModel):
    summary: str
    original_features: List[str]
    modified_features: List[str]

class WhatIfResponse(BaseModel):
    success: bool
    before_analysis: RiskAnalysisResponse
    after_analysis: RiskAnalysisResponse
    score_change: int
    ai_explanation: str

class LLMWhatIfExplanation(BaseModel):
    explanation: str

@app.post("/what-if", response_model=WhatIfResponse)
async def what_if_endpoint(input_data: WhatIfRequest):
    if not input_data.summary or len(input_data.summary.strip()) == 0:
        raise HTTPException(status_code=400, detail="Invention summary cannot be empty")
    if not input_data.original_features:
        raise HTTPException(status_code=400, detail="Original features are required")
    if not input_data.modified_features:
        raise HTTPException(status_code=400, detail="Modified features cannot be empty")

    try:
        # Run baseline risk analysis using existing function
        before_res = await risk_analysis_endpoint(RiskAnalysisRequest(
            summary=input_data.summary,
            technical_features=input_data.original_features
        ))
        
        # Run modified risk analysis using existing function
        after_res = await risk_analysis_endpoint(RiskAnalysisRequest(
            summary=input_data.summary,
            technical_features=input_data.modified_features
        ))

        score_change = after_res.overall_score - before_res.overall_score
        
        # Generate AI Explanation comparing the two
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert patent strategist. Compare the original technical features and their patent risk to the modified features and their new patent risk. Explain WHY the overall risk score changed (or stayed the same). Highlight specific technical differences that caused the shift based on the patent matches, without fabricating legal claims. Provide a clear, concise paragraph."),
            ("user", "Original Features & Risk: {before_json}\n\nModified Features & Risk: {after_json}")
        ])
        
        eval_before = json.dumps([{"feature": f.feature, "risk": f.risk, "matched_patent": f.matched_patent_id, "explanation": f.explanation} for f in before_res.heatmap_data])
        eval_after = json.dumps([{"feature": f.feature, "risk": f.risk, "matched_patent": f.matched_patent_id, "explanation": f.explanation} for f in after_res.heatmap_data])
        
        structured_llm = llm.with_structured_output(LLMWhatIfExplanation)
        chain = prompt | structured_llm
        
        llm_result = chain.invoke({
            "before_json": eval_before,
            "after_json": eval_after
        })
        
        ai_explanation = llm_result.explanation if llm_result else "AI explanation unavailable due to generation error."
        
        return WhatIfResponse(
            success=True,
            before_analysis=before_res,
            after_analysis=after_res,
            score_change=score_change,
            ai_explanation=ai_explanation
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error during what-if simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"What-If simulation failed: {str(e)}")

# ==========================================
# Phase 7: Innovation Mentor
# ==========================================

class ChatMessage(BaseModel):
    role: str
    content: str

class InnovationMentorRequest(BaseModel):
    summary: str
    features: List[str]
    question: str
    risk_analysis: dict = None
    history: List[ChatMessage] = []

class MentorImprovement(BaseModel):
    title: str
    description: str
    reason: str

class InnovationMentorResponse(BaseModel):
    answer: str
    key_points: List[str]
    suggested_improvements: List[MentorImprovement]
    next_questions: List[str]

@app.post("/innovation-mentor", response_model=InnovationMentorResponse)
async def innovation_mentor_endpoint(input_data: InnovationMentorRequest):
    if not input_data.summary or len(input_data.summary.strip()) == 0:
        raise HTTPException(status_code=400, detail="Invention summary cannot be empty")
    if not input_data.features:
        raise HTTPException(status_code=400, detail="Technical features are required")
    if not input_data.question or len(input_data.question.strip()) == 0:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        # Construct system prompt
        system_instruction = (
            "You are an expert AI technical innovation mentor helping inventors refine, differentiate, and explore technical approaches to their invention. "
            "You MUST understand the invention before answering, reference the user's actual features, give technically specific suggestions, and connect suggestions to identified risk when available. "
            "Do NOT behave like a generic chatbot. Avoid generic motivational answers. Never invent patent facts. "
            "CRITICAL LEGAL DIRECTIVE: Never claim that a design is legally non-infringing, and never guarantee patentability or novelty. "
            "Include a subtle disclaimer in your main answer like: 'This may help differentiate the technical implementation, but professional patent/legal review is recommended.'"
        )

        # Construct context
        context_str = f"INVENTION SUMMARY:\n{input_data.summary}\n\nTECHNICAL FEATURES:\n" + "\n".join([f"- {f}" for f in input_data.features])
        if input_data.risk_analysis:
            context_str += f"\n\nRISK ANALYSIS CONTEXT:\n{json.dumps(input_data.risk_analysis, indent=2)}"
            
        # Escape curly braces to prevent ChatPromptTemplate from interpreting them as format variables
        context_str = context_str.replace("{", "{{").replace("}", "}}")
        safe_question = input_data.question.replace("{", "{{").replace("}", "}}")
            
        messages = [
            ("system", system_instruction),
            ("user", f"Here is the context of my current invention:\n\n{context_str}\n\nPlease keep this context in mind for all our discussions.")
        ]
        
        # Add history
        for msg in input_data.history:
            safe_content = msg.content.replace("{", "{{").replace("}", "}}")
            messages.append((msg.role, safe_content))
            
        # Add current question
        messages.append(("user", safe_question))
        
        prompt = ChatPromptTemplate.from_messages(messages)
        structured_llm = llm.with_structured_output(InnovationMentorResponse)
        chain = prompt | structured_llm
        
        llm_result = chain.invoke({})
        
        if not llm_result:
            raise Exception("AI failed to generate a structured response.")
            
        return llm_result
        
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error during innovation mentor chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Mentor AI failed: {str(e)}")

# ==========================================
# Phase 8: Patent Landscape
# ==========================================

class LandscapeRequest(BaseModel):
    query: str = ""
    k: int = 50  # how many patents to pull from FAISS for the landscape

class LandscapePoint(BaseModel):
    patent_id: str
    title: str
    abstract: str
    x: float
    y: float
    similarity: float
    risk: str
    density: str        # "High" | "Medium" | "Low"
    density_score: int  # 0-100, higher = more crowded

class LandscapeOpportunity(BaseModel):
    title: str
    reason: str
    density: str
    center_x: float
    center_y: float

class LandscapeResponse(BaseModel):
    success: bool
    total: int
    points: List[LandscapePoint]
    opportunities: List[LandscapeOpportunity]

@app.post("/patent-landscape", response_model=LandscapeResponse)
async def patent_landscape_endpoint(input_data: LandscapeRequest):
    """
    Returns 2D PCA-projected patent points from the FAISS index.
    If a query is provided, it retrieves the k most similar patents and embeds them
    in the context of the full index projection for accurate positioning.
    If no query, it projects a random sample of the dataset.
    No LLM calls. Pure FAISS + sklearn PCA + nearest-neighbour density.
    """
    try:
        from sklearn.decomposition import PCA

        if 'model' not in globals() or 'index' not in globals() or 'df' not in globals():
            raise Exception("FAISS index or SentenceTransformer model not loaded.")

        n_total = index.ntotal  # 500

        # --- Step 1: Reconstruct ALL raw vectors from FAISS IndexFlatL2 ---
        all_vecs = index.reconstruct_n(0, n_total)  # shape: (500, 384)

        # --- Step 2: PCA to 2D over ALL vectors for stable coordinate space ---
        pca = PCA(n_components=2, random_state=42)
        coords_2d = pca.fit_transform(all_vecs)  # shape: (500, 2)

        # --- Step 3: Determine which indices to include in the output ---
        if input_data.query and len(input_data.query.strip()) > 0:
            query_vec = model.encode([input_data.query])
            k = min(input_data.k, n_total)
            D, I = index.search(np.array(query_vec, dtype=np.float32), k=k)
            selected_indices = I[0].tolist()
            distances = D[0].tolist()
        else:
            # Default: show a representative spread — every Nth patent
            k = min(input_data.k, n_total)
            step = max(1, n_total // k)
            selected_indices = list(range(0, n_total, step))[:k]
            distances = [1.0] * len(selected_indices)  # No query-based distance

        # --- Step 4: Calculate local density for each selected point ---
        # Density = number of OTHER selected points within a radius in 2D PCA space
        selected_coords = coords_2d[selected_indices]  # shape: (k, 2)

        # Normalise coordinates to [-1, 1]
        x_min, x_max = coords_2d[:, 0].min(), coords_2d[:, 0].max()
        y_min, y_max = coords_2d[:, 1].min(), coords_2d[:, 1].max()

        def norm_x(v):
            return round(float((v - x_min) / (x_max - x_min + 1e-9) * 2 - 1), 4)
        def norm_y(v):
            return round(float((v - y_min) / (y_max - y_min + 1e-9) * 2 - 1), 4)

        # Radius in normalised space for density counting
        radius = 0.3
        density_counts = []
        norm_coords = np.array([[norm_x(c[0]), norm_y(c[1])] for c in selected_coords])

        for i, nc in enumerate(norm_coords):
            diffs = norm_coords - nc
            dists = np.sqrt((diffs ** 2).sum(axis=1))
            neighbours = int((dists < radius).sum()) - 1  # exclude self
            density_counts.append(max(0, neighbours))

        max_density = max(density_counts) if density_counts else 1
        max_density = max(max_density, 1)

        # --- Step 5: Build response points ---
        points = []
        for i, (idx, dist) in enumerate(zip(selected_indices, distances)):
            row = df.iloc[idx]
            sim_float = 1 / (1 + dist) if dist > 0 else 1.0
            sim_pct = round(sim_float, 3)

            if sim_pct >= 0.8:
                risk = "High"
            elif sim_pct >= 0.6:
                risk = "Medium"
            else:
                risk = "Low"

            dc = density_counts[i]
            density_score = int(dc / max_density * 100)
            if density_score >= 60:
                density_label = "High"
            elif density_score >= 30:
                density_label = "Medium"
            else:
                density_label = "Low"

            points.append(LandscapePoint(
                patent_id=str(row['publication_number']),
                title=str(row['title']),
                abstract=str(row['abstract'])[:300],
                x=norm_x(selected_coords[i][0]),
                y=norm_y(selected_coords[i][1]),
                similarity=sim_pct,
                risk=risk,
                density=density_label,
                density_score=density_score
            ))

        # --- Step 6: Identify Opportunity Zones (low-density regions) ---
        # Find points with the lowest density score — cluster them into 2-3 zones
        sorted_by_density = sorted(points, key=lambda p: p.density_score)
        low_density_points = [p for p in sorted_by_density if p.density == "Low"]

        opportunities = []
        seen_regions = set()
        for p in low_density_points:
            # Bucket into a coarse grid cell to avoid duplicate nearby opportunities
            cell = (round(p.x, 1), round(p.y, 1))
            if cell not in seen_regions:
                seen_regions.add(cell)
                opportunities.append(LandscapeOpportunity(
                    title=p.title[:80],
                    reason=f"Lower patent density in this technical region (density score: {p.density_score}/100). "
                           f"Fewer semantically similar patents were found near this area, suggesting relatively "
                           f"less explored technical ground. Professional IP review is recommended before drawing conclusions.",
                    density="Low",
                    center_x=p.x,
                    center_y=p.y
                ))
            if len(opportunities) >= 3:
                break

        return LandscapeResponse(
            success=True,
            total=len(points),
            points=points,
            opportunities=opportunities
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error during patent landscape: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Patent landscape failed: {str(e)}")

# ==========================================
# Phase 9: Draft Assistant
# ==========================================

class DraftRequest(BaseModel):
    summary: str
    features: List[str]
    risk_data: dict = None
    mitigations: list = None
    landscape_context: dict = None
    mentor_context: dict = None

class DraftResponse(BaseModel):
    title: str
    technical_field: str
    background: str
    problem_statement: str
    summary_of_invention: str
    detailed_description: str
    key_features: List[str]
    independent_claim: str
    dependent_claims: List[str]
    abstract: str
    novelty_points: List[str]

@app.post("/draft-assistant", response_model=DraftResponse)
async def draft_assistant_endpoint(input_data: DraftRequest):
    if not input_data.summary or len(input_data.summary.strip()) == 0:
        raise HTTPException(status_code=400, detail="Invention summary cannot be empty")
    if not input_data.features:
        raise HTTPException(status_code=400, detail="Technical features are required for drafting")

    try:
        # Build context string for the LLM
        features_str = "\n".join([f"- {f}" for f in input_data.features])
        context_parts = [
            f"INVENTION SUMMARY:\n{input_data.summary}",
            f"TECHNICAL FEATURES:\n{features_str}"
        ]
        if input_data.risk_data:
            context_parts.append(f"RISK ANALYSIS CONTEXT:\n{json.dumps(input_data.risk_data)}")
        if input_data.mitigations:
            context_parts.append(f"RECOMMENDED MITIGATIONS:\n{json.dumps(input_data.mitigations)}")
        if input_data.landscape_context:
            context_parts.append(f"PATENT LANDSCAPE CONTEXT:\n{json.dumps(input_data.landscape_context)}")
        if input_data.mentor_context:
            context_parts.append(f"INNOVATION MENTOR CONTEXT:\n{json.dumps(input_data.mentor_context)}")

        context_str = "\n\n".join(context_parts)

        system_prompt = (
            "You are an expert AI patent drafting assistant helping inventors create a preliminary, "
            "structured patent application draft based on their invention details. "
            "Your job is to translate the technical invention into proper patent application sections. "
            "CRITICAL LEGAL RULES: "
            "1. NEVER state that the invention IS patentable or legally novel — use 'potential novelty consideration' or 'potential distinguishing feature'. "
            "2. NEVER guarantee non-infringement or legal clearance. "
            "3. Always include a disclaimer that this is an AI-assisted PRELIMINARY DRAFT requiring professional patent attorney review. "
            "4. Write claims in proper patent claim format ('A system comprising...', 'The system of claim 1, wherein...'). "
            "5. Do not invent technical facts not present in the provided context. "
            "Use clear, precise technical language appropriate for a patent application."
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "Please create a structured preliminary patent application draft based on the following invention context:\n\n{context_str}\n\nGenerate all required patent sections.")
        ])

        structured_llm = llm.with_structured_output(DraftResponse)
        chain = prompt | structured_llm
        result = chain.invoke({"context_str": context_str})

        if not result:
            raise Exception("AI failed to generate the patent draft.")

        return result

    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error during draft generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Draft generation failed: {str(e)}")

# ==========================================
# Phase 10: IP Monitoring
# ==========================================
import uuid
import datetime

MONITORS_FILE = "monitors.json"
ALERTS_FILE = "alerts.json"

def load_monitors():
    if os.path.exists(MONITORS_FILE):
        try:
            with open(MONITORS_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_monitors(monitors):
    with open(MONITORS_FILE, 'w') as f:
        json.dump(monitors, f, indent=2)

def load_alerts():
    if os.path.exists(ALERTS_FILE):
        try:
            with open(ALERTS_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_alerts(alerts):
    with open(ALERTS_FILE, 'w') as f:
        json.dump(alerts, f, indent=2)

class MonitorCreateRequest(BaseModel):
    title: str
    summary: str
    features: List[str]
    keywords: List[str] = []
    risk_score: str = None

class MonitorMatch(BaseModel):
    publication_number: str
    title: str
    similarity: int
    risk: str
    matching_features: List[str]
    abstract: str

class MonitorCheckResult(BaseModel):
    new_matches: List[MonitorMatch]
    risk_changes: List[MonitorMatch]
    unchanged: List[MonitorMatch]

class MonitorResponse(BaseModel):
    id: str
    title: str
    summary: str
    features: List[str]
    keywords: List[str]
    created_at: str
    last_checked: str
    status: str
    highest_risk: str
    matches_count: int
    matches: List[MonitorMatch]

# Alerts Models
class AlertResponse(BaseModel):
    id: str
    analysis_id: str = None # Included if we can deduce it or if passed
    monitor_id: str
    type: str # new_match, risk_increase, new_high_risk, monitoring_update
    severity: str # high, medium, low, info
    title: str
    message: str
    patent_id: str = None
    patent_title: str = None
    similarity: float = None
    invention_name: str
    created_at: str
    read: bool

@app.post("/monitor", response_model=MonitorResponse)
async def create_monitor(request: MonitorCreateRequest):
    if not request.summary or not request.features:
        raise HTTPException(status_code=400, detail="Summary and features are required.")
        
    monitors = load_monitors()
    new_monitor = {
        "id": str(uuid.uuid4()),
        "title": request.title or "Untitled Invention",
        "summary": request.summary,
        "features": request.features,
        "keywords": request.keywords,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "last_checked": "",
        "status": "Active",
        "highest_risk": "None",
        "matches_count": 0,
        "matches": []
    }
    monitors.append(new_monitor)
    save_monitors(monitors)
    return new_monitor

@app.get("/monitors", response_model=List[MonitorResponse])
async def get_monitors():
    return load_monitors()

@app.get("/monitors/{monitor_id}", response_model=MonitorResponse)
async def get_monitor(monitor_id: str):
    monitors = load_monitors()
    for m in monitors:
        if m["id"] == monitor_id:
            return m
    raise HTTPException(status_code=404, detail="Monitor not found")

@app.delete("/monitors/{monitor_id}")
async def delete_monitor(monitor_id: str):
    monitors = load_monitors()
    new_monitors = [m for m in monitors if m["id"] != monitor_id]
    if len(monitors) == len(new_monitors):
        raise HTTPException(status_code=404, detail="Monitor not found")
    save_monitors(new_monitors)
    return {"status": "deleted"}

@app.post("/monitors/{monitor_id}/check", response_model=MonitorCheckResult)
async def check_monitor(monitor_id: str):
    monitors = load_monitors()
    target_idx = -1
    for i, m in enumerate(monitors):
        if m["id"] == monitor_id:
            target_idx = i
            break
            
    if target_idx == -1:
        raise HTTPException(status_code=404, detail="Monitor not found")
        
    monitor = monitors[target_idx]
    
    # 1. Perform semantic search using summary and features
    search_query = monitor["summary"] + " " + " ".join(monitor["features"])
    
    try:
        if 'model' not in globals() or 'index' not in globals() or 'df' not in globals():
             raise Exception("FAISS index or model not loaded")
             
        query_vec = model.encode([search_query])
        D, I = index.search(np.array(query_vec), k=10) # check top 10
        
        current_matches = []
        for dist, idx in zip(D[0], I[0]):
            similarity_float = 1 / (1 + dist)
            similarity_pct = int(round(similarity_float * 100))
            
            if similarity_pct >= 85:
                risk = "High"
            elif similarity_pct >= 70:
                risk = "Medium"
            else:
                risk = "Low"
                
            row = df.iloc[idx]
            
            # naive matching features extraction based on keyword presence
            abstract = str(row['abstract'])
            title = str(row['title'])
            matched_features = []
            combined_text = (title + " " + abstract).lower()
            for f in monitor["features"]:
                # simple word overlap or full string inclusion
                if f.lower() in combined_text:
                    matched_features.append(f)
                    
            if not matched_features:
                 matched_features.append("Conceptual similarity detected")
            
            current_matches.append({
                "publication_number": str(row['publication_number']),
                "title": title,
                "similarity": similarity_pct,
                "risk": risk,
                "matching_features": matched_features,
                "abstract": abstract
            })
            
    except Exception as e:
        print(f"Monitoring search error: {e}")
        raise HTTPException(status_code=500, detail="Search infrastructure failed")

    # 2. Compare against previous results
    previous_matches = monitor.get("matches", [])
    prev_map = {m["publication_number"]: m for m in previous_matches}
    
    new_matches = []
    risk_changes = []
    unchanged = []
    
    for cm in current_matches:
        pub_num = cm["publication_number"]
        if pub_num not in prev_map:
            new_matches.append(cm)
        else:
            pm = prev_map[pub_num]
            if cm["risk"] != pm["risk"] or cm["similarity"] > pm["similarity"] + 5: # threshold for change
                risk_changes.append(cm)
            else:
                unchanged.append(cm)
                
    # 3. Update monitor state
    monitor["matches"] = current_matches
    monitor["last_checked"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    monitor["matches_count"] = len(current_matches)
    
    highest = "Low"
    if any(m["risk"] == "High" for m in current_matches):
        highest = "High"
    elif any(m["risk"] == "Medium" for m in current_matches):
        highest = "Medium"
        
    monitor["highest_risk"] = highest
    
    monitors[target_idx] = monitor
    save_monitors(monitors)
    
    # 4. Generate Alerts
    alerts = load_alerts()
    for cm in new_matches:
        severity = "high" if cm["risk"] == "High" else ("medium" if cm["risk"] == "Medium" else "low")
        alerts.append({
            "id": str(uuid.uuid4()),
            "monitor_id": monitor["id"],
            "type": "new_match",
            "severity": severity,
            "title": f"New {cm['risk']}-Risk Patent Match",
            "message": "Potentially relevant patent detected. Requires professional IP review.",
            "patent_id": cm["publication_number"],
            "patent_title": cm["title"],
            "similarity": cm["similarity"],
            "invention_name": monitor["title"],
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "read": False
        })
        
    for cm in risk_changes:
        severity = "high" if cm["risk"] == "High" else "medium"
        alerts.append({
            "id": str(uuid.uuid4()),
            "monitor_id": monitor["id"],
            "type": "risk_increase",
            "severity": severity,
            "title": "Patent Risk Increased",
            "message": f"Similarity or risk profile increased to {cm['risk']}.",
            "patent_id": cm["publication_number"],
            "patent_title": cm["title"],
            "similarity": cm["similarity"],
            "invention_name": monitor["title"],
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "read": False
        })
        
    if new_matches or risk_changes:
        save_alerts(alerts)
    
    return MonitorCheckResult(
        new_matches=new_matches,
        risk_changes=risk_changes,
        unchanged=unchanged
    )

@app.get("/")
def root():
    return {"status": "IPSentinel AI backend running"}

# ==========================================
# Alerts Endpoints
# ==========================================
@app.get("/alerts", response_model=List[AlertResponse])
async def get_alerts():
    return load_alerts()

@app.get("/alerts/unread")
async def get_unread_alerts():
    alerts = load_alerts()
    unread_count = sum(1 for a in alerts if not a.get("read", False))
    return {"unread_count": unread_count}

@app.post("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: str):
    alerts = load_alerts()
    for a in alerts:
        if a["id"] == alert_id:
            a["read"] = True
            break
    save_alerts(alerts)
    return {"status": "success"}

@app.post("/alerts/read-all")
async def mark_all_alerts_read():
    alerts = load_alerts()
    for a in alerts:
        a["read"] = True
    save_alerts(alerts)
    return {"status": "success"}

@app.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    alerts = load_alerts()
    alerts = [a for a in alerts if a["id"] != alert_id]
    save_alerts(alerts)
    return {"status": "success"}