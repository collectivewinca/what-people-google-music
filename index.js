// What People Google About Music - Entry Point
// A music-focused fork of anvaka's what-people-google

(function() {
  'use strict';

  // Question types to fetch
  var QUESTION_TYPES = [
    { id: 'why-is', prefix: 'why is', display: 'Why is [name] …?' },
    { id: 'why-does', prefix: 'why does', display: 'Why does [name] …?' },
    { id: 'is', prefix: 'is', display: 'Is [name] …?' },
    { id: 'does', prefix: 'does', display: 'Does [name] …?' },
    { id: 'how', prefix: 'how', display: 'How [name] …?' },
    { id: 'when-will', prefix: 'when will', display: 'When will [name] …?' },
    { id: 'can', prefix: 'can', display: 'Can [name] …?' }
  ];

  // Minimum loading duration to prevent flicker (ms)
  var MIN_LOADING_DURATION = 400;

  // DOM Elements
  var searchInput = document.getElementById('search-input');
  var searchBtn = document.getElementById('search-btn');
  var resultsContainer = document.getElementById('results-container');
  var categoryTabs = document.querySelectorAll('.category-tab');
  var exampleChips = document.querySelectorAll('.example-chip');

  // Valid categories for URL param validation
  var VALID_CATEGORIES = ['artist', 'song', 'genre', 'album'];

  // Cache settings
  var CACHE_PREFIX = 'wpg_';
  var CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  var HISTORY_KEY = 'wpg_history';
  var MAX_HISTORY = 8;

  // State
  var currentCategory = 'artist';
  var isLoading = false;
  var callbackCounter = 0;

  // Cache helpers
  function cacheKey(query, category) {
    return CACHE_PREFIX + query.toLowerCase() + '|' + category;
  }

  function getCachedResults(query, category) {
    try {
      var raw = localStorage.getItem(cacheKey(query, category));
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (Date.now() - entry.ts > CACHE_TTL) {
        localStorage.removeItem(cacheKey(query, category));
        return null;
      }
      return entry.results;
    } catch (e) {
      return null;
    }
  }

  function setCachedResults(query, category, results) {
    try {
      localStorage.setItem(cacheKey(query, category), JSON.stringify({
        results: results,
        ts: Date.now()
      }));
    } catch (e) {
      // localStorage full or unavailable — silently ignore
    }
  }

  // History helpers
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function addToHistory(query, category) {
    try {
      var history = getHistory();
      // Remove duplicate if exists
      history = history.filter(function(h) {
        return !(h.q.toLowerCase() === query.toLowerCase() && h.c === category);
      });
      // Prepend new entry
      history.unshift({ q: query, c: category });
      // Cap at max
      if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      // silently ignore
    }
  }

  function clearHistory() {
    try { localStorage.removeItem(HISTORY_KEY); } catch (e) {}
    var section = document.querySelector('.history-section');
    if (section) section.parentNode.removeChild(section);
  }

  // Initialize
  init();

  function init() {
    // Category tab clicks and keyboard navigation
    categoryTabs.forEach(function(tab, index) {
      tab.addEventListener('click', function() {
        selectTab(tab);
      });

      // Arrow key navigation for tabs (WAI-ARIA pattern)
      tab.addEventListener('keydown', function(e) {
        var tabs = Array.from(categoryTabs);
        var currentIndex = tabs.indexOf(tab);
        var newIndex;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          newIndex = (currentIndex + 1) % tabs.length;
          tabs[newIndex].focus();
          selectTab(tabs[newIndex]);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          tabs[newIndex].focus();
          selectTab(tabs[newIndex]);
        } else if (e.key === 'Home') {
          e.preventDefault();
          tabs[0].focus();
          selectTab(tabs[0]);
        } else if (e.key === 'End') {
          e.preventDefault();
          tabs[tabs.length - 1].focus();
          selectTab(tabs[tabs.length - 1]);
        }
      });
    });

    // Example chip clicks
    exampleChips.forEach(function(chip) {
      chip.addEventListener('click', function() {
        searchInput.value = chip.dataset.query;
        // Set the category
        var cat = chip.dataset.category;
        categoryTabs.forEach(function(t) {
          var isSelected = t.dataset.category === cat;
          t.classList.toggle('active', isSelected);
          t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
          t.setAttribute('tabindex', isSelected ? '0' : '-1');
        });
        currentCategory = cat;
        performSearch();
      });
    });

    // Search button click
    searchBtn.addEventListener('click', performSearch);

    // Enter key in search input (use keydown, not deprecated keypress)
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });

    // Initialize tab indices
    categoryTabs.forEach(function(tab, index) {
      tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    // Render search history in initial empty state
    var historyHtml = renderHistory();
    if (historyHtml) {
      var examples = resultsContainer.querySelector('.examples');
      if (examples) {
        examples.insertAdjacentHTML('beforebegin', historyHtml);
        attachHistoryHandlers();
      }
    }

    // Deep link: restore state from URL parameters
    var urlParams = new URLSearchParams(window.location.search);
    var urlQuery = urlParams.get('q');
    var urlCategory = urlParams.get('c');

    if (urlQuery) {
      searchInput.value = urlQuery;

      if (urlCategory && VALID_CATEGORIES.indexOf(urlCategory) !== -1) {
        categoryTabs.forEach(function(t) {
          var isSelected = t.dataset.category === urlCategory;
          t.classList.toggle('active', isSelected);
          t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
          t.setAttribute('tabindex', isSelected ? '0' : '-1');
        });
        currentCategory = urlCategory;
      }

      performSearch();
    }
  }

  function selectTab(tab) {
    categoryTabs.forEach(function(t) {
      var isSelected = t === tab;
      t.classList.toggle('active', isSelected);
      t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      t.setAttribute('tabindex', isSelected ? '0' : '-1');
    });
    currentCategory = tab.dataset.category;
  }

  function performSearch() {
    var query = searchInput.value.trim();
    if (!query || isLoading) return;

    isLoading = true;
    searchBtn.disabled = true;
    showLoading();

    // Check cache first
    var cached = getCachedResults(query, currentCategory);
    if (cached) {
      // Brief loading for smooth UX transition
      setTimeout(function() {
        isLoading = false;
        searchBtn.disabled = false;
        renderResults(query, cached);
      }, 200);
      return;
    }

    var loadingStartTime = Date.now();

    // Fetch all question types sequentially with small delays to avoid rate limiting
    fetchAllQuestionTypes(query)
      .then(function(results) {
        // Cache the results
        setCachedResults(query, currentCategory, results);

        // Ensure minimum loading duration to prevent flicker
        var elapsed = Date.now() - loadingStartTime;
        var remaining = Math.max(0, MIN_LOADING_DURATION - elapsed);

        setTimeout(function() {
          isLoading = false;
          searchBtn.disabled = false;
          renderResults(query, results);
        }, remaining);
      })
      .catch(function(err) {
        isLoading = false;
        searchBtn.disabled = false;
        showError('Failed to fetch suggestions. Please try again.');
        console.error(err);
      });
  }

  /**
   * Build the autocomplete query string from prefix, search term, and category.
   * Called once per question type (e.g. prefix="why is", query="Thriller", category="album").
   *
   * TODO: Implement your query-building strategy here.
   *
   * Considerations:
   *   - "artist" is the default; most artist names work fine without a qualifier.
   *   - For songs/genres/albums, appending the category helps Google disambiguate
   *     (e.g. "Thriller" the album vs. the song vs. the Michael Jackson question).
   *   - You could also skip the category entirely for certain prefixes if it reads awkwardly.
   *   - Return a single string that will be passed to Google's autocomplete API.
   */
  function buildQuery(prefix, query, category) {
    if (category === 'artist') {
      return prefix + ' ' + query;
    }
    return prefix + ' ' + query + ' ' + category;
  }

  function fetchAllQuestionTypes(query) {
    var category = currentCategory;
    return new Promise(function(resolve) {
      var results = [];
      var index = 0;

      function fetchNext() {
        if (index >= QUESTION_TYPES.length) {
          resolve(results);
          return;
        }

        var qt = QUESTION_TYPES[index];
        fetchSuggestions(buildQuery(qt.prefix, query, category))
          .then(function(suggestions) {
            results.push({
              id: qt.id,
              display: qt.display.split('[name]').join(query),
              prefix: qt.prefix,
              suggestions: suggestions
            });
          })
          .catch(function() {
            results.push({
              id: qt.id,
              display: qt.display.split('[name]').join(query),
              prefix: qt.prefix,
              suggestions: []
            });
          })
          .finally(function() {
            index++;
            // Small delay between requests
            setTimeout(fetchNext, 100);
          });
      }

      fetchNext();
    });
  }

  function fetchSuggestions(query) {
    return new Promise(function(resolve, reject) {
      // Use JSONP callback
      var callbackName = 'ac_' + (++callbackCounter);
      var script = document.createElement('script');
      var timeout;

      window[callbackName] = function(data) {
        cleanup();
        if (data && Array.isArray(data) && data[1]) {
          resolve(data[1]);
        } else {
          resolve([]);
        }
      };

      function cleanup() {
        clearTimeout(timeout);
        delete window[callbackName];
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      }

      timeout = setTimeout(function() {
        cleanup();
        resolve([]); // Resolve with empty on timeout instead of rejecting
      }, 5000);

      script.onerror = function() {
        cleanup();
        resolve([]); // Resolve with empty on error
      };

      // Google's suggest API with JSONP
      script.src = 'https://suggestqueries.google.com/complete/search?client=chrome&q=' + 
                   encodeURIComponent(query) + '&callback=' + callbackName;
      document.head.appendChild(script);
    });
  }

  function showLoading() {
    resultsContainer.setAttribute('aria-busy', 'true');
    resultsContainer.innerHTML = 
      '<div class="loading">' +
        '<div class="loading-spinner" role="status" aria-label="Loading"></div>' +
        '<p>Searching what people google…</p>' +
      '</div>';
  }

  function showError(message) {
    resultsContainer.setAttribute('aria-busy', 'false');
    resultsContainer.innerHTML = '<div class="error" role="alert">' + escapeHtml(message) + '</div>';
  }

  function handleShare() {
    var shareUrl = window.location.origin + buildShareUrl();
    var query = searchInput.value.trim();

    if (navigator.share) {
      navigator.share({
        title: 'What People Google About ' + query,
        url: shareUrl
      }).catch(function(err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(shareUrl);
        }
      });
    } else {
      copyToClipboard(shareUrl);
    }
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(function() { showShareFeedback('Link copied!'); })
        .catch(function() { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showShareFeedback('Link copied!');
    } catch (e) {
      showShareFeedback('Could not copy link', true);
    }
    document.body.removeChild(textarea);
  }

  function showShareFeedback(message, isError) {
    // Remove any existing toast
    var existing = document.querySelector('.share-feedback');
    if (existing) existing.parentNode.removeChild(existing);

    var toast = document.createElement('div');
    toast.className = 'share-feedback';
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    if (isError) {
      toast.style.background = 'rgba(239, 68, 68, 0.95)';
      toast.style.color = '#fff';
    }

    document.body.appendChild(toast);

    // Trigger enter animation
    setTimeout(function() {
      toast.classList.add('visible');
    }, 10);

    // Auto-dismiss
    setTimeout(function() {
      toast.classList.remove('visible');
      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2000);
  }

  function renderHistory() {
    var history = getHistory();
    if (history.length === 0) return '';

    var html = '<div class="history-section">';
    html += '<div class="history-header">';
    html += '<h4>Recent Searches</h4>';
    html += '<button class="clear-history" type="button">Clear</button>';
    html += '</div>';
    html += '<div class="example-chips">';

    history.forEach(function(entry) {
      html += '<button class="example-chip history-chip" data-query="' +
        escapeHtml(entry.q) + '" data-category="' + escapeHtml(entry.c) +
        '" type="button">' + escapeHtml(entry.q) +
        '<span class="chip-category">' + escapeHtml(entry.c) + '</span></button>';
    });

    html += '</div></div>';
    return html;
  }

  function attachHistoryHandlers() {
    var historyChips = document.querySelectorAll('.history-chip');
    historyChips.forEach(function(chip) {
      chip.addEventListener('click', function() {
        searchInput.value = chip.dataset.query;
        var cat = chip.dataset.category;
        categoryTabs.forEach(function(t) {
          var isSelected = t.dataset.category === cat;
          t.classList.toggle('active', isSelected);
          t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
          t.setAttribute('tabindex', isSelected ? '0' : '-1');
        });
        currentCategory = cat;
        performSearch();
      });
    });

    var clearBtn = document.querySelector('.clear-history');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearHistory);
    }
  }

  function buildShareUrl() {
    var query = searchInput.value.trim();
    if (!query) return window.location.pathname;
    var params = new URLSearchParams();
    params.set('q', query);
    params.set('c', currentCategory);
    return window.location.pathname + '?' + params.toString();
  }

  function renderResults(query, results) {
    resultsContainer.setAttribute('aria-busy', 'false');
    
    // Filter out empty results
    var nonEmpty = results.filter(function(r) { return r.suggestions.length > 0; });

    if (nonEmpty.length === 0) {
      resultsContainer.innerHTML = 
        '<div class="empty-state">' +
          '<div class="icon" aria-hidden="true">' +
            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">' +
              '<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />' +
            '</svg>' +
          '</div>' +
          '<p>No autocomplete results found for "' + escapeHtml(query) + '"</p>' +
          '<p style="margin-top:12px;color:var(--neutral-400);">Try a different search term</p>' +
        '</div>';
      return;
    }

    var html = '<div class="results">';
    
    nonEmpty.forEach(function(result) {
      html += '<div class="result-card">';
      html += '<h3>' + escapeHtml(result.display) + '</h3>';
      html += '<ul class="suggestion-list">';
      
      result.suggestions.slice(0, 8).forEach(function(suggestion) {
        var formatted = formatSuggestion(suggestion, result.prefix, query);
        var searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(suggestion);
        html += '<li class="suggestion-item"><a href="' + searchUrl + '" target="_blank" rel="noopener noreferrer">' + formatted + '</a></li>';
      });
      
      html += '</ul>';
      html += '</div>';
    });
    
    html += '</div>';

    // Share button (static content, no user input)
    html += '<div class="share-actions">';
    html += '<button id="share-results-btn" class="share-btn" type="button" aria-label="Share these results">';
    html += '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="18" height="18" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"/></svg>';
    html += ' Share Results';
    html += '</button>';
    html += '</div>';

    resultsContainer.innerHTML = html;

    // Update browser URL to reflect current search
    if (window.history && window.history.replaceState) {
      history.replaceState(null, '', buildShareUrl());
    }

    // Add to search history
    addToHistory(query, currentCategory);

    // Attach share button handler
    var shareResultsBtn = document.getElementById('share-results-btn');
    if (shareResultsBtn) {
      shareResultsBtn.addEventListener('click', handleShare);
    }
  }

  function formatSuggestion(suggestion, prefix, query) {
    // Highlight the part after the prefix + query
    var lowerSuggestion = suggestion.toLowerCase();
    var searchStr = (prefix + ' ' + query).toLowerCase();
    
    if (lowerSuggestion.startsWith(searchStr)) {
      var before = suggestion.substring(0, searchStr.length);
      var after = suggestion.substring(searchStr.length);
      return escapeHtml(before) + '<b>' + escapeHtml(after) + '</b>';
    }
    
    return escapeHtml(suggestion);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

})();
