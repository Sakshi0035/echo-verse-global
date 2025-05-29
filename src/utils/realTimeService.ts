
// Enhanced real-time messaging service with better cross-device synchronization
class RealTimeService {
  private listeners: ((data: any) => void)[] = [];
  private storageKey = 'safeyou_global_messages';
  private usersKey = 'safeyou_global_users';
  private lastUpdateTime = Date.now();
  private syncInterval: number | null = null;

  constructor() {
    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Also listen for custom events within the same window
    window.addEventListener('realtime-update', this.handleCustomEvent.bind(this));
    
    // Set up periodic sync to ensure data consistency across devices
    this.startPeriodicSync();
  }

  private startPeriodicSync() {
    // Sync every 2 seconds to ensure real-time updates
    this.syncInterval = window.setInterval(() => {
      this.checkForUpdates();
    }, 2000);
  }

  private checkForUpdates() {
    // Force check for updates by triggering storage events
    const messages = this.getMessages();
    const users = this.getUsers();
    
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
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key === this.storageKey || event.key === this.usersKey) {
      const data = event.newValue ? JSON.parse(event.newValue) : null;
      this.notifyListeners({
        type: event.key === this.storageKey ? 'messages' : 'users',
        data: data,
        timestamp: Date.now()
      });
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

  // Broadcast message to all connected clients
  broadcastMessage(message: any) {
    const messages = this.getMessages();
    const newMessages = [...messages, message];
    
    // Store in localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(newMessages));
    
    // Trigger custom event for same window
    const eventData = { 
      type: 'messages', 
      data: newMessages, 
      timestamp: Date.now() 
    };
    
    window.dispatchEvent(new CustomEvent('realtime-update', { detail: eventData }));
    
    // Also trigger storage event manually for better cross-device sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: this.storageKey,
      newValue: JSON.stringify(newMessages),
      url: window.location.href
    }));
  }

  // Broadcast updated messages (for deletions, edits, etc.)
  broadcastUpdatedMessages(messages: any[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(messages));
    
    const eventData = { 
      type: 'messages', 
      data: messages, 
      timestamp: Date.now() 
    };
    
    window.dispatchEvent(new CustomEvent('realtime-update', { detail: eventData }));
    
    // Also trigger storage event manually
    window.dispatchEvent(new StorageEvent('storage', {
      key: this.storageKey,
      newValue: JSON.stringify(messages),
      url: window.location.href
    }));
  }

  // Broadcast user update to all connected clients
  broadcastUserUpdate(users: any[]) {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
    
    // Trigger custom event for same window
    const eventData = { 
      type: 'users', 
      data: users, 
      timestamp: Date.now() 
    };
    
    window.dispatchEvent(new CustomEvent('realtime-update', { detail: eventData }));
    
    // Also trigger storage event manually for better cross-device sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: this.usersKey,
      newValue: JSON.stringify(users),
      url: window.location.href
    }));
  }

  getMessages() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
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
        lastSeen: user.lastSeen ? new Date(user.lastSeen) : new Date(),
        timeoutUntil: user.timeoutUntil ? new Date(user.timeoutUntil) : undefined
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // Get only private messages between two users
  getPrivateMessages(userId1: string, userId2: string) {
    const allMessages = this.getMessages();
    return allMessages.filter(msg => 
      msg.isPrivate && 
      ((msg.userId === userId1 && msg.recipientId === userId2) ||
       (msg.userId === userId2 && msg.recipientId === userId1))
    );
  }

  // Get only public messages
  getPublicMessages() {
    const allMessages = this.getMessages();
    return allMessages.filter(msg => !msg.isPrivate);
  }

  clearData() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.usersKey);
    
    // Clear sync interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    window.removeEventListener('storage', this.handleStorageChange);
    window.removeEventListener('realtime-update', this.handleCustomEvent);
  }
}

export const realTimeService = new RealTimeService();
