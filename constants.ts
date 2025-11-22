import { User, ChatSession, Message } from './types';

export const CURRENT_USER: User = {
  id: 'me',
  name: 'Developer',
  avatar: 'https://picsum.photos/id/64/200/200', // Generic user
};

export const GEMINI_USER: User = {
  id: 'gemini',
  name: 'WeChat AI',
  avatar: 'https://picsum.photos/id/2/200/200', // Techy vibe
  isAi: true,
};

export const INITIAL_USERS: User[] = [
  GEMINI_USER,
  { id: 'u1', name: 'Alice Chen', avatar: 'https://picsum.photos/id/65/200/200' },
  { id: 'u2', name: 'Bob Zhang', avatar: 'https://picsum.photos/id/91/200/200' },
  { id: 'u3', name: 'Catherine Liu', avatar: 'https://picsum.photos/id/103/200/200' },
  { id: 'u4', name: 'David Wang', avatar: 'https://picsum.photos/id/177/200/200' },
];

export const INITIAL_CHATS: ChatSession[] = [
  {
    id: 'c_gemini',
    partnerId: 'gemini',
    lastMessage: 'Hello! I am your AI assistant.',
    lastMessageTime: Date.now() - 100000,
    unreadCount: 1,
  },
  {
    id: 'c_alice',
    partnerId: 'u1',
    lastMessage: 'Are we still on for dinner?',
    lastMessageTime: Date.now() - 3600000,
    unreadCount: 2,
  },
  {
    id: 'c_bob',
    partnerId: 'u2',
    lastMessage: '[Image]',
    lastMessageTime: Date.now() - 86400000,
    unreadCount: 0,
  },
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  'c_gemini': [
    {
      id: 'm1',
      senderId: 'gemini',
      content: 'Hello! I am your AI assistant powered by Gemini. How can I help you today?',
      timestamp: Date.now() - 100000,
      type: 'text',
    }
  ],
  'c_alice': [
     {
      id: 'm2',
      senderId: 'u1',
      content: 'Hey!',
      timestamp: Date.now() - 3605000,
      type: 'text',
    },
    {
      id: 'm3',
      senderId: 'u1',
      content: 'Are we still on for dinner?',
      timestamp: Date.now() - 3600000,
      type: 'text',
    }
  ],
  'c_bob': [
    {
      id: 'm4',
      senderId: 'me',
      content: 'Look at this view!',
      timestamp: Date.now() - 86410000,
      type: 'text',
    },
    {
      id: 'm5',
      senderId: 'u2',
      content: 'Wow, looks amazing.',
      timestamp: Date.now() - 86400000,
      type: 'text',
    }
  ]
};