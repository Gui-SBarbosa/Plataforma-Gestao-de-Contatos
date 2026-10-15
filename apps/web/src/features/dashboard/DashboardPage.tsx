import { useEffect, useState } from "react";

import { AppShell } from "../../components/layout/AppShell";
import { EmptyState } from "../../components/ui/EmptyState";
import { listPendingRequests } from "../admin-requests/admin-requests.api";
import type { PendingRequest } from "../admin-requests/admin-requests.types";
import { logout } from "../auth/auth.api";
import type { AuthUser } from "../auth/auth.types";
import { listContacts } from "../contacts/contacts.api";
import type { Contact, ContactSource } from "../contacts/contacts.types";

import { getDashboard, type DashboardData } from "./dashboard.api";

type DashboardPageProps = { onLogout: () => void; user: AuthUser };
const sourceLabels: Record<ContactSource, string> = { OTHER: "Outro", PHONE: "Telefone", REFERRAL: "Indicacao", SOCIAL_MEDIA: "Redes sociais", WEBSITE: "Site" };
const sourceColors: Record<ContactSource, string> = { OTHER: "#64748b", PHONE: "#d97706", REFERRAL: "#16a34a", SOCIAL_MEDIA: "#7c3aed", WEBSITE: "#2563eb" };

export const DashboardPage = ({ user, onLogout }: DashboardPageProps) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [interval, setInterval] = useState("day");
  const [operatorId, setOperatorId] = useState("");

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ interval });
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    if (operatorId) query.set("operatorId", operatorId);
    const load = async () => {
      try {
        const [dashboard, contactPage, pendingPage] = await Promise.all([
          getDashboard(query),
          listContacts(1),
          user.role === "ADMIN" ? listPendingRequests(1) : Promise.resolve(null),
        ]);
        if (!active) return;
        setData(dashboard.data);
        setContacts(contactPage.data.slice(0, 5));
        setPending(pendingPage?.data.slice(0, 4) ?? []);
        setError(null);
      } catch {
        if (active) setError("Nao foi possivel carregar o dashboard.");
      }
    };
    void load();
    return () => { active = false; };
  }, [from, interval, operatorId, to, user.role]);

  const signOut = async () => { try { await logout(); } finally { onLogout(); } };
  return <AppShell activeSection="overview" breadcrumb="Workspace / Dashboard" title="Dashboard" user={user} onLogout={() => void signOut()}>
    <section className="dashboard-page-head"><div><p className="eyebrow">Visao geral</p><h2>Acompanhe contatos, operadores e solicitacoes</h2><p className="muted">Metricas atualizadas a partir dos registros visiveis para seu perfil.</p></div><div className="dashboard-filters"><label>De<input className="input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>Ate<input className="input" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label><label>Intervalo<select className="input" value={interval} onChange={(event) => setInterval(event.target.value)}><option value="day">Dia</option><option value="week">Semana</option><option value="month">Mes</option></select></label>{user.role === "ADMIN" && <label>Operador<select className="input" value={operatorId} onChange={(event) => setOperatorId(event.target.value)}><option value="">Todos</option>{data?.availableOperators.map((operator) => <option key={operator.id} value={operator.id}>{operator.name}</option>)}</select></label>}</div></section>
    {error && <div className="notice danger">{error}</div>}
    {!data ? <EmptyState>Carregando metricas...</EmptyState> : <DashboardContent contacts={contacts} data={data} pending={pending} user={user} />}
  </AppShell>;
};

const DashboardContent = ({ contacts, data, pending, user }: { contacts: Contact[]; data: DashboardData; pending: PendingRequest[]; user: AuthUser }) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayTotal = data.series.find((item) => item.period === today)?.total ?? 0;
  const sourceTotal = data.bySource.reduce((total, item) => total + item.total, 0);
  return <>
    <section className="dashboard-metrics"><MetricCard tone="blue" value={data.summary.contacts} label="Total de contatos" detail="no periodo" /><MetricCard tone="green" value={todayTotal} label="Contatos cadastrados hoje" detail={data.interval === "day" ? "intervalo diario" : "intervalo selecionado"} /><MetricCard tone="navy" value={data.availableOperators.length || (user.role === "OPERATOR" ? 1 : 0)} label="Operadores ativos" detail="com acesso ativo" /><MetricCard tone="amber" value={sourceTotal ? data.bySource.filter((item) => item.total > 0).length : 0} label="Origens utilizadas" detail="fontes com registros" /></section>
    <section className="dashboard-grid dashboard-grid-charts"><article className="card dashboard-card"><DashboardCardHead title="Contatos cadastrados" subtitle="Ultimos sete dias" /><LineChart data={data.series} interval={data.interval} /></article><article className="card dashboard-card"><DashboardCardHead title="Contatos por origem" subtitle="Distribuicao total" /><SourceChart data={data.bySource} /></article></section>
    <section className="dashboard-grid dashboard-grid-lower"><article className="card dashboard-card"><DashboardCardHead title={user.role === "ADMIN" ? "Contatos recentes" : "Meus contatos recentes"} subtitle="Ultimos cadastros visiveis" actionLabel="Ver todos" actionHref="#contacts" /><RecentContacts contacts={contacts} showOperator={user.role === "ADMIN"} /></article>{user.role === "ADMIN" && <article className="card dashboard-card"><DashboardCardHead title="Solicitacoes pendentes" subtitle="Aguardando analise" actionLabel="Ver todas" actionHref="#requests" /><PendingList pending={pending} /></article>}</section>
  </>;
};

const MetricCard = ({ detail, label, tone, value }: { detail: string; label: string; tone: string; value: number }) => <article className="card dashboard-metric"><span className={`dashboard-metric-icon ${tone}`}>{tone === "green" ? "✓" : tone === "navy" ? "♟" : tone === "amber" ? "◷" : "▣"}</span><strong>{value}</strong><span className="dashboard-metric-label">{label}</span><small>{detail}</small></article>;
const DashboardCardHead = ({ actionHref, actionLabel, subtitle, title }: { actionHref?: string; actionLabel?: string; subtitle: string; title: string }) => <div className="dashboard-card-head"><div><h3>{title}</h3><p>{subtitle}</p></div>{actionHref && actionLabel && <a className="button button-secondary button-small" href={actionHref}>{actionLabel}</a>}</div>;

const formatPeriod = (period: string, interval: string) => {
  if (!period) return "—";
  if (interval === "month") return period.replace("-", "/");
  const date = new Date(`${period}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? period : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(date);
};

const fillDailySeries = (data: DashboardData["series"]) => {
  const totals = new Map(data.map((item) => [item.period, item.total]));
  const anchorValue = data.map((item) => item.period).sort().at(-1) ?? new Date().toISOString().slice(0, 10);
  const anchor = new Date(`${anchorValue}T00:00:00.000Z`);
  const end = Number.isNaN(anchor.getTime()) ? new Date() : anchor;
  return Array.from({ length: 7 }, (_item, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (6 - index));
    const period = date.toISOString().slice(0, 10);
    return { period, total: totals.get(period) ?? 0 };
  });
};

const LineChart = ({ data, interval }: { data: DashboardData["series"]; interval: string }) => {
  const values = interval === "day" ? fillDailySeries(data) : data.length ? data : [{ period: "", total: 0 }];
  const max = Math.max(...values.map((item) => item.total), 1);
  const y = (total: number) => 92 - (total / max) * 72;
  const x = (index: number) => values.length === 1 ? 50 : index * (100 / (values.length - 1));
  const points = values.map((item, index) => `${x(index)},${y(item.total)}`).join(" ");
  return <div className="dashboard-line-chart"><div className="dashboard-chart-body"><div className="dashboard-y-axis"><span>{max}</span><span>{Math.round(max / 2)}</span><span>0</span></div><div className="dashboard-chart-plot"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Contatos por periodo"><line x1="0" y1="20" x2="100" y2="20" /><line x1="0" y1="56" x2="100" y2="56" /><line x1="0" y1="92" x2="100" y2="92" /><polyline points={points} /></svg>{values.map((item, index) => <span className="dashboard-chart-point" key={`${item.period}-${index}`} style={{ left: `${x(index)}%`, top: `${y(item.total)}%` }} title={`${formatPeriod(item.period, interval)}: ${item.total} contatos`} aria-label={`${formatPeriod(item.period, interval)}: ${item.total} contatos`} />)}</div></div><div className="dashboard-chart-labels">{values.map((item, index) => <span key={`${item.period}-${index}`}>{formatPeriod(item.period, interval)}</span>)}</div>{!data.length && interval !== "day" && <small className="dashboard-chart-empty">Sem dados no periodo selecionado</small>}</div>;
};

const SourceChart = ({ data }: { data: DashboardData["bySource"] }) => {
  const total = data.reduce((sum, item) => sum + item.total, 0);
  let cursor = 0;
  const stops = data.map((item) => { const start = cursor; cursor += total ? (item.total / total) * 100 : 0; return `${sourceColors[item.source as ContactSource]} ${start}% ${cursor}%`; }).join(", ");
  return <div className="dashboard-source-chart"><div className="dashboard-donut" style={{ background: `conic-gradient(${stops || "#e2e8f0 0 100%"})` }}><span>{total}</span><small>contatos</small></div><div className="dashboard-legend">{data.map((item) => <div key={item.source}><i style={{ background: sourceColors[item.source as ContactSource] }} />{sourceLabels[item.source as ContactSource]}<strong>{item.total}</strong></div>)}</div></div>;
};

const RecentContacts = ({ contacts, showOperator }: { contacts: Contact[]; showOperator: boolean }) => contacts.length ? <div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Nome</th><th>Empresa</th><th>Origem</th>{showOperator && <th>Criado por</th>}<th>Data</th></tr></thead><tbody>{contacts.map((contact) => <tr key={contact.id}><td><strong>{contact.name}</strong><small>{contact.email}</small></td><td>{contact.company || "—"}</td><td><span className="badge">{sourceLabels[contact.source]}</span></td>{showOperator && <td>{contact.createdBy.name}</td>}<td>{new Date(contact.createdAt).toLocaleDateString("pt-BR")}</td></tr>)}</tbody></table></div> : <EmptyState>Nenhum contato cadastrado.</EmptyState>;
const PendingList = ({ pending }: { pending: PendingRequest[] }) => pending.length ? <div className="dashboard-pending-list">{pending.map((item) => <div className="dashboard-pending-row" key={item.id}><span className="dashboard-avatar">{item.name.slice(0, 1).toUpperCase()}</span><div><strong>{item.name}</strong><small>{item.email}</small></div><a className="button button-secondary button-small" href="#requests">Analisar</a></div>)}</div> : <EmptyState>Nenhuma solicitacao pendente.</EmptyState>;
