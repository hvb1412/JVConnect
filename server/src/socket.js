import { Server } from "socket.io";

let io;

// Giữ danh sách user đang online (userId -> socketId)
const userSocketMap = new Map();

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Cập nhật domain FE của bạn nếu cần
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`[Socket] A user connected: ${socket.id}`);

        // Người dùng join với userId
        socket.on("join", (userId) => {
            if (userId) {
                userSocketMap.set(userId, socket.id);
                console.log(`[Socket] User ${userId} joined with socket ${socket.id}`);
            }
        });

        // Người dùng disconnect
        socket.on("disconnect", () => {
            for (let [userId, socketId] of userSocketMap.entries()) {
                if (socketId === socket.id) {
                    userSocketMap.delete(userId);
                    console.log(`[Socket] User ${userId} disconnected`);
                    break;
                }
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap.get(receiverId);
};
