(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  var NAV_BREAKPOINT = 860;

  if (!body || !doc.querySelector) return;

  if ((' ' + root.className + ' ').indexOf(' has-js ') < 0) {
    root.className += (root.className ? ' ' : '') + 'has-js';
  }

  function toArray(list) {
    return Array.prototype.slice.call(list || []);
  }

  function queryAll(selector, context) {
    return toArray((context || doc).querySelectorAll(selector));
  }

  function addClass(element, className) {
    if (!element) return;
    if (element.classList) {
      element.classList.add(className);
    } else if ((' ' + element.className + ' ').indexOf(' ' + className + ' ') < 0) {
      element.className += (element.className ? ' ' : '') + className;
    }
  }

  function removeClass(element, className) {
    var expression;

    if (!element) return;
    if (element.classList) {
      element.classList.remove(className);
      return;
    }

    expression = new RegExp('(^|\\s)' + className + '(?=\\s|$)', 'g');
    element.className = element.className.replace(expression, ' ').replace(/\s+/g, ' ').replace(/^\s|\s$/g, '');
  }

  function hasClass(element, className) {
    if (!element) return false;
    if (element.classList) return element.classList.contains(className);
    return (' ' + element.className + ' ').indexOf(' ' + className + ' ') >= 0;
  }

  function closest(element, selector) {
    var matches;

    if (!element) return null;
    if (element.closest) return element.closest(selector);

    matches = element.matches || element.msMatchesSelector || element.webkitMatchesSelector;
    while (element && element.nodeType === 1) {
      if (matches && matches.call(element, selector)) return element;
      element = element.parentNode;
      matches = element && (element.matches || element.msMatchesSelector || element.webkitMatchesSelector);
    }
    return null;
  }

  function empty(element) {
    if (!element) return;
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function setText(element, value) {
    if (!element) return;
    if (typeof element.textContent !== 'undefined') {
      element.textContent = value;
    } else {
      element.innerText = value;
    }
  }

  function isEditable(element) {
    var name;

    if (!element || element.nodeType !== 1) return false;
    name = element.tagName ? element.tagName.toLowerCase() : '';
    return name === 'input' || name === 'textarea' || name === 'select' || element.isContentEditable;
  }

  function currentScrollY() {
    return typeof window.pageYOffset === 'number'
      ? window.pageYOffset
      : (root.scrollTop || body.scrollTop || 0);
  }

  function requestFrame(callback) {
    return (window.requestAnimationFrame || function (handler) {
      return window.setTimeout(handler, 16);
    })(callback);
  }

  /* ------------------------------------------------------------------------
   * Mobile navigation
   * --------------------------------------------------------------------- */

  var navToggle = doc.querySelector('[data-nav-toggle]');
  var siteNav = doc.querySelector('[data-site-nav]') || doc.getElementById('site-nav');
  var navOpen = false;
  var mobileQuery = window.matchMedia ? window.matchMedia('(max-width: ' + NAV_BREAKPOINT + 'px)') : null;

  function isMobileNav() {
    return mobileQuery ? mobileQuery.matches : (window.innerWidth || root.clientWidth) <= NAV_BREAKPOINT;
  }

  function setNavHidden(hidden) {
    if (!siteNav) return;

    if (hidden) {
      siteNav.setAttribute('hidden', 'hidden');
      siteNav.setAttribute('aria-hidden', 'true');
    } else {
      siteNav.removeAttribute('hidden');
      siteNav.setAttribute('aria-hidden', 'false');
    }
  }

  function setNavState(open, restoreFocus) {
    var firstLink;

    if (!navToggle || !siteNav) return;

    navOpen = !!open;
    navToggle.setAttribute('aria-expanded', navOpen ? 'true' : 'false');

    if (navOpen) {
      setNavHidden(false);
      addClass(siteNav, 'is-open');
      addClass(body, 'nav-open');
      firstLink = siteNav.querySelector('a[href], button:not([disabled])');
      if (firstLink) window.setTimeout(function () { firstLink.focus(); }, 0);
    } else {
      removeClass(siteNav, 'is-open');
      removeClass(body, 'nav-open');
      setNavHidden(isMobileNav());
      if (restoreFocus) navToggle.focus();
    }
  }

  function syncNavToViewport() {
    if (!navToggle || !siteNav) return;

    navOpen = false;
    navToggle.setAttribute('aria-expanded', 'false');
    removeClass(siteNav, 'is-open');
    removeClass(body, 'nav-open');
    setNavHidden(isMobileNav());
  }

  if (navToggle && siteNav) {
    if (!siteNav.id) siteNav.id = 'site-nav';
    navToggle.setAttribute('aria-controls', siteNav.id);
    navToggle.setAttribute('aria-expanded', 'false');
    syncNavToViewport();

    navToggle.addEventListener('click', function () {
      setNavState(!navOpen, false);
    });

    siteNav.addEventListener('click', function (event) {
      if (closest(event.target, 'a[href]') && isMobileNav()) setNavState(false, false);
    });

    doc.addEventListener('click', function (event) {
      if (!navOpen || !isMobileNav()) return;
      if (!siteNav.contains(event.target) && !navToggle.contains(event.target)) setNavState(false, false);
    });

    if (mobileQuery && mobileQuery.addListener) {
      mobileQuery.addListener(syncNavToViewport);
    } else {
      window.addEventListener('resize', syncNavToViewport);
    }
  }

  /* ------------------------------------------------------------------------
   * Current navigation item
   * --------------------------------------------------------------------- */

  function normalizedPath(pathname) {
    var value = pathname || '/';

    try {
      value = decodeURIComponent(value);
    } catch (error) {
      /* A malformed URL should still be comparable in its encoded form. */
    }

    value = value.replace(/\/index\.html?$/i, '/').replace(/\/+/g, '/');
    if (value.length > 1) value = value.replace(/\/+$/, '');
    return value || '/';
  }

  function markCurrentNav() {
    var current = normalizedPath(window.location.pathname);
    var links = queryAll('[data-nav-link]', siteNav || doc);
    var best = null;
    var bestLength = -1;

    links.forEach(function (link) {
      var anchor = doc.createElement('a');
      var path;
      var exact;
      var section;

      anchor.href = link.href;
      if (anchor.host && anchor.host !== window.location.host) return;

      path = normalizedPath(anchor.pathname);
      exact = path === current;
      section = path !== '/' && current.indexOf(path + '/') === 0;

      if ((exact || section) && path.length > bestLength) {
        best = link;
        bestLength = path.length;
      }
    });

    if (best) {
      addClass(best, 'is-active');
      best.setAttribute('aria-current', 'page');
    }
  }

  markCurrentNav();

  /* ------------------------------------------------------------------------
   * Search dialog and local index
   * --------------------------------------------------------------------- */

  var searchPanel = doc.querySelector('[data-search-panel]') || doc.getElementById('search-panel');
  var searchOpeners = queryAll('[data-search-open]');
  var searchClosers = searchPanel ? queryAll('[data-search-close]', searchPanel) : [];
  var searchInput = searchPanel && (searchPanel.querySelector('[data-search-input]') || doc.getElementById('search-input'));
  var searchResults = searchPanel && (searchPanel.querySelector('[data-search-results]') || doc.getElementById('search-results'));
  var searchStatus = searchPanel && searchPanel.querySelector('[data-search-status]');
  var searchInline = !!(searchPanel && searchPanel.hasAttribute('data-search-inline'));
  var searchIsOpen = false;
  var searchIndex = null;
  var searchLoading = false;
  var searchLoadCallbacks = [];
  var lastFocused = null;
  var searchTimer = null;

  function mainScriptRoot() {
    var scripts = doc.getElementsByTagName('script');
    var index;
    var source;
    var anchor;
    var path;

    for (index = scripts.length - 1; index >= 0; index -= 1) {
      source = scripts[index].getAttribute('src') || '';
      if (!/(^|\/)js\/main(?:\.min)?\.js(?:[?#].*)?$/i.test(source)) continue;

      anchor = doc.createElement('a');
      anchor.href = source;
      path = anchor.pathname || source.split(/[?#]/)[0];
      return path.replace(/\/js\/main(?:\.min)?\.js$/i, '/');
    }

    return '/';
  }

  function searchIndexUrl() {
    var meta = doc.querySelector('meta[name="signal:search"]');
    var configured = searchPanel && (
      searchPanel.getAttribute('data-search-url') ||
      searchPanel.getAttribute('data-search-index')
    );
    var rootPath;

    if (!configured && meta) configured = meta.getAttribute('content');
    if (configured) return configured;

    rootPath = mainScriptRoot();
    return rootPath.replace(/\/?$/, '/') + 'search.json';
  }

  function safeArray(value, limit) {
    var output = [];

    if (!Array.isArray(value)) return output;
    value.slice(0, limit || 32).forEach(function (item) {
      if (item === null || typeof item === 'undefined') return;
      output.push(String(item).replace(/\s+/g, ' ').slice(0, 100));
    });
    return output;
  }

  function prepareEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;

    return {
      title: String(entry.title || 'UNTITLED_TRANSMISSION').replace(/\s+/g, ' ').slice(0, 300),
      path: String(entry.path || entry.url || ''),
      date: String(entry.date || '').slice(0, 32),
      excerpt: String(entry.excerpt || entry.content || '').replace(/\s+/g, ' ').slice(0, 2000),
      categories: safeArray(entry.categories, 32),
      tags: safeArray(entry.tags, 32)
    };
  }

  function finishIndexLoad(error, payload) {
    var callbacks = searchLoadCallbacks.slice();
    var list = payload;

    searchLoadCallbacks = [];
    searchLoading = false;

    if (!error) {
      if (payload && !Array.isArray(payload) && Array.isArray(payload.posts)) list = payload.posts;
      if (!Array.isArray(list)) {
        error = new Error('Invalid search index');
      } else {
        searchIndex = [];
        list.forEach(function (entry) {
          var prepared = prepareEntry(entry);
          if (prepared) searchIndex.push(prepared);
        });
      }
    }

    callbacks.forEach(function (callback) {
      callback(error, searchIndex);
    });
  }

  function loadWithXHR(url) {
    var request = new XMLHttpRequest();

    request.open('GET', url, true);
    request.setRequestHeader('Accept', 'application/json');
    request.onreadystatechange = function () {
      var payload;

      if (request.readyState !== 4) return;

      if ((request.status >= 200 && request.status < 300) || request.status === 0) {
        try {
          payload = JSON.parse(request.responseText);
          finishIndexLoad(null, payload);
        } catch (error) {
          finishIndexLoad(error);
        }
      } else {
        finishIndexLoad(new Error('Search index request failed'));
      }
    };
    request.onerror = function () {
      finishIndexLoad(new Error('Search index request failed'));
    };
    request.send(null);
  }

  function loadSearchIndex(callback) {
    var url;

    if (searchIndex) {
      callback(null, searchIndex);
      return;
    }

    searchLoadCallbacks.push(callback);
    if (searchLoading) return;

    searchLoading = true;
    url = searchIndexUrl();

    if (window.fetch) {
      window.fetch(url, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      }).then(function (response) {
        if (!response.ok) throw new Error('Search index request failed');
        return response.json();
      }).then(function (payload) {
        finishIndexLoad(null, payload);
      }).catch(function () {
        /* Fetch may exist but be unusable in an older embedded browser. */
        loadWithXHR(url);
      });
    } else {
      loadWithXHR(url);
    }
  }

  function normalizeSearchText(value) {
    var text = String(value || '').toLowerCase();

    if (text.normalize) {
      try {
        text = text.normalize('NFKC');
      } catch (error) {
        /* Unicode normalization is an optional search enhancement. */
      }
    }

    return text;
  }

  function entryScore(entry, query, tokens) {
    var title = normalizeSearchText(entry.title);
    var excerpt = normalizeSearchText(entry.excerpt);
    var tags = normalizeSearchText(entry.tags.join(' '));
    var categories = normalizeSearchText(entry.categories.join(' '));
    var searchable = [title, excerpt, tags, categories, normalizeSearchText(entry.date)].join(' ');
    var score = 0;
    var index;
    var token;

    for (index = 0; index < tokens.length; index += 1) {
      token = tokens[index];
      if (searchable.indexOf(token) < 0) return -1;
      if (title === token) score += 120;
      else if (title.indexOf(token) === 0) score += 70;
      else if (title.indexOf(token) >= 0) score += 45;
      if (tags.indexOf(token) >= 0) score += 25;
      if (categories.indexOf(token) >= 0) score += 20;
      if (excerpt.indexOf(token) >= 0) score += 8;
    }

    if (title.indexOf(query) >= 0) score += 35;
    return score;
  }

  function safeResultPath(value) {
    var path = String(value || '').replace(/[\u0000-\u001f\u007f]/g, '');
    var anchor;
    var protocol;

    if (!path || /^\s*(?:javascript|data|vbscript):/i.test(path) || /^\\\\/.test(path)) return '';

    anchor = doc.createElement('a');
    anchor.href = path;
    protocol = String(anchor.protocol || '').toLowerCase();

    if (protocol && protocol !== 'http:' && protocol !== 'https:') return '';
    if (anchor.host && anchor.host !== window.location.host) return '';
    return path;
  }

  function resultTaxonomies(entry) {
    var parts = [];

    entry.categories.forEach(function (name) {
      parts.push('[' + name.toUpperCase() + ']');
    });
    entry.tags.forEach(function (name) {
      parts.push('#' + name);
    });
    return parts.join(' ');
  }

  function createResult(entry) {
    var link = doc.createElement('a');
    var meta = doc.createElement('span');
    var title = doc.createElement('strong');
    var excerpt = doc.createElement('span');
    var taxonomies = doc.createElement('span');
    var date = entry.date ? entry.date.slice(0, 10).replace(/-/g, '.') : 'NO_DATE';

    link.className = 'search-result';
    link.setAttribute('role', 'listitem');
    link.href = safeResultPath(entry.path) || '#';

    meta.className = 'search-result__meta';
    setText(meta, date + ' // TRANSMISSION');

    title.className = 'search-result__title';
    setText(title, entry.title);

    excerpt.className = 'search-result__excerpt';
    setText(excerpt, entry.excerpt || 'NO_EXCERPT_AVAILABLE');

    taxonomies.className = 'search-result__taxonomies';
    setText(taxonomies, resultTaxonomies(entry));

    link.appendChild(meta);
    link.appendChild(title);
    link.appendChild(excerpt);
    if (taxonomies.textContent || taxonomies.innerText) link.appendChild(taxonomies);

    return link;
  }

  function renderSearch(query) {
    var normalized = normalizeSearchText(query).replace(/\s+/g, ' ').replace(/^\s|\s$/g, '').slice(0, 200);
    var tokens;
    var matches;

    empty(searchResults);

    if (!normalized) {
      setText(searchStatus, 'TYPE_TO_SCAN_THE_ARCHIVE');
      return;
    }

    if (!searchIndex) {
      setText(searchStatus, 'LOADING_LOCAL_INDEX\u2026');
      loadSearchIndex(function (error) {
        if (error) {
          setText(searchStatus, 'INDEX_OFFLINE // RETRY_LATER');
          return;
        }
        renderSearch(searchInput ? searchInput.value : normalized);
      });
      return;
    }

    tokens = normalized.split(' ');
    matches = searchIndex.map(function (entry, order) {
      return { entry: entry, score: entryScore(entry, normalized, tokens), order: order };
    }).filter(function (match) {
      return match.score >= 0;
    }).sort(function (left, right) {
      return right.score - left.score || left.order - right.order;
    }).slice(0, 20);

    if (!matches.length) {
      setText(searchStatus, '0 SIGNALS_FOUND // TRY_ANOTHER_QUERY');
      return;
    }

    searchResults.setAttribute('role', 'list');
    matches.forEach(function (match) {
      searchResults.appendChild(createResult(match.entry));
    });
    setText(searchStatus, matches.length + ' SIGNAL' + (matches.length === 1 ? '' : 'S') + '_FOUND');
  }

  function openSearch(trigger) {
    if (!searchPanel || !searchInput || !searchResults) return;

    if (searchInline) {
      searchInput.focus();
      if (!searchIndex && !searchLoading) {
        setText(searchStatus, 'LOADING_LOCAL_INDEX\u2026');
        loadSearchIndex(function (error, index) {
          if (error) {
            setText(searchStatus, 'INDEX_OFFLINE // RETRY_LATER');
          } else if (searchInput.value) {
            renderSearch(searchInput.value);
          } else {
            setText(searchStatus, 'INDEX_READY // ' + index.length + ' LOGS');
          }
        });
      }
      return;
    }

    if (searchIsOpen) {
      searchInput.focus();
      return;
    }

    if (navOpen) setNavState(false, false);
    lastFocused = trigger || doc.activeElement;
    searchIsOpen = true;
    searchPanel.removeAttribute('hidden');
    searchPanel.setAttribute('aria-hidden', 'false');
    addClass(searchPanel, 'is-open');
    addClass(body, 'search-open');
    searchOpeners.forEach(function (opener) {
      opener.setAttribute('aria-expanded', 'true');
    });

    window.setTimeout(function () {
      searchInput.focus();
      if (searchInput.select) searchInput.select();
    }, 0);

    if (!searchIndex && !searchLoading) {
      setText(searchStatus, 'LOADING_LOCAL_INDEX\u2026');
      loadSearchIndex(function (error, index) {
        if (error) {
          setText(searchStatus, 'INDEX_OFFLINE // RETRY_LATER');
        } else if (searchInput.value) {
          renderSearch(searchInput.value);
        } else {
          setText(searchStatus, 'INDEX_READY // ' + index.length + ' LOGS');
        }
      });
    }
  }

  function closeSearch(restoreFocus) {
    if (!searchPanel || searchInline || !searchIsOpen) return;

    searchIsOpen = false;
    removeClass(searchPanel, 'is-open');
    removeClass(body, 'search-open');
    searchPanel.setAttribute('aria-hidden', 'true');
    searchPanel.setAttribute('hidden', 'hidden');
    searchOpeners.forEach(function (opener) {
      opener.setAttribute('aria-expanded', 'false');
    });

    if (restoreFocus && lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  function focusableInSearch() {
    if (!searchPanel) return [];
    return queryAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      searchPanel.querySelector('[role="dialog"]') || searchPanel
    ).filter(function (element) {
      return !element.hasAttribute('hidden');
    });
  }

  if (searchPanel && searchInput && searchResults) {
    searchOpeners.forEach(function (opener) {
      opener.setAttribute('aria-controls', searchPanel.id || 'search-panel');
      opener.setAttribute('aria-expanded', 'false');
      opener.addEventListener('click', function () {
        openSearch(opener);
      });
    });

    searchClosers.forEach(function (closer) {
      closer.addEventListener('click', function () {
        closeSearch(true);
      });
    });

    searchInput.addEventListener('input', function () {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(function () {
        renderSearch(searchInput.value);
      }, 90);
    });

    searchResults.addEventListener('click', function (event) {
      if (closest(event.target, 'a[href]')) closeSearch(false);
    });
  }

  doc.addEventListener('keydown', function (event) {
    var key = event.key || '';
    var keyCode = event.keyCode;
    var focusable;
    var first;
    var last;

    if ((key === 'Escape' || keyCode === 27) && searchIsOpen) {
      event.preventDefault();
      closeSearch(true);
      return;
    }

    if ((key === 'Escape' || keyCode === 27) && navOpen) {
      event.preventDefault();
      setNavState(false, true);
      return;
    }

    if (searchIsOpen && (key === 'Tab' || keyCode === 9)) {
      focusable = focusableInSearch();
      if (!focusable.length) {
        event.preventDefault();
        searchInput.focus();
        return;
      }
      first = focusable[0];
      last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    if (!searchPanel || event.altKey) return;

    if (((key.toLowerCase && key.toLowerCase() === 'k') || keyCode === 75) && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      openSearch(doc.activeElement);
    } else if (!isEditable(event.target) && (key === '/' || keyCode === 191) && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      event.preventDefault();
      openSearch(doc.activeElement);
    }
  });

  /* ------------------------------------------------------------------------
   * Copy buttons for Hexo highlights and plain fenced code
   * --------------------------------------------------------------------- */

  function fallbackCopy(text) {
    var textarea = doc.createElement('textarea');
    var active = doc.activeElement;
    var succeeded = false;

    textarea.value = text;
    textarea.setAttribute('readonly', 'readonly');
    textarea.setAttribute('aria-hidden', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    body.appendChild(textarea);
    textarea.select();

    try {
      succeeded = doc.execCommand('copy');
    } catch (error) {
      succeeded = false;
    }

    body.removeChild(textarea);
    if (active && typeof active.focus === 'function') active.focus();
    return succeeded;
  }

  function copyText(text, callback) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(function () {
        callback(true);
      }).catch(function () {
        callback(fallbackCopy(text));
      });
    } else {
      callback(fallbackCopy(text));
    }
  }

  function copyButton(source) {
    var button = doc.createElement('button');
    var resetTimer;

    button.type = 'button';
    button.className = 'code-copy-button copy-code';
    button.setAttribute('data-copy-code', '');
    button.setAttribute('aria-label', '复制代码');
    setText(button, '[COPY]');

    button.addEventListener('click', function () {
      copyText(source.textContent || source.innerText || '', function (succeeded) {
        window.clearTimeout(resetTimer);
        setText(button, succeeded ? '[COPIED]' : '[FAILED]');
        button.setAttribute('aria-label', succeeded ? '代码已复制' : '复制失败');
        if (succeeded) addClass(button, 'is-copied');

        resetTimer = window.setTimeout(function () {
          setText(button, '[COPY]');
          button.setAttribute('aria-label', '复制代码');
          removeClass(button, 'is-copied');
        }, 1800);
      });
    });

    return button;
  }

  function installCopyButtons() {
    queryAll('figure.highlight').forEach(function (figure) {
      var source;

      if (figure.getAttribute('data-copy-ready') === 'true') return;
      source = figure.querySelector('td.code pre') || figure.querySelector('.code pre') || figure.querySelector('pre');
      if (!source) return;

      figure.setAttribute('data-copy-ready', 'true');
      addClass(figure, 'has-code-copy');
      figure.appendChild(copyButton(source));
    });

    queryAll('pre > code').forEach(function (code) {
      var pre = code.parentNode;
      var wrapper;

      if (closest(pre, 'figure.highlight') || pre.getAttribute('data-copy-ready') === 'true') return;
      if (!pre.parentNode) return;

      wrapper = doc.createElement('div');
      wrapper.className = 'code-block code-block--plain';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      wrapper.appendChild(copyButton(code));
      pre.setAttribute('data-copy-ready', 'true');
      addClass(pre, 'has-code-copy');
    });
  }

  installCopyButtons();

  /* ------------------------------------------------------------------------
   * Article reading progress
   * --------------------------------------------------------------------- */

  var progressBar = doc.querySelector('[data-reading-progress]');
  var articleContent = doc.querySelector('[data-article-content]');
  var progressTicking = false;

  function elementDocumentTop(element) {
    var top = 0;
    while (element) {
      top += element.offsetTop || 0;
      element = element.offsetParent;
    }
    return top;
  }

  function updateReadingProgress() {
    var viewport = window.innerHeight || root.clientHeight || 1;
    var scroll = currentScrollY();
    var start = articleContent ? elementDocumentTop(articleContent) : 0;
    var height = articleContent
      ? articleContent.offsetHeight
      : Math.max(body.scrollHeight, root.scrollHeight, body.offsetHeight, root.offsetHeight);
    var distance = Math.max(1, height - viewport);
    var progress = Math.max(0, Math.min(1, (scroll - start) / distance));

    progressBar.style.setProperty('--reading-progress', String(progress));
    root.style.setProperty('--reading-progress', String(progress));
    progressTicking = false;
  }

  function queueProgressUpdate() {
    if (!progressBar || progressTicking) return;
    progressTicking = true;
    requestFrame(updateReadingProgress);
  }

  if (progressBar) {
    updateReadingProgress();
    window.addEventListener('scroll', queueProgressUpdate);
    window.addEventListener('resize', queueProgressUpdate);
  }
}());
