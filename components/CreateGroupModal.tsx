import React, { useState, useEffect } from 'react';
import { X, Check, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Contact {
    userId: string;
    name: string;
    avatar: string;
}

interface CreateGroupModalProps {
    onClose: () => void;
    onCreate: (groupName: string, memberIds: string[]) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreate }) => {
    const { token, user } = useAuth();
    const [step, setStep] = useState<'select' | 'name'>('select');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/friends', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Map friends to Contact interface
                const friends = data.friends.map((f: any) => ({
                    userId: f.friendId,
                    name: f.friendName,
                    avatar: f.friendAvatar
                }));
                setContacts(friends);
            }
        } catch (error) {
            console.error('Failed to load contacts', error);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleNext = () => {
        if (selectedIds.length === 0) return;
        setStep('name');
    };

    const handleSubmit = () => {
        if (!groupName.trim()) return;
        onCreate(groupName, selectedIds);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1E1E1E] w-full max-w-md rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#252525]">
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-bold text-white">
                        {step === 'select' ? 'Select Members' : 'Group Name'}
                    </h2>
                    <div className="w-6" /> {/* Spacer */}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {step === 'select' ? (
                        <div className="space-y-2">
                            {contacts.map(contact => (
                                <div
                                    key={contact.userId}
                                    onClick={() => toggleSelection(contact.userId)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedIds.includes(contact.userId) ? 'bg-[#FF00FF]/20 border border-[#FF00FF]/50' : 'bg-[#2A2A2A] border border-transparent hover:bg-[#333]'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedIds.includes(contact.userId) ? 'bg-[#FF00FF] border-[#FF00FF]' : 'border-gray-500'}`}>
                                        {selectedIds.includes(contact.userId) && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <img src={contact.avatar} className="w-10 h-10 rounded-full bg-gray-700" />
                                    <span className="text-white font-medium">{contact.name}</span>
                                </div>
                            ))}
                            {contacts.length === 0 && (
                                <div className="text-center text-gray-500 py-8">No contacts found</div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 py-8">
                            <div className="flex justify-center">
                                <div className="w-24 h-24 bg-[#2A2A2A] rounded-full flex items-center justify-center border-2 border-dashed border-gray-600">
                                    <span className="text-xs text-gray-500">Group Icon</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-2 uppercase">Group Name</label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={e => setGroupName(e.target.value)}
                                    className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF00FF]"
                                    placeholder="Enter group name..."
                                    autoFocus
                                />
                            </div>
                            <div className="text-sm text-gray-400 text-center">
                                {selectedIds.length} members selected
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-[#252525]">
                    {step === 'select' ? (
                        <button
                            onClick={handleNext}
                            disabled={selectedIds.length === 0}
                            className="w-full bg-[#FF00FF] text-white py-3 rounded-xl font-medium hover:bg-[#D900D9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next ({selectedIds.length})
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!groupName.trim()}
                            className="w-full bg-[#FF00FF] text-white py-3 rounded-xl font-medium hover:bg-[#D900D9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Create Group
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
