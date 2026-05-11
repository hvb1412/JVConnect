import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import Friend from '../src/models/Friend.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';
import User from '../src/models/User.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const BASE_URL = 'http://localhost:5000/api';

const timestamp = Date.now();
const userAEmail = `itest_a_${timestamp}@example.com`;
const userBEmail = `itest_b_${timestamp}@example.com`;

let userA;
let userB;
let conversationId;

async function jsonRequest(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();
    return { response, data };
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    try {
        userA = await User.create({
            email: userAEmail,
            password: 'password123',
            name: 'Integration A',
        });

        userB = await User.create({
            email: userBEmail,
            password: 'password123',
            name: 'Integration B',
        });

        await Friend.create({ user1: userA._id, user2: userB._id });

        const token = jwt.sign({ id: String(userA._id) }, JWT_SECRET, { expiresIn: '1h' });
        const authHeaders = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };

        const friendListResult = await jsonRequest('/friends', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        assert.equal(friendListResult.response.status, 200);
        assert.equal(friendListResult.data.success, true);
        assert.ok(Array.isArray(friendListResult.data.data));
        assert.ok(
            friendListResult.data.data.some((item) => String(item.friend?._id) === String(userB._id)),
            'Friend list should contain created friend'
        );

        const sendMessageResult = await jsonRequest('/messages', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                receiverId: String(userB._id),
                content: 'integration test message',
            }),
        });

        assert.equal(sendMessageResult.response.status, 201);
        assert.equal(sendMessageResult.data.success, true);
        assert.equal(String(sendMessageResult.data.data.receiverId), String(userB._id));

        conversationId = sendMessageResult.data.data.message?.conversation?._id;

        const deleteFriendResult = await jsonRequest(`/friends/${String(userB._id)}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        assert.equal(deleteFriendResult.response.status, 200);
        assert.equal(deleteFriendResult.data.success, true);

        console.log('INTEGRATION_FRIEND_MESSAGE_OK');
    } finally {
        if (conversationId) {
            await Message.deleteMany({ conversation: conversationId });
            await Conversation.deleteOne({ _id: conversationId });
        }

        if (userA && userB) {
            await Friend.deleteMany({
                $or: [
                    { user1: userA._id, user2: userB._id },
                    { user1: userB._id, user2: userA._id },
                ],
            });
        }

        if (userA) {
            await User.deleteOne({ _id: userA._id });
        }

        if (userB) {
            await User.deleteOne({ _id: userB._id });
        }

        await mongoose.disconnect();
    }
}

run().catch(async (error) => {
    console.error(error);

    try {
        await mongoose.disconnect();
    } catch {
        // ignore disconnect errors
    }

    process.exitCode = 1;
});
