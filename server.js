const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Keep track of all connected users
const connectedUsers = new Map();

console.log("🚀 Starting chat server...");

io.on("connection", (socket) => {
  console.log(`👤 New user connected: ${socket.id}`);

  // When a user joins with a username
  socket.on("user-join", (username) => {
    // Store the username for this user
    connectedUsers.set(socket.id, username);
    
    // Tell everyone (except the person who joined) that someone new joined
    socket.broadcast.emit("user-joined", {
      message: `${username} joined the chat`,
      username: username
    });
    
    // Send welcome message to the person who just joined
    socket.emit("welcome", {
      message: `Welcome ${username}! You can start chatting now.`
    });
    
    console.log(`✅ ${username} joined the chat`);
  });

  // When someone sends a message
  socket.on("send-message", (data) => {
    const username = connectedUsers.get(socket.id);
    
    if (username && data.message.trim()) {
      const messageData = {
        username: username,
        message: data.message,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      
      // Send message to everyone (including sender)
      io.emit("receive-message", messageData);
      
      console.log(`💬 ${username}: ${data.message}`);
    }
  });

  // When someone disconnects
  socket.on("disconnect", () => {
    const username = connectedUsers.get(socket.id);
    
    if (username) {
      // Remove user from our list
      connectedUsers.delete(socket.id);
      
      // Tell everyone this user left
      socket.broadcast.emit("user-left", {
        message: `${username} left the chat`,
        username: username
      });
      
      console.log(`❌ ${username} left the chat`);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🎉 Chat server is running!`);
  console.log(`🌐 Open your browser and go to: http://localhost:${PORT}`);
  console.log(`📱 Open multiple tabs to test with different users!`);
});
