export interface User {
  id: string;
  name: string;
  avatar: string;
  isAi?: boolean; // To identify the Gemini bot
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'voice' | 'star' | 'gift';
}

export interface ChatSession {
  id: string;
  partnerId: string; // The ID of the user you are chatting with
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

export enum Tab {
  CHATS = 'Chats',
  CONTACTS = 'Contacts',
  DISCOVER = 'Discover',
  ROMANTIC = 'Romantic',
  ME = 'Me',
}

export interface ContactGroup {
  letter: string;
  contacts: User[];
}