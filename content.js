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
    const isMapsSearch = url.hostname === 'www.google.com'
      && (url.pathname === '/maps/search' || url.pathname.startsWith('/maps/search/'));
    const isMapsPlace = url.hostname === 'www.google.com'
      && url.pathname.startsWith('/maps/place/');
    const isMaps = isMapsSearch || isMapsPlace;
    let mapsPathQuery = '';
    if (isMaps) {
      const prefix = isMapsSearch ? '/maps/search/' : '/maps/place/';
      const segment = url.pathname.slice(prefix.length).split('/')[0];
      try { mapsPathQuery = decodeURIComponent(segment.replace(/\+/g, ' ')); }
      catch { mapsPathQuery = ''; }
    }
    const query = (isMaps
      ? (url.searchParams.get('query') || mapsPathQuery)
      : url.searchParams.get('q'))?.trim();
    // Google uses `tbm` and non-web `udm` values for verticals such as Images
    // and News. The switcher is intentionally limited to ordinary web results.
    const googleVertical = url.searchParams.has('tbm')
      || (url.searchParams.has('udm') && url.searchParams.get('udm') !== '14');
    const isGoogleSearch = url.hostname === 'www.google.com'
      && url.pathname === '/search'
      && !googleVertical;
    const isDuckDuckGo = url.hostname === 'duckduckgo.com' && url.pathname === '/';

    if (!query || (!isGoogleSearch && !isDuckDuckGo && !isMaps)) return null;
    return { query, current: isMaps ? 'maps' : isGoogleSearch ? 'google' : 'duckduckgo' };
  };

  const findSearchForm = (current) => {
    if (current === 'maps') {
      return document.querySelector('div[role="search"] input[name="q"]')?.closest('form') || null;
    }
    const selectors = current === 'google'
      ? ['form[role="search"]', 'form[action="/search"]']
      : ['form#search_form', 'form[action="/"]'];

    return selectors.map((selector) => document.querySelector(selector)).find(Boolean) || null;
  };

  const currentQuery = (info) => {
    const selector = info.current === 'google'
      ? 'textarea[name="q"], input[name="q"]'
      : info.current === 'maps' ? 'div[role="search"] input[name="q"]' : '#search_form_input';
    const input = document.querySelector(selector);
    return input ? input.value.trim() : info.query;
  };

  const visibleSubmitButton = (form) => {
    const button = form.querySelector('button[type="submit"], button[aria-label="Search"], button[aria-label="Buscar"]');
    if (!button) return null;
    const style = window.getComputedStyle(button);
    return style.display !== 'none' && style.visibility !== 'hidden' && button.getClientRects().length ? button : null;
  };

  const styles = `
    :host { all: initial; color-scheme: light dark; }
    .switcher { position: relative; display: inline-flex;
      font: 500 13px/1.25 Arial, sans-serif;
    }
    button { appearance: none; font: inherit; white-space: nowrap; cursor: pointer; }
    .trigger {
      display: inline-flex; align-items: center; gap: 5px; min-height: 32px; padding: 6px 9px;
      border: 1px solid #c7c7c7; border-radius: 8px; background: #fff; color: #202124;
    }
    .trigger:hover, .trigger[aria-expanded="true"] { background: #f1f3f4; }
    .maps-trigger {
      width: 32px; height: 32px; min-height: 32px; padding: 0; justify-content: center;
      border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,.18); font-size: 18px;
    }
    button:focus-visible { outline: 3px solid #1a73e8; outline-offset: 2px; }
    .icon { font-size: 16px; line-height: 1; }
    .ddg-primary, .ddg-more {
      min-height: 30px; border: 1px solid #777; background: transparent; color: #202124;
    }
    .ddg-primary { border-radius: 7px 0 0 7px; padding: 5px 8px; }
    .ddg-more { border-left: 0; border-radius: 0 7px 7px 0; padding: 5px 7px; }
    .ddg-primary:hover, .ddg-more:hover, .ddg-more[aria-expanded="true"] { background: rgba(127,127,127,.16); }
    .short-label { display: none; }
    .menu {
      position: absolute; z-index: 2147483647; top: calc(100% + 6px); right: 0; display: none;
      min-width: 156px; padding: 5px; border: 1px solid #c7c7c7; border-radius: 10px;
      background: #fff; box-shadow: 0 4px 14px rgba(0,0,0,.18);
    }
    .menu.open { display: grid; gap: 2px; }
    .menu button { border: 0; border-radius: 6px; padding: 8px 9px; background: transparent; color: #202124; text-align: left; }
    .menu button:hover:not(:disabled), .menu button.emphasis { background: #e8f0fe; color: #174ea6; }
    .menu button:disabled { cursor: default; opacity: .6; }
    :host([data-theme="dark"]) .trigger, :host([data-theme="dark"]) .menu { background: #292a2d; color: #e8eaed; border-color: #5f6368; }
    :host([data-theme="dark"]) .trigger:hover, :host([data-theme="dark"]) .trigger[aria-expanded="true"] { background: #3c4043; }
    :host([data-theme="dark"]) .menu button { color: #e8eaed; }
    :host([data-theme="dark"]) .menu button:hover:not(:disabled), :host([data-theme="dark"]) .menu button.emphasis { background: #174ea6; color: #fff; }
    :host([data-theme="dark"]) .ddg-primary, :host([data-theme="dark"]) .ddg-more { color: #e8eaed; border-color: #777; }
    @media (max-width: 540px) { .trigger .label { display: none; } .trigger { min-width: 32px; justify-content: center; padding: 6px; } }
    @media (max-width: 540px) { .long-label { display: none; } .short-label { display: inline; } }
  `;

  let settings = { ...DEFAULT_SETTINGS };
  let lastUrl = '';
  let observer;

  const remove = () => {
    const host = document.getElementById(HOST_ID);
    host?.searchSwitcherCleanup?.();
    host?.remove();
  };

  const render = (info) => {
    remove();

    const form = findSearchForm(info.current);
    if (!form) return false;

    const host = document.createElement('div');
    host.id = HOST_ID;
    const rightOffset = info.current === 'duckduckgo' ? 82 : 150;
    host.style.cssText = info.current === 'maps'
      ? 'display:inline-flex;position:absolute;left:calc(100% + 3px);top:50%;transform:translateY(-50%);z-index:2147483647;'
      : `display:inline-flex;position:absolute;right:${rightOffset}px;top:50%;transform:translateY(-50%);z-index:2147483647;`;
    host.dataset.theme = settings.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme;

    const root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = styles;
    const bar = document.createElement('div');
    bar.className = 'switcher';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.setAttribute('aria-label', 'Choose search destination');
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    if (info.current === 'duckduckgo') {
      const primary = document.createElement('button');
      primary.className = 'ddg-primary';
      primary.type = 'button';
      primary.setAttribute('aria-label', 'Search on Google');
      primary.innerHTML = '<span class="long-label">Google</span><span class="short-label" aria-hidden="true">G</span>';
      primary.addEventListener('click', () => {
        const query = currentQuery(info);
        if (query) window.location.assign(destinationFor('google', query));
      });
      bar.append(primary);
      trigger.className = 'ddg-more';
      trigger.textContent = '▾';
    } else if (info.current === 'maps') {
      trigger.className = 'trigger maps-trigger';
      trigger.textContent = '⇄';
      trigger.title = 'Switch search destination';
    } else {
      trigger.className = 'trigger';
      trigger.innerHTML = '<span class="icon" aria-hidden="true">↔</span><span class="label">Switch</span>';
    }
    const menu = document.createElement('div');
    menu.className = 'menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Search destinations');

    const setOpen = (open) => {
      menu.classList.toggle('open', open);
      trigger.setAttribute('aria-expanded', String(open));
    };
    trigger.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.focus();
      }
    });

    [['duckduckgo', 'DuckDuckGo'], ['google', 'Google'], ['maps', 'Maps']].forEach(([name, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.setAttribute('role', 'menuitem');
      button.disabled = name === info.current;
      button.setAttribute('aria-current', name === info.current ? 'page' : 'false');
      if (name === settings.emphasis && name !== info.current) button.classList.add('emphasis');
      button.addEventListener('click', () => {
        const query = currentQuery(info);
        if (query) window.location.assign(destinationFor(name, query));
      });
      menu.append(button);
    });

    const closeOnOutsidePointer = (event) => {
      if (!event.composedPath().includes(host)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer, true);
    host.addEventListener('click', (event) => event.stopPropagation());
    host.searchSwitcherCleanup = () => document.removeEventListener('pointerdown', closeOnOutsidePointer, true);

    bar.append(trigger, menu);
    root.append(style, bar);
    const submit = visibleSubmitButton(form);
    if (info.current === 'duckduckgo') {
      const row = submit?.parentElement?.parentElement;
      const input = form.querySelector('#search_form_input');
      if (!row || !input || !row.contains(input)) {
        host.searchSwitcherCleanup();
        return false;
      }
      const originalRowPosition = row.style.position;
      const originalInputPadding = input.style.paddingRight;
      const originalInputBoxSizing = input.style.boxSizing;
      if (window.getComputedStyle(row).position === 'static') row.style.position = 'relative';
      row.append(host);
      const reserveTextSpace = () => {
        input.style.boxSizing = 'border-box';
        input.style.paddingRight = `${Math.ceil(host.getBoundingClientRect().width) + 38}px`;
      };
      reserveTextSpace();
      window.addEventListener('resize', reserveTextSpace);
      const cleanupPointer = host.searchSwitcherCleanup;
      host.searchSwitcherCleanup = () => {
        cleanupPointer();
        window.removeEventListener('resize', reserveTextSpace);
        input.style.paddingRight = originalInputPadding;
        input.style.boxSizing = originalInputBoxSizing;
        row.style.position = originalRowPosition;
      };
    } else if (info.current === 'maps') {
      const input = form.querySelector('[name="q"]');
      const anchor = input?.parentElement?.parentElement;
      if (!anchor || !input || !anchor.contains(input)) {
        host.searchSwitcherCleanup();
        return false;
      }
      const originalAnchorPosition = anchor.style.position;
      if (window.getComputedStyle(anchor).position === 'static') anchor.style.position = 'relative';
      anchor.append(host);
      const positionOutside = () => {
        const fitsBeside = anchor.getBoundingClientRect().right + 3 + 32 <= window.innerWidth - 2;
        host.style.left = fitsBeside ? 'calc(100% + 3px)' : 'auto';
        host.style.right = fitsBeside ? 'auto' : '0';
        host.style.top = fitsBeside ? '50%' : 'calc(100% + 6px)';
        host.style.transform = fitsBeside ? 'translateY(-50%)' : 'none';
      };
      positionOutside();
      window.addEventListener('resize', positionOutside);
      const cleanupPointer = host.searchSwitcherCleanup;
      host.searchSwitcherCleanup = () => {
        cleanupPointer();
        window.removeEventListener('resize', positionOutside);
        anchor.style.position = originalAnchorPosition;
      };
    } else {
      const input = form.querySelector('[name="q"]');
      const anchor = form.querySelector('.RNNXgb');
      if (!anchor || !input || !anchor.contains(input)) {
        host.searchSwitcherCleanup();
        return false;
      }
      const originalAnchorPosition = anchor.style.position;
      const originalInputPadding = input.style.paddingRight;
      const originalInputBoxSizing = input.style.boxSizing;
      const basePadding = Number.parseFloat(window.getComputedStyle(input).paddingRight) || 0;
      if (window.getComputedStyle(anchor).position === 'static') anchor.style.position = 'relative';
      anchor.append(host);
      const reserveTextSpace = () => {
        const inputRight = input.getBoundingClientRect().right;
        const hostLeft = host.getBoundingClientRect().left;
        const required = Math.max(0, Math.ceil(inputRight - hostLeft + 8));
        input.style.boxSizing = 'border-box';
        input.style.paddingRight = `${Math.max(basePadding, required)}px`;
      };
      reserveTextSpace();
      window.addEventListener('resize', reserveTextSpace);
      const cleanupPointer = host.searchSwitcherCleanup;
      host.searchSwitcherCleanup = () => {
        cleanupPointer();
        window.removeEventListener('resize', reserveTextSpace);
        input.style.paddingRight = originalInputPadding;
        input.style.boxSizing = originalInputBoxSizing;
        anchor.style.position = originalAnchorPosition;
      };
    }
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
