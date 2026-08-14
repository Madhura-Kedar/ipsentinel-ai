from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
import json
import os

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# --- Load everything once at startup ---
print("Loading model + index...")
model = SentenceTransformer('all-MiniLM-L6-v2')
index = faiss.read_index('patent_index.faiss')
df = pd.read_pickle('patents_df.pkl')

genai.configure(api_key=os.environ.get('GOOGLE_API_KEY'))
model_g = genai.GenerativeModel('gemini-2.5-flash')
print("Ready.")

class IdeaInput(BaseModel):
    text: str

def analyze_invention(user_text, k=5):
    # ---- Step 1: Extract features ----
    extract_prompt = f"""Extract from this invention description:
1. Core technical concept (1 sentence)
2. Key features (bullet list, max 5)

Return ONLY valid JSON, no markdown, no explanation, in this exact format:
{{"concept": "...", "features": ["...", "...", "..."]}}

Invention: {user_text}"""

    extract_response = model_g.generate_content(extract_prompt)
    extract_text = extract_response.text.strip().replace("```json", "").replace("```", "").strip()
    try:
        extraction = json.loads(extract_text)
    except:
        extraction = {"concept": extract_text, "features": []}

    # ---- Step 2: Similarity search ----
    query_vec = model.encode([user_text])
    D, I = index.search(np.array(query_vec), k=k)

    matches = []
    for dist, idx in zip(D[0], I[0]):
        similarity = 1 / (1 + dist)
        matches.append({
            "title": df.iloc[idx]['title'],
            "abstract": df.iloc[idx]['abstract'][:300],
            "similarity": round(float(similarity), 2)
        })

    # ---- Step 3: Risk analysis + suggestions ----
    top_matches_text = "\n".join([f"- {m['title']}: {m['abstract']}" for m in matches[:3]])

    risk_prompt = f"""Invention: {user_text}

Similar existing patents:
{top_matches_text}

For each of the 3 patents above, rate conflict risk as High/Medium/Low and give a 1-sentence reason.
Then suggest 2 concrete ways to differentiate this invention from existing ones.

Return ONLY valid JSON, no markdown, in this exact format:
{{"risks": [{{"title": "...", "level": "...", "reason": "..."}}], "suggestions": ["...", "..."]}}"""

    risk_response = model_g.generate_content(risk_prompt)
    risk_text = risk_response.text.strip().replace("```json", "").replace("```", "").strip()
    try:
        risk_analysis = json.loads(risk_text)
    except:
        risk_analysis = {"risks": [], "suggestions": [risk_text]}

    return {
        "extraction": extraction,
        "matches": matches,
        "risk_analysis": risk_analysis
    }

@app.post("/analyze")
def analyze(input: IdeaInput):
    return analyze_invention(input.text)

@app.get("/")
def root():
    return {"status": "IPSentinel AI backend running"}