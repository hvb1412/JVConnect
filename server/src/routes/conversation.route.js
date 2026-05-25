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
} from "../controllers/conversation.controller.js";

const router = express.Router();

// NOTE: /pending phải đứng trước /:id để tránh bị match nhầm
router.get("/", authMiddleware, listConversations);
router.get("/pending", authMiddleware, getPendingConversations);
router.get("/with/:userId", authMiddleware, getConversationWithUser);
router.get("/:id/messages", authMiddleware, getConversationMessages);
router.patch("/:id/read", authMiddleware, markMessagesAsRead);
router.patch("/:id/accept", authMiddleware, acceptConversation);
router.delete("/:id/decline", authMiddleware, declineConversation);

export default router;
