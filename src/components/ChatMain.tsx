import React, { useState, useRef, useEffect } from 'react';
import { User, Message } from '../pages/Index';
import MessageComponent from './MessageComponent';
import MessageInput from './MessageInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { realTimeService } from '../utils/realTimeService';

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
  const [isConnected, setIsConnected] = useState(realTimeService.isConnected());
  const [pendingCount, setPendingCount] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Check if current user is timed out
  const isCurrentUserTimedOut = () => {
    if (!currentUser.isTimedOut || !currentUser.timeoutUntil) return false;
    return new Date(currentUser.timeoutUntil) > new Date();
  };

  const getTimeoutMessage = () => {
    if (!isCurrentUserTimedOut()) return '';
    const timeLeft = Math.ceil((new Date(currentUser.timeoutUntil!).getTime() - new Date().getTime()) / (1000 * 60));
    return `You are suspended for ${timeLeft} more minutes. Reported by ${currentUser.reportedBy}.`;
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const element = scrollAreaRef.current;
      element.scrollTop = element.scrollHeight;
    }

    // Mark messages as read when they come into view (global chat)
    if (messages.length > 0) {
      realTimeService.markConversationAsRead(currentUser.id);
    }
  }, [messages, currentUser.id]);

  useEffect(() => {
    // Monitor connection status
    const checkConnection = () => {
      setIsConnected(realTimeService.isConnected());
      setPendingCount(realTimeService.getPendingCount());
    };

    const interval = setInterval(checkConnection, 1000);
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

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
      let timestamp: Date;
      
      if (typeof message.timestamp === 'string') {
        timestamp = new Date(message.timestamp);
      } else if (message.timestamp instanceof Date) {
        timestamp = message.timestamp;
      } else {
        timestamp = new Date();
      }
      
      if (!timestamp || isNaN(timestamp.getTime())) {
        timestamp = new Date();
      }
      
      const dateKey = timestamp.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push({
        ...message,
        timestamp
      });
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);
  const onlineUsers = users.filter(u => u.id !== currentUser.id && u.isOnline);
  const typingUsers = onlineUsers.slice(0, 2); // Show max 2 typing indicators

  const handleReply = (message: Message) => {
    setReplyTo(message);
  };

  return (
    <div className="flex-1 flex flex-col bg-black/90 h-screen md:h-auto backdrop-blur">
      {/* Enhanced Header with Connection Status */}
      <div className="hidden md:block bg-black/95 backdrop-blur border-b border-cyan-500/30 p-4 neon-border shadow-glow-cyan">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold neon-text">SafeYou Chat</h1>
            <div className="flex items-center gap-3 text-sm text-cyan-300/70">
              <span>{onlineUsers.length} users online</span>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-cyan-400" />
                    <span className="text-cyan-400">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-400" />
                    <span className="text-red-400">Offline</span>
                  </>
                )}
              </div>
              {pendingCount > 0 && (
                <div className="flex items-center gap-1 text-orange-400">
                  <Clock className="h-4 w-4" />
                  <span>{pendingCount} pending</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50 neon-border shadow-glow-cyan">
              Global Room
            </Badge>
            {!isConnected && (
              <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/50">
                Offline Mode
              </Badge>
            )}
            {isCurrentUserTimedOut() && (
              <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/50">
                Suspended
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Suspension Notice */}
      {isCurrentUserTimedOut() && (
        <div className="bg-red-500/20 border border-red-500/50 p-3 m-2 md:m-4 rounded-lg neon-border">
          <div className="text-red-300 text-sm font-medium">
            🚫 Account Suspended
          </div>
          <div className="text-red-200/70 text-sm mt-1">
            {getTimeoutMessage()}
          </div>
        </div>
      )}

      {/* Messages with enhanced styling */}
      <ScrollArea className="flex-1 p-2 md:p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {Object.entries(messageGroups).length === 0 ? (
            <div className="text-center text-cyan-300/70 mt-12">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl font-semibold neon-text mb-2">Welcome to SafeYou Chat!</h2>
              <p className="text-sm md:text-base">Start the conversation and connect with people globally.</p>
            </div>
          ) : (
            Object.entries(messageGroups)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([dateKey, msgs]) => (
                <div key={dateKey}>
                  {/* Enhanced Date Divider */}
                  <div className="flex items-center justify-center my-8">
                    <div className="bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 text-cyan-300 text-sm px-4 py-2 rounded-full border border-cyan-500/50 neon-border shadow-glow-cyan backdrop-blur">
                      {formatDateDivider(new Date(dateKey))}
                    </div>
                  </div>
                  
                  {/* Messages for this date */}
                  <div className="space-y-4">
                    {msgs
                      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      .map(message => (
                        <MessageComponent
                          key={message.id}
                          message={message}
                          currentUser={currentUser}
                          onReply={() => handleReply(message)}
                          onDelete={onDeleteMessage}
                          onReport={onReportMessage}
                          onReaction={onReaction}
                          onUsernameClick={onUsernameClick}
                        />
                      ))}
                  </div>
                </div>
              ))
          )}
          
          {/* Enhanced Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-3 text-sm text-cyan-300/70 pl-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-glow-cyan" />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-glow-cyan" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-glow-cyan" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="neon-text">
                {typingUsers.length === 1 
                  ? `${typingUsers[0].username} is typing...`
                  : `${typingUsers[0].username} and ${typingUsers.length - 1} other${typingUsers.length > 2 ? 's' : ''} ${typingUsers.length === 2 ? 'is' : 'are'} typing...`
                }
              </span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Enhanced Reply Preview - WhatsApp style */}
      {replyTo && !isCurrentUserTimedOut() && (
        <div className="bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border-l-4 border-cyan-500 p-3 mx-2 md:mx-4 neon-border shadow-glow-cyan backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-cyan-300 neon-text mb-1">
                Replying to {replyTo.username}
              </div>
              <div className="text-cyan-200/70 text-sm truncate">
                {replyTo.content || '[Media]'}
              </div>
            </div>
            <button 
              onClick={() => setReplyTo(null)}
              className="text-cyan-400 hover:text-cyan-300 text-xl font-bold transition-colors duration-300 hover:scale-110 ml-3"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Message Input */}
      <MessageInput 
        onSendMessage={(content, type, imageUrl) => {
          onSendMessage(content, type, imageUrl, undefined, replyTo?.id);
          setReplyTo(null);
        }}
        disabled={isCurrentUserTimedOut()}
        disabledReason={isCurrentUserTimedOut() ? getTimeoutMessage() : undefined}
      />
    </div>
  );
};

export default ChatMain;
