import { Prisma } from '@prisma/client';
import { Candidate } from '../../domain/models/Candidate';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';
import { prisma } from '../../infrastructure/prisma';
import { validateCandidateData } from '../validator';

const CANDIDATE_TX_OPTIONS: {
    maxWait: number;
    timeout: number;
} = { maxWait: 10_000, timeout: 120_000 };

const prismaKnownCode = (error: unknown): string | undefined => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return error.code;
    }
    if (error && typeof error === 'object' && 'code' in error) {
        const c = (error as { code?: string }).code;
        return typeof c === 'string' ? c : undefined;
    }
    return undefined;
};

export const addCandidate = async (candidateData: any) => {
    try {
        validateCandidateData(candidateData); // Validar los datos del candidato
    } catch (error: any) {
        throw new Error(error);
    }

    const candidate = new Candidate(candidateData); // Crear una instancia del modelo Candidate
    try {
        return await prisma.$transaction(
            async (tx) => {
                const savedCandidate = await candidate.save(tx);
                const candidateId = savedCandidate.id;

                if (candidateData.educations) {
                    for (const education of candidateData.educations) {
                        const educationModel = new Education(education);
                        educationModel.candidateId = candidateId;
                        await educationModel.save(tx);
                        candidate.education.push(educationModel);
                    }
                }

                if (candidateData.workExperiences) {
                    for (const experience of candidateData.workExperiences) {
                        const experienceModel = new WorkExperience(experience);
                        experienceModel.candidateId = candidateId;
                        await experienceModel.save(tx);
                        candidate.workExperience.push(experienceModel);
                    }
                }

                if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
                    const resumeModel = new Resume(candidateData.cv);
                    resumeModel.candidateId = candidateId;
                    await resumeModel.save(tx);
                    candidate.resumes.push(resumeModel);
                }
                return savedCandidate;
            },
            CANDIDATE_TX_OPTIONS,
        );
    } catch (error: unknown) {
        const code = prismaKnownCode(error);
        if (code === 'P2002') {
            throw new Error('The email already exists in the database');
        }
        if (code === 'P2028') {
            throw new Error(
                'The database took too long to complete this operation, or the transaction was already closed. Please try again in a few moments.',
            );
        }
        throw error;
    }
};