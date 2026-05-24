import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./config";

let socket: Socket | null = null;

export const initSocket = (userId: string) => {
    if (!userId) return null;

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
    if (!socket) throw new Error("Socket.io is not initialized");
    return socket;
};

/**
 * Chờ socket connect xong rồi hỏi server xem userId có online không.
 * Dùng socket ack callback — không cần REST API.
 * Timeout 3s nếu không kết nối được → trả false.
 */
export const checkOnline = (userId: string): Promise<boolean> => {
    return new Promise((resolve) => {
        if (!socket) {
            resolve(false);
            return;
        }

        const query = () => {
            const timer = setTimeout(() => resolve(false), 3000);
            socket!.emit("check_online", userId, (res: { online: boolean }) => {
                clearTimeout(timer);
                resolve(res?.online ?? false);
            });
        };

        if (socket.connected) {
            query();
        } else {
            // Chờ connect xong mới hỏi (max 3s)
            const connectTimer = setTimeout(() => resolve(false), 3000);
            socket.once("connect", () => {
                clearTimeout(connectTimer);
                query();
            });
        }
    });
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
