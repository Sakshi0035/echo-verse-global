
import React, { useState } from 'react';
import { Message, User } from '../pages/Index';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Trash2, AlertTriangle } from 'lucide-react';

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

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="relative">
            <img 
              src={message.content} 
              alt="Shared image" 
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            />
          </div>
        );
      case 'video':
        return (
          <div className="relative">
            <video 
              controls 
              className="max-w-xs rounded-lg"
              preload="metadata"
            >
              <source src={message.content} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      default:
        return (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        );
    }
  };

  return (
    <div className={`group flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'} hover:bg-cyan-500/5 p-2 rounded-lg transition-colors`}>
      {!isOwnMessage && (
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 shadow-glow-cyan">
          {message.username[0].toUpperCase()}
        </div>
      )}
      
      <div className={`max-w-md ${isOwnMessage ? 'order-first' : ''}`}>
        {/* Always show username for all messages */}
        <div 
          className={`text-sm font-medium mb-1 transition-colors ${
            isOwnMessage 
              ? 'text-cyan-300 text-right' 
              : 'text-cyan-300 cursor-pointer hover:text-cyan-200'
          }`}
          onClick={!isOwnMessage ? handleUsernameClick : undefined}
        >
          {message.username}
        </div>
        
        <div className={`rounded-lg p-3 ${
          isOwnMessage 
            ? 'bg-cyan-500 text-white neon-border' 
            : 'bg-gray-900 border border-gray-700 text-cyan-100'
        }`}>
          {message.replyTo && (
            <div className="bg-cyan-500/20 border-l-4 border-cyan-400 p-2 mb-2 rounded text-sm">
              <span className="text-cyan-300">Reply to message</span>
            </div>
          )}
          
          {renderMessageContent()}
          
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs opacity-70">
              {formatTime(message.timestamp)}
              {message.isEdited && <span className="ml-1">(edited)</span>}
            </div>
            
            <div className="flex items-center gap-1">
              {/* Read receipts */}
              {isOwnMessage && message.readBy.length > 1 && (
                <Badge variant="secondary" className="text-xs px-1 py-0 bg-cyan-500/20 text-cyan-300">
                  ✓✓
                </Badge>
              )}
              
              {/* Message options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                  <DropdownMenuItem onClick={onReply} className="text-cyan-300 hover:bg-cyan-500/20">
                    Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowReactions(!showReactions)} className="text-cyan-300 hover:bg-cyan-500/20">
                    React
                  </DropdownMenuItem>
                  {!isOwnMessage && (
                    <DropdownMenuItem onClick={handleReport} className="text-red-400 hover:bg-red-500/20">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  )}
                  {isOwnMessage && (
                    <DropdownMenuItem onClick={handleDelete} className="text-red-400 hover:bg-red-500/20">
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
          <div className="flex gap-1 mt-1">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30"
                onClick={() => handleReaction(emoji)}
              >
                {emoji} {users.length}
              </Button>
            ))}
          </div>
        )}
        
        {/* Quick reactions */}
        {showReactions && (
          <div className="flex gap-1 mt-2 p-2 bg-gray-900 rounded-lg border border-gray-700">
            {['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '👏', '🎉', '💯'].map(emoji => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-cyan-500/20"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      {isOwnMessage && (
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 shadow-glow-green">
          {message.username[0].toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default MessageComponent;
