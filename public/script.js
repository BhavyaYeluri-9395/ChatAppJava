const socket = io();
const chat = document.getElementById("chat");
const input = document.getElementById("message");
const sendBtn = document.getElementById("send");

// Show messages
socket.on("chat message", (msg) => {
  const div = document.createElement("div");
  div.textContent = msg;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
});

// Send message
sendBtn.addEventListener("click", () => {
  if (input.value.trim() !== "") {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});

// Send message on Enter key
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});
