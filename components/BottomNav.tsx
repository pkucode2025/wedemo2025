import React from 'react';
import { MessageSquare, Users, Compass, User as UserIcon } from 'lucide-react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  unreadTotal: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, unreadTotal }) => {
  const getIconColor = (tab: Tab) => activeTab === tab ? 'text-[#07C160]' : 'text-gray-600';

  return (
    <div className="h-[56px] bg-[#F7F7F7] border-t border-gray-200 flex items-center justify-around flex-shrink-0">
      <button
        onClick={() => onTabChange(Tab.CHATS)}
        className="flex flex-col items-center justify-center flex-1 h-full active:bg-gray-200/50 transition-colors"
      >
        <div className="relative">
          <MessageSquare
            className={`${getIconColor(Tab.CHATS)} w-6 h-6`}
            fill={activeTab === Tab.CHATS ? '#07C160' : 'none'}
            strokeWidth={1.5}
          />
          {unreadTotal > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
              {unreadTotal > 99 ? '99+' : unreadTotal}
            </span>
          )}
        </div>
        <span className={`text-[10px] mt-0.5 ${activeTab === Tab.CHATS ? 'text-[#07C160]' : 'text-gray-600'}`}>微信</span>
      </button>

      <button
        onClick={() => onTabChange(Tab.CONTACTS)}
        className="flex flex-col items-center justify-center flex-1 h-full active:bg-gray-200/50 transition-colors"
      >
        <Users
          className={`${getIconColor(Tab.CONTACTS)} w-6 h-6`}
          fill={activeTab === Tab.CONTACTS ? '#07C160' : 'none'}
          strokeWidth={1.5}
        />
        <span className={`text-[10px] mt-0.5 ${activeTab === Tab.CONTACTS ? 'text-[#07C160]' : 'text-gray-600'}`}>通讯录</span>
      </button>

      <button
        onClick={() => onTabChange(Tab.DISCOVER)}
        className="flex flex-col items-center justify-center flex-1 h-full active:bg-gray-200/50 transition-colors"
      >
        <Compass
          className={`${getIconColor(Tab.DISCOVER)} w-6 h-6`}
          fill={activeTab === Tab.DISCOVER ? '#07C160' : 'none'}
          strokeWidth={1.5}
        />
        <span className={`text-[10px] mt-0.5 ${activeTab === Tab.DISCOVER ? 'text-[#07C160]' : 'text-gray-600'}`}>发现</span>
      </button>

      <button
        onClick={() => onTabChange(Tab.ME)}
        className="flex flex-col items-center justify-center flex-1 h-full active:bg-gray-200/50 transition-colors"
      >
        <UserIcon
          className={`${getIconColor(Tab.ME)} w-6 h-6`}
          fill={activeTab === Tab.ME ? '#07C160' : 'none'}
          strokeWidth={1.5}
        />
        <span className={`text-[10px] mt-0.5 ${activeTab === Tab.ME ? 'text-[#07C160]' : 'text-gray-600'}`}>我</span>
      </button>
    </div>
  );
};

export default BottomNav;