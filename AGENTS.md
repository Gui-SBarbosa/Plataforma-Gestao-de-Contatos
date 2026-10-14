# Instruções para agentes

## Fonte de verdade

Antes de alterar código ou documentação:

1. Leia este arquivo.
2. Leia `.agent/PLANS.md` integralmente.
3. Leia `.agent/EXECPLAN.md`.
4. Leia os documentos e ADRs relacionados à etapa atual.

Em caso de conflito, a ordem de precedência é: requisito aceito em `docs/REQUIREMENTS.md`, ADR aceito, arquitetura, ExecPlan e código existente.

## Forma de trabalho

- Trabalhe somente na etapa `in_progress` do ExecPlan.
- Não antecipe módulos de etapas futuras.
- Atualize o ExecPlan quando escopo, risco ou decisão mudar.
- Não substitua decisões arquiteturais silenciosamente; crie ou atualize um ADR.
- Preserve alterações existentes que não pertençam à tarefa.
- Mantenha módulos independentes e evite imports cruzados entre funcionalidades.
- Regras de autorização pertencem ao backend.
- Não exponha hashes, cookies, tokens, secrets ou stack traces.
- Toda operação sensível deve produzir auditoria quando previsto nos requisitos.

## Critério de conclusão por etapa

Uma etapa só pode ser marcada como concluída quando:

- critérios de aceite relacionados estão atendidos;
- lint e typecheck passam;
- testes afetados passam;
- documentação relacionada foi atualizada;
- validações e pendências foram registradas no ExecPlan.

## Limites de escopo

Não implementar sem decisão explícita:

- microsserviços;
- Redis ou filas;
- autenticação JWT em localStorage;
- OAuth social;
- envio real de e-mails;
- importação de arquivos;
- funcionalidades fora de `docs/BACKLOG.md`.

