
import React, { useState } from 'react';
import { User, Message } from '../pages/Index';
import { formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Reply, Trash2, Flag, Heart, ThumbsUp, Smile, Edit } from 'lucide-react';

interface MessageComponentProps {
  message: Message;
  currentUser: User;
  onReply?: (message: Message) => void;
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
  const isOwn = message.userId === currentUser.id;
  const isPrivate = message.isPrivate;
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleReaction = (emoji: string) => {
    if (onReaction) {
      onReaction(message.id, emoji);
    }
    setShowReactions(false);
  };

  const handleUsernameClick = () => {
    if (onUsernameClick && !isOwn) {
      onUsernameClick(message.userId);
    }
  };

  const renderReplyPreview = () => {
    if (!message.replyTo || typeof message.replyTo === 'string') return null;
    
    const replyMessage = message.replyTo as Message;
    return (
      <div className="bg-cyan-500/10 border-l-2 border-cyan-500 pl-3 py-2 mb-2 rounded-r text-sm">
        <div className="text-cyan-400 font-medium text-xs mb-1">
          Replying to {replyMessage.username}
        </div>
        <div className="text-cyan-200/80 truncate">
          {replyMessage.content || '[Media]'}
        </div>
      </div>
    );
  };

  const reactionEmojis = ['❤️', '👍', '😂', '😮', '😢', '😡'];

  return (
    <div className={`flex gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-cyan-500/5 ${
      isOwn 
        ? 'ml-12 bg-gradient-to-r from-cyan-900/20 to-cyan-800/20 border border-cyan-500/30' 
        : 'mr-12 bg-gradient-to-r from-gray-900/40 to-gray-800/40 border border-gray-600/30'
    } ${isPrivate ? 'ring-2 ring-purple-500/50' : ''} neon-border shadow-glow-cyan`}>
      
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-glow-cyan ${
          isOwn 
            ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-black' 
            : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
        }`}>
          {message.username[0].toUpperCase()}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUsernameClick}
              className={`font-semibold text-sm transition-colors duration-300 ${
                isOwn 
                  ? 'text-cyan-300 hover:text-cyan-200' 
                  : 'text-gray-300 hover:text-cyan-300 hover:cursor-pointer'
              } neon-text`}
            >
              {message.username}
            </button>
            <span className="text-xs text-gray-400">
              {formatTime(message.timestamp)}
            </span>
            {isPrivate && (
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                Private
              </span>
            )}
            {message.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>

          {/* Message Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/20">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black border-cyan-500/30 neon-border">
              {onReply && (
                <DropdownMenuItem 
                  onClick={() => onReply(message)}
                  className="text-cyan-300 hover:bg-cyan-500/20"
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => setShowReactions(!showReactions)}
                className="text-cyan-300 hover:bg-cyan-500/20"
              >
                <Smile className="h-4 w-4 mr-2" />
                React
              </DropdownMenuItem>
              {isOwn && onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(message.id)}
                  className="text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
              {!isOwn && onReport && (
                <DropdownMenuItem 
                  onClick={() => onReport(message.id)}
                  className="text-red-400 hover:bg-red-500/20"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Reply Preview */}
        {renderReplyPreview()}

        {/* Message Content */}
        <div className="space-y-2">
          {message.imageUrl && (
            <div className="rounded-lg overflow-hidden border border-cyan-500/30 shadow-glow-cyan">
              <img 
                src={message.imageUrl} 
                alt="Shared image" 
                className="max-w-full h-auto max-h-64 object-cover"
              />
            </div>
          )}
          
          {message.content && (
            <p className="text-gray-200 break-words leading-relaxed">
              {message.content}
            </p>
          )}
        </div>

        {/* Reaction Picker */}
        {showReactions && (
          <div className="flex gap-1 mt-2 p-2 bg-black/60 rounded-lg border border-cyan-500/30 neon-border">
            {reactionEmojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="p-1 hover:bg-cyan-500/20 rounded transition-colors duration-300 text-lg hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Reactions Display */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(message.reactions).map(([emoji, userIds]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-300 border ${
                  userIds.includes(currentUser.id)
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-glow-cyan'
                    : 'bg-gray-800/60 text-gray-300 border-gray-600/50 hover:bg-cyan-500/10 hover:border-cyan-500/30'
                }`}
              >
                <span>{emoji}</span>
                <span>{userIds.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageComponent;
