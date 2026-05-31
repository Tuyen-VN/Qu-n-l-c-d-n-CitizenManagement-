# CITIZEN MANAGEMENT SYSTEM - BACKEND API

cd G:/CitizenManagement/backend 
npm run dev

Hệ thống quản lý công dân cho tỉnh/huyện/xã, xây dựng trên nền tảng Node.js + Express.js + SQL Server.

## 📋 MỤC LỤC

- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [API Documentation](#api-documentation)
- [Bảo mật](#bảo-mật)

---

## ✨ TÍNH NĂNG

### Quản lý người dùng
- ✅ Đăng nhập/Đăng xuất với JWT
- ✅ Refresh token
- ✅ Đổi mật khẩu
- ✅ Phân quyền: Admin, Staff, Viewer
- ✅ Audit log

### Quản lý công dân
- ✅ CRUD công dân (Create, Read, Update, Delete)
- ✅ Tìm kiếm công dân theo CCCD, họ tên
- ✅ Lọc theo giới tính, độ tuổi, địa phương
- ✅ Phân trang
- ✅ Thống kê theo giới tính, độ tuổi

### Quản lý hộ khẩu
- ⏳ CRUD hộ khẩu
- ⏳ Quản lý thành viên hộ
- ⏳ Chuyển hộ khẩu
- ⏳ Tách hộ

### Tạm trú/Tạm vắng
- ⏳ Đăng ký tạm trú
- ⏳ Đăng ký tạm vắng
- ⏳ Gia hạn/Kết thúc

### Khai sinh/Khai tử
- ⏳ Cấp giấy khai sinh
- ⏳ Cấp giấy khai tử
- ⏳ Tự động cập nhật trạng thái công dân

### Báo cáo & Thống kê
- ⏳ Báo cáo dân số theo đơn vị hành chính
- ⏳ Biểu đồ dân số
- ⏳ Xuất báo cáo Excel/PDF

---

## 🛠 CÔNG NGHỆ SỬ DỤNG

- **Backend**: Node.js v18+, Express.js v4
- **Database**: SQL Server 2019+
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Logging**: Winston
- **API Documentation**: Swagger UI
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcrypt

---

## 📦 YÊU CẦU HỆ THỐNG

### Phần mềm cần cài đặt
- Node.js v18 trở lên
- SQL Server 2019 trở lên (hoặc SQL Server Express)
- npm hoặc yarn

### Cấu hình tối thiểu
- RAM: 4GB
- CPU: 2 cores
- Disk: 10GB

---

## 🚀 CÀI ĐẶT

### Bước 1: Clone project
```bash
git clone <repository-url>
cd backend
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình Database

#### 3.1. Tạo Database
1. Mở SQL Server Management Studio (SSMS)
2. Kết nối tới SQL Server
3. Tạo database mới:
```sql
CREATE DATABASE CitizenManagementDB;
GO
```

#### 3.2. Chạy SQL Scripts
Chạy file `database/schema.sql` để tạo tables, views, stored procedures, functions:
```sql
USE CitizenManagementDB;
GO
-- Copy và chạy toàn bộ nội dung file schema.sql
```

### Bước 4: Cấu hình Environment Variables

Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:
```env
PORT=3000
NODE_ENV=development

# Database
DB_USER=sa
DB_PASSWORD=YourPassword123
DB_SERVER=localhost
DB_NAME=CitizenManagementDB
DB_PORT=1433

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
```

### Bước 5: Tạo thư mục logs
```bash
mkdir logs
```

### Bước 6: Khởi động server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

### Bước 7: Kiểm tra cài đặt

Truy cập các endpoint sau:
- Health check: `http://localhost:3000/health`
- API Documentation: `http://localhost:3000/api-docs`

---

## 📁 CẤU TRÚC THƯ MỤC

```
citizen-management-backend/
├── src/
│   ├── config/           # Cấu hình (database, swagger)
│   │   ├── database.js
│   │   └── swagger.js
│   ├── controllers/      # Controllers (xử lý request/response)
│   │   ├── auth.controller.js
│   │   ├── citizen.controller.js
│   │   └── ...
│   ├── middleware/       # Middleware
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── validation.middleware.js
│   ├── models/           # Models (nếu dùng ORM - optional)
│   ├── routes/           # Route definitions
│   │   ├── auth.routes.js
│   │   ├── citizen.routes.js
│   │   └── ...
│   ├── services/         # Business logic layer
│   │   ├── auth.service.js
│   │   ├── citizen.service.js
│   │   └── ...
│   ├── utils/            # Utilities
│   │   ├── logger.js
│   │   └── response.js
│   ├── validators/       # Input validation
│   │   ├── auth.validator.js
│   │   ├── citizen.validator.js
│   │   └── ...
│   └── server.js         # Entry point
├── logs/                 # Log files
├── database/             # SQL scripts
│   └── schema.sql
├── .env.example          # Environment template
├── .gitignore
├── package.json
└── README.md
```

---

## 📚 API DOCUMENTATION

### Swagger UI
Sau khi khởi động server, truy cập:
```
http://localhost:3000/api-docs
```

### Tài khoản mặc định

#### Admin
```
Username: admin
Password: Admin@123
```

#### Staff
```
Username: staff01
Password: Staff@123
```

#### Viewer
```
Username: viewer01
Password: Viewer@123
```

---

## 🔐 BẢO MẬT

### JWT Authentication
- **Access Token**: Hết hạn sau 1 giờ
- **Refresh Token**: Hết hạn sau 7 ngày
- Token được lưu trong database để kiểm soát

### Password Security
- Mật khẩu được hash bằng bcrypt (cost factor = 10)
- Yêu cầu mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường, số

### Rate Limiting
- Giới hạn 100 requests/15 phút/IP
- Áp dụng cho tất cả API endpoints

### SQL Injection Prevention
- Sử dụng parameterized queries
- Input validation với express-validator

### CORS
- Cấu hình CORS theo whitelist domains
- Credentials support

### Headers Security
- Helmet middleware cho security headers
- XSS protection
- Content Security Policy

---

## 🔑 PHÂN QUYỀN

### Admin
- Toàn quyền quản lý hệ thống
- Tạo/sửa/xóa tài khoản
- Xem tất cả dữ liệu
- Xóa công dân

### Staff (Cán bộ)
- Thêm/sửa công dân
- Quản lý hộ khẩu
- Đăng ký tạm trú/tạm vắng
- Cấp giấy khai sinh/khai tử
- **Chỉ truy cập dữ liệu của Ward mình quản lý**

### Viewer
- Chỉ xem dữ liệu
- Không được chỉnh sửa

---

## 📊 RESPONSE FORMAT

### Success Response
```json
{
  "success": true,
  "message": "Thông báo thành công",
  "data": {
    // Dữ liệu trả về
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Thông báo lỗi"
  },
  "details": [  // Optional - cho validation errors
    {
      "field": "fieldName",
      "message": "Chi tiết lỗi"
    }
  ]
}
```

### Pagination Response
```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Test với Postman
1. Import Postman collection từ `postman/collection.json`
2. Cấu hình environment variables
3. Chạy tests

### Manual Testing Checklist
- [ ] Đăng nhập với 3 loại tài khoản
- [ ] Tạo công dân mới
- [ ] Tìm kiếm công dân
- [ ] Cập nhật thông tin
- [ ] Thống kê dữ liệu
- [ ] Kiểm tra phân quyền

---

## 📝 LOGGING

### Log Levels
- `error`: Lỗi nghiêm trọng
- `warn`: Cảnh báo
- `info`: Thông tin chung
- `debug`: Debug information

### Log Files
- `logs/error.log`: Chỉ lỗi
- `logs/combined.log`: Tất cả logs
- Rotation: 5MB/file, tối đa 5 files

---

## 🔧 TROUBLESHOOTING

### Lỗi kết nối Database
```
Error: Failed to connect to SQL Server
```
**Giải pháp:**
1. Kiểm tra SQL Server đang chạy
2. Kiểm tra thông tin kết nối trong `.env`
3. Kiểm tra firewall

### Lỗi Port đã sử dụng
```
Error: Port 3000 is already in use
```
**Giải pháp:**
- Đổi PORT trong `.env` hoặc kill process đang dùng port 3000

### Lỗi JWT Secret
```
Error: secretOrPrivateKey must have a value
```
**Giải pháp:**
- Đảm bảo `JWT_SECRET` và `JWT_REFRESH_SECRET` có giá trị trong `.env`

---

## 🚢 DEPLOYMENT

### Production Checklist
- [ ] Đổi `NODE_ENV=production`
- [ ] Sử dụng JWT secrets mạnh
- [ ] Cấu hình CORS đúng domains
- [ ] Enable HTTPS
- [ ] Backup database
- [ ] Setup monitoring
- [ ] Configure log rotation

---

## 📞 HỖ TRỢ

- **Email**: support@citizen.gov.vn
- **Documentation**: http://localhost:3000/api-docs
- **Issues**: [GitHub Issues]

---

## 📅 CHANGELOG

### Version 1.0.0 (Current)
- ✅ Authentication & Authorization
- ✅ Citizen Management CRUD
- ✅ Basic Statistics
- ✅ API Documentation

### Version 1.1.0 (Planned)
- ⏳ Household Management
- ⏳ Temporary Residence/Absence
- ⏳ Birth/Death Certificates
- ⏳ Advanced Reports

---

**🎉 Chúc bạn sử dụng hệ thống thành công!**