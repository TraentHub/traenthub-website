# Application form → Google Sheet

The website has no backend. Applications submitted through the form on the
site are sent to a small [Google Apps Script](https://developers.google.com/apps-script)
web app, which appends one row per application to a shared Google Sheet.

```
website form ── POST (JSON, text/plain) ──▶ Apps Script web app ──▶ "Applications" tab
```

## Setup (one-time)

1. **Open the shared Google Sheet** that will receive the applications (or create
   a new one and share it with the team). The script creates the
   `Applications` tab and its header row on the first submission.
2. In the sheet, go to **Extensions → Apps Script** and replace the contents of
   `Code.gs` with the file in this folder.
3. Click **Deploy → New deployment**, choose type **Web app** and set:
   - **Execute as:** *Me* (so the script can write to the sheet)
   - **Who has access:** *Anyone* (the website must be able to call it without a Google login)
4. Authorize the script when asked and copy the **Web app URL** (it ends with `/exec`).
5. Give the URL to the website build as the `VITE_APPLICATION_ENDPOINT` environment variable:
   - locally: create `.env.local` (git-ignored) containing `VITE_APPLICATION_ENDPOINT=<url>`
   - production: set the same variable in the environment that runs `npm run build`
     (Vite inlines it at build time, so **rebuild/redeploy the site after changing it**).

> The web app URL is embedded in the public site, so treat it as public. It can
> only append validated rows to the sheet; it cannot read or change anything.

## Test the deployment

Open the `/exec` URL in a browser: it should answer `{"ok":true,"service":"traenthub-applications"}`.

Then submit a test row:

```sh
curl -L -X POST '<WEB_APP_URL>' --data '{
  "firstName": "Test", "lastName": "User", "email": "test@example.com",
  "altContact": "", "linkedin": "https://www.linkedin.com/in/test",
  "occupation": "test", "ai": "test", "projects": "test",
  "consent": true, "lang": "en"
}'
# → {"ok":true}
```

Delete the test row from the sheet afterwards.

## Updating the script

After editing `Code.gs`, use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.
Creating a *new* deployment instead would generate a new URL.

## What the script does

- Validates required fields, email and LinkedIn URL formats, privacy consent and maximum lengths.
- Prefixes values starting with `=`, `+`, `-` or `@` with `'`, so nothing typed in the form can run as a spreadsheet formula.
- Uses a script lock so that simultaneous submissions don't overwrite each other.
- The form itself adds a hidden honeypot field to filter out simple bots (those submissions are never sent).

## Columns

`Submitted at · First name · Last name · Email · Other contact · LinkedIn · What do you do? · How do you use AI? · Projects · Language · Privacy consent`
