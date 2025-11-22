import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MoreHorizontal, Mic, Smile, Plus } from 'lucide-react';
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

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, partner, messages, onBack, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

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

    const userMessage = inputText;
    setInputText('');
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = '36px';

    onSendMessage(chatId, userMessage, 'me');

    // Gemini Integration
    if (partner.isAi) {
      setIsTyping(true);

      // Construct history for Gemini
      const history = messages.map(m => ({
        role: m.senderId === CURRENT_USER.id ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));

      // Add the message just sent
      history.push({ role: 'user', parts: [{ text: userMessage }] });

      const response = await sendMessageToGemini(history, userMessage);

      setIsTyping(false);
      onSendMessage(chatId, response, 'partner');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-full fixed inset-0 bg-[#EDEDED] z-50">
      {/* Top Bar */}
      <div className="h-[50px] flex items-center justify-between px-3 bg-[#EDEDED] border-b border-gray-300/50 shadow-sm z-10">
        <button onClick={onBack} className="flex items-center text-black active:bg-gray-200 rounded px-1 py-1 -ml-1">
          <ChevronLeft className="w-7 h-7" />
          <span className="text-base -ml-1">WeChat</span>
        </button>
        <span className="font-medium text-lg">{partner.name}</span>
        <button className="p-2">
          <MoreHorizontal className="w-6 h-6 text-black" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 bg-[#EDEDED]">
        {messages.map((msg) => {
          const isMe = msg.senderId === CURRENT_USER.id;
          return (
            <div key={msg.id} className={`flex mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <img src={partner.avatar} alt="Partner" className="w-10 h-10 rounded-[4px] mr-3 flex-shrink-0" />
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
                <img src={CURRENT_USER.avatar} alt="Me" className="w-10 h-10 rounded-[4px] ml-3 flex-shrink-0" />
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex mb-4 justify-start">
            <img src={partner.avatar} alt="Partner" className="w-10 h-10 rounded-[4px] mr-3 flex-shrink-0" />
            <div className="bg-white px-3 py-3 rounded-[4px] shadow-sm flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-0"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#F7F7F7] border-t border-gray-300 p-2 flex items-end gap-2 fixed bottom-0 w-full safe-area-pb">
        <button className="p-2 mb-0.5 text-gray-700">
          <Mic className="w-7 h-7 stroke-1" />
        </button>

        <div className="flex-1 min-h-[36px] bg-white rounded px-2 py-1.5 mb-1">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="w-full bg-transparent outline-none text-base resize-none max-h-[100px]"
            style={{ height: '36px' }}
            id="chat-input"
            name="chat-input"
          />
        </div>

        <button className="p-2 mb-0.5 text-gray-700">
          <Smile className="w-7 h-7 stroke-1" />
        </button>

        {inputText.length > 0 ? (
          <button
            onClick={handleSend}
            className="bg-[#07C160] text-white px-4 py-1.5 rounded-[4px] text-sm font-medium mb-1.5"
          >
            Send
          </button>
        ) : (
          <button className="p-2 mb-0.5 text-gray-700">
            <Plus className="w-7 h-7 stroke-[1.5] border-2 border-gray-700 rounded-full p-0.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;