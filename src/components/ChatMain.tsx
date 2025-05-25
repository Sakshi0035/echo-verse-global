
import React, { useState, useRef, useEffect } from 'react';
import { User, Message } from '../pages/Index';
import MessageComponent from './MessageComponent';
import MessageInput from './MessageInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ChatMainProps {
  currentUser: User;
  messages: Message[];
  users: User[];
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video', recipientId?: string, replyToId?: string) => void;
}

const ChatMain: React.FC<ChatMainProps> = ({
  currentUser,
  messages,
  users,
  onSendMessage
}) => {
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const formatDateDivider = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    
    messages.forEach(message => {
      const dateKey = message.timestamp.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);
  const typingUsers = users.filter(u => u.id !== currentUser.id && u.isOnline).slice(0, 1); // Simulate typing

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Global Chat</h1>
            <p className="text-sm text-gray-500">
              {users.filter(u => u.isOnline).length} users online
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Public Room
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {Object.entries(messageGroups).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              {/* Date Divider */}
              <div className="flex items-center justify-center my-6">
                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {formatDateDivider(new Date(dateKey))}
                </div>
              </div>
              
              {/* Messages for this date */}
              {msgs.map(message => (
                <MessageComponent
                  key={message.id}
                  message={message}
                  currentUser={currentUser}
                  onReply={() => setReplyTo(message)}
                />
              ))}
            </div>
          ))}
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500 pl-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span>{typingUsers[0].username} is typing...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Reply Preview */}
      {replyTo && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mx-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium text-blue-700">Replying to {replyTo.username}</span>
              <p className="text-gray-600 truncate">{replyTo.content}</p>
            </div>
            <button 
              onClick={() => setReplyTo(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <MessageInput 
        onSendMessage={(content, type) => {
          onSendMessage(content, type, undefined, replyTo?.id);
          setReplyTo(null);
        }}
      />
    </div>
  );
};

export default ChatMain;
