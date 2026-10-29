/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL of the Google Apps Script web app that stores applications in the shared Google Sheet. */
  readonly VITE_APPLICATION_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
