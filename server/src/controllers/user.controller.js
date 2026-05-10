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
