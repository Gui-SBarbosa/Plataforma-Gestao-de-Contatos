# Arquitetura

## Resumo

O GestCon é um monólito modular distribuído como um único artefato. O Express atende a API, o Socket.IO e, em produção, os arquivos compilados do React. O PostgreSQL é a fonte de verdade.

## Motivação

O domínio e a escala inicial não justificam microsserviços. O monólito reduz custo operacional e risco de entrega, enquanto a divisão por módulos preserva limites claros para evolução.

## Contexto

```text
Navegador ── HTTPS/REST ── Aplicação GestCon ── SQL ── PostgreSQL
          └── WSS/Socket.IO ────────────────┘
```

Consulte os diagramas formais em [UML.md](UML.md).

## Módulos

| Módulo        | Responsabilidade                                                 |
| ------------- | ---------------------------------------------------------------- |
| auth          | Registro, login, logout, sessão e tracking token                 |
| users         | Gestão e transição de status de usuários                         |
| contacts      | Cadastro, ownership e paginação                                  |
| notifications | Persistência, leitura e entrega de notificações                  |
| dashboard     | Agregações administrativas                                       |
| audit         | Registro imutável de ações relevantes                            |
| realtime      | Autenticação do socket, salas e publicação pós-commit            |
| rate-limit    | Políticas, chaves HMAC, contadores atômicos e limpeza de buckets |

## Regras de dependência

- Controllers conhecem services e schemas.
- Services conhecem repositórios e contratos de infraestrutura.
- Repositórios encapsulam Prisma.
- Módulos não importam controllers de outros módulos.
- Eventos de aplicação desacoplam contatos de notificações e dashboard.
- O frontend consome contratos públicos, nunca tipos internos do Prisma.

## Estrutura alvo

```text
apps/api/src/
├── config/
├── middlewares/
├── realtime/
├── shared/
└── modules/
    ├── auth/
    ├── users/
    ├── contacts/
    ├── notifications/
    ├── dashboard/
    └── audit/

apps/web/src/
├── components/
├── features/
├── hooks/
├── pages/
├── routes/
└── services/
```

## Persistência e consistência

- Prisma controla schema e migrations.
- Operações compostas usam transação.
- A notificação é persistida antes de ser emitida.
- Eventos Socket.IO são melhoria de experiência, não fonte de verdade.
- Datas são armazenadas em UTC e apresentadas no fuso do usuário.
- Contadores de rate limit usam buckets de janela fixa persistidos e incremento atômico no PostgreSQL.
- Um job idempotente remove buckets expirados sem interferir nas requisições.

## Tempo real

Salas previstas:

| Sala                | Entrada permitida                               |
| ------------------- | ----------------------------------------------- |
| `admins`            | Socket autenticado com papel `ADMIN`            |
| `user:{id}`         | Socket da própria sessão autenticada            |
| `registration:{id}` | Socket com tracking token válido da solicitação |

Eventos e payloads estão descritos em [API.md](API.md).

## Escalabilidade

Fase atual:

- uma instância;
- sessões no PostgreSQL;
- adapter Socket.IO em memória;
- consultas agregadas simples para dashboard.

Evolução caso haja demanda:

- Redis para sessões e adapter Socket.IO;
- múltiplas réplicas;
- outbox transacional para entrega de eventos;
- índices orientados por telemetria;
- worker para agregações pesadas.

## Observabilidade

- Pino em JSON.
- Request ID por requisição.
- Logs de início, término, status e duração.
- Logs de domínio para aprovação, rejeição e criação de contato.
- Sem senha, hash, cookie, token ou dados pessoais completos nos logs.

## Rate limiting persistente

O módulo `rate-limit` aplica políticas por escopo. A chave real — IP, e-mail normalizado ou tracking token — é transformada com `HMAC-SHA-256` antes da persistência. O banco mantém somente `scope`, `keyHash`, início da janela, contador e expiração.

O incremento deve ser feito por `INSERT ... ON CONFLICT DO UPDATE`, nunca por sequência de leitura e escrita. Isso evita ultrapassagem causada por concorrência entre requisições ou réplicas.

Na indisponibilidade do armazenamento, endpoints de autenticação e registro falham de forma fechada com `503`. A aplicação não deve liberar tentativas ilimitadas por falha do rate limiter.
