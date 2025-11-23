export interface Moment {
    id: number;
    user_id: string;
    display_name: string;
    avatar_url: string;
    content: string;
    images: string[];
    likes: string[]; // Array of userIds
    comments: Comment[];
    created_at: string;
}

export interface Comment {
    id: string;
    userId: string;
    content: string;
    createdAt: string;
    user?: {
        displayName: string;
        avatar: string;
    };
}

export const momentsApi = {
    // 获取朋友圈列表
    async getMoments(token: string) {
        const response = await fetch('/api/moments', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch moments');
        const data = await response.json();
        return data.moments;
    },

    // 发布朋友圈
    async createMoment(content: string, images: string[], token: string) {
        const response = await fetch('/api/moments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content, images })
        });
        if (!response.ok) throw new Error('Failed to create moment');
        return response.json();
    },

    // 点赞/取消点赞
    async toggleLike(momentId: number, token: string) {
        const response = await fetch(`/api/moments/${momentId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to toggle like');
        return response.json();
    },

    // 评论
    async addComment(momentId: number, content: string, token: string) {
        const response = await fetch(`/api/moments/${momentId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        if (!response.ok) throw new Error('Failed to add comment');
        return response.json();
    }
};
