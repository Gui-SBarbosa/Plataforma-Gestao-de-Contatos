import type { FormEvent } from "react";
import { useState } from "react";

import { AppShell } from "../../components/layout/AppShell";
import { EmptyState } from "../../components/ui/EmptyState";
import { FeedbackNotice } from "../../components/ui/FeedbackNotice";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { logout } from "../auth/auth.api";
import type { AuthUser } from "../auth/auth.types";
import { useContacts } from "./useContacts";
import type { ContactInput, ContactSource } from "./contacts.types";
import { formatPhone } from "./phone";

const initialForm: ContactInput = { city: "", company: "", email: "", name: "", phone: "", source: "WEBSITE" };
const sourceLabels: Record<ContactSource, string> = { OTHER: "Outro", PHONE: "Telefone", REFERRAL: "Indicação", WEBSITE: "Site", SOCIAL_MEDIA: "Redes sociais" };

export const ContactsPage = ({ user, onLogout }: { user: AuthUser; onLogout: () => void }) => {
  const { addContact, contacts, error, isLoading, meta, refresh } = useContacts();
  const [form, setForm] = useState(initialForm);
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const canCreate = user.role === "OPERATOR";

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setFeedback(null); setIsSaving(true);
    try { await addContact({ ...form, city: form.city || undefined, company: form.company || undefined }); setForm(initialForm); setIsOpen(false); setFeedback("Contato cadastrado com sucesso."); } catch { setFeedback("Não foi possível cadastrar o contato."); } finally { setIsSaving(false); }
  };

  const signOut = async () => { try { await logout(); } finally { onLogout(); } };

  return <AppShell activeSection="contacts" breadcrumb="Workspace / Contatos" contactCount={meta.total} onLogout={() => void signOut()} title="Contatos" user={user}><section className="content-head"><div><p className="eyebrow">{user.role === "ADMIN" ? "Visão administrativa" : "Minha base"}</p><h2>{user.role === "ADMIN" ? "Contatos da operação" : "Meus contatos"}</h2><p className="muted">{user.role === "ADMIN" ? "Acompanhamento somente leitura, com origem e responsável pelo cadastro." : "Cadastre e acompanhe os contatos vinculados ao seu usuário."}</p></div>{canCreate && <button className="button button-primary" onClick={() => { setFeedback(null); setIsOpen(true); }}>+ Novo contato</button>}</section>{feedback && <FeedbackNotice tone="success">{feedback}</FeedbackNotice>}{error && <FeedbackNotice tone="danger">{error}<button className="button button-secondary button-small" onClick={() => void refresh()}>Tentar novamente</button></FeedbackNotice>}<section className="card table-card"><div className="table-toolbar"><span className="muted">{meta.total} {meta.total === 1 ? "contato" : "contatos"}</span><button className="button button-secondary button-small" onClick={() => void refresh()}>Atualizar</button></div>{isLoading ? <EmptyState>Carregando contatos…</EmptyState> : contacts.length === 0 ? <EmptyState><strong>Nenhum contato cadastrado</strong><span>{canCreate ? "Comece adicionando o primeiro contato à sua base." : "Ainda não há contatos cadastrados pelos operadores."}</span>{canCreate && <button className="button button-primary button-small" onClick={() => setIsOpen(true)}>Cadastrar contato</button>}</EmptyState> : <div className="table-wrap"><table><thead><tr><th>Contato</th><th>Empresa</th><th>Telefone</th><th>Origem</th>{user.role === "ADMIN" && <th>Operador</th>}<th>Cadastro</th></tr></thead><tbody>{contacts.map((contact) => <tr key={contact.id}><td><strong>{contact.name}</strong><span>{contact.email}</span></td><td>{contact.company || "—"}</td><td>{formatPhone(contact.phone)}</td><td><span className="badge">{sourceLabels[contact.source]}</span></td>{user.role === "ADMIN" && <td>{contact.createdBy.name}</td>}<td>{new Date(contact.createdAt).toLocaleDateString("pt-BR")}</td></tr>)}</tbody></table></div>}{meta.totalPages > 1 && <PaginationControls onNext={() => void refresh(meta.page + 1)} onPrevious={() => void refresh(meta.page - 1)} page={meta.page} totalPages={meta.totalPages} />}</section>{canCreate && isOpen && <ContactForm form={form} isSaving={isSaving} onChange={setForm} onClose={() => setIsOpen(false)} onSubmit={submit} />}</AppShell>;
};

const ContactForm = ({ form, isSaving, onChange, onClose, onSubmit }: { form: ContactInput; isSaving: boolean; onChange: (form: ContactInput) => void; onClose: () => void; onSubmit: (event: FormEvent) => void }) => <div className="overlay" role="presentation"><form className="modal" onSubmit={onSubmit}><div className="modal-head"><div><h2>Novo contato</h2><p className="muted">Os campos com * são obrigatórios.</p></div><button className="close-button" type="button" onClick={onClose} aria-label="Fechar">×</button></div><div className="modal-grid"><label className="field-label full">Nome completo *<input className="input" value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} required minLength={2} /></label><label className="field-label">E-mail *<input className="input" type="email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} required /></label><label className="field-label">Telefone *<input className="input" inputMode="tel" placeholder="(62) 99999-0000" value={form.phone} onChange={(event) => onChange({ ...form, phone: formatPhone(event.target.value) })} required /></label><label className="field-label">Empresa<input className="input" value={form.company} onChange={(event) => onChange({ ...form, company: event.target.value })} /></label><label className="field-label">Cidade<input className="input" value={form.city} onChange={(event) => onChange({ ...form, city: event.target.value })} /></label><label className="field-label full">Origem *<select className="input" value={form.source} onChange={(event) => onChange({ ...form, source: event.target.value as ContactSource })}><option value="WEBSITE">Site</option><option value="REFERRAL">Indicação</option><option value="SOCIAL_MEDIA">Redes sociais</option><option value="PHONE">Telefone</option><option value="OTHER">Outro</option></select></label></div><div className="modal-actions"><button className="button button-secondary" type="button" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={isSaving}>{isSaving ? "Cadastrando…" : "Cadastrar contato"}</button></div></form></div>;
