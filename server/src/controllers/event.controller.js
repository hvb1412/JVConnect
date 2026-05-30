import Event from '../models/Event.js';
import Report from '../models/Report.js';
import Friend from '../models/Friend.js';
import Participation from '../models/Participation.js';
import User from '../models/User.js';
import { getIO, emitToMembers } from '../socket.js';
import jwt from 'jsonwebtoken';

const getAuthUserId = (req) => req.user?.id || req.user?._id || null;

const getAuthUserIdFromHeader = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded?.id || decoded?.userId || null;
    } catch {
        return null;
    }
};

const validateEventPayload = (payload) => {
    const errors = [];

    if (!payload.title || !String(payload.title).trim()) {
        errors.push('title is required');
    }

    if (!payload.eventDate || Number.isNaN(new Date(payload.eventDate).getTime())) {
        errors.push('eventDate must be a valid date');
    }

    if (!payload.location || !String(payload.location).trim()) {
        errors.push('location is required');
    }

    return errors;
};

const canManageEvent = (req, event) => {
    const userId = getAuthUserId(req);
    const userRole = req.user?.role;
    const userEmail = String(req.user?.email || '').toLowerCase();
    return userRole === 'admin' || userEmail === 'admin@jvconnect.com' || String(event.organizer) === String(userId);
};

export const listEvents = async (req, res) => {
    try {
        const events = await Event.find({ status: 'active' })
            .populate('organizer', 'name email avatarURL role')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: events });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'name email avatarURL role');

        if (!event || event.status !== 'active') {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        return res.status(200).json({ success: true, data: event });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const createEvent = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const errors = validateEventPayload(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: errors.join(', ') });
        }

        const payload = {
            title: String(req.body.title).trim(),
            eventDate: new Date(req.body.eventDate),
            startTime: String(req.body.startTime || '').trim(),
            endTime: String(req.body.endTime || '').trim(),
            location: String(req.body.location).trim(),
            organizer: req.body.organizer || userId,
            detail: String(req.body.detail || '').trim(),
            imageURL: String(req.body.imageURL || '').trim(),
            status: String(req.body.status || 'active').trim(),
        };

        const event = await Event.create(payload);
        const populatedEvent = await Event.findById(event._id).populate('organizer', 'name email avatarURL role');

        return res.status(201).json({ success: true, data: populatedEvent });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (!canManageEvent(req, event)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const nextPayload = { ...req.body };
        if (nextPayload.eventDate) {
            const eventDate = new Date(nextPayload.eventDate);
            if (Number.isNaN(eventDate.getTime())) {
                return res.status(400).json({ success: false, message: 'eventDate must be a valid date' });
            }
            nextPayload.eventDate = eventDate;
        }

        ['title', 'startTime', 'endTime', 'location', 'detail', 'imageURL', 'status'].forEach((field) => {
            if (typeof nextPayload[field] === 'string') {
                nextPayload[field] = nextPayload[field].trim();
            }
        });

        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, nextPayload, {
            returnDocument: 'after',
            runValidators: true,
        }).populate('organizer', 'name email avatarURL role');

        return res.status(200).json({ success: true, data: updatedEvent });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (!canManageEvent(req, event)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        await Event.findByIdAndDelete(req.params.id);

        return res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getSuggestedEvents = async (req, res) => {
    try {
        const events = await Event.find({ status: 'active', eventDate: { $gte: new Date() } })
            .sort({ eventDate: 1 })
            .limit(5)
            .populate('organizer', 'name email avatarURL role');

        if (events.length === 0) {
             const anyEvents = await Event.find({ status: 'active' })
                 .sort({ eventDate: -1 })
                 .limit(5)
                 .populate('organizer', 'name email avatarURL role');
             return res.status(200).json({ success: true, data: anyEvents });
        }
        return res.status(200).json({ success: true, data: events });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const MAX_PARTICIPANTS = 20

// POST /events/:id/join — đăng ký tham gia (tạo pending request thay vì tham gia ngay)
export const joinEvent = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const event = await Event.findById(id)
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    // Kiểm tra đã được duyệt tham gia chưa
    const approvedParticipation = await Participation.findOne({
      user: userId,
      event: id,
      status: 'approved',
    })
    if (approvedParticipation) {
      return res.status(400).json({ message: 'Already joined' })
    }

    // Kiểm tra đã có pending request chưa
    const existingRequest = await Participation.findOne({
      user: userId,
      event: id,
      status: 'pending',
    })
    if (existingRequest) {
      return res.status(400).json({ message: 'Join request already sent, waiting for approval' })
    }

    // Kiểm tra giới hạn số người tham gia
    if (event.participants.length >= MAX_PARTICIPANTS) {
      return res.status(400).json({ message: 'Event is full' })
    }

    // Tạo participation request mới với status pending
    const participation = await Participation.create({
      user: userId,
      event: id,
      status: 'pending',
    })

    try {
      const admins = await User.find({
        $or: [
          { role: 'admin' },
          { email: 'admin@jvconnect.com' }
        ]
      }).select('_id');
      const adminIds = admins.map(a => String(a._id));
      
      emitToMembers(adminIds, 'new_participation_request', {
        participationId: participation._id,
        eventId: id,
        eventTitle: event.title,
        userId: userId,
        userName: req.user.name || 'ユーザー'
      });
    } catch (err) {
      console.error('Socket notification error:', err);
    }

    res.status(201).json({
      message: 'Join request sent, waiting for admin approval',
      status: 'pending',
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// POST /events/:id/cancel — hủy đăng ký (xóa pending request hoặc rời khỏi sự kiện)
export const cancelJoinEvent = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const event = await Event.findById(id)
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    // Xóa participation record (pending hoặc approved)
    const deleted = await Participation.findOneAndDelete({
      user: userId,
      event: id,
    })

    if (!deleted) {
      return res.status(400).json({ message: 'No participation record found' })
    }

    // Nếu đã approved, xóa khỏi participants array trong Event
    if (deleted.status === 'approved') {
      event.participants = event.participants.filter(
        (participantId) => participantId.toString() !== userId
      )
      await event.save()

      // Xóa khỏi group chat của sự kiện nếu có
      import('../models/Conversation.js').then(async ({ default: Conversation }) => {
        const groupConv = await Conversation.findOne({ type: 'group', eventId: id })
        if (groupConv) {
          groupConv.members = groupConv.members.filter(m => m.toString() !== userId)
          await groupConv.save()
          
          import('../socket.js').then(({ emitToMembers }) => {
            const memberIds = groupConv.members.map(m => m.toString())
            emitToMembers(memberIds, 'group_chat_updated', {
              conversationId: groupConv._id
            })
          }).catch(console.error)
        }
      }).catch(console.error)
    }

    res.json({
      message: 'Participation cancelled successfully',
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET /events/:id/participation-status — lấy trạng thái đăng ký của user hiện tại
export const getMyParticipationStatus = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const participation = await Participation.findOne({
      user: userId,
      event: id,
    })

    if (!participation) {
      return res.status(200).json({ success: true, data: { status: 'none' } })
    }

    return res.status(200).json({
      success: true,
      data: { status: participation.status, participationId: participation._id },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


export const reportEvent = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const report = await Report.create({
      event: id,
      user: req.user.id,
      reason,
    })

    res.status(201).json({
      message: 'Report submitted',
      report,
    })
  } catch (error) {
    res.status(500).json({
      message: error.message,
    })
  }
}
