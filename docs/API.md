# Contratos da API e tempo real

Prefixo: `/api`

## OpenAPI

A documentação interativa Swagger está disponível em `/docs` somente quando
`NODE_ENV=development`. A rota não é registrada em teste ou produção e documenta
apenas os endpoints já implementados.

## Convenções

Resposta de sucesso:

```json
{ "data": {} }
```

Erro:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Não foi possível processar a solicitação.",
    "requestId": "uuid"
  }
}
```

Paginação:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 20,
    "totalPages": 2
  }
}
```

## Autenticação

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/auth/csrf` | Público | Cria ou retorna o token CSRF da sessão atual |
| POST | `/auth/register` | Público | Solicita cadastro de operador |
| POST | `/auth/login` | Público | Cria sessão |
| POST | `/auth/logout` | Autenticado | Encerra sessão |
| GET | `/auth/me` | Autenticado | Retorna usuário atual |
| GET | `/auth/registration-status` | Tracking token | Recupera estado após reconexão |

`POST /auth/register`:

```json
{
  "name": "Operador Demo",
  "email": "operador@example.com",
  "password": "senha-forte"
}
```

Retorna `202 Accepted` com `status: PENDING` e um `trackingToken` opaco, exibido somente nessa resposta. O cadastro não cria sessão; o operador só pode autenticar após aprovação.

`GET /auth/registration-status?trackingToken=...` retorna apenas `status` e `decidedAt`, sem dados de usuário, e possui o limite próprio de 60 consultas por minuto. O cliente usa o mesmo token opaco para acompanhar a solicitação no Socket.IO.

Antes de operações de escrita, o cliente obtém `GET /auth/csrf` com credenciais e envia o token retornado no header `X-CSRF-Token`.

Os endpoints de autenticação podem responder:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 741
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 741
```

A mensagem permanece genérica e não confirma se o e-mail está cadastrado.

Resposta `202 Accepted`:

```json
{
  "data": {
    "status": "PENDING",
    "trackingToken": "valor-opaco-retornado-uma-vez"
  }
}
```

## Administração de usuários

| Método | Rota | Acesso |
|---|---|---|
| GET | `/admin/users?status=PENDING&page=1&pageSize=10` | ADMIN |
| POST | `/admin/users` | ADMIN |
| PATCH | `/admin/users/:id/approve` | ADMIN |
| PATCH | `/admin/users/:id/reject` | ADMIN |
| PATCH | `/admin/users/:id/disable` | ADMIN |
| PATCH | `/admin/users/:id/activate` | ADMIN |

Transições inválidas retornam `409 Conflict`.

Nesta etapa, `POST /admin/users` cria somente um operador `ACTIVE` e exige `name`, `email` e `password`; a rota requer sessão de administrador e `X-CSRF-Token`.

`GET /admin/users` retorna apenas solicitações `PENDING`, com paginação e sem hashes ou tracking tokens. `PATCH /admin/users/:id/approve` muda uma solicitação pendente para `ACTIVE`, registra o administrador e a data da aprovação; `PATCH /admin/users/:id/reject` muda-a para `REJECTED`. As duas rotas exigem sessão administrativa e `X-CSRF-Token`, retornam `409 Conflict` para estados diferentes de `PENDING` e não iniciam sessão para o operador.

## Contatos

| Método | Rota | Acesso |
|---|---|---|
| POST | `/contacts` | OPERATOR ou ADMIN |
| GET | `/contacts?page=1&pageSize=10` | OPERATOR ou ADMIN |
| GET | `/contacts/:id` | Dono ou ADMIN |

Cadastro:

```json
{
  "name": "Maria Silva",
  "email": "maria@example.com",
  "phone": "+55 62 99999-0000",
  "company": "Empresa Demo",
  "city": "Anápolis",
  "source": "REFERRAL"
}
```

## Notificações

| Método | Rota | Acesso |
|---|---|---|
| GET | `/notifications?page=1&pageSize=10` | Autenticado |
| PATCH | `/notifications/:id/read` | Destinatário |
| PATCH | `/notifications/read-all` | Autenticado |

## Dashboard e auditoria

| Método | Rota | Acesso |
|---|---|---|
| GET | `/admin/dashboard` | ADMIN |
| GET | `/admin/audit-logs?page=1&pageSize=20` | ADMIN |

## Eventos Socket.IO

### Cliente para servidor

| Evento | Payload | Autorização |
|---|---|---|
| `registration:watch` | `{ trackingToken }` | Token válido |
| `registration:unwatch` | sem payload | Socket já autorizado |

### Servidor para cliente

| Evento | Destino | Payload mínimo |
|---|---|---|
| `registration:requested` | `admins` | id, name, createdAt |
| `registration:approved` | sala da solicitação | status, decidedAt |
| `registration:rejected` | sala da solicitação | status, decidedAt |
| `contact:created` | `admins` | contactId, creatorName, createdAt |
| `notification:created` | usuário | notification segura |
| `dashboard:updated` | `admins` | métricas ou sinal para revalidar |

O servidor ignora qualquer sala ou papel declarado diretamente pelo cliente.

O cliente emite `registration:watch` com o tracking token e recebe o estado atual no acknowledgement. Depois de uma decisão persistida, a sala autorizada recebe `registration:approved` ou `registration:rejected`; em reconexões, a consulta HTTP continua sendo a fonte de verdade.

## Status HTTP principais

| Status | Uso |
|---|---|
| 200 | Consulta ou atualização bem-sucedida |
| 201 | Recurso criado |
| 202 | Solicitação aceita e pendente |
| 204 | Logout ou ação sem corpo |
| 400 | Entrada inválida |
| 401 | Sem autenticação válida |
| 403 | Autenticado, mas sem permissão |
| 404 | Recurso não encontrado ou não visível |
| 409 | Duplicidade ou transição inválida |
| 429 | Rate limit |
| 503 | Dependência de segurança indisponível; tentativa não processada |
