document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profileForm');
    const interestInput = document.getElementById('interestInput');
    const interestTags = document.getElementById('interestTags');
    const interestsHidden = document.getElementById('interestsHidden');
    const researchExp = document.querySelector('textarea[name="researchExp"]');
    const charCounter = document.querySelector('.char-counter');
    let programData = []; // Store program data for filtering/sorting
    
    let interests = [];

    // Interest tags handling
    interestInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const interest = this.value.trim();
            if (interest && !interests.includes(interest)) {
                interests.push(interest);
                updateInterestTags();
                this.value = '';
            }
        }
    });

    function updateInterestTags() {
        interestTags.innerHTML = interests.map(interest => `
            <span class="interest-tag">
                ${interest}
                <span class="remove-tag" data-interest="${interest}">&times;</span>
            </span>
        `).join('');
        interestsHidden.value = JSON.stringify(interests);
    }

    // Remove interest tags
    interestTags.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-tag')) {
            const interest = e.target.dataset.interest;
            interests = interests.filter(i => i !== interest);
            updateInterestTags();
        }
    });

    // Character counter
    researchExp.addEventListener('input', function() {
        const count = this.value.length;
        charCounter.textContent = `${count}/50`;
        if (count < 50) {
            charCounter.style.color = '#ef4444';
        } else {
            charCounter.style.color = '#64748b';
        }
    });

    // Form submission
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading(true);
        
        try {
            const formData = new FormData(e.target);
            const data = {
                interests: interests,
                gpa: parseFloat(formData.get('gpa')),
                researchExp: formData.get('researchExp')
            };

            const response = await submitProfile(data);
            programData = response.data.matches; // Store matches for filtering/sorting
            const resultsDiv = document.getElementById('results');
            resultsDiv.style.display = 'block';
            filterAndDisplayResults();
            resultsDiv.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            showError(error);
        } finally {
            showLoading(false);
        }
    });

    // Search functionality
    const programSearch = document.getElementById('programSearch');
    programSearch.addEventListener('input', () => {
        filterAndDisplayResults();
    });

    // Sorting functionality
    let sortAscending = false;
    const sortButton = document.getElementById('sortButton');
    sortButton.addEventListener('click', () => {
        sortAscending = !sortAscending;
        sortButton.innerHTML = `Sort by Match ${sortAscending ? '↑' : '↓'}`;
        filterAndDisplayResults();
    });

    function filterAndDisplayResults() {
        const searchTerm = programSearch.value.toLowerCase();
        let filteredResults = programData.filter(program =>
            program.university.toLowerCase().includes(searchTerm) ||
            program.program.toLowerCase().includes(searchTerm) ||
            program.match.toLowerCase().includes(searchTerm)
        );

        // Sort results
        filteredResults.sort((a, b) => {
            const multiplier = sortAscending ? 1 : -1;
            return multiplier * (a.matchScore - b.matchScore);
        });

        const matchesContainer = document.getElementById('matchesContainer');
        const noResults = document.getElementById('noResults');

        if (filteredResults.length === 0) {
            matchesContainer.innerHTML = '';
            noResults.classList.remove('d-none');
        } else {
            noResults.classList.add('d-none');
            matchesContainer.innerHTML = filteredResults.map(program => `
                <div class="card program-card">
                    <div class="card-body position-relative">
                        <span class="match-score">${program.matchScore}% Match</span>
                        <h5 class="card-title">${program.university}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${program.program}</h6>
                        <p class="card-text">${program.match}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                            <span class="deadline-tag">Deadline: ${program.deadline}</span>
                            <button class="btn btn-primary">View Details</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
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

function showError(error) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <div class="error-message">
            <h4>Error</h4>
            <p>${error.message || 'An unexpected error occurred. Please try again.'}</p>
        </div>
    `;
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

function showLoading(show) {
    const submitButton = document.querySelector('button[type="submit"]');
    const submitSpinner = document.querySelector('.submit-spinner');
    const submitText = submitButton.querySelector('span');
    
    if (show) {
        submitSpinner.style.display = 'block';
        submitText.style.opacity = '0';
        submitButton.disabled = true;
    } else {
        submitSpinner.style.display = 'none';
        submitText.style.opacity = '1';
        submitButton.disabled = false;
    }
}