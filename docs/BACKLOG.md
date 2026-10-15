# Backlog de entrega

## Forma de execução

Os itens P0 abaixo são executados estritamente na ordem apresentada. Um item só
avança para concluído quando suas validações forem registradas no ExecPlan; itens
posteriores não são iniciados enquanto o item corrente estiver pendente ou bloqueado.

## P0 — Obrigatório

- [x] 01. Fundação TypeScript, lint, build e configuração.
- [x] 02. Banco local: aplicar migrations e executar o seed em um PostgreSQL disponível.
  - Schema, migration e seed idempotente do administrador foram validados em PostgreSQL local.
- [x] 03. Login, logout e sessão atual.
- [x] 04. Rate limiter persistente para autenticação, registro e tracking.
- [x] 05. Job idempotente de limpeza de buckets expirados.
- [x] 06. Registro público de operador.
- [x] 07. Cadastro direto de usuário pelo administrador.
- [x] 08. Aprovação e rejeição de solicitações.
- [x] 09. Acompanhamento da aprovação em tempo real.
- [x] 10. Cadastro de contato.
- [x] 11. RBAC e ownership de contatos.
- [x] 12. Lista paginada de contatos.
- [x] 13. Notificação em tempo real para administrador.
- [ ] 14. Testes críticos, de persistência, concorrência e resposta `429`.
- [ ] 15. README executável e documentação de ambiente revisada.
- [ ] 16. Deploy e smoke test.

## P1 — Diferenciais viáveis

- [ ] Notificações persistentes e estado lido/não lido.
- [ ] Auditoria administrativa.
- [ ] Dashboard com métricas essenciais.
- [ ] Atualização do dashboard em tempo real.
- [x] OpenAPI/Swagger.
- [ ] CI no GitHub Actions.

## P2 — Evolução, não implementar antes do P0

- [ ] Recuperação de senha.
- [ ] Confirmação de e-mail.
- [ ] MFA.
- [ ] Importação CSV.
- [ ] Redis e escala horizontal.
- [ ] Outbox transacional.
- [ ] Filtros avançados.
- [ ] Exportação de contatos.
