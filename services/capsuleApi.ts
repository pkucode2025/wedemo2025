export interface Capsule {
    id: number;
    sender_id: string;
    receiver_id: string;
    content: string;
    media_url?: string;
    unlock_at: string;
    is_opened: boolean;
    created_at: string;
    sender_name?: string;
    sender_avatar?: string;
}

export const capsuleApi = {
    async getCapsules(token: string) {
        const response = await fetch('/api/capsules', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch capsules');
        const data = await response.json();
        return data.capsules;
    },

    async createCapsule(token: string, data: { receiverId: string; content: string; mediaUrl?: string; unlockAt: string }) {
        const response = await fetch('/api/capsules', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create capsule');
        return response.json();
    },

    async openCapsule(token: string, capsuleId: number) {
        const response = await fetch('/api/capsules', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ capsuleId })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to open capsule');
        }
        return response.json();
    }
};
