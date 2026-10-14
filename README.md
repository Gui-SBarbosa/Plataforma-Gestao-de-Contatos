# GestCon

Plataforma web para gestão de operadores, aprovação de acessos, cadastro de contatos e notificações em tempo real.

> Este repositório contém inicialmente a especificação executável do produto. O código deve ser implementado seguindo os documentos em `docs/` e o plano em `.agent/EXECPLAN.md`.

## Objetivo

Entregar uma aplicação com dois perfis:

- **Administrador:** gerencia usuários, aprova solicitações, acompanha contatos, notificações, auditoria e métricas.
- **Operador:** solicita acesso, acompanha a aprovação em tempo real, autentica-se, cadastra contatos e consulta sua lista paginada.

## Arquitetura aprovada

- React, Vite e TypeScript no frontend.
- Node.js, Express e TypeScript no backend.
- PostgreSQL e Prisma.
- Autenticação por sessão server-side em cookie seguro.
- Rate limiting persistente no PostgreSQL para endpoints sensíveis.
- Socket.IO para eventos em tempo real.
- Jest e Supertest para testes.
- Monólito modular em um único deploy no Railway.

## Documentação

| Documento                                      | Finalidade                              |
| ---------------------------------------------- | --------------------------------------- |
| [Requisitos](docs/REQUIREMENTS.md)             | Escopo, regras e critérios de aceite    |
| [Arquitetura](docs/ARCHITECTURE.md)            | Componentes, módulos e limites técnicos |
| [UML](docs/UML.md)                             | Diagramas e explicações do sistema      |
| [Segurança](docs/SECURITY.md)                  | Modelo de autenticação e controles      |
| [API](docs/API.md)                             | Contratos REST e eventos Socket.IO      |
| [Testes](docs/TEST-PLAN.md)                    | Estratégia e cenários prioritários      |
| [Deploy](docs/DEPLOYMENT.md)                   | Ambientes e publicação no Railway       |
| [Decisões](docs/DECISIONS.md)                  | Índice dos ADRs                         |
| [Roteiro de demonstração](docs/DEMO-SCRIPT.md) | Apresentação técnica e fluxo da demo    |
| [Backlog](docs/BACKLOG.md)                     | Entrega obrigatória, extras e evolução  |

## Execução

Pré-requisitos: Node.js 20+ e npm 10+. Copie o arquivo de ambiente e instale as dependências:

```bash
npm install
Copy-Item .env.example .env
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

O PostgreSQL local Ã© fornecido pelo `compose.yaml`. O Docker Desktop precisa estar iniciado antes de `npm run db:up`. Os comandos Prisma carregam o `.env` da raiz do repositÃ³rio.

Antes de executar o seed, preencha `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` no `.env` local. Esses valores não devem ser commitados.

Para iniciar a API, também defina `SESSION_SECRET` e `CSRF_SECRET` com pelo menos 32 caracteres. Use valores locais diferentes dos usados em produção.

Para iniciar somente um serviço durante o desenvolvimento:

```bash
npm run dev:api
npm run dev:web
```

Validação esperada:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Com a base em execução, a API responde em `GET /api/health`. Os endpoints de domínio serão adicionados nas próximas etapas do ExecPlan.

## Credenciais de demonstração

Devem ser criadas pelo seed e documentadas apenas com valores seguros para demonstração. Nunca colocar credenciais reais ou secrets no repositório.
