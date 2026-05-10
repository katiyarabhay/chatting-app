const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { getDB } = require('./database');
const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const messagesRoutes = require('./routes/messages');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/messages', messagesRoutes);

const server = http.createServer(app);
const JWT_SECRET = 'supersecretkey123'; 

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Socket.io Middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error: Token missing'));
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error: Invalid token'));
    socket.user = decoded; // { id, username }
    next();
  });
});

io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.id})`);
  
  // Join a private room with this user's ID
  socket.join(socket.user.id.toString());

  // Handle incoming private messages
  socket.on('send_message', async (data) => {
    // data should contain { receiver_id, text }
    const { receiver_id, text } = data;
    if (!receiver_id || !text) return;

    try {
      const db = await getDB();
      // Insert into database
      const result = await db.run(
        'INSERT INTO messages (sender_id, receiver_id, text) VALUES (?, ?, ?)',
        [socket.user.id, receiver_id, text]
      );
      
      const messageToDeliver = {
        id: result.lastID,
        sender_id: socket.user.id,
        receiver_id: receiver_id,
        sender_username: socket.user.username,
        text: text,
        timestamp: new Date().toISOString()
      };
      
      // Deliver to receiver if they are online
      socket.to(receiver_id.toString()).emit('receive_message', messageToDeliver);
      
      // Send confirmation back to sender
      socket.emit('message_saved', messageToDeliver);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', async () => {
  await getDB();
  console.log(`Backend server running on port ${PORT}`);
});
