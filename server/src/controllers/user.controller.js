import { User } from "../models/index.js";

export const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        // Tìm user theo ID và loại bỏ trường password không trả về
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
        // Bắt lỗi nếu ID không đúng định dạng ObjectId của MongoDB
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
        const area = req.query.area;
        const occupation = req.query.occupation;
        const keyword = req.query.keyword;

        const users = await User.find({
            name: { $regex: keyword || "", $options: "i" },
            area: { $regex: area || "", $options: "i" },
            occupation: { $regex: occupation || "", $options: "i" },
        }).select("-password");

        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server" });
    }
};
