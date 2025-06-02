
import React, { useState } from 'react';
import { Message, User } from '../pages/Index';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Trash2, AlertTriangle, Reply, Heart, Check, CheckCheck } from 'lucide-react';

interface MessageComponentProps {
  message: Message;
  currentUser: User;
  onReply: (replyToMessage: Message) => void;
  onDelete?: (messageId: string) => void;
  onReport?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onUsernameClick?: (userId: string) => void;
}

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  currentUser,
  onReply,
  onDelete,
  onReport,
  onReaction,
  onUsernameClick
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const isOwnMessage = message.userId === currentUser.id;

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleReaction = (emoji: string) => {
    if (onReaction) {
      onReaction(message.id, emoji);
    }
    setShowReactions(false);
  };

  const handleDelete = () => {
    if (onDelete && isOwnMessage) {
      onDelete(message.id);
    }
  };

  const handleReport = () => {
    if (onReport && !isOwnMessage) {
      onReport(message.id);
    }
  };

  const handleUsernameClick = () => {
    if (onUsernameClick && !isOwnMessage) {
      onUsernameClick(message.userId);
    }
  };

  const handleReply = () => {
    onReply(message);
  };

  const renderReadReceipt = () => {
    if (!isOwnMessage) return null;
    
    const readByCount = message.readBy ? message.readBy.length : 0;
    const isRead = message.isPrivate ? readByCount > 1 : readByCount > 1;
    
    return (
      <div className="flex items-center ml-2">
        {isRead ? (
          <CheckCheck className="h-4 w-4 text-cyan-400" />
        ) : (
          <Check className="h-4 w-4 text-gray-400" />
        )}
      </div>
    );
  };

  const renderReplyPreview = () => {
    if (!message.replyTo) return null;
    
    // Handle both string ID and Message object
    let replyToMessage: Message | null = null;
    
    if (typeof message.replyTo === 'string') {
      // If it's just an ID, we can't show the preview properly
      return (
        <div className="bg-cyan-500/10 border-l-4 border-cyan-400 p-2 mb-2 rounded-r">
          <div className="flex items-center gap-2">
            <Reply className="h-3 w-3 text-cyan-400 flex-shrink-0" />
            <div className="text-cyan-300/70 text-xs">
              Replying to a message
            </div>
          </div>
        </div>
      );
    } else {
      // It's a full Message object
      replyToMessage = message.replyTo as Message;
    }
    
    if (!replyToMessage) return null;
    
    return (
      <div className="bg-cyan-500/10 border-l-4 border-cyan-400 p-2 mb-2 rounded-r">
        <div className="flex items-start gap-2">
          <Reply className="h-3 w-3 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-cyan-300 font-medium text-xs mb-1">
              {replyToMessage.username}
            </div>
            <div className="text-cyan-200/70 text-xs line-clamp-1 break-words">
              {replyToMessage.content || (replyToMessage.imageUrl ? '[Image]' : '[Media]')}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMessageContent = () => {
    const hasText = message.content && message.content.trim();
    const hasMedia = message.imageUrl || (message.type === 'image' || message.type === 'video');

    return (
      <div className="space-y-2">
        {/* Media content */}
        {hasMedia && (
          <div className="relative">
            {message.type === 'image' && (
              <img 
                src={message.imageUrl || message.content} 
                alt="Shared image" 
                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity neon-border shadow-glow-cyan"
              />
            )}
            {message.type === 'video' && (
              <video 
                controls 
                className="max-w-xs rounded-lg neon-border shadow-glow-cyan"
                preload="metadata"
              >
                <source src={message.imageUrl || message.content} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        )}
        
        {/* Text content */}
        {hasText && (
          <div className="whitespace-pre-wrap break-words text-cyan-100">
            {message.content}
          </div>
        )}
        
        {/* Show placeholder if neither text nor media */}
        {!hasText && !hasMedia && (
          <div className="text-cyan-300/50 italic">
            [Media message]
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`group flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'} hover:bg-cyan-500/10 p-3 rounded-lg transition-all duration-300`}>
      {!isOwnMessage && (
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0 shadow-glow-cyan neon-border">
          {message.username[0].toUpperCase()}
        </div>
      )}
      
      <div className={`max-w-md ${isOwnMessage ? 'order-first' : ''}`}>
        {/* Username */}
        {!isOwnMessage && (
          <div 
            className="text-sm font-medium mb-2 transition-colors neon-text text-cyan-300 cursor-pointer hover:text-cyan-200 hover:shadow-glow-cyan"
            onClick={handleUsernameClick}
          >
            {message.username}
          </div>
        )}
        
        <div className={`rounded-lg p-3 relative ${
          isOwnMessage 
            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-black neon-border shadow-glow-cyan' 
            : 'bg-black/70 border border-cyan-500/50 text-cyan-100 neon-border backdrop-blur'
        }`}>
          {/* Reply Preview */}
          {renderReplyPreview()}
          
          {renderMessageContent()}
          
          {/* Time and Read Receipt */}
          <div className="flex items-center justify-end mt-2 gap-1">
            <div className={`text-xs ${isOwnMessage ? 'text-black/70' : 'text-cyan-300/70'}`}>
              {formatTime(message.timestamp)}
              {message.isEdited && <span className="ml-1">(edited)</span>}
            </div>
            {renderReadReceipt()}
          </div>
          
          {/* Quick action buttons */}
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 neon-border bg-black/80"
              onClick={handleReply}
            >
              <Reply className="h-3 w-3" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 neon-border bg-black/80"
              onClick={() => handleReaction('❤️')}
            >
              <Heart className="h-3 w-3" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 neon-border bg-black/80"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 border-cyan-500/50 neon-border backdrop-blur shadow-glow-cyan">
                <DropdownMenuItem onClick={handleReply} className="text-cyan-300 hover:bg-cyan-500/20 focus:bg-cyan-500/20">
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowReactions(!showReactions)} className="text-cyan-300 hover:bg-cyan-500/20 focus:bg-cyan-500/20">
                  <Heart className="h-4 w-4 mr-2" />
                  React
                </DropdownMenuItem>
                {!isOwnMessage && (
                  <DropdownMenuItem onClick={handleReport} className="text-red-400 hover:bg-red-500/20 focus:bg-red-500/20">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                )}
                {isOwnMessage && (
                  <DropdownMenuItem onClick={handleDelete} className="text-red-400 hover:bg-red-500/20 focus:bg-red-500/20">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Reactions */}
        {Object.keys(message.reactions || {}).length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {Object.entries(message.reactions || {}).map(([emoji, users]) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 neon-border shadow-glow-cyan transition-all duration-300"
                onClick={() => handleReaction(emoji)}
              >
                {emoji} {users.length}
              </Button>
            ))}
          </div>
        )}
        
        {/* Quick reactions panel */}
        {showReactions && (
          <div className="flex gap-2 mt-3 p-3 bg-black/80 rounded-lg border border-cyan-500/50 neon-border backdrop-blur shadow-glow-cyan">
            {['❤️', '👍', '😂', '😮', '😢', '😡', '🔥', '👏'].map(emoji => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-cyan-500/20 transition-all duration-300 hover:scale-110 neon-border"
                onClick={() => handleReaction(emoji)}
              >
                <span className="text-sm">{emoji}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
      
      {isOwnMessage && (
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0 shadow-glow-cyan neon-border">
          {message.username[0].toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default MessageComponent;
