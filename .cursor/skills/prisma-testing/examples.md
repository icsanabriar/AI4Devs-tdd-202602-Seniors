# Prisma Testing Skill — Examples

Official patterns evolve; verify details in [Prisma: Unit testing](https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing). Adjust import paths to your generated client (`@prisma/client` or custom `output`).

These examples show **shape**, not your exact folder layout—**mirror the repository** first.

---

## 1. Singleton client — `jest.mock` + `mockDeep` + `mockReset`

**When:** production code does `import prisma from '@/lib/db'` (or similar).

```typescript
// prisma singleton module: lib/db.ts — your path may differ
// Jest replaces it with a deep mock.

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import prisma from '@/lib/db';

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// Often re-export prismaMock from a test helper; reset in beforeEach:

beforeEach(() => {
  mockReset(prismaMock);
});
```

**Notes (from Prisma guidance):**

- `mockDeep<PrismaClient>()` provides nested mocks for `prisma.user.findUnique`, etc.
- `mockReset` clears call history and implementations between tests **when sharing one mock**.

**Hoisting:** `jest.mock` is hoisted; keep `prismaMock` export/import order consistent with your Jest+TS setup.

---

## 2. Dependency injection — `createMockContext` + fresh `ctx`

**When:** functions accept `prisma` or a `context` object (Fastify/Express/Nest-style).

```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

export type Context = { prisma: PrismaClient };
export type MockContext = { prisma: DeepMockProxy<PrismaClient> };

export function createMockContext(): MockContext {
  return { prisma: mockDeep<PrismaClient>() };
}

// In tests:
import { createMockContext, MockContext, Context } from '../context';

let mockCtx: MockContext;
let ctx: Context;

beforeEach(() => {
  mockCtx = createMockContext();
  ctx = mockCtx as unknown as Context;
});

test('creates a user when input is valid', async () => {
  // Arrange
  const input = { email: 'a@b.co', name: 'Ada' };
  const created = { id: 1, ...input };
  mockCtx.prisma.user.create.mockResolvedValue(created);

  // Act
  const result = await createUser(input, ctx);

  // Assert
  expect(result).toEqual(created);
  expect(mockCtx.prisma.user.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ email: input.email, name: input.name }),
  });
});
```

**Prefer:** fresh `createMockContext()` per test when tests might **leak** mock state.

---

## 3. Branching on `null` (not found)

```typescript
test('returns null when the user does not exist', async () => {
  // Arrange
  mockCtx.prisma.user.findUnique.mockResolvedValue(null);

  // Act
  const result = await getUserProfile('missing-id', ctx);

  // Assert
  expect(result).toBeNull();
  expect(mockCtx.prisma.user.findUnique).toHaveBeenCalledWith({
    where: { id: 'missing-id' },
  });
});
```

Use **`expect.objectContaining`** when **only** subset of args is contractually stable.

---

## 4. Simulating Prisma errors (unique constraint)

```typescript
import { Prisma } from '@prisma/client';

test('throws when email is already taken', async () => {
  // Arrange
  const err = new Prisma.PrismaClientKnownRequestError('Unique', {
    code: 'P2002',
    clientVersion: 'test',
  });
  mockCtx.prisma.user.create.mockRejectedValue(err);

  // Act + Assert
  await expect(createUser({ email: 'dup@x.co', name: 'A' }, ctx)).rejects.toMatchObject({
    code: 'P2002',
  });
});
```

Align **`PrismaClientKnownRequestError`** construction with your **Prisma version** docs.

---

## 5. AAA layout (blank lines + optional comments)

```typescript
test('returns the created user when the input is valid', async () => {
  // Arrange
  const input = { email: 'ok@x.co', name: 'Bo' };
  const row = { id: 10, email: input.email, name: input.name };
  mockCtx.prisma.user.create.mockResolvedValue(row);

  // Act
  const out = await createUser(input, ctx);

  // Assert
  expect(out).toEqual(row);
});
```

---

## 6. Integration test sketch (real DB) — **only** if repo already does this

```typescript
// Illustrative only — follow your repo's DB URL, migrations, and cleanup.
// See Prisma docs on integration testing and adapters if you use driver adapters.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

test('persists a user (integration)', async () => {
  const user = await prisma.user.create({ data: { email: 'i@x.co', name: 'I' } });
  expect(user.id).toBeDefined();
});
```

**Do not** add this style to **unit** suites or without existing CI/database discipline.

---

## 7. Using generated types in mocks

```typescript
import type { User } from '@prisma/client'; // or from generated path

const userRow: User = {
  id: 1,
  email: 't@e.st',
  name: 'T',
  // ...required fields per your schema
} as User;

mockCtx.prisma.user.findUnique.mockResolvedValue(userRow);
```

Fill **all** non-optional fields your schema requires **or** cast judiciously—**prefer** `satisfies` / proper literals over `as any`.
