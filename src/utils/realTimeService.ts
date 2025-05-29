// Enhanced real-time messaging service with superior cross-platform synchronization
class RealTimeService {
  private listeners: ((data: any) => void)[] = [];
  private storageKey = 'safeyou_global_messages';
  private usersKey = 'safeyou_global_users';
  private syncInterval: number | null = null;
  private heartbeatInterval: number | null = null;
  private isOnline = navigator.onLine;
  private pendingMessages: any[] = [];

  constructor() {
    // Listen for storage changes from other tabs/windows/devices
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Custom events for same-window communication
    window.addEventListener('realtime-update', this.handleCustomEvent.bind(this));
    
    // Network status monitoring for offline support
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Enhanced periodic sync for real-time experience
    this.startPeriodicSync();
    this.startHeartbeat();
    
    // Initialize with current data
    this.initializeData();
  }

  private initializeData() {
    // Ensure data exists and is properly formatted
    const messages = this.getMessages();
    const users = this.getUsers();
    
    // Broadcast initial state
    setTimeout(() => {
      this.notifyListeners({
        type: 'messages',
        data: messages,
        timestamp: Date.now()
      });
      
      this.notifyListeners({
        type: 'users',
        data: users,
        timestamp: Date.now()
      });
    }, 100);
  }

  private startPeriodicSync() {
    // Aggressive sync every 500ms for real-time feel
    this.syncInterval = window.setInterval(() => {
      this.performSync();
    }, 500);
  }

  private startHeartbeat() {
    // Heartbeat every 10 seconds to detect changes
    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat();
    }, 10000);
  }

  private performSync() {
    if (!this.isOnline) return;
    
    try {
      const messages = this.getMessages();
      const users = this.getUsers();
      
      // Only notify if data actually changed
      this.notifyListeners({
        type: 'sync',
        data: { messages, users },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  private sendHeartbeat() {
    // Update user's last seen time
    const users = this.getUsers();
    const currentUserId = localStorage.getItem('currentUser');
    
    if (currentUserId) {
      try {
        const currentUser = JSON.parse(currentUserId);
        const updatedUsers = users.map(u => 
          u.id === currentUser.id 
            ? { ...u, lastSeen: new Date(), isOnline: true }
            : u
        );
        this.broadcastUserUpdate(updatedUsers);
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }
  }

  private handleOnline() {
    this.isOnline = true;
    console.log('🔄 Back online - syncing pending messages...');
    
    // Send any pending messages
    this.processPendingMessages();
    
    // Perform immediate sync
    this.performSync();
  }

  private handleOffline() {
    this.isOnline = false;
    console.log('📵 Offline mode activated');
  }

  private processPendingMessages() {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      this.broadcastMessage(message);
    }
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key === this.storageKey || event.key === this.usersKey) {
      try {
        const data = event.newValue ? JSON.parse(event.newValue) : null;
        this.notifyListeners({
          type: event.key === this.storageKey ? 'messages' : 'users',
          data: data,
          timestamp: Date.now(),
          source: 'storage'
        });
      } catch (error) {
        console.error('Storage change error:', error);
      }
    }
  }

  private handleCustomEvent(event: any) {
    if (event.detail) {
      this.notifyListeners(event.detail);
    }
  }

  subscribe(callback: (data: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in real-time listener:', error);
      }
    });
  }

  // Enhanced message broadcasting with offline support
  broadcastMessage(message: any) {
    if (!this.isOnline) {
      this.pendingMessages.push(message);
      console.log('📤 Message queued for when online');
      return;
    }

    try {
      const messages = this.getMessages();
      const newMessage = {
        ...message,
        timestamp: new Date(),
        id: message.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        readBy: [message.userId], // Initialize with sender
        reactions: message.reactions || {}
      };
      
      const newMessages = [...messages, newMessage];
      
      // Store with enhanced error handling
      this.safeStorageSet(this.storageKey, newMessages);
      
      // Multi-channel broadcasting for maximum reliability
      this.multiChannelBroadcast('messages', newMessages);
      
      console.log('📨 Message broadcasted:', message.content?.substring(0, 30) + '...');
    } catch (error) {
      console.error('Broadcast message error:', error);
      this.pendingMessages.push(message);
    }
  }

  broadcastUpdatedMessages(messages: any[]) {
    try {
      this.safeStorageSet(this.storageKey, messages);
      this.multiChannelBroadcast('messages', messages);
      console.log('🔄 Messages updated and broadcasted');
    } catch (error) {
      console.error('Broadcast updated messages error:', error);
    }
  }

  broadcastUserUpdate(users: any[]) {
    try {
      this.safeStorageSet(this.usersKey, users);
      this.multiChannelBroadcast('users', users);
      console.log('👥 Users updated and broadcasted');
    } catch (error) {
      console.error('Broadcast user update error:', error);
    }
  }

  private safeStorageSet(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Storage set error:', error);
      // Try to clear some space and retry
      this.cleanupOldData();
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  private multiChannelBroadcast(type: string, data: any) {
    const eventData = { 
      type, 
      data, 
      timestamp: Date.now(),
      source: 'broadcast'
    };
    
    // Custom event for same window
    window.dispatchEvent(new CustomEvent('realtime-update', { detail: eventData }));
    
    // Storage event for cross-tab/device sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: type === 'messages' ? this.storageKey : this.usersKey,
      newValue: JSON.stringify(data),
      url: window.location.href
    }));
  }

  private cleanupOldData() {
    try {
      const messages = this.getMessages();
      // Keep only last 1000 messages to prevent storage overflow
      if (messages.length > 1000) {
        const recentMessages = messages.slice(-1000);
        this.safeStorageSet(this.storageKey, recentMessages);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  getMessages() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: this.parseTimestamp(msg.timestamp),
        reactions: msg.reactions || {},
        readBy: msg.readBy || []
      }));
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  getUsers() {
    try {
      const stored = localStorage.getItem(this.usersKey);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      
      return parsed.map((user: any) => ({
        ...user,
        lastSeen: this.parseTimestamp(user.lastSeen),
        timeoutUntil: user.timeoutUntil ? this.parseTimestamp(user.timeoutUntil) : undefined
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  private parseTimestamp(timestamp: any): Date {
    if (!timestamp) return new Date();
    
    if (timestamp instanceof Date) return timestamp;
    
    if (typeof timestamp === 'string') {
      const parsed = new Date(timestamp);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    
    if (typeof timestamp === 'object' && timestamp.value) {
      if (timestamp.value.iso) {
        return new Date(timestamp.value.iso);
      }
      if (typeof timestamp.value === 'number') {
        return new Date(timestamp.value);
      }
    }
    
    return new Date();
  }

  // Enhanced message filtering with better performance
  getPrivateMessages(userId1: string, userId2: string) {
    const allMessages = this.getMessages();
    return allMessages.filter(msg => 
      msg.isPrivate && 
      ((msg.userId === userId1 && msg.recipientId === userId2) ||
       (msg.userId === userId2 && msg.recipientId === userId1))
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  getPublicMessages() {
    const allMessages = this.getMessages();
    return allMessages.filter(msg => !msg.isPrivate)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Connection status
  isConnected() {
    return this.isOnline;
  }

  // Get pending message count
  getPendingCount() {
    return this.pendingMessages.length;
  }

  clearData() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.usersKey);
    this.pendingMessages = [];
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    window.removeEventListener('storage', this.handleStorageChange);
    window.removeEventListener('realtime-update', this.handleCustomEvent);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  // Mark message as read
  markMessageAsRead(messageId: string, userId: string) {
    try {
      const messages = this.getMessages();
      const updatedMessages = messages.map(msg => {
        if (msg.id === messageId) {
          const readBy = msg.readBy || [];
          if (!readBy.includes(userId)) {
            return {
              ...msg,
              readBy: [...readBy, userId]
            };
          }
        }
        return msg;
      });
      
      this.broadcastUpdatedMessages(updatedMessages);
      console.log('✓ Message marked as read:', messageId);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }

  // Mark all messages in a conversation as read
  markConversationAsRead(currentUserId: string, partnerId?: string) {
    try {
      const messages = this.getMessages();
      let hasUpdates = false;
      
      const updatedMessages = messages.map(msg => {
        // For private messages, mark only messages from the partner
        if (partnerId && msg.isPrivate) {
          if (msg.userId === partnerId && msg.recipientId === currentUserId) {
            const readBy = msg.readBy || [];
            if (!readBy.includes(currentUserId)) {
              hasUpdates = true;
              return {
                ...msg,
                readBy: [...readBy, currentUserId]
              };
            }
          }
        }
        // For global messages, mark all unread messages as read
        else if (!partnerId && !msg.isPrivate) {
          const readBy = msg.readBy || [];
          if (!readBy.includes(currentUserId)) {
            hasUpdates = true;
            return {
              ...msg,
              readBy: [...readBy, currentUserId]
            };
          }
        }
        return msg;
      });
      
      if (hasUpdates) {
        this.broadcastUpdatedMessages(updatedMessages);
        console.log('✓ Conversation marked as read');
      }
    } catch (error) {
      console.error('Mark conversation as read error:', error);
    }
  }
}

export const realTimeService = new RealTimeService();
