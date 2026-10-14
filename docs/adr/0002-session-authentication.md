# ADR 0002 — Autenticação por sessão

- Status: aceito
- Data: 13/10/2026

## Contexto

A aplicação é web first-party e segurança de login tem peso elevado na avaliação.

## Decisão

Usar sessão opaca armazenada no PostgreSQL e cookie `HttpOnly`, em vez de JWT persistido no navegador.

## Consequências

- Revogação centralizada.
- Bloqueios e mudanças de status têm aplicação imediata.
- Integração consistente com Socket.IO.
- Requer proteção CSRF e armazenamento de sessões.

## Alternativas rejeitadas

- JWT em localStorage: amplia impacto de XSS e dificulta revogação.
- Access e refresh tokens: solução válida, mas complexidade desnecessária para o prazo e contexto.

