export interface Moment {
    id: number;
    user_id: string;
    content: string;
    images: string[];
    likes: string[];
    comments: any[];
    created_at: string;
    display_name?: string;
    avatar_url?: string;
}

export const momentsApi = {
    async getMoments(token: string) {
        const response = await fetch('/api/moments', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch moments');
        return response.json();
    },

    async createMoment(content: string, token: string) {
        const response = await fetch('/api/moments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        if (!response.ok) throw new Error('Failed to create moment');
        return response.json();
    }
};
