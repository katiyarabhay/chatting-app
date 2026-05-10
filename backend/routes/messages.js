const express = require('express');
const { getDB } = require('../database');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Get message history between logged in user and a specific contact
router.get('/:contactId', authenticateToken, async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    if (isNaN(contactId)) return res.status(400).json({ error: 'Invalid contact ID' });

    const db = await getDB();
    const messages = await db.all(`
      SELECT m.*, u.username as sender_username 
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.timestamp ASC
      LIMIT 200
    `, [req.user.id, contactId, contactId, req.user.id]);
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
