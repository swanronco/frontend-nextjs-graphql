// app/login/page.tsx
'use client';
import { useState, FormEvent, useEffect } from 'react';
import TextInput from '../../components/TextInput';
import { gqlRequest } from '../../lib/graphql';
import { LOGIN_MUTATION } from '../../lib/mutations';
import { getToken, setToken } from '../../lib/auth';
import { useRouter } from 'next/navigation';

type LoginResponse = { login: { token: string; user: { id: string; username: string; email: string } } };

export default function LoginPage() {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [ready, setReady] = useState<boolean>(false);
  useEffect(() => {
    if (getToken()) { router.replace('/'); } else { setReady(true); }
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const data = await gqlRequest<LoginResponse>(LOGIN_MUTATION, { identifier, password });
      const jwt = data?.login?.token;
      if (!jwt) throw new Error('JWT manquant dans la réponse');
      setToken(jwt);
      router.push('/');
    } catch (err: any) {
      const msg: string = err.message ?? String(err);
      setError(msg.includes('Invalid credentials') ? 'Identifiant ou mot de passe incorrect.' : msg);
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <div className="card">
      <h1>Connexion</h1>
      <form onSubmit={onSubmit}>
        <TextInput id="identifier" label="Identifiant (email ou username)" value={identifier} onChange={setIdentifier} autoComplete="username" />
        <TextInput id="password" label="Mot de passe" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <div style={{marginTop:'0.5rem'}}>
          <button type="submit" disabled={loading || !identifier || !password}>{loading ? 'Connexion…' : 'Se connecter'}</button>
        </div>
      </form>
      {error && <p className="error" style={{marginTop:'1rem'}}>{error}</p>}
    </div>
  );
}
