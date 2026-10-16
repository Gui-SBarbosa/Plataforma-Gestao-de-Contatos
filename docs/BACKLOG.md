# Backlog de entrega

## Forma de execução

Os itens P0 abaixo são executados estritamente na ordem apresentada. Um item só
avança para concluído quando suas validações forem registradas no ExecPlan; itens
posteriores não são iniciados enquanto o item corrente estiver pendente ou bloqueado.

## P0 — Obrigatório

- [x] 1.  Fundação TypeScript, lint, build e configuração.
- [x] 2.  Banco local: aplicar migrations e executar o seed em um PostgreSQL disponível.
  - Schema, migration e seed idempotente do administrador foram validados em PostgreSQL local.
- [x] 3.  Login, logout e sessão atual.
- [x] 4.  Rate limiter persistente para autenticação, registro e tracking.
- [x] 5.  Job idempotente de limpeza de buckets expirados.
- [x] 6.  Registro público de operador.
- [x] 7.  Cadastro direto de usuário pelo administrador.
- [x] 8.  Aprovação e rejeição de solicitações.
- [x] 9.  Acompanhamento da aprovação em tempo real.
- [x] 10. Cadastro de contato.
- [x] 11. RBAC e ownership de contatos.
- [x] 12. Lista paginada de contatos.
- [x] 13. Notificação em tempo real para administrador.
- [x] 14. Testes críticos, de persistência, concorrência e resposta `429`.
- [x] 15. Frontend modular de contatos baseado no Open Design.
- [ ] 16. README executável e documentação de ambiente revisada.
- [ ] 17. Deploy e smoke test.

## P1 — Diferenciais viáveis

- [x] Notificações persistentes e estado lido/não lido.
- [x] Auditoria administrativa.
- [x] Dashboard com métricas essenciais.
- [x] Atualização do dashboard em tempo real.
- [x] Dashboard por papel: visão global somente leitura para ADMIN e visão dos próprios contatos para OPERATOR, com filtros de período e operador.
- [x] Política de senha reforçada no cadastro de operadores e solicitações de acesso.
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
