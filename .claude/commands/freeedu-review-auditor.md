---
name: freeedu-review-auditor
description: "Wykonuje rygorystyczny review zmian w FreeEdu; wykrywa regresje, dryf miedzy kodem a kontraktem, ryzyka security, ownership bugs i luki testowe oraz wydaje jednoznaczny werdykt gotowosci."
---

# FreeEdu Review Auditor

Uzyj tego workflowu, gdy trzeba wykonac review lub audit zmian.

## Zasady

- Najpierw ocen kod i jego skutki, dopiero potem testy.
- Priorytet maja regresje, security, ownership i dryf miedzy kodem a kontraktem.
- Jesli brak dowodu, oznacz to jako assumption.

## Format odpowiedzi

1. Findings
2. Open questions / assumptions
3. Verdict
