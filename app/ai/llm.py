import os
from groq import Groq
from typing import List, Dict, Optional

class LLMService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        self.client = Groq(api_key=api_key)
        self.model = "mixtral-8x7b-32768"

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        context: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        """
        Generate a response using the Groq LLM.
        
        Args:
            messages: List of conversation messages
            context: Optional RAG context to include
            temperature: Controls randomness in generation
        """
        try:
            # Prepare system message with context if provided
            system_message = {
                "role": "system",
                "content": f"""You are a graduate program admissions assistant. 
                Your goal is to help students find and apply to suitable graduate programs.
                {f'Use this context when relevant: {context}' if context else ''}
                
                Guidelines:
                - Provide specific, actionable advice
                - Be clear about admission requirements and deadlines
                - If unsure about specific details, say so
                - Maintain a professional but encouraging tone"""
            }

            # Generate completion
            chat_completion = self.client.chat.completions.create(
                messages=[system_message] + messages,
                model=self.model,
                temperature=temperature,
                max_tokens=1024,
                top_p=1
            )

            return chat_completion.choices[0].message.content

        except Exception as e:
            print(f"Error generating LLM response: {str(e)}")
            raise

    async def generate_program_recommendation(
        self,
        student_profile: Dict,
        matching_programs: List[Dict],
        temperature: float = 0.7
    ) -> str:
        """
        Generate personalized program recommendations.
        
        Args:
            student_profile: Student's background and preferences
            matching_programs: List of potential matching programs
            temperature: Controls randomness in generation
        """
        try:
            prompt = f"""Based on the student profile:
            {student_profile}
            
            Please analyze these matching programs and provide personalized recommendations:
            {matching_programs}
            
            Consider:
            1. Academic background fit
            2. Research interest alignment
            3. Admission requirements
            4. Location preferences
            5. Funding opportunities
            
            Provide a detailed analysis and clear recommendations."""

            messages = [{"role": "user", "content": prompt}]
            return await self.generate_response(messages, temperature=temperature)

        except Exception as e:
            print(f"Error generating recommendations: {str(e)}")
            raise