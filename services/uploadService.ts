import axios from 'axios';

/**
 * Service for uploading media files (images, voice recordings).
 * Files are sent to the backend `/api/upload` endpoint using multipart/form-data.
 */
export const uploadService = {
    /**
     * Upload a single file.
     * @param file The File object to upload.
     * @param token Auth token for the request.
     * @returns The URL of the uploaded file as returned by the server.
     */
    async uploadFile(file: File, token: string): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        const data = await response.json();
        return data.url; // server should return { url: '...' }
    },
};
