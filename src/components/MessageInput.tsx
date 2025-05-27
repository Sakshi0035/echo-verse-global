
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Paperclip, Smile, Send, X } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video', imageUrl?: string) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{ type: 'image' | 'video', url: string, file: File }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expanded emoji categories
  const emojiCategories = {
    'Smileys & Emotion': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😚', '😋', '😛', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
    'Hand Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    'Popular': ['🔥', '💯', '✨', '⭐', '🌟', '💫', '🎉', '🎊', '🥳', '👑', '💎', '🏆', '🥇', '🎯', '💪', '🙌', '👏', '🤝', '💝', '🎁']
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled) return;
    
    // Send combined message: image(s) + text if both exist
    if (previewFiles.length > 0) {
      // For each file, send as combined message with text
      previewFiles.forEach((file, index) => {
        const textToSend = index === 0 ? message.trim() : ''; // Only include text with first image
        onSendMessage(textToSend, file.type, file.url);
      });
      setPreviewFiles([]);
      setMessage('');
    } else if (message.trim()) {
      // Send text-only message
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      
      setPreviewFiles(prev => [...prev, { type, url, file }]);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePreviewFile = (index: number) => {
    setPreviewFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const insertEmoji = (emoji: string) => {
    if (disabled) return;
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="bg-gray-900/95 backdrop-blur border-t border-blue-500/30 p-2 md:p-4 neon-border">
      {/* File Previews */}
      {previewFiles.length > 0 && (
        <div className="mb-3">
          <div className="flex gap-2 overflow-x-auto mb-2">
            {previewFiles.map((file, index) => (
              <div key={index} className="relative flex-shrink-0">
                {file.type === 'image' ? (
                  <img 
                    src={file.url} 
                    alt="Preview" 
                    className="w-16 h-16 md:w-20 md:h-20 object-cover rounded border border-blue-500/50"
                  />
                ) : (
                  <video 
                    src={file.url} 
                    className="w-16 h-16 md:w-20 md:h-20 object-cover rounded border border-blue-500/50"
                    muted
                  />
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 md:h-6 md:w-6 rounded-full p-0 text-xs bg-red-500 hover:bg-red-600"
                  onClick={() => removePreviewFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-300/70">
            {previewFiles.length} file(s) selected. Add text message to send with media.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Media Upload Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="flex-shrink-0 h-8 w-8 md:h-auto md:w-auto p-1 md:p-2 bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 disabled:opacity-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled}
        />

        {/* Emoji Picker */}
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              disabled={disabled}
              className="flex-shrink-0 h-8 w-8 md:h-auto md:w-auto p-1 md:p-2 bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 disabled:opacity-50"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2 bg-gray-900 border-blue-500/50" align="start">
            <div className="max-h-60 overflow-y-auto">
              {Object.entries(emojiCategories).map(([category, emojis]) => (
                <div key={category} className="mb-3">
                  <h4 className="text-xs font-medium text-blue-300 mb-2">{category}</h4>
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map(emoji => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-blue-500/20 text-lg"
                        onClick={() => insertEmoji(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Message Input */}
        <div className="flex-1">
          <Textarea
            placeholder={disabled ? "You are temporarily suspended from sending messages..." : previewFiles.length > 0 ? "Add text to send with your media..." : "Type a message..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={disabled}
            className="resize-none min-h-[40px] max-h-[120px] bg-gray-800/50 border-blue-500/30 text-blue-100 placeholder:text-blue-300/50 focus:border-blue-400 focus:ring-blue-400 disabled:opacity-50"
            maxLength={1000}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>

        {/* Send Button */}
        <Button 
          type="submit" 
          disabled={disabled || (!message.trim() && previewFiles.length === 0)}
          className="flex-shrink-0 h-8 w-8 md:h-auto md:w-auto p-2 neon-button disabled:opacity-50"
        >
          <span className="hidden md:inline">Send</span>
          <Send className="md:hidden h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;
