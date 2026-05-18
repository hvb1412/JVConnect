import User from "../models/User.js";
import jwt from "jsonwebtoken";

const getAuthUserIdFromHeader = (req) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) return null;

    const token = authHeader.split(" ")[1];
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded?.id || decoded?.userId || null;
    } catch {
        return null;
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select(
            "-password -confirmCode",
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
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

        const { name, avatarURL, area, occupation, introduction } = req.body;

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
            },
        ).select("-password -confirmCode");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
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

export const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select("-password");

        if (!user) {
            return res
                .status(404)
                .json({ message: "Không tìm thấy người dùng" });
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res
                .status(400)
                .json({ message: "ID người dùng không hợp lệ" });
        }
        res.status(500).json({ message: "Lỗi Server" });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { keyword, area, occupation } = req.query;
        const currentUserId = getAuthUserIdFromHeader(req);
        let query = {};

        if (keyword) {
            query.name = { $regex: keyword, $options: "i" };
        }
        if (area) {
            query.area = { $regex: area, $options: "i" };
        }
        if (occupation) {
            query.occupation = { $regex: occupation, $options: "i" };
        }

        if (currentUserId) {
            query._id = { $ne: currentUserId };
        }

        const users = await User.find(query).select("-password -confirmCode");

        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server" });
    }
};
