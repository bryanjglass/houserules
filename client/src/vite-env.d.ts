/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Minimal typings for the Google Identity Services client loaded at runtime.
interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: {
            type?: 'standard' | 'icon';
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'small' | 'medium' | 'large';
            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
            width?: number;
            logo_alignment?: 'left' | 'center';
          }
        ) => void;
      };
    };
  };
}
