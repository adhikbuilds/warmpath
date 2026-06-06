"""
WarmPath Intelligence Service FastAPI

Pure AI/intelligence microservice. Handles LLM generation, signal scoring,
graph pathfinding, enrichment, and classification.

All routes require X-Service-Secret header (shared secret auth).
"""

import logging
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import init_db
from routers import agents, auth, classify, discovery, enrich, graph, scoring, sequences, signals

# ─── Logging setup ────────────────────────────────────────────────────────────
# Single-line JSON so Azure Log Analytics parses each line as a record.

logging.basicConfig(
    level=logging.INFO,
    format='{"ts":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":%(message)s}',
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("warmpath")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info('"intelligence service started"')
    yield
    logger.info('"intelligence service shutting down"')


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


# ─── Request logging middleware ───────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.monotonic()
    response = await call_next(request)
    duration_ms = round((time.monotonic() - start) * 1000)
    level = logging.WARNING if response.status_code >= 400 else logging.INFO
    logger.log(
        level,
        '"%(method)s %(path)s %(status)s %(duration_ms)sms"' % {
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    return response


# ─── Shared secret auth middleware ────────────────────────────────────────────

SERVICE_SECRET = os.getenv("INTELLIGENCE_SERVICE_SECRET", "")

PUBLIC_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}


@app.middleware("http")
async def require_service_secret(request: Request, call_next):
    if request.url.path in PUBLIC_PATHS:
        return await call_next(request)
    if SERVICE_SECRET:
        provided = request.headers.get("X-Service-Secret", "")
        if provided != SERVICE_SECRET:
            logger.warning(
                '"Unauthorized request path=%s ip=%s"',
                request.url.path,
                request.client.host if request.client else "unknown",
            )
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
    ai_provider = os.getenv("AI_PROVIDER", "azure_openai")
    azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    return {
        "status": "ok",
        "service": "warmpath-intelligence",
        "version": "0.3.0",
        "ai_provider": ai_provider,
        "azure_openai_configured": bool(azure_endpoint),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8001")), reload=True)
