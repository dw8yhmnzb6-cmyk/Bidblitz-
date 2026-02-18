/**
 * Admin Password Management Component
 * Change own password and reset user passwords
 */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Key, Lock, Eye, EyeOff, Search, User, Shield, 
  Check, AlertCircle, Loader2, RefreshCw
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const API = process.env.REACT_APP_BACKEND_URL;

export default function AdminPasswordManager({ token }) {
  const [activeTab, setActiveTab] = useState('own'); // 'own' or 'users'
  const [loading, setLoading] = useState(false);
  
  // Own password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  // User management state
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userNewPassword, setUserNewPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async (search = '') => {
    setUsersLoading(true);
    try {
      const response = await axios.get(
        `${API}/api/auth/admin/users?search=${search}&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  // Change own password
  const handleChangeOwnPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen haben');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(
        `${API}/api/auth/admin/change-own-password`,
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Passwort erfolgreich geändert!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Ändern des Passworts');
    } finally {
      setLoading(false);
    }
  };

  // Reset user password
  const handleResetUserPassword = async () => {
    if (!selectedUser || !userNewPassword) {
      toast.error('Bitte Benutzer und neues Passwort auswählen');
      return;
    }
    
    if (userNewPassword.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen haben');
      return;
    }
    
    if (!window.confirm(`Passwort für ${selectedUser.email} wirklich zurücksetzen?`)) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(
        `${API}/api/auth/admin/reset-user-password`,
        { user_id: selectedUser.id, new_password: userNewPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Passwort für ${selectedUser.email} zurückgesetzt!`);
      setSelectedUser(null);
      setUserNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Zurücksetzen');
    } finally {
      setLoading(false);
    }
  };

  // Search users
  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  return (
    <div className="space-y-6" data-testid="admin-password-manager">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-100 rounded-xl">
          <Key className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Passwort-Verwaltung</h2>
          <p className="text-sm text-gray-500">Eigenes Passwort ändern oder Benutzer-Passwörter zurücksetzen</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('own')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'own' 
              ? 'bg-white text-amber-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Lock className="w-4 h-4 inline mr-2" />
          Eigenes Passwort
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'users' 
              ? 'bg-white text-amber-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Benutzer-Passwörter
        </button>
      </div>

      {/* Own Password Tab */}
      {activeTab === 'own' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Eigenes Passwort ändern
          </h3>
          
          <form onSubmit={handleChangeOwnPassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aktuelles Passwort
              </label>
              <div className="relative">
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Neues Passwort
              </label>
              <Input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                required
                minLength={8}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passwort bestätigen
              </label>
              <Input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Passwörter stimmen nicht überein
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={loading || newPassword !== confirmPassword}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Passwort ändern
            </Button>
          </form>
        </div>
      )}

      {/* Users Password Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Benutzer suchen (Email oder Name)"
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="outline">
              Suchen
            </Button>
            <Button type="button" variant="outline" onClick={() => fetchUsers()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </form>

          {/* Selected User Panel */}
          {selectedUser && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <User className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{selectedUser.name || 'Kein Name'}</p>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500"
                >
                  ✕
                </Button>
              </div>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showUserPassword ? 'text' : 'password'}
                    value={userNewPassword}
                    onChange={(e) => setUserNewPassword(e.target.value)}
                    placeholder="Neues Passwort eingeben"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button 
                  onClick={handleResetUserPassword}
                  disabled={loading || !userNewPassword}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Zurücksetzen'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-800">Benutzer ({users.length})</h3>
            </div>
            
            {usersLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Keine Benutzer gefunden</p>
              </div>
            ) : (
              <div className="divide-y max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div 
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedUser?.id === user.id ? 'bg-amber-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.is_admin ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        {user.is_admin ? (
                          <Shield className="w-5 h-5 text-purple-600" />
                        ) : (
                          <User className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.name || 'Kein Name'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.is_admin && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          Admin
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.is_blocked 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {user.is_blocked ? 'Gesperrt' : 'Aktiv'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
