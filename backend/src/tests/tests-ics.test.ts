jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client') as typeof import('@prisma/client');
  const shared = {
    candidate: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    education: {
      create: jest.fn(),
      update: jest.fn(),
    },
    workExperience: {
      create: jest.fn(),
      update: jest.fn(),
    },
    resume: {
      create: jest.fn(),
    },
  };
  return {
    ...actual,
    PrismaClient: jest.fn(() => shared),
  };
});

import { PrismaClient, Prisma } from '@prisma/client';
import { validateCandidateData } from '../application/validator';
import { addCandidate } from '../application/services/candidateService';
import { Candidate } from '../domain/models/Candidate';
import { Education } from '../domain/models/Education';
import { WorkExperience } from '../domain/models/WorkExperience';
import { Resume } from '../domain/models/Resume';

const prismaMock = new PrismaClient() as jest.Mocked<PrismaClient> & {
  candidate: { create: jest.Mock; update: jest.Mock; findUnique: jest.Mock };
  education: { create: jest.Mock; update: jest.Mock };
  workExperience: { create: jest.Mock; update: jest.Mock };
  resume: { create: jest.Mock };
};

const minimalValid = () => ({
  firstName: 'María',
  lastName: 'García',
  email: 'maria.garcia@example.com',
});

beforeEach(() => {
  prismaMock.candidate.create.mockReset();
  prismaMock.candidate.update.mockReset();
  prismaMock.candidate.findUnique.mockReset();
  prismaMock.education.create.mockReset();
  prismaMock.education.update.mockReset();
  prismaMock.workExperience.create.mockReset();
  prismaMock.workExperience.update.mockReset();
  prismaMock.resume.create.mockReset();
});

describe('validateCandidateData', () => {
  test('accepts a valid minimal new candidate payload', () => {
    const data = minimalValid();

    expect(() => validateCandidateData(data)).not.toThrow();
  });

  test('rejects when first name is missing', () => {
    const data = { ...minimalValid(), firstName: '' };

    expect(() => validateCandidateData(data)).toThrow('Invalid name');
  });

  test('rejects first name longer than 100 characters', () => {
    const data = { ...minimalValid(), firstName: 'A'.repeat(101) };

    expect(() => validateCandidateData(data)).toThrow('Invalid name');
  });

  test('rejects invalid email', () => {
    const data = { ...minimalValid(), email: 'not-an-email' };

    expect(() => validateCandidateData(data)).toThrow('Invalid email');
  });

  test('rejects empty email', () => {
    const data = { ...minimalValid(), email: '' };

    expect(() => validateCandidateData(data)).toThrow('Invalid email');
  });

  test('rejects invalid phone when provided', () => {
    const data = { ...minimalValid(), phone: '123' };

    expect(() => validateCandidateData(data)).toThrow('Invalid phone');
  });

  test('allows omitting optional phone', () => {
    const data = minimalValid();

    expect(() => validateCandidateData(data)).not.toThrow();
  });

  test('rejects address longer than 100 characters', () => {
    const data = { ...minimalValid(), address: 'a'.repeat(101) };

    expect(() => validateCandidateData(data)).toThrow('Invalid address');
  });

  test('rejects invalid education institution', () => {
    const data = {
      ...minimalValid(),
      educations: [
        {
          institution: '',
          title: 'Grado',
          startDate: '2020-01-01',
        },
      ],
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid institution');
  });

  test('rejects education institution longer than 100 characters', () => {
    const data = {
      ...minimalValid(),
      educations: [
        {
          institution: 'U'.repeat(101),
          title: 'Grado',
          startDate: '2020-01-01',
        },
      ],
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid institution');
  });

  test('rejects education title longer than 100 characters', () => {
    const data = {
      ...minimalValid(),
      educations: [
        {
          institution: 'Universidad',
          title: 'T'.repeat(101),
          startDate: '2020-01-01',
        },
      ],
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid title');
  });

  test('rejects invalid education end date when provided', () => {
    const data = {
      ...minimalValid(),
      educations: [
        {
          institution: 'Universidad',
          title: 'Grado',
          startDate: '2020-01-01',
          endDate: 'bad-date',
        },
      ],
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid end date');
  });

  test('rejects work experience when company is invalid', () => {
    const data = {
      ...minimalValid(),
      workExperiences: [
        {
          company: '',
          position: 'Dev',
          startDate: '2021-06-01',
        },
      ],
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid company');
  });

  test('rejects work experience company longer than 100 characters', () => {
    const data = {
      ...minimalValid(),
      workExperiences: [
        {
          company: 'C'.repeat(101),
          position: 'Dev',
          startDate: '2021-06-01',
        },
      ],
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid company');
  });

  test('rejects work experience position longer than 100 characters', () => {
    const data = {
      ...minimalValid(),
      workExperiences: [
        {
          company: 'ACME',
          position: 'P'.repeat(101),
          startDate: '2021-06-01',
        },
      ],
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid position');
  });

  test('rejects work experience when description exceeds 200 chars', () => {
    const data = {
      ...minimalValid(),
      workExperiences: [
        {
          company: 'ACME',
          position: 'Dev',
          description: 'd'.repeat(201),
          startDate: '2021-06-01',
        },
      ],
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid description');
  });

  test('rejects CV when filePath is wrong type (non-empty cv, TEST-009)', () => {
    const data = {
      ...minimalValid(),
      cv: { filePath: 1 },
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid CV data');
  });

  test('rejects invalid CV when fileType is wrong type', () => {
    const data = {
      ...minimalValid(),
      cv: { filePath: 'x', fileType: 123 as unknown as string },
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid CV data');
  });

  test('skips validation when data.id is present', () => {
    const data = {
      id: 1,
      firstName: '',
      email: 'bad',
    };

    expect(() => validateCandidateData(data)).not.toThrow();
  });

  test('skips CV validation when cv is empty object (TEST-009a)', () => {
    const data = {
      ...minimalValid(),
      cv: {},
    };

    expect(() => validateCandidateData(data)).not.toThrow();
  });

  test('rejects last name that is too short', () => {
    const data = { ...minimalValid(), lastName: 'X' };

    expect(() => validateCandidateData(data)).toThrow('Invalid name');
  });

  test('rejects name containing digits', () => {
    const data = { ...minimalValid(), firstName: 'Juan3' };

    expect(() => validateCandidateData(data)).toThrow('Invalid name');
  });

  test('rejects invalid education title', () => {
    const data = {
      ...minimalValid(),
      educations: [
        {
          institution: 'Universidad',
          title: '',
          startDate: '2020-01-01',
        },
      ],
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid title');
  });

  test('rejects invalid education start date', () => {
    const data = {
      ...minimalValid(),
      educations: [
        {
          institution: 'Universidad',
          title: 'Grado',
          startDate: 'not-a-date',
        },
      ],
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid date');
  });

  test('allows education without end date', () => {
    const data = {
      ...minimalValid(),
      educations: [
        {
          institution: 'Universidad',
          title: 'Grado',
          startDate: '2020-01-01',
        },
      ],
    };

    expect(() => validateCandidateData(data)).not.toThrow();
  });

  test('rejects invalid work experience position', () => {
    const data = {
      ...minimalValid(),
      workExperiences: [
        {
          company: 'ACME',
          position: '',
          startDate: '2021-06-01',
        },
      ],
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid position');
  });

  test('rejects invalid work experience start date', () => {
    const data = {
      ...minimalValid(),
      workExperiences: [
        {
          company: 'ACME',
          position: 'Dev',
          startDate: 'bad',
        },
      ],
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid date');
  });

  test('allows work experience without end date', () => {
    const data = {
      ...minimalValid(),
      workExperiences: [
        {
          company: 'ACME',
          position: 'Dev',
          startDate: '2021-06-01',
        },
      ],
    };

    expect(() => validateCandidateData(data)).not.toThrow();
  });

  test('allows work experience with short optional description', () => {
    const data = {
      ...minimalValid(),
      workExperiences: [
        {
          company: 'ACME',
          position: 'Dev',
          description: 'Short',
          startDate: '2021-06-01',
        },
      ],
    };

    expect(() => validateCandidateData(data)).not.toThrow();
  });

  test('rejects invalid work experience end date when provided', () => {
    const data = {
      ...minimalValid(),
      workExperiences: [
        {
          company: 'ACME',
          position: 'Dev',
          startDate: '2021-06-01',
          endDate: 'not-iso',
        },
      ],
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid end date');
  });

  test('rejects CV when fileType is empty string', () => {
    const data = {
      ...minimalValid(),
      cv: { filePath: '/x.pdf', fileType: '' },
    };

    expect(() => validateCandidateData(data)).toThrow('Invalid CV data');
  });
});

describe('addCandidate', () => {
  test('returns saved candidate for minimal valid payload', async () => {
    const saved = { id: 42, ...minimalValid(), phone: null, address: null };
    prismaMock.candidate.create.mockResolvedValue(saved as never);

    const result = await addCandidate(minimalValid());

    expect(result).toEqual(saved);
    expect(prismaMock.candidate.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.education.create).not.toHaveBeenCalled();
  });

  test('persists nested educations after candidate', async () => {
    const saved = { id: 7, ...minimalValid(), phone: null, address: null };
    prismaMock.candidate.create.mockResolvedValue(saved as never);
    prismaMock.education.create.mockResolvedValue({ id: 99 } as never);

    const payload = {
      ...minimalValid(),
      educations: [
        {
          institution: 'Universidad',
          title: 'Informática',
          startDate: '2018-09-01',
          endDate: '2022-06-30',
        },
      ],
    };

    await addCandidate(payload);

    expect(prismaMock.education.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          candidateId: 7,
          institution: 'Universidad',
          title: 'Informática',
        }),
      }),
    );
  });

  test('persists work experiences and resume when provided', async () => {
    const saved = { id: 3, ...minimalValid(), phone: null, address: null };
    prismaMock.candidate.create.mockResolvedValue(saved as never);
    prismaMock.workExperience.create.mockResolvedValue({ id: 1 } as never);
    prismaMock.resume.create.mockResolvedValue({
      id: 1,
      candidateId: 3,
      filePath: '/files/cv.pdf',
      fileType: 'application/pdf',
      uploadDate: new Date(),
    } as never);

    const payload = {
      ...minimalValid(),
      workExperiences: [
        {
          company: 'ACME',
          position: 'Engineer',
          startDate: '2020-01-01',
        },
      ],
      cv: { filePath: '/files/cv.pdf', fileType: 'application/pdf' },
    };

    await addCandidate(payload);

    expect(prismaMock.workExperience.create).toHaveBeenCalled();
    expect(prismaMock.resume.create).toHaveBeenCalled();
  });

  test('maps Prisma P2002 to email conflict message', async () => {
    const err = Object.assign(new Error('Unique'), { code: 'P2002' });
    prismaMock.candidate.create.mockRejectedValue(err);

    await expect(addCandidate(minimalValid())).rejects.toThrow(
      'The email already exists in the database',
    );
  });

  test('does not call prisma when validation fails', async () => {
    const payload = { ...minimalValid(), email: 'invalid' };

    await expect(addCandidate(payload as never)).rejects.toThrow();

    expect(prismaMock.candidate.create).not.toHaveBeenCalled();
  });

  test('rethrows non-P2002 persistence errors', async () => {
    prismaMock.candidate.create.mockRejectedValue(new Error('db exploded'));

    await expect(addCandidate(minimalValid())).rejects.toThrow('db exploded');
  });
});

describe('Candidate', () => {
  test('save creates candidate when id is absent', async () => {
    const row = { id: 1, ...minimalValid(), phone: null, address: null };
    prismaMock.candidate.create.mockResolvedValue(row as never);

    const candidate = new Candidate(minimalValid());
    const result = await candidate.save();

    expect(result).toEqual(row);
    expect(prismaMock.candidate.create).toHaveBeenCalled();
    expect(prismaMock.candidate.update).not.toHaveBeenCalled();
  });

  test('save maps PrismaClientInitializationError on create', async () => {
    const InitError = Prisma.PrismaClientInitializationError;
    prismaMock.candidate.create.mockRejectedValue(new InitError('fail', '1.0.0'));

    const candidate = new Candidate(minimalValid());

    await expect(candidate.save()).rejects.toThrow('No se pudo conectar con la base de datos');
  });

  test('save includes nested relations when constructor arrays are populated', async () => {
    const row = { id: 10, ...minimalValid(), phone: null, address: null };
    prismaMock.candidate.create.mockResolvedValue(row as never);

    const candidate = new Candidate({
      ...minimalValid(),
      education: [
        { institution: 'Uni', title: 'Grado', startDate: '2019-09-01', endDate: '2023-06-01' },
      ],
      workExperience: [
        { company: 'ACME', position: 'Dev', startDate: '2023-07-01', description: 'Apps' },
      ],
      resumes: [{ filePath: '/cv.pdf', fileType: 'application/pdf' }],
    });

    await candidate.save();

    expect(prismaMock.candidate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        firstName: 'María',
        educations: {
          create: [
            expect.objectContaining({
              institution: 'Uni',
              title: 'Grado',
            }),
          ],
        },
        workExperiences: {
          create: [
            expect.objectContaining({
              company: 'ACME',
              position: 'Dev',
              description: 'Apps',
            }),
          ],
        },
        resumes: {
          create: [expect.objectContaining({ filePath: '/cv.pdf', fileType: 'application/pdf' })],
        },
      }),
    });
  });

  test('save maps PrismaClientInitializationError on update', async () => {
    const InitError = Prisma.PrismaClientInitializationError;
    prismaMock.candidate.update.mockRejectedValue(new InitError('fail', '1.0.0'));

    const candidate = new Candidate({ ...minimalValid(), id: 50 });

    await expect(candidate.save()).rejects.toThrow('No se pudo conectar con la base de datos');
  });

  test('save updates when id is set', async () => {
    const row = { id: 5, ...minimalValid(), phone: null, address: null };
    prismaMock.candidate.update.mockResolvedValue(row as never);

    const candidate = new Candidate({ ...minimalValid(), id: 5 });
    const result = await candidate.save();

    expect(result).toEqual(row);
    expect(prismaMock.candidate.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 } }),
    );
  });

  test('save maps P2025 on update to not found message', async () => {
    const err = Object.assign(new Error('Not found'), { code: 'P2025' });
    prismaMock.candidate.update.mockRejectedValue(err);

    const candidate = new Candidate({ ...minimalValid(), id: 999 });

    await expect(candidate.save()).rejects.toThrow('No se pudo encontrar el registro del candidato');
  });

  test('save rethrows unexpected update errors', async () => {
    prismaMock.candidate.update.mockRejectedValue(new Error('unexpected'));

    const candidate = new Candidate({ ...minimalValid(), id: 2 });

    await expect(candidate.save()).rejects.toThrow('unexpected');
  });

  test('save rethrows unexpected create errors', async () => {
    prismaMock.candidate.create.mockRejectedValue(new Error('boom'));

    const candidate = new Candidate(minimalValid());

    await expect(candidate.save()).rejects.toThrow('boom');
  });

  test('findOne returns null when no row', async () => {
    prismaMock.candidate.findUnique.mockResolvedValue(null);

    const result = await Candidate.findOne(1);

    expect(result).toBeNull();
  });

  test('findOne returns Candidate instance when row exists', async () => {
    const row = { id: 2, ...minimalValid(), phone: null, address: null, education: [], workExperience: [], resumes: [] };
    prismaMock.candidate.findUnique.mockResolvedValue(row as never);

    const result = await Candidate.findOne(2);

    expect(result).toBeInstanceOf(Candidate);
    expect(result?.email).toBe(row.email);
  });

  test('save omits prisma fields that are undefined on the instance', async () => {
    prismaMock.candidate.create.mockResolvedValue({ id: 1, lastName: 'García', email: 'x@y.com' } as never);

    const candidate = new Candidate({
      lastName: 'García',
      email: 'x@y.com',
      firstName: undefined,
      phone: undefined,
      address: undefined,
    } as never);

    await candidate.save();

    expect(prismaMock.candidate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        lastName: 'García',
        email: 'x@y.com',
      }),
    });
    const payload = prismaMock.candidate.create.mock.calls[0][0].data;
    expect(payload).not.toHaveProperty('firstName');
    expect(payload).not.toHaveProperty('phone');
    expect(payload).not.toHaveProperty('address');
  });

  test('save includes phone and address when they are defined', async () => {
    prismaMock.candidate.create.mockResolvedValue({ id: 1 } as never);

    const candidate = new Candidate({
      ...minimalValid(),
      phone: '612345678',
      address: 'Calle Mayor 1',
    });

    await candidate.save();

    expect(prismaMock.candidate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        phone: '612345678',
        address: 'Calle Mayor 1',
      }),
    });
  });
});

describe('Education', () => {
  test('save creates when id is absent', async () => {
    prismaMock.education.create.mockResolvedValue({ id: 1 } as never);

    const edu = new Education({
      institution: 'Uni',
      title: 'Title',
      startDate: '2020-01-01',
      candidateId: 1,
    });

    await edu.save();

    expect(prismaMock.education.create).toHaveBeenCalled();
    expect(prismaMock.education.update).not.toHaveBeenCalled();
  });

  test('save creates without candidateId when not set', async () => {
    prismaMock.education.create.mockResolvedValue({ id: 3 } as never);

    const edu = new Education({
      institution: 'Uni',
      title: 'Title',
      startDate: '2020-01-01',
    });

    await edu.save();

    const { data } = prismaMock.education.create.mock.calls[0][0];
    expect(data).not.toHaveProperty('candidateId');
  });

  test('save updates when id is present', async () => {
    prismaMock.education.update.mockResolvedValue({ id: 9 } as never);

    const edu = new Education({
      id: 9,
      institution: 'Uni',
      title: 'Title',
      startDate: '2020-01-01',
      candidateId: 1,
    });

    await edu.save();

    expect(prismaMock.education.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 9 } }),
    );
  });
});

describe('WorkExperience', () => {
  test('constructor maps endDate when provided and omits when absent', () => {
    const withEnd = new WorkExperience({
      company: 'ACME',
      position: 'Dev',
      startDate: '2020-01-01',
      endDate: '2021-01-01',
    });
    const withoutEnd = new WorkExperience({
      company: 'ACME',
      position: 'Dev',
      startDate: '2020-01-01',
    });

    expect(withEnd.endDate).toBeInstanceOf(Date);
    expect(withoutEnd.endDate).toBeUndefined();
  });

  test('save creates when id is absent', async () => {
    prismaMock.workExperience.create.mockResolvedValue({ id: 1 } as never);

    const wx = new WorkExperience({
      company: 'Co',
      position: 'Role',
      startDate: '2020-01-01',
      candidateId: 1,
    });

    await wx.save();

    expect(prismaMock.workExperience.create).toHaveBeenCalled();
  });

  test('save creates without candidateId in payload when not set', async () => {
    prismaMock.workExperience.create.mockResolvedValue({ id: 2 } as never);

    const wx = new WorkExperience({
      company: 'Co',
      position: 'Role',
      startDate: '2020-01-01',
    });

    await wx.save();

    const { data } = prismaMock.workExperience.create.mock.calls[0][0];
    expect(data).not.toHaveProperty('candidateId');
  });

  test('save updates when id is present', async () => {
    prismaMock.workExperience.update.mockResolvedValue({ id: 4 } as never);

    const wx = new WorkExperience({
      id: 4,
      company: 'Co',
      position: 'Role',
      startDate: '2020-01-01',
      candidateId: 1,
    });

    await wx.save();

    expect(prismaMock.workExperience.update).toHaveBeenCalled();
  });
});

describe('Resume', () => {
  test('constructor tolerates minimal data object', () => {
    const resume = new Resume({});

    expect(resume.filePath).toBeUndefined();
    expect(resume.fileType).toBeUndefined();
  });

  test('constructor handles nullish data for optional chaining', () => {
    const resume = new Resume(null as never);

    expect(resume.id).toBeUndefined();
    expect(resume.candidateId).toBeUndefined();
  });

  test('constructor copies provided identifiers and paths', () => {
    const resume = new Resume({
      id: 9,
      candidateId: 2,
      filePath: '/doc.pdf',
      fileType: 'application/pdf',
    });

    expect(resume.id).toBe(9);
    expect(resume.candidateId).toBe(2);
    expect(resume.filePath).toBe('/doc.pdf');
    expect(resume.fileType).toBe('application/pdf');
  });

  test('save delegates to create when id is absent', async () => {
    const created = {
      id: 1,
      candidateId: 1,
      filePath: '/a.pdf',
      fileType: 'application/pdf',
      uploadDate: new Date(),
    };
    prismaMock.resume.create.mockResolvedValue(created as never);

    const resume = new Resume({ filePath: '/a.pdf', fileType: 'application/pdf', candidateId: 1 });
    const result = await resume.save();

    expect(prismaMock.resume.create).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Resume);
  });

  test('save rejects when resume id is already set', async () => {
    const resume = new Resume({
      id: 1,
      candidateId: 1,
      filePath: '/a.pdf',
      fileType: 'application/pdf',
    });

    await expect(resume.save()).rejects.toThrow('No se permite la actualización');
    expect(prismaMock.resume.create).not.toHaveBeenCalled();
  });
});
