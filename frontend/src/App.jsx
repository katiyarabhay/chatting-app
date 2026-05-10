import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import AuthForm from './components/AuthForm';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './index.css';

function App() {
  const [socket, setSocket] = useState(null);
  
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('chat_token'));
  const [username, setUsername] = useState(localStorage.getItem('chat_username'));
  const [userId, setUserId] = useState(localStorage.getItem('chat_userId'));
  const [isJoined, setIsJoined] = useState(!!token);

  const [selectedContact, setSelectedContact] = useState(null);

  // Handle connection
  useEffect(() => {
    if (token && username) {
      const newSocket = io('/', {
        path: '/_/backend/socket.io',
        auth: { token }
      });

      newSocket.on('connect_error', (err) => {
        console.error("Connection error:", err.message);
        if (err.message.includes('Authentication')) {
          handleLogout();
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token, username]);

  const handleLogin = (newToken, newUsername, newUserId) => {
    localStorage.setItem('chat_token', newToken);
    localStorage.setItem('chat_username', newUsername);
    localStorage.setItem('chat_userId', newUserId);
    setToken(newToken);
    setUsername(newUsername);
    setUserId(newUserId);
    setIsJoined(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_username');
    localStorage.removeItem('chat_userId');
    setToken(null);
    setUsername('');
    setUserId(null);
    setIsJoined(false);
    setSelectedContact(null);
    if (socket) socket.close();
  };

  return (
    <>
      {!isJoined && <AuthForm onLogin={handleLogin} />}

      <div className="whatsapp-layout">
        <div className="top-nav">
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <h1>RealChat</h1>
            {isJoined && <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>Logged in as {username}</span>}
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <div className="status-indicator">
              <span className={`status-dot ${isJoined ? '' : 'offline'}`}></span>
              {isJoined ? 'Online' : 'Offline'}
            </div>
            {isJoined && (
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            )}
          </div>
        </div>

        {isJoined && (
          <div className="chat-container whatsapp-container">
            <Sidebar 
              token={token} 
              selectedContact={selectedContact}
              setSelectedContact={setSelectedContact}
            />
            <ChatArea 
              socket={socket}
              selectedContact={selectedContact}
              token={token}
              currentUserId={userId}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default App;
