
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video') => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{ type: 'image' | 'video', url: string, file: File }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emojis = ['😀', '😂', '😍', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (previewFiles.length > 0) {
      previewFiles.forEach(file => {
        onSendMessage(file.url, file.type);
      });
      setPreviewFiles([]);
    }
    
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* File Previews */}
      {previewFiles.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {previewFiles.map((file, index) => (
            <div key={index} className="relative flex-shrink-0">
              {file.type === 'image' ? (
                <img 
                  src={file.url} 
                  alt="Preview" 
                  className="w-20 h-20 object-cover rounded border"
                />
              ) : (
                <video 
                  src={file.url} 
                  className="w-20 h-20 object-cover rounded border"
                  muted
                />
              )}
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={() => removePreviewFile(index)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Media Upload Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          📎
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Emoji Picker */}
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="flex-shrink-0">
              😀
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="grid grid-cols-6 gap-1">
              {emojis.map(emoji => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Message Input */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="resize-none"
            maxLength={1000}
          />
        </div>

        {/* Send Button */}
        <Button 
          type="submit" 
          disabled={!message.trim() && previewFiles.length === 0}
          className="flex-shrink-0"
        >
          Send
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;
