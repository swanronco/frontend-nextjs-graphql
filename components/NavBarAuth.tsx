// components/NavBarAuth.tsx
'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken, getToken, isLoggedFromCookie } from '../lib/auth';
import { gqlRequest } from '../lib/graphql';
import { LOGOUT_MUTATION } from '../lib/mutations';

export default function NavBarAuth() {
  const [logged, setLogged] = useState<boolean>(isLoggedFromCookie);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { setLogged(Boolean(getToken())); }, [pathname]);
  useEffect(() => {
    const sync = () => setLogged(Boolean(getToken()));
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    const token = getToken();
    if (token) {
      try { await gqlRequest(LOGOUT_MUTATION, { token }, token); } catch {}
    }
    clearToken();
    window.dispatchEvent(new Event('storage'));
    router.push('/');
  }

  return (
    <div className="nav-inner">
      <div>
        <Link href="/">Accueil</Link>
        {!logged && <Link href="/signup">Inscription</Link>}
        {logged ? (
          <a href="#" onClick={handleLogout}>Déconnexion</a>
        ) : (
          <Link href="/login">Connexion</Link>
        )}
      </div>
      <span className={logged ? 'success' : 'notice'} style={{fontSize:'0.9rem'}}>
        {logged ? 'Connecté' : 'Hors ligne'}
      </span>
    </div>
  );
}
