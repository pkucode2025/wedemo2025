import React from 'react';
import { User } from '../types';
import { UserPlus, Search, Users, Tag } from 'lucide-react';

interface ContactListProps {
  users: User[];
  onSelectUser: (user: User) => void;
}

const ContactList: React.FC<ContactListProps> = ({ users, onSelectUser }) => {
  console.log('[ContactList] Rendering with users:', users);

  // 动态分组 - 按首字母分组所有联系人
  const groupByLetter = (users: User[]) => {
    const grouped: Record<string, User[]> = {};

    users.forEach(user => {
      // 跳过AI（Gemini），它不在通讯录中
      if (user.isAi) return;

      const firstLetter = user.name.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(user);
    });

    // 按字母顺序排序
    const sortedKeys = Object.keys(grouped).sort();
    const sortedGrouped: Record<string, User[]> = {};
    sortedKeys.forEach(key => {
      sortedGrouped[key] = grouped[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    return sortedGrouped;
  };

  const grouped = groupByLetter(users);
  console.log('[ContactList] Grouped contacts:', grouped);

  const ActionRow = ({ color, icon: Icon, label }: any) => (
    <div className="flex items-center px-4 py-3 bg-white border-b border-gray-200/50 active:bg-gray-100 cursor-pointer transition-colors">
      <div className={`w-10 h-10 rounded-md ${color} flex items-center justify-center mr-3 flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className="text-[17px]">{label}</span>
    </div>
  );

  const totalContacts = users.filter(u => !u.isAi).length;

  return (
    <div className="flex flex-col h-full bg-[#EDEDED] overflow-hidden">
      {/* Header */}
      <div className="h-[50px] flex items-center justify-between px-4 bg-[#EDEDED] border-b border-gray-300/30 flex-shrink-0">
        <span className="font-medium text-lg">通讯录</span>
        <UserPlus className="w-6 h-6 text-black" />
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 bg-[#EDEDED] flex-shrink-0">
        <div className="bg-white rounded-md flex items-center justify-center h-9 text-gray-400 text-sm cursor-pointer">
          <Search className="w-4 h-4 mr-1" />
          搜索
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Action Rows */}
        <div className="mb-2">
          <ActionRow color="bg-[#FA9D3B]" icon={UserPlus} label="新的朋友" />
          <ActionRow color="bg-[#07C160]" icon={Users} label="群聊" />
          <ActionRow color="bg-[#2782D7]" icon={Tag} label="标签" />
          <ActionRow color="bg-[#576B95]" icon={Users} label="公众号" />
        </div>

        {/* Contact Count */}
        <div className="px-4 py-2 text-sm text-gray-500 bg-[#EDEDED]">
          我的好友 ({totalContacts})
        </div>

        {/* Grouped Contacts */}
        {Object.keys(grouped).length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            暂无联系人
          </div>
        ) : (
          Object.entries(grouped).map(([letter, contacts]) => (
            <div key={letter}>
              {/* Letter Header */}
              <div className="px-4 py-1.5 text-[13px] font-medium text-gray-500 bg-[#EDEDED] sticky top-0">
                {letter}
              </div>

              {/* Contacts in this group */}
              {contacts.map(user => (
                <div
                  key={user.id}
                  onClick={() => {
                    console.log('[ContactList] User clicked:', user);
                    onSelectUser(user);
                  }}
                  className="flex items-center px-4 py-3 bg-white border-b border-gray-200/50 active:bg-gray-100 cursor-pointer transition-colors"
                >
                  <img
                    src={user.avatar}
                    className="w-10 h-10 rounded-md mr-3 flex-shrink-0 object-cover"
                    alt={user.name}
                  />
                  <span className="text-[17px] font-medium text-gray-900">{user.name}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContactList;