document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('analyze-form');
    const input = document.getElementById('url-input');
    const btn = document.getElementById('scan-btn');
    const btnText = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.loader');
    
    const resultsContainer = document.getElementById('results-container');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    const toggleJsonBtn = document.getElementById('toggle-json');
    const rawJson = document.getElementById('raw-json');

    toggleJsonBtn.addEventListener('click', () => {
        rawJson.classList.toggle('hidden');
        toggleJsonBtn.textContent = rawJson.classList.contains('hidden') 
            ? 'Show Raw JSON Response' 
            : 'Hide Raw JSON Response';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = input.value.trim();
        if (!url) return;

        // Reset state
        setLoading(true);
        resultsContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Analysis faied');
            }

            const data = await response.json();
            renderResults(data.results);
            resultsContainer.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            errorMessage.textContent = error.message;
            errorContainer.classList.remove('hidden');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        if (isLoading) {
            btn.disabled = true;
            btnText.classList.add('hidden');
            loader.classList.remove('hidden');
        } else {
            btn.disabled = false;
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    }

    function renderResults(data) {
        // Top Level
        document.getElementById('difficulty-score').textContent = data.difficulty;
        
        // Color code difficulty
        const diffRing = document.getElementById('difficulty-ring');
        diffRing.style.borderColor = getDifficultyColor(data.difficulty);
        document.getElementById('difficulty-score').style.color = getDifficultyColor(data.difficulty);

        // SLAP
        const slapParts = data.slap ? data.slap.split(', ') : ['?', '?', '?'];
        document.getElementById('slap-s').textContent = slapParts[0] || 'Unknown';
        document.getElementById('slap-l').textContent = slapParts[1] || 'Unknown';
        document.getElementById('slap-ap').textContent = slapParts[2] || 'Unknown';

        // Status
        const statusEl = document.getElementById('crawl-status');
        statusEl.textContent = data.crawlability;
        statusEl.className = 'status-badge ' + data.crawlability.toLowerCase();

        // Hints
        const hintsContainer = document.getElementById('hints-grid');
        const hintsSection = document.getElementById('hints-section');
        hintsContainer.innerHTML = '';
        
        if (data.failure_hints && data.failure_hints.length > 0) {
            hintsSection.classList.remove('hidden');
            data.failure_hints.forEach(hint => {
                const chip = document.createElement('div');
                chip.className = 'hint-chip';
                chip.textContent = hint;
                hintsContainer.appendChild(chip);
            });
        } else {
            hintsSection.classList.add('hidden');
        }

        // Signals Injection Helper
        function renderSignals(listId, signalsObj) {
            const list = document.getElementById(listId);
            list.innerHTML = '';
            for (const [key, val] of Object.entries(signalsObj)) {
                if(val === null || val === undefined) continue;
                
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="signal-key">${key}</span>
                    <span class="signal-val ${val}">${val}</span>
                `;
                list.appendChild(li);
            }
        }

        // We need to pick relevant signals for each column from the data
        // Assuming data.signals contains the flat list or we look at the specific structures
        const signals = data.signals || {};
        
        renderSignals('structure-signals', {
            'Framework': signals.framework_detected,
            'Shadow DOM': signals.shadow,
            'Iframes': signals.iframe,
            'Semantic Tags': signals.semantic_tags,
            'Text Length': signals.initial_text_length
        });

        renderSignals('loading-signals', {
            'API Count': signals.api_count,
            'API (Scroll)': signals.api_count_after_scroll,
            'Interactive': signals.interactive_loading
        });

        renderSignals('access-signals', {
            'Login Wall': signals.login_required,
            'CAPTCHA': signals.captcha,
            'Bot Score': signals.bot_score,
            'Soft Block': signals.api_soft_block
        });

        // Raw JSON
        rawJson.textContent = JSON.stringify(data, null, 2);
    }

    function getDifficultyColor(score) {
        if (score <= 2) return '#00ff9d'; // Green
        if (score <= 3) return '#ffb800'; // Yellow
        return '#ff0055'; // Red
    }
});
