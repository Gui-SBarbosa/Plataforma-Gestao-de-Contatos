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
→ deploy
→ migration de produção
→ health check
→ smoke test
```

## Variáveis

```text
NODE_ENV=production
DATABASE_URL=<fornecida pelo ambiente>
SEED_ADMIN_PASSWORD=<fornecida apenas no ambiente de demo>
SEED_OPERATOR_PASSWORD=<fornecida apenas no ambiente de demo>
SESSION_SECRET=<segredo forte>
CSRF_SECRET=<segredo forte>
RATE_LIMIT_SECRET=<segredo forte e independente>
APP_ORIGIN=https://<dominio-da-aplicacao>
PORT=<fornecida pelo ambiente>
```

## Comandos previstos

```text
Build: npm ci && npm run build
Start: npm run start
Migration: npm run db:deploy
Seed demo local: npm run db:seed
```

## Health checks

- `GET /health/live`: processo responde, sem consultar dependências.
- `GET /health/ready`: verifica acesso essencial ao PostgreSQL.
- Respostas não expõem configuração ou credenciais.

## Migrações e seed

- Produção usa `prisma migrate deploy`.
- Não usar `prisma db push` como processo oficial de deploy.
- Seed de demonstração deve ser idempotente.
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

## Manutenção do rate limiter

- Executar limpeza idempotente de buckets expirados a cada 15 minutos.
- Manter índice em `expiresAt`.
- Monitorar quantidade de respostas `429`, latência do upsert e crescimento da tabela.
- Nunca executar limpeza sem filtro explícito por expiração.

## Rollback

- Manter migrations compatíveis com rollback de aplicação quando possível.
- Evitar alteração destrutiva de coluna na entrega inicial.
- Registrar versão implantada e resultado do smoke test.
