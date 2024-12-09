from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager

from app.data.program_pipeline import ProgramDataPipeline
from app.config import settings
from app.routers import programs, chat
from app.database import create_db_and_tables
from app.ai.rag_manager import RAGManager
from app.ai.vector_store import VectorStore
from app.ai.llm import LLMService

# Initialize services
vector_store = VectorStore()
rag_manager = RAGManager()
llm_service = LLMService()
program_pipeline = ProgramDataPipeline(vector_store)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start program data update task
    update_task = asyncio.create_task(program_pipeline.schedule_updates(interval_hours=24))
    print("🔄 Started program data update scheduler")
    
    yield  # Run the application
    
    # Cancel update task on shutdown
    update_task.cancel()
    try:
        await update_task
    except asyncio.CancelledError:
        pass
    print("✅ Stopped program data updates")

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Graduate Program Admissions Assistant",
    description="AI-powered graduate program recommendations and assistance",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_path = Path(__file__).parent / "static"
if not static_path.exists():
    static_path.mkdir(parents=True)
app.mount("/static", StaticFiles(directory=static_path), name="static")

# Include routers with prefixes
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(programs.router, prefix="/api/programs", tags=["programs"])

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.0.0"}

# Redirect root to static index.html
@app.get("/")
async def root():
    index_path = static_path / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="index.html not found")
    return FileResponse(index_path)

@app.on_event("startup")
async def startup_event():
    """Initialize all services on startup"""
    try:
        print("🚀 Starting service initialization...")
        
        # Initialize database
        print("Initializing database...")
        create_db_and_tables()
        print("✅ Database initialized")
        
        # Initialize vector store
        print("Initializing vector store...")
        await vector_store.initialize()
        print("✅ Vector store initialized")
        
        # Initialize RAG manager
        print("Initializing RAG system...")
        await rag_manager.initialize()
        print("✅ RAG system initialized")
        
        # Perform initial program data update
        print("Fetching initial program data...")
        await program_pipeline.update_program_database()
        print("✅ Program data initialized")
        
        # Verify LLM service configuration
        print("Verifying LLM service...")
        if not os.getenv("GROQ_API_KEY"):
            raise ValueError("GROQ_API_KEY environment variable not set")
        print("✅ LLM service verified")
        
        print("✅ All services initialized successfully")
        
    except Exception as e:
        error_msg = f"❌ Error during initialization: {str(e)}"
        print(error_msg)
        # Log the full error for debugging
        import traceback
        print("Detailed error:")
        print(traceback.format_exc())
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        print("🛑 Shutting down services...")
        # Add any cleanup code here if needed
        print("✅ Shutdown complete")
    except Exception as e:
        print(f"❌ Error during shutdown: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )