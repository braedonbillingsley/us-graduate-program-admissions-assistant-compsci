from typing import List, Dict, Optional
import aiohttp
import asyncio
from datetime import datetime
import json
import os
from app.config import settings

class ProgramDataPipeline:
    def __init__(self, vector_store):
        self.vector_store = vector_store
        self.api_endpoint = "https://api.data.gov/ed/collegescorecard/v1/schools"
        self.api_key = settings.DATA_GOV_API_KEY
        self.processed_ids = set()
        
        # Define CS-related CIP codes
        self.cs_cip_codes = {
            '11.0101': 'Computer and Information Sciences, General',
            '11.0102': 'Artificial Intelligence and Robotics',
            '11.0103': 'Information Technology',
            '11.0104': 'Informatics',
            '11.0199': 'Computer and Information Sciences, Other',
            '11.0201': 'Computer Programming',
            '11.0202': 'Computer Systems Analysis',
            '11.0301': 'Data Processing',
            '11.0401': 'Information Science',
            '11.0501': 'Computer Systems Analysis',
            '11.0701': 'Computer Science',
            '11.0801': 'Web Development',
            '11.0802': 'Data Modeling/Warehousing',
            '11.0803': 'Computer Graphics',
            '11.0804': 'Cybersecurity',
            '14.0901': 'Computer Engineering',
            '14.0902': 'Computer Hardware Engineering',
            '14.0903': 'Computer Software Engineering',
            '14.0999': 'Computer Engineering, Other',
            '15.1201': 'Computer Engineering Technology',
            '15.1202': 'Computer Technology',
            '15.1203': 'Computer Hardware Technology',
            '15.1204': 'Computer Software Technology'
        }

    async def fetch_program_data(self, params: Dict) -> List[Dict]:
        """Fetch program data from College Scorecard API"""
        try:
            async with aiohttp.ClientSession() as session:
                params["api_key"] = self.api_key
                
                async with session.get(self.api_endpoint, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        schools = data.get('results', [])
                        print(f"Retrieved {len(schools)} schools")
                        return schools
                    else:
                        error_text = await response.text()
                        print(f"Error fetching data: Status {response.status}")
                        print(f"Error details: {error_text}")
                        return []
        except Exception as e:
            print(f"Error in fetch_program_data: {str(e)}")
            return []

    def is_cs_program(self, program: Dict) -> bool:
        """Check if a program is CS-related based on CIP code or title"""
        code = program.get('code', '')
        title = program.get('title', '').lower()
        
        # Check if the program's CIP code matches our CS codes
        if code in self.cs_cip_codes:
            return True
            
        # Check if the title contains CS-related keywords
        cs_keywords = ['computer', 'computing', 'software', 'data', 'information', 
                      'cyber', 'artificial intelligence', 'machine learning', 
                      'robotics', 'programming', 'informatics']
        
        return any(keyword in title for keyword in cs_keywords)

    def transform_program_data(self, raw_data: Dict) -> List[Dict]:
        """Transform raw API data into standardized format"""
        try:
            # Extract basic school information
            school_name = raw_data.get("school.name")
            school_city = raw_data.get("school.city")
            school_state = raw_data.get("school.state")
            school_id = raw_data.get("id")
            
            print(f"\nProcessing school: {school_name}")
            
            # Get graduate-level CS programs
            programs_data = raw_data.get("latest.programs.cip_4_digit", [])
            if not isinstance(programs_data, list):
                programs_data = [programs_data] if programs_data else []
            
            # Filter for graduate CS programs
            cs_programs = [p for p in programs_data 
                         if isinstance(p, dict) 
                         and p.get("credential", {}).get("level", 0) >= 5
                         and self.is_cs_program(p)]
            
            admission_rate = raw_data.get("latest.admissions.admission_rate.overall")
            annual_cost = raw_data.get("latest.cost.attendance.academic_year")
            
            transformed_programs = []
            for program in cs_programs:
                try:
                    credential_info = program.get("credential", {})
                    
                    transformed = {
                        "id": f"{school_id}_{program.get('code', 'unknown')}",
                        "name": program.get("title"),
                        "university": school_name,
                        "location": f"{school_city}, {school_state}",
                        "department": "Computer Science and Information Technology",
                        "description": self.generate_program_description(program, school_name, school_city, school_state, credential_info),
                        "requirements": {
                            "degree_level": credential_info.get("level"),
                            "degree_type": credential_info.get("title"),
                            "admission_rate": admission_rate,
                            "annual_cost": annual_cost
                        },
                        "outcomes": {
                            "median_earnings": program.get("earnings", {}).get("1_yr", {})
                                                   .get("overall_median_earnings"),
                            "employment_rate": None
                        },
                        "researchAreas": [program.get("title")],
                        "last_updated": datetime.utcnow().isoformat(),
                    }
                    transformed_programs.append(transformed)
                    print(f"Added CS program: {transformed['name']} ({credential_info.get('title')})")
                except Exception as e:
                    print(f"Error transforming program: {str(e)}")
                    continue
            
            print(f"Transformed {len(transformed_programs)} CS programs for {school_name}")
            return transformed_programs
            
        except Exception as e:
            print(f"Error in transform_program_data: {str(e)}")
            return []

    def generate_program_description(self, program: Dict, school_name: str, city: str, state: str, credential_info: Dict) -> str:
        """Generate a detailed program description"""
        try:
            description = f"Graduate {program.get('title')} program at {school_name} in {city}, {state}. "
            description += f"This program leads to a {credential_info.get('title', 'graduate degree')} "
            description += f"in {program.get('title')}. "
            
            # Add earnings information if available
            median_earnings = program.get("earnings", {}).get("1_yr", {}).get("overall_median_earnings")
            if median_earnings:
                description += f"Recent graduates report a median annual earning of ${median_earnings:,}. "
            
            return description
        except Exception as e:
            return f"Graduate program in {program.get('title', 'Unknown Field')}"

    async def update_program_database(self):
        """Update program database with latest data"""
        try:
            # Clear the processed IDs set at the start of each update
            self.processed_ids.clear()
            
            params = {
                "fields": ",".join([
                    "id",
                    "school.name",
                    "school.city",
                    "school.state",
                    "latest.programs.cip_4_digit",
                    "latest.cost.attendance.academic_year",
                    "latest.admissions.admission_rate.overall",
                    "latest.student.size"
                ]),
                "per_page": 25,
                "sort": "latest.student.size:desc",
                "school.operating": 1,
                "latest.programs.cip_4_digit.credential.level__range": "5..7"
            }
            
            raw_data = await self.fetch_program_data(params)
            if not raw_data:
                print("No data received from API")
                return
            
            new_count = 0
            update_count = 0
            
            for school_data in raw_data:
                programs = self.transform_program_data(school_data)
                for program in programs:
                    try:
                        program_id = program["id"]
                        
                        # Skip if we've already processed this ID in current update
                        if program_id in self.processed_ids:
                            print(f"Skipping duplicate program ID: {program_id}")
                            continue
                        
                        # Use add_or_update_program instead of add_program
                        is_new = await self.vector_store.add_or_update_program(program)
                        if is_new:
                            new_count += 1
                        else:
                            update_count += 1
                            
                        self.processed_ids.add(program_id)
                        
                    except Exception as e:
                        print(f"Error processing program: {str(e)}")
                        continue
            
            print(f"✅ Database update complete:")
            print(f"   - Added {new_count} new programs")
            print(f"   - Updated {update_count} existing programs")
            print(f"   - Total unique programs: {len(self.processed_ids)}")
            
        except Exception as e:
            print(f"❌ Error updating program database: {str(e)}")
            raise

    async def schedule_updates(self, interval_hours: int = 24):
        """Schedule regular database updates"""
        while True:
            try:
                await self.update_program_database()
            except Exception as e:
                print(f"Error in scheduled update: {str(e)}")
            await asyncio.sleep(interval_hours * 3600)