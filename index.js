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

  // State
  var currentCategory = 'artist';
  var isLoading = false;

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
    var loadingStartTime = Date.now();
    showLoading();

    // Fetch all question types sequentially with small delays to avoid rate limiting
    fetchAllQuestionTypes(query)
      .then(function(results) {
        // Ensure minimum loading duration to prevent flicker
        var elapsed = Date.now() - loadingStartTime;
        var remaining = Math.max(0, MIN_LOADING_DURATION - elapsed);
        
        setTimeout(function() {
          renderResults(query, results);
        }, remaining);
      })
      .catch(function(err) {
        showError('Failed to fetch suggestions. Please try again.');
        console.error(err);
      })
      .finally(function() {
        isLoading = false;
        searchBtn.disabled = false;
      });
  }

  function fetchAllQuestionTypes(query) {
    return new Promise(function(resolve) {
      var results = [];
      var index = 0;

      function fetchNext() {
        if (index >= QUESTION_TYPES.length) {
          resolve(results);
          return;
        }

        var qt = QUESTION_TYPES[index];
        fetchSuggestions(qt.prefix + ' ' + query)
          .then(function(suggestions) {
            results.push({
              id: qt.id,
              display: qt.display.replace('[name]', query),
              prefix: qt.prefix,
              suggestions: suggestions
            });
          })
          .catch(function() {
            results.push({
              id: qt.id,
              display: qt.display.replace('[name]', query),
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
      var callbackName = 'ac_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
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

  function renderResults(query, results) {
    resultsContainer.setAttribute('aria-busy', 'false');
    
    // Filter out empty results
    var nonEmpty = results.filter(function(r) { return r.suggestions.length > 0; });

    if (nonEmpty.length === 0) {
      resultsContainer.innerHTML = 
        '<div class="empty-state">' +
          '<div class="emoji" aria-hidden="true">🤷</div>' +
          '<p>No autocomplete results found for "' + escapeHtml(query) + '"</p>' +
          '<p style="margin-top:10px;opacity:0.8">Try a different search term</p>' +
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
    resultsContainer.innerHTML = html;
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
