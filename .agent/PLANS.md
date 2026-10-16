# Padrão de ExecPlan

O ExecPlan é um documento vivo para iniciativas relevantes. Ele precisa permitir que outro desenvolvedor continue o trabalho sem contexto adicional.

## Seções obrigatórias

- Objetivo e resultado esperado.
- Contexto e restrições.
- Decisões vigentes.
- Etapas e status.
- Critérios de aceite.
- Riscos e mitigação.
- Registro de decisões e mudanças.
- Validações executadas.
- Pendências e próximos passos.

## Estados permitidos

- `pending`
- `in_progress`
- `completed`
- `blocked`

Somente uma etapa pode ficar `in_progress` por vez.

## Manutenção

- Atualize o plano antes de iniciar uma nova etapa.
- Registre mudanças de direção com data e justificativa.
- Não marque validação que não foi realmente executada.
- Registre comandos executados e seus resultados resumidos.
- Ao concluir, mantenha as pendências explícitas.

