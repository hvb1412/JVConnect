import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
    listConversations,
    getConversationMessages,
    getConversationWithUser,
    markMessagesAsRead,
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.get("/", authMiddleware, listConversations);
router.get("/with/:userId", authMiddleware, getConversationWithUser);
router.get("/:id/messages", authMiddleware, getConversationMessages);
router.patch("/:id/read", authMiddleware, markMessagesAsRead);

export default router;
