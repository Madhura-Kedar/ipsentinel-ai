# IPSentinel AI

IPSentinel AI is a modern IP intelligence platform featuring AI-powered invention analysis, real-time patent searching, semantic risk analysis, and comprehensive innovation monitoring.

## Requirements

- Python 3.10+
- Node.js 18+
- Git
- Google Gemini API Key

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ipsentinel-ai
```

### 2. Backend Setup
Create a Python virtual environment and activate it:
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

Install the required Python dependencies:
```bash
pip install -r requirements.txt
```

Configure environment variables:
```bash
# Copy the example environment file
# Windows:
copy .env.example .env
# macOS/Linux:
cp .env.example .env
```
Open `.env` and add your Gemini API Key: `GOOGLE_API_KEY=your_key_here`

Start the FastAPI backend:
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
Open a new terminal window/tab:
```bash
cd ipsentinel-ai/ipsentinel-frontend
npm install
npm run dev
```

Open the displayed Vite URL (normally `http://localhost:5173`) in your browser to access the dashboard.

## Architecture Overview
The application consists of a **React/Vite** frontend that communicates with a **FastAPI** backend via REST APIs. 

The backend leverages:
- **FAISS & Sentence Transformers**: Local vector indexing for millisecond-speed semantic similarity searches against the patent database.
- **Local Patent Dataset**: A curated dataset of patents used for the core search features.
- **LangChain & Google Gemini**: Used for intelligent invention analysis, claim drafting, risk explanations, and the Innovation Mentor chatbot.

## Main Features

1. **AI Understanding / Invention Analysis**: Extracts technical features, keywords, and summaries from plain text descriptions.
2. **IP Search**: Standard keyword/boolean search across patents, trademarks, and copyrights.
3. **Semantic Search**: Concept-based search that finds conceptually similar patents even if keywords differ.
4. **Risk Analysis**: Evaluates an invention against existing patents and assigns a risk score with specific feature conflict mapping.
5. **AI Mitigation Recommendations**: Suggests design-arounds to bypass identified high-risk patents.
6. **What-If Simulator**: Allows users to tweak their invention features to see how it affects the risk score in real-time.
7. **Innovation Mentor**: An interactive AI chat assistant that provides technical insights and guides users through the IP process.
8. **Patent Landscape**: Visualizes the technology domain, highlighting saturation levels and white-space opportunities.
9. **Draft Assistant**: Generates structured preliminary patent claims based on the invention.
10. **IP Monitoring**: Tracks specific inventions over time and alerts users to new potentially conflicting patents.
11. **IP Intelligence Reports**: Generates downloadable JSON reports covering risk, mitigations, and semantic overlap.
12. **Analysis History / Dashboard**: A central hub to track all previously analyzed inventions.
13. **Notifications / Risk Alerts**: A comprehensive alert system for high-risk matches.

## Disclaimer

- **Local Datasets**: The patent dataset is bundled locally for rapid semantic querying.
- **Synthetic Data**: The Trademark and Copyright demo datasets are synthetic and designed exclusively for demonstration purposes; they do not represent official USPTO or Copyright Office records.
- **Informational Use Only**: The AI-generated analysis, risk scores, and claim drafts are informational and **do not constitute legal advice**. Always consult a registered patent attorney for legal opinions.
