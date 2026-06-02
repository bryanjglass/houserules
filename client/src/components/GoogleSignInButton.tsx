import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Loads the GIS script once and resolves when window.google is ready.
function loadGis(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google sign-in')));
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google sign-in'));
    document.head.appendChild(script);
  });
}

// Official Google Identity Services button. Renders nothing when Google login is
// unconfigured (no VITE_GOOGLE_CLIENT_ID). See DESIGN.md §4 "Sign in with Google".
export default function GoogleSignInButton({ onError }: { onError?: (msg: string) => void }) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || !containerRef.current) return;
    let cancelled = false;

    loadGis()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response) => {
            try {
              await googleLogin(response.credential);
              navigate('/');
            } catch (err: any) {
              onError?.(err.response?.data?.error || 'Google sign-in failed');
            }
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
          logo_alignment: 'center',
          width: 320,
        });
        setReady(true);
      })
      .catch(() => onError?.('Could not load Google sign-in'));

    return () => {
      cancelled = true;
    };
  }, []);

  if (!CLIENT_ID) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-line" />
        <span className="text-xs font-semibold text-ink-400">or</span>
        <div className="flex-1 h-px bg-line" />
      </div>
      <div ref={containerRef} className={`flex justify-center ${ready ? '' : 'min-h-[44px]'}`} />
    </div>
  );
}
