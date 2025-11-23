import React, { useState, useEffect } from 'react';
import { ChevronLeft, Camera, MessageSquare, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { momentsApi, Moment } from '../services/momentsApi';
import GlobalRefreshButton from './GlobalRefreshButton';

interface MomentsViewProps {
    onBack: () => void;
    onCreateMoment: () => void;
    onRefresh?: () => Promise<void>;
}

const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const MomentsView: React.FC<MomentsViewProps> = ({ onBack, onCreateMoment, onRefresh }) => {
    const { user, token } = useAuth();
    const [moments, setMoments] = useState<Moment[]>([]);
    const [loading, setLoading] = useState(true);

    const loadMoments = async () => {
        if (!token) return;
        try {
            const data = await momentsApi.getMoments(token);
            setMoments(data.moments);
        } catch (error) {
            console.error('Failed to load moments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMoments();
    }, []);

    const handleRefresh = async () => {
        await loadMoments();
        if (onRefresh) await onRefresh();
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="h-[50px] bg-[#EDEDED] border-b border-gray-300 flex items-center px-3 justify-between flex-shrink-0 z-10">
                <button onClick={onBack} className="flex items-center text-black">
                    <ChevronLeft className="w-6 h-6" strokeWidth={2} />
                    <span className="text-[16px]">发现</span>
                </button>
                <span className="text-[17px] font-medium">朋友圈</span>
                <div className="flex items-center gap-3">
                    <GlobalRefreshButton onRefresh={handleRefresh} />
                    <button onClick={onCreateMoment}>
                        <Camera className="w-6 h-6 text-black" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Cover Image */}
                <div className="relative h-[300px] bg-gray-800 mb-10">
                    <img
                        src="https://picsum.photos/id/1018/800/600"
                        className="w-full h-full object-cover opacity-80"
                        alt="Cover"
                    />
                    {/* User Info */}
                    <div className="absolute bottom-[-30px] right-4 flex items-end">
                        <span className="text-white font-medium text-lg mr-3 mb-8 shadow-sm">{user?.displayName}</span>
                        <img
                            src={user?.avatar}
                            className="w-[70px] h-[70px] rounded-md border-2 border-white bg-white object-cover"
                            alt="Avatar"
                        />
                    </div>
                </div>

                {/* Moments List */}
                <div className="px-4 pb-10 space-y-8">
                    {moments.map(moment => (
                        <div key={moment.id} className="flex gap-3 border-b border-gray-100 pb-6 last:border-0">
                            <img
                                src={moment.avatar_url}
                                className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                                alt="Avatar"
                            />
                            <div className="flex-1">
                                <h3 className="text-[#576B95] font-medium text-[16px] mb-1">{moment.display_name}</h3>
                                <p className="text-[16px] text-gray-900 mb-2 leading-relaxed">{moment.content}</p>

                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-400">{formatTime(moment.created_at)}</span>
                                    <div className="flex items-center gap-4 bg-[#F7F7F7] px-2 py-1 rounded">
                                        <button className="p-1"><Heart className="w-4 h-4 text-[#576B95]" /></button>
                                        <button className="p-1"><MessageSquare className="w-4 h-4 text-[#576B95]" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {moments.length === 0 && !loading && (
                        <div className="text-center text-gray-400 py-10">
                            暂无朋友圈，快去发布第一条吧！
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MomentsView;
