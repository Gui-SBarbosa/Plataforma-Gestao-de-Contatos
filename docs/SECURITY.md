# Modelo de segurança

## Objetivos

- Proteger credenciais e sessões.
- Impedir elevação de privilégio e acesso horizontal.
- Reduzir brute force, CSRF, XSS e enumeração de contas.
- Tornar ações administrativas rastreáveis.

## Autenticação

- Hash de senha com Argon2id.
- Sessão opaca armazenada no PostgreSQL.
- Cookie `HttpOnly`, `Secure` em produção e `SameSite=Lax`.
- ID da sessão regenerado no login.
- Sessão destruída no logout.
- Verificação de `User.status === ACTIVE` durante autenticação e operações críticas.
- Mensagem genérica para falha de login.
- Rate limiter persistente e mais restritivo em login e registro.

## Autorização

Toda rota protegida passa por:

```text
sessão válida → usuário ativo → papel permitido → ownership → operação
```

Ocultar um botão no React não é controle de autorização.

## CSRF e CORS

- Aceitar somente a origem configurada.
- Métodos de escrita exigem proteção CSRF.
- Rejeitar content types inesperados.
- WebSocket valida `Origin` e a sessão no handshake.

## Tracking da solicitação

- Gerar token com CSPRNG e entropia mínima de 256 bits.
- Enviar o valor somente uma vez ao cliente.
- Armazenar apenas hash do token.
- Associar o socket à solicitação somente após validação.
- Aplicar expiração e rate limit à consulta.
- Não retornar e-mail, hash ou outros dados na consulta de status.

## Rate limiting persistente

O controle de abuso dos endpoints sensíveis usa PostgreSQL, portanto sobrevive a reinícios e é compartilhado por futuras réplicas.

### Políticas iniciais

| Escopo | Chave | Limite inicial |
|---|---|---|
| `AUTH_LOGIN_IP` | IP do cliente | 20 tentativas em 15 minutos |
| `AUTH_LOGIN_IDENTITY` | E-mail normalizado | 5 tentativas em 15 minutos |
| `AUTH_REGISTER_IP` | IP do cliente | 5 solicitações em 60 minutos |
| `REGISTRATION_STATUS` | Tracking token | 60 consultas em 1 minuto |

Os valores ficam centralizados em configuração e podem ser calibrados por evidência. No login, as políticas por IP e identidade são aplicadas juntas. Isso reduz brute force distribuído contra uma conta e ataques concentrados a partir de um endereço.

- O bucket por IP contabiliza toda tentativa de login.
- O bucket por identidade contabiliza falhas de autenticação.
- Um login bem-sucedido limpa os buckets ativos daquela identidade, mas não o bucket do IP.
- Verificação e incremento devem manter mensagens e tempo de resposta equivalentes para e-mails existentes e inexistentes.

### Persistência

Modelo conceitual `RateLimitBucket`:

```text
scope + keyHash + windowStart → count, expiresAt
```

Schema Prisma esperado:

```prisma
model RateLimitBucket {
  id          String   @id @default(uuid())
  scope       String
  keyHash     String
  windowStart DateTime
  count       Int      @default(1)
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([scope, keyHash, windowStart])
  @@index([expiresAt])
  @@map("rate_limit_buckets")
}
```

- Chave única composta por `scope`, `keyHash` e `windowStart`.
- `keyHash` calculada por `HMAC-SHA-256` com segredo próprio.
- E-mail, IP e tracking token nunca armazenados em texto puro na tabela.
- Incremento atômico com upsert no banco.
- Índice em `expiresAt` para limpeza eficiente.
- Job idempotente remove buckets expirados a cada 15 minutos.

### Respostas e falhas

- Responder `429 Too Many Requests` ao exceder a política.
- Incluir `Retry-After` e headers padronizados de limite quando aplicável.
- Manter mensagem genérica, sem confirmar se a conta existe.
- Falhar fechado com `503` em login e registro se o storage do rate limiter estiver indisponível.
- Configurar proxy confiável explicitamente para que o IP não seja falsificado por `X-Forwarded-For`.
- Não registrar a chave original em logs.

Janela fixa foi escolhida pelo prazo e simplicidade operacional. O possível pico na fronteira da janela é um trade-off aceito e documentado no ADR 0006.

## Validação e proteção de dados

- Schemas Zod em params, query e body.
- E-mail normalizado.
- Limites de tamanho para strings e corpo HTTP.
- Prisma para queries parametrizadas.
- React mantém escaping padrão; não usar `dangerouslySetInnerHTML`.
- Helmet e política CSP compatível com o frontend.
- Erros de produção não retornam stack trace.

## Auditoria

Eventos mínimos:

- `AUTH_LOGIN_SUCCEEDED`;
- `AUTH_LOGIN_FAILED` sem armazenar senha;
- `USER_CREATED`;
- `USER_APPROVED`;
- `USER_REJECTED`;
- `USER_DISABLED`;
- `CONTACT_CREATED`.

Metadados devem ser mínimos e nunca conter secrets.

## Secrets

Variáveis previstas:

```text
DATABASE_URL
SESSION_SECRET
CSRF_SECRET
RATE_LIMIT_SECRET
APP_ORIGIN
NODE_ENV
PORT
```

- `.env` ignorado pelo Git.
- `.env.example` contém somente nomes e exemplos fictícios.
- Secrets de produção configurados no provedor de deploy.

## Checklist pré-deploy

- [ ] Cookies seguros em produção.
- [ ] Proxy confiável configurado corretamente para Railway.
- [ ] CORS e Socket.IO aceitam somente `APP_ORIGIN`.
- [ ] Rate limits ativos.
- [ ] Contadores continuam válidos após reinício da aplicação.
- [ ] Incremento concorrente foi testado.
- [ ] Headers `Retry-After` e limite foram conferidos.
- [ ] IP real é obtido somente de proxy confiável.
- [ ] Headers Helmet revisados.
- [ ] Mensagens de erro não enumeram contas.
- [ ] Rotas administrativas testadas com operador.
- [ ] Ownership de contatos testado.
- [ ] Logs não exibem secrets.
- [ ] Dependências auditadas e versões fixadas no lockfile.

## Limitações aceitas

- Sem MFA no escopo inicial.
- Sem recuperação de senha por e-mail.
- Uma réplica evita inconsistência do adapter Socket.IO em memória.
- Auditoria não substitui uma plataforma SIEM.
