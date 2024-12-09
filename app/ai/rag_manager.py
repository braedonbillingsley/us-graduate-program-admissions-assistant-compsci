from typing import Dict, List, Optional
from app.ai.vector_store import VectorStore
from app.ai.llm import LLMService

class RAGManager:
    def __init__(self):
        self.vector_store = VectorStore()
        self.llm_service = LLMService()
        
    async def initialize(self):
        """Initialize the RAG system"""
        await self.vector_store.initialize()
        
    async def get_rag_response(
        self,
        query: str,
        conversation_context: Optional[List[Dict]] = None,
        n_results: int = 5
    ) -> Dict:
        """Get RAG-enhanced response"""
        try:
            # Search for relevant programs
            matches = await self.vector_store.search_similar(
                query=query,
                n_results=n_results
            )
            
            # Extract program information
            relevant_programs = []
            context_texts = []
            
            for match in matches:
                metadata = match["metadata"]
                relevant_programs.append({
                    "name": metadata.get("name", "Unknown Program"),
                    "university": metadata.get("university", "Unknown University"),
                    "department": metadata.get("department", "Unknown Department"),
                    "similarity": match.get("similarity", None)
                })
                context_texts.append(match["document"])
                
            # Create context for LLM
            context = "\n\n".join(context_texts) if context_texts else ""
            
            # Generate response using LLM with context
            messages = conversation_context or []
            messages.append({"role": "user", "content": query})
            
            response = await self.llm_service.generate_response(
                messages=messages,
                context=context
            )
            
            return {
                "response": response,
                "relevant_programs": relevant_programs,
                "context": context
            }
            
        except Exception as e:
            print(f"Error in RAG response generation: {str(e)}")
            raise