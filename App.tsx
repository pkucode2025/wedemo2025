import React, { useState, useEffect } from 'react';
import { Tab, User, ChatSession, Message } from './types';
import { INITIAL_USERS, CURRENT_USER } from './constants';
import { fetchChats } from './services/chatApi';
import BottomNav from './components/BottomNav';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import ContactList from './components/ContactList';
import DiscoverView from './components/DiscoverView';
import MeView from './components/MeView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHATS);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // App State - now driven by database
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Load chats from database on mount
  useEffect(() => {
    console.log('[App] Loading chats from database...');
    const loadChats = async () => {
      const chats = await fetchChats();
      console.log('[App] Loaded chats:', chats);

      // Transform API response to ChatSession format
      const sessions: ChatSession[] = chats.map((chat: any) => ({
        id: chat.id,
        partnerId: chat.partnerId,
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime,
        unreadCount: chat.unreadCount || 0,
      }));

      setSessions(sessions);
      setLoading(false);
    };

    loadChats();
  }, []);

  // Calculate total unread
  const unreadTotal = sessions.reduce((acc, session) => acc + session.unreadCount, 0);

  // Refresh chat list (called after sending a message)
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
    console.log(`[App] Message sent in chat ${chatId} by ${sender}`);

    // Update the session's last message immediately (optimistic update)
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

    // Refresh from database to get accurate data
    setTimeout(() => refreshChatList(), 500);
  };

  const handleSelectChat = (sessionId: string) => {
    console.log(`[App] Selecting chat: ${sessionId}`);
    // Clear unread count
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, unreadCount: 0 } : s));
    setSelectedChatId(sessionId);
  };

  const handleSelectContact = (user: User) => {
    // Find existing session or create new one
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

  // Render content based on tab
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading chats...</div>
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

  // If a chat is selected, it overlays everything
  const selectedSession = sessions.find(s => s.id === selectedChatId);
  const partner = selectedSession ? INITIAL_USERS.find(u => u.id === selectedSession.partnerId) : null;

  return (
    <div className="w-full h-full relative max-w-md mx-auto bg-white shadow-2xl overflow-hidden sm:border-x sm:border-gray-200">
      {/* Main Tab Content */}
      <div className="h-full w-full pb-[56px]">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadTotal={unreadTotal}
      />

      {/* Chat Window Overlay */}
      {selectedChatId && partner && (
        <div className="absolute inset-0 z-[100] animate-slide-in-right">
          <ChatWindow
            chatId={selectedChatId}
            partner={partner}
            messages={[]} // ChatWindow fetches its own messages from DB
            onBack={() => {
              setSelectedChatId(null);
              refreshChatList(); // Refresh when closing chat to update last message
            }}
            onSendMessage={handleSendMessage}
          />
        </div>
      )}
    </div>
  );
};

export default App;