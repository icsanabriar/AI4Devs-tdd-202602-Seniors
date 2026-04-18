import { prisma } from '../../infrastructure/prisma';
import type { PrismaForWrites } from '../../infrastructure/prismaTypes';

export class Education {
    id?: number;
    institution: string;
    title: string;
    startDate: Date;
    endDate?: Date;
    candidateId?: number;

    constructor(data: any) {
        this.id = data.id;
        this.institution = data.institution;
        this.title = data.title;
        this.startDate = new Date(data.startDate);
        this.endDate = data.endDate ? new Date(data.endDate) : undefined;
        this.candidateId = data.candidateId;
    }

    async save(executor: PrismaForWrites = prisma) {
        const educationData: any = {
            institution: this.institution,
            title: this.title,
            startDate: this.startDate,
            endDate: this.endDate,
        };

        if (this.candidateId !== undefined) {
            educationData.candidateId = this.candidateId;
        }

        if (this.id) {
            // Actualizar una experiencia laboral existente
            return await executor.education.update({
                where: { id: this.id },
                data: educationData
            });
        } else {
            // Crear una nueva experiencia laboral
            return await executor.education.create({
                data: educationData
            });
        }
    }
}
