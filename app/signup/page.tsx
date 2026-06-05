// app/signup/page.tsx
'use client';
import { useState, FormEvent, useEffect } from 'react';
import TextInput from '../../components/TextInput';
import { gqlRequest } from '../../lib/graphql';
import { SIGNUP_MUTATION } from '../../lib/mutations';
import { getToken } from '../../lib/auth';
import { useRouter } from 'next/navigation';

type SignUpResponse = { createUser: { firstName: string; lastName: string; email: string; username: string } };

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (getToken()) { router.replace('/'); } else { setReady(true); }
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setMessage(null); setLoading(true);
    try {
      const data = await gqlRequest<SignUpResponse>(SIGNUP_MUTATION, {
        input: { firstName, lastName, email, username, password }
      });
      const result = data?.createUser;
      setMessage(result ? `Compte créé ✅ (${result.username})` : 'Compte créé ✅');
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <div className="card">
      <h1>Créer un compte</h1>
      <form onSubmit={onSubmit}>
        <TextInput id="firstName" label="Prénom" value={firstName} onChange={setFirstName} autoComplete="given-name" />
        <TextInput id="lastName" label="Nom" value={lastName} onChange={setLastName} autoComplete="family-name" />
        <TextInput id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <TextInput id="username" label="Nom d'utilisateur" value={username} onChange={setUsername} autoComplete="username" />
        <TextInput id="password" label="Mot de passe" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <div style={{display:'flex', gap:'0.75rem', alignItems:'center', marginTop:'0.5rem'}}>
          <button type="submit" disabled={loading || !firstName || !lastName || !email || !username || !password}>{loading ? 'Création…' : 'Créer le compte'}</button>
        </div>
      </form>
      {message && <p className="success" style={{marginTop:'1rem'}}>{message}</p>}
      {error && <p className="error" style={{marginTop:'1rem'}}>{error}</p>}
    </div>
  );
}
