import { useEffect, useState } from "react";

import { AppShell } from "../../components/layout/AppShell";
import { EmptyState } from "../../components/ui/EmptyState";
import { logout } from "../auth/auth.api";
import type { AuthUser } from "../auth/auth.types";

import { getDashboard, type DashboardData } from "./dashboard.api";

type DashboardPageProps = {
  onLogout: () => void;
  user: AuthUser;
};

export const DashboardPage = ({ user, onLogout }: DashboardPageProps) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [interval, setInterval] = useState("day");
  const [operatorId, setOperatorId] = useState("");

  useEffect(() => {
    const query = new URLSearchParams({ interval });
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    if (operatorId) query.set("operatorId", operatorId);

    getDashboard(query).then((response) => setData(response.data));
  }, [from, interval, operatorId, to]);

  return (
    <AppShell activeSection="overview" breadcrumb="Workspace / Dashboard" title="Dashboard" user={user} onLogout={() => void logout().finally(onLogout)}>
      <section className="content-head">
        <div>
          <p className="eyebrow">Análise</p>
          <h2>Resumo dos contatos</h2>
        </div>
        <div className="dashboard-filters">
          <input className="input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <input className="input" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          <select className="input" value={interval} onChange={(event) => setInterval(event.target.value)}>
            <option value="day">Dia</option>
            <option value="week">Semana</option>
            <option value="month">Mês</option>
          </select>
          {user.role === "ADMIN" && (
            <select className="input" value={operatorId} onChange={(event) => setOperatorId(event.target.value)}>
              <option value="">Todos operadores</option>
              {data?.availableOperators.map((operator) => (
                <option key={operator.id} value={operator.id}>{operator.name}</option>
              ))}
            </select>
          )}
        </div>
      </section>
      {!data ? (
        <EmptyState>Carregando métricas…</EmptyState>
      ) : (
        <section className="metric-grid">
          <article className="card metric-card"><span>Total</span><strong>{data.summary.contacts}</strong></article>
          <article className="card metric-card"><span>Origens</span><strong>{data.bySource.filter((item) => item.total > 0).length}</strong></article>
        </section>
      )}
    </AppShell>
  );
};
