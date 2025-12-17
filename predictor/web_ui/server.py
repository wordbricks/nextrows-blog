import os
import sys

# Add the parent directory to sys.path so we can import crawl_predictor
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from crawl_predictor.main import analyze
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Crawl Predictor UI")

# Allow CORS for development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class URLRequest(BaseModel):
    url: str

class AnalyzeResponse(BaseModel):
    results: dict

@app.post("/api/analyze")
def analyze_url(request: URLRequest):
    try:
        # Run the synchronous analyze function
        # In a real heavy-load production app, we might run this in a threadpool,
        # but for a local UI, direct call is fine as Playwright does its own async handling internally usually,
        # though here 'analyze' is likely synchronous wrapper.
        results = analyze(request.url)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount static files
app.mount("/", StaticFiles(directory="web_ui/static", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("web_ui.server:app", host="0.0.0.0", port=8000, reload=True)
