
import React, { useState, useRef, useEffect } from 'react';
import { User, Message } from '../pages/Index';
import MessageComponent from './MessageComponent';
import MessageInput from './MessageInput';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface PrivateChatProps {
  currentUser: User;
  chatPartner: User;
  messages: Message[];
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video', recipientId?: string) => void;
  onBack: () => void;
}

const PrivateChat: React.FC<PrivateChatProps> = ({
  currentUser,
  chatPartner,
  messages,
  onSendMessage,
  onBack
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

  const handleClearChat = () => {
    console.log('Clearing chat with', chatPartner.username);
  };

  const handleReport = () => {
    console.log('Reporting user', chatPartner.username);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              ←
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                  {chatPartner.username[0].toUpperCase()}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${chatPartner.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
              <div>
                <h1 className="font-semibold">{chatPartner.username}</h1>
                <p className="text-sm text-gray-500">
                  {chatPartner.isOnline ? 'Online' : `Last seen ${chatPartner.lastSeen.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Private Chat
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  ⋯
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleClearChat}>
                  Clear Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReport} className="text-red-600">
                  Report User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {Object.keys(messageGroups).length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="text-4xl mb-2">💬</div>
              <p>Start a conversation with {chatPartner.username}</p>
            </div>
          ) : (
            Object.entries(messageGroups).map(([dateKey, msgs]) => (
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
            ))
          )}
          
          {/* Typing Indicator */}
          {chatPartner.isOnline && (
            <div className="flex items-center gap-2 text-sm text-gray-500 pl-4 opacity-50">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span>{chatPartner.username} is typing...</span>
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
          onSendMessage(content, type, chatPartner.id);
          setReplyTo(null);
        }}
      />
    </div>
  );
};

export default PrivateChat;
