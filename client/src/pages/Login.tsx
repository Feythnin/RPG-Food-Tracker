import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      setUser(data.user);
      navigate(data.user.setupComplete ? '/' : '/setup');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="rpg-card p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-accent-gold text-center mb-2">Quest Fuel</h1>
        <p className="text-text-muted text-center mb-6">Begin your adventure</p>
        {error && (
          <div className="bg-accent-red/20 border border-accent-red/50 text-accent-red rounded-lg px-4 py-2 mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-bg-primary border border-accent-gold/20 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-gold"
              required
            />
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-primary border border-accent-gold/20 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-gold"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-gold text-bg-primary font-bold py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Entering...' : 'Enter the Dungeon'}
          </button>
        </form>
        <p className="text-text-muted text-center mt-4">
          New adventurer? <Link to="/register" className="text-accent-gold hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
}
