# us-graduate-program-admissions-assistant-compsci
A personal AI-assistant designed to help aspiring computer scientists navigate the complex process of finding and applying to graduate/Ph.D. programs in top computer science and related engineering schools in the US. 

🌟 Features

**Personalized Program Recommendations:** Uses AI to match students with suitable graduate programs based on their academic background, research interests, and preferences

**RAG-Enhanced Conversations:** Leverages Retrieval-Augmented Generation for accurate, context-aware responses about specific programs

**Real-Time Program Data:** Automatically updates program information from the College Scorecard API

**Interactive Web Interface:** User-friendly interface for submitting preferences and receiving recommendations

**Vector Search:** Efficient similarity-based program search using ChromaDB

**Comprehensive Program Analysis:** Detailed analysis of program fit including academic alignment, research interests, and location preferences

🔧 Technical Stack

* *Backend*: FastAPI
* *Database*: SQLAlchemy with SQLite
* *Vector Store*: ChromaDB
* *LLM Integration*: Groq API
* *Frontend*: HTML/JavaScript with Tailwind CSS
* *Data Source*: U.S. Department of Education's College Scorecard API

🚀 **Setup Instructions**

Clone the Repository:
```bash
git clone https://github.com/braedonbillingsley/us-graduate-program-admissions-assistant-compsci.git

cd us-graduate-program-admissions-assistant-compsci
```

#### Create and Activate Virtual Environment:

```bash 
python -m venv venv
```

On Windows
```
venv\Scripts\activate
```
On Unix or MacOS
```
source venv/bin/activate
```

#### Install Dependencies:
```bash
pip install -r requirements.txt
```

#### Set Up Environment Variables:

Create a .env file in the root directory with the following variables:
```
GROQ_API_KEY=your_groq_api_key
DATA_GOV_API_KEY=your_data_gov_api_key
DATABASE_URL=sqlite:///./grad_admissions.db
```

#### Initialize the Database
```bash
python -c "from app.database import create_db_and_tables; create_db_and_tables()"
```


🏃‍♂️ Running the Application

Start the Backend Server
```bash
uvicorn app.main:app --reload
```

The server will start at http://localhost:8000

#### Access the Web Interface
Open your browser and navigate to http://localhost:8000

📚 **API Documentation**

Once the server is running, you can access:

Interactive API documentation: http://localhost:8000/docs
Alternative API documentation: http://localhost:8000/redoc