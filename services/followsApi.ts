export interface User {
    userId: string;
    username: string;
    displayName: string;
    avatar: string;
}

export const followsApi = {
    // 关注用户
    async followUser(userId: string, token: string) {
        const response = await fetch(`/api/follows/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to follow user');
        }
        return response.json();
    },

    // 取消关注
    async unfollowUser(userId: string, token: string) {
        const response = await fetch(`/api/follows/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to unfollow user');
        return response.json();
    },

    // 检查是否关注某用户
    async checkFollowing(userId: string, token: string): Promise<boolean> {
        const response = await fetch(`/api/follows/check/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to check follow status');
        const data = await response.json();
        return data.isFollowing;
    },

    // 获取关注列表
    async getFollowing(token: string): Promise<User[]> {
        const response = await fetch('/api/follows/following', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch following');
        const data = await response.json();
        return data.following;
    },

    // 获取粉丝列表
    async getFollowers(token: string): Promise<User[]> {
        const response = await fetch('/api/follows/followers', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch followers');
        const data = await response.json();
        return data.followers;
    }
};
