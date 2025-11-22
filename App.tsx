import React, { useState, useEffect } from 'react';
import { Tab, User, ChatSession } from './types';
import { INITIAL_USERS, CURRENT_USER } from './constants';
import { fetchChats } from './services/chatApi';
import BottomNav from './components/BottomNav';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import ContactList from './components/ContactList';
import DiscoverView from './components/DiscoverView';
import MeView from './components/MeView';

const App: React.FC = () => {
  console.log('[App] Component mounted');

  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHATS);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[App] Loading chats from database...');
    const loadChats = async () => {
      try {
        const chats = await fetchChats();
        console.log('[App] Fetched chats:', chats);
        const sessions: ChatSession[] = chats.map((chat: any) => ({
          id: chat.id,
          partnerId: chat.partnerId,
          lastMessage: chat.lastMessage,
          lastMessageTime: chat.lastMessageTime,
          unreadCount: chat.unreadCount || 0,
        }));
        console.log('[App] Mapped sessions:', sessions);
        setSessions(sessions);
        setLoading(false);
      } catch (error) {
        console.error('[App] Error loading chats:', error);
        setLoading(false);
      }
    };
    loadChats();
  }, []);

  const unreadTotal = sessions.reduce((acc, session) => acc + session.unreadCount, 0);

  const refreshChatList = async () => {
    console.log('[App] Refreshing chat list...');
    const chats = await fetchChats();
    const sessions: ChatSession[] = chats.map((chat: any) => ({
      id: chat.id,
      partnerId: chat.partnerId,
      lastMessage: chat.lastMessage,
      lastMessageTime: chat.lastMessageTime,
      unreadCount: chat.unreadCount || 0,
    }));
    setSessions(sessions);
  };

  const handleSendMessage = (chatId: string, text: string, sender: 'me' | 'partner') => {
    console.log(`[App] handleSendMessage - chatId: ${chatId}, sender: ${sender}, text: ${text}`);
    setSessions(prev => prev.map(session => {
      if (session.id === chatId) {
        return {
          ...session,
          lastMessage: text,
          lastMessageTime: Date.now(),
          unreadCount: sender === 'partner' ? session.unreadCount + 1 : 0
        };
      }
      return session;
    }));
    setTimeout(() => refreshChatList(), 500);
  };

  const handleSelectChat = (sessionId: string) => {
    console.log(`[App] Chat selected: ${sessionId}`);
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, unreadCount: 0 } : s));
    setSelectedChatId(sessionId);
  };

  const handleSelectContact = (user: User) => {
    console.log(`[App] Contact selected:`, user);
    const existingSession = sessions.find(s => s.partnerId === user.id);
    if (existingSession) {
      handleSelectChat(existingSession.id);
    } else {
      const newSessionId = `c_${user.id}`;
      const newSession: ChatSession = {
        id: newSessionId,
        partnerId: user.id,
        lastMessage: '',
        lastMessageTime: Date.now(),
        unreadCount: 0
      };
      setSessions([newSession, ...sessions]);
      handleSelectChat(newSessionId);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full bg-[#EDEDED]">
          <div className="text-gray-500">加载中...</div>
        </div>
      );
    }

    switch (activeTab) {
      case Tab.CHATS:
        return <ChatList sessions={sessions} users={INITIAL_USERS} onSelectChat={handleSelectChat} />;
      case Tab.CONTACTS:
        return <ContactList users={INITIAL_USERS} onSelectUser={handleSelectContact} />;
      case Tab.DISCOVER:
        return <DiscoverView />;
      case Tab.ME:
        return <MeView user={CURRENT_USER} />;
      default:
        return null;
    }
  };

  const selectedSession = sessions.find(s => s.id === selectedChatId);
  const partner = selectedSession ? INITIAL_USERS.find(u => u.id === selectedSession.partnerId) : null;

  console.log('[App] selectedChatId:', selectedChatId);
  console.log('[App] selectedSession:', selectedSession);
  console.log('[App] partner:', partner);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}

        {/* Chat Window Overlay */}
        {selectedChatId && partner ? (
          <div className="absolute inset-0 z-50 bg-white">
            <ChatWindow
              chatId={selectedChatId}
              partner={partner}
              messages={[]}
              onBack={() => {
                console.log('[App] onBack called, closing chat window');
                setSelectedChatId(null);
                refreshChatList();
              }}
              onSendMessage={handleSendMessage}
            />
          </div>
        ) : selectedChatId && !partner ? (
          <div className="absolute inset-0 z-50 bg-red-100 flex items-center justify-center">
            <div className="text-red-600">
              错误：找不到联系人 (chatId: {selectedChatId})
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          console.log('[App] Tab changed to:', tab);
          setActiveTab(tab);
        }}
        unreadTotal={unreadTotal}
      />
    </div>
  );
};

export default App;