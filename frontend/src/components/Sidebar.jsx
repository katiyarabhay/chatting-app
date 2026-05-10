import { useState, useEffect } from 'react';

function Sidebar({ token, selectedContact, setSelectedContact }) {
  const [contacts, setContacts] = useState([]);
  const [addUsername, setAddUsername] = useState('');
  const [error, setError] = useState('');

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      const res = await fetch(`/_/backend/api/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setContacts(data);
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    }
  };

  useEffect(() => {
    if (token) fetchContacts();
  }, [token]);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!addUsername.trim()) return;
    setError('');

    try {
      const res = await fetch(`/_/backend/api/contacts/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ username: addUsername })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAddUsername('');
      fetchContacts(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Chats</h2>
      </div>
      
      <div className="add-contact-area">
        <form onSubmit={handleAddContact} className="add-contact-form">
          <input 
            type="text" 
            placeholder="Add by username..." 
            value={addUsername}
            onChange={(e) => setAddUsername(e.target.value)}
            className="chat-input"
            style={{ padding: '8px 12px', fontSize: '0.9rem' }}
          />
          <button type="submit" className="add-btn">+</button>
        </form>
        {error && <div style={{color: '#ef4444', fontSize: '0.75rem', marginTop: '4px'}}>{error}</div>}
      </div>

      <div className="contacts-list">
        {contacts.length === 0 ? (
          <div className="no-contacts">No contacts yet. Add someone!</div>
        ) : (
          contacts.map(contact => (
            <div 
              key={contact.id} 
              className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
              onClick={() => setSelectedContact(contact)}
            >
              <div className="contact-avatar">
                {contact.username.charAt(0).toUpperCase()}
              </div>
              <div className="contact-info">
                <span className="contact-name">{contact.username}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Sidebar;
