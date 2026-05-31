USE master;
GO

-- ============================================================================
-- 1. KHỞI TẠO HOÀN TOÀN MỚI DATABASE (FRESH INSTALL)
-- Nếu đã có Database cũ, hệ thống tự xóa sạch để dựng lại từ đầu, tránh lỗi rác
-- ============================================================================
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'CitizenManagementDB')
BEGIN
    ALTER DATABASE CitizenManagementDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE CitizenManagementDB;
END
GO

CREATE DATABASE CitizenManagementDB;
GO

USE CitizenManagementDB;
GO

-- ============================================================================
-- 2. ĐỊNH NGHĨA CẤU TRÚC HỆ THỐNG BẢNG (SCHEMA - ĐÃ TINH GỌN THEO Ý BẠN)
-- Địa bàn áp dụng: Phường Phúc Lợi, Quận Long Biên, Hà Nội
-- ============================================================================

-- BẢNG 1: Roles (Vai trò người dùng)
CREATE TABLE Roles (
    role_id INT PRIMARY KEY IDENTITY(1,1),
    role_name NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- BẢNG 2: Provinces (Tỉnh/Thành phố)
CREATE TABLE Provinces (
    province_id INT PRIMARY KEY IDENTITY(1,1),
    province_code NVARCHAR(10) NOT NULL UNIQUE,
    province_name NVARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- BẢNG 3: Districts (Quận/Huyện)
CREATE TABLE Districts (
    district_id INT PRIMARY KEY IDENTITY(1,1),
    district_code NVARCHAR(10) NOT NULL UNIQUE,
    district_name NVARCHAR(100) NOT NULL,
    province_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (province_id) REFERENCES Provinces(province_id) ON DELETE CASCADE
);

-- BẢNG 4: Wards (Tổ dân phố thay cho Phường/Xã)
CREATE TABLE Wards (
    ward_id INT PRIMARY KEY IDENTITY(1,1),
    ward_code NVARCHAR(10) NOT NULL UNIQUE,
    ward_name NVARCHAR(100) NOT NULL,
    district_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (district_id) REFERENCES Districts(district_id) ON DELETE CASCADE
);

-- BẢNG 5: Users (Người dùng hệ thống)
CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE,
    phone NVARCHAR(20),
    role_id INT NOT NULL,
    ward_id INT, -- Tổ dân phố quản lý
    is_active BIT DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (role_id) REFERENCES Roles(role_id),
    FOREIGN KEY (ward_id) REFERENCES Wards(ward_id) ON DELETE SET NULL,
    CHECK (LEN(username) >= 3),
    CHECK (email LIKE '%@%.%')
);

-- BẢNG 6: Citizens (Công dân - Đã xóa tôn giáo, quốc tịch, học vấn, địa chỉ tạm trú)
CREATE TABLE Citizens (
    citizen_id INT PRIMARY KEY IDENTITY(1,1),
    citizen_code NVARCHAR(20) NOT NULL UNIQUE, -- CCCD
    full_name NVARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender NVARCHAR(10) NOT NULL CHECK (gender IN (N'Nam', N'Nữ', N'Khác')), -- Đồng nhất Tiếng Việt
    place_of_birth NVARCHAR(255),
    ethnicity NVARCHAR(50) DEFAULT N'Kinh',
    occupation NVARCHAR(100),
    phone NVARCHAR(20),
    email NVARCHAR(100),
    permanent_address NVARCHAR(255), -- Địa chỉ thường trú
    ward_id INT NOT NULL, -- Thuộc tổ dân phố nào
    is_active BIT DEFAULT 1,
    status NVARCHAR(50) DEFAULT 'Active' 
	CHECK (status IN ('Active', 'Inactive', 'Moved', 'Deceased', 'Absent')), -- Đã bổ sung Absent
    created_by INT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ward_id) REFERENCES Wards(ward_id),
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    CHECK (LEN(citizen_code) >= 9),
    CHECK (date_of_birth < GETDATE())
);

-- BẢNG 7: Households (Hộ khẩu)
CREATE TABLE Households (
    household_id INT PRIMARY KEY IDENTITY(1,1),
    household_code NVARCHAR(20) NOT NULL UNIQUE,
    head_of_household_id INT NOT NULL, -- Chủ hộ
    address NVARCHAR(255) NOT NULL,
    ward_id INT NOT NULL, -- Đăng ký tại tổ nào
   -- [SỬA LẠI ĐOẠN NÀY]
	household_type NVARCHAR(50) DEFAULT N'Thường trú' 
	CHECK (household_type IN (N'Thường trú', N'Tạm trú')), -- Bổ sung các loại hộ khẩu
    registration_date DATE DEFAULT CAST(GETDATE() AS DATE),
    member_count INT DEFAULT 1,
    notes NVARCHAR(500),
    created_by INT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (head_of_household_id) REFERENCES Citizens(citizen_id),
    FOREIGN KEY (ward_id) REFERENCES Wards(ward_id),
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    CHECK (member_count > 0 AND member_count <= 15)
);

-- BẢNG 8: HouseholdMembers (Thành viên hộ khẩu)
CREATE TABLE HouseholdMembers (
    member_id INT PRIMARY KEY IDENTITY(1,1),
    household_id INT NOT NULL,
    citizen_id INT NOT NULL,
    relationship_to_head NVARCHAR(50) NOT NULL,
    join_date DATE DEFAULT CAST(GETDATE() AS DATE),
    leave_date DATE,
    is_current_member BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (household_id) REFERENCES Households(household_id) ON DELETE CASCADE,
    FOREIGN KEY (citizen_id) REFERENCES Citizens(citizen_id),
    UNIQUE (household_id, citizen_id, join_date),
    CHECK (leave_date IS NULL OR leave_date >= join_date)
);

-- BẢNG 9: TemporaryResidences (Tạm trú)
CREATE TABLE TemporaryResidences (
    temp_residence_id INT PRIMARY KEY IDENTITY(1,1),
    citizen_id INT NOT NULL,
    temporary_address NVARCHAR(255) NOT NULL,
    ward_id INT NOT NULL,
    reason NVARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_date DATE DEFAULT CAST(GETDATE() AS DATE),
    status NVARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Cancelled')),
    notes NVARCHAR(500),
    created_by INT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (citizen_id) REFERENCES Citizens(citizen_id),
    FOREIGN KEY (ward_id) REFERENCES Wards(ward_id),
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    CHECK (end_date > start_date),
    CHECK (DATEDIFF(MONTH, start_date, end_date) <= 12)
);

-- BẢNG 10: TemporaryAbsences (Tạm vắng)
CREATE TABLE TemporaryAbsences (
    temp_absence_id INT PRIMARY KEY IDENTITY(1,1),
    citizen_id INT NOT NULL,
    destination_address NVARCHAR(255) NOT NULL,
    destination_ward_code NVARCHAR(10),
    reason NVARCHAR(255),
    start_date DATE NOT NULL,
    expected_return_date DATE NOT NULL,
    actual_return_date DATE,
    registration_date DATE DEFAULT CAST(GETDATE() AS DATE),
    status NVARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Returned', 'Extended')),
    notes NVARCHAR(500),
    created_by INT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (citizen_id) REFERENCES Citizens(citizen_id),
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    CHECK (expected_return_date > start_date),
    CHECK (actual_return_date IS NULL OR actual_return_date >= start_date),
    CHECK (DATEDIFF(MONTH, start_date, expected_return_date) <= 12)
);

-- BẢNG 11: BirthCertificates (Giấy khai sinh)
CREATE TABLE BirthCertificates (
    birth_cert_id INT PRIMARY KEY IDENTITY(1,1),
    certificate_number NVARCHAR(20) NOT NULL UNIQUE,
    child_citizen_id INT NOT NULL UNIQUE,
    father_citizen_id INT,
    mother_citizen_id INT,
    birth_place NVARCHAR(255),
    registration_date DATE DEFAULT CAST(GETDATE() AS DATE),
    registrar_name NVARCHAR(100),
    notes NVARCHAR(500),
    created_by INT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (child_citizen_id) REFERENCES Citizens(citizen_id),
    FOREIGN KEY (father_citizen_id) REFERENCES Citizens(citizen_id) ON DELETE NO ACTION,
    FOREIGN KEY (mother_citizen_id) REFERENCES Citizens(citizen_id) ON DELETE NO ACTION,
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    CHECK (father_citizen_id IS NOT NULL OR mother_citizen_id IS NOT NULL)
);

-- BẢNG 12: DeathCertificates (Giấy khai tử)
CREATE TABLE DeathCertificates (
    death_cert_id INT PRIMARY KEY IDENTITY(1,1),
    certificate_number NVARCHAR(20) NOT NULL UNIQUE,
    citizen_id INT NOT NULL UNIQUE,
    date_of_death DATE NOT NULL,
    place_of_death NVARCHAR(255),
    cause_of_death NVARCHAR(255),
    burial_place NVARCHAR(255),
    registration_date DATE DEFAULT CAST(GETDATE() AS DATE),
    registrar_name NVARCHAR(100),
    notes NVARCHAR(500),
    created_by INT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (citizen_id) REFERENCES Citizens(citizen_id),
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    CHECK (date_of_death < GETDATE())
);

-- BẢNG 13: RefreshTokens (JWT Token hệ thống)
CREATE TABLE RefreshTokens (
    token_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    token NVARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    revoked_at DATETIME,
    is_revoked BIT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- BẢNG 14: AuditLogs (Nhật ký thao tác dữ liệu)
CREATE TABLE AuditLogs (
    log_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT,
    action NVARCHAR(50) NOT NULL,
    table_name NVARCHAR(50),
    record_id INT,
    old_value NVARCHAR(MAX),
    new_value NVARCHAR(MAX),
    ip_address NVARCHAR(50),
    user_agent NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- Tạo Index tăng tốc truy vấn hệ thống
CREATE INDEX IX_Users_Username ON Users(username);
CREATE INDEX IX_Citizens_CitizenCode ON Citizens(citizen_code);
CREATE INDEX IX_Citizens_FullName ON Citizens(full_name);
CREATE INDEX IX_Households_HouseholdCode ON Households(household_code);
CREATE INDEX IX_HouseholdMembers_HouseholdId ON HouseholdMembers(household_id);
GO

-- ============================================================================
-- 3. KHỞI TẠO DANH MỤC GỐC ĐỒNG BỘ: PHƯỜNG PHÚC LỢI, LONG BIÊN
-- ============================================================================

-- Khởi tạo Vai trò người dùng
INSERT INTO Roles (role_name, description) VALUES 
(N'Admin', N'Quản trị viên hệ thống'),
(N'Staff', N'Cán bộ địa phương'),
(N'Viewer', N'Người xem thông tin');

-- Chỉ giữ duy nhất Thủ đô Hà Nội
INSERT INTO Provinces (province_code, province_name) VALUES (N'HN', N'Hà Nội');

-- Chỉ giữ duy nhất Quận Long Biên
INSERT INTO Districts (district_code, district_name, province_id) VALUES (N'HN-LB', N'Long Biên', 1);

-- Khởi tạo 4 Tổ dân phố hành chính của Phường Phúc Lợi
INSERT INTO Wards (ward_code, ward_name, district_id) VALUES 
(N'PL-TO-01', N'Tổ 1', 1),
(N'PL-TO-02', N'Tổ 2', 1),
(N'PL-TO-03', N'Tổ 3', 1),
(N'PL-TO-04', N'Tổ 4', 1);

-- Tạo các tài khoản quản trị hệ thống mẫu (Password gốc: Admin@123 / Staff@123)
INSERT INTO Users (username, password_hash, full_name, email, phone, role_id, is_active) VALUES 
(N'admin', N'$2a$12$YDVsQMoGx0Gj0DWdGbmqYONa5JBwAsnyfNOefg7fY7jL5PzC0oZM2', N'Administrator', N'admin@citizen.gov.vn', N'0123456789', 1, 1);

INSERT INTO Users (username, password_hash, full_name, email, phone, role_id, ward_id, is_active) VALUES 
(N'staff01', N'$2a$12$m/pETcvT6F2stW5Oikc4m.DafCiK7TN3JEwuPs4bOJ1LTfGratlrC', N'Nguyễn Văn A', N'nguyenvana@citizen.gov.vn', N'0987654321', 2, 1, 1);

INSERT INTO Users (username, password_hash, full_name, email, phone, role_id, ward_id, is_active) VALUES