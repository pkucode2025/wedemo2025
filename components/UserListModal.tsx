import React from 'react';
import { X } from 'lucide-react';
import FollowButton from './FollowButton';

interface User {
    userId: string;
    username: string;
    displayName: string;
    avatar: string;
    bio?: string;
}

interface UserListModalProps {
    title: string;
    users: User[];
    onClose: () => void;
}

const UserListModal: React.FC<UserListModalProps> = ({ title, users, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1E1E1E] w-full max-w-md max-h-[80vh] rounded-2xl flex flex-col overflow-hidden border border-white/10 shadow-2xl relative">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-white font-medium text-lg">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {users.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            暂无用户
                        </div>
                    ) : (
                        users.map((user) => (
                            <div key={user.userId} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={user.avatar}
                                        alt={user.displayName}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div>
                                        <h3 className="text-white font-medium text-sm">{user.displayName}</h3>
                                        {user.bio && (
                                            <p className="text-gray-400 text-xs line-clamp-1">{user.bio}</p>
                                        )}
                                    </div>
                                </div>
                                <FollowButton userId={user.userId} />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserListModal;
