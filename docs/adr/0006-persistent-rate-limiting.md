# ADR 0006 — Rate limiting persistente no PostgreSQL

- Status: aceito
- Data: 13/10/2026

## Contexto

Login, registro e acompanhamento da solicitação são superfícies de brute force e abuso. Um contador somente em memória seria zerado no restart e divergiria entre réplicas.

## Decisão

Usar buckets de janela fixa persistidos no PostgreSQL. Cada bucket é identificado por `scope`, `keyHash` e `windowStart`. A chave é um HMAC do IP, e-mail normalizado ou tracking token, usando segredo exclusivo.

O contador será incrementado atomicamente com upsert no banco. Um job idempotente removerá registros cujo `expiresAt` já passou.

## Políticas iniciais

- Login por IP: 20 tentativas em 15 minutos.
- Login por identidade: 5 tentativas em 15 minutos.
- Registro por IP: 5 solicitações em 60 minutos.
- Consulta de status por tracking token: 60 consultas em 1 minuto.

No login, o bucket por IP conta todas as tentativas. O bucket por identidade conta falhas e é limpo após autenticação bem-sucedida, sem alterar a resposta pública para contas existentes ou inexistentes.

## Consequências positivas

- Limites sobrevivem a reinícios.
- Futuras réplicas compartilham os mesmos contadores.
- Não há dependência adicional de Redis nesta entrega.
- A implementação é demonstrável e testável no PostgreSQL já utilizado.

## Consequências negativas

- Cada tentativa protegida gera acesso ao banco.
- Um ataque pode aumentar carga sobre o PostgreSQL.
- Janela fixa permite pico próximo à troca de janela.
- Limpeza periódica é necessária.

## Mitigações

- Índices compostos e em `expiresAt`.
- Payload mínimo na tabela.
- Upsert atômico, evitando transações longas.
- Rate limit no provedor ou proxy como camada adicional futura.
- Métricas de `429`, latência e tamanho da tabela.

## Comportamento em falha

Login e registro falham fechados com `503` se o storage do limiter estiver indisponível. Não liberar tentativas ilimitadas por degradação do controle de segurança.

## Alternativas consideradas

- Memória local: não persiste e não escala horizontalmente.
- Redis: tecnicamente adequado, porém adiciona serviço e operação desnecessários para o prazo.
- Sliding window log: maior precisão, mas custo de armazenamento e implementação superior.

