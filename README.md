# GestCon

Plataforma para solicitação e gestão de operadores, cadastro de contatos e acompanhamento em tempo real.

## Objetivo

Entregar uma aplicação com dois perfis:

- **Administrador:** cria, edita, desativa e reativa operadores; aprova solicitações; consulta todos os contatos em modo somente leitura.
- **Operador:** solicita acesso, acompanha a aprovação em tempo real, autentica-se, cadastra contatos e consulta somente a própria lista paginada.

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

## Execução local

Pré-requisitos: Node.js 20+, npm 10+ e Docker Desktop. Copie o ambiente e instale as dependências:

```bash
npm install
Copy-Item .env.example .env
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
```

O PostgreSQL local Ã© fornecido pelo `compose.yaml`. O Docker Desktop precisa estar iniciado antes de `npm run db:up`. Os comandos Prisma carregam o `.env` da raiz do repositÃ³rio.

Antes de executar o seed, preencha `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` e `SEED_OPERATOR_PASSWORD` no `.env` local. Esses valores não devem ser commitados.

`npm run db:seed` cria a massa de demonstração apenas quando não há registros no banco. Para apagar os dados operacionais e recriar a massa manualmente, execute `npm run db:seed:reset`. Esse comando é destrutivo e não é usado pelo deploy.

Para iniciar a API, também defina `SESSION_SECRET`, `CSRF_SECRET` e `RATE_LIMIT_SECRET` com pelo menos 32 caracteres. Use valores locais diferentes dos usados em produção.

Inicie API e web em terminais separados:

```bash
npm run dev:api
npm run dev:web
```

- Web: `http://localhost:5173`
- API: `http://localhost:3001/api/health`
- Swagger: `http://localhost:3001/docs/` somente com `NODE_ENV=development`

O frontend usa `VITE_API_PROXY_TARGET` somente no desenvolvimento. Em produção, web, API e Socket.IO serão publicados pela mesma origem Railway.

Para executar manualmente a limpeza idempotente dos buckets de rate limit:

```bash
npm run rate-limit:cleanup
```

Validação esperada:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Com a base em execução, a API responde em `GET /api/health`.

Com `NODE_ENV=development`, a documentação interativa das rotas implementadas está disponível em `/docs`. Ela não é registrada em teste ou produção.

## Credenciais de demonstração

Devem ser criadas pelo seed e documentadas apenas com valores seguros para demonstração. Nunca colocar credenciais reais ou secrets no repositório.

## Produção no Railway

O deploy usará um serviço Node.js e PostgreSQL gerenciado pelo Railway. Configure somente no ambiente Railway:

```text
NODE_ENV=production
DATABASE_URL=<referência do PostgreSQL Railway>
APP_ORIGIN=https://<domínio-publico>
SESSION_SECRET=<segredo aleatório com 32 ou mais caracteres>
CSRF_SECRET=<segredo aleatório com 32 ou mais caracteres>
RATE_LIMIT_SECRET=<segredo independente com 32 ou mais caracteres>
SEED_ADMIN_EMAIL=<email de demonstração>
SEED_ADMIN_PASSWORD=<senha de demonstração>
```

Não configure nem reutilize secrets locais em produção. `DATABASE_URL` vem do PostgreSQL Railway. `PORT` é fornecida pela plataforma e tem prioridade sobre `API_PORT`. O `railway.toml` instala dependências preservando o cache do Railway, executa migration e seed segura antes de iniciar a API. Nunca use `prisma db push` em produção.
