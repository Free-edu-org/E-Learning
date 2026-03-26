# Review Checklist

## A. Correctness
- Requirement implemented exactly.
- No unintended behavior changes.

## B. Security/Authz
- Role checks correct.
- Owner checks correct.
- No privilege escalation.
- No sensitive data leak.

## C. API/Contract
- Code matches `api-contract.md`.
- Error codes/statuses consistent.

## D. Data/DB
- Migration safe and deterministic.
- Backward compatibility considered.
- Constraints/indexes make sense.

## E. Tests (final pass)
- Critical paths covered.
- Edge/corner cases covered.
- Assertions precise and deterministic.

## F. Maintainability
- Complexity acceptable.
- Naming and structure consistent.
- No obvious technical debt spikes.

## G. Release risk
- Rollout/rollback risk known.
- Monitoring/logging impact known.
- Final decision: APPROVE / APPROVE WITH CONDITIONS / REJECT.
