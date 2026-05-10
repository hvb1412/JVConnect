import User from "../models/User.js";

export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        return res.status(200).json(user);

    } catch (error) {
        return res.status(500).json({
            message: 'Server error',
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            name,
            avatarURL,
            area,
            occupation,
            introduction,
        } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                name,
                avatarURL,
                area,
                occupation,
                introduction,
            },
            {
                new: true,
            }
        ).select('-password');

        return res.status(200).json(updatedUser);

    } catch (error) {
        return res.status(500).json({
            message: 'Server error',
        });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
        }
        res.status(500).json({ message: 'Lỗi Server' });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { keyword, area, occupation } = req.query;
        let query = {};

        if (keyword) {
            query.name = { $regex: keyword, $options: 'i' };
        }
        if (area) {
            query.area = { $regex: area, $options: 'i' };
        }
        if (occupation) {
            query.occupation = { $regex: occupation, $options: 'i' };
        }

        const users = await User.find(query).select('-password');

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi Server' });
    }
};
