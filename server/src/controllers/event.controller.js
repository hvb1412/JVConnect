import Event from '../models/Event.js';

const getAuthUserId = (req) => req.user?.id || req.user?._id || null;

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
        const events = await Event.find()
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

        if (!event) {
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
