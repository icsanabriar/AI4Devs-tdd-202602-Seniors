# Backend Unit Tests

## Objective

This document specifies a Jest **unit** test suite for **candidate insertion**: HTTP/API payload reception and validation (Family 1) and persistence orchestration with Prisma **mocked** (Family 2). It is the handoff for `backend-test-developer` and the audit baseline for `backend-test-reviewer`.

## Scope

**In scope**

- `POST /candidates` body handling as exercised through `addCandidate` and `validateCandidateData` (same payload shape as `backend/src/routes/candidateRoutes.ts` → `addCandidate`).
- `validateCandidateData` in `backend/src/application/validator.ts` (names, email, phone, address, nested educations, work experiences, CV).
- `addCandidate` in `backend/src/application/services/candidateService.ts` (validation → `Candidate.save` → optional `Education` / `WorkExperience` / `Resume` saves, `P2002` mapping).
- Domain persistence helpers used on the insert path: `Candidate`, `Education`, `WorkExperience`, `Resume` under `backend/src/domain/models/`.

**Out of scope**

- Express wiring in `backend/src/index.ts`, `candidateRoutes` HTTP integration, `fileUploadService`, Swagger.
- Real database or Prisma migrations; any test that would open a real `DATABASE_URL` connection.

## Modules Analyzed

| Path | Role |
|------|------|
| `backend/src/application/validator.ts` | `validateCandidateData` and private validators; early exit when `data.id` is set. |
| `backend/src/application/services/candidateService.ts` | `addCandidate` orchestration. |
| `backend/src/domain/models/Candidate.ts` | Singleton `PrismaClient`; `save` create/update; `findOne`. |
| `backend/src/domain/models/Education.ts` | `save` create/update. |
| `backend/src/domain/models/WorkExperience.ts` | `save` create/update. |
| `backend/src/domain/models/Resume.ts` | `save` / `create` (no updates allowed). |
| `backend/src/presentation/controllers/candidateController.ts` | Re-exports `addCandidate` (optional thin controller tests if desired). |
| `backend/src/routes/candidateRoutes.ts` | Delegates to `addCandidate` (optional). |

**Prisma wiring:** each domain model file instantiates `new PrismaClient()` at module scope (**singleton per module**). Unit tests should mock `@prisma/client` so every `new PrismaClient()` receives the **same** in-memory delegate object (shared mock instance).

## Test Strategy

- **Runner:** Jest from `backend/` (`npm test`), TypeScript via `ts-jest`.
- **Unit vs integration:** these tests are **unit** tests: **no real DB**; mock `PrismaClient` at `@prisma/client` (constructor mock returning a shared object with `jest.fn()` delegates).
- **AAA:** every case uses Arrange / Act / Assert with explicit mock setup in Arrange.
- **Coverage:** configure `collectCoverageFrom` for the insertion-related modules above so coverage reflects the agreed scope (not the entire Express app).
- **Handoff:** `backend-test-developer` implements cases in `backend/src/tests/tests-ics.test.ts`; `backend-test-reviewer` checks spec alignment, AAA, DB safety, and coverage evidence.

### Coverage / branch checklist

- Validator: all field rules, optional phone, optional end dates, CV object shape, `data.id` short-circuit.
- `addCandidate`: validation error propagation, minimal create, nested education/work/cv loops, non-`P2002` persistence errors, `P2002` → user-facing message.
- `Candidate.save`: create success, `PrismaClientInitializationError` on create, update success, update `P2025`, update generic error rethrow.
- `Candidate.findOne`: `null`, found.
- `Education` / `WorkExperience`: create and update branches.
- `Resume`: `create` success; `save` rejects when `id` is set.

## Test Families

### 1. Reception of Form Data

Covers `validateCandidateData` (and thus form semantics before persistence): required fields for new candidates, optional fields, invalid formats, length limits, nested arrays, CV shape, and **edit mode** (`data.id` present → validation skipped).

### 2. Saving Data into the Database

Covers `addCandidate` and domain `save`/`create`/`findOne` with **Prisma fully mocked**: successful `candidate.create`, related `education.create` / `workExperience.create` / `resume.create`, simulated Prisma rejections (`P2002`, init errors, record not found), and direct model tests for branches not hit by the service alone.

## Detailed Test Cases

### [TEST-001] Valid minimal new candidate passes validation

- **Type:** Positive
- **Target Module:** `backend/src/application/validator.ts` — `validateCandidateData`
- **Target Public Behavior:** Required fields for a new candidate pass all checks when optional fields are omitted.
- **Purpose:** Lock the happy-path contract for the smallest valid payload.
- **Preconditions:** `data` has no `id`.
- **Mocks Required:** none
- **Arrange:** Build `data` with valid `firstName`, `lastName`, `email`, valid or omitted `phone`, dates as `YYYY-MM-DD` where required for nested arrays (none).
- **Act:** Call `validateCandidateData(data)`.
- **Assert:** No throw.
- **Notes for `backend-test-developer`:** Use realistic Spanish phone `612345678` if including phone.
- **Validation Notes for `backend-test-reviewer`:** Assert `not.toThrow()` or equivalent.

### [TEST-002] Missing first name fails validation

- **Type:** Negative
- **Target Module:** `backend/src/application/validator.ts` — `validateCandidateData`
- **Target Public Behavior:** Rejects invalid/missing name.
- **Purpose:** Required field enforcement.
- **Preconditions:** No `id` on payload.
- **Mocks Required:** none
- **Arrange:** Omit `firstName` or use too-short string.
- **Act:** `() => validateCandidateData(data)`.
- **Assert:** Throws with message indicating invalid name.
- **Notes for `backend-test-developer`:** Match `Invalid name`.
- **Validation Notes for `backend-test-reviewer`:** Use `expect(...).toThrow('Invalid name')` or matcher on message.

### [TEST-003] Invalid email format fails

- **Type:** Negative
- **Target Module:** `validator.ts`
- **Target Public Behavior:** Email regex enforced.
- **Purpose:** Prevent bad email reaching persistence.
- **Preconditions:** None.
- **Mocks Required:** none
- **Arrange:** Valid names, email without `@` domain.
- **Act:** Call `validateCandidateData`.
- **Assert:** `Invalid email`.
- **Notes for `backend-test-developer`:** —
- **Validation Notes for `backend-test-reviewer`:** —

### [TEST-004] Invalid phone when provided fails

- **Type:** Negative
- **Target Module:** `validator.ts`
- **Target Public Behavior:** Optional phone; if present must match `^(6|7|9)\d{8}$`.
- **Purpose:** Optional field validation branch.
- **Preconditions:** `phone` is a non-empty invalid string.
- **Mocks Required:** none
- **Arrange:** `phone: '123'`.
- **Act:** `validateCandidateData`.
- **Assert:** `Invalid phone`.
- **Notes for `backend-test-developer`:** Omit phone entirely in a separate positive case to show optional path.
- **Validation Notes for `backend-test-reviewer`:** Two cases: invalid phone vs omitted phone (positive).

### [TEST-005] Address over max length fails

- **Type:** Edge Case
- **Target Module:** `validator.ts`
- **Target Public Behavior:** Address length ≤ 100 when provided.
- **Purpose:** Schema alignment.
- **Preconditions:** None.
- **Mocks Required:** none
- **Arrange:** `address` string length 101.
- **Act:** `validateCandidateData`.
- **Assert:** `Invalid address`.
- **Notes for `backend-test-developer`:** —
- **Validation Notes for `backend-test-reviewer`:** —

### [TEST-006] Invalid education institution fails

- **Type:** Negative
- **Target Module:** `validator.ts`
- **Target Public Behavior:** Each education entry validated.
- **Purpose:** Nested reception rules.
- **Preconditions:** `educations` array with one invalid item.
- **Mocks Required:** none
- **Arrange:** Missing `institution` or length > 100.
- **Act:** `validateCandidateData`.
- **Assert:** `Invalid institution`.
- **Notes for `backend-test-developer`:** Valid `startDate` required to reach institution checks in some branches.
- **Validation Notes for `backend-test-reviewer`:** —

### [TEST-007] Education invalid end date when provided

- **Type:** Edge Case
- **Target Module:** `validator.ts`
- **Target Public Behavior:** `endDate` optional but must match `YYYY-MM-DD` when present.
- **Mocks Required:** none
- **Arrange:** `endDate: 'not-a-date'`.
- **Act:** `validateCandidateData`.
- **Assert:** `Invalid end date`.
- **Notes for `backend-test-developer`:** —
- **Validation Notes for `backend-test-reviewer`:** —

### [TEST-008] Invalid work experience company / description length

- **Type:** Negative / Edge Case
- **Target Module:** `validator.ts`
- **Target Public Behavior:** Company, position, description length and dates.
- **Mocks Required:** none
- **Arrange:** `description` length 201; separate case for invalid company.
- **Act:** `validateCandidateData`.
- **Assert:** `Invalid description` / `Invalid company`.
- **Notes for `backend-test-developer`:** Split into two tests for clarity (one behavior each).
- **Validation Notes for `backend-test-reviewer`:** —

### [TEST-009] CV object must include filePath and fileType strings

- **Type:** Negative
- **Target Module:** `validator.ts`
- **Target Public Behavior:** `validateCV` rejects non-objects or missing fields.
- **Mocks Required:** none
- **Arrange:** `cv: {}` or `cv: { filePath: 1 }`.
- **Act:** `validateCandidateData`.
- **Assert:** `Invalid CV data`.
- **Notes for `backend-test-developer`:** When `cv` is absent or `{}` with `Object.keys(cv).length === 0`, CV validation is skipped per code.
- **Validation Notes for `backend-test-reviewer`:** Assert skip path for empty cv separately (positive edge).

### [TEST-010] When `data.id` is set, validation is skipped

- **Type:** Edge Case
- **Target Module:** `validator.ts`
- **Target Public Behavior:** Edit mode short-circuit.
- **Mocks Required:** none
- **Arrange:** `id: 1`, other fields invalid on purpose.
- **Act:** `validateCandidateData`.
- **Assert:** No throw.
- **Notes for `backend-test-developer`:** Documents product behavior as implemented.
- **Validation Notes for `backend-test-reviewer`:** Flag as intentional if business should change later.

### [TEST-011] `addCandidate` persists minimal candidate and returns Prisma row

- **Type:** Positive
- **Target Module:** `backend/src/application/services/candidateService.ts` — `addCandidate`
- **Target Public Behavior:** After validation, calls `prisma.candidate.create` path via `Candidate.save` and returns created record.
- **Purpose:** Core insert path.
- **Preconditions:** Mocks return `{ id: 1, ... }` from `candidate.create`.
- **Mocks Required:** Prisma (`candidate.create`); no real DB.
- **Arrange:** Valid payload; mock `candidate.create` resolved value.
- **Act:** `await addCandidate(payload)`.
- **Assert:** Return equals mock result; `candidate.create` called with `expect.objectContaining` on data fields.
- **Notes for `backend-test-developer`:** Mock `@prisma/client` constructor; reset in `beforeEach`.
- **Validation Notes for `backend-test-reviewer`:** Assert no real `PrismaClient` usage beyond mock.

### [TEST-012] `addCandidate` saves education rows after candidate

- **Type:** Positive
- **Target Module:** `candidateService.ts`
- **Target Public Behavior:** For each `educations` entry, `Education.save` → `prisma.education.create`.
- **Mocks Required:** Prisma `candidate.create`, `education.create`.
- **Arrange:** Payload with one education; mocks resolve with ids.
- **Act:** `await addCandidate(payload)`.
- **Assert:** `education.create` called with `candidateId` matching saved candidate id; call order or call count.
- **Notes for `backend-test-developer`:** Candidate must resolve first to supply `candidateId`.
- **Validation Notes for `backend-test-reviewer`:** —

### [TEST-013] `addCandidate` maps Prisma `P2002` to friendly email message

- **Type:** Negative
- **Target Module:** `candidateService.ts`
- **Target Public Behavior:** Unique violation surfaces as `The email already exists in the database`.
- **Mocks Required:** Prisma delegate rejects with `{ code: 'P2002' }`.
- **Arrange:** Valid payload; `candidate.create` rejects with `P2002` (or nested save—any throw with `code` in catch).
- **Act:** `await addCandidate(payload)` with rejection helper.
- **Assert:** Rejects/throws with exact message.
- **Notes for `backend-test-developer`:** Use `await expect(addCandidate(...)).rejects.toThrow(...)`.
- **Validation Notes for `backend-test-reviewer`:** Ensure error has `code` property as production Prisma errors do.

### [TEST-014] Validation failure does not call Prisma create

- **Type:** Negative
- **Target Module:** `candidateService.ts`
- **Target Public Behavior:** `validateCandidateData` throws before persistence.
- **Mocks Required:** Prisma (assert zero calls to create).
- **Arrange:** Invalid email payload.
- **Act:** `await expect(addCandidate(payload)).rejects`.
- **Assert:** `candidate.create` not called.
- **Notes for `backend-test-developer`:** Service wraps validation errors in `new Error(error)`—assert message behavior.
- **Validation Notes for `backend-test-reviewer`:** DB safety: no create on invalid input.

### [TEST-015] `Candidate.save` maps DB init error on create

- **Type:** Negative
- **Target Module:** `Candidate.ts`
- **Target Public Behavior:** `PrismaClientInitializationError` → Spanish connection message.
- **Mocks Required:** `candidate.create` throws `new Prisma.PrismaClientInitializationError(...)`.
- **Arrange:** `new Candidate({...})` without `id`.
- **Act:** `await candidate.save()`.
- **Assert:** Rejects with connection message substring.
- **Notes for `backend-test-developer`:** Use real `Prisma` namespace from `@prisma/client` for instanceof.
- **Validation Notes for `backend-test-reviewer`:** —

### [TEST-016] `Candidate.save` update path `P2025` message

- **Type:** Negative
- **Target Module:** `Candidate.ts`
- **Target Public Behavior:** Record not found on update.
- **Mocks Required:** `candidate.update` rejects `{ code: 'P2025' }`.
- **Arrange:** Candidate with `id: 1`.
- **Act:** `await candidate.save()`.
- **Assert:** Error message about ID not found (Spanish string in code).
- **Notes for `backend-test-developer`:** —
- **Validation Notes for `backend-test-reviewer`:** —

### [TEST-017] `Candidate.findOne` returns null or instance

- **Type:** Positive / Edge Case
- **Target Module:** `Candidate.ts`
- **Target Public Behavior:** Maps DB row to model or null.
- **Mocks Required:** `candidate.findUnique`.
- **Arrange:** mock returns `null` then returns a row object.
- **Act:** `await Candidate.findOne(1)`.
- **Assert:** `null` / instance with fields.
- **Notes for `backend-test-developer`:** —
- **Validation Notes for `backend-test-reviewer`:** —

### [TEST-018] `Resume.save` throws when updating existing resume

- **Type:** Negative
- **Target Module:** `Resume.ts`
- **Target Public Behavior:** Disallow updates via `save` when `id` set.
- **Mocks Required:** none (no Prisma call expected).
- **Arrange:** `new Resume({ id: 1, candidateId: 1, filePath: 'x', fileType: 'pdf' })`.
- **Act:** `resume.save()`.
- **Assert:** Rejects with Spanish “no se permite” message.
- **Notes for `backend-test-developer`:** —
- **Validation Notes for `backend-test-reviewer`:** —

## Risks / ambiguities

- `validateCandidateData` skips all checks when `id` is present; product intent may differ from API expectations.
- `candidateService` catch uses `throw new Error(error)` for validation failures—message shape may differ from raw `Error`.
- Multiple `PrismaClient` instances in domain modules require a **constructor-level** mock so all share delegates; otherwise tests could be flaky or still hit real code paths.
