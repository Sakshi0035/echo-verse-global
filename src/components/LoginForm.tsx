
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { User } from '../pages/Index';

interface LoginFormProps {
  onLogin: (username: string, password: string, isSignIn?: boolean) => boolean;
  users: User[];
  onResetPassword: (username: string, newPassword: string) => boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, users, onResetPassword }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signup');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const validateForm = (isSignIn: boolean) => {
    setError('');
    
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (!isSignIn) {
      if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        setError('Username is already taken. Please choose another username.');
        return false;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent, isSignIn: boolean = false) => {
    e.preventDefault();
    
    if (!validateForm(isSignIn)) return;

    setIsLoading(true);
    const success = onLogin(username.trim(), password, isSignIn);
    
    if (!success) {
      setIsLoading(false);
      if (isSignIn) {
        setError('Invalid username or password. Click "Forgot Password?" if you need to reset it.');
      }
    }
  };

  const handleForgotPassword = () => {
    if (!username.trim()) {
      setError('Please enter your username first');
      return;
    }

    if (!users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      setError('Username not found. Please check your username.');
      return;
    }

    setShowForgotPassword(true);
    setError('');
  };

  const handleResetPassword = () => {
    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const success = onResetPassword(username, newPassword);
    
    if (success) {
      setShowForgotPassword(false);
      setActiveTab('signin');
      setPassword(newPassword);
      setNewPassword('');
      setError('');
      alert('Password reset successfully! You can now sign in with your new password.');
    } else {
      setError('Failed to reset password. Please try again.');
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)'}}>
        <Card className="w-full max-w-md bg-gray-900 border-cyan-500/30">
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-4 left-4 text-cyan-300 hover:text-cyan-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold text-cyan-400">
              Reset Password
            </CardTitle>
            <CardDescription className="text-cyan-300/70">
              Enter a new password for: {username}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password (min 6 chars)..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-800 border-cyan-500/30 text-cyan-100 placeholder-cyan-300/50 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-cyan-300 hover:text-cyan-200"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button 
              onClick={handleResetPassword}
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-black font-medium"
              disabled={!newPassword.trim()}
            >
              Reset Password
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)'}}>
      <Card className="w-full max-w-md bg-gray-900 border-cyan-500/30">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-cyan-400">
            SafeYou Chat
          </CardTitle>
          <CardDescription className="text-cyan-300/70">
            Secure global chatroom with username & password protection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-cyan-500/30">
              <TabsTrigger value="signup" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
                Sign Up
              </TabsTrigger>
              <TabsTrigger value="signin" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
                Sign In
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Choose your username (min 3 chars)..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-800 border-cyan-500/30 text-cyan-100 placeholder-cyan-300/50"
                    maxLength={20}
                    required
                  />
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password (min 6 chars)..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-800 border-cyan-500/30 text-cyan-100 placeholder-cyan-300/50 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-cyan-300 hover:text-cyan-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-800 border-cyan-500/30 text-cyan-100 placeholder-cyan-300/50 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-cyan-300 hover:text-cyan-200"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-black font-medium"
                  disabled={isLoading || !username.trim() || !password.trim() || !confirmPassword.trim()}
                >
                  {isLoading ? 'Creating Account...' : 'Create Secure Account'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Enter your username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-800 border-cyan-500/30 text-cyan-100 placeholder-cyan-300/50"
                    maxLength={20}
                    required
                  />
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-800 border-cyan-500/30 text-cyan-100 placeholder-cyan-300/50 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-cyan-300 hover:text-cyan-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="text-cyan-400 hover:text-cyan-300 text-sm p-0"
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </Button>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-black font-medium"
                  disabled={isLoading || !username.trim() || !password.trim()}
                >
                  {isLoading ? 'Signing In...' : 'Sign In Securely'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
