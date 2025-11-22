import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MoreHorizontal, Smile, Plus } from 'lucide-react';
import { Message, User } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { CURRENT_USER } from '../constants';

interface ChatWindowProps {
  chatId: string;
  partner: User;
  messages: Message[];
  onBack: () => void;
  onSendMessage: (chatId: string, text: string, sender: 'me' | 'partner') => void;
}

import { fetchMessages, sendMessageToBackend } from '../services/api';

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, partner, messages: initialMessages, onBack, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages on load
  useEffect(() => {
    console.log(`[ChatWindow] Loading messages for chatId: ${chatId}`);
    const loadMessages = async () => {
      const msgs = await fetchMessages(chatId);
      console.log(`[ChatWindow] Fetched ${msgs.length} messages from backend`);
      if (msgs.length > 0) {
        console.log(`[ChatWindow] Setting local messages:`, msgs);
        setLocalMessages(msgs);
      } else {
        console.log(`[ChatWindow] No messages fetched, keeping initial messages`);
      }
    };
    loadMessages();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 100) + 'px';
    }
  }, [inputText]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessageContent = inputText;
    setInputText('');
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = '36px';

    // Optimistic update
    const tempMessage: Message = {
      id: Date.now().toString(),
      senderId: CURRENT_USER.id,
      content: userMessageContent,
      timestamp: Date.now(),
      type: 'text',
    };
    setLocalMessages(prev => [...prev, tempMessage]);
    onSendMessage(chatId, userMessageContent, 'me');

    // Send to backend
    await sendMessageToBackend(chatId, userMessageContent, CURRENT_USER.id);

    // Gemini Integration (Mock)
    if (partner.isAi) {
      setIsTyping(true);
      console.log('[ChatWindow] AI chat detected, will fetch AI response');

      // Construct history for Gemini
      const history = localMessages.map(m => ({
        role: m.senderId === CURRENT_USER.id ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));

      // Add the message just sent
      history.push({ role: 'user', parts: [{ text: userMessageContent }] });

      const response = await sendMessageToGemini(history, userMessageContent);
      console.log('[ChatWindow] AI response received:', response);

      setIsTyping(false);

      // Save AI response to backend
      console.log('[ChatWindow] Saving AI response to backend...');
      const aiMsg = await sendMessageToBackend(chatId, response, partner.id);
      console.log('[ChatWindow] AI message save result:', aiMsg);
      if (aiMsg) {
        console.log('[ChatWindow] Adding AI message to local state');
        setLocalMessages(prev => [...prev, aiMsg]);
        onSendMessage(chatId, response, 'partner');
      } else {
        console.error('[ChatWindow] Failed to save AI message to backend');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#EDEDED] relative">
      {/* Top Bar - Fixed */}
      <div className="h-[50px] flex-shrink-0 flex items-center justify-between px-3 bg-[#EDEDED] border-b border-gray-300/50 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center text-black active:bg-gray-200 rounded px-1 py-1 -ml-1 transition-colors"
        >
          <ChevronLeft className="w-7 h-7" />
          <span className="text-base -ml-1">WeChat</span>
        </button>
        <span className="font-medium text-lg truncate max-w-[200px]">{partner.name}</span>
        <button className="p-2">
          <MoreHorizontal className="w-6 h-6 text-black" />
        </button>
      </div>

      {/* Messages Area - Scrollable */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{
          paddingBottom: '100px', // Space for input area
          overflowX: 'hidden'
        }}
      >
        {localMessages.map((msg) => {
          const isMe = msg.senderId === CURRENT_USER.id;
          return (
            <div key={msg.id} className={`flex mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <img
                  src={partner.avatar}
                  alt="Partner"
                  className="w-10 h-10 rounded-[4px] mr-3 flex-shrink-0"
                />
              )}

              <div className={`relative max-w-[70%] px-3 py-2.5 rounded-[4px] text-base leading-relaxed break-words shadow-sm
                ${isMe ? 'bg-[#95EC69] text-black' : 'bg-white text-black'}
              `}>
                {/* Triangle Arrow */}
                <div className={`absolute top-3 w-0 h-0 border-[6px] border-transparent 
                  ${isMe
                    ? 'border-l-[#95EC69] -right-3'
                    : 'border-r-white -left-3'
                  }`}
                />
                {msg.content}
              </div>

              {isMe && (
                <img
                  src={CURRENT_USER.avatar}
                  alt="Me"
                  className="w-10 h-10 rounded-[4px] ml-3 flex-shrink-0"
                />
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex mb-4 justify-start">
            <img
              src={partner.avatar}
              alt="Partner"
              className="w-10 h-10 rounded-[4px] mr-3 flex-shrink-0"
            />
            <div className="bg-white px-3 py-3 rounded-[4px] shadow-sm flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#F7F7F7] border-t border-gray-300 p-2 flex items-end gap-2">
        <div className="flex-1 min-h-[36px] max-h-[100px] bg-white rounded px-2 py-1.5 flex items-center">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Message"
            className="w-full bg-transparent outline-none text-base resize-none overflow-y-auto"
            style={{ height: '36px', maxHeight: '100px' }}
            id="chat-input"
            name="chat-input"
          />
        </div>

        <button className="p-2 text-gray-700">
          <Smile className="w-7 h-7 stroke-1" />
        </button>

        {inputText.length > 0 ? (
          <button
            onClick={handleSend}
            className="bg-[#07C160] text-white px-4 py-2 rounded-[4px] text-sm font-medium h-[40px] hover:bg-[#06AD56] active:bg-[#059048] transition-colors"
          >
            Send
          </button>
        ) : (
          <button className="p-2 text-gray-700">
            <Plus className="w-7 h-7 stroke-[1.5] border-2 border-gray-700 rounded-full p-0.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;