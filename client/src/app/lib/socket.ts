import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
const SOCKET_URL = "http://localhost:5000";

export const initSocket = (userId: string) => {
    if (!userId) {
        return null;
    }

    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ["websocket"],
            autoConnect: false,
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connect error:", error);
        });
    }

    if (!socket.connected) {
        socket.connect();
    }

    socket.emit("join", userId);
    return socket;
};

export const getSocket = () => {
    if (!socket) {
        throw new Error("Socket.io is not initialized");
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
