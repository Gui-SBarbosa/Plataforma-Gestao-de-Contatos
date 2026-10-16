# ADR 0004 — PostgreSQL e Prisma

- Status: aceito
- Data: 13/10/2026

## Contexto

Usuários, contatos, sessões, notificações e auditoria possuem relações e exigem consistência.

## Decisão

Usar PostgreSQL como fonte de verdade e Prisma para schema, migrations e acesso tipado.

## Consequências

- Integridade referencial e transações.
- Migrations reproduzíveis.
- Boa integração com TypeScript.
- Agregações muito específicas podem exigir SQL controlado futuramente.

