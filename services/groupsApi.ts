export const groupsApi = {
    // 创建群组
    async createGroup(name: string, memberIds: string[], token: string) {
        const response = await fetch('/api/groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ name, memberIds }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '创建群组失败');
        }

        return response.json();
    },

    // 获取我的群组
    async getMyGroups(token: string) {
        const response = await fetch('/api/groups', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('获取群组列表失败');
        }

        const data = await response.json();
        return data.groups;
    }
};
