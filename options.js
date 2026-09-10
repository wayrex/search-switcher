(() => {
  'use strict';
  const defaults = { enabled: true, emphasis: 'duckduckgo', theme: 'system' };
  const form = document.querySelector('#settings');
  const enabled = document.querySelector('#enabled');
  const emphasis = document.querySelector('#emphasis');
  const theme = document.querySelector('#theme');
  const status = document.querySelector('#status');

  chrome.storage.local.get(defaults).then((settings) => {
    enabled.checked = settings.enabled;
    emphasis.value = settings.emphasis;
    theme.value = settings.theme;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    chrome.storage.local.set({
      enabled: enabled.checked,
      emphasis: emphasis.value,
      theme: theme.value
    }).then(() => {
      status.textContent = 'Saved.';
      window.setTimeout(() => { status.textContent = ''; }, 1800);
    });
  });
})();
