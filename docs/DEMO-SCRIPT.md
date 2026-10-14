# Roteiro da apresentação e demonstração

## Estrutura sugerida — 8 a 10 minutos

### Problema e escopo — 45 segundos

Apresentar o GestCon como uma plataforma de operação de contatos com entrada controlada de usuários e supervisão em tempo real.

### Decisões — 90 segundos

- Monólito modular pelo prazo e domínio.
- Sessão server-side pela segurança e revogação.
- PostgreSQL como fonte de verdade.
- Socket.IO como camada de experiência em tempo real.
- Notificações persistidas antes da emissão.

### Demonstração — 4 minutos

1. Abrir uma janela anônima na tela de solicitação.
2. Enviar cadastro de operador e manter a tela aguardando.
3. Em outra janela, entrar como administrador.
4. Mostrar a notificação e a solicitação pendente.
5. Aprovar o usuário.
6. Mostrar a primeira janela mudando sem reload.
7. Entrar como operador.
8. Cadastrar contato.
9. Mostrar a notificação chegando ao administrador.
10. Abrir a lista paginada e navegar para a segunda página.
11. Mostrar rapidamente dashboard e auditoria, se concluídos.

### Segurança e testes — 90 segundos

- Cookie HttpOnly e sessão no servidor.
- Argon2id, rate limiter persistente, CSRF, validação e RBAC.
- Mostrar que o contador de tentativas fica no PostgreSQL e não é zerado por reinício.
- Testes Jest/Supertest para login, permissões, ownership e paginação.
- Demonstrar um `403` ou citar o teste correspondente.

### Trade-offs e evolução — 60 segundos

- Uma réplica nesta entrega.
- Redis e outbox apenas quando houver necessidade de escala.
- Recuperação de senha e MFA fora do escopo inicial.

### Encerramento — 30 segundos

Reforçar que a solução prioriza requisitos obrigatórios, segurança, rastreabilidade e caminho de evolução.

## Slides sugeridos

1. GestCon e problema resolvido.
2. Requisitos e atores.
3. Arquitetura.
4. Segurança.
5. Fluxos em tempo real.
6. Testes e qualidade.
7. Deploy e escalabilidade.
8. Demonstração e próximos passos.

## Plano de contingência

- Manter GIF ou vídeo curto dos dois fluxos em tempo real.
- Preparar operadores e contatos pela própria plataforma antes da apresentação.
- Manter ambiente local pronto caso o deploy fique indisponível.
- Não editar dados manualmente durante a apresentação.
