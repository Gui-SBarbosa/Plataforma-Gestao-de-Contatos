# Plano de testes

## Estratégia

Priorizar testes de integração do backend com Jest e Supertest. As regras críticas devem executar contra um PostgreSQL de testes e o Prisma real. Mocks ficam restritos a relógio, geração de tokens e gateways externos inexistentes neste escopo.

## Ferramentas

- Jest.
- Supertest.
- `tsc` compila a API antes dos testes de integração; o Jest executa o artefato JavaScript resultante.
- React Testing Library apenas para fluxos essenciais, se houver tempo.
- Banco PostgreSQL isolado por ambiente.

## Pirâmide pragmática

- Muitos testes de integração HTTP para segurança e regras.
- Poucos testes unitários para funções puras.
- Um roteiro E2E manual para a demonstração.

## Cenários prioritários

| ID | Cenário | Resultado esperado |
|---|---|---|
| T-01 | Login ativo com senha correta | 200 e cookie de sessão |
| T-02 | Login com senha incorreta | 401 e mensagem genérica |
| T-03 | Login de usuário pendente | 401 sem criar sessão |
| T-04 | Login de usuário desativado | 401 sem criar sessão |
| T-05 | Registro com e-mail duplicado | 409 sem revelar dados extras |
| T-06 | Operador acessa rota admin | 403 |
| T-07 | Admin aprova usuário pendente | Status ACTIVE e auditoria |
| T-08 | Admin repete aprovação | 409 |
| T-09 | Tracking token inválido | Estado não revelado |
| T-10 | Aprovação emite evento | Evento após commit |
| T-11 | Operador cria contato válido | 201 com `createdById` correto |
| T-12 | Contato inválido | 400 sem persistência |
| T-13 | Contato gera notificação | Registro persistido para admin |
| T-14 | Operador lista contatos | Somente os próprios |
| T-15 | Admin lista contatos | Todos os contatos |
| T-16 | Operador acessa contato alheio | 404 ou 403 conforme política |
| T-17 | Paginação página 1 | 10 itens e metadados corretos |
| T-18 | Paginação página 2 | Itens restantes sem duplicação |
| T-19 | `pageSize` acima do máximo | 400 ou limite normalizado documentado |
| T-20 | Logout | Sessão invalidada |
| T-21 | Exceder tentativas de login por identidade | 429, mensagem genérica e `Retry-After` |
| T-22 | Exceder tentativas de login por IP | 429 sem executar autenticação |
| T-23 | Reiniciar aplicação durante a janela | Contador continua válido |
| T-24 | Incrementos concorrentes | Contagem atômica sem perda de atualização |
| T-25 | Chave persistida | Tabela contém somente HMAC, nunca IP/e-mail/token original |
| T-26 | Storage do limiter indisponível no login | 503 e falha fechada |
| T-27 | Limpeza de buckets expirados | Remove apenas registros vencidos |

## Isolamento

- Usar `DATABASE_URL_TEST` ou URL injetada no job de CI.
- Executar migrations antes da suíte.
- Limpar dados entre testes por estratégia previsível.
- Nunca apontar testes para desenvolvimento ou produção.
- Usar factories em vez de depender do seed de demonstração.

## Comandos esperados

```bash
npm test
npm run test:integration
npm run test:coverage
```

## Gate de entrega

- Todos os cenários críticos passam.
- Testes do rate limiter usam relógio controlado para não depender de espera real.
- Nenhum teste está ignorado sem justificativa.
- Cobertura é informativa, não uma meta que incentive testes vazios.
- Lint, typecheck e build também passam.

