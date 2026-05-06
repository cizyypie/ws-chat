class ChatClient {
  constructor(userId, username, roomName, roomId) {
    this.userId = userId;
    this.username = username;
    this.roomName = roomName;
    this.roomId = roomId;
    this.ws = null;

    this.messagesDiv = document.getElementById("messages");
    this.messageForm = document.getElementById("messageForm");
    this.messageInput = document.getElementById("messageInput");

    console.log("Chat Client initialized:", { userId, username, roomId });
    this.connect();
  }

  connect() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log("Connecting to WebSocket:", wsUrl);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("WebSocket connected!");
      this.messagesDiv.innerHTML = "";
      this.showSystemMessage();
      this.joinRoom();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received:", data.type, data);
        this.handleMessage(data);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("🔌 WebSocket disconnected");
      this.showSystemMessage();
      this.messageInput.disabled = true;
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.showSystemMessage("Connection error!");
    };

    this.messageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.sendMessage();
    });
  }

  joinRoom() {
    console.log("Sending join message...");
    this.ws.send(JSON.stringify({
      type: "join",
      userId: this.userId,
      roomId: this.roomId,
      username: this.username,
    }));
  }

  sendMessage() {
    const content = this.messageInput.value.trim();
    if (!content || !this.roomId || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const tempId = `temp-${Date.now()}`;
    console.log("Sending message with tempId:", tempId);

    this.displayMessage({
      id: tempId,
      username: this.username,
      content,
      createdAt: new Date().toISOString(),
      isOwn: true,
    });

    this.ws.send(JSON.stringify({
      type: "message",
      userId: this.userId,
      roomId: this.roomId,
      username: this.username,
      content,
      tempId,
    }));

    this.messageInput.value = "";
    this.messageInput.focus();
  }

  handleMessage(data) {
    switch (data.type) {
      case "joined":
        console.log("Joined room!");
        if (data.history && Array.isArray(data.history)) {
          console.log("Loading", data.history.length, "past messages");
          data.history.forEach((msg) => {
            this.displayMessage({
              id: msg.id,
              username: msg.username,
              content: msg.content,
              createdAt: msg.createdAt,
              isOwn: parseInt(msg.userId) === parseInt(this.userId),
            });
          });
        }
        break;

      case "message_confirmed":
        const tempEl = document.getElementById(`msg-${data.tempId}`);
        if (tempEl) tempEl.id = `msg-${data.id}`;
        break;

      case "message":
        if (parseInt(data.userId) === parseInt(this.userId)) break;
        this.displayMessage({
          id: data.id,
          username: data.username,
          content: data.content,
          createdAt: data.createdAt,
          isOwn: false,
        });
        break;

      case "user_joined":
        this.showSystemMessage(`${data.username} joined`);
        break;

      case "user_left":
        this.showSystemMessage(`${data.username} left`);
        break;

      case "message_edited":
        this.editMessageDisplay(data.messageId, data.content);
        break;

      case "message_deleted":
        this.deleteMessageDisplay(data.messageId);
        break;

      case "error":
        console.error("Server error:", data.message);
        this.showSystemMessage(`Error: ${data.message}`);
        break;

      default:
        console.warn("Unknown message type:", data.type);
    }
  }

  displayMessage({ id, username, content, createdAt, isOwn }) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${isOwn ? "self" : "other"}`;
    if (id) msgDiv.id = `msg-${id}`;

    const time = new Date(createdAt).toLocaleTimeString();

    msgDiv.innerHTML = isOwn
      ? `<div>${content}</div><small class="msg-time">${time}</small>`
      : `<div class="message-header">${username} ${time}</div><div>${content}</div>`;

    this.messagesDiv.appendChild(msgDiv);
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
  }

  showSystemMessage(text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message system";
    msgDiv.textContent = text;
    this.messagesDiv.appendChild(msgDiv);
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
  }

  editMessageDisplay(messageId, newContent) {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) el.textContent = newContent + " (edited)";
  }

  deleteMessageDisplay(messageId) {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.textContent = "[Message deleted]";
      el.style.opacity = "0.5";
    }
  }

  disconnectTemporarily() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "disconnect",
        userId: this.userId,
        roomId: this.roomId,
        username: this.username,
      }));
      this.ws.close();
    }
  }

  async leaveRoomPermanently() {
    console.log("Leaving room...");
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "leave",
        userId: this.userId,
        roomId: this.roomId,
        username: this.username,
      }));
      this.ws.close();
    }
    try {
      const response = await fetch(`/rooms/${this.roomId}/leave`, { method: "POST" });
      console.log("Removed from database:", response.ok);
    } catch (error) {
      console.error("Error removing from database:", error);
    }
  }
}
// --- Init: read server data from DOM ---
document.addEventListener("DOMContentLoaded", () => {
  const chatData = document.getElementById("chat-data").dataset;

  const chatClient = new ChatClient(
    chatData.userId,
    chatData.username,
    chatData.roomName,
    parseInt(chatData.roomId)
  );

  // Menu toggle
  const menuBtn = document.getElementById("menuBtn");
  const menu = document.getElementById("menu");
  const leaveRoomBtn = document.getElementById("leaveRoomBtn");

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  });

  document.addEventListener("click", () => {
    menu.style.display = "none";
  });

  leaveRoomBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to leave this room?")) {
      await chatClient.leaveRoomPermanently();
      setTimeout(() => { window.location.href = "/rooms"; }, 500);
    }
  });

  const backToRoomsLink = document.querySelector('a[href="/rooms"]');
  backToRoomsLink.addEventListener("click", (e) => {
    e.preventDefault();
    chatClient.disconnectTemporarily();
    setTimeout(() => { window.location.href = "/rooms"; }, 300);
  });

  window.addEventListener("beforeunload", () => {
    if (chatClient.ws) chatClient.ws.close();
  });
});