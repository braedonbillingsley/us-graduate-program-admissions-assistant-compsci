from sqlalchemy import Column, String, Float, Boolean, JSON, DateTime
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.database import Base

# SQLAlchemy model
class Program(Base):
    __tablename__ = "programs"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    university = Column(String, nullable=False)
    department = Column(String, nullable=False)
    degree_type = Column(String, nullable=False)  # e.g., "Masters", "PhD", "Both"
    description = Column(String, nullable=False)
    requirements = Column(JSON, nullable=False)  # Store as JSON
    research_areas = Column(JSON, nullable=False)  # Store as array in JSON
    application_deadlines = Column(JSON)  # Store as JSON
    tuition = Column(Float)
    funding_available = Column(Boolean, default=False)
    contact_info = Column(JSON)  # Store as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Pydantic models for API
class ProgramBase(BaseModel):
    name: str
    university: str
    department: str
    degree_type: str
    description: str
    requirements: dict
    research_areas: List[str]
    application_deadlines: Optional[dict] = None
    tuition: Optional[float] = None
    funding_available: Optional[bool] = False
    contact_info: Optional[dict] = None

class ProgramCreate(ProgramBase):
    pass

class ProgramResponse(ProgramBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True