from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.program import Program, ProgramCreate, ProgramResponse

router = APIRouter()

@router.get("/", response_model=List[ProgramResponse])
async def get_programs(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get list of graduate programs"""
    try:
        programs = db.query(Program).offset(skip).limit(limit).all()
        return programs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{program_id}", response_model=ProgramResponse)
async def get_program(
    program_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific program by ID"""
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program

@router.post("/", response_model=ProgramResponse)
async def create_program(
    program: ProgramCreate,
    db: Session = Depends(get_db)
):
    """Create a new program"""
    try:
        db_program = Program(**program.model_dump())
        db.add(db_program)
        db.commit()
        db.refresh(db_program)
        return db_program
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{program_id}", response_model=ProgramResponse)
async def update_program(
    program_id: str,
    program_update: ProgramCreate,
    db: Session = Depends(get_db)
):
    """Update a program"""
    db_program = db.query(Program).filter(Program.id == program_id).first()
    if not db_program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    for key, value in program_update.model_dump().items():
        setattr(db_program, key, value)
    
    try:
        db.commit()
        db.refresh(db_program)
        return db_program
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{program_id}")
async def delete_program(
    program_id: str,
    db: Session = Depends(get_db)
):
    """Delete a program"""
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    try:
        db.delete(program)
        db.commit()
        return {"message": "Program deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))