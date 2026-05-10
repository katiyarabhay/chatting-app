import { useState, useEffect, useRef } from 'react';

function ChatArea({ socket, selectedContact, token, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch message history when selected contact changes
  useEffect(() => {
    if (!selectedContact || !token) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/_/backend/api/messages/${selectedContact.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          // Add isOwn flag
          const formatted = data.map(msg => ({
            ...msg,
            isOwn: msg.sender_id === parseInt(currentUserId)
          }));
          setMessages(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch message history", err);
      }
    };

    fetchHistory();
  }, [selectedContact, token, currentUserId]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
      // Only append if the message belongs to the CURRENTLY selected conversation
      const isRelevant = 
        (data.sender_id === selectedContact?.id) || 
        (data.receiver_id === selectedContact?.id); // (if we sent it from another session, though mostly we rely on state updates for our own)

      if (isRelevant) {
        setMessages(prev => [...prev, { ...data, isOwn: data.sender_id === parseInt(currentUserId) }]);
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, selectedContact, currentUserId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() !== '' && socket && selectedContact) {
      const messageData = {
        id: Date.now(),
        sender_id: parseInt(currentUserId),
        receiver_id: selectedContact.id,
        text: inputValue,
        isOwn: true
      };

      // Optimistic update
      setMessages((prev) => [...prev, messageData]);

      // Emit to server
      socket.emit('send_message', { 
        receiver_id: selectedContact.id, 
        text: inputValue 
      });
      
      setInputValue('');
    }
  };

  if (!selectedContact) {
    return (
      <div className="chat-area empty-chat">
        <h3>Select a contact to start chatting</h3>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <header className="chat-header">
        <div className="contact-info-header">
          <div className="contact-avatar">{selectedContact.username.charAt(0).toUpperCase()}</div>
          <h2>{selectedContact.username}</h2>
        </div>
      </header>

      <div className="messages-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble ${msg.isOwn ? 'sent' : 'received'}`}>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <form className="input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit" className="send-button">
            <svg className="send-icon" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatArea;
