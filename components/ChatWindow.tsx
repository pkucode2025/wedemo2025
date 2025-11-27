import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, MoreVertical } from 'lucide-react';
import { Message } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { fetchMessages, sendMessageToBackend } from '../services/chatApi';
import { useAuth } from '../contexts/AuthContext';
import GlobalRefreshButton from './GlobalRefreshButton';

interface Partner {
  userId: string;
  name: string;
  avatar: string;
  isAi?: boolean;
}

interface ChatWindowProps {
  chatId: string;
  partner: Partner;
  onBack: () => void;
  onSendMessage: (chatId: string, text: string, sender: 'me' | 'partner') => void;
  onChatDetails: () => void;
}

const formatMessageTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, partner, onBack, onSendMessage, onChatDetails }) => {
  const { user, token } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const msgs = await fetchMessages(chatId, token || undefined);
      if (Array.isArray(msgs)) {
        setLocalMessages(msgs);
      } else {
        console.error('[ChatWindow] fetchMessages returned non-array:', msgs);
        setLocalMessages([]);
      }
    } catch (error) {
      console.error('[ChatWindow] Error loading messages:', error);
      setLocalMessages([]);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [chatId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 100) + 'px';
    }
  }, [inputText]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || !token) return;

    const userMessageContent = inputText;
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = '40px';

    const tempMessage: Message = {
      id: 'temp_' + Date.now(),
      senderId: user.userId,
      content: userMessageContent,
      timestamp: Date.now(),
      type: 'text',
    };
    setLocalMessages(prev => [...prev, tempMessage]);

    try {
      await sendMessageToBackend(chatId, userMessageContent, user.userId, token);
      onSendMessage(chatId, userMessageContent, 'me');
      await loadMessages();

      if (partner.isAi) {
        setIsTyping(true);
        const history = localMessages.map(m => ({
          role: m.senderId === user.userId ? 'user' as const : 'model' as const,
          parts: [{ text: m.content }]
        }));
        history.push({ role: 'user', parts: [{ text: userMessageContent }] });

        const response = await sendMessageToGemini(history, userMessageContent);
        setIsTyping(false);

        await sendMessageToBackend(chatId, response, partner.userId, token);
        await loadMessages();
        onSendMessage(chatId, response, 'partner');
      }
    } catch (error) {
      console.error('[ChatWindow] Error sending message:', error);
      setLocalMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#121212] relative">
      {/* Modern Header */}
      <div className="h-[70px] bg-[#121212]/90 backdrop-blur-md border-b border-white/5 flex items-center px-4 pt-2 relative flex-shrink-0 z-20">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center ml-2">
          <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#FF00FF] to-[#8A2BE2]">
            <img src={partner.avatar} className="w-full h-full rounded-full object-cover border-2 border-[#121212]" alt="" />
          </div>
          <div className="ml-3">
            <h3 className="text-white font-bold text-[16px]">{partner.name}</h3>
            <span className="text-[#FF00FF] text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF00FF] animate-pulse"></span>
              Online
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <GlobalRefreshButton onRefresh={loadMessages} />
          <button className="p-2 rounded-full hover:bg-white/10 text-white">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#121212] no-scrollbar">
        {localMessages.map((msg) => {
          const isMe = msg.senderId === user?.userId;
          const isGroupChat = chatId.startsWith('group_');

          return (
            <div key={msg.id} className={`flex mb-6 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <img
                  src={msg.senderAvatar || partner.avatar}
                  alt="Sender"
                  className="w-8 h-8 rounded-full mr-3 self-end mb-1 object-cover border border-white/10"
                />
              )}

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                {/* Show sender name in group chat if not me */}
                {!isMe && isGroupChat && (
                  <span className="text-[10px] text-gray-400 mb-1 ml-1 font-medium">
                    {msg.senderName || msg.senderId}
                  </span>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-lg backdrop-blur-sm
                    ${isMe
                      ? 'bg-gradient-to-br from-[#FF00FF] to-[#8A2BE2] text-white rounded-br-none'
                      : 'bg-[#2A2A2A] text-gray-200 rounded-bl-none border border-white/5'}
                  `}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-600 mt-1 px-1">
                  {formatMessageTime(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#121212] flex-shrink-0">
        <div className="flex items-end gap-3 bg-[#1E1E1E] p-2 rounded-[24px] border border-white/10 shadow-lg">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent outline-none text-white text-[15px] resize-none overflow-y-auto placeholder-gray-600 px-3 py-2 max-h-[100px]"
            style={{ height: '40px', lineHeight: '20px' }}
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`p-2.5 rounded-full transition-all duration-300 ${inputText.trim()
              ? 'bg-[#FF00FF] text-white shadow-[0_0_10px_#FF00FF] hover:scale-105'
              : 'bg-[#2A2A2A] text-gray-500'
              }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;