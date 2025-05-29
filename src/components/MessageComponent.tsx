
import React, { useState } from 'react';
import { Message, User } from '../pages/Index';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Trash2, AlertTriangle, Reply, Heart } from 'lucide-react';

interface MessageComponentProps {
  message: Message;
  currentUser: User;
  onReply: () => void;
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
    onReply();
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
        <div 
          className={`text-sm font-medium mb-2 transition-colors neon-text ${
            isOwnMessage 
              ? 'text-cyan-300 text-right' 
              : 'text-cyan-300 cursor-pointer hover:text-cyan-200 hover:shadow-glow-cyan'
          }`}
          onClick={!isOwnMessage ? handleUsernameClick : undefined}
        >
          {message.username}
        </div>
        
        <div className={`rounded-lg p-4 ${
          isOwnMessage 
            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-black neon-border shadow-glow-cyan' 
            : 'bg-black/70 border border-cyan-500/50 text-cyan-100 neon-border backdrop-blur'
        }`}>
          {message.replyTo && (
            <div className="bg-cyan-500/20 border-l-4 border-cyan-400 p-2 mb-3 rounded text-sm neon-border">
              <div className="flex items-center gap-2 text-cyan-300">
                <Reply className="h-3 w-3" />
                <span>Reply to message</span>
              </div>
            </div>
          )}
          
          {renderMessageContent()}
          
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs opacity-70 text-cyan-300">
              {formatTime(message.timestamp)}
              {message.isEdited && <span className="ml-1">(edited)</span>}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Read receipts */}
              {isOwnMessage && message.readBy.length > 1 && (
                <Badge variant="secondary" className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-300 neon-border">
                  ✓✓ Read
                </Badge>
              )}
              
              {/* Quick reply button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 neon-border"
                onClick={handleReply}
              >
                <Reply className="h-4 w-4" />
              </Button>
              
              {/* Quick reaction button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 neon-border"
                onClick={() => handleReaction('❤️')}
              >
                <Heart className="h-4 w-4" />
              </Button>
              
              {/* Message options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 neon-border"
                  >
                    <MoreHorizontal className="h-4 w-4" />
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
        </div>
        
        {/* Reactions */}
        {Object.keys(message.reactions).length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-sm bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 neon-border shadow-glow-cyan transition-all duration-300"
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
            {['❤️', '👍', '😂', '😮', '😢', '😡', '🔥', '👏', '🎉', '💯', '✨', '💎'].map(emoji => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 hover:bg-cyan-500/20 transition-all duration-300 hover:scale-110 neon-border"
                onClick={() => handleReaction(emoji)}
              >
                <span className="text-lg">{emoji}</span>
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
