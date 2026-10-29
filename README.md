<div align="center">
  <img src=".github/logo.png" alt="Traent Hub" width="280" />
</div>

# traenthub-website

Website of Traent Hub — the tech hub of Pisa.

```sh
make install
make build
```

## Application form

The "Apply" section sends applications to a shared Google Sheet through a
Google Apps Script web app. Setup instructions are in
[`integrations/google-sheet/`](integrations/google-sheet/README.md).

The web app URL is read from the `VITE_APPLICATION_ENDPOINT` environment
variable at build time (see `.env.example`).
