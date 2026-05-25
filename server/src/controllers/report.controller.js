import Report from '../models/Report.js';
import User from '../models/User.js';
import Event from '../models/Event.js';

const getAuthUserId = (req) => req.user?.id || req.user?._id || null;

/**
 * POST /api/reports
 * User gửi báo cáo về một user hoặc event.
 * Body: { reportType, reason, detail, userId?, eventId? }
 */
export const submitReport = async (req, res) => {
    try {
        const reporterId = getAuthUserId(req);

        if (!reporterId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { reportType, reason, detail, userId, eventId } = req.body;

        if (!reportType || !reason) {
            return res.status(400).json({
                success: false,
                message: '通報タイプと理由は必須です',
            });
        }

        if (!userId && !eventId) {
            return res.status(400).json({
                success: false,
                message: '通報対象（ユーザーまたはイベント）を指定してください',
            });
        }

        // 自分自身を通報しようとしている場合は拒否
        if (userId && String(userId) === String(reporterId)) {
            return res.status(400).json({
                success: false,
                message: '自分自身を通報することはできません',
            });
        }

        // 対象が存在するか確認
        if (userId) {
            const targetUser = await User.findById(userId).select('_id');
            if (!targetUser) {
                return res.status(404).json({ success: false, message: '対象ユーザーが見つかりません' });
            }
        }

        if (eventId) {
            const targetEvent = await Event.findById(eventId).select('_id');
            if (!targetEvent) {
                return res.status(404).json({ success: false, message: '対象イベントが見つかりません' });
            }
        }

        // 同じ通報が既に存在するか確認（pending のもの）
        const existingQuery = {
            reporter: reporterId,
            status: 'pending',
            ...(userId ? { user: userId } : {}),
            ...(eventId ? { event: eventId } : {}),
        };

        const existing = await Report.findOne(existingQuery);
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'この対象への通報は既に送信済みで審査中です',
            });
        }

        const report = await Report.create({
            reporter: reporterId,
            reportType,
            reason,
            detail: detail || '',
            status: 'pending',
            decision: 'pending',
            ...(userId ? { user: userId } : {}),
            ...(eventId ? { event: eventId } : {}),
        });

        return res.status(201).json({
            success: true,
            message: '通報を受け付けました。管理者が確認します。',
            data: { reportId: report._id },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
