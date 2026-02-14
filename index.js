// What People Google About Music - Entry Point

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
  var REQUEST_BATCH_SIZE = 3;
  var QUICK_PICK_DELAY = 220;
  var DEFAULT_SUGGESTION_LIMIT = 8;
  var EXPANDED_SUGGESTION_LIMIT = 12;

  // DOM Elements
  var searchInput = document.getElementById('search-input');
  var searchBtn = document.getElementById('search-btn');
  var resultsContainer = document.getElementById('results-container');
  var categoryTabs = document.querySelectorAll('.category-tab');
  var quickPicksContainer = document.getElementById('quick-picks');

  // Valid categories for URL param validation
  var VALID_CATEGORIES = ['artist', 'song', 'genre', 'album'];

  // Curated discovery items for the landing grid
  var DISCOVERY_ITEMS = [
    { name: 'Taylor Swift', category: 'artist', emoji: '\uD83C\uDFB5' },
    { name: 'The Beatles', category: 'artist', emoji: '\uD83E\uDD1A' },
    { name: 'Drake', category: 'artist', emoji: '\uD83E\uDD89' },
    { name: 'BTS', category: 'artist', emoji: '\uD83D\uDC9C' },
    { name: 'Beyonce', category: 'artist', emoji: '\uD83D\uDC1D' },
    { name: 'Radiohead', category: 'artist', emoji: '\uD83D\uDCFB' },
    { name: 'Billie Eilish', category: 'artist', emoji: '\uD83D\uDDA4' },
    { name: 'Kanye West', category: 'artist', emoji: '\uD83D\uDCBF' },
    { name: 'Adele', category: 'artist', emoji: '\uD83C\uDFA4' },
    { name: 'Bad Bunny', category: 'artist', emoji: '\uD83D\uDC30' },
    { name: 'Kendrick Lamar', category: 'artist', emoji: '\uD83D\uDD25' },
    { name: 'Lady Gaga', category: 'artist', emoji: '\u2B50' },
    { name: 'Bohemian Rhapsody', category: 'song', emoji: '\uD83C\uDFB9' },
    { name: 'Stairway to Heaven', category: 'song', emoji: '\u2601\uFE0F' },
    { name: 'Imagine', category: 'song', emoji: '\u2764\uFE0F' },
    { name: 'Smells Like Teen Spirit', category: 'song', emoji: '\uD83E\uDDEA' },
    { name: 'Hotel California', category: 'song', emoji: '\uD83C\uDFE8' },
    { name: 'Shape of You', category: 'song', emoji: '\uD83D\uDC83' },
    { name: 'Despacito', category: 'song', emoji: '\u2600\uFE0F' },
    { name: 'Blinding Lights', category: 'song', emoji: '\uD83D\uDCA1' },
    { name: 'Yesterday', category: 'song', emoji: '\uD83D\uDCC5' },
    { name: 'Thriller', category: 'song', emoji: '\uD83D\uDC7B' },
    { name: 'Hip Hop', category: 'genre', emoji: '\uD83C\uDFA4' },
    { name: 'Jazz', category: 'genre', emoji: '\uD83C\uDFB7' },
    { name: 'Classical', category: 'genre', emoji: '\uD83C\uDFBB' },
    { name: 'K-Pop', category: 'genre', emoji: '\uD83C\uDDF0\uD83C\uDDF7' },
    { name: 'Reggaeton', category: 'genre', emoji: '\uD83C\uDFDD\uFE0F' },
    { name: 'Country', category: 'genre', emoji: '\uD83E\uDE95' },
    { name: 'EDM', category: 'genre', emoji: '\uD83D\uDD0A' },
    { name: 'R&B', category: 'genre', emoji: '\uD83D\uDC9F' },
    { name: 'Metal', category: 'genre', emoji: '\uD83E\uDD18' },
    { name: 'Punk', category: 'genre', emoji: '\u26A1' },
    { name: 'Thriller', category: 'album', emoji: '\uD83C\uDF15' },
    { name: 'Abbey Road', category: 'album', emoji: '\uD83D\uDEB6' },
    { name: 'The Dark Side of the Moon', category: 'album', emoji: '\uD83C\uDF11' },
    { name: 'Rumours', category: 'album', emoji: '\uD83D\uDCAC' },
    { name: 'Back in Black', category: 'album', emoji: '\u26A1' },
    { name: 'Born to Die', category: 'album', emoji: '\uD83C\uDF39' },
    { name: '1989', category: 'album', emoji: '\uD83D\uDCF7' },
    { name: 'Good Kid M.A.A.D City', category: 'album', emoji: '\uD83C\uDFD9\uFE0F' }
  ];

  // Cache settings
  var CACHE_PREFIX = 'wpg_';
  var CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  var HISTORY_KEY = 'wpg_history';
  var MAX_HISTORY = 8;

  // State
  var currentCategory = 'artist';
  var isLoading = false;
  var callbackCounter = 0;
  var quickPickTimer = null;
  var quickPickRequestId = 0;
  var showMoreSuggestions = false;
  var exactMatchBias = false;

  // Theme definitions
  var THEMES = {
    light: {
      hex: '#FF5722',
      bright: '#ff6e40',
      mode: 'light',
      bg: '#f7f2ee',
      bgCard: '#ffffff',
      bgInput: '#ffffff',
      text: '#2f241d',
      muted: '#7b685d',
      border: 'rgba(255, 87, 34, 0.35)',
      borderBright: 'rgba(255, 87, 34, 0.65)'
    },
    miny: {
      hex: '#FF5722',
      bright: '#ff6e40',
      mode: 'dark',
      bg: '#0d0d0d',
      bgCard: '#141414',
      bgInput: '#0a0a0a'
    },
    matrix: {
      hex: '#6cef39',
      bright: '#8fff5e',
      mode: 'dark',
      bg: '#0b0f0b',
      bgCard: '#111711',
      bgInput: '#090d09'
    },
    amber: {
      hex: '#fbbf24',
      bright: '#fcd34d',
      mode: 'dark',
      bg: '#12100b',
      bgCard: '#1a1710',
      bgInput: '#100e09'
    },
    dank: {
      hex: '#00E5FF',
      bright: '#18FFFF',
      mode: 'dark',
      bg: '#090e11',
      bgCard: '#10181d',
      bgInput: '#090f13'
    },
    phosphor: {
      hex: '#00ff41',
      bright: '#33ff66',
      mode: 'dark',
      bg: '#091009',
      bgCard: '#101910',
      bgInput: '#070d07'
    }
  };

  var THEME_KEY = 'wpg_theme';
  var RESULT_PREFS_KEY = 'wpg_result_prefs';
  var DEFAULT_THEME = 'light';

  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    };
  }

  function applyTheme(themeId) {
    var theme = THEMES[themeId];
    if (!theme) return;

    var c = hexToRgb(theme.hex);
    var rgb = c.r + ',' + c.g + ',' + c.b;

    var root = document.documentElement;
    var body = document.body;
    var label = document.getElementById('theme-label-value');

    var textColor = theme.text || 'rgba(' + rgb + ',0.9)';
    var mutedColor = theme.muted || 'rgba(' + rgb + ',0.5)';
    var borderColor = theme.border || 'rgba(' + rgb + ',0.25)';
    var borderBrightColor = theme.borderBright || 'rgba(' + rgb + ',0.6)';

    root.style.setProperty('--phosphor', theme.hex);
    root.style.setProperty('--phosphor-bright', theme.bright);
    root.style.setProperty('--phosphor-dim', 'rgba(' + rgb + ',0.3)');
    root.style.setProperty('--phosphor-glow', 'rgba(' + rgb + ',0.15)');
    root.style.setProperty('--phosphor-text', textColor);
    root.style.setProperty('--phosphor-muted', mutedColor);
    root.style.setProperty('--phosphor-shadow', 'rgba(' + rgb + ',0.4)');
    root.style.setProperty('--phosphor-subtle', 'rgba(' + rgb + ',0.08)');
    root.style.setProperty('--phosphor-tint', 'rgba(' + rgb + ',0.05)');
    root.style.setProperty('--border', borderColor);
    root.style.setProperty('--border-bright', borderBrightColor);
    root.style.setProperty('--bg', theme.bg || '#0d0d0d');
    root.style.setProperty('--bg-card', theme.bgCard || '#141414');
    root.style.setProperty('--bg-input', theme.bgInput || '#0a0a0a');

    root.style.colorScheme = theme.mode === 'light' ? 'light' : 'dark';
    if (body) {
      body.classList.toggle('light-mode', theme.mode === 'light');
    }

    var themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme.bg || '#0d0d0d');
    }

    if (label) {
      label.textContent = themeId;
    }

    var dots = document.querySelectorAll('.theme-dot');
    dots.forEach(function(dot) {
      dot.classList.toggle('active', dot.dataset.theme === themeId);
    });

    try { localStorage.setItem(THEME_KEY, themeId); } catch(e) {}
  }

  function initTheme() {
    var initialTheme = DEFAULT_THEME;

    try {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved && THEMES[saved]) {
        initialTheme = saved;
      }
    } catch(e) {}

    applyTheme(initialTheme);

    var dots = document.querySelectorAll('.theme-dot');
    dots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        applyTheme(dot.dataset.theme);
      });
    });
  }

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
    loadResultPrefs();

    // Category tab clicks and keyboard navigation
    categoryTabs.forEach(function(tab, index) {
      tab.addEventListener('click', function() {
        selectTab(tab);
        scheduleQuickPicks(searchInput.value.trim());
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

    // Search button click
    searchBtn.addEventListener('click', performSearch);

    // Enter key in search input (use keydown, not deprecated keypress)
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });

    searchInput.addEventListener('input', function() {
      scheduleQuickPicks(searchInput.value.trim());
    });

    // Initialize tab indices
    categoryTabs.forEach(function(tab, index) {
      tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    // Render initial empty state with discovery grid and history
    renderEmptyState();
    renderQuickPicks([], '');

    // Keyboard shortcut: "/" focuses search input
    document.addEventListener('keydown', function(e) {
      if (e.key === '/' &&
          document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'TEXTAREA' &&
          !document.activeElement.isContentEditable) {
        e.preventDefault();
        searchInput.focus();
      }
    });

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
    } else {
      scheduleQuickPicks(searchInput.value.trim());
    }

    // Initialize theme
    initTheme();
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

  function loadResultPrefs() {
    try {
      var prefs = JSON.parse(localStorage.getItem(RESULT_PREFS_KEY) || '{}');
      showMoreSuggestions = prefs.showMoreSuggestions === true;
      exactMatchBias = prefs.exactMatchBias === true;
    } catch (e) {
      showMoreSuggestions = false;
      exactMatchBias = false;
    }
  }

  function saveResultPrefs() {
    try {
      localStorage.setItem(RESULT_PREFS_KEY, JSON.stringify({
        showMoreSuggestions: showMoreSuggestions,
        exactMatchBias: exactMatchBias
      }));
    } catch (e) {
    }
  }

  function scheduleQuickPicks(query) {
    if (!quickPicksContainer) return;

    if (quickPickTimer) {
      clearTimeout(quickPickTimer);
      quickPickTimer = null;
    }

    if (!query || query.length < 2) {
      quickPickRequestId++;
      renderQuickPicks([], query);
      return;
    }

    quickPickTimer = setTimeout(function() {
      fetchQuickPicks(query, currentCategory);
    }, QUICK_PICK_DELAY);
  }

  function fetchQuickPicks(query, category) {
    var requestId = ++quickPickRequestId;
    var quickPickQuery = buildQuickPickQuery(query, category);

    fetchSuggestions(quickPickQuery)
      .then(function(suggestions) {
        if (requestId !== quickPickRequestId) return;

        var normalizedQuery = query.toLowerCase();
        var seen = {};
        var picks = suggestions.filter(function(item) {
          var normalizedItem = String(item).toLowerCase();
          if (seen[normalizedItem]) return false;
          if (normalizedItem.indexOf(normalizedQuery) === -1) return false;
          seen[normalizedItem] = true;
          return true;
        }).slice(0, 5);

        renderQuickPicks(picks, query);
      })
      .catch(function() {
        if (requestId !== quickPickRequestId) return;
        renderQuickPicks([], query);
      });
  }

  function buildQuickPickQuery(query, category) {
    if (category === 'artist') {
      return query;
    }
    return query + ' ' + category;
  }

  function renderQuickPicks(picks, query) {
    if (!quickPicksContainer) return;

    if (!query || query.length < 2) {
      quickPicksContainer.innerHTML = '<span class="quick-picks-empty">Type 2+ characters for quick picks.</span>';
      return;
    }

    if (!picks || picks.length === 0) {
      quickPicksContainer.innerHTML = '<span class="quick-picks-empty">No quick picks yet. Press Enter to run full search.</span>';
      return;
    }

    var html = '';
    picks.forEach(function(pick) {
      html += '<button class="quick-pick" type="button" data-query="' + escapeHtml(String(pick)) + '">' +
        escapeHtml(String(pick)) + '</button>';
    });
    quickPicksContainer.innerHTML = html;

    var quickPickButtons = quickPicksContainer.querySelectorAll('.quick-pick');
    quickPickButtons.forEach(function(button) {
      button.addEventListener('click', function() {
        searchInput.value = button.dataset.query;
        performSearch();
      });
    });
  }

  function performSearch() {
    var query = searchInput.value.trim();
    if (!query || isLoading) return;

    scheduleQuickPicks(query);

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

    // Fetch all question types in small parallel batches to balance speed and reliability
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
    var pending = QUESTION_TYPES.map(function(qt, index) {
      return { qt: qt, index: index };
    });
    var results = new Array(pending.length);

    function fetchQuestionType(item) {
      var qt = item.qt;
      return fetchSuggestions(buildQuery(qt.prefix, query, category))
        .then(function(suggestions) {
          results[item.index] = {
            id: qt.id,
            display: qt.display.split('[name]').join(query),
            prefix: qt.prefix,
            suggestions: suggestions
          };
        })
        .catch(function() {
          results[item.index] = {
            id: qt.id,
            display: qt.display.split('[name]').join(query),
            prefix: qt.prefix,
            suggestions: []
          };
        });
    }

    function runBatch(startIndex) {
      if (startIndex >= pending.length) {
        return Promise.resolve(results);
      }

      var batch = pending.slice(startIndex, startIndex + REQUEST_BATCH_SIZE);
      return Promise.all(batch.map(fetchQuestionType)).then(function() {
        return new Promise(function(resolve) {
          setTimeout(function() {
            resolve(runBatch(startIndex + REQUEST_BATCH_SIZE));
          }, 80);
        });
      });
    }

    return runBatch(0);
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
    transitionState(function() {
      resultsContainer.innerHTML =
        '<div class="loading state-enter">' +
          '<div class="loading-spinner" role="status" aria-label="Loading"></div>' +
          '<p>> querying google autocomplete\u2026</p>' +
        '</div>';
    });
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
    html += '<h4>> HISTORY</h4>';
    html += '<button class="clear-history" type="button">[clear]</button>';
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
        triggerSearchFromChip(chip.dataset.query, chip.dataset.category);
      });
    });

    var clearBtn = document.querySelector('.clear-history');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearHistory);
    }
  }

  function triggerSearchFromChip(query, category) {
    searchInput.value = query;
    categoryTabs.forEach(function(t) {
      var isSelected = t.dataset.category === category;
      t.classList.toggle('active', isSelected);
      t.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      t.setAttribute('tabindex', isSelected ? '0' : '-1');
    });
    currentCategory = category;
    performSearch();
  }

  function renderEmptyState() {
    var html = '<div class="empty-state">';
    html += '<pre class="ascii-art" aria-hidden="true">';
    html += '+--------------------------------------------------+\n';
    html += '| WHAT PEOPLE GOOGLE MUSIC                         |\n';
    html += '| MINY EDITION                                     |\n';
    html += '| MINY  __  __ ___ _   ___   __                    |\n';
    html += '|      |  \\/  |_ _| \ | \ \ / /                    |\n';
    html += '|      | |\\/| || ||  \\| |\\ V /                     |\n';
    html += '|      |_|  |_|___|_|\\__| |_|                     |\n';
    html += '+--------------------------------------------------+</pre>';
    html += '<p>> enter any artist, song, genre, or album<br>> see what the world is searching_</p>';

    // Recent searches
    var historyHtml = renderHistory();
    if (historyHtml) {
      html += historyHtml;
    }

    // Discovery grid
    html += '<div class="discovery-header"><h4>> DISCOVER</h4></div>';
    html += '<div class="discovery-grid">';

    DISCOVERY_ITEMS.forEach(function(item, idx) {
      html += '<button class="discovery-card card-enter" style="animation-delay:' + (idx * 0.03) + 's" ' +
              'data-query="' + escapeHtml(item.name) + '" data-category="' + escapeHtml(item.category) + '" type="button">';
      html += '<span class="discovery-card-emoji" aria-hidden="true">' + item.emoji + '</span>';
      html += '<span class="discovery-card-name">' + escapeHtml(item.name) + '</span>';
      html += '<span class="discovery-card-badge">' + escapeHtml(item.category) + '</span>';
      html += '</button>';
    });

    html += '</div></div>';

    resultsContainer.innerHTML = html;
    attachDiscoveryHandlers();
    attachHistoryHandlers();
  }

  function attachDiscoveryHandlers() {
    var cards = document.querySelectorAll('.discovery-card');
    cards.forEach(function(card) {
      card.addEventListener('click', function() {
        triggerSearchFromChip(card.dataset.query, card.dataset.category);
      });
    });
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
      var fallbackSearches = getFallbackSearches(query, currentCategory);
      transitionState(function() {
        var noResultsHtml =
          '<div class="empty-state state-enter">' +
            '<p>> no results found for "' + escapeHtml(query) + '"</p>' +
            '<p style="margin-top:12px;">> try one of these_</p>' +
            '<div class="no-results-actions">';

        fallbackSearches.forEach(function(fallback) {
          noResultsHtml += '<button class="example-chip fallback-chip" type="button" data-query="' +
            escapeHtml(fallback.query) + '" data-category="' + escapeHtml(fallback.category) + '">' +
            escapeHtml(fallback.label) + '</button>';
        });

        noResultsHtml +=
            '</div>' +
          '</div>';

        resultsContainer.innerHTML = noResultsHtml;
        attachFallbackHandlers();
      });
      return;
    }

    var html = '<div class="results">';

    html += '<div class="results-toolbar card-enter" style="animation-delay:0s">';
    html += '<button id="toggle-suggestion-limit" class="results-toggle' + (showMoreSuggestions ? ' active' : '') + '" type="button">';
    html += showMoreSuggestions ? 'Show fewer' : 'Show more';
    html += '</button>';
    html += '<button id="toggle-exact-bias" class="results-toggle' + (exactMatchBias ? ' active' : '') + '" type="button">';
    html += exactMatchBias ? 'Exact bias on' : 'Exact bias off';
    html += '</button>';
    html += '</div>';

    nonEmpty.forEach(function(result, idx) {
      var renderedSuggestions = applySuggestionPreferences(result.suggestions, result.prefix, query);
      html += '<div class="result-card card-enter" style="animation-delay:' + (idx * 0.07) + 's">';
      html += '<h3>' + escapeHtml(result.display) + '</h3>';
      html += '<ul class="suggestion-list">';

      renderedSuggestions.forEach(function(suggestion) {
        var formatted = formatSuggestion(suggestion, result.prefix, query);
        var searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(suggestion);
        html += '<li class="suggestion-item"><a href="' + searchUrl + '" target="_blank" rel="noopener noreferrer">' + formatted + '</a></li>';
      });

      html += '</ul>';
      html += '</div>';
    });

    html += '</div>';

    // Share button
    html += '<div class="share-actions card-enter" style="animation-delay:' + (nonEmpty.length * 0.07) + 's">';
    html += '<button id="share-results-btn" class="share-btn" type="button" aria-label="Share these results">';
    html += '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="18" height="18" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"/></svg>';
    html += ' Share Results';
    html += '</button>';
    html += '</div>';

    transitionState(function() {
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

      var toggleSuggestionLimitBtn = document.getElementById('toggle-suggestion-limit');
      if (toggleSuggestionLimitBtn) {
        toggleSuggestionLimitBtn.addEventListener('click', function() {
          showMoreSuggestions = !showMoreSuggestions;
          saveResultPrefs();
          renderResults(query, results);
        });
      }

      var toggleExactBiasBtn = document.getElementById('toggle-exact-bias');
      if (toggleExactBiasBtn) {
        toggleExactBiasBtn.addEventListener('click', function() {
          exactMatchBias = !exactMatchBias;
          saveResultPrefs();
          renderResults(query, results);
        });
      }
    });
  }

  function applySuggestionPreferences(suggestions, prefix, query) {
    var limited = suggestions.slice();
    if (exactMatchBias) {
      limited = sortSuggestionsWithBias(limited, prefix, query);
    }

    var limit = showMoreSuggestions ? EXPANDED_SUGGESTION_LIMIT : DEFAULT_SUGGESTION_LIMIT;
    return limited.slice(0, limit);
  }

  function sortSuggestionsWithBias(suggestions, prefix, query) {
    var normalizedPrefixQuery = (prefix + ' ' + query).toLowerCase();
    var normalizedQuery = query.toLowerCase();

    function scoreSuggestion(suggestion) {
      var lower = String(suggestion).toLowerCase();
      var score = 0;
      if (lower.indexOf(normalizedPrefixQuery) === 0) score += 6;
      if (lower.indexOf(normalizedQuery) === 0) score += 3;
      if (lower.indexOf(' ' + normalizedQuery + ' ') !== -1) score += 2;
      if (lower.indexOf(normalizedQuery) !== -1) score += 1;
      return score;
    }

    return suggestions
      .map(function(suggestion, index) {
        return {
          suggestion: suggestion,
          score: scoreSuggestion(suggestion),
          index: index
        };
      })
      .sort(function(a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return a.index - b.index;
      })
      .map(function(item) {
        return item.suggestion;
      });
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

  function getFallbackSearches(query, category) {
    var options = [];
    var dedupe = {};

    function addOption(label, nextQuery, nextCategory) {
      var key = nextQuery.toLowerCase() + '|' + nextCategory;
      if (!nextQuery || dedupe[key]) return;
      dedupe[key] = true;
      options.push({
        label: label,
        query: nextQuery,
        category: nextCategory
      });
    }

    var simplified = query
      .replace(/[^\w\s\-\.'&]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (simplified && simplified.toLowerCase() !== query.toLowerCase()) {
      addOption('Try "' + simplified + '"', simplified, category);
    }

    var sameCategoryDiscovery = DISCOVERY_ITEMS.find(function(item) {
      return item.category === category && item.name.toLowerCase() !== query.toLowerCase();
    });

    if (sameCategoryDiscovery) {
      addOption('Try "' + sameCategoryDiscovery.name + '"', sameCategoryDiscovery.name, category);
    }

    var categoryIndex = VALID_CATEGORIES.indexOf(category);
    var nextCategory = VALID_CATEGORIES[(categoryIndex + 1) % VALID_CATEGORIES.length];
    addOption('Search this as ' + nextCategory, query, nextCategory);

    return options.slice(0, 3);
  }

  function attachFallbackHandlers() {
    var fallbackChips = document.querySelectorAll('.fallback-chip');
    fallbackChips.forEach(function(chip) {
      chip.addEventListener('click', function() {
        triggerSearchFromChip(chip.dataset.query, chip.dataset.category);
      });
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function transitionState(newContentFn) {
    var current = resultsContainer.firstElementChild;
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!current || prefersReducedMotion) {
      newContentFn();
      return;
    }

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      newContentFn();
    }

    current.classList.add('state-exit');
    current.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 250);
  }

})();
