
// Simple real-time messaging service using localStorage events
class RealTimeService {
  private listeners: ((data: any) => void)[] = [];
  private storageKey = 'safeyou_global_messages';
  private usersKey = 'safeyou_global_users';

  constructor() {
    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', this.handleStorageChange.bind(this));
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key === this.storageKey || event.key === this.usersKey) {
      this.notifyListeners({
        type: event.key === this.storageKey ? 'messages' : 'users',
        data: event.newValue ? JSON.parse(event.newValue) : null
      });
    }
  }

  subscribe(callback: (data: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(listener => listener(data));
  }

  // Broadcast message to all connected clients
  broadcastMessage(message: any) {
    const messages = this.getMessages();
    const newMessages = [...messages, message];
    localStorage.setItem(this.storageKey, JSON.stringify(newMessages));
    
    // Trigger storage event manually for same window
    this.notifyListeners({ type: 'messages', data: newMessages });
  }

  // Broadcast user update to all connected clients
  broadcastUserUpdate(users: any[]) {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
    
    // Trigger storage event manually for same window
    this.notifyListeners({ type: 'users', data: users });
  }

  getMessages() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored).map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    })) : [];
  }

  getUsers() {
    const stored = localStorage.getItem(this.usersKey);
    return stored ? JSON.parse(stored).map((user: any) => ({
      ...user,
      lastSeen: new Date(user.lastSeen),
      timeoutUntil: user.timeoutUntil ? new Date(user.timeoutUntil) : undefined
    })) : [];
  }

  clearData() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.usersKey);
  }
}

export const realTimeService = new RealTimeService();
