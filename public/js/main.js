document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profileForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsSection = document.getElementById('results');

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading(true);
        
        try {
            // Convert form data to proper format
            const formData = new FormData(e.target);
            const data = {
                interests: formData.get('interests').split(',').map(i => i.trim()).filter(i => i),
                gpa: parseFloat(formData.get('gpa')),
                researchExp: formData.get('researchExp')
            };

            const response = await submitProfile(data);
            displayResults(response.data.matches);
        } catch (error) {
            showError(error);
        } finally {
            showLoading(false);
        }
    });
});

async function submitProfile(data) {
    const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Something went wrong');
    }
    
    return response.json();
}

function displayResults(matches) {
    const resultsDiv = document.getElementById('results');
    const matchesContainer = document.getElementById('matchesContainer');
    
    matchesContainer.innerHTML = matches.map(match => `
        <div class="card program-card">
            <div class="card-body">
                <span class="match-score">${match.matchScore}% Match</span>
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
    alert(error.message || 'An error occurred. Please try again.');
}