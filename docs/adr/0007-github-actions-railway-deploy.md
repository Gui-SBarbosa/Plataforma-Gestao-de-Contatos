# ADR 0007 — Validação no GitHub Actions e deploy pelo Railway

- Status: aceito
- Data: 16/10/2026

## Contexto

O repositório possui `main` como branch principal e o serviço Railway já está conectado ao GitHub. A publicação precisa impedir a entrada de mudanças que não compilam ou falham nos testes de integração.

## Decisão

O GitHub Actions executa lint, typecheck, migrations em PostgreSQL efêmero, testes e build em pull requests e pushes para `main`.

O Railway permanece responsável pelo deploy automático após o push na `main`, usando a configuração versionada no repositório. O deploy executa migrations e seed idempotente com as variáveis configuradas no ambiente Railway.

## Consequências

- A validação não exige segredos de produção no GitHub Actions.
- A branch `main` pode exigir o status `CI / verify` antes do merge.
- O Railway recebe somente commits já validados quando a proteção de branch estiver ativada.
- Falhas de deploy continuam visíveis no Railway e não são mascaradas pela pipeline de CI.
