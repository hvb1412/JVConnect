import User from '../models/User.js';
import Event from '../models/Event.js';
import Report from '../models/Report.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Participation from '../models/Participation.js';

const selectPublicUser = '-password -confirmCode';

export const listUsers = async (req, res) => {
    try {
        const users = await User.find({
            role: { $ne: 'admin' },
            email: { $ne: 'admin@jvconnect.com' }
        }).select(selectPublicUser).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserRegistrationStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({
            role: { $ne: 'admin' },
            email: { $ne: 'admin@jvconnect.com' }
        });

        // Get registrations for the last 30 days (daily stats)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newRegistrations = await User.aggregate([
            {
                $match: {
                    role: { $ne: 'admin' },
                    email: { $ne: 'admin@jvconnect.com' },
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 } // Sort by date ascending
            }
        ]);

        return res.status(200).json({ 
            success: true, 
            data: { 
                totalUsers, 
                newRegistrations // [{ _id: '2023-10-01', count: 5 }, ...]
            } 
        });
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
            .populate('decidedBy', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: reports });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('reporter', 'name email avatarURL')
            .populate('user', 'name email avatarURL role')
            .populate('event', 'title imageURL status detail location')
            .populate('decidedBy', 'name email');

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        return res.status(200).json({ success: true, data: report });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const approveReport = async (req, res) => {
    try {
        const { banDays = 7, reason = '' } = req.body;
        const days = Number(banDays);
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        // Update report
        report.decision = 'approved';
        report.decisionReason = reason;
        report.decisionDate = new Date();
        report.decidedBy = req.user.id;
        report.banDays = days;
        await report.save();

        // If reporting a user, apply ban
        if (report.user) {
            const user = await User.findById(report.user);
            if (user) {
                const now = new Date();
                user.isRestricted = true;
                user.latestBanDate = now;

                if (days <= 0) {
                    // Permanent ban — no expiry
                    user.restrictedUntil = null;
                } else {
                    const banUntil = new Date(now);
                    banUntil.setDate(banUntil.getDate() + days);
                    user.restrictedUntil = banUntil;
                }
                await user.save();
            }
        }

        // If reporting an event, mark it as deleted or hidden
        if (report.event) {
            await Event.findByIdAndUpdate(report.event, { status: 'inactive' });
        }

        const updatedReport = await Report.findById(req.params.id)
            .populate('reporter', 'name email avatarURL')
            .populate('user', 'name email avatarURL')
            .populate('event', 'title imageURL status')
            .populate('decidedBy', 'name email');

        return res.status(200).json({ success: true, message: 'Report approved', data: updatedReport });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const rejectReport = async (req, res) => {
    try {
        const { reason = '' } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        report.decision = 'rejected';
        report.decisionReason = reason;
        report.decisionDate = new Date();
        report.decidedBy = req.user.id;
        await report.save();

        const updatedReport = await Report.findById(req.params.id)
            .populate('reporter', 'name email avatarURL')
            .populate('user', 'name email avatarURL')
            .populate('event', 'title imageURL status')
            .populate('decidedBy', 'name email');

        return res.status(200).json({ success: true, message: 'Report rejected', data: updatedReport });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleUserRestriction = async (req, res) => {
    try {
        const { banDays = 7 } = req.body;
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isRestricted) {
            // Unlock user
            user.isRestricted = false;
            user.restrictedUntil = null;
        } else {
            // Restrict user
            const restrictUntil = new Date();
            restrictUntil.setDate(restrictUntil.getDate() + banDays);
            user.isRestricted = true;
            user.restrictedUntil = restrictUntil;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: user.isRestricted ? 'User restricted' : 'User unrestricted',
            data: user,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const listEvents = async (req, res) => {
    try {
        const events = await Event.find()
            .populate('organizer', 'name email avatarURL')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: events });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createEventByAdmin = async (req, res) => {
    try {
        const { title, eventDate, startTime, endTime, location, detail, imageURL, status, organizer } = req.body;

        if (!title || !eventDate || !location) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const event = await Event.create({
            title,
            eventDate: new Date(eventDate),
            startTime: startTime || '',
            endTime: endTime || '',
            location,
            detail: detail || '',
            imageURL: imageURL || '',
            status: status || 'active',
            organizer: organizer || req.user.id,
        });

        const populatedEvent = await Event.findById(event._id).populate('organizer', 'name email avatarURL');

        return res.status(201).json({ success: true, data: populatedEvent });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateEventByAdmin = async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const updateData = { ...req.body };
        if (updateData.eventDate) {
            updateData.eventDate = new Date(updateData.eventDate);
        }

        const updatedEvent = await Event.findByIdAndUpdate(req.params.eventId, updateData, {
            new: true,
            runValidators: true,
        }).populate('organizer', 'name email avatarURL');

        return res.status(200).json({ success: true, data: updatedEvent });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteEventByAdmin = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.eventId);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        return res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select(selectPublicUser);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
