import React, { useState, useEffect } from 'react';
import { Tab, User, ChatSession, Message } from './types';
import { INITIAL_USERS, INITIAL_CHATS, INITIAL_MESSAGES, CURRENT_USER } from './constants';
import BottomNav from './components/BottomNav';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import ContactList from './components/ContactList';
import DiscoverView from './components/DiscoverView';
import MeView from './components/MeView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHATS);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  // App State
  const [sessions, setSessions] = useState<ChatSession[]>(INITIAL_CHATS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);

  // Calculate total unread
  const unreadTotal = sessions.reduce((acc, session) => acc + session.unreadCount, 0);

  const handleSendMessage = (chatId: string, text: string, sender: 'me' | 'partner') => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      senderId: sender === 'me' ? CURRENT_USER.id : (sessions.find(s => s.id === chatId)?.partnerId || ''),
      content: text,
      timestamp: Date.now(),
      type: 'text',
    };

    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage]
    }));

    setSessions(prev => prev.map(session => {
      if (session.id === chatId) {
        return {
          ...session,
          lastMessage: text,
          lastMessageTime: newMessage.timestamp,
          // If partner sends message and we aren't in the chat (handled partly by UI, but logic here for completeness)
          unreadCount: sender === 'partner' ? session.unreadCount + 1 : 0
        };
      }
      return session;
    }));
  };

  const handleSelectChat = (sessionId: string) => {
    // clear unread
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, unreadCount: 0 } : s));
    setSelectedChatId(sessionId);
  };

  const handleSelectContact = (user: User) => {
    // Find existing session or create new one
    const existingSession = sessions.find(s => s.partnerId === user.id);
    if (existingSession) {
      handleSelectChat(existingSession.id);
    } else {
      const newSessionId = `c_${user.id}_${Date.now()}`;
      const newSession: ChatSession = {
        id: newSessionId,
        partnerId: user.id,
        lastMessage: '',
        lastMessageTime: Date.now(),
        unreadCount: 0
      };
      setSessions([newSession, ...sessions]);
      setMessages(prev => ({ ...prev, [newSessionId]: [] }));
      handleSelectChat(newSessionId);
    }
    // Switch tab to chats implicitly if coming from contacts? 
    // In WeChat, clicking a contact opens their profile, then you click "Message". 
    // For simplicity here, we go straight to chat.
    // But we must ensure the active view logic handles this overlay properly.
  };

  // Render content based on tab
  const renderContent = () => {
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

  // If a chat is selected, it overlays everything (simulating the push navigation)
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
            messages={messages[selectedChatId] || []}
            onBack={() => setSelectedChatId(null)}
            onSendMessage={handleSendMessage}
          />
        </div>
      )}
    </div>
  );
};

export default App;