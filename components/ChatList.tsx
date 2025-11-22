import React from 'react';
import { ChatSession, User } from '../types';
import { Search, PlusCircle } from 'lucide-react';

interface ChatListProps {
  sessions: ChatSession[];
  users: User[];
  onSelectChat: (sessionId: string) => void;
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString();
};

const ChatList: React.FC<ChatListProps> = ({ sessions, users, onSelectChat }) => {
  return (
    <div className="flex flex-col h-full bg-[#EDEDED]">
      {/* Header */}
      <div className="h-[50px] flex items-center justify-between px-4 bg-[#EDEDED] sticky top-0 z-10">
        <span className="font-medium text-lg">WeChat</span>
        <div className="flex space-x-4">
            <Search className="w-5 h-5 text-gray-800" />
            <PlusCircle className="w-5 h-5 text-gray-800" />
        </div>
      </div>

      {/* Search Bar (Visual Only) */}
      <div className="px-2 pb-2">
        <div className="bg-white rounded flex items-center justify-center h-8 text-gray-400 text-sm cursor-pointer">
          <Search className="w-4 h-4 mr-1" />
          Search
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {sessions.sort((a, b) => b.lastMessageTime - a.lastMessageTime).map(session => {
          const partner = users.find(u => u.id === session.partnerId);
          if (!partner) return null;

          return (
            <div 
              key={session.id} 
              onClick={() => onSelectChat(session.id)}
              className="flex items-center px-4 py-3 bg-[#EDEDED] active:bg-[#dcdcdc] border-b border-gray-300/50 cursor-pointer transition-colors"
            >
              <div className="relative">
                <img 
                  src={partner.avatar} 
                  alt={partner.name} 
                  className="w-12 h-12 rounded-[4px]" // WeChat square-ish rounded avatars
                />
                {session.unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border border-[#EDEDED]">
                    {session.unreadCount}
                  </span>
                )}
              </div>
              
              <div className="flex-1 ml-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-base text-gray-900">{partner.name}</h3>
                  <span className="text-xs text-gray-400">{formatTime(session.lastMessageTime)}</span>
                </div>
                <p className="text-sm text-gray-500 truncate w-64 mt-0.5">{session.lastMessage}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;