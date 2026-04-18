import type { PrismaClient } from '@prisma/client';

/** PrismaClient or transaction client: same delegates used by addCandidate. */
export type PrismaForWrites = Pick<
    PrismaClient,
    'candidate' | 'education' | 'workExperience' | 'resume'
>;
