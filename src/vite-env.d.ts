/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_AUTH_CLIENTID: string;
    readonly VITE_AUTH_AUTHORITY: string;
    readonly VITE_AUTH_API_SCOPE: string;
    readonly VITE_BASE_URL: string;
    readonly VITE_ISSUE_MANAGEMENT_URL:string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
