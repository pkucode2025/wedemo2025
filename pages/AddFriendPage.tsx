import React, { useState } from 'react';
import { ChevronLeft, Search, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { friendsApi } from '../services/friendsApi';

interface AddFriendPageProps {
    onClose: () => void;
    onFriendAdded: () => void;
}

const AddFriendPage: React.FC<AddFriendPageProps> = ({ onClose, onFriendAdded }) => {
    const { token } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [requestMessage, setRequestMessage] = useState('');
    const [showRequestDialog, setShowRequestDialog] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm.trim() || !token) return;

        setLoading(true);
        setError('');
        setSearchResult(null);

        try {
            const result = await friendsApi.searchUsers(searchTerm, token);
            setSearchResult(result.user);
        } catch (err: any) {
            setError(err.message || '搜索失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async () => {
        if (!searchResult || !token) return;

        setLoading(true);
        try {
            await fetch('/api/friends/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    toUserId: searchResult.userId,
                    message: requestMessage
                })
            });
            alert('好友申请已发送');
            setShowRequestDialog(false);
            onClose();
        } catch (err: any) {
            alert('发送失败: ' + err.message);
        } finally {
            setLoading(false);
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
                <span className="text-[17px] font-medium w-full text-center">添加朋友</span>
            </div>

            {/* Search Bar */}
            <div className="p-4">
                <div className="bg-white rounded-md flex items-center px-3 h-10 mb-4">
                    <Search className="w-5 h-5 text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="微信号/手机号"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 text-[16px] outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                {searchTerm && (
                    <div
                        onClick={handleSearch}
                        className="bg-white p-4 rounded-md flex items-center cursor-pointer active:bg-gray-50"
                    >
                        <div className="w-10 h-10 bg-[#07C160] rounded-md flex items-center justify-center mr-3">
                            <Search className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[16px]">搜索: <span className="text-[#07C160]">{searchTerm}</span></span>
                    </div>
                )}
            </div>

            {/* Search Result */}
            {loading && <div className="text-center text-gray-500">搜索中...</div>}
            {error && <div className="text-center text-red-500">{error}</div>}

            {searchResult && !showRequestDialog && (
                <div className="bg-white mt-2 p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <img
                            src={searchResult.avatar}
                            className="w-12 h-12 rounded-md mr-3 object-cover"
                            alt={searchResult.displayName}
                        />
                        <div>
                            <h3 className="text-[16px] font-medium">{searchResult.displayName}</h3>
                            <p className="text-[14px] text-gray-500">微信号: {searchResult.username}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowRequestDialog(true)}
                        className="px-4 py-1.5 bg-[#07C160] text-white rounded-md font-medium"
                    >
                        添加到通讯录
                    </button>
                </div>
            )}

            {/* Request Dialog Overlay */}
            {showRequestDialog && (
                <div className="absolute inset-0 bg-white z-50 flex flex-col">
                    <div className="h-[50px] bg-[#EDEDED] border-b border-gray-300 flex items-center px-3 justify-between flex-shrink-0">
                        <button onClick={() => setShowRequestDialog(false)} className="text-[16px] text-black">取消</button>
                        <span className="text-[17px] font-medium">发送申请</span>
                        <button
                            onClick={handleSendRequest}
                            className="px-4 py-1.5 bg-[#07C160] text-white rounded-md text-[14px] font-medium"
                        >
                            发送
                        </button>
                    </div>
                    <div className="p-4 bg-[#EDEDED] flex-1">
                        <div className="mb-2 text-gray-500 text-sm">发送添加朋友申请</div>
                        <input
                            type="text"
                            value={requestMessage}
                            onChange={(e) => setRequestMessage(e.target.value)}
                            placeholder="我是..."
                            className="w-full p-3 rounded-md outline-none text-[16px]"
                            autoFocus
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddFriendPage;
