import User from '../models/User.js';
import Event from '../models/Event.js';
import Report from '../models/Report.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Participation from '../models/Participation.js';

const selectPublicUser = '-password -confirmCode';

export const listUsers = async (req, res) => {
    try {
        const users = await User.find().select(selectPublicUser).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const listAdmins = async (req, res) => {
    try {
        const admins = await User.find({
            $or: [
                { role: 'admin' },
                { email: 'admin@jvconnect.com' },
            ],
        }).select(selectPublicUser).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: admins });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAdminStats = async (req, res) => {
    try {
        const [totalUsers, totalAdmins, totalEvents, activeEvents, totalReports, pendingReports, totalConversations, totalMessages, totalParticipations] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({
                $or: [
                    { role: 'admin' },
                    { email: 'admin@jvconnect.com' },
                ],
            }),
            Event.countDocuments(),
            Event.countDocuments({ status: 'active' }),
            Report.countDocuments(),
            Report.countDocuments({ status: 'pending' }),
            Conversation.countDocuments(),
            Message.countDocuments(),
            Participation.countDocuments(),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalAdmins,
                totalEvents,
                activeEvents,
                totalReports,
                pendingReports,
                totalConversations,
                totalMessages,
                totalParticipations,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAdminOverview = async (req, res) => {
    try {
        const [admins, stats] = await Promise.all([
            User.find({
                $or: [
                    { role: 'admin' },
                    { email: 'admin@jvconnect.com' },
                ],
            }).select(selectPublicUser).sort({ createdAt: -1 }),
            Promise.all([
                User.countDocuments(),
                User.countDocuments({
                    $or: [
                        { role: 'admin' },
                        { email: 'admin@jvconnect.com' },
                    ],
                }),
                Event.countDocuments(),
                Event.countDocuments({ status: 'active' }),
                Report.countDocuments(),
                Report.countDocuments({ status: 'pending' }),
            ]),
        ]);

        const [totalUsers, totalAdmins, totalEvents, activeEvents, totalReports, pendingReports] = stats;

        return res.status(200).json({
            success: true,
            data: {
                admins,
                stats: {
                    totalUsers,
                    totalAdmins,
                    totalEvents,
                    activeEvents,
                    totalReports,
                    pendingReports,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const listReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reporter', 'name email avatarURL')
            .populate('user', 'name email avatarURL')
            .populate('event', 'title imageURL status')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: reports });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
