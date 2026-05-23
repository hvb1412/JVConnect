import { Server } from "socket.io";

let io;

// userId -> socketId
const userSocketMap = new Map();

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log(`[Socket] A user connected: ${socket.id}`);

        // ── join: đăng ký userId và broadcast online ──────────────────────
        socket.on("join", (userId) => {
            if (!userId) return;

            const wasOffline = !userSocketMap.has(userId);
            userSocketMap.set(userId, socket.id);
            console.log(`[Socket] User ${userId} joined with socket ${socket.id}`);

            // Broadcast cho tất cả (trừ chính mình) biết user này online
            if (wasOffline) {
                socket.broadcast.emit("user_online", { userId });
            }
        });

        // ── check_online: client hỏi trạng thái của 1 userId cụ thể ──────
        socket.on("check_online", (userId, callback) => {
            if (typeof callback === "function") {
                callback({ online: userSocketMap.has(userId) });
            }
        });

        // ── disconnect: xóa khỏi map và broadcast offline ─────────────────
        socket.on("disconnect", () => {
            for (const [userId, socketId] of userSocketMap.entries()) {
                if (socketId === socket.id) {
                    userSocketMap.delete(userId);
                    console.log(`[Socket] User ${userId} disconnected`);

                    // Broadcast offline cho tất cả
                    socket.broadcast.emit("user_offline", { userId });
                    break;
                }
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap.get(receiverId);
};

export const isUserOnline = (userId) => {
    return userSocketMap.has(userId);
};
