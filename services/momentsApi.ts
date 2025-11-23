export interface Comment {
    id: string;
    userId: string;
    displayName: string;
    content: string;
    createdAt: string;
}

export interface Moment {
    id: number;
    user_id: string;
    content: string;
    images: string[];
    likes: string[]; // List of userIds
    comments: Comment[];
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
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to fetch moments');
        }
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
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to create moment');
        }
        return response.json();
    },

    async likeMoment(momentId: number, token: string) {
        const response = await fetch('/api/moments/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ momentId })
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to like moment');
        }
        return response.json();
    },

    async commentMoment(momentId: number, content: string, token: string) {
        const response = await fetch('/api/moments/comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ momentId, content })
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to comment moment');
        }
        return response.json();
    }
};
