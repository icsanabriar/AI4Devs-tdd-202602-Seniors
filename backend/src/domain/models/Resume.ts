import { prisma } from '../../infrastructure/prisma';
import type { PrismaForWrites } from '../../infrastructure/prismaTypes';

export class Resume {
    id: number;
    candidateId: number;
    filePath: string;
    fileType: string;
    uploadDate: Date;

    constructor(data: any) {
        this.id = data?.id;
        this.candidateId = data?.candidateId;
        this.filePath = data?.filePath;
        this.fileType = data?.fileType;
        this.uploadDate = new Date();
    }

    async save(executor: PrismaForWrites = prisma): Promise<Resume> {
        if (!this.id) {
            return await this.create(executor);
        }
        throw new Error('No se permite la actualización de un currículum existente.');
    }

    async create(executor: PrismaForWrites = prisma): Promise<Resume> {
        const createdResume = await executor.resume.create({
            data: {
                candidateId: this.candidateId,
                filePath: this.filePath,
                fileType: this.fileType,
                uploadDate: this.uploadDate
            },
        });
        return new Resume(createdResume);
    }
}