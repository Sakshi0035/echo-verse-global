import React, { useState, useRef, useEffect } from 'react';
import { User, Message } from '../pages/Index';
import MessageComponent from './MessageComponent';
import MessageInput from './MessageInput';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MoreVertical, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PrivateChatProps {
  currentUser: User;
  chatPartner: User;
  messages: Message[];
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video', recipientId?: string) => void;
  onBack: () => void;
  onDeleteMessage: (messageId: string) => void;
  onReportMessage: (messageId: string) => void;
}

const PrivateChat: React.FC<PrivateChatProps> = ({
  currentUser,
  chatPartner,
  messages,
  onSendMessage,
  onBack,
  onDeleteMessage,
  onReportMessage
}) => {
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
      const timestamp = typeof message.timestamp === 'string' ? new Date(message.timestamp) : message.timestamp;
      
      // Check if the date is valid
      if (!timestamp || isNaN(timestamp.getTime())) {
        console.warn('Invalid timestamp for message:', message);
        return;
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

  const handleClearChat = () => {
    // Clear all private messages between current user and chat partner
    messages.forEach(message => {
      if (message.isPrivate && 
          ((message.userId === currentUser.id && message.recipientId === chatPartner.id) ||
           (message.userId === chatPartner.id && message.recipientId === currentUser.id))) {
        onDeleteMessage(message.id);
      }
    });
    
    toast({
      title: "Chat cleared",
      description: `All messages with ${chatPartner.username} have been deleted.`,
    });
  };

  const handleDeleteChat = () => {
    handleClearChat();
    onBack();
  };

  const handleReport = () => {
    // Report the chat partner - this would report all their messages in this chat
    const partnerMessages = messages.filter(m => m.userId === chatPartner.id);
    if (partnerMessages.length > 0) {
      onReportMessage(partnerMessages[0].id); // Report using the first message as reference
    }
    
    toast({
      title: "User reported",
      description: `${chatPartner.username} has been reported and suspended for 30 minutes.`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col" style={{background: 'linear-gradient(135deg, #0f0f0f 0%, #001122 50%, #002244 100%)'}}>
      {/* Header */}
      <div className="bg-gray-900/95 backdrop-blur border-b border-cyan-500/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-medium">
                  {chatPartner.username[0].toUpperCase()}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${chatPartner.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
              </div>
              <div>
                <h1 className="font-semibold text-cyan-200">{chatPartner.username}</h1>
                <p className="text-sm text-cyan-300/70">
                  {chatPartner.isOnline ? 'Online' : `Last seen ${new Date(chatPartner.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50">
              Private Chat
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-cyan-500/30">
                <DropdownMenuItem 
                  onClick={handleClearChat}
                  className="text-cyan-200 hover:bg-cyan-500/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Chat
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDeleteChat}
                  className="text-cyan-200 hover:bg-cyan-500/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Chat
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleReport} 
                  className="text-red-400 hover:bg-red-500/20"
                >
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
            <div className="text-center text-cyan-300/70 mt-8">
              <div className="text-4xl mb-2">💬</div>
              <p>Start a conversation with {chatPartner.username}</p>
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
                  />
                ))}
              </div>
            ))
          )}
          
          {/* Typing Indicator */}
          {chatPartner.isOnline && (
            <div className="flex items-center gap-2 text-sm text-cyan-300/70 pl-4 opacity-50">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span>{chatPartner.username} is typing...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Reply Preview */}
      {replyTo && (
        <div className="bg-cyan-500/20 border-l-4 border-cyan-500 p-3 mx-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium text-cyan-300">Replying to {replyTo.username}</span>
              <p className="text-cyan-200/70 truncate">{replyTo.content}</p>
            </div>
            <button 
              onClick={() => setReplyTo(null)}
              className="text-cyan-400 hover:text-cyan-300"
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
        disabled={currentUser.isTimedOut && currentUser.timeoutUntil && new Date(currentUser.timeoutUntil) > new Date()}
      />
    </div>
  );
};

export default PrivateChat;
