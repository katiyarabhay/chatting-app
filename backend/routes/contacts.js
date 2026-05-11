const express = require('express');
const { getDB } = require('../database');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Get all contacts for the logged in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDB();
    const { rows: contacts } = await db`
      SELECT u.id, u.username 
      FROM contacts c
      JOIN users u ON c.contact_id = u.id
      WHERE c.user_id = ${req.user.id}
    `;
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Add a contact by username
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    if (username === req.user.username) return res.status(400).json({ error: 'Cannot add yourself' });

    const db = await getDB();
    
    // Find the user to add
    const { rows: userRows } = await db`SELECT id, username FROM users WHERE username = ${username}`;
    const contactUser = userRows[0];
    if (!contactUser) return res.status(404).json({ error: 'User not found' });

    // Check if already in contacts
    const { rows: existingRows } = await db`SELECT * FROM contacts WHERE user_id = ${req.user.id} AND contact_id = ${contactUser.id}`;
    const existing = existingRows[0];
    if (existing) return res.status(400).json({ error: 'User is already in your contacts' });

    // Add to contacts (two-way connection for WhatsApp style)
    await db`INSERT INTO contacts (user_id, contact_id) VALUES (${req.user.id}, ${contactUser.id})`;
    await db`INSERT INTO contacts (user_id, contact_id) VALUES (${contactUser.id}, ${req.user.id}) ON CONFLICT DO NOTHING`;

    res.status(201).json(contactUser);
  } catch (error) {
    console.error('Error adding contact:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
