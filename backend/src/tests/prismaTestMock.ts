import type { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>;
