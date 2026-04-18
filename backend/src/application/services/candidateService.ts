import { Candidate } from '../../domain/models/Candidate';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';
import { prisma } from '../../infrastructure/prisma';
import { validateCandidateData } from '../validator';

export const addCandidate = async (candidateData: any) => {
    try {
        validateCandidateData(candidateData); // Validar los datos del candidato
    } catch (error: any) {
        throw new Error(error);
    }

    const candidate = new Candidate(candidateData); // Crear una instancia del modelo Candidate
    try {
        return await prisma.$transaction(async (tx) => {
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
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            // Unique constraint failed on the fields: (`email`)
            throw new Error('The email already exists in the database');
        } else {
            throw error;
        }
    }
};