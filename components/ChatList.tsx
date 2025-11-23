import React from 'react';
import { ChatSession } from '../types';
import { Search, PlusCircle } from 'lucide-react';
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
    return '昨天';
  }

  if (diff < 7 * oneDay) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const ChatList: React.FC<ChatListProps> = ({ sessions, partners, onSelectChat, onRefresh }) => {
  return (
    <div className="flex flex-col h-full bg-[#EDEDED]">
      {/* Header */}
      <div className="h-[50px] flex items-center justify-between px-4 bg-[#EDEDED] border-b border-gray-300/30 flex-shrink-0">
        <span className="font-medium text-lg">微信</span>
        <div className="flex items-center space-x-3">
          {onRefresh && <GlobalRefreshButton onRefresh={onRefresh} />}
          <Search className="w-5 h-5 text-gray-800 cursor-pointer" />
          <PlusCircle className="w-5 h-5 text-gray-800 cursor-pointer" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 bg-[#EDEDED] flex-shrink-0">
        <div className="bg-white rounded-md flex items-center justify-center h-9 text-gray-400 text-sm cursor-pointer">
          <Search className="w-4 h-4 mr-1" />
          搜索
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            暂无聊天
          </div>
        ) : (
          sessions
            .sort((a, b) => b.lastMessageTime - a.lastMessageTime)
            .map(session => {
              const partner = partners[session.partnerId];
              if (!partner) return null;

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectChat(session.id)}
                  className="flex items-center px-4 py-3 bg-white active:bg-gray-100 border-b border-gray-200/50 cursor-pointer transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={partner.avatar}
                      alt={partner.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                    {session.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5">
                        {session.unreadCount > 99 ? '99+' : session.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 ml-3 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-medium text-[17px] text-gray-900 truncate">{partner.name}</h3>
                      <span className="text-[13px] text-gray-400 ml-2 flex-shrink-0">{formatTime(session.lastMessageTime)}</span>
                    </div>
                    <p className="text-[15px] text-gray-500 truncate leading-tight">
                      {session.lastMessage || '发起聊天'}
                    </p>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

export default ChatList;
