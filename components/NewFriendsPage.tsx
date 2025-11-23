import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FriendRequest {
    id: number;
    from_user_id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    message: string;
    status: string;
}

interface NewFriendsPageProps {
    onClose: () => void;
}

const NewFriendsPage: React.FC<NewFriendsPageProps> = ({ onClose }) => {
    const { token } = useAuth();
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRequests = async () => {
        if (!token) return;
        try {
            const response = await fetch('/api/friends/requests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setRequests(data.requests || []);
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleAccept = async (request: FriendRequest) => {
        if (!token) return;
        try {
            await fetch('/api/friends/accept', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    requestId: request.id,
                    fromUserId: request.from_user_id
                })
            });
            // Remove from list or mark as accepted
            setRequests(prev => prev.filter(r => r.id !== request.id));
            alert('已添加好友');
        } catch (error) {
            console.error('Failed to accept:', error);
            alert('操作失败');
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-[#EDEDED] flex flex-col">
            {/* Header */}
            <div className="h-[50px] bg-[#EDEDED] border-b border-gray-300 flex items-center px-3 relative flex-shrink-0">
                <button onClick={onClose} className="flex items-center text-black absolute left-3">
                    <ChevronLeft className="w-6 h-6" strokeWidth={2} />
                    <span className="text-[16px]">通讯录</span>
                </button>
                <span className="text-[17px] font-medium w-full text-center">新的朋友</span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">加载中...</div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">暂无新朋友请求</div>
                ) : (
                    <div className="bg-white mt-2">
                        {requests.map(req => (
                            <div key={req.id} className="flex items-center p-4 border-b border-gray-100 last:border-0">
                                <img
                                    src={req.avatar_url}
                                    className="w-12 h-12 rounded-md object-cover mr-3"
                                    alt={req.display_name}
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-[16px] font-medium text-black truncate">{req.display_name}</h3>
                                    <p className="text-[14px] text-gray-500 truncate">{req.message}</p>
                                </div>
                                <button
                                    onClick={() => handleAccept(req)}
                                    className="ml-3 px-4 py-1.5 bg-[#07C160] text-white text-[14px] rounded-md font-medium active:bg-[#06AD56]"
                                >
                                    接受
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewFriendsPage;
