# Search Switcher

Personal-use Chrome extension for switching searches between DuckDuckGo, Google Search, and Google Maps. The switch stays inside the DuckDuckGo and Google search fields. On Maps, a small round switch sits just outside the field on its right so place names remain visible.

## Load it in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. If you downloaded the ZIP, extract it first. Click **Load unpacked** and choose the extracted folder containing `manifest.json`. If Chrome already loads this same source folder, click **Reload** instead. If you extracted into a new folder, remove the old unpacked extension and load the new folder.
4. On DuckDuckGo results, click **Google** for a one-click switch, or **▾** for the destination menu with Google Maps. On Google results, use **Switch** inside the search field. On Maps searches and place pages, click the small **⇄** button beside the search field.

Use the extension's **Details** page and choose **Extension options** to configure visibility, emphasis, and theme.

## Push updates to GitHub

Sign in once with GitHub CLI:

~~~powershell
gh auth login -h github.com --web --git-protocol https
~~~

After committing changes, run this from PowerShell:

~~~powershell
.\scripts\push.ps1 origin main
~~~

The script passes the GitHub CLI credential to Git for that push only. It does not save a token in this repository.

## Notes

- The switcher works on `https://duckduckgo.com/?q=...`, `https://www.google.com/search?q=...`, Google Maps searches, and Maps place pages. It stays hidden on Maps home and other non-search pages.
- It reads the page URL and the current search-field text. It does not inspect result cards or send data to a service.
- Selecting a destination replaces the current tab.
