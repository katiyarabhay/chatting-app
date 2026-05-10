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
    const { rows: messages } = await db`
      SELECT m.*, u.username as sender_username 
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ${req.user.id} AND m.receiver_id = ${contactId}) 
         OR (m.sender_id = ${contactId} AND m.receiver_id = ${req.user.id})
      ORDER BY m.timestamp ASC
      LIMIT 200
    `;
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
