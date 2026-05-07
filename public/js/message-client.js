class MessageClient {
  constructor(userId, username, roomName, roomId) {
    this.userId = userId;
    this.username = username;
    this.roomName = roomName;
    this.roomId = roomId;
    this.ws = null;

    this.messagesDiv = document.getElementById("messages");
    this.messageForm = document.getElementById("messageForm");
    this.messageInput = document.getElementById("messageInput");

    console.log("Message Client initialized:", { userId, username, roomId });
    this.connect();
  }

  connect() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log("Connecting to WebSocket:", wsUrl);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("✅ WebSocket connected!");
      this.messagesDiv.innerHTML = "";
      this.showSystemMessage("Connected to room");
      this.joinRoom();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 Received:", data.type, data);
        this.handleMessage(data);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("🔌 WebSocket disconnected");
      this.showSystemMessage("Disconnected");
      this.messageInput.disabled = true;
    };

    this.ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
      this.showSystemMessage("Connection error!");
    };

    this.messageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.sendMessage();
    });
  }

  joinRoom() {
    console.log("Sending join message...");
    this.ws.send(
      JSON.stringify({
        type: "join",
        userId: this.userId,
        roomId: this.roomId,
        username: this.username,
      })
    );
  }

  sendMessage() {
    const content = this.messageInput.value.trim();
    if (!content || !this.roomId || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    console.log("Sending message with tempId:", tempId);

    this.displayMessage({
      id: tempId,
      username: this.username,
      content,
      createdAt: new Date().toISOString(),
      isOwn: true,
    });

    this.ws.send(
      JSON.stringify({
        type: "message",
        userId: this.userId,
        roomId: this.roomId,
        username: this.username,
        content,
        tempId,
      })
    );

    this.messageInput.value = "";
    this.messageInput.focus();
  }

  sendEditMessage(messageId, newContent) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    console.log("✏️ Sending edit:", messageId, newContent);
    this.ws.send(
      JSON.stringify({
        type: "edit_message",
        userId: this.userId,
        messageId: messageId,
        content: newContent,
      })
    );
  }

  sendDeleteMessage(messageId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    console.log("🗑️ Sending delete:", messageId);
    this.ws.send(
      JSON.stringify({
        type: "delete_message",
        userId: this.userId,
        messageId: messageId,
      })
    );
  }

  handleMessage(data) {
    switch (data.type) {
      case "joined":
        console.log("Joined room!");
        if (data.history && Array.isArray(data.history)) {
          console.log(`Loading ${data.history.length} past messages`);
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
        console.log("Message confirmed:", data.id);
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
        console.log("Message edited:", data.messageId);
        this.editMessageDisplay(data.messageId, data.content);
        break;

      case "message_deleted":
        console.log("Message deleted:", data.messageId);
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
  msgDiv.id = `msg-${id}`;

  // Username/header
  const nameEl = document.createElement("strong");
  nameEl.textContent = username;
  msgDiv.appendChild(nameEl);

  // Content
  const contentEl = document.createElement("p");
  contentEl.className = "message-content";
  contentEl.textContent = content;
  msgDiv.appendChild(contentEl);

  // Time
  const timeEl = document.createElement("small");
  timeEl.className = "message-time";
  timeEl.textContent = new Date(createdAt).toLocaleTimeString();
  msgDiv.appendChild(timeEl);

  // Menu button (only for own messages)
  if (isOwn) {
    const menuBtn = document.createElement("button");
    menuBtn.className = "message-menu-btn";
    menuBtn.textContent = "⋯";
    
    // Create dropdown menu
    const menu = document.createElement("div");
    menu.className = "message-dropdown";
    
    // Edit option
    const editBtn = document.createElement("button");
    editBtn.className = "dropdown-option";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      const newContent = prompt("Edit message:", content);
      if (newContent && newContent.trim()) {
        this.sendEditMessage(id, newContent.trim());
        menu.style.display = "none";
      }
    });
    
    // Delete option
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "dropdown-option dropdown-option--danger";
    deleteBtn.textContent =  "Delete";
    deleteBtn.addEventListener("click", () => {
      if (confirm("Delete this message?")) {
        this.sendDeleteMessage(id);
        menu.style.display = "none";
      }
    });
    
    menu.appendChild(editBtn);
    menu.appendChild(deleteBtn);
    
    // Toggle menu on button click
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    });
    
    // Close menu when clicking outside
    document.addEventListener("click", () => {
      menu.style.display = "none";
    });
    
    msgDiv.appendChild(menuBtn);
    msgDiv.appendChild(menu);
  }

  this.messagesDiv.appendChild(msgDiv);
  this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
}

  createMessageMenu(messageId, content) {
    const wrapper = document.createElement("div");
    wrapper.className = "message-menu-wrapper";

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.className = "message-action-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      const newContent = prompt("Edit your message:", content);
      if (newContent !== null && newContent.trim()) {
        this.sendEditMessage(messageId, newContent.trim());
      }
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "message-action-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      if (confirm("Delete this message?")) {
        this.sendDeleteMessage(messageId);
      }
    });

    wrapper.appendChild(editBtn);
    wrapper.appendChild(deleteBtn);
    return wrapper;
  }

  editMessageDisplay(messageId, newContent) {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      const contentArea = el.querySelector(".message-content");
      if (contentArea) {
        contentArea.textContent = newContent;
        
        if (!el.querySelector(".edited-tag")) {
          const editedTag = document.createElement("span");
          editedTag.className = "edited-tag";
          editedTag.textContent = " (edited)";
          contentArea.appendChild(editedTag);
        }
      }
    }
  }

  deleteMessageDisplay(messageId) {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      const contentArea = el.querySelector(".message-content");
      if (contentArea) {
        contentArea.textContent = "[Message deleted]";
        contentArea.style.fontStyle = "italic";
        el.style.opacity = "0.5";
        
        const menu = el.querySelector(".message-menu-wrapper");
        if (menu) menu.remove();
      }
    }
  }

  showSystemMessage(text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message system";
    msgDiv.textContent = text || "System message";
    this.messagesDiv.appendChild(msgDiv);
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
  }

  disconnectTemporarily() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "disconnect",
          userId: this.userId,
          roomId: this.roomId,
          username: this.username,
        })
      );
      this.ws.close();
    }
  }

  async leaveRoomPermanently() {
    console.log("Leaving room...");
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "leave",
          userId: this.userId,
          roomId: this.roomId,
          username: this.username,
        })
      );
      this.ws.close();
    }
    try {
      const response = await fetch(`/rooms/${this.roomId}/leave`, {
        method: "POST",
      });
      console.log("Left room:", response.ok);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  }
}

// PAGE INIT
document.addEventListener("DOMContentLoaded", () => {
  const messageData = document.getElementById("message-data").dataset;

  const messageClient = new MessageClient(
    messageData.userId,
    messageData.username,
    messageData.roomName,
    parseInt(messageData.roomId)
  );

  // Room menu
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
      await messageClient.leaveRoomPermanently();
      setTimeout(() => {
        window.location.href = "/rooms";
      }, 500);
    }
  });

  // Back button
  const backToRoomsLink = document.querySelector('a[href="/rooms"]');
  if (backToRoomsLink) {
    backToRoomsLink.addEventListener("click", (e) => {
      e.preventDefault();
      messageClient.disconnectTemporarily();
      setTimeout(() => {
        window.location.href = "/rooms";
      }, 300);
    });
  }

  // Cleanup
  window.addEventListener("beforeunload", () => {
    if (messageClient.ws) messageClient.ws.close();
  });
});