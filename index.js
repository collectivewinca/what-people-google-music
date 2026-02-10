// What People Google About Music - Entry Point
// A music-focused fork of anvaka's what-people-google

(function() {
  'use strict';

  // Question types to fetch
  var QUESTION_TYPES = [
    { id: 'why-is', prefix: 'why is', display: 'Why is [name] ...?' },
    { id: 'why-does', prefix: 'why does', display: 'Why does [name] ...?' },
    { id: 'is', prefix: 'is', display: 'Is [name] ...?' },
    { id: 'does', prefix: 'does', display: 'Does [name] ...?' },
    { id: 'how', prefix: 'how', display: 'How [name] ...?' },
    { id: 'when-will', prefix: 'when will', display: 'When will [name] ...?' },
    { id: 'can', prefix: 'can', display: 'Can [name] ...?' }
  ];

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
    // Category tab clicks
    categoryTabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        categoryTabs.forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentCategory = tab.dataset.category;
      });
    });

    // Example chip clicks
    exampleChips.forEach(function(chip) {
      chip.addEventListener('click', function() {
        searchInput.value = chip.dataset.query;
        // Set the category
        var cat = chip.dataset.category;
        categoryTabs.forEach(function(t) {
          t.classList.toggle('active', t.dataset.category === cat);
        });
        currentCategory = cat;
        performSearch();
      });
    });

    // Search button click
    searchBtn.addEventListener('click', performSearch);

    // Enter key in search input
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }

  function performSearch() {
    var query = searchInput.value.trim();
    if (!query || isLoading) return;

    isLoading = true;
    searchBtn.disabled = true;
    showLoading();

    // Fetch all question types sequentially with small delays to avoid rate limiting
    fetchAllQuestionTypes(query)
      .then(function(results) {
        renderResults(query, results);
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
    resultsContainer.innerHTML = 
      '<div class="loading">' +
        '<div class="loading-spinner"></div>' +
        '<p>Searching what people google...</p>' +
      '</div>';
  }

  function showError(message) {
    resultsContainer.innerHTML = '<div class="error">' + escapeHtml(message) + '</div>';
  }

  function renderResults(query, results) {
    // Filter out empty results
    var nonEmpty = results.filter(function(r) { return r.suggestions.length > 0; });

    if (nonEmpty.length === 0) {
      resultsContainer.innerHTML = 
        '<div class="empty-state">' +
          '<div class="emoji">🤷</div>' +
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
        html += '<li class="suggestion-item"><a href="' + searchUrl + '" target="_blank">' + formatted + '</a></li>';
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
