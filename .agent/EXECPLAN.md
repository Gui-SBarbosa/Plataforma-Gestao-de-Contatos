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
| in_progress | Fundação do repositório  | Workspaces, scripts, lint, TypeScript e app mínima compilando     |
| pending     | Banco e seed             | Schema, migrations, sessão, admin e 20+ contatos de demonstração  |
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

## Validações executadas

- Ainda não executadas; implementação não iniciada.

## Pendências e próximos passos

- Criar fundação do monorepo.
- Confirmar com avaliador a visibilidade de contatos entre operadores.
- Confirmar interpretação de “duas páginas de contatos”.
- Substituir placeholders de comandos e URLs após o primeiro deploy.
