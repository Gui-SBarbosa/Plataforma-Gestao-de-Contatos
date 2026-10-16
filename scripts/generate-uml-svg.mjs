import { mkdir, writeFile } from 'node:fs/promises';

const out = new URL('../docs/assets/uml/', import.meta.url);
await mkdir(out, { recursive: true });

const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

function base(title, subtitle, body, width = 1200, height = 720) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#64748b"/></marker>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="#0f172a" flood-opacity="0.10"/></filter>
  </defs>
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <rect x="0" y="0" width="100%" height="92" fill="#172554"/>
  <text x="48" y="44" font-family="Inter,Arial,sans-serif" font-size="25" font-weight="700" fill="#fff">${esc(title)}</text>
  <text x="48" y="70" font-family="Inter,Arial,sans-serif" font-size="14" fill="#bfdbfe">${esc(subtitle)}</text>
  ${body}
  <text x="1152" y="694" text-anchor="end" font-family="Inter,Arial,sans-serif" font-size="12" fill="#64748b">GestCon · UML</text>
</svg>`;
}

const text = (x, y, value, options = {}) => `<text x="${x}" y="${y}" text-anchor="${options.anchor ?? 'start'}" font-family="Inter,Arial,sans-serif" font-size="${options.size ?? 14}" font-weight="${options.weight ?? 400}" fill="${options.fill ?? '#0f172a'}">${esc(value)}</text>`;
const line = (x1, y1, x2, y2, label = '', dashed = false) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#64748b" stroke-width="2" ${dashed ? 'stroke-dasharray="7 6"' : ''} marker-end="url(#arrow)"/>${label ? text((x1 + x2) / 2, (y1 + y2) / 2 - 8, label, { anchor: 'middle', size: 12, fill: '#475569' }) : ''}`;
const box = (x, y, w, h, title, lines = [], color = '#ffffff', border = '#93c5fd') => {
  const content = lines.map((item, index) => text(x + 18, y + 54 + index * 22, item, { size: 13, fill: '#334155' })).join('');
  return `<g filter="url(#shadow)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${color}" stroke="${border}" stroke-width="1.5"/></g>${text(x + 18, y + 29, title, { size: 16, weight: 700, fill: '#1e3a8a' })}${content}`;
};
const actor = (x, y, label) => `<g><circle cx="${x}" cy="${y}" r="17" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/><line x1="${x}" y1="${y + 17}" x2="${x}" y2="${y + 67}" stroke="#2563eb" stroke-width="3"/><line x1="${x - 25}" y1="${y + 37}" x2="${x + 25}" y2="${y + 37}" stroke="#2563eb" stroke-width="3"/><line x1="${x}" y1="${y + 67}" x2="${x - 22}" y2="${y + 95}" stroke="#2563eb" stroke-width="3"/><line x1="${x}" y1="${y + 67}" x2="${x + 22}" y2="${y + 95}" stroke="#2563eb" stroke-width="3"/>${text(x, y + 122, label, { anchor: 'middle', weight: 700, fill: '#1e3a8a' })}</g>`;

const useCases = base('Diagrama de casos de uso', 'Atores e capacidades do produto', `
  ${actor(95, 250, 'Visitante')}${actor(95, 465, 'Operador')}${actor(1105, 355, 'Administrador')}
  <rect x="220" y="125" width="760" height="500" rx="18" fill="#eff6ff" stroke="#60a5fa" stroke-width="2"/>
  ${text(250, 160, 'Sistema GestCon', { size: 18, weight: 700, fill: '#1e3a8a' })}
  ${box(270, 195, 260, 92, 'Autenticação', ['Entrar e encerrar sessão'])}
  ${box(270, 320, 260, 112, 'Solicitação de acesso', ['Enviar cadastro', 'Acompanhar aprovação'])}
  ${box(270, 468, 260, 105, 'Contatos', ['Cadastrar', 'Listar com paginação'])}
  ${box(650, 190, 275, 112, 'Gestão de usuários', ['Cadastrar operador', 'Aprovar ou rejeitar'])}
  ${box(650, 337, 275, 105, 'Supervisão', ['Receber notificações', 'Consultar auditoria'])}
  ${box(650, 478, 275, 92, 'Dashboard', ['Consultar métricas'])}
  ${line(120, 280, 270, 240)}${line(120, 500, 270, 515)}${line(120, 295, 270, 365)}
  ${line(1080, 390, 925, 245)}${line(1080, 400, 925, 385)}${line(1080, 410, 925, 520)}
`);

const components = base('Diagrama de componentes', 'Monólito modular e dependências principais', `
  ${box(55, 280, 180, 105, 'React + Vite', ['SPA', 'REST + Socket.IO'], '#fff', '#60a5fa')}
  <rect x="305" y="132" width="650" height="470" rx="18" fill="#eff6ff" stroke="#60a5fa" stroke-width="2"/>
  ${text(335, 168, 'GestCon — processo Node.js', { size: 18, weight: 700, fill: '#1e3a8a' })}
  ${box(345, 205, 180, 85, 'Express API', ['HTTP / JSON'])}
  ${box(735, 205, 180, 85, 'Socket.IO', ['WSS / rooms'])}
  ${box(345, 340, 165, 105, 'Auth + Users', ['Sessões', 'Aprovações'])}
  ${box(548, 340, 165, 105, 'Contacts', ['Ownership', 'Paginação'])}
  ${box(750, 340, 165, 105, 'Notifications', ['Persistência', 'Eventos'])}
  ${box(448, 490, 365, 78, 'Prisma repositories', ['Transações e acesso tipado'])}
  ${box(1010, 280, 155, 105, 'PostgreSQL', ['Fonte de verdade'], '#fff7ed', '#fb923c')}
  ${line(235, 332, 345, 250, 'HTTPS')}${line(235, 350, 735, 250, 'WSS')}
  ${line(435, 290, 430, 340)}${line(455, 290, 625, 340)}${line(825, 290, 835, 340)}
  ${line(430, 445, 535, 490)}${line(630, 445, 630, 490)}${line(835, 445, 725, 490)}
  ${line(813, 530, 1010, 332, 'SQL')}
`);

const deployment = base('Diagrama de implantação', 'Topologia inicial de produção no Railway', `
  ${box(65, 250, 230, 150, 'Navegador', ['React SPA', 'Cookie HttpOnly', 'HTTPS / WSS'], '#fff', '#60a5fa')}
  <rect x="390" y="145" width="735" height="430" rx="20" fill="#eff6ff" stroke="#60a5fa" stroke-width="2"/>
  ${text(420, 185, 'Ambiente Railway', { size: 19, weight: 700, fill: '#1e3a8a' })}
  ${box(455, 245, 300, 190, 'GestCon App — 1 réplica', ['Node.js + Express', 'Socket.IO', 'React build estático', 'Health checks'], '#fff', '#60a5fa')}
  ${box(860, 270, 205, 145, 'PostgreSQL', ['Usuários e sessões', 'Contatos', 'Notificações e auditoria'], '#fff7ed', '#fb923c')}
  ${line(295, 320, 455, 320, 'HTTPS / WSS')}${line(755, 340, 860, 340, 'TLS / SQL')}
  ${text(455, 500, 'Escala futura: múltiplas réplicas + Redis adapter', { size: 14, fill: '#475569' })}
`);

const classes = base('Diagrama de classes do domínio', 'Entidades persistidas e relações principais', `
  ${box(45, 140, 270, 250, 'User', ['id: UUID', 'name: String', 'email: String [unique]', 'passwordHash: String', 'role: Role', 'status: UserStatus', 'approvedById: UUID?', 'approvedAt: DateTime?'])}
  ${box(455, 125, 280, 245, 'Contact', ['id: UUID', 'name: String', 'email: String', 'phone: String', 'company: String?', 'city: String?', 'source: ContactSource', 'createdById: UUID'])}
  ${box(855, 140, 280, 225, 'Notification', ['id: UUID', 'recipientId: UUID', 'type: NotificationType', 'title: String', 'payload: Json', 'readAt: DateTime?', 'createdAt: DateTime'])}
  ${box(40, 480, 260, 165, 'AuditLog', ['id: UUID', 'actorId: UUID?', 'action: String', 'entityType: String', 'entityId: UUID?', 'metadata: Json'])}
  ${box(380, 500, 220, 125, 'Session', ['sid: String', 'sess: Json', 'expire: DateTime'])}
  ${box(680, 470, 455, 180, 'RateLimitBucket', ['id: UUID', 'scope: String', 'keyHash: String [HMAC]', 'windowStart: DateTime', 'count: Int', 'expiresAt: DateTime'])}
  ${line(315, 245, 455, 245, '1 cria 0..*')}${line(735, 245, 855, 245, 'gera 0..*')}
  ${line(170, 390, 170, 480, '0..* ações')}${line(490, 500, 250, 390, 'identidade', true)}
  ${line(680, 545, 315, 340, 'protege autenticação', true)}
`);

function sequence(title, subtitle, participants, messages) {
  const xs = participants.map((_, i) => 95 + i * (1010 / (participants.length - 1)));
  const heads = participants.map((p, i) => `${box(xs[i] - 72, 125, 144, 62, p, [], '#fff', '#60a5fa')}<line x1="${xs[i]}" y1="187" x2="${xs[i]}" y2="645" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 6"/>`).join('');
  const arrows = messages.map((m, i) => {
    const y = 225 + i * 47;
    const [from, to, label] = m;
    const direction = xs[to] >= xs[from] ? 1 : -1;
    const start = xs[from] + direction * 8;
    const end = xs[to] - direction * 8;
    return `${line(start, y, end, y, label)}${text(xs[from], y - 9, String(i + 1), { anchor: 'middle', size: 11, weight: 700, fill: '#2563eb' })}`;
  }).join('');
  return base(title, subtitle, heads + arrows);
}

const registration = sequence('Diagrama de sequência — aprovação', 'Persistência antes do evento em tempo real', ['Operador', 'React', 'Express', 'PostgreSQL', 'Socket.IO', 'Admin'], [
  [0, 1, 'preenche cadastro'], [1, 2, 'POST /auth/register'], [2, 3, 'User(PENDING) + token hash'], [3, 2, 'commit'], [2, 1, '202 + trackingToken'], [1, 4, 'registration:watch'], [4, 3, 'validar token'], [4, 5, 'solicitação pendente'], [5, 2, 'aprovar usuário'], [2, 3, 'ACTIVE + audit log'], [3, 2, 'commit'], [2, 4, 'registration:approved'], [4, 1, 'status ACTIVE']
]);

const contact = sequence('Diagrama de sequência — novo contato', 'Notificação confiável com emissão pós-commit', ['Operador', 'React', 'Express', 'PostgreSQL', 'Socket.IO', 'Admin'], [
  [0, 1, 'envia formulário'], [1, 2, 'POST /contacts'], [2, 2, 'sessão + RBAC + Zod'], [2, 3, 'transação: contato + notificação + audit'], [3, 2, 'commit'], [2, 4, 'contact:created'], [4, 5, 'notificação em tempo real'], [2, 1, '201 Contact'], [1, 0, 'confirma cadastro']
]);

const status = base('Diagrama de estados — usuário', 'Ciclo de vida de acesso ao GestCon', `
  <circle cx="105" cy="355" r="15" fill="#172554"/>
  ${line(120, 355, 260, 355, 'solicitação')}
  ${box(260, 305, 190, 100, 'PENDING', ['Aguardando decisão'], '#fff7ed', '#fb923c')}
  ${line(450, 330, 620, 245, 'aprovar')}${line(450, 380, 620, 485, 'rejeitar')}
  ${box(620, 190, 190, 100, 'ACTIVE', ['Pode autenticar'], '#ecfdf5', '#34d399')}
  ${box(620, 440, 190, 100, 'REJECTED', ['Acesso negado'], '#fef2f2', '#f87171')}
  ${line(810, 240, 970, 330, 'desativar')}
  ${box(970, 305, 180, 100, 'DISABLED', ['Acesso suspenso'], '#f1f5f9', '#94a3b8')}
  ${line(970, 385, 810, 275, 'reativar')}
  <circle cx="925" cy="490" r="18" fill="none" stroke="#172554" stroke-width="3"/><circle cx="925" cy="490" r="11" fill="#172554"/>
  ${line(810, 490, 907, 490, 'fim')}
`);

const files = {
  'use-cases.svg': useCases,
  'components.svg': components,
  'deployment.svg': deployment,
  'domain-classes.svg': classes,
  'registration-sequence.svg': registration,
  'contact-sequence.svg': contact,
  'user-status.svg': status,
};

for (const [name, content] of Object.entries(files)) {
  await writeFile(new URL(name, out), content, 'utf8');
}

console.log(`Generated ${Object.keys(files).length} UML SVG files.`);

