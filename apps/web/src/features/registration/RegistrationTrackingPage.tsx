import type { FormEvent } from "react";
import { useState } from "react";

import { createRegistration } from "./registration.api";
import type { RegistrationInput, RegistrationStatus } from "./registration.types";
import { useRegistrationTracking } from "./useRegistrationTracking";

const statusCopy: Record<RegistrationStatus, { detail: string; title: string }> = {
  ACTIVE: { detail: "Seu acesso foi liberado. Agora você já pode entrar na plataforma.", title: "Solicitação aprovada" },
  PENDING: { detail: "Um administrador está analisando seu cadastro. Esta página será atualizada automaticamente.", title: "Solicitação em análise" },
  REJECTED: { detail: "Sua solicitação não foi aprovada. Entre em contato com o administrador se precisar de ajuda.", title: "Solicitação não aprovada" },
};

const initialForm: RegistrationInput & { passwordConfirmation: string } = {
  email: "",
  name: "",
  password: "",
  passwordConfirmation: "",
};

export const RegistrationTrackingPage = () => {
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const tracking = useRegistrationTracking(trackingToken);
  const copy = tracking.registration ? statusCopy[tracking.registration.status] : null;

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (form.password !== form.passwordConfirmation) {
      setFormError("A confirmação de senha deve ser igual à senha informada.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await createRegistration({ email: form.email, name: form.name, password: form.password });
      setTrackingToken(token);
      setTokenInput(token);
    } catch {
      setFormError("Não foi possível enviar sua solicitação. Revise os dados e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const trackExistingRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!tokenInput.trim()) {
      setFormError("Informe o código de acompanhamento recebido no cadastro.");
      return;
    }

    setTrackingToken(tokenInput.trim());
  };

  const reset = () => {
    setForm(initialForm);
    setFormError(null);
    setTokenInput("");
    setTrackingToken(null);
  };

  return (
    <main className="page-shell">
      <header className="brand"><span className="brand-mark">G</span><span>GestCon<span className="brand-dot">.</span></span></header>
      <section className="hero">
        <span className="eyebrow">Acesso de operador</span>
        <h1>Solicite e acompanhe seu acesso.</h1>
        <p>Seu cadastro é analisado com segurança. Você recebe atualizações sem precisar recarregar a página.</p>
      </section>

      {!trackingToken ? (
        <div className="grid-layout">
          <form className="card form-card" onSubmit={submitRegistration}>
            <div><h2>Solicitar acesso</h2><p>Preencha seus dados para criar uma solicitação de operador.</p></div>
            <label>Nome completo<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} minLength={2} maxLength={120} required /></label>
            <label>E-mail<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" maxLength={320} required /></label>
            <label>Senha<input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" minLength={12} maxLength={128} required /></label>
            <label>Confirmar senha<input value={form.passwordConfirmation} onChange={(event) => setForm({ ...form, passwordConfirmation: event.target.value })} type="password" minLength={12} maxLength={128} required /></label>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <button className="button button-primary" disabled={isSubmitting} type="submit">{isSubmitting ? "Enviando…" : "Enviar solicitação"}</button>
          </form>

          <form className="card token-card" onSubmit={trackExistingRequest}>
            <div className="token-icon">⌁</div>
            <h2>Já possui um código?</h2>
            <p>Informe o código exibido quando sua solicitação foi enviada para acompanhar sua análise.</p>
            <label>Código de acompanhamento<input value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} autoComplete="off" /></label>
            <button className="button button-secondary" type="submit">Acompanhar solicitação</button>
          </form>
        </div>
      ) : (
        <section className="card tracking-card" aria-live="polite">
          <div className={`status-icon ${tracking.registration?.status.toLowerCase() ?? "pending"}`}>{tracking.registration?.status === "ACTIVE" ? "✓" : tracking.registration?.status === "REJECTED" ? "×" : "…"}</div>
          {tracking.isLoading && <><h2>Consultando sua solicitação</h2><p>Estamos buscando o estado mais recente.</p></>}
          {!tracking.isLoading && tracking.registration && copy && <><span className={`status-pill ${tracking.registration.status.toLowerCase()}`}>{tracking.registration.status === "ACTIVE" ? "Aprovado" : tracking.registration.status === "REJECTED" ? "Não aprovado" : "Pendente"}</span><h2>{copy.title}</h2><p>{copy.detail}</p></>}
          {tracking.error && <p className="form-error" role="alert">{tracking.error}</p>}
          {!tracking.isLoading && tracking.registration?.status === "PENDING" && <p className="connection-status">{tracking.isConnected ? "Atualização em tempo real conectada" : "Conectando às atualizações em tempo real…"}</p>}
          {tracking.registration?.status === "PENDING" && <div className="token-display"><span>Seu código de acompanhamento</span><code>{trackingToken}</code><small>Guarde este código em local seguro. Ele não é salvo neste navegador.</small></div>}
          <button className="button button-secondary" onClick={reset} type="button">Nova solicitação ou outro código</button>
          {tracking.registration?.status === "ACTIVE" && <a className="button button-primary" href="#">Ir para o login</a>}
        </section>
      )}
    </main>
  );
};
