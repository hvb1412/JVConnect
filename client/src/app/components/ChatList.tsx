import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MessageCircle } from "lucide-react";
import { getConversations, UiConversation } from "../lib/conversationApi";
import { initSocket } from "../lib/socket";

export function ChatList({ max = 5 }: { max?: number }) {
    const [items, setItems] = useState<UiConversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const data = await getConversations();
                if (!mounted) return;
                setItems(data.slice(0, max));
            } catch (err) {
                console.error("Failed to load conversations", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();

        // socket realtime updates
        const currentUserId = localStorage.getItem("userId") || "";
        const socket = initSocket(currentUserId);

        const handleReceive = (payload: any) => {
            try {
                const msg = payload?.message;
                if (!msg || !msg.conversation?._id) return;

                setItems((prev) => {
                    const convId = String(msg.conversation._id);
                    const index = prev.findIndex(
                        (c) => String(c.id) === convId,
                    );

                    const partner =
                        msg.sender?._id === currentUserId
                            ? null
                            : (msg.sender as any);
                    const latestMessageText = msg.content || "";

                    if (index !== -1) {
                        const updated = [...prev];
                        updated[index] = {
                            ...updated[index],
                            lastMessage: latestMessageText,
                            time: msg.sendTime || updated[index].time,
                            unread:
                                (updated[index].unread || 0) +
                                (String(msg.sender._id) !== currentUserId
                                    ? 1
                                    : 0),
                        };
                        // move to top
                        const item = updated.splice(index, 1)[0];
                        return [item, ...updated].slice(0, max);
                    }

                    // new conversation — prepend
                    const newConv: UiConversation = {
                        id: convId,
                        partnerId: partner?._id || "",
                        name: partner?.name || "Unknown",
                        avatar: partner?.avatarURL || "",
                        lastMessage: latestMessageText,
                        time: msg.sendTime || "",
                        unread:
                            String(msg.sender._id) !== currentUserId ? 1 : 0,
                    };

                    return [newConv, ...prev].slice(0, max);
                });
            } catch (e) {
                console.error(e);
            }
        };

        if (socket) {
            socket.on("receive_message", handleReceive);
        }

        return () => {
            mounted = false;
            if (socket) socket.off("receive_message", handleReceive);
        };
    }, [max]);

    if (loading) {
        return <div className="text-sm text-gray-500">読み込み中...</div>;
    }

    return (
        <>
            {items.length === 0 && (
                <div className="text-sm text-gray-500">
                    現在、チャットはありません。
                </div>
            )}
            {items.map((chat) => (
                <Link
                    key={chat.id}
                    to={`/user/chat/${chat.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <Avatar className="h-10 w-10">
                        {chat.avatar ? (
                            <AvatarImage src={chat.avatar} />
                        ) : (
                            <AvatarFallback>{chat.name[0]}</AvatarFallback>
                        )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">
                                {chat.name}
                            </p>
                            {chat.unread > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                    {chat.unread}
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                            {chat.lastMessage}
                        </p>
                        <p className="text-xs text-gray-400">{chat.time}</p>
                    </div>
                </Link>
            ))}
            <Button asChild variant="ghost" className="w-full" size="sm">
                <Link
                    to="/user/chats"
                    className="inline-flex w-full items-center justify-center"
                >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    すべて表示
                </Link>
            </Button>
        </>
    );
}

export default ChatList;
