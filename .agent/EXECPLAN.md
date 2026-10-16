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
- ADMIN administra operadores e solicitações, consulta contatos em modo somente leitura e acompanha métricas globais; OPERATOR cria contatos e visualiza/análise somente seus próprios registros.
- Aprovação não autentica automaticamente o solicitante.

## Etapas

| Estado      | Etapa                    | Saída verificável                                                 |
| ----------- | ------------------------ | ----------------------------------------------------------------- |
| completed   | Fundação do repositório  | Workspaces, scripts, lint, TypeScript e app mínima compilando     |
| completed   | Banco e seed             | Schema, migrations, sessão e administrador de demonstração         |
| completed   | Autenticação             | Login, logout, `me`, sessão server-side, cookies e CSRF           |
| completed   | Rate limiting             | Buckets persistentes, chaves HMAC e limites por escopo            |
| completed   | Documentação OpenAPI       | Especificação Swagger das rotas existentes em `/docs` no desenvolvimento |
| completed   | Limpeza de buckets        | Job idempotente para registros expirados                           |
| completed   | Registro público          | Solicitação de acesso de operador e tracking token                 |
| completed   | Cadastro administrativo   | Criação direta de operador ativo pelo administrador                |
| completed   | Aprovação de solicitações | Listagem administrativa, aprovação e rejeição                      |
| completed   | Acompanhamento em tempo real | Tracking token, estado e eventos de aprovação/rejeição           |
| completed   | Cadastro de contato      | Criação autenticada e atribuição do criador                        |
| completed   | RBAC e ownership         | Consulta direta do próprio contato ou por administrador            |
| completed   | Lista paginada           | Listagem de contatos com paginação backend                         |
| completed   | Notificação em tempo real | Sala administrativa e evento pós-persistência de contato          |
| completed   | Frontend de contatos | Interface modular, escopo por papel e contratos HTTP existentes   |
| in_progress | Notificações e auditoria | Persistência, leitura e auditoria administrativa                   |
| completed   | Dashboard                | Métricas por papel e filtros HTTP por intervalo                    |
| completed   | Qualidade                | Jest/Supertest, lint, typecheck, build e revisão de segurança     |
| pending     | Deploy                   | Railway, migrations, seed de demo e smoke test                    |
| completed   | Entrega (P0.16)          | README executável e documentação de ambiente revisada             |

| completed   | Conditional user email uniqueness | Active/pending emails required and unique; disabled/rejected emails nullable and reusable |
| completed   | Frontend de requests | Admin list and approve/reject actions for pending operators |
| completed   | Frontend de registro público | Formulário de solicitação e acompanhamento em tempo real para visitantes |
| completed   | Frontend architecture refactor | Shared layout/UI components and feature boundaries without behavior changes |

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
- 14/10/2026 — por decisão do solicitante, o seed de demonstração passou a criar somente um administrador ativo; operadores e contatos serão criados manualmente pela plataforma nas etapas posteriores.
- 14/10/2026 — o e-mail do administrador seedado passou a ser obrigatório no ambiente, normalizado antes do upsert e validado sem registrá-lo em logs.
- 14/10/2026 — banco `gestcon` migrado e seed administrativo validado em PostgreSQL local; a etapa de autenticação tornou-se a única etapa em andamento.
- 14/10/2026 — autenticação foi implementada no módulo isolado `auth`, com sessão opaca persistida no PostgreSQL, cookie `HttpOnly`, CORS de origem configurada, CSRF ligado à sessão e headers Helmet.
- 14/10/2026 — etapa de autenticação concluída após smoke test de saúde, CSRF, login do administrador, `me`, logout e confirmação de sessão invalidada.
- 14/10/2026 — iniciada a etapa de rate limiting persistente, limitada nesta entrega aos mecanismos compartilhados e à proteção do login já existente; registro e tracking serão conectados apenas quando suas rotas forem iniciadas no backlog.
- 14/10/2026 — rate limiting persistente concluído com segredo exclusivo para HMAC, incrementos atômicos via upsert no PostgreSQL, políticas centralizadas e proteção do login já existente. As políticas de registro e tracking serão reutilizadas quando essas rotas forem implementadas.
- 14/10/2026 — por solicitação do usuário, a documentação OpenAPI/Swagger será antecipada como etapa complementar antes do job de limpeza; `/docs` ficará disponível exclusivamente com `NODE_ENV=development` e documentará apenas rotas já implementadas.
- 14/10/2026 — documentação OpenAPI concluída com Swagger UI local em `/docs`, registrada somente em `NODE_ENV=development`; as rotas de saúde e autenticação implementadas são a fonte da especificação inicial.
- 14/10/2026 — iniciada a etapa de limpeza de buckets: o job poderá ser executado isoladamente e será agendado a cada 15 minutos no único processo da API, mantendo a decisão atual de uma réplica.
- 14/10/2026 — limpeza de buckets concluída: exclusão idempotente filtrada por `expiresAt`, execução isolada por script e agendamento no processo da API ao iniciar e a cada 15 minutos.
- 14/10/2026 — iniciada a etapa de registro público: será criado um módulo independente que persiste operador pendente, hash Argon2id, hash de token opaco e aplica o limite de registro por IP, sem sessão automática.
- 14/10/2026 — registro público concluído no módulo `registration`: operador `PENDING`, papel `OPERATOR`, Argon2id, tracking token opaco com hash SHA-256, CSRF e rate limit por IP; o cadastro não cria sessão.
- 14/10/2026 — iniciada a etapa de cadastro administrativo: o endpoint criará exclusivamente operadores `ACTIVE`, protegido por sessão, CSRF e RBAC de administrador; criação de novos administradores não faz parte desta etapa.
- 14/10/2026 — cadastro administrativo concluído no módulo `admin-users`: `POST /api/admin/users` cria exclusivamente operadores `ACTIVE`, com senha Argon2id, validação, e-mail normalizado, resposta sem hash e proteção por sessão, CSRF e RBAC de administrador. A criação de administradores adicionais permanece fora do escopo.
- 14/10/2026 — iniciada a etapa de aprovação de solicitações: administradores poderão listar solicitações pendentes e aplicar exclusivamente as transições `PENDING` para `ACTIVE` ou `REJECTED`, protegidas por sessão, CSRF e RBAC. Sessão automática, tracking HTTP e eventos em tempo real permanecem fora desta etapa.
- 14/10/2026 — aprovação de solicitações concluída no módulo `admin-users`: a listagem administrativa paginada expõe somente operadores pendentes e as decisões usam atualização condicional para aplicar uma única transição. Aprovação registra administrador e data; rejeição impede autenticação. Tracking HTTP, Socket.IO e frontend permanecem fora do escopo.
- 14/10/2026 — iniciada a etapa de acompanhamento: será disponibilizada consulta de status com tracking token opaco e limite persistente próprio, além de Socket.IO no mesmo processo HTTP. O servidor validará o token antes de autorizar a sala da solicitação e emitirá eventos somente após a decisão persistida; nenhuma interface React será alterada nesta etapa.
- 14/10/2026 — acompanhamento em tempo real concluído no backend: `GET /api/auth/registration-status` retorna somente estado e data da decisão, com rate limit persistente por token. Socket.IO valida a origem, autoriza a sala somente após validar o token opaco e recebe eventos de aprovação ou rejeição somente após a atualização persistida. Logs redigem token e URL bruta.
- 14/10/2026 — o frontend da etapa de acompanhamento foi iniciado após comunicação prévia ao solicitante, pois a atualização visual sem recarregar é necessária para concluir o AC-03. O escopo visual limita-se ao recurso modular de tracking; contatos e telas administrativas permanecem fora desta etapa.
- 14/10/2026 — acompanhamento concluído no frontend em `features/registration`: a tela cria solicitações, apresenta o tracking token uma única vez e acompanha o estado com consulta HTTP seguida de Socket.IO. O token não é persistido no navegador; o estilo segue tokens da referência Open Design fornecida.
- 14/10/2026 — iniciada a etapa de cadastro de contato: será criado o módulo isolado `contacts` para `POST /api/contacts`, protegido por sessão e CSRF. Esta entrega valida os dados mínimos e persiste o criador autenticado; RBAC/ownership de consulta, paginação, notificações e frontend permanecem fora do escopo.
- 14/10/2026 — cadastro de contato concluído no módulo `contacts`: `POST /api/contacts` exige sessão ativa e CSRF, valida os dados mínimos, normaliza e-mail e persiste `createdById` a partir da sessão. Consulta, ownership de leitura, paginação, notificações e frontend permanecem em etapas posteriores.
- 14/10/2026 — iniciada a etapa de RBAC e ownership de contatos: a consulta direta retornará somente o contato do operador autenticado ou qualquer contato para administrador. Contatos não visíveis retornarão `404`; listagem, paginação, notificações e frontend permanecem fora do escopo.
- 14/10/2026 — RBAC e ownership de contatos concluídos: `GET /api/contacts/:id` permite consulta direta apenas ao criador autenticado ou a administrador. Contatos inexistentes ou não visíveis retornam `404`; a resposta não expõe `createdById`. Listagem, paginação, notificações e frontend permanecem em etapas posteriores.
- 14/10/2026 — iniciada a etapa de lista paginada: `GET /api/contacts` retornará dados e metadados de paginação. Operadores receberão somente os próprios contatos e administradores todos os contatos; filtros, notificações e frontend permanecem fora do escopo.
- 14/10/2026 — lista paginada concluída: `GET /api/contacts` retorna `data` e `meta` com `page`, `pageSize`, `total` e `totalPages`, padrão de 10 itens e máximo de 50. A consulta aplica ownership para operador e visão global para administrador; filtros, notificações e frontend permanecem em etapas posteriores.
- 14/10/2026 — iniciada a etapa de notificação em tempo real: Socket.IO reutilizará a sessão server-side para autorizar exclusivamente administradores na sala `admins`. A criação de contato emitirá evento mínimo somente após a persistência; notificações persistentes, auditoria e frontend permanecem fora do escopo.
- 14/10/2026 — notificação em tempo real concluída: o Socket.IO aplica a sessão server-side no handshake e inclui somente administradores ativos na sala `admins`. `POST /api/contacts` publica `contact:created` após persistência, com `contactId`, `creatorName` e `createdAt`; notificações persistentes, auditoria e frontend permanecem fora do escopo.
- 14/10/2026 — iniciada a etapa de qualidade: serão revisados e ampliados os testes críticos de persistência, concorrência e respostas `429`, preservando os contratos e módulos existentes. Frontend, notificações persistentes e auditoria permanecem fora do escopo.
- 14/10/2026 — etapa de qualidade concluída: a suíte cobre sessão persistente após nova instância, limites persistentes, concorrência entre instâncias, `429` genérico para conta conhecida ou desconhecida e headers de limite para login, registro e tracking. Nenhuma funcionalidade de produto foi adicionada.
- 14/10/2026 — por solicitação do usuário, o frontend de contatos foi antecipado para a etapa 15, após qualidade. A implementação seguirá a referência Open Design fornecida, com composição em `app`, módulos de domínio em `features`, componentes reutilizáveis em `shared` e acesso HTTP isolado em `services`. O backend permanece fonte de verdade para autenticação, autorização e contratos.
- 14/10/2026 — frontend da etapa 15 concluído: login por sessão, listagem paginada, criação de contato, estados de carregamento/erro/vazio, modal e layout responsivo baseado no Open Design. O proxy de desenvolvimento usa `VITE_API_PROXY_TARGET`; nenhum token é persistido no navegador.
- 15/10/2026 — regra de papel detalhada pelo solicitante: ADMIN não cria contatos, apenas gerencia operadores, solicitações e acompanha dados globais; OPERATOR cria contatos e possui escopo exclusivo sobre seus registros. A correção de `POST /api/contacts` e da interface será aplicada nesta etapa; dashboard com filtros ficará pendente como etapa própria.
- 15/10/2026 — reaberta a etapa de frontend para corrigir o escopo por papel: a API passou a bloquear criação por ADMIN e a tela passou a ocultar criação para ADMIN, exibindo responsável/data na visão global.
- 15/10/2026 — correção de papel concluída: `POST /api/contacts` exige `OPERATOR`, a lista administrativa exibe o nome do criador sem expor `createdById`, e a interface remove criação para ADMIN. O contrato de origem foi alinhado aos valores Prisma (`WEBSITE` e `SOCIAL_MEDIA`).
- 15/10/2026 — tela de criação de operador adicionada em `features/admin-users`, acessível somente pela rota visual `#operators` para ADMIN. O formulário usa CSRF, valida confirmação de senha no cliente e não persiste credenciais.
- 15/10/2026 — tela de operadores evoluída para CRUD: sem operadores ativos abre o cadastro; com operadores exibe listagem administrativa, edição de nome/e-mail, desativação lógica e reativação. Exclusão física não será usada para preservar contatos e histórico.
- 15/10/2026 — P0.16 concluída: README e documentação de deploy foram revisados para comandos reais, variáveis obrigatórias, segurança de produção e fluxo Railway. O deploy permanece pendente até a API servir o build web e adotar a porta fornecida pela plataforma.
- 15/10/2026 — iniciada a etapa P0.17: Railway usará `railway.toml` com build, pre-deploy idempotente e healthcheck. O Express servirá o build React na mesma origem e `PORT` terá prioridade em produção.
- 15/10/2026 — por solicitação do usuário, a publicação Railway foi adiada. A ordem de diferenciais será dashboard, notificações/auditoria e CI; dashboard é a única etapa em andamento.
- 15/10/2026 — dashboard concluído: `GET /api/dashboard` agrega contatos com ownership no backend, filtros de data, intervalo e operador administrativo, além de interface em `#overview`. Atualização por evento permanece deliberadamente fora desta etapa e dependerá de notificações/auditoria.
- 15/10/2026 — iniciada a etapa de notificações e auditoria, após concluir o dashboard. A persistência e a auditoria serão tratadas antes da atualização de métricas por evento.
- 16/10/2026 — auditoria administrativa iniciada: administradores consultarão eventos paginados e filtráveis, sem dados sensíveis. A interface mostrará somente contexto seguro, responsável, data e entidade afetada; criações de contato, solicitações, operações administrativas e autenticação passam a produzir eventos compatíveis.

## Validações executadas

- 15/10/2026 — unicidade condicional de e-mail implementada com `CHECK`, índice único parcial e limpeza de e-mail em rejeição/desativação; reativação exige novo e-mail válido.
- 15/10/2026 — migration local e de teste aplicadas; lint, typecheck, builds e 48 testes de integração aprovados após a regra de e-mail condicional.
- 15/10/2026 — tela `#requests` validada com typecheck, ESLint e build Vite; ações usam CSRF e continuam protegidas por sessão/RBAC no backend.
- 15/10/2026 — registro público exposto em `#register`; login, formulário, tracking HTTP e eventos Socket.IO validados com typecheck, ESLint e build Vite.
- 15/10/2026 — arquitetura frontend refatorada com `components`, `features`, `routes` e `services`; typecheck, ESLint e build Vite aprovados sem alterar contratos HTTP.

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
- 14/10/2026 — `npm run db:seed`: aprovado em PostgreSQL local; administrador configurado pelo ambiente confirmado como `ADMIN` e `ACTIVE`, sem expor seu e-mail.
- 14/10/2026 — migration aplicada no banco isolado `gestcon_test`; 7 testes de integração aprovados para CSRF, login de usuário ativo, rejeição de usuário pendente/rejeitado/desativado, `me` e logout.
- 14/10/2026 — lint, typecheck, testes de integração e build da API e web: aprovados após a implementação de autenticação.
- 14/10/2026 — smoke test local de autenticação aprovado: CSRF, login, `me`, logout e resposta `401` após logout.
- 14/10/2026 — lint, typecheck, build e 9 testes de integração aprovados após o rate limiter, incluindo persistência após nova instância e concorrência de 20 tentativas entre instâncias.
- 14/10/2026 — smoke test local de rate limiting aprovado com `.env` raiz: saúde, CSRF, login administrativo, headers de limite, `me` e logout.
- 14/10/2026 — OpenAPI/Swagger validado: 12 testes de integração confirmam documentação disponível em desenvolvimento e `404` fora dele; smoke test local em `/docs/` aprovado.
- 14/10/2026 — job de limpeza validado por teste de idempotência e execução local de `npm run rate-limit:cleanup`, sem buckets expirados a remover.
- 14/10/2026 — lint, typecheck, build e 16 testes de integração aprovados após o registro público, incluindo criação pendente, proteção de senha e token, ausência de sessão, conflito e resposta `429`.
- 14/10/2026 — lint, typecheck, build e 21 testes de integração aprovados após o cadastro administrativo, cobrindo criação de operador ativo, login do operador criado, autenticação, RBAC, CSRF e presença da rota na especificação OpenAPI.
- 14/10/2026 — lint, typecheck, build e 27 testes de integração aprovados após a aprovação de solicitações, cobrindo listagem paginada, aprovação, rejeição, administrador e data da aprovação, login bloqueado ou permitido conforme o status, RBAC, CSRF, transição inválida e OpenAPI.
- 14/10/2026 — lint, typecheck, build e 32 testes de integração aprovados após o backend de acompanhamento, cobrindo consulta segura de status, `429` por token, origem Socket.IO, autorização da sala e evento de aprovação após persistência.
- 14/10/2026 — lint, typecheck, 32 testes de integração da API e build completo aprovados após o frontend de acompanhamento. A inspeção visual por navegador não pôde ser executada porque nenhum navegador estava disponível na sessão.
- 14/10/2026 — lint, typecheck, 36 testes de integração da API e build completo aprovados após o cadastro de contato, cobrindo criação autenticada, atribuição do criador, validação e CSRF.
- 14/10/2026 — lint, typecheck, 39 testes de integração da API e build completo aprovados após RBAC e ownership, cobrindo consulta própria, bloqueio de acesso a contato alheio e acesso administrativo.
- 14/10/2026 — lint, typecheck, 42 testes de integração da API e build completo aprovados após a lista paginada, cobrindo paginação, escopo do operador, visão administrativa e limite máximo de página.
- 14/10/2026 — lint, typecheck, 43 testes de integração da API e build completo aprovados após a notificação em tempo real, incluindo handshake de sessão Socket.IO e emissão de evento após persistência de contato.
- 14/10/2026 — lint, typecheck, 45 testes de integração da API e build completo aprovados na etapa de qualidade; o recorte isolado de autenticação aprovou 10 testes.
- 14/10/2026 — frontend validado com TypeScript, ESLint, build Vite e `git diff --check`. O wrapper `npm` falhou neste ambiente ao resolver `C:\Users\guiso`; os binários locais equivalentes executaram as validações sem erro.
- 15/10/2026 — correção validada com TypeScript, ESLint, build Vite, teste de contatos com 8 casos aprovados e `git diff --check`; o teste cobre `403 FORBIDDEN` para criação por ADMIN e responsável na listagem administrativa.
- 15/10/2026 — tela de operador validada com TypeScript, ESLint e build Vite; a autorização final continua no endpoint `POST /api/admin/users`, protegido por sessão, ADMIN e CSRF.
- 15/10/2026 — CRUD de operadores validado com TypeScript, ESLint, build Vite e suíte administrativa aprovada; OpenAPI atualizado para listagem, edição, desativação e reativação.
- 15/10/2026 — P0.16 validada com ESLint, typecheck, 48 testes de integração da API, build Vite e `git diff --check`. O wrapper `npm` permanece incompatível com o sandbox ao resolver `C:\Users\guiso`; binários locais equivalentes foram usados.
- 15/10/2026 — preparação P0.17 validada com ESLint, typecheck, 48 testes de integração e smoke de produção local para `PORT`, raiz, fallback SPA e `404` de API desconhecida. Publicação e smoke remoto não foram executados: não há sessão Railway nem CLI disponível.
- 15/10/2026 — dashboard validado com typecheck, build Vite e 4 testes de integração novos: ownership de operador, visão e filtro administrativo, bloqueio de `operatorId` para operador e filtros inválidos. O agrupamento semanal inicia na segunda-feira em UTC.
- 15/10/2026 — referência visual local do Open Design mapeada e aplicada à tela Dashboard: quatro métricas, gráfico temporal, distribuição por origem, contatos recentes e solicitações pendentes; os dados continuam vindo dos contratos HTTP existentes.
- 15/10/2026 — réplica visual do dashboard validada com ESLint, typecheck e build Vite; nenhuma alteração foi feita em `docs/BACKLOG.md`.
- 15/10/2026 — gráfico de linha corrigido para manter traço visível mesmo com apenas um ponto de série; typecheck, ESLint e build Vite passaram novamente.
- 15/10/2026 — série diária do dashboard passou a normalizar sete dias, preencher ausências com zero e exibir escalas dinâmicas nos eixos X e Y; validação frontend passou novamente.
- 15/10/2026 — marcadores do gráfico passaram de círculos SVG deformados pelo redimensionamento para pontos HTML circulares, alinhados à linha e com foco visual no hover; lint, typecheck, build Vite e `git diff --check` aprovados.

## Pendências e próximos passos

- Próximo diferencial: notificações persistentes e auditoria administrativa; depois, CI.
- Dashboard concluído: métricas por papel e filtros HTTP estão disponíveis; atualização por evento será integrada após notificações/auditoria.
- Deploy Railway permanece pendente: conectar o repositório a um projeto Railway, criar PostgreSQL, configurar as variáveis de produção e liberar a publicação.
- Frontend modular de contatos concluído; a integração de notificações persistentes, auditoria e dashboard permanece pendente conforme backlog.
- Correção de autorização por papel concluída. Próximo trabalho funcional: dashboard por papel com métricas e filtros, ainda pendente no backlog.
