import User from "../models/User.js";

export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -confirmCode');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: user,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
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
        ).select('-password -confirmCode');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: updatedUser,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
