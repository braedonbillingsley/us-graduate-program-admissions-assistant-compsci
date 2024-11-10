document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profileForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsSection = document.getElementById('results');

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading(true);
        
        try {
            const formData = new FormData(e.target);
            const response = await submitProfile(formData);
            displayResults(response.matches);
        } catch (error) {
            showError(error);
        } finally {
            showLoading(false);
        }
    });
});

async function submitProfile(formData) {
    const response = await fetch('/submit-profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(formData))
    });
    
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    
    return response.json();
}

function displayResults(matches) {
    const resultsDiv = document.getElementById('results');
    const matchesContainer = document.getElementById('matchesContainer');
    
    matchesContainer.innerHTML = matches.map(match => `
        <div class="card program-card">
            <div class="card-body">
                <span class="match-score">${match.matchScore || '90'}% Match</span>
                <h5 class="card-title">${match.university}</h5>
                <h6 class="card-subtitle mb-2 text-muted">${match.program}</h6>
                <p class="card-text">${match.match}</p>
                <p class="card-text">
                    <span class="deadline-tag">Deadline: ${match.deadline}</span>
                </p>
            </div>
        </div>
    `).join('');
    
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    loadingSpinner.style.display = show ? 'block' : 'none';
}

function showError(error) {
    console.error('Error:', error);
    alert('An error occurred while processing your request. Please try again.');
}