import assert from 'node:assert/strict';

import { deleteFriend, getFriendList } from '../src/controllers/friend.controller.js';
import { sendMessage } from '../src/controllers/message.controller.js';
import Friend from '../src/models/Friend.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';
import User from '../src/models/User.js';

function createRes() {
    return {
        statusCode: 200,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.payload = data;
            return this;
        },
    };
}

async function run() {
    const original = {
        friendFind: Friend.find,
        friendFindOneAndDelete: Friend.findOneAndDelete,
        friendExists: Friend.exists,
        conversationFindById: Conversation.findById,
        conversationFindOne: Conversation.findOne,
        conversationCreate: Conversation.create,
        messageCreate: Message.create,
        messageFindById: Message.findById,
        userFindById: User.findById,
    };

    try {
        {
            const req = { user: null };
            const res = createRes();
            await getFriendList(req, res);
            assert.equal(res.statusCode, 401);
        }

        {
            Friend.find = () => ({
                populate() {
                    return this;
                },
                sort: async () => [
                    {
                        _id: 'friendship-1',
                        user1: { _id: 'u1', name: 'User 1' },
                        user2: { _id: 'u2', name: 'User 2' },
                    },
                ],
            });

            const req = { user: { id: 'u1' } };
            const res = createRes();
            await getFriendList(req, res);
            assert.equal(res.statusCode, 200);
            assert.equal(res.payload.success, true);
            assert.equal(res.payload.data.length, 1);
            assert.equal(res.payload.data[0].friend.name, 'User 2');
        }

        {
            Friend.findOneAndDelete = async () => null;
            const req = { user: { id: 'u1' }, params: { friendId: 'u2' } };
            const res = createRes();
            await deleteFriend(req, res);
            assert.equal(res.statusCode, 404);
        }

        {
            Friend.findOneAndDelete = async () => ({ _id: 'friendship-1' });
            const req = { user: { id: 'u1' }, params: { friendId: 'u2' } };
            const res = createRes();
            await deleteFriend(req, res);
            assert.equal(res.statusCode, 200);
            assert.equal(res.payload.success, true);
        }

        {
            const req = { user: { id: 'u1' }, body: { receiverId: 'u2', content: '' } };
            const res = createRes();
            await sendMessage(req, res);
            assert.equal(res.statusCode, 400);
        }

        {
            User.findById = () => ({
                select: async () => ({ _id: 'u2' }),
            });
            Friend.exists = async () => null;
            const req = { user: { id: 'u1' }, body: { receiverId: 'u2', content: 'Hello' } };
            const res = createRes();
            await sendMessage(req, res);
            assert.equal(res.statusCode, 403);
        }

        {
            User.findById = () => ({
                select: async () => ({ _id: 'u2' }),
            });
            Friend.exists = async () => ({ _id: 'friendship-1' });
            Conversation.findOne = async () => null;
            Conversation.create = async () => ({ _id: 'conv-1', user1: 'u1', user2: 'u2' });
            Message.create = async () => ({ _id: 'msg-1' });
            Message.findById = () => ({
                populate() {
                    return this;
                },
            });

            const req = { user: { id: 'u1' }, body: { receiverId: 'u2', content: 'Hello world' } };
            const res = createRes();
            await sendMessage(req, res);
            assert.equal(res.statusCode, 201);
            assert.equal(res.payload.success, true);
            assert.equal(res.payload.data.receiverId, 'u2');
        }

        console.log('FRIEND_MESSAGE_CONTROLLER_TEST_OK');
    } finally {
        Friend.find = original.friendFind;
        Friend.findOneAndDelete = original.friendFindOneAndDelete;
        Friend.exists = original.friendExists;
        Conversation.findById = original.conversationFindById;
        Conversation.findOne = original.conversationFindOne;
        Conversation.create = original.conversationCreate;
        Message.create = original.messageCreate;
        Message.findById = original.messageFindById;
        User.findById = original.userFindById;
    }
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
