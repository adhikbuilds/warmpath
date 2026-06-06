"""
WarmPath Intelligence Service FastAPI

Pure AI/intelligence microservice. Handles LLM generation, signal scoring,
graph pathfinding, enrichment, and classification.

All routes require X-Service-Secret header (shared secret auth).
No database — stateless. Data CRUD is owned by Next.js/Prisma.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import init_db
from routers import agents, auth, classify, discovery, enrich, graph, scoring, sequences, signals


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("WarmPath intelligence service started")
    yield
    print("WarmPath intelligence service shutting down")


app = FastAPI(
    title="WarmPath Intelligence Service",
    version="0.3.0",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Shared secret auth middleware ────────────────────────────────────────────

SERVICE_SECRET = os.getenv("INTELLIGENCE_SERVICE_SECRET", "")


@app.middleware("http")
async def require_service_secret(request: Request, call_next):
    if request.url.path in ("/health", "/docs", "/openapi.json"):
        return await call_next(request)
    if SERVICE_SECRET:
        provided = request.headers.get("X-Service-Secret", "")
        if provided != SERVICE_SECRET:
            return JSONResponse({"error": "Unauthorized"}, status_code=401)
    return await call_next(request)


# ─── Intelligence routers ─────────────────────────────────────────────────────

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(agents.router, prefix="/agents", tags=["agents"])
app.include_router(signals.router, prefix="/signals", tags=["signals"])
app.include_router(graph.router, prefix="/graph", tags=["graph"])
app.include_router(enrich.router, prefix="/enrich", tags=["enrich"])
app.include_router(scoring.router, prefix="/scoring", tags=["scoring"])
app.include_router(sequences.router, prefix="/sequences", tags=["sequences"])
app.include_router(classify.router, prefix="/classify", tags=["classify"])
app.include_router(discovery.router, prefix="/discovery", tags=["discovery"])


# ─── Health ───────────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    return {"status": "ok", "service": "warmpath-intelligence", "version": "0.3.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8001")), reload=True)
