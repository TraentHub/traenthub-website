# Application form → Google Sheet + emails

The website has no backend. Applications submitted through the form on the
site are sent to a small [Google Apps Script](https://developers.google.com/apps-script)
web app. For every application it:

1. appends one row to the shared Google Sheet;
2. sends a **confirmation email to the applicant** (in Italian or English, depending on the site language);
3. sends a **"new application" email to the team**, with all the answers and a link to the sheet.

The emails are HTML, styled like the website (same colors and wordmark), with a plain-text fallback. The wording is gender neutral.
Their text lives in `sendConfirmation_` and `sendTeamNotification_` in `Code.gs`.

```
website form ── POST (JSON, text/plain) ──▶ Apps Script web app ──▶ "Candidature" tab
                                                      └──▶ confirmation email + team notification
```

## Setup (one-time)

1. **Open the shared Google Sheet** that will receive the applications.
2. Go to **Extensions → Apps Script** and replace the contents of `Code.gs` with the file in this folder.
3. **Add the team's addresses** in *Project Settings (⚙️) → Script properties → Add script property*:

   | Property | Value |
   |---|---|
   | `NOTIFY_TO` | comma-separated list, e.g. `name1@example.com, name2@example.com, name3@example.com` |

   The addresses live here and not in the code on purpose: this repository is public.
4. Select the function **`setup`** in the editor toolbar and click **Run**. Accept the permission prompts
   (access to the spreadsheet and sending email). It renames the spreadsheet to
   *"Traent Hub – Candidature dal sito"* and turns the empty first tab into the **Candidature** tab, with its formatted header row.
5. Click **Deploy → New deployment**, choose type **Web app** and set:
   - **Execute as:** *Me* (so the script can write to the sheet and send email)
   - **Who has access:** *Anyone* (the website must be able to call it without a Google login)
6. Copy the **Web app URL** (it ends with `/exec`).
7. Give the URL to the website build as the `VITE_APPLICATION_ENDPOINT` environment variable:
   - locally: create `.env.local` (git-ignored) containing `VITE_APPLICATION_ENDPOINT=<url>`
   - production: set the same variable in the environment that runs `npm run build`
     (Vite inlines it at build time, so **rebuild/redeploy the site after changing it**).

> The web app URL is embedded in the public site, so treat it as public. It can
> only append validated rows and send the two emails; it cannot read or change anything.

## About the emails

- They are **sent from the Google account that deployed the script** (the one you were logged in with in step 5).
  Replies to the applicant's confirmation go to `contact@traenthub.com` (`REPLY_TO` in `Code.gs`);
  replies to the team notification go straight to the applicant.
- Each application sends **2 emails**. Google limits scripts to about **100 recipients/day on a free Gmail
  account** and about 1,500/day on Google Workspace, which is plenty for an application form.
- Email is *best effort*: if sending fails (quota, a typo in an address…) the application is still saved in the sheet
  and the applicant still sees the success message. Check **Executions** in the Apps Script editor if emails seem to be missing.
- To change who receives the notifications, just edit the `NOTIFY_TO` property: no redeploy needed.

## Test the deployment

Open the `/exec` URL in a browser: it should answer `{"ok":true,"service":"traenthub-applications"}`.

Then submit a test application **using your own email address** (you'll receive the confirmation, and the team gets the notification):

```sh
curl -L -X POST '<WEB_APP_URL>' --data '{
  "firstName": "Test", "lastName": "User", "email": "<YOUR_EMAIL>",
  "altContact": "", "linkedin": "https://www.linkedin.com/in/test",
  "occupation": "test", "ai": "test", "projects": "test",
  "consent": true, "lang": "it"
}'
# → {"ok":true}
```

Delete the test row from the sheet afterwards.

## Updating the script

After editing `Code.gs`, use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.
Creating a *new* deployment instead would generate a new URL. If a new permission is requested, run `setup` again first.

## What the script does

- Validates required fields, email and LinkedIn URL formats, privacy consent and maximum lengths.
- Stores every answer as **plain text, exactly as typed**: a value starting with `=`, `+`, `-` or `@` (for example a Telegram `@username`) is never run as a spreadsheet formula.
- Uses a script lock so that simultaneous submissions don't overwrite each other.
- The form itself adds a hidden honeypot field to filter out simple bots (those submissions are never sent).

## Columns

`Data invio · Nome · Cognome · Email · Altro contatto · LinkedIn · Di cosa ti occupi? · Come usi l'AI? · Progetti · Lingua · Consenso privacy`
