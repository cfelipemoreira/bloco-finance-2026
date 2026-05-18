import { useState } from 'react';

const CREDENTIALS = [
  { email: 'felipe@blocoproducoes.com', password: 'bloco2026' },
  { email: 'admin@blocoproducoes.com', password: 'bloco2026' },
];

const SESSION_KEY = 'bloco_auth';

export function isAuthenticated() {
  return localStorage.getItem(SESSION_KEY) === 'true';
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const match = CREDENTIALS.find(
      c => c.email === email.trim().toLowerCase() && c.password === password
    );
    if (match) {
      localStorage.setItem(SESSION_KEY, 'true');
      onLogin();
    } else {
      setError('E-mail ou senha incorretos.');
    }
  }

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-logo">
          <img
            src="/LOGO BLOCO_01@2x-8.png"
            alt="BLOCO."
            className="login-logo-img"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
          />
          <span className="login-logo-fallback" style={{ display: 'none' }}>BLOCO.</span>
          <span className="login-sub">Finance</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="login-field">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn">Entrar</button>
        </form>
      </div>
    </div>
  );
}
