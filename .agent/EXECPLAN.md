# ExecPlan — Implementação do GestCon

## Objetivo e resultado esperado

Construir e publicar um monólito modular que permita cadastro e aprovação de operadores em tempo real, autenticação segura, cadastro paginado de contatos, notificações persistentes e acompanhamento administrativo.

## Contexto e restrições

- Prazo de entrega: 16/10/2026 às 16h, horário de Brasília.
- Prioridade: requisitos obrigatórios, segurança, clareza das decisões e qualidade da demonstração.
- Deploy alvo: Railway, com aplicação e PostgreSQL.
- Escala inicial: uma instância da aplicação.
- Nome provisório do produto: GestCon.

## Decisões vigentes

- Monólito modular com um único deploy.
- React + Vite + TypeScript.
- Express + TypeScript.
- PostgreSQL + Prisma.
- Sessão server-side persistida no PostgreSQL.
- Rate limiting persistente no PostgreSQL com chaves protegidas por HMAC.
- Socket.IO no mesmo processo HTTP.
- Jest + Supertest.
- Operador visualiza somente contatos criados por ele; administrador visualiza todos.
- Aprovação não autentica automaticamente o solicitante.

## Etapas

| Estado      | Etapa                    | Saída verificável                                                 |
| ----------- | ------------------------ | ----------------------------------------------------------------- |
| completed   | Fundação do repositório  | Workspaces, scripts, lint, TypeScript e app mínima compilando     |
| in_progress | Banco e seed             | Schema, migrations, sessão, admin e 20+ contatos de demonstração  |
| pending     | Autenticação             | Registro, login, logout, `me`, cookies e rate limiter persistente |
| pending     | Aprovação em tempo real  | Painel admin, tracking token e eventos de aprovação/rejeição      |
| pending     | Contatos                 | Cadastro, RBAC, ownership e paginação backend                     |
| pending     | Notificações e auditoria | Persistência, leitura e eventos pós-commit                        |
| pending     | Dashboard                | Métricas essenciais e atualização por evento                      |
| pending     | Qualidade                | Jest/Supertest, lint, typecheck, build e revisão de segurança     |
| pending     | Deploy                   | Railway, migrations, seed de demo e smoke test                    |
| pending     | Entrega                  | README final, UML, apresentação e roteiro de demonstração         |

## Critérios de aceite

Usar os identificadores `AC-*` definidos em `docs/REQUIREMENTS.md`. Nenhuma etapa obrigatória termina com critérios relacionados falhando.

## Riscos e mitigação

| Risco                                   | Mitigação                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------- |
| Tempo insuficiente                      | Congelar extras até todos os requisitos obrigatórios passarem               |
| Socket desconectar                      | Reconexão automática e consulta do estado ao reconectar                     |
| Evento emitido antes do commit          | Emitir somente após confirmação da transação                                |
| Sessão e WebSocket divergirem           | Reutilizar o middleware de sessão no handshake do Socket.IO                 |
| Deploy falhar próximo do prazo          | Primeiro deploy assim que autenticação estiver operacional                  |
| Escala horizontal quebrar eventos       | Manter uma réplica e documentar Redis como evolução                         |
| Ataque gerar escrita excessiva no banco | Limites por escopo, índice de expiração, limpeza periódica e payload mínimo |

## Registro de decisões e mudanças

- 13/10/2026 — arquitetura inicial definida como monólito modular.
- 13/10/2026 — Jest + Supertest escolhidos para testes do backend.
- 13/10/2026 — PlantUML escolhido como fonte dos diagramas UML.
- 13/10/2026 — Rate limiter persistente no PostgreSQL tornou-se obrigatório para endpoints sensíveis.
- 14/10/2026 — fundação entregue como monorepo npm com `apps/api` e `apps/web`; os comandos `dev:api` e `dev:web` permitem iniciar cada aplicação separadamente.
- 14/10/2026 — testes de integração executam o artefato TypeScript compilado pelo Jest e Supertest. A mudança evita dependência de binding nativo na fundação e preserva os testes HTTP reais definidos no ADR 0005.
- 14/10/2026 — a referência visual fornecida no Open Design será a base de tokens e componentes do frontend nas etapas de interface correspondentes.
- 14/10/2026 — Prisma 6.16 foi fixado por compatibilidade com Node 20; o seed usa `@node-rs/argon2` com algoritmo Argon2id e exige senhas fornecidas pelo ambiente.
- 14/10/2026 — o backlog P0 passou a ser sequencial: somente o primeiro item pendente pode ser trabalhado. A etapa de banco permanece em andamento até a validação em PostgreSQL real.
- 14/10/2026 — os scripts Prisma da API passaram a carregar explicitamente o `.env` da raiz, evitando divergência entre o diretório do workspace e a configuração local do banco.

## Validações executadas

- 14/10/2026 — `npm run lint`: aprovado.
- 14/10/2026 — `npm run typecheck`: aprovado para API e web.
- 14/10/2026 — `npm run test:integration --workspace=@gestcon/api`: 1 teste aprovado para `GET /api/health`.
- 14/10/2026 — `npm run build --workspace=@gestcon/api`: aprovado.
- 14/10/2026 — `npm run build --workspace=@gestcon/web`: aprovado.
- 14/10/2026 — `npm audit --omit=dev --json`: nenhuma vulnerabilidade em dependências de produção.
- 14/10/2026 — `npm run typecheck:db`: aprovado para a seed Prisma.
- 14/10/2026 — `prisma format --check` e `prisma validate`: aprovados.
- 14/10/2026 — teste isolado do Argon2id: aprovado sem persistir credenciais.
- 14/10/2026 — migration SQL inicial gerada por `prisma migrate diff --from-empty` e adicionada ao repositório.
- 14/10/2026 — validação final de lint, typecheck, typecheck da seed, build da API, build web e teste de integração: aprovada.
- 14/10/2026 — ambiente local documentado com `compose.yaml`, PostgreSQL 16, senha obrigatória e bind restrito a `127.0.0.1`.
- 14/10/2026 — `docker compose config --quiet`, lint, typecheck, typecheck da seed e builds: aprovados.
- 14/10/2026 — `npm run db:deploy`: aprovado contra o PostgreSQL local; a migration `20261014023000_init` foi aplicada ao banco `gestcon`.
- 14/10/2026 — `npm run db:generate` e `npm run typecheck:db`: aprovados após o ajuste de carregamento do `.env` raiz.
- 14/10/2026 — `npm audit --omit=dev --json` identificou 4 alertas altos encadeados pelo Prisma CLI; a correção sugerida altera a versão fixada por compatibilidade e deve ser avaliada na etapa de qualidade.

## Pendências e próximos passos

- Item atual do backlog: aplicar a migration e executar o seed contra um PostgreSQL disponível.
- Definir `SEED_ADMIN_PASSWORD` e `SEED_OPERATOR_PASSWORD` no `.env` local para executar `npm run db:seed`.
- Validar contagem dos usuários e dos 24 contatos após o seed.
- A migration foi aplicada em PostgreSQL local; o seed permanece bloqueado pela ausência das senhas locais de demonstração.
- Não iniciar autenticação ou qualquer item posterior até concluir e registrar a validação deste item.
