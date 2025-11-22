import React from 'react';
import { User } from '../types';
import { UserPlus, Search, Users, Tag } from 'lucide-react';

interface ContactListProps {
  users: User[];
  onSelectUser: (user: User) => void;
}

const ContactList: React.FC<ContactListProps> = ({ users, onSelectUser }) => {
  // Simple A-Z grouping mock
  const grouped = {
    'A': users.filter(u => u.name.startsWith('A') || u.name.includes('AI')),
    'B': users.filter(u => u.name.startsWith('B')),
    'C': users.filter(u => u.name.startsWith('C')),
    'D': users.filter(u => u.name.startsWith('D')),
  };

  const ActionRow = ({ color, icon: Icon, label }: any) => (
    <div className="flex items-center px-4 py-2.5 bg-white border-b border-gray-100 active:bg-gray-50">
      <div className={`w-10 h-10 rounded-[4px] ${color} flex items-center justify-center mr-3`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className="text-base">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#EDEDED] overflow-y-auto no-scrollbar pb-16">
      <div className="h-[50px] flex items-center justify-between px-4 bg-[#EDEDED] sticky top-0 z-10">
        <span className="font-medium text-lg">Contacts</span>
        <UserPlus className="w-6 h-6 text-black" />
      </div>
      
      <div className="px-2 pb-2">
        <div className="bg-white rounded flex items-center justify-center h-8 text-gray-400 text-sm">
          <Search className="w-4 h-4 mr-1" />
          Search
        </div>
      </div>

      <div className="mt-0">
        <ActionRow color="bg-[#FA9D3B]" icon={UserPlus} label="New Friends" />
        <ActionRow color="bg-[#07C160]" icon={Users} label="Group Chats" />
        <ActionRow color="bg-[#2782D7]" icon={Tag} label="Tags" />
        <ActionRow color="bg-[#2782D7]" icon={Users} label="Official Accounts" />
      </div>

      {Object.entries(grouped).map(([letter, contacts]) => (
        <div key={letter}>
          <div className="px-4 py-1 text-xs text-gray-500 bg-[#EDEDED]">{letter}</div>
          {contacts.map(user => (
             <div 
                key={user.id} 
                onClick={() => onSelectUser(user)}
                className="flex items-center px-4 py-2.5 bg-white border-b border-gray-100 active:bg-gray-50"
             >
                <img src={user.avatar} className="w-10 h-10 rounded-[4px] mr-3" alt="" />
                <span className="text-base font-medium">{user.name}</span>
             </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ContactList;