# Especificação de requisitos

## Visão do produto

O GestCon centraliza a entrada controlada de operadores, o cadastro de contatos e a supervisão administrativa, oferecendo feedback em tempo real sem tornar o canal WebSocket a fonte de verdade.

## Atores

| Ator          | Responsabilidade                                                          |
| ------------- | ------------------------------------------------------------------------- |
| Visitante     | Autenticar-se ou solicitar acesso como operador                           |
| Operador      | Cadastrar e consultar os próprios contatos                                |
| Administrador | Gerenciar acessos, usuários, contatos, notificações, auditoria e métricas |

## Requisitos funcionais

| ID    | Requisito                                                                | Prioridade  |
| ----- | ------------------------------------------------------------------------ | ----------- |
| RF-01 | Permitir login com e-mail e senha                                        | Obrigatório |
| RF-02 | Permitir logout e consulta da sessão atual                               | Obrigatório |
| RF-03 | Permitir solicitação pública de cadastro de operador                     | Obrigatório |
| RF-04 | Exibir o resultado da aprovação sem atualização manual da página         | Obrigatório |
| RF-05 | Permitir ao administrador listar, aprovar e rejeitar solicitações        | Obrigatório |
| RF-06 | Permitir ao administrador cadastrar usuário ativo diretamente            | Obrigatório |
| RF-07 | Permitir ao operador cadastrar contatos                                  | Obrigatório |
| RF-08 | Notificar administradores em tempo real quando um contato for criado     | Obrigatório |
| RF-09 | Permitir ao operador listar seus contatos com paginação backend          | Obrigatório |
| RF-10 | Permitir ao administrador listar todos os contatos com paginação backend | Obrigatório |
| RF-11 | Persistir notificações para consulta posterior                           | Recomendado |
| RF-12 | Registrar ações administrativas e sensíveis em auditoria                 | Recomendado |
| RF-13 | Exibir métricas administrativas                                          | Extra       |
| RF-14 | Atualizar métricas após novos contatos                                   | Extra       |

## Regras de negócio

- RN-01 — E-mail de usuário é único após normalização para minúsculas e remoção de espaços externos.
- RN-02 — Nova solicitação recebe status `PENDING` e papel `OPERATOR`.
- RN-03 — Apenas `ACTIVE` pode autenticar.
- RN-04 — Apenas `ADMIN` pode criar, aprovar, rejeitar, desativar ou reativar usuários.
- RN-05 — Aprovação muda `PENDING` para `ACTIVE` e registra administrador e data.
- RN-06 — Rejeição muda `PENDING` para `REJECTED`.
- RN-07 — Operador consulta apenas contatos em que `createdById` corresponde ao usuário autenticado.
- RN-08 — Administrador consulta todos os contatos.
- RN-09 — Criação de contato, notificação e auditoria deve ser atômica quando estiverem na mesma operação.
- RN-10 — Evento em tempo real só é emitido após o commit.
- RN-11 — Paginação padrão é 10 itens e o máximo aceito é 50.
- RN-12 — A aprovação não inicia sessão automaticamente para o solicitante.
- RN-13 — O tracking token de uma solicitação é opaco, aleatório e não contém o ID do usuário.
- RN-14 — Rejeição e desativação invalidam ou impedem novas operações autenticadas.
- RN-15 — Login é limitado simultaneamente por IP e identificador de conta normalizado.
- RN-16 — Registro e consulta do status da solicitação possuem políticas próprias de limite.
- RN-17 — Chaves de rate limit são armazenadas como HMAC; e-mail, token e IP não são persistidos em texto puro nessa tabela.
- RN-18 — Incrementos do rate limiter são atômicos e compartilhados entre instâncias.
- RN-19 — Ao exceder o limite, a API retorna `429` e informa `Retry-After` sem revelar a existência da conta.

## Dados mínimos

### Solicitação de operador

- nome;
- e-mail;
- senha;
- confirmação de senha somente no frontend.

### Contato

- nome;
- e-mail;
- telefone;
- empresa opcional;
- cidade opcional;
- origem: `WEBSITE`, `REFERRAL`, `SOCIAL_MEDIA`, `PHONE` ou `OTHER`.

## Requisitos não funcionais

| ID     | Requisito                                                                                 |
| ------ | ----------------------------------------------------------------------------------------- |
| RNF-01 | Comunicação em produção somente por HTTPS/WSS                                             |
| RNF-02 | Senhas armazenadas com Argon2id                                                           |
| RNF-03 | Sessão armazenada no servidor e cookie `HttpOnly`                                         |
| RNF-04 | Toda entrada externa validada com schema                                                  |
| RNF-05 | Rotas protegidas por autenticação e RBAC no backend                                       |
| RNF-06 | Logs estruturados e sem secrets                                                           |
| RNF-07 | API paginada e com limites máximos                                                        |
| RNF-08 | Aplicação compilável e executável por comandos documentados                               |
| RNF-09 | Migrations reproduzíveis e seed de demonstração idempotente                               |
| RNF-10 | Reconexão do Socket.IO recupera o estado atual da solicitação                             |
| RNF-11 | Rate limits de endpoints sensíveis sobrevivem a reinícios e são persistidos no PostgreSQL |
| RNF-12 | Registros expirados do rate limiter são removidos periodicamente por job idempotente      |

## Critérios de aceite

- AC-01 — Dado um usuário ativo, credenciais corretas criam sessão e redirecionam para sua área.
- AC-02 — Usuário pendente, rejeitado ou desativado não consegue autenticar.
- AC-03 — Após solicitar cadastro, a tela muda quando o administrador aprova ou rejeita, sem reload manual.
- AC-04 — Operador recebe `403` ao acessar endpoint administrativo.
- AC-05 — Operador cria um contato válido e o registro identifica seu criador.
- AC-06 — Administrador conectado recebe a notificação de novo contato em tempo real.
- AC-07 — Administrador desconectado encontra a notificação persistida quando retorna.
- AC-08 — Lista de contatos retorna `data` e metadados `page`, `pageSize`, `total` e `totalPages`.
- AC-09 — Operador não obtém contatos de outro operador por listagem ou acesso direto.
- AC-10 — Seed disponibiliza ao menos 20 contatos, suficientes para demonstrar duas páginas de 10.
- AC-11 — Lint, typecheck, testes e build terminam com sucesso.
- AC-12 — Aplicação publicada executa login, aprovação, cadastro, notificação e paginação.
- AC-13 — Limite de login permanece efetivo após reiniciar o processo da aplicação.
- AC-14 — Duas instâncias concorrentes não permitem ultrapassar o contador por condição de corrida.
- AC-15 — Ao bloquear uma solicitação, a API retorna `429`, `Retry-After` e não informa se o e-mail existe.

## Premissas a confirmar

- Operadores visualizam apenas os próprios contatos.
- “Duas páginas” significa massa de demonstração suficiente para mostrar paginação, não um limite permanente.
- Após aprovação, o operador faz login normalmente.
