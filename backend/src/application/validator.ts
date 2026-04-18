const NAME_REGEX = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(6|7|9)\d{8}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** YYYY-MM-DD; returns UTC midnight time or null if malformed / invalid calendar day */
const parseYmdToUtc = (raw: string): number | null => {
    const s = raw.trim();
    if (!s || !DATE_REGEX.test(s)) {
        return null;
    }
    const y = parseInt(s.slice(0, 4), 10);
    const m = parseInt(s.slice(5, 7), 10);
    const d = parseInt(s.slice(8, 10), 10);
    if (m < 1 || m > 12 || d < 1 || d > 31) {
        return null;
    }
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
        return null;
    }
    return dt.getTime();
};

//Length validations according to the database schema

const validateName = (name: string) => {
    if (!name || name.length < 2 || name.length > 100 || !NAME_REGEX.test(name)) {
        throw new Error('Invalid name');
    }
};

const validateEmail = (email: string) => {
    if (!email || !EMAIL_REGEX.test(email)) {
        throw new Error('Invalid email');
    }
};

const validatePhone = (phone: string) => {
    if (phone && !PHONE_REGEX.test(phone)) {
        throw new Error('Invalid phone');
    }
};

const validateAddress = (address: string) => {
    if (address && address.length > 100) {
        throw new Error('Invalid address');
    }
};

const validateEducation = (education: any) => {
    if (!education.institution || education.institution.length > 100) {
        throw new Error('Invalid institution');
    }

    if (!education.title || education.title.length > 100) {
        throw new Error('Invalid title');
    }

    const startT = parseYmdToUtc(String(education.startDate ?? ''));
    if (startT === null) {
        throw new Error('Invalid date');
    }

    const endStr = education.endDate != null ? String(education.endDate).trim() : '';
    if (endStr) {
        const endT = parseYmdToUtc(endStr);
        if (endT === null) {
            throw new Error('Invalid end date');
        }
        if (endT < startT) {
            throw new Error('Invalid end date');
        }
    }
};

const validateExperience = (experience: any) => {
    if (!experience.company || experience.company.length > 100) {
        throw new Error('Invalid company');
    }

    if (!experience.position || experience.position.length > 100) {
        throw new Error('Invalid position');
    }

    if (experience.description && experience.description.length > 200) {
        throw new Error('Invalid description');
    }

    const startT = parseYmdToUtc(String(experience.startDate ?? ''));
    if (startT === null) {
        throw new Error('Invalid date');
    }

    const endStr = experience.endDate != null ? String(experience.endDate).trim() : '';
    if (endStr) {
        const endT = parseYmdToUtc(endStr);
        if (endT === null) {
            throw new Error('Invalid end date');
        }
        if (endT < startT) {
            throw new Error('Invalid end date');
        }
    }
};

const validateCV = (cv: any) => {
    if (typeof cv !== 'object' || !cv.filePath || typeof cv.filePath !== 'string' || !cv.fileType || typeof cv.fileType !== 'string') {
        throw new Error('Invalid CV data');
    }
};

export const validateCandidateData = (data: any) => {
    if (data.id) {
        // If id is provided, we are editing an existing candidate, so fields are not mandatory
        return;
    }

    validateName(data.firstName); 
    validateName(data.lastName); 
    validateEmail(data.email);
    validatePhone(data.phone);
    validateAddress(data.address);

    if (data.educations) {
        for (const education of data.educations) {
            validateEducation(education);
        }
    }

    if (data.workExperiences) {
        for (const experience of data.workExperiences) {
            validateExperience(experience);
        }
    }

    if (data.cv && Object.keys(data.cv).length > 0) {
        validateCV(data.cv);
    }
};