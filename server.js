const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Store connected users
const users = new Map();

console.log("🚀 Starting Multi-User Chat Server...");

io.on("connection", (socket) => {
  console.log(`👤 New user connected: ${socket.id}`);

  // Handle user joining with username
  socket.on("join-chat", (username) => {
    users.set(socket.id, username);
    
    // Welcome message to the user who joined
    socket.emit("chat-message", {
      username: "System",
      message: `Welcome ${username}! You can start chatting now.`,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      type: "welcome"
    });
    
    // Notify others that someone joined
    socket.broadcast.emit("chat-message", {
      username: "System", 
      message: `${username} joined the chat`,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      type: "join"
    });
    
    console.log(`✅ ${username} joined the chat`);
  });

  // Handle chat messages
  socket.on("send-message", (data) => {
    const username = users.get(socket.id);
    
    if (username && data.message.trim()) {
      const messageData = {
        username: username,
        message: data.message,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        type: "message"
      };
      
      // Send to everyone including sender
      io.emit("chat-message", messageData);
      console.log(`💬 ${username}: ${data.message}`);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      
      // Notify others that someone left
      socket.broadcast.emit("chat-message", {
        username: "System",
        message: `${username} left the chat`,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        type: "leave"
      });
      
      console.log(`❌ ${username} left the chat`);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🎉 Multi-User Chat Server is running!`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
  console.log(`📱 Open multiple tabs to test with different users!`);
});
