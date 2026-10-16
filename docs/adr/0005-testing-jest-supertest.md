# ADR 0005 — Testes com Jest e Supertest

- Status: aceito
- Data: 13/10/2026

## Contexto

Autenticação, RBAC, ownership e paginação precisam de validação próxima do comportamento real.

## Decisão

Usar Jest como test runner e Supertest para testes de integração HTTP. Priorizar banco real de testes em vez de mockar o Prisma nos fluxos críticos.

## Consequências

- Ferramentas conhecidas no ecossistema Node.js.
- Maior confiança nas integrações.
- Suíte mais lenta que testes totalmente mockados.
- Exige isolamento correto do banco de testes.

