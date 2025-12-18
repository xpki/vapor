const socket = io({ path: "/socket.io/" });
const chat = document.getElementById("chat");

let userId = localStorage.getItem("userId");
if (!userId) {
  userId = Math.floor(1000000 + Math.random() * 9000000);
  localStorage.setItem("userId", userId);
}

socket.on("online users", (count) => {
  const el = document.getElementById("onlineCount");
  if (el) el.textContent = "Online Users: " + count;
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function addLine({ sender, message, ts }) {
  const p = document.createElement("p");
  const time = ts ? new Date(ts).toLocaleTimeString() : new Date().toLocaleTimeString();
  p.innerHTML = `<span class="muted">${time}</span> <strong>${escapeHtml(sender)}:</strong> ${escapeHtml(message)}`;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

socket.on("chatHistory", msgs => { msgs.forEach(m => addLine({ ...m })); });
socket.on("newMessage", (payload) => { addLine(payload); });

document.getElementById("sendBtn").onclick = () => {
  const msgInput = document.getElementById("msg");
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit("sendMessage", text);
  msgInput.value = "";
};

document.getElementById("msg").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("sendBtn").click();
});

const nickInput = document.getElementById("nickname");
const setNickBtn = document.getElementById("setNickBtn");

setNickBtn.addEventListener("click", () => {
  const nickname = nickInput.value.trim();
  if (!nickname) return;
  socket.emit("setNickname", nickname);
});

socket.on("nicknameUpdated", data => {
  if (socket.id === data.id) {
    nickInput.value = data.nickname;
  }
});

