export const validateRoleName = (value: string): boolean => {
    const regex = /^[a-zA-Z_\-\s]*$/;
    return regex.test(value) && value.length <= 150;
};

export const validateForumName = (value: string): boolean => {
    const regex = /^[a-zA-Z_\-\s]*$/;
    return regex.test(value) && value.length <= 200;
};

export const validateFileUpload = (files: File[]): boolean => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    const maxTotalSize = 20 * 1024 * 1024;
    let totalSize = 0;

    for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
            return false;
        }
        totalSize += file.size;
    }

    return totalSize <= maxTotalSize;
};

export const validateSummaryInput = (value: string): boolean => {
    return value.length <= 1000;
};

export const validateCommentsInput = (value: string): boolean => {
    return value.length <= 250;
};

export const validateDateSelection = (startDate: string, endDate: string): boolean => {
    const today = new Date();
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])(0[1-9]|1[0-2])([0-9]{4})$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return false;
    }
    const start = new Date(
        `${startDate.slice(4, 8)}-${startDate.slice(2, 4)}-${startDate.slice(0, 2)}`,
    );
    const end = new Date(`${endDate.slice(4, 8)}-${endDate.slice(2, 4)}-${endDate.slice(0, 2)}`);
    return start >= today && end > start;
};

export const validateSearchInput = (input: string, maxLength: number = 150): string => {
    return input
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .slice(0, maxLength)
        .trim();
};

export const handleKeyDownValidation = (
    event: React.KeyboardEvent<HTMLInputElement>,
    maxLength: number = 150,
): void => {
    const inputElement = event.target as HTMLInputElement;

    if (!/^[a-zA-Z0-9\s_-]$/.test(event.key) && event.key.length === 1) {
        event.preventDefault();
    }

    if (inputElement.value.length >= maxLength && event.key.length === 1) {
        event.preventDefault();
    }
};

export const validateStringSearchInput = (input: string, maxLength: number = 150): string => {
    return input
        .replace(/[^a-zA-Z0-9\s_&-]/g, '')
        .slice(0, maxLength)
        .trim();
};

export const searchStringValidation = (
    event: React.KeyboardEvent<HTMLInputElement>,
    maxLength: number = 150,
): void => {
    const inputElement = event.target as HTMLInputElement;

    if (!/^[a-zA-Z0-9\s_&-]$/.test(event.key) && event.key.length === 1) {
        event.preventDefault();
    }

    if (inputElement.value.length >= maxLength && event.key.length === 1) {
        event.preventDefault();
    }
};

export const validateIssueTitleInput = (input: string, maxLength: number = 150): string => {
    return input.replace(/[^a-zA-Z\s_-]/g, '').slice(0, maxLength);
};

// Normalize HTML-encoded URLs (e.g., &amp;)
const normalizeUrl = (url: string): string => {
    return url.replace(/&amp;/g, '&');
};

export const validateUrl = (url: string): boolean => {
    try {
        const normalized = normalizeUrl(url.trim());
        const parsed = new URL(normalized);

        // Only allow http / https URLs
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};
