// app/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getToken } from '../lib/auth';

export default function HomePage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const pathname = usePathname();
  useEffect(() => { setToken(getToken()); }, [pathname]);
  useEffect(() => {
    const sync = () => setToken(getToken());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return (
    <div className="card">
      <h1>Mon super site en construction</h1>
      {token !== undefined && token && <p className="success">Bienvenue, vous êtes connecté.</p>}
    </div>
  );
}
