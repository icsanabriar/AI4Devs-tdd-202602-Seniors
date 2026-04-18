# Jest Testing Skill — Examples

Official API and behavior references: [Jest documentation](https://jestjs.io/).

These examples illustrate **naming**, **AAA**, **vertical-slice TDD**, and idiomatic Jest—not a mandate to copy filenames if your repo differs.

---

## 1. Describe / test naming (behavior-focused)

```javascript
// Good: describes observable outcomes
describe('createInvoice', () => {
  test('creates an invoice when the order is paid', () => {
    // ...
  });

  test('returns 404 when the order does not exist', () => {
    // ...
  });
});

// Bad: vague or implementation-obsessed
describe('createInvoice', () => {
  test('works', () => {});
  test('calls validateOrder', () => {});
  test('sets _persisted flag', () => {});
});
```

---

## 2. AAA with blank lines (and comments when helpful)

```typescript
import { determineShipping } from '../shipping';

describe('determineShipping', () => {
  test('returns standard shipping when weight is below the threshold', () => {
    // Arrange
    const order = { id: 'o1', totalWeightKg: 4, destination: 'US' };

    // Act
    const result = determineShipping(order);

    // Assert
    expect(result.method).toBe('standard');
    expect(result.estimatedDays).toBeGreaterThan(0);
  });
});
```

---

## 3. One vertical TDD slice (red → green → refactor)

**Behavior:** Paid order receives expedited shipping.

1. **Red:** single failing test for the contract you actually need.

```typescript
test('selects expedited shipping for a paid order over the weight threshold', () => {
  // Arrange
  const order = { id: 'o2', paid: true, totalWeightKg: 35, destination: 'US' };

  // Act
  const result = determineShipping(order);

  // Assert
  expect(result.method).toBe('expedited');
});
```

2. **Green:** smallest implementation that satisfies **only** what this test asserts (and any compilation reality).
3. **Refactor:** rename/extract **with tests green**.
4. **Next test:** e.g. unpaid order does **not** get expedited—new failing test, repeat.

---

## 4. Async: prefer async/await (official pattern)

From [Jest — asynchronous](https://jestjs.io/docs/asynchronous):

```javascript
test('the data is peanut butter', async () => {
  const data = await fetchData();
  expect(data).toBe('peanut butter');
});
```

Rejecting promises under test:

```javascript
await expect(fetchData()).rejects.toThrow('network');
```

Use `expect.assertions(n)` when assertions live in branches Jest might not reach (same doc).

---

## 5. Mock at boundaries, not neighbors

**Prefer:** real module + fake **HTTP** server or injected **clock** at the edge.

**Acceptable:** `jest.spyOn(Date, 'now')` or `jest.useFakeTimers()` for time rules (restore in `afterEach` per project norms).

**Avoid:** mocking every imported helper so the test only verifies call order between internal functions.

```typescript
// Boundary-style mock example (use only when the boundary is truly external / flaky)
jest.mock('../clients/paymentGateway', () => ({
  charge: jest.fn().mockResolvedValue({ status: 'captured' }),
}));
```

---

## 6. TypeScript: match repo style for globals vs imports

**Pattern A — globals** (typical with `"types": ["jest"]` in tsconfig):

```typescript
test('adds numbers', () => {
  expect(1 + 1).toBe(2);
});
```

**Pattern B — explicit `@jest/globals`** (per [Expect — setupFilesAfterEnv](https://jestjs.io/docs/expect) and team preference):

```typescript
import { expect, test } from '@jest/globals';

test('adds numbers', () => {
  expect(1 + 1).toBe(2);
});
```

Do **not** mix A and B in one codebase without **following** existing files.

---

## 7. Colocated placement example (default when repo has no pattern)

| Source | Suggested colocated test |
|--------|-------------------------|
| `src/services/orders/createInvoice.ts` | `src/services/orders/createInvoice.test.ts` |

If the repo uses `tests/unit/services/createInvoice.test.ts` **instead**, mirror **that**.

---

## 8. Integration-style Jest test (when repo supports it)

Sketch when behavior spans modules but still runs in Node (adjust to your HTTP stack):

```typescript
/**
 * Example shape only—wire to your app's actual createServer / listen / request helper.
 */
test('POST /invoices returns 201 and an id for a valid body', async () => {
  // Arrange: app or test server per repo helpers
  // Act: HTTP client call
  // Assert: status + JSON body fields that matter to the business
});
```

Keep I/O **fast** and **deterministic**; use transactions, test DB, or container patterns **if** the repo already does.
