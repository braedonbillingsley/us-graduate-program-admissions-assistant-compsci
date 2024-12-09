from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import json
from sqlalchemy.orm import Session

from app.ai.rag_manager import RAGManager
from app.ai.llm import LLMService
from app.ai.context import ConversationManager
from app.database import get_db

router = APIRouter()
rag_manager = RAGManager()
conversation_manager = ConversationManager()
llm_service = LLMService()

class ChatMessage(BaseModel):
    content: str
    conversation_id: Optional[str] = None

class ProgramQuery(BaseModel):
    background: str = Field(..., description="Student's academic and professional background")
    interests: List[str] = Field(..., description="List of academic/research interests")
    locations: List[str] = Field(..., description="Preferred geographic locations")
    degree_type: str = Field(..., description="Desired degree type (e.g., MS, PhD)")
    research_areas: List[str] = Field(..., description="Specific research areas of interest")

async def format_student_profile(query: ProgramQuery) -> Dict:
    """Format student profile for LLM consumption"""
    return {
        "background": query.background,
        "interests": query.interests,
        "locations": query.locations,
        "degree_type": query.degree_type,
        "research_areas": query.research_areas
    }

@router.post("/recommend")
async def recommend_programs(query: ProgramQuery, db: Session = Depends(get_db)):
    """Generate personalized program recommendations"""
    try:
        # Format student profile
        student_profile = await format_student_profile(query)
        
        # Create search query for RAG
        search_query = f"""
        Student background: {query.background}
        Interests: {', '.join(query.interests)}
        Preferred locations: {', '.join(query.locations)}
        Degree type: {query.degree_type}
        Research areas: {', '.join(query.research_areas)}
        """
        
        # Get relevant programs using RAG
        rag_response = await rag_manager.get_rag_response(
            query=search_query,
            n_results=10
        )
        
        # Generate personalized recommendations using LLM
        recommendations = await llm_service.generate_program_recommendation(
            student_profile=student_profile,
            matching_programs=rag_response.get("relevant_programs", [])
        )
        
        # Structure the response
        response = {
            "recommendations": recommendations,
            "matching_programs": rag_response.get("relevant_programs", []),
            "metadata": {
                "timestamp": datetime.utcnow().isoformat(),
                "query_parameters": student_profile
            }
        }
        
        return response
        
    except Exception as e:
        error_msg = f"Error generating recommendations: {str(e)}"
        print(f"Error details: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/message")
async def chat_message(message: ChatMessage, db: Session = Depends(get_db)):
    """Handle chat messages with RAG and LLM integration"""
    try:
        # Get or create conversation context
        conversation_id = message.conversation_id or str(uuid.uuid4())
        context = await conversation_manager.get_context(conversation_id)
        if not context:
            context = await conversation_manager.create_conversation(conversation_id)
        
        # Get RAG-enhanced context
        rag_response = await rag_manager.get_rag_response(
            query=message.content,
            conversation_context=context.get('history', [])
        )
        
        # Generate LLM response with RAG context
        messages = [{"role": "user", "content": message.content}]
        llm_response = await llm_service.generate_response(
            messages=messages,
            context=rag_response.get("context")
        )
        
        # Update conversation history
        await conversation_manager.add_message(
            conversation_id,
            {"role": "user", "content": message.content}
        )
        await conversation_manager.add_message(
            conversation_id,
            {"role": "assistant", "content": llm_response}
        )
        
        return {
            "conversation_id": conversation_id,
            "response": llm_response,
            "relevant_programs": rag_response.get("relevant_programs", [])
        }
        
    except Exception as e:
        error_msg = f"Chat error: {str(e)}"
        print(f"Error details: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)