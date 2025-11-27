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

                {/* Scrollable User List */}
                <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[60vh]">
                    {users.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">No users</div>
                    ) : (
                        <div className="space-y-3">
                            {users.map(user => (
                                <div
                                    key={user.userId}
                                    className="flex items-center p-3 bg-[#2A2A2A] rounded-xl hover:bg-[#333333] transition-colors"
                                >
                                    <img
                                        src={user.avatar}
                                        className="w-12 h-12 rounded-full object-cover mr-3 border-2 border-[#121212]"
                                        alt={user.displayName}
                                    />
                                    <div className="flex-1">
                                        <h4 className="text-white font-medium">{user.displayName}</h4>
                                        <p className="text-gray-500 text-sm">@{user.username}</p>
                                    </div>
                                    <FollowButton userId={user.userId} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserListModal;
