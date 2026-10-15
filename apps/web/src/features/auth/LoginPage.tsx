import type { FormEvent } from "react";
import { useState } from "react";

import { login } from "./auth.api";
import type { AuthUser } from "./auth.types";

export const LoginPage = ({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      onAuthenticated(await login(email, password));
    } catch {
      setError("Não foi possível autenticar. Confira seu e-mail e senha.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <main className="auth-layout"><section className="auth-panel"><div className="brand"><span className="brand-mark">G</span><span>GestCon<span className="brand-dot">.</span></span></div><div className="auth-copy"><span className="eyebrow">Gestão de contatos</span><h1>Relacionamentos organizados. Acesso seguro.</h1><p>Centralize seus contatos e mantenha sua operação em movimento.</p></div><form className="card auth-card" onSubmit={submit}><div><h2>Entrar na plataforma</h2><p>Use suas credenciais de operador ou administrador.</p></div><label className="field-label">E-mail<input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label className="field-label">Senha<input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={isSubmitting}>{isSubmitting ? "Entrando…" : "Entrar"}</button></form></section><aside className="auth-aside"><div className="aside-orb" /><span className="aside-label">GestCon / 01</span><h2>Uma visão clara para cada conversa.</h2><p>Cadastre, acompanhe e encontre seus contatos em um só lugar.</p></aside></main>;
};
