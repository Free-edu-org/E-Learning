# Frontend View Checklist

## 1. Existing style first
- Similar screens reviewed.
- Same component patterns reused.
- Same routing and page structure conventions used.

## 2. UX completeness
- Loading state.
- Empty state.
- Error state.
- Success state.

## 3. API correctness
- Every call mapped to `api-contract.md`.
- Request/response types aligned.
- Error handling aligned with known error codes.

## 4. Backend gap handling
- Missing endpoint/field detected.
- Gap reported as blocker (`Backend Gap`).
- No fake data path presented as final solution.

## 5. Quality
- Type-safe changes.
- No unnecessary refactors.
- No style drift from existing frontend.
