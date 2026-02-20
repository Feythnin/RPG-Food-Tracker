import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { username, password });
      setUser(data.user);
      navigate('/setup');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="rpg-card p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-accent-gold text-center mb-2">Quest Fuel</h1>
        <p className="text-text-muted text-center mb-6">Create your adventurer</p>
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
              minLength={3}
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
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-bg-primary border border-accent-gold/20 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-gold"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-gold text-bg-primary font-bold py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Begin Quest'}
          </button>
        </form>
        <p className="text-text-muted text-center mt-4">
          Already adventuring? <Link to="/login" className="text-accent-gold hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}
