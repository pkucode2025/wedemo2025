import React from 'react';
import { ChatSession } from '../types';
import { Plus, Search } from 'lucide-react';
import GlobalRefreshButton from './GlobalRefreshButton';

interface PartnerInfo {
  userId: string;
  name: string;
  avatar: string;
}

interface ChatListProps {
  sessions: ChatSession[];
  partners: Record<string, PartnerInfo>;
  onSelectChat: (sessionId: string) => void;
  onRefresh?: () => Promise<void>;
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < oneDay && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  if (diff < 2 * oneDay && (now.getDate() - date.getDate()) === 1) {
    return 'Yesterday';
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const ChatList: React.FC<ChatListProps> = ({ sessions, partners, onSelectChat, onRefresh }) => {

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white">
      {/* Modern Header */}
      <div className="h-[80px] flex items-end justify-between px-6 pb-4 bg-transparent flex-shrink-0 z-20 relative">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF00FF] to-[#8A2BE2]">
          Messages
        </h1>
        <div className="flex items-center space-x-4 mb-1">
          {onRefresh && <GlobalRefreshButton onRefresh={onRefresh} />}
          <div className="w-10 h-10 rounded-full bg-[#1E1E1E] flex items-center justify-center border border-white/10 shadow-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors">
            <Plus className="w-5 h-5 text-[#FF00FF]" />
          </div>
        </div>
      </div>

      {/* Search Bar Placeholder */}
      <div className="px-6 py-2 mb-2">
        <div className="w-full h-10 bg-[#1E1E1E] rounded-xl flex items-center px-4 border border-white/5">
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <span className="text-gray-500 text-sm">Search conversations...</span>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 no-scrollbar">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60%] text-gray-600">
            <div className="w-16 h-16 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-4">
              <span className="text-2xl">💤</span>
            </div>
            <p>No messages yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions
              .sort((a, b) => b.lastMessageTime - a.lastMessageTime)
              .map(session => {
                const partner = partners[session.partnerId];
                if (!partner) return null;

                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectChat(session.id)}
                    className="group relative flex items-center p-4 bg-[#1E1E1E] rounded-2xl cursor-pointer transition-all duration-300 hover:bg-[#252525] hover:scale-[1.02] border border-white/5 hover:border-[#FF00FF]/30 hover:shadow-[0_0_15px_rgba(255,0,255,0.1)]"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#FF00FF] to-[#8A2BE2]">
                        <img
                          src={partner.avatar}
                          alt={partner.name}
                          className="w-full h-full rounded-full object-cover border-2 border-[#121212]"
                        />
                      </div>
                      {session.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#FF00FF] text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 shadow-[0_0_8px_#FF00FF] border-2 border-[#121212]">
                          {session.unreadCount > 99 ? '99+' : session.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 ml-4 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-[16px] text-white truncate group-hover:text-[#FF00FF] transition-colors">{partner.name}</h3>
                        <span className="text-[12px] text-gray-500 ml-2 flex-shrink-0 font-medium">{formatTime(session.lastMessageTime)}</span>
                      </div>
                      <p className="text-[14px] text-gray-400 truncate leading-tight group-hover:text-gray-300">
                        {session.lastMessage || 'Start a conversation'}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
