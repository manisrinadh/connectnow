const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3001 });
const clients = new Map();         
const onlineUsers = {};
function broadcastOnlineUsers() {
  const msg = {
    type: "online-users",
    users: Object.keys(onlineUsers),
  };
  for (const ws of Object.values(onlineUsers)) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }
}


wss.on("connection", (ws) => {
  console.log("🔗 Client connected");

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (e) {
      console.error("Invalid JSON:", data);
      return;
    }

    if (msg.senderId) {
      clients.set(msg.senderId, ws);
      onlineUsers[msg.senderId] = ws;
      broadcastOnlineUsers();
    }

    if (msg.text && msg.receiverId) {
      const receiverWs = clients.get(msg.receiverId);
      if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
        receiverWs.send(JSON.stringify(msg));
      }
    }

    if (msg.type === "typing" && msg.receiverId) {
      const receiverWs = clients.get(msg.receiverId);
      if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
        receiverWs.send(JSON.stringify(msg));
      }
    }

    if (
      ["offer", "answer", "candidate"].includes(msg.type) &&
      msg.receiverId
    ) {
      const receiverWs = clients.get(msg.receiverId);
      if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
        receiverWs.send(JSON.stringify(msg));
      }
    }
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
    for (const [id, socket] of clients.entries()) {
      if (socket === ws) {
        clients.delete(id);
        delete onlineUsers[id];
        break;
      }
    }
    broadcastOnlineUsers();
  });
});

console.log("🟢 WebSocket server running on ws://localhost:3001");