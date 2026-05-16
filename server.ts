import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = process.env.PORT || 3000;

  // 内存存储游戏状态 (In-memory game state)
  const rooms: Record<string, any> = {};

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", ({ roomId, playerRole }) => {
      socket.join(roomId);
      console.log(`User ${playerRole} joined room: ${roomId}`);
      
      // 如果房间不存在，初始化状态
      if (!rooms[roomId]) {
        rooms[roomId] = {
          map: null, // 初始由第一个进入的人同步
          currentRole: "planner",
          negotiationAction: null,
          showVote: null,
          showReflection: false,
          stats: null
        };
      }
      
      // 发送当前最新状态给新加入的成员
      socket.emit("sync-init", rooms[roomId]);
    });

    // 监听并广播操作 (Sync Actions)
    socket.on("game-action", ({ roomId, action }) => {
      // 广播给房间内除自己以外的所有人
      socket.to(roomId).emit("remote-action", action);
      console.log(`Action in ${roomId}:`, action.type);
    });

    // 监听并同步全量状态 (Sync Full State - map, status, etc.)
    socket.on("sync-state", ({ roomId, stateKey, value }) => {
      if (rooms[roomId]) {
        rooms[roomId][stateKey] = value;
      }
      socket.to(roomId).emit("remote-state-update", { stateKey, value });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // Vite 协议适配
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
