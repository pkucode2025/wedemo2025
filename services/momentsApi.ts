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
    type?: 'text' | 'image' | 'voice';
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

    // 搜索朋友圈
    async searchMoments(query: string, token: string) {
        const response = await fetch(`/api/moments?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to search moments');
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
    async addComment(momentId: number, content: string, token: string, type: 'text' | 'image' | 'voice' = 'text') {
        const response = await fetch(`/api/moments/${momentId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content, type })
        });
        if (!response.ok) throw new Error('Failed to add comment');
        return response.json();
    },

    // 获取点赞的动态
    async getLikedMoments(token: string) {
        const response = await fetch('/api/moments/liked', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch liked moments');
        const data = await response.json();
        return data.moments;
    },

    // 获取收藏的动态
    async getFavorites(token: string) {
        const response = await fetch('/api/moments/favorites', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch favorites');
        const data = await response.json();
        return data.moments;
    },

    // 切换收藏状态
    async toggleFavorite(momentId: number, token: string) {
        const response = await fetch(`/api/moments/${momentId}/favorite`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to toggle favorite');
        return response.json();
    }
};
