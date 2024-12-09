# app/config.py
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

class Settings(BaseSettings):
    # AI Services
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")
    DATA_GOV_API_KEY: str = os.getenv("DATA_GOV_API_KEY")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./grad_admissions.db")

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()