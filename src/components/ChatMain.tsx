
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
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video', imageUrl?: string, recipientId?: string, replyToId?: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReportMessage: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onUsernameClick: (userId: string) => void;
}

const ChatMain: React.FC<ChatMainProps> = ({
  currentUser,
  messages,
  users,
  onSendMessage,
  onDeleteMessage,
  onReportMessage,
  onReaction,
  onUsernameClick
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
      // Convert timestamp to Date object if it's not already
      let timestamp: Date;
      
      if (typeof message.timestamp === 'string') {
        timestamp = new Date(message.timestamp);
      } else if (message.timestamp && typeof message.timestamp === 'object' && !(message.timestamp instanceof Date)) {
        // Handle complex timestamp objects from storage
        const timestampObj = message.timestamp as any;
        if (timestampObj._type === 'Date') {
          if (timestampObj.value && timestampObj.value.iso) {
            timestamp = new Date(timestampObj.value.iso);
          } else if (timestampObj.value && typeof timestampObj.value === 'number') {
            timestamp = new Date(timestampObj.value);
          } else {
            timestamp = new Date();
          }
        } else {
          timestamp = new Date();
        }
      } else if (message.timestamp instanceof Date) {
        timestamp = message.timestamp;
      } else {
        // Fallback to current date if timestamp is invalid
        console.warn('Invalid timestamp for message:', message);
        timestamp = new Date();
      }
      
      // Check if the date is valid
      if (!timestamp || isNaN(timestamp.getTime())) {
        console.warn('Invalid timestamp for message:', message);
        timestamp = new Date();
      }
      
      const dateKey = timestamp.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push({
        ...message,
        timestamp // Ensure the timestamp is a proper Date object
      });
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);
  const typingUsers = users.filter(u => u.id !== currentUser.id && u.isOnline).slice(0, 1);

  return (
    <div className="flex-1 flex flex-col bg-black/90 h-screen md:h-auto">
      {/* Header - Hidden on mobile since we have the mobile header in ChatInterface */}
      <div className="hidden md:block bg-black/95 backdrop-blur border-b border-cyan-500/30 p-4 neon-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold neon-text">SafeYou Chat</h1>
            <p className="text-sm text-cyan-300/70">
              {users.filter(u => u.isOnline).length} users online
            </p>
          </div>
          <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50 neon-border">
            Global Room
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-2 md:p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {Object.entries(messageGroups).length === 0 ? (
            <div className="text-center text-cyan-300/70 mt-8">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm md:text-base">Welcome to SafeYou Chat! Start the conversation.</p>
            </div>
          ) : (
            Object.entries(messageGroups).map(([dateKey, msgs]) => (
              <div key={dateKey}>
                {/* Date Divider */}
                <div className="flex items-center justify-center my-6">
                  <div className="bg-cyan-500/20 text-cyan-300 text-xs px-3 py-1 rounded-full border border-cyan-500/50">
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
                    onDelete={onDeleteMessage}
                    onReport={onReportMessage}
                    onReaction={onReaction}
                    onUsernameClick={onUsernameClick}
                  />
                ))}
              </div>
            ))
          )}
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-cyan-300/70 pl-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span>{typingUsers[0].username} is typing...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Reply Preview */}
      {replyTo && (
        <div className="bg-cyan-500/20 border-l-4 border-cyan-500 p-3 mx-2 md:mx-4 neon-border">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium text-cyan-300">Replying to {replyTo.username}</span>
              <p className="text-cyan-200/70 truncate">{replyTo.content}</p>
            </div>
            <button 
              onClick={() => setReplyTo(null)}
              className="text-cyan-400 hover:text-cyan-300 text-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <MessageInput 
        onSendMessage={(content, type, imageUrl) => {
          onSendMessage(content, type, imageUrl, undefined, replyTo?.id);
          setReplyTo(null);
        }}
        disabled={currentUser.isTimedOut && currentUser.timeoutUntil && new Date(currentUser.timeoutUntil) > new Date()}
      />
    </div>
  );
};

export default ChatMain;
