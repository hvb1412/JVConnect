# JVConnect

**JVConnect** là một nền tảng mạng xã hội kết nối người dùng, cho phép các thành viên tìm kiếm, kết bạn, tham gia sự kiện, và giao tiếp với nhau. Dự án này được xây dựng với công nghệ web hiện đại theo kiến trúc client-server.

## 📋 Mục lục

- [Giới thiệu Project](#giới-thiệu-project)
- [Yêu cầu Hệ thống](#yêu-cầu-hệ-thống)
- [Công nghệ Sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt Môi trường](#cài-đặt-môi-trường)
- [Cấu hình Biến Môi trường](#cấu-hình-biến-môi-trường)
- [Cài đặt Dependencies](#cài-đặt-dependencies)
- [Cấu hình Database](#cấu-hình-database)
- [Khởi chạy Project](#khởi-chạy-project)
- [Xây dựng Production](#xây-dựng-production)
- [Cấu trúc Thư mục](#cấu-trúc-thư-mục)
- [Các Endpoints API Chính](#các-endpoints-api-chính)
- [Các Command Hữu ích](#các-command-hữu-ích)
- [Troubleshooting](#troubleshooting)
- [Đóng góp & Hỗ trợ](#đóng-góp--hỗ-trợ)

---

## 🎯 Giới thiệu Project

JVConnect là một ứng dụng web full-stack cho phép người dùng:

- **Xác thực & Tài khoản**: Đăng ký, đăng nhập, xác minh OTP, đặt lại mật khẩu
- **Kết bạn**: Tìm kiếm người dùng, gửi yêu cầu kết bạn, quản lý danh sách bạn bè
- **Sự kiện**: Tạo, duyệt, tham gia sự kiện, xem danh sách sự kiện đã tham gia
- **Nhắn tin**: Trò chuyện trực tiếp giữa các người dùng
- **Quản trị**: Dashboard admin để quản lý người dùng, sự kiện, báo cáo
- **Tính năng Bổ sung**: Đăng ký, thanh toán lịch sử, hạn chế tài khoản

---

## 💻 Yêu cầu Hệ thống

| Yêu cầu | Phiên bản tối thiểu | Ghi chú |
|---------|-------------------|--------|
| Node.js | 16.0.0 | Khuyến nghị 18.x+ |
| npm     | 8.0.0 | Hoặc yarn/pnpm |
| MongoDB | 5.0.0 | Cục bộ hoặc MongoDB Atlas |
| Git     | 2.20.0 | Để clone repository |

---

## 🛠️ Công nghệ Sử dụng

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.3.5
- **Language**: TypeScript 6.0.3
- **Styling**: Tailwind CSS 4.1.12, Emotion
- **UI Components**: Radix UI, Material-UI
- **Routing**: React Router 7.14.2
- **State Management**: Zustand (accountStore, contentModerationStore)
- **HTTP Client**: Axios 1.15.2
- **Form**: React Hook Form 7.55.0
- **Icons**: Lucide React, Material-UI Icons
- **Charts**: Recharts 2.15.2
- **Drag & Drop**: React DnD 16.0.1
- **Toast Notifications**: Sonner 2.0.3

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5.2.1
- **Database**: MongoDB 9.6.0 (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken 9.0.3)
- **CORS**: Đã bật cho cross-origin requests
- **Environment**: dotenv 17.4.2
- **Development**: nodemon 3.1.14

---

## 🚀 Cài đặt Môi trường

### 1. Clone Repository

```bash
git clone https://github.com/hvb1412/JVConnect.git
cd JVConnect
```

### 2. Cài đặt Node.js

Tải và cài đặt Node.js từ [https://nodejs.org/](https://nodejs.org/). Chọn LTS version.

Kiểm tra phiên bản:
```bash
node --version
npm --version
```

### 3. Cài đặt MongoDB

**Tùy chọn A: MongoDB Cục bộ (Local)**

- **Windows**: Tải từ [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- **macOS**: 
  ```bash
  brew tap mongodb/brew
  brew install mongodb-community
  brew services start mongodb-community
  ```
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt-get install mongodb
  sudo systemctl start mongodb
  ```

Kiểm tra MongoDB đang chạy:
```bash
mongosh --version
```

**Tùy chọn B: MongoDB Atlas (Cloud)**

1. Tạo tài khoản tại [mongodb.com/cloud](https://www.mongodb.com/cloud)
2. Tạo cluster
3. Lấy connection string (URI)

---

## 🔐 Cấu hình Biến Môi trường

### Backend (.env)

Tạo file `.env` trong thư mục `server/`:

```bash
cd server
touch .env
```

Thêm các biến sau vào `server/.env`:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/jvconnect

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production

# Email (Optional - nếu cần gửi email)
EMAIL_SERVICE=your_email_service
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
```

**Giải thích các biến:**

| Biến | Mô tả | Ví dụ |
|------|-------|-------|
| `MONGO_URI` | Kết nối cơ sở dữ liệu MongoDB | `mongodb://localhost:27017/jvconnect` hoặc `mongodb+srv://user:pass@cluster.mongodb.net/jvconnect` |
| `PORT` | Port server chạy | `5000` |
| `NODE_ENV` | Môi trường chạy | `development` hoặc `production` |
| `JWT_SECRET` | Secret key để ký token JWT | Nên dùng string dài, phức tạp |

**⚠️ Lưu ý An toàn**:
- KHÔNG commit `.env` file lên Git
- File `.gitignore` nên bao gồm `.env`
- Thay đổi `JWT_SECRET` khi deploy production

### Frontend (Tùy chọn)

Vite không yêu cầu file `.env`, nhưng nếu cần custom API base URL, tạo `client/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Sử dụng trong code:
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
```

---

## 📦 Cài đặt Dependencies

### Cài đặt tất cả dependencies (Root)

```bash
npm run install-all
```

Câu lệnh này sẽ:
1. Cài đặt dependencies của root project (concurrently)
2. Chuyển vào `client/` và cài đặt dependencies frontend
3. Chuyển vào `server/` và cài đặt dependencies backend

**Hoặc cài đặt từng phần:**

```bash
# Cài đặt root dependencies
npm install

# Cài đặt frontend dependencies
cd client && npm install

# Cài đặt backend dependencies
cd server && npm install
```

---

## 🗄️ Cấu hình Database

### Kiểm tra Kết nối MongoDB

```bash
# Từ thư mục server/
cd server
mongosh
```

Hoặc test bằng script Node.js:

```bash
node -e "require('mongoose').connect(process.env.MONGO_URI); console.log('Connected!');"
```

### Seed Dữ liệu Mẫu

Project cung cấp seed script để thêm dữ liệu mẫu vào database (dùng cho development):

```bash
cd server
npm run seed
```

Seed data bao gồm:
- **4 User mẫu** (admin, 3 user test)
- **Event mẫu** (tự động tạo)
- **Friend relationships** (kết nối giữa user)
- **Conversation & Message mẫu** (cuộc hội thoại test)

**⚠️ Cảnh báo**: Seed script sẽ xóa toàn bộ dữ liệu cũ trước khi tạo dữ liệu mẫu. Chỉ dùng trong development.

### Cấu trúc Database

JVConnect sử dụng 8 collection chính:

| Collection | Mô tả |
|-----------|-------|
| `users` | Thông tin người dùng (email, profile, avatar, etc) |
| `events` | Sự kiện được tạo |
| `friends` | Danh sách kết bạn (quan hệ 2 chiều) |
| `friendrequests` | Yêu cầu kết bạn chờ xử lý |
| `conversations` | Cuộc hội thoại giữa 2 người |
| `messages` | Tin nhắn trong cuộc hội thoại |
| `participations` | Tham gia sự kiện |
| `reports` | Báo cáo vi phạm người dùng |

---

## 🎮 Khởi chạy Project

### Chạy Development Mode (Khuyến nghị)

Khởi chạy cả client và server cùng lúc từ root folder:

```bash
npm run dev
```

Lệnh này sẽ:
- ✅ Chạy backend server trên `http://localhost:5000`
- ✅ Chạy frontend dev server trên `http://localhost:3000`
- ✅ Frontend sẽ proxy `/api` requests tới backend

**Nếu muốn chạy riêng:**

```bash
# Chạy chỉ backend
npm run server

# Chạy chỉ frontend (trong terminal khác)
npm run client
```

### Truy cập Ứng dụng

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

### Test Đăng nhập

Các tài khoản mẫu từ seed data:

| Email | Mật khẩu | Vai trò |
|-------|---------|--------|
| admin@jvconnect.com | password123 | Admin |
| BHV@jvconnect.com | password123 | User |
| VNTK2@jvconnect.com | password123 | User |
| BLT3@jvconnect.com | password123 | User |

---

## 📦 Xây dựng Production

### Build Frontend

```bash
cd client
npm run build
```

Output sẽ được lưu trong `client/dist/`

### Build Backend

Backend không cần build (pure Node.js). Chỉ cần chạy:

```bash
cd server
npm start
```

### Tối ưu hoá cho Production

**Frontend:**
- Build sẽ tự động minify và optimize code
- Assets sẽ được hash để cache busting
- Source maps sẽ được loại bỏ (nếu cấu hình)

**Backend:**
- Set `NODE_ENV=production`
- Đảm bảo `JWT_SECRET` được set thành giá trị bảo mật cao
- Cấu hình MongoDB với database riêng (không dùng development database)

---

## 🗂️ Cấu trúc Thư mục

```
JVConnect/
├── client/                    # Frontend React + Vite
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx       # Root component
│   │   │   ├── routes.tsx    # React Router configuration
│   │   │   ├── components/   # Reusable UI components
│   │   │   │   ├── LanguageToggle.tsx
│   │   │   │   ├── Logo.tsx
│   │   │   │   ├── figma/    # Figma-integrated components
│   │   │   │   └── ui/       # Radix UI + Material-UI wrapped components
│   │   │   ├── lib/          # Utilities & API calls
│   │   │   │   ├── accountStore.ts     # Zustand user auth state
│   │   │   │   ├── contentModerationStore.ts
│   │   │   │   └── userApi.ts          # Axios API client
│   │   │   ├── screens/      # Page components
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── AdminEvents.tsx
│   │   │   │   ├── AdminReports.tsx
│   │   │   │   ├── GuestLogin.tsx
│   │   │   │   ├── GuestRegister.tsx
│   │   │   │   ├── UserChat.tsx
│   │   │   │   ├── UserEvents.tsx
│   │   │   │   ├── UserFriends.tsx
│   │   │   │   ├── UserHome.tsx
│   │   │   │   └── ... (other screens)
│   │   └── assets/           # Images, icons, fonts
│   ├── public/               # Static files
│   ├── vite.config.js        # Vite build configuration
│   ├── index.html            # HTML entry point
│   └── package.json          # Frontend dependencies
│
├── server/                    # Backend Node.js + Express
│   ├── src/
│   │   ├── app.js           # Express app setup
│   │   ├── server.js        # Server entry point & MongoDB connection
│   │   ├── seed.js          # Database seed script
│   │   ├── configs/
│   │   │   └── db.js        # MongoDB connection config
│   │   ├── controllers/
│   │   │   └── user.controller.js    # User business logic
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js    # JWT authentication
│   │   │   └── error.middleware.js   # Error handling
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Event.js
│   │   │   ├── Friend.js
│   │   │   ├── FriendRequest.js
│   │   │   ├── Conversation.js
│   │   │   ├── Message.js
│   │   │   ├── Participation.js
│   │   │   ├── Report.js
│   │   │   └── index.js     # Models export
│   │   └── routes/
│   │       ├── index.route.js     # Routes aggregation
│   │       └── user.route.js      # User endpoints
│   └── package.json          # Backend dependencies
│
├── package.json              # Root package.json (scripts)
└── README.md                 # This file
```

### Giải thích Cấu trúc chính:

**`client/src/app/`** - Frontend logic
- `components/` - Reusable UI components (buttons, modals, cards, etc)
- `lib/` - Utilities, API services, state management
- `screens/` - Full-page components (not reusable)

**`server/src/`** - Backend API
- `controllers/` - Business logic (handling requests)
- `models/` - MongoDB schemas
- `routes/` - API endpoint definitions
- `middlewares/` - Request/response processing

---

## 🔌 Các Endpoints API Chính

Base URL: `http://localhost:5000/api`

### User Endpoints

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/users/:id` | ✅ | Lấy thông tin user by ID |
| GET | `/users/:id` | ❌ | Lấy public profile của user |
| PUT | `/users/profile` | ✅ | Cập nhật profile người dùng |
| GET | `/users/match` | ❌ | Tìm kiếm người dùng (search) |

**Ví dụ Request:**

```bash
# Get user profile (cần token)
curl -X GET http://localhost:5000/api/users/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search users
curl -X GET "http://localhost:5000/api/users/match?q=john"
```

**⚠️ Lưu ý**: Bạn cần import/gọi API thông qua `userApi.ts` để có proper typing.

---

## ⚙️ Các Command Hữu ích

### Root Commands

```bash
# Cài đặt tất cả dependencies
npm run install-all

# Khởi chạy cả client và server
npm run dev

# Chạy chỉ backend
npm run server

# Chạy chỉ frontend
npm run client
```

### Frontend Commands (từ `client/`)

```bash
# Dev server với hot reload
npm run dev

# Build production bundle
npm run build

# Preview production build locally
npm run preview

# Lint với ESLint
npm run lint
```

### Backend Commands (từ `server/`)

```bash
# Chạy server production
npm start

# Chạy server development (với auto-reload)
npm run dev

# Seed database
npm run seed
```

---

## 🐛 Troubleshooting

### 1. "MONGO_URI not found" hoặc "Failed to connect to MongoDB"

**Nguyên nhân**: File `.env` chưa được tạo hoặc `MONGO_URI` chưa được cấu hình

**Giải pháp**:
```bash
# Tạo file .env trong server/
cd server
cat > .env << EOF
MONGO_URI=mongodb://localhost:27017/jvconnect
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_key
EOF
```

Hoặc nếu dùng MongoDB Atlas:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/jvconnect?retryWrites=true&w=majority
```

### 2. "Port 5000 is already in use"

**Giải pháp 1**: Thay đổi port trong `.env`
```
PORT=5001
```

**Giải pháp 2**: Kill process sử dụng port 5000
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### 3. "Module not found" hoặc dependencies issues

**Giải pháp**:
```bash
# Xóa node_modules và package-lock
rm -rf node_modules package-lock.json

# Cài đặt lại
npm install
```

### 4. Frontend không kết nối được Backend (CORS error)

**Kiểm tra**:
- Backend có chạy trên port 5000? 
- `vite.config.js` có proxy `/api` tới `http://localhost:5000`?
- Backend có bật CORS? (check `app.js` - `app.use(cors())`)

**Giải pháp**:
```javascript
// server/src/app.js - Kiểm tra CORS
app.use(cors()); // Hoặc configure CORS options
```

### 5. "Cannot find module" errors

**Giải pháp**:
```bash
# Xóa cache
npm cache clean --force

# Cài đặt lại dependencies
npm install
```

### 6. Hot reload không hoạt động

**Giải pháp**:
- Quit và restart dev server: `npm run dev`
- Xóa `.vite` cache folder nếu tồn tại
- Kiểm tra port 3000 không bị chiếm

### 7. Database seed script lỗi

**Giải pháp**:
```bash
cd server

# Kiểm tra .env file tồn tại
cat .env

# Chạy seed lại
npm run seed
```

---

## 📊 Lưu ý khi Phát triển

### Frontend Development

- **Hot Module Replacement (HMR)**: Vite tự động reload khi thay đổi code
- **TypeScript**: Kiểm tra type errors trong IDE
- **Linting**: Chạy `npm run lint` trước khi commit
- **Components**: Dùng Radix UI primitives cho accessibility

### Backend Development

- **Nodemon**: Tự động restart server khi file thay đổi
- **Environment Variables**: Load từ `.env` bằng `dotenv`
- **JWT Token**: Validate token trên các protected routes
- **Error Handling**: Check `error.middleware.js` để consistent error responses

### Database Best Practices

- Luôn sử dụng unique indexes cho email
- Validate input data trước khi lưu
- Dùng transactions nếu cần consistency
- Regularly backup MongoDB (especially production)

---

## 📝 Git Workflow

```bash
# 1. Tạo branch mới cho feature
git checkout -b feature/your-feature-name

# 2. Commit thay đổi
git add .
git commit -m "feat: thêm tính năng X"

# 3. Push lên remote
git push origin feature/your-feature-name

# 4. Tạo Pull Request trên GitHub
```

---

## 🔒 Bảo mật

### Before Production Deployment

- [ ] Thay đổi `JWT_SECRET` thành một chuỗi bảo mật cao
- [ ] Thay đổi tất cả test/seed account
- [ ] Enable HTTPS (sử dụng reverse proxy như nginx)
- [ ] Validate & sanitize tất cả input từ client
- [ ] Implement rate limiting trên API
- [ ] Enable CORS chỉ cho trusted domains
- [ ] Set secure cookie options
- [ ] Implement CSRF protection
- [ ] Log security events
- [ ] Backup database regularly

---

## 📚 Tài liệu Tham khảo

- [React Docs](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose ODM](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/)

---

## 🤝 Đóng góp & Hỗ trợ

### Issues & Bug Reports

Nếu phát hiện bug, vui lòng:
1. Kiểm tra issue existing trên GitHub
2. Tạo issue mới với chi tiết:
   - Mô tả bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment info (OS, Node version, etc)

### Pull Requests

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

ISC License - xem `LICENSE` file để chi tiết

---

## 👥 Contributors

- **Hoàng Văn Bình** (hvb1412) - Project Lead
- **Team Members** - ITSS In Japanese Course, HUST

---

## 📞 Liên hệ & Support

- **GitHub Issues**: [JVConnect/issues](https://github.com/hvb1412/JVConnect/issues)
- **Repository**: [hvb1412/JVConnect](https://github.com/hvb1412/JVConnect)

---

**Cập nhật lần cuối**: May 2026
**Phiên bản**: 1.0.0

Chúc bạn phát triển vui vẻ! 🚀