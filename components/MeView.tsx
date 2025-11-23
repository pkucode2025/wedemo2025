import React from 'react';
import { User } from '../types';
import { Settings, ChevronRight, Bell, Eye, Database, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MeViewProps {
  user: User;
}

const MeView: React.FC<MeViewProps> = ({ user }) => {
  const { logout } = useAuth();
  const [autoRefresh, setAutoRefresh] = React.useState(() => {
    const saved = localStorage.getItem('autoRefresh');
    return saved === null ? true : saved === 'true';
  });

  const handleToggleAutoRefresh = () => {
    const newValue = !autoRefresh;
    setAutoRefresh(newValue);
    localStorage.setItem('autoRefresh', String(newValue));
    console.log('[Settings] Auto-refresh:', newValue ? 'ON' : 'OFF');
  };

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

      {/* Settings Section */}
      <div className="bg-white mb-2">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <Database className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-[17px]">性能优化</span>
          </div>
        </div>

        {/* Auto Refresh Toggle */}
        <div
          className="px-4 py-3 border-b border-gray-100 flex items-center justify-between active:bg-gray-50 cursor-pointer"
          onClick={handleToggleAutoRefresh}
        >
          <div className="flex items-center flex-1">
            <RefreshCw className="w-5 h-5 text-gray-600 mr-3" />
            <div className="flex-1">
              <div className="text-[17px]">自动刷新消息</div>
              <div className="text-[13px] text-gray-500 mt-0.5">
                {autoRefresh ? '开启（每15-20秒）' : '关闭（仅手动刷新）'}
              </div>
            </div>
          </div>
          <div
            className={`w-12 h-7 rounded-full transition-colors ${autoRefresh ? 'bg-[#07C160]' : 'bg-gray-300'
              }`}
            style={{ position: 'relative' }}
          >
            <div
              className="w-6 h-6 bg-white rounded-full absolute top-0.5 transition-all"
              style={{ left: autoRefresh ? '22px' : '2px' }}
            />
          </div>
        </div>

        <div className="px-4 py-2 bg-gray-50">
          <p className="text-xs text-gray-500">
            💡 提示：关闭自动刷新可节省90%流量和数据库消耗。
            {!autoRefresh && ' 点击聊天窗口右上角的刷新按钮手动更新。'}
          </p>
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