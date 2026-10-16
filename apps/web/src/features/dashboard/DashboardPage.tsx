import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import { AppShell } from "../../components/layout/AppShell";
import { EmptyState } from "../../components/ui/EmptyState";
import { listPendingRequests } from "../admin-requests/admin-requests.api";
import type { PendingRequest } from "../admin-requests/admin-requests.types";
import { logout } from "../auth/auth.api";
import type { AuthUser } from "../auth/auth.types";
import { listContacts } from "../contacts/contacts.api";
import type { Contact, ContactSource } from "../contacts/contacts.types";

import { DashboardFilters } from "./DashboardFilters";
import { getDashboard, type DashboardData } from "./dashboard.api";

type DashboardPageProps = { onLogout: () => void; user: AuthUser };
const sourceLabels: Record<ContactSource, string> = { OTHER: "Outro", PHONE: "Telefone", REFERRAL: "Indicacao", SOCIAL_MEDIA: "Redes sociais", WEBSITE: "Site" };
const sourceColors: Record<ContactSource, string> = { OTHER: "#64748b", PHONE: "#d97706", REFERRAL: "#16a34a", SOCIAL_MEDIA: "#7c3aed", WEBSITE: "#2563eb" };

export const DashboardPage = ({ user, onLogout }: DashboardPageProps) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [operatorId, setOperatorId] = useState("");

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams();
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
    const socket = io({ autoConnect: false, transports: ["websocket"] });
    socket.on("contact:created", () => { void load(); });
    if (user.role === "ADMIN") socket.on("registration:requested", () => { void load(); });
    socket.connect();
    return () => { active = false; socket.disconnect(); };
  }, [operatorId, user.role]);

  const signOut = async () => { try { await logout(); } finally { onLogout(); } };
  return <AppShell activeSection="overview" breadcrumb="Workspace / Dashboard" title="Dashboard" user={user} onLogout={() => void signOut()}>
    <section className="dashboard-page-head"><div><p className="eyebrow">Visao geral</p><h2>Acompanhe contatos, operadores e solicitacoes</h2><p className="muted">Metricas atualizadas a partir dos registros visiveis para seu perfil.</p></div><DashboardFilters onOperatorChange={setOperatorId} operatorId={operatorId} operators={data?.availableOperators ?? []} role={user.role} /></section>
    {error && <div className="notice danger">{error}</div>}
    {!data ? <EmptyState>Carregando metricas...</EmptyState> : <DashboardContent contacts={contacts} data={data} pending={pending} user={user} />}
  </AppShell>;
};

const DashboardContent = ({ contacts, data, pending, user }: { contacts: Contact[]; data: DashboardData; pending: PendingRequest[]; user: AuthUser }) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayTotal = data.series.find((item) => item.period === today)?.total ?? 0;
  const sourceTotal = data.bySource.reduce((total, item) => total + item.total, 0);
  return <>
    <section className="dashboard-metrics"><MetricCard icon="contacts" tone="blue" value={data.summary.contacts} label="Total de contatos" detail="no periodo" /><MetricCard icon="today" tone="green" value={todayTotal} label="Contatos cadastrados hoje" detail={data.interval === "day" ? "intervalo diario" : "intervalo selecionado"} /><MetricCard icon="operators" tone="navy" value={data.availableOperators.length || (user.role === "OPERATOR" ? 1 : 0)} label="Operadores ativos" detail="com acesso ativo" /><MetricCard icon="sources" tone="amber" value={sourceTotal ? data.bySource.filter((item) => item.total > 0).length : 0} label="Origens utilizadas" detail="fontes com registros" /></section>
    <section className="dashboard-grid dashboard-grid-charts"><article className="card dashboard-card"><DashboardCardHead title="Contatos cadastrados" subtitle="Ultimos sete dias" /><LineChart data={data.series} interval={data.interval} /></article><article className="card dashboard-card"><DashboardCardHead title="Contatos por origem" subtitle="Distribuicao total" /><SourceChart data={data.bySource} /></article></section>
    <section className="dashboard-grid dashboard-grid-lower"><article className="card dashboard-card"><DashboardCardHead title={user.role === "ADMIN" ? "Contatos recentes" : "Meus contatos recentes"} subtitle="Ultimos cadastros visiveis" actionLabel="Ver todos" actionHref="#contacts" /><RecentContacts contacts={contacts} showOperator={user.role === "ADMIN"} /></article>{user.role === "ADMIN" && <article className="card dashboard-card"><DashboardCardHead title="Solicitações pendentes" subtitle="Aguardando análise" actionLabel="Ver todas" actionHref="#requests" /><PendingList pending={pending} /></article>}</section>
  </>;
};

type MetricIconName = "contacts" | "operators" | "sources" | "today";

const MetricIcon = ({ name }: { name: MetricIconName }) => {
  if (name === "contacts") return <svg className="dashboard-metric-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.7-3 2.5-4.5 5.5-4.5s4.8 1.5 5.5 4.5" /><path d="M16 5.5a3 3 0 0 1 0 5.8M16.5 14.7c2.1.5 3.4 1.9 4 4.3" /></svg>;
  if (name === "today") return <svg className="dashboard-metric-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M7 3.5v3M17 3.5v3M3.5 9.5h17M8 14l2 2 5-5" /></svg>;
  if (name === "operators") return <svg className="dashboard-metric-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.7-3 2.5-4.5 5.5-4.5 1.7 0 3 .5 4 1.5M17 11v6M14 14h6" /></svg>;
  return <svg className="dashboard-metric-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /><path d="m4 7 6-3 6 4 6-5" /></svg>;
};

const MetricCard = ({ detail, icon, label, tone, value }: { detail: string; icon: MetricIconName; label: string; tone: string; value: number }) => <article className="card dashboard-metric"><span className={`dashboard-metric-icon ${tone}`}><MetricIcon name={icon} /></span><strong>{value}</strong><span className="dashboard-metric-label">{label}</span><small>{detail}</small></article>;
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
  const rawMax = Math.max(...values.map((item) => item.total), 0);
  const max = rawMax === 0 ? 1 : Math.ceil(rawMax / 2) * 2;
  const middle = max / 2;
  const y = (total: number) => 92 - (total / max) * 72;
  const x = (index: number) => values.length === 1 ? 50 : index * (100 / (values.length - 1));
  const points = values.map((item, index) => `${x(index)},${y(item.total)}`).join(" ");
  return <div className="dashboard-line-chart"><div className="dashboard-chart-body"><div className="dashboard-y-axis"><span>{max}</span><span>{middle}</span><span>0</span></div><div className="dashboard-chart-plot"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Contatos por periodo"><defs><linearGradient id="dashboard-line-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity=".18" /><stop offset="100%" stopColor="#2563eb" stopOpacity="0" /></linearGradient></defs><line x1="0" y1="20" x2="100" y2="20" /><line x1="0" y1="56" x2="100" y2="56" /><line x1="0" y1="92" x2="100" y2="92" /><polygon className="dashboard-chart-area" points={`0,92 ${points} 100,92`} /><polyline points={points} /></svg>{values.map((item, index) => { const period = formatPeriod(item.period, interval); const tooltip = `${period}: ${item.total} contatos cadastrados`; const edgeClass = index === 0 ? " is-first" : index === values.length - 1 ? " is-last" : ""; return <span className={`dashboard-chart-point${edgeClass}`} key={`${item.period}-${index}`} style={{ left: `${x(index)}%`, top: `${y(item.total)}%` }} title={tooltip} aria-label={tooltip} data-tooltip={tooltip} />; })}</div></div><div className="dashboard-chart-labels">{values.map((item, index) => <span key={`${item.period}-${index}`} style={{ left: `${x(index)}%` }}>{formatPeriod(item.period, interval)}</span>)}</div><div className="dashboard-chart-status"><i /> Atualização em tempo real</div>{!data.length && interval !== "day" && <small className="dashboard-chart-empty">Sem dados no período selecionado</small>}</div>;
};

const SourceChart = ({ data }: { data: DashboardData["bySource"] }) => {
  const total = data.reduce((sum, item) => sum + item.total, 0);
  let cursor = 0;
  const stops = data.map((item) => { const start = cursor; cursor += total ? (item.total / total) * 100 : 0; return `${sourceColors[item.source as ContactSource]} ${start}% ${cursor}%`; }).join(", ");
  return <div className="dashboard-source-chart"><div className="dashboard-donut" style={{ background: `conic-gradient(${stops || "#e2e8f0 0 100%"})` }}><span>{total}</span><small>contatos</small></div><div className="dashboard-legend">{data.map((item) => <div key={item.source}><i style={{ background: sourceColors[item.source as ContactSource] }} />{sourceLabels[item.source as ContactSource]}<strong>{item.total}</strong></div>)}</div></div>;
};

const RecentContacts = ({ contacts, showOperator }: { contacts: Contact[]; showOperator: boolean }) => contacts.length ? <div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Nome</th><th>Empresa</th><th>Origem</th>{showOperator && <th>Criado por</th>}<th>Data</th></tr></thead><tbody>{contacts.map((contact) => <tr key={contact.id}><td><strong>{contact.name}</strong><small>{contact.email}</small></td><td>{contact.company || "—"}</td><td><span className="badge">{sourceLabels[contact.source]}</span></td>{showOperator && <td>{contact.createdBy.name}</td>}<td>{new Date(contact.createdAt).toLocaleDateString("pt-BR")}</td></tr>)}</tbody></table></div> : <EmptyState>Nenhum contato cadastrado.</EmptyState>;
const PendingList = ({ pending }: { pending: PendingRequest[] }) => pending.length ? <div className="dashboard-pending-list">{pending.map((item) => <div className="dashboard-pending-row" key={item.id}><span className="dashboard-avatar">{item.name.slice(0, 1).toUpperCase()}</span><div><strong>{item.name}</strong><small>{item.email}</small></div><a className="button button-secondary button-small" href="#requests">Analisar</a></div>)}</div> : <EmptyState>Nenhuma solicitacao pendente.</EmptyState>;
