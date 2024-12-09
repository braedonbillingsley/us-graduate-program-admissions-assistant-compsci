import chromadb
from typing import List, Dict, Optional
import json
from datetime import datetime

class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.collection_name = "programs"
        self.collection = None
        
    async def ensure_initialized(self):
        """Ensure the collection is initialized before use"""
        if self.collection is None:
            await self.initialize()
            
    async def initialize(self):
        """Initialize or get the collection"""
        try:
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            print("✅ Vector store initialized")
        except Exception as e:
            print(f"❌ Vector store initialization failed: {str(e)}")
            raise

    def create_program_document(self, program: Dict) -> str:
        """Create a searchable document from program data"""
        return f"""
        Program: {program['name']}
        University: {program['university']}
        Location: {program.get('location', 'Unknown Location')}
        Department: {program['department']}
        Description: {program.get('description', 'No description available')}
        Degree Type: {program.get('requirements', {}).get('degree_type', 'Graduate Degree')}
        Research Areas: {', '.join(program.get('researchAreas', []))}
        Annual Cost: ${program.get('requirements', {}).get('annual_cost', 'Not Available')}
        Admission Rate: {program.get('requirements', {}).get('admission_rate', 'Not Available')}
        """

    def create_program_metadata(self, program: Dict) -> Dict:
        """Create metadata for program"""
        return {
            "program_id": str(program['id']),
            "name": program['name'],
            "university": program['university'],
            "department": program['department'],
            "location": program.get('location', 'Unknown'),
            "degree_type": program.get('requirements', {}).get('degree_type', 'Graduate Degree'),
            "last_updated": datetime.utcnow().isoformat()
        }

    async def add_or_update_program(self, program: Dict) -> bool:
        """Add or update a program in the vector store. Returns True if new, False if updated."""
        await self.ensure_initialized()
        
        try:
            program_id = str(program['id'])
            document = self.create_program_document(program)
            metadata = self.create_program_metadata(program)

            # Check if program exists
            existing = self.collection.get(
                ids=[program_id],
                include=['metadatas']
            )

            if existing and existing['ids']:
                # Update existing program
                self.collection.update(
                    ids=[program_id],
                    documents=[document],
                    metadatas=[metadata]
                )
                print(f"Updated existing program: {program['name']} at {program['university']}")
                return False
            else:
                # Add new program
                self.collection.add(
                    documents=[document],
                    metadatas=[metadata],
                    ids=[program_id]
                )
                print(f"Added new program: {program['name']} at {program['university']}")
                return True

        except Exception as e:
            print(f"Error in add_or_update_program: {str(e)}")
            raise

    async def search_similar(
        self,
        query: str,
        n_results: int = 5
    ) -> List[Dict]:
        """Search for similar programs."""
        await self.ensure_initialized()
        
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=min(n_results, 20)  # Limit maximum results
            )
            
            if not results['documents'][0]:
                return []

            # Format results
            matches = []
            for i in range(len(results['documents'][0])):
                match = {
                    "document": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i],
                }
                if 'distances' in results:
                    match["similarity"] = 1 - results['distances'][0][i]  # Convert distance to similarity
                matches.append(match)

            return matches

        except Exception as e:
            print(f"Error searching vector store: {str(e)}")
            raise
            
    async def get_program_by_id(self, program_id: str) -> Optional[Dict]:
        """Retrieve a specific program by ID."""
        await self.ensure_initialized()
        
        try:
            results = self.collection.get(
                ids=[program_id]
            )
            
            if results['documents']:
                return {
                    "document": results['documents'][0],
                    "metadata": results['metadatas'][0]
                }
            return None
            
        except Exception as e:
            print(f"Error retrieving program: {str(e)}")
            raise

    async def get_program_count(self) -> int:
        """Get the total number of programs in the store."""
        await self.ensure_initialized()
        
        try:
            return self.collection.count()
        except Exception as e:
            print(f"Error getting program count: {str(e)}")
            raise

    async def clear_programs(self):
        """Clear all programs from the store."""
        await self.ensure_initialized()
        
        try:
            self.collection.delete(
                where={},  # Empty where clause deletes all
            )
            print("✅ Cleared all programs from vector store")
        except Exception as e:
            print(f"Error clearing programs: {str(e)}")
            raise