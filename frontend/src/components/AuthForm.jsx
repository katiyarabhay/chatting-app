import { useState } from 'react';

function AuthForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/login' : '/api/register';
    
    try {
      // Using window.location.hostname to construct API URL
      const response = await fetch(`/_/backend${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isLogin) {
        onLogin(data.token, data.username);
      } else {
        // Auto login after register
        setIsLogin(true);
        setError('Registration successful! Please log in.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="username-overlay">
      <div className="username-modal">
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        
        {error && <div className={`auth-message ${error.includes('successful') ? 'success' : 'error'}`}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input username-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          <input
            type="password"
            className="chat-input username-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="join-button" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <p className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default AuthForm;
