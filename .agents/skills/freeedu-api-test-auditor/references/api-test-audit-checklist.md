# API Test Audit Checklist

## 0. Code-first gate (mandatory)

- Treat backend code as source of truth.
- Update `api-contract.md` from code before touching tests.
- Update `.http` files after contract update.
- Only then update/add tests.

## 1. Contract matrix

For each endpoint in backend code capture:
- Path
- Method
- Allowed roles
- Ownership/rule conditions
- Success status and response shape
- Error statuses and `code`

Reflect this matrix in `api-contract.md`.

## 2. Test matrix

For each endpoint verify tests include:
- Happy path
- 401 unauthenticated
- 403 wrong role
- 404 not found (if resource-based)
- 400 validation (if input-based)
- 409 conflict (if uniqueness/business conflict)

## 3. Precision rules

- Do not use "one of many statuses" assertions.
- Assert exact status.
- Assert exact `code` for JSON ProblemDetail errors.
- If backend returns plain text, assert plain text explicitly.
- Match existing test writing style in `api-tests/tests` (suite layout, naming, assertions, setup patterns).

## 4. Authorization coverage

- Admin-only endpoints
- Teacher-only endpoints
- Student-only endpoints
- Owner vs non-owner
- Teacher-student relation constraints

## 5. Edge/corner coverage

- Empty and whitespace values
- Invalid formats
- Boundary lengths
- Duplicate requests
- Repeated delete/update behavior
- Invalid/expired/malformed token
- Unsupported HTTP methods

## 6. Drift report

When mismatch exists between backend and contract, report:
- Endpoint and scenario
- Contract expectation
- Actual backend behavior
- Decision needed:
  - Update contract
  - Update backend
