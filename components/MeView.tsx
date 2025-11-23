import React from 'react';
import { User } from '../types';
import { ChevronRight, Bell, Eye, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GlobalRefreshButton from './GlobalRefreshButton';

interface MeViewProps {
  user: User;
  onRefresh?: () => Promise<void>;
  onEditProfile?: () => void;
}

const MeView: React.FC<MeViewProps> = ({ user, onRefresh, onEditProfile }) => {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-[#EDEDED] overflow-y-auto">
      {/* Header */}
      <div className="h-[50px] flex items-center justify-between px-4 bg-[#EDEDED] border-b border-gray-300/30 flex-shrink-0">
        <span className="font-medium text-lg">我</span>
        {onRefresh && <GlobalRefreshButton onRefresh={onRefresh} />}
      </div>

      {/* Profile Section */}
      <div className="bg-white p-4 mb-2" onClick={onEditProfile}>
        <div className="flex items-center cursor-pointer active:bg-gray-50">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-16 h-16 rounded-md object-cover"
          />
          <div className="ml-4 flex-1">
            <h2 className="text-xl font-medium">{user.name}</h2>
            <p className="text-sm text-gray-500 mt-1">微信号: {user.id}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white mb-2">
        <SettingRow icon={Bell} label="消息通知" />
        <SettingRow icon={Eye} label="隐私" />
        <SettingRow icon={SettingsIcon} label="设置" />
      </div>

      {/* Logout Button */}
      <div className="bg-white mb-2">
        <button
          onClick={logout}
          className="w-full px-4 py-3 text-center text-red-500 text-[17px] active:bg-gray-50 transition-colors"
        >
          退出登录
        </button>
      </div>

      {/* Version */}
      <div className="p-4 text-center text-xs text-gray-400">
        微信克隆 v1.0.0
      </div>
    </div>
  );
};

const SettingRow: React.FC<{ icon: any; label: string }> = ({ icon: Icon, label }) => (
  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between active:bg-gray-50 cursor-pointer">
    <div className="flex items-center">
      <Icon className="w-5 h-5 text-gray-600 mr-3" />
      <span className="text-[17px]">{label}</span>
    </div>
    <ChevronRight className="w-5 h-5 text-gray-400" />
  </div>
);

export default MeView;
