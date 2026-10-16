# Deploy no Railway

## Topologia

- Um serviço da aplicação GestCon.
- Um PostgreSQL gerenciado.
- Uma única réplica da aplicação nesta entrega.
- Express entrega API, Socket.IO e build estático do React.

## Pipeline esperado

```text
push na main
→ CI: lint + typecheck + testes + build
→ deploy automático pelo Railway
→ migration de produção
→ health check
→ smoke test
```

## Variáveis

```text
NODE_ENV=production
DATABASE_URL=<fornecida pelo ambiente>
SEED_ADMIN_EMAIL=<e-mail do administrador de demonstração>
SEED_ADMIN_PASSWORD=<fornecida apenas no ambiente de demo>
SEED_OPERATOR_PASSWORD=<senha dos dois operadores de demonstração>
SESSION_SECRET=<segredo forte>
CSRF_SECRET=<segredo forte>
RATE_LIMIT_SECRET=<segredo forte e independente>
APP_ORIGIN=https://<dominio-da-aplicacao>
PORT=<fornecida pelo ambiente>
```

## Comandos do serviço

```text
Build: npm install --prefer-offline --no-audit --no-fund && npm run db:generate && npm run build
Pre-deploy: npm run db:deploy:runtime && npm run db:seed:runtime
Start: npm run db:deploy:runtime && npm run db:seed:runtime && npm run start
Rate limit cleanup: npm run rate-limit:cleanup
```

`railway.toml` registra build, pre-deploy, start e healthcheck. Os comandos `:runtime` usam diretamente as variáveis fornecidas pelo Railway e não dependem de um arquivo `.env`. O pre-deploy e o start aplicam migrations e a seed segura; a seed só cria a massa de demonstração quando não há registros de negócio. Essa repetição mantém o serviço recuperável caso a plataforma não execute o pre-deploy em uma publicação.

## Health checks

- `GET /api/health`: processo responde sem expor configuração ou credenciais.
- Respostas não expõem configuração ou credenciais.

## Migrações e seed

- Produção usa `prisma migrate deploy`.
- Não usar `prisma db push` como processo oficial de deploy.
- A seed automática cria um administrador, dois operadores e 24 contatos em banco vazio. Cada operador recebe 12 contatos para demonstrar a paginação.
- `npm run db:seed:reset` é o comando manual destrutivo para apagar os dados operacionais e recriar a massa; ele não faz parte do deploy.
- Credenciais de demo não devem reutilizar secrets reais.

## Smoke test

- [ ] Health check responde.
- [ ] Frontend abre sem erro.
- [ ] Login de demonstração funciona.
- [ ] Solicitação aparece para o administrador.
- [ ] Aprovação atualiza a tela sem reload.
- [ ] Contato é criado.
- [ ] Administrador recebe notificação.
- [ ] Duas páginas de contatos podem ser navegadas.
- [ ] Logout invalida a sessão.
- [ ] Rate limit retorna `429` e `Retry-After`.
- [ ] Reinício não zera o contador persistido.

## CI/CD

- O workflow `.github/workflows/ci.yml` executa em pull requests e pushes para `main`.
- A pipeline cria um PostgreSQL efêmero, aplica as migrations e executa lint, typecheck, testes e build.
- No GitHub, proteger a branch `main` exigindo o status `CI / verify` antes do merge.
- O serviço Railway conectado ao repositório publica automaticamente os commits recebidos na `main`.

## Manutenção do rate limiter

- A API executa a limpeza idempotente ao iniciar e a cada 15 minutos; `npm run rate-limit:cleanup` permite execução isolada por agendador externo.
- Manter índice em `expiresAt`.
- Monitorar quantidade de respostas `429`, latência do upsert e crescimento da tabela.
- Nunca executar limpeza sem filtro explícito por expiração.

## Rollback

- Manter migrations compatíveis com rollback de aplicação quando possível.
- Evitar alteração destrutiva de coluna na entrega inicial.
- Registrar versão implantada e resultado do smoke test.
