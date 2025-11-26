/**
 * Image Service - Handle image conversions and validations
 */

export const imageService = {
    /**
     * Convert File to base64 string
     */
    convertToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new Error('Failed to convert to base64'));
                }
            };
            reader.onerror = (error) => reject(error);
        });
    },

    /**
     * Validate image file
     * @param file File to validate
     * @param maxSizeMB Maximum file size in MB (default: 5MB)
     */
    validateImage(file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } {
        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return { valid: false, error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.' };
        }

        // Check file size
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
        }

        return { valid: true };
    },

    /**
     * Convert multiple files to base64
     */
    async convertMultipleToBase64(files: File[]): Promise<string[]> {
        const promises = files.map(file => this.convertToBase64(file));
        return Promise.all(promises);
    },

    /**
     * Resize image before upload (optional utility)
     */
    async resizeImage(file: File, maxWidth: number = 1200, maxHeight: number = 1200): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > height) {
                        if (width > maxWidth) {
                            height = height * (maxWidth / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = width * (maxHeight / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL(file.type));
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }
};
