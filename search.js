/**
 * The Liminal Archive — Search
 *
 * Searches across title, category, and description fields.
 * Uses a relative path so it works on GitHub Pages under any base URL.
 */

(function () {
    // Resolve titles.json relative to this script's own location,
    // which handles both root and sub-path deployments (e.g. /liminalarchive/).
    const scriptTag = document.currentScript;
    const scriptSrc = scriptTag ? scriptTag.src : '';
    const base = scriptSrc ? scriptSrc.substring(0, scriptSrc.lastIndexOf('/') + 1) : '';
    const jsonUrl = base + 'titles.json';

    let searchData = [];

    const searchBar    = document.getElementById('searchBar');
    const searchButton = document.getElementById('searchButton');
    const resultsDiv   = document.getElementById('searchResults');

    if (!searchBar || !searchButton || !resultsDiv) {
        console.warn('[Search] Could not find search elements in the DOM.');
        return;
    }

    // ---------- Load data ----------
    fetch(jsonUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status} loading ${jsonUrl}`);
            return response.json();
        })
        .then(data => {
            searchData = data;
        })
        .catch(err => {
            console.error('[Search] Failed to load titles.json:', err.message);
        });

    // ---------- Core search logic ----------
    function scoreItem(item, term) {
        /**
         * Returns a score > 0 if the item matches, 0 if it doesn't.
         * Higher score = more relevant.
         * Title matches score higher than description matches.
         */
        const t = (item.title       || '').toLowerCase();
        const c = (item.category    || '').toLowerCase();
        const d = (item.description || '').toLowerCase();

        // Skip placeholder entries
        if (t.includes('publication title')) return 0;

        let score = 0;
        if (t.includes(term))  score += 10;
        if (c.includes(term))  score += 5;
        if (d.includes(term))  score += 3;
        return score;
    }

    function getSnippet(item, term) {
        /**
         * Returns a short excerpt from the description with the
         * matching term highlighted, or just the category.
         */
        const desc = item.description || '';
        const idx  = desc.toLowerCase().indexOf(term);

        if (idx === -1) {
            // No match in description — show category instead
            return item.category ? `<span class="result-category">${item.category}</span>` : '';
        }

        // Clip ~60 chars around the match
        const start   = Math.max(0, idx - 30);
        const end     = Math.min(desc.length, idx + term.length + 30);
        const raw     = (start > 0 ? '…' : '') + desc.slice(start, end) + (end < desc.length ? '…' : '');

        // Bold the matched portion
        const safeT   = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const snippet = raw.replace(new RegExp(safeT, 'gi'), m => `<strong>${m}</strong>`);

        return `<span class="result-category">${item.category || ''}</span><span class="result-snippet">${snippet}</span>`;
    }

    function showResults(term) {
        resultsDiv.innerHTML = '';

        if (!term) {
            resultsDiv.style.display = 'none';
            return;
        }

        const scored = searchData
            .map(item => ({ item, score: scoreItem(item, term) }))
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score);

        if (scored.length === 0) {
            resultsDiv.innerHTML = '<p class="no-results">Nothing found. The archive may not yet contain this knowledge.</p>';
            resultsDiv.style.display = 'block';
            return;
        }

        scored.forEach(({ item }) => {
            const entry = document.createElement('a');
            entry.href  = item.url;
            // Open PDFs in a new tab
            if (item.url && item.url.endsWith('.pdf')) entry.target = '_blank';

            const titleEl   = document.createElement('span');
            titleEl.className = 'result-title';

            // Bold the matched portion of the title
            const safeT = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            titleEl.innerHTML = item.title.replace(new RegExp(safeT, 'gi'), m => `<strong>${m}</strong>`);

            const metaEl    = document.createElement('span');
            metaEl.className = 'result-meta';
            metaEl.innerHTML = getSnippet(item, term);

            entry.appendChild(titleEl);
            entry.appendChild(metaEl);
            resultsDiv.appendChild(entry);
        });

        resultsDiv.style.display = 'block';
    }

    // ---------- Event listeners ----------
    searchBar.addEventListener('input', () => {
        showResults(searchBar.value.trim().toLowerCase());
    });

    function navigateToFirst(term) {
        const first = searchData
            .map(item => ({ item, score: scoreItem(item, term) }))
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score)[0];

        if (first) {
            if (first.item.url.endsWith('.pdf')) {
                window.open(first.item.url, '_blank');
            } else {
                window.location.href = first.item.url;
            }
        } else {
            showResults(term);
        }
    }

    searchButton.addEventListener('click', () => {
        navigateToFirst(searchBar.value.trim().toLowerCase());
    });

    searchBar.addEventListener('keypress', e => {
        if (e.key === 'Enter') navigateToFirst(searchBar.value.trim().toLowerCase());
    });

    // Close when clicking outside
    document.addEventListener('click', e => {
        if (!searchBar.contains(e.target) && !searchButton.contains(e.target) && !resultsDiv.contains(e.target)) {
            resultsDiv.style.display = 'none';
        }
    });
})();
