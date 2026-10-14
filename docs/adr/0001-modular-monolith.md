# ADR 0001 — Monólito modular

- Status: aceito
- Data: 13/10/2026

## Contexto

O prazo é curto, o domínio é pequeno e a aplicação precisa de HTTP, tempo real e banco transacional.

## Decisão

Construir frontend e backend no mesmo repositório e distribuir uma única aplicação, mantendo módulos de domínio separados internamente.

## Consequências

- Menor custo de deploy e depuração.
- Transações simples entre módulos.
- Um único ponto de escala inicialmente.
- Exige disciplina para evitar acoplamento entre módulos.

## Alternativas rejeitadas

- Microsserviços: custo operacional e complexidade sem demanda comprovada.
- Low-code: menor aderência ao objetivo de demonstrar engenharia backend e segurança.

