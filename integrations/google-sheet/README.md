# Application form → Google Sheet + emails

The website has no backend. Applications submitted through the form on the
site are sent to a small [Google Apps Script](https://developers.google.com/apps-script)
web app. For every application it:

1. appends one row to the shared Google Sheet;
2. sends a **confirmation email to the applicant** (in Italian or English, depending on the site language);
3. sends a **"new application" email to the team**, with all the answers and a link to the sheet.

The emails are HTML, styled like the website (same colors, with the Traent Hub logo embedded in the script from `email-logo.png`). The wording is gender neutral.
Their text lives in `sendConfirmation_` and `sendTeamNotification_` in `Code.gs`.

```
website form ── POST (JSON, text/plain) ──▶ Apps Script web app ──▶ "Candidature" tab
                                                      └──▶ confirmation email + team notification
```

## Microsoft 365 setup

This integration requires a Microsoft 365 work or school tenant and an Exchange Online mailbox. It uses application permissions, so a tenant administrator must configure and approve it. A personal Microsoft account is not supported by this setup.

1. In Microsoft Entra ID, register a single-tenant application. Record the **tenant ID** and **application (client) ID**.
2. Grant the app the Exchange Online **Application Mail.Send** role scoped to the sender mailbox using [Exchange Online application RBAC](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac). Do not also grant an unscoped Microsoft Graph `Mail.Send` application permission in Entra: permissions are additive and that would allow sending as other mailboxes. Test both an allowed and a disallowed mailbox.
3. Create a client secret and record its **value** securely. Set an expiry and a rotation reminder. Treat project editors as able to access the secret and send email as the mailbox; limit editor access accordingly.
4. In Apps Script **Project Settings → Script properties**, add these properties alongside `NOTIFY_TO`:

   | Property | Value |
   |---|---|
   | `MS_TENANT_ID` | Microsoft Entra tenant ID |
   | `MS_CLIENT_ID` | Application (client) ID |
   | `MS_CLIENT_SECRET` | Client secret value |
   | `MS_SENDER_MAILBOX` | Mailbox user principal name or ID, e.g. `contact@traenthub.com` |

   Update the secret property when rotating the credential. Do not commit it or put it in a Vite environment variable. `MS_SENDER_MAILBOX` must identify a mailbox, not merely an unresolvable alias. Set `REPLY_TO` in `Code.gs` if the public reply address differs.

## Google Apps Script setup (one-time)

1. **Open the shared Google Sheet** that will receive the applications.
2. Go to **Extensions → Apps Script** and replace the contents of `Code.gs` with the file in this folder.
3. **Add the team's addresses** in *Project Settings (⚙️) → Script properties → Add script property*:

   | Property | Value |
   |---|---|
   | `NOTIFY_TO` | comma-separated list, e.g. `name1@example.com, name2@example.com, name3@example.com` |

   The addresses live here and not in the code on purpose: this repository is public.
4. Select the function **`setup`** in the editor toolbar and click **Run**. Accept the permission prompts
   (access to the spreadsheet and external requests). It renames the spreadsheet to
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
> only append validated rows and send the two emails; it cannot read or change anything. Public endpoints can be abused, so monitor execution and mail quotas.

## About the emails

- They are sent from `MS_SENDER_MAILBOX` through Microsoft Graph. Replies to the applicant's confirmation go to `contact@traenthub.com` (`REPLY_TO` in `Code.gs`); replies to the team notification go straight to the applicant.
- Each application sends up to **2 emails**. Microsoft and Apps Script quotas apply. A Graph `202 Accepted` response means the message was accepted for processing, not that delivery is guaranteed.
- Email is *best effort*: if sending fails (quota, a typo in an address…) the application is still saved in the sheet
  and the applicant still sees the success message. Check **Executions** in the Apps Script editor if emails seem to be missing.
- To change who receives the notifications, just edit the `NOTIFY_TO` property: no redeploy needed.

## Test the deployment

Open the `/exec` URL in a browser: it should answer `{"ok":true,"service":"traenthub-applications"}`.

Before deploying, verify the Microsoft app is limited to the intended mailbox. Then submit a test application **using your own email address** (you'll receive the confirmation, and the team gets the notification):

```sh
curl -L '<WEB_APP_URL>' --data '{
  "firstName": "Test", "lastName": "User", "email": "<YOUR_EMAIL>",
  "altContact": "", "linkedin": "https://www.linkedin.com/in/test",
  "occupation": "test", "ai": "test", "projects": "test",
  "consent": true, "lang": "it"
}'
# → {"ok":true}; check both inboxes and Apps Script Executions as well
```

> Don't add `-X POST`: Apps Script answers with a redirect, and forcing POST on the redirected request makes
> Google show a "Pagina non trovata / Page not found" page even though the application was saved.
> With `--data` alone curl does the right thing.

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
