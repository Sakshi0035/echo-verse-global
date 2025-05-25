
import React, { useState } from 'react';
import { Message, User } from '../pages/Index';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface MessageComponentProps {
  message: Message;
  currentUser: User;
  onReply: () => void;
}

const MessageComponent: React.FC<MessageComponentProps> = ({
  message,
  currentUser,
  onReply
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const isOwnMessage = message.userId === currentUser.id;

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleReaction = (emoji: string) => {
    // This would be implemented with real-time updates
    console.log(`Adding reaction ${emoji} to message ${message.id}`);
  };

  const handleReport = () => {
    console.log(`Reporting message ${message.id}`);
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
    <div className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {!isOwnMessage && (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {message.username[0].toUpperCase()}
        </div>
      )}
      
      <div className={`max-w-md ${isOwnMessage ? 'order-first' : ''}`}>
        {!isOwnMessage && (
          <div className="text-sm font-medium text-gray-700 mb-1">
            {message.username}
          </div>
        )}
        
        <div className={`rounded-lg p-3 ${
          isOwnMessage 
            ? 'bg-blue-500 text-white' 
            : 'bg-white border border-gray-200'
        }`}>
          {message.replyTo && (
            <div className="bg-gray-100 border-l-4 border-gray-300 p-2 mb-2 rounded text-sm">
              <span className="text-gray-500">Reply to message</span>
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
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  ✓✓
                </Badge>
              )}
              
              {/* Message options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                    <span className="text-xs">⋯</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onReply}>
                    Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowReactions(!showReactions)}>
                    React
                  </DropdownMenuItem>
                  {!isOwnMessage && (
                    <DropdownMenuItem onClick={handleReport} className="text-red-600">
                      Report
                    </DropdownMenuItem>
                  )}
                  {isOwnMessage && (
                    <DropdownMenuItem className="text-red-600">
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
                className="h-6 px-2 text-xs bg-gray-100 hover:bg-gray-200"
                onClick={() => handleReaction(emoji)}
              >
                {emoji} {users.length}
              </Button>
            ))}
          </div>
        )}
        
        {/* Quick reactions */}
        {showReactions && (
          <div className="flex gap-1 mt-2">
            {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  handleReaction(emoji);
                  setShowReactions(false);
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      {isOwnMessage && (
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {message.username[0].toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default MessageComponent;
