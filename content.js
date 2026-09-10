(() => {
  'use strict';

  const HOST_ID = 'search-switcher-host';
  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    emphasis: 'duckduckgo',
    theme: 'system'
  });

  const destinationFor = (name, query) => {
    const encoded = encodeURIComponent(query);
    return {
      duckduckgo: `https://duckduckgo.com/?q=${encoded}`,
      google: `https://www.google.com/search?q=${encoded}`,
      maps: `https://www.google.com/maps/search/?api=1&query=${encoded}`
    }[name];
  };

  const pageInfo = () => {
    const url = new URL(window.location.href);
    const query = url.searchParams.get('q')?.trim();
    // Google uses `tbm` and non-web `udm` values for verticals such as Images
    // and News. The switcher is intentionally limited to ordinary web results.
    const googleVertical = url.searchParams.has('tbm')
      || (url.searchParams.has('udm') && url.searchParams.get('udm') !== '14');
    const isGoogleSearch = url.hostname === 'www.google.com'
      && url.pathname === '/search'
      && !googleVertical;
    const isDuckDuckGo = url.hostname === 'duckduckgo.com' && url.pathname === '/';

    if (!query || (!isGoogleSearch && !isDuckDuckGo)) return null;
    return { query, current: isGoogleSearch ? 'google' : 'duckduckgo' };
  };

  const findInsertionPoint = (current) => {
    const selectors = current === 'google'
      ? ['form[role="search"]', 'form[action="/search"]']
      : ['form#search_form', 'form[action="/"]'];

    return selectors.map((selector) => document.querySelector(selector)).find(Boolean) || null;
  };

  const styles = `
    :host { all: initial; color-scheme: light dark; }
    .switcher {
      box-sizing: border-box; display: flex; align-items: center; gap: 8px;
      width: fit-content; max-width: calc(100vw - 32px); margin: 10px 0 12px;
      padding: 7px; border: 1px solid #c7c7c7; border-radius: 10px;
      background: #fff; color: #202124; box-shadow: 0 1px 3px rgba(0,0,0,.14);
      font: 500 13px/1.25 Arial, sans-serif;
    }
    .label { padding: 0 3px 0 2px; color: #5f6368; white-space: nowrap; }
    button {
      appearance: none; border: 1px solid #c7c7c7; border-radius: 7px; padding: 6px 9px;
      background: #fff; color: #202124; cursor: pointer; font: inherit; white-space: nowrap;
    }
    button:hover:not(:disabled) { background: #f1f3f4; }
    button:focus-visible { outline: 3px solid #1a73e8; outline-offset: 2px; }
    button:disabled { cursor: default; opacity: .66; }
    button.emphasis { border-color: #1a73e8; background: #e8f0fe; color: #174ea6; }
    :host([data-theme="dark"]) .switcher { background: #202124; color: #e8eaed; border-color: #5f6368; }
    :host([data-theme="dark"]) .label { color: #bdc1c6; }
    :host([data-theme="dark"]) button { background: #292a2d; color: #e8eaed; border-color: #5f6368; }
    :host([data-theme="dark"]) button:hover:not(:disabled) { background: #3c4043; }
    :host([data-theme="dark"]) button.emphasis { background: #174ea6; border-color: #8ab4f8; color: #fff; }
    @media (max-width: 540px) { .switcher { flex-wrap: wrap; } .label { width: 100%; } }
  `;

  let settings = { ...DEFAULT_SETTINGS };
  let lastUrl = '';
  let observer;

  const remove = () => document.getElementById(HOST_ID)?.remove();

  const render = (info) => {
    const existing = document.getElementById(HOST_ID);
    if (existing) existing.remove();

    const insertionPoint = findInsertionPoint(info.current);
    if (!insertionPoint) return false;

    const host = document.createElement('div');
    host.id = HOST_ID;
    host.dataset.theme = settings.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme;

    const root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = styles;
    const bar = document.createElement('nav');
    bar.className = 'switcher';
    bar.setAttribute('aria-label', 'Switch search destination');
    bar.innerHTML = '<span class="label">Search with</span>';

    [['duckduckgo', 'DuckDuckGo'], ['google', 'Google'], ['maps', 'Maps']].forEach(([name, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.disabled = name === info.current;
      button.setAttribute('aria-current', name === info.current ? 'page' : 'false');
      if (name === settings.emphasis && name !== info.current) button.classList.add('emphasis');
      button.addEventListener('click', () => window.location.assign(destinationFor(name, info.query)));
      bar.append(button);
    });

    root.append(style, bar);
    insertionPoint.insertAdjacentElement('afterend', host);
    return true;
  };

  const refresh = () => {
    const url = window.location.href;
    const info = pageInfo();
    if (!settings.enabled || !info) {
      remove();
      lastUrl = url;
      return;
    }

    if (url !== lastUrl || !document.getElementById(HOST_ID)) render(info);
    lastUrl = url;
  };

  const startObserving = () => {
    observer?.disconnect();
    observer = new MutationObserver(() => {
      if (settings.enabled && !document.getElementById(HOST_ID)) refresh();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };

  chrome.storage.local.get(DEFAULT_SETTINGS).then((stored) => {
    settings = { ...DEFAULT_SETTINGS, ...stored };
    startObserving();
    refresh();
    window.setInterval(refresh, 1000);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    Object.entries(changes).forEach(([key, change]) => { settings[key] = change.newValue; });
    lastUrl = '';
    refresh();
  });
})();
