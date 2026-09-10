# Search Switcher

Personal-use Chrome extension that lets you switch an existing Google or DuckDuckGo web search to DuckDuckGo, Google Search, or Google Maps.

## Load it in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and choose this `search-switcher-extension` folder.
4. Open a DuckDuckGo or Google web-results page with a query. The switcher appears below the search box.

Use the extension's **Details** page and choose **Extension options** to configure visibility, emphasis, and theme.

## Notes

- The switcher works only on `https://duckduckgo.com/?q=...` and `https://www.google.com/search?q=...`.
- It reads the query from the current page URL only. It does not inspect result cards or send data to a service.
- Selecting a destination replaces the current tab.
