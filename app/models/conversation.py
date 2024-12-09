from sqlalchemy import Column, String, JSON, DateTime
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

# Pydantic models for API
class Message(BaseModel):
    role: str
    content: str
    timestamp: Optional[datetime] = None

class Conversation(BaseModel):
    id: str
    history: List[Message] = []
    user_metadata: dict = {}  # Changed from metadata to user_metadata
    created_at: datetime = None
    last_updated: datetime = None

    class Config:
        from_attributes = True

# SQLAlchemy models for database
from app.database import Base

class ConversationDB(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True)
    history = Column(JSON, default=list)
    user_metadata = Column(JSON, default=dict)  # Changed from metadata to user_metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)