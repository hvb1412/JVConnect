import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
    listConversations,
    getPendingConversations,
    getConversationMessages,
    getConversationWithUser,
    markMessagesAsRead,
    acceptConversation,
    declineConversation,
    createGroupChat,
    addMemberToGroup,
    leaveGroup,
    getPinnedMessages,
} from "../controllers/conversation.controller.js";

const router = express.Router();

// NOTE: /pending và /group phải đứng trước /:id để tránh bị match nhầm
router.get("/", authMiddleware, listConversations);
router.get("/pending", authMiddleware, getPendingConversations);
router.get("/with/:userId", authMiddleware, getConversationWithUser);
router.get("/:id/messages", authMiddleware, getConversationMessages);
router.get("/:id/pinned", authMiddleware, getPinnedMessages);
router.patch("/:id/read", authMiddleware, markMessagesAsRead);
router.patch("/:id/accept", authMiddleware, acceptConversation);
router.delete("/:id/decline", authMiddleware, declineConversation);

// Group chat routes
router.post("/group", authMiddleware, createGroupChat);
router.post("/:id/members", authMiddleware, addMemberToGroup);
router.delete("/:id/members/me", authMiddleware, leaveGroup);

export default router;
