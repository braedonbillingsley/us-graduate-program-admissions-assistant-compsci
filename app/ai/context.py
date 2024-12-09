from typing import Dict, List, Optional
from datetime import datetime, timedelta

class ConversationManager:
    def __init__(self):
        """Initialize conversation manager with in-memory storage"""
        self.conversations: Dict[str, Dict] = {}

    async def create_conversation(self, conversation_id: str) -> Dict:
        """Create a new conversation context"""
        self.conversations[conversation_id] = {
            'history': [],
            'created_at': datetime.now(),
            'last_updated': datetime.now(),
            'user_metadata': {}  # Changed from metadata to user_metadata
        }
        return self.conversations[conversation_id]

    async def get_context(
        self,
        conversation_id: str,
        max_history: int = 10
    ) -> Optional[Dict]:
        """Retrieve conversation context with optional history limit"""
        conversation = self.conversations.get(conversation_id)
        if not conversation:
            return None
            
        # Return recent history while maintaining context
        history = conversation['history']
        if len(history) > max_history:
            # Always include the first system message if it exists
            first_msg = history[0] if history[0]['role'] == 'system' else None
            recent_msgs = history[-max_history:]
            if first_msg:
                recent_msgs = [first_msg] + recent_msgs
            history = recent_msgs

        return {
            'history': history,
            'user_metadata': conversation['user_metadata'],  # Changed from metadata to user_metadata
            'last_updated': conversation['last_updated']
        }

    async def add_message(
        self,
        conversation_id: str,
        message: Dict[str, str]
    ) -> Dict:
        """Add a message to the conversation history"""
        if conversation_id not in self.conversations:
            await self.create_conversation(conversation_id)
            
        conversation = self.conversations[conversation_id]
        conversation['history'].append(message)
        conversation['last_updated'] = datetime.now()
        return conversation

    async def update_metadata(
        self,
        conversation_id: str,
        user_metadata: Dict  # Changed parameter name
    ) -> Dict:
        """Update conversation metadata"""
        if conversation_id not in self.conversations:
            raise KeyError("Conversation not found")
            
        self.conversations[conversation_id]['user_metadata'].update(user_metadata)  # Changed from metadata to user_metadata
        self.conversations[conversation_id]['last_updated'] = datetime.now()
        return self.conversations[conversation_id]

    async def delete_conversation(self, conversation_id: str):
        """Delete a conversation"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]

    async def cleanup_old_conversations(self, max_age_hours: int = 24):
        """Clean up conversations older than specified hours"""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        to_delete = [
            conv_id for conv_id, conv in self.conversations.items()
            if conv['last_updated'] < cutoff_time
        ]
        for conv_id in to_delete:
            await self.delete_conversation(conv_id)