import React from 'react';
import { Home, Grid, MessageCircle, User } from 'lucide-react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  unreadTotal: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, unreadTotal }) => {
  const getIconColor = (tab: Tab) => activeTab === tab ? 'text-[#FF00FF] drop-shadow-[0_0_8px_rgba(255,0,255,0.6)]' : 'text-gray-400';

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-[64px] glass-nav rounded-2xl flex items-center justify-around z-50 shadow-2xl border border-white/10">
      <button
        onClick={() => onTabChange(Tab.CHATS)}
        className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 hover:scale-110"
      >
        <div className="relative">
          <MessageCircle
            className={`${getIconColor(Tab.CHATS)} w-7 h-7 transition-all duration-300`}
            strokeWidth={activeTab === Tab.CHATS ? 2.5 : 1.5}
          />
          {unreadTotal > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#FF00FF] text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 shadow-[0_0_10px_#FF00FF]">
              {unreadTotal > 99 ? '99+' : unreadTotal}
            </span>
          )}
        </div>
      </button>

      <button
        onClick={() => onTabChange(Tab.CONTACTS)}
        className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 hover:scale-110"
      >
        <Grid
          className={`${getIconColor(Tab.CONTACTS)} w-7 h-7 transition-all duration-300`}
          strokeWidth={activeTab === Tab.CONTACTS ? 2.5 : 1.5}
        />
      </button>

      <button
        onClick={() => onTabChange(Tab.DISCOVER)}
        className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 hover:scale-110"
      >
        <Home
          className={`${getIconColor(Tab.DISCOVER)} w-7 h-7 transition-all duration-300`}
          strokeWidth={activeTab === Tab.DISCOVER ? 2.5 : 1.5}
        />
      </button>

      <button
        onClick={() => onTabChange(Tab.ME)}
        className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 hover:scale-110"
      >
        <User
          className={`${getIconColor(Tab.ME)} w-7 h-7 transition-all duration-300`}
          strokeWidth={activeTab === Tab.ME ? 2.5 : 1.5}
        />
      </button>
    </div>
  );
};

export default BottomNav;