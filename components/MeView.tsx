import React from 'react';
import { User } from '../types';
import { Settings, ChevronRight, Bell, Eye, Database, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MeViewProps {
  user: User;
}

const MeView: React.FC<MeViewProps> = ({ user }) => {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-[#EDEDED] overflow-y-auto">
      {/* Header */}
      <div className="h-[50px] flex items-center justify-between px-4 bg-[#EDEDED] border-b border-gray-300/30 flex-shrink-0">
        <span className="font-medium text-lg">我</span>
      </div>

      {/* Profile Section */}
      <div className="bg-white p-4 mb-2">
        <div className="flex items-center">
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

      {/* Performance Info */}
      <div className="bg-white mb-2 p-4">
        <div className="flex items-center mb-3">
          <Database className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-[17px] font-medium">性能优化模式</span>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
          <div className="flex items-start">
            <RefreshCw className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 mb-1">已禁用自动刷新</p>
              <p className="text-xs text-green-700">
                节省99%流量和数据库消耗 ✅
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <p>💡 <strong>刷新方式：</strong></p>
          <ul className="list-disc list-inside pl-4 space-y-0.5">
            <li>微信tab：点击右上角刷新按钮</li>
            <li>聊天窗口：点击右上角刷新按钮</li>
            <li>发送消息后：自动刷新</li>
            <li>切换tab时：自动刷新</li>
          </ul>
        </div>
      </div>

      {/* Other Settings */}
      <div className="bg-white mb-2">
        <SettingRow icon={Bell} label="消息通知" />
        <SettingRow icon={Eye} label="隐私" />
        <SettingRow icon={Settings} label="设置" />
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

      {/* Version Info */}
      <div className="p-4 text-center text-xs text-gray-400">
        微信克隆 v1.0.0 - 性能优化版
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