# ADR 0003 — Tempo real com Socket.IO

- Status: aceito
- Data: 13/10/2026

## Contexto

A aprovação precisa aparecer sem reload, e administradores devem receber notificações de contatos em tempo real.

## Decisão

Usar Socket.IO integrado ao servidor HTTP do Express, com autenticação de handshake e salas autorizadas pelo backend.

## Consequências

- Reconexão e rooms prontas para uso.
- Mesmo modelo de sessão do HTTP.
- Em uma réplica, adapter em memória é suficiente.
- Escala horizontal futura exigirá adapter Redis ou equivalente.

## Alternativas rejeitadas

- Polling: não representa tão bem o requisito em tempo real.
- WebSocket puro: maior trabalho de protocolo, reconexão e salas.

