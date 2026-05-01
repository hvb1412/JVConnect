import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
    User,
    Event,
    Friend,
    FriendRequest,
    Conversation,
    Message,
    Participation,
    Report
} from './models/index.js';

dotenv.config({ path: '.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const users = [
    { email: 'admin@jvconnect.com', password: 'password123', name: 'Admin JVConnect', area: 'Hà Nội', occupation: 'Software Engineer', introduction: 'Quản trị viên hệ thống JVConnect.' },
    { email: 'BHV@jvconnect.com', password: 'password123', name: 'Hoàng Văn Bình', area: 'Hải Phòng', occupation: 'Sinh viên', introduction: 'Xin chào, mình đang học ITSS.' },
    { email: 'VNTK2@jvconnect.com', password: 'password123', name: 'Nguyễn Thị Khánh Vân', area: 'Bắc Ninh', occupation: 'Designer', introduction: 'Thiết kế đồ họa tự do.' },
    { email: 'BLT3@jvconnect.com', password: 'password123', name: 'Lê Thái Bảo', area: 'Hải Phòng', occupation: 'Freelancer', introduction: 'Rất vui được làm quen.' }
];

const seedData = async () => {
    try {
        await connectDB();

        // 1. Xóa toàn bộ dữ liệu cũ của tất cả các bảng
        await User.deleteMany();
        await Event.deleteMany();
        await Friend.deleteMany();
        await FriendRequest.deleteMany();
        await Conversation.deleteMany();
        await Message.deleteMany();
        await Participation.deleteMany();
        await Report.deleteMany();


        // 2. Tạo Users
        const createdUsers = await User.insertMany(users);


        const admin = createdUsers[0];
        const userA = createdUsers[1];
        const userB = createdUsers[2];
        const userC = createdUsers[3];

        // 3. Tạo Events do Admin tổ chức
        const events = [
            { title: 'Giao lưu văn hóa Việt - Nhật', eventDate: new Date('2026-06-15'), startTime: '08:00', endTime: '12:00', location: 'Đại học Bách Khoa Hà Nội', organizer: admin._id, detail: 'Buổi giao lưu văn hóa, trao đổi ngôn ngữ.', status: 'active' },
            { title: 'Hội thảo: Cơ hội việc làm IT tại Nhật Bản', eventDate: new Date('2026-07-20'), startTime: '14:00', endTime: '17:00', location: 'Online qua Zoom', organizer: admin._id, detail: 'Chia sẻ kinh nghiệm làm việc.', status: 'active' }
        ];
        const createdEvents = await Event.insertMany(events);


        // 4. Tạo Tham gia sự kiện (Participation)
        await Participation.insertMany([
            { user: userA._id, event: createdEvents[0]._id },
            { user: userB._id, event: createdEvents[0]._id },
            { user: userC._id, event: createdEvents[1]._id },
        ]);


        // 5. Tạo Bạn bè (Friend)
        await Friend.insertMany([
            { user1: userA._id, user2: userB._id },
            { user1: admin._id, user2: userA._id }
        ]);


        // 6. Tạo Yêu cầu kết bạn (Friend Request)
        await FriendRequest.insertMany([
            { sender: userC._id, receiver: userB._id },
            { sender: userC._id, receiver: userA._id }
        ]);


        // 7. Tạo Cuộc trò chuyện (Conversation) & Tin nhắn (Message)
        // Lưu ý: schema Conversation có hàm pre-validate tự sắp xếp user1, user2
        const convo1 = await Conversation.create({ user1: userA._id, user2: userB._id });

        await Message.insertMany([
            { sender: userA._id, conversation: convo1._id, content: 'Chào B, bạn có khỏe không?', sendTime: '10:00', seenStatus: true },
            { sender: userB._id, conversation: convo1._id, content: 'Mình khỏe, A dạo này thế nào?', sendTime: '10:05', seenStatus: true },
            { sender: userA._id, conversation: convo1._id, content: 'Mình đang làm ITSS.', sendTime: '10:10', seenStatus: false }
        ]);


        // 8. Tạo Báo cáo (Report)
        await Report.insertMany([
            { reporter: userB._id, reportType: 'Spam', user: userC._id, status: 'pending', reason: 'Nhắn tin rác quá nhiều.', detail: 'Gửi link quảng cáo liên tục.' },
            { reporter: userA._id, reportType: 'EventFake', event: createdEvents[1]._id, status: 'resolved', reason: 'Sự kiện ảo', detail: 'Không thấy thông tin cụ thể.' }
        ]);


        console.log('--- KHỞI TẠO TẤT CẢ DỮ LIỆU THÀNH CÔNG ---');
        process.exit();
    } catch (error) {
        console.error(`Lỗi: ${error}`);
        process.exit(1);
    }
};

seedData();
