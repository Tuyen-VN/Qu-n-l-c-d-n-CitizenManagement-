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
-- 2. ĐỊNH NGHĨA CẤU TRÚC HỆ THỐNG BẢNG (SCHEMA)
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
    citizen_id INT NULL, -- FK gán sau khi bảng Citizens tồn tại
    is_active BIT DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (role_id) REFERENCES Roles(role_id),
    FOREIGN KEY (ward_id) REFERENCES Wards(ward_id) ON DELETE SET NULL,
    CHECK (LEN(username) >= 3),
    CHECK (email LIKE '%@%.%')
);

-- BẢNG 6: Citizens (Công dân)
CREATE TABLE Citizens (
    citizen_id INT PRIMARY KEY IDENTITY(1,1),
    citizen_code NVARCHAR(20) NOT NULL UNIQUE, -- CCCD
    full_name NVARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender NVARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')), -- Đồng nhất Tiếng Việt
    place_of_birth NVARCHAR(255),
    ethnicity NVARCHAR(50) DEFAULT N'Kinh',
    occupation NVARCHAR(100),
    phone NVARCHAR(20),
    email NVARCHAR(100),
    permanent_address NVARCHAR(255), -- Địa chỉ thường trú
    ward_id INT NOT NULL, -- Thuộc tổ dân phố nào
    is_active BIT DEFAULT 1,
    status NVARCHAR(50) DEFAULT 'Active' 
	CHECK (status IN ('Active', 'Inactive', 'Moved', 'Deceased', 'Absent')),
    created_by INT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ward_id) REFERENCES Wards(ward_id),
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    CHECK (LEN(citizen_code) >= 9),
    CHECK (date_of_birth < GETDATE())
);

-- Thêm FK citizen_id vào Users SAU KHI Citizens đã tồn tại
ALTER TABLE Users
ADD CONSTRAINT FK_Users_Citizens
    FOREIGN KEY (citizen_id) REFERENCES Citizens(citizen_id) ON DELETE SET NULL;
GO

-- BẢNG 7: Households (Hộ khẩu)
CREATE TABLE Households (
    household_id INT PRIMARY KEY IDENTITY(1,1),
    household_code NVARCHAR(20) NOT NULL UNIQUE,
    head_of_household_id INT NOT NULL, -- Chủ hộ
    address NVARCHAR(255) NOT NULL,
    ward_id INT NOT NULL, -- Đăng ký tại tổ nào
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
CREATE INDEX IX_Users_CitizenId ON Users(citizen_id);
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

-- Tạo các tài khoản quản trị hệ thống mẫu (Password gốc: Admin@123 / Staff@123 / Viewer@123)
-- Admin (role_id=1, không thuộc tổ nào)
INSERT INTO Users (username, password_hash, full_name, email, phone, role_id, is_active)
VALUES (N'admin',
        N'$2a$12$YDVsQMoGx0Gj0DWdGbmqYONa5JBwAsnyfNOefg7fY7jL5PzC0oZM2',
        N'Administrator', N'admin@citizen.gov.vn', N'0123456789', 1, 1);

-- Staff Tổ 1 (role_id=2, ward_id=1)
INSERT INTO Users (username, password_hash, full_name, email, phone, role_id, ward_id, is_active)
VALUES (N'staff01',
        N'$2a$12$m/pETcvT6F2stW5Oikc4m.DafCiK7TN3JEwuPs4bOJ1LTfGratlrC',
        N'Nguyễn Văn A', N'nguyenvana@citizen.gov.vn', N'0987654321', 2, 1, 1);

-- Staff Tổ 2 (role_id=2, ward_id=2)
INSERT INTO Users (username, password_hash, full_name, email, phone, role_id, ward_id, is_active)
VALUES (N'staff02',
        N'$2a$12$m/pETcvT6F2stW5Oikc4m.DafCiK7TN3JEwuPs4bOJ1LTfGratlrC',
        N'Trần Thị B', N'tranthib@citizen.gov.vn', N'0976543210', 2, 2, 1);

-- Viewer (role_id=3) - citizen_id sẽ được gán ở cuối file sau khi insert công dân
INSERT INTO Users (username, password_hash, full_name, email, role_id, is_active)
VALUES (N'viewer01',
        N'$2a$12$m/pETcvT6F2stW5Oikc4m.DafCiK7TN3JEwuPs4bOJ1LTfGratlrC',
        N'Viewer 1', N'viewer01@citizen.gov.vn', 3, 1);
GO

-- ============================================================================
-- 4. ĐỊNH NGHĨA TRIGGERS HỆ THỐNG
-- ============================================================================

-- Trigger 1: Tự động cập nhật số lượng thành viên hộ khẩu
CREATE TRIGGER trg_UpdateHouseholdMemberCount 
ON HouseholdMembers
AFTER INSERT, DELETE, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Households
    SET member_count = (
        SELECT COUNT(*) 
        FROM HouseholdMembers 
        WHERE HouseholdMembers.household_id = Households.household_id 
          AND HouseholdMembers.is_current_member = 1
    )
    WHERE household_id IN (
        SELECT DISTINCT household_id FROM inserted
        UNION
        SELECT DISTINCT household_id FROM deleted
    );
END;
GO

-- Trigger 2: Tự động cập nhật trạng thái công dân khi khai tử
CREATE TRIGGER trg_UpdateCitizenStatusOnDeath
ON DeathCertificates
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Citizens
    SET status = 'Deceased', is_active = 0
    WHERE citizen_id IN (
        SELECT DISTINCT citizen_id FROM inserted
    );
END;
GO

-- ============================================================================
-- 5. CHÈN DỮ LIỆU MẪU ĐỒNG BỘ
-- ============================================================================

PRINT '--- Đang tiến hành chèn dữ liệu mẫu cho các hộ gia đình ---';

-- Khai báo các biến tạm lưu ID để map chính xác mối quan hệ gia đình
DECLARE @c1 INT, @c2 INT, @c3 INT, @c4 INT;
DECLARE @h_id INT;

-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 1: Tổ 3 - Nhà gồm 4 thành viên
-- ------------------------------------------------------------
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001070005001', N'Đặng Văn Hùng', '1970-01-20', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Kinh doanh', N'Số 50 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001072005002', N'Bùi Thị Thu', '1972-03-15', 'Female', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Nội trợ', N'Số 50 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001095005003', N'Đặng Minh Khang', '1995-07-10', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Sinh viên', N'Số 50 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c3 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001098005004', N'Đặng Thị Anh', '1998-11-05', 'Female', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Nhân viên văn phòng', N'Số 50 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c4 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by) 
VALUES (N'HK-HN-LB-003', @c1, N'Số 50 Phố Phúc Lợi, Tổ 3, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @h_id = SCOPE_IDENTITY();

INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES 
--- (@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ'), (@h_id, @c3, N'Con'), (@h_id, @c4, N'Con');
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ'), (@h_id, @c3, N'Con'), (@h_id, @c4, N'Con');


-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 2: Tổ 4 - Nhà gồm 3 thành viên
-- ------------------------------------------------------------
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001080006001', N'Hoàng Văn Nam', '1980-02-28', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Kỹ sư', N'Số 12 Ngõ 193 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001082006002', N'Phan Thị Mai', '1982-06-12', 'Female', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Kế toán', N'Số 12 Ngõ 193 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001105006003', N'Hoàng Gia Bảo', '2005-09-30', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Học sinh', N'Số 12 Ngõ 193 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @c3 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by) 
VALUES (N'HK-HN-LB-004', @c1, N'Số 12 Ngõ 193 Phố Phúc Lợi, Tổ 4, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @h_id = SCOPE_IDENTITY();

INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES 
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ'), (@h_id, @c3, N'Con');


-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 3: Tổ 1 - Nhà gồm 3 thành viên
-- ------------------------------------------------------------
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001065007001', N'Vũ Đình Trọng', '1965-10-10', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Giáo viên', N'Số 30 Phố Tình Quang, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001068007002', N'Lê Thị Hoa', '1968-04-22', 'Female', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Nội trợ', N'Số 30 Phố Tình Quang, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001090007003', N'Vũ Anh Tuấn', '1990-12-01', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Bác sĩ', N'Số 30 Phố Tình Quang, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @c3 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by) 
VALUES (N'HK-HN-LB-005', @c1, N'Số 30 Phố Tình Quang, Tổ 1, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @h_id = SCOPE_IDENTITY();

INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES 
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ'), (@h_id, @c3, N'Con');


-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 4: Tổ 2 - Nhà gồm 2 thành viên
-- ------------------------------------------------------------
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001078008001', N'Trần Văn Long', '1978-08-08', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Lái xe', N'Số 45 Ngõ 210 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001080008002', N'Nguyễn Thị Kim', '1980-01-19', 'Female', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Thợ may', N'Số 45 Ngõ 210 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by) 
VALUES (N'HK-HN-LB-006', @c1, N'Số 45 Ngõ 210 Phố Phúc Lợi, Tổ 2, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @h_id = SCOPE_IDENTITY();

INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES 
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ');


-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 5: Tổ 3 - Gia đình người dân tộc thiểu số
-- ------------------------------------------------------------
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001085009001', N'Lý Văn Hùng', '1985-07-14', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Tày', N'Công nhân', N'Số 60 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001088009002', N'Triệu Thị Lan', '1988-09-03', 'Female', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Nùng', N'Công nhân', N'Số 60 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001110009003', N'Lý Gia Huy', '2010-05-20', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Tày', N'Học sinh', N'Số 60 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c3 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by) 
VALUES (N'HK-HN-LB-007', @c1, N'Số 60 Phố Phúc Lợi, Tổ 3, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @h_id = SCOPE_IDENTITY();

INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES 
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ'), (@h_id, @c3, N'Con');


-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 6: Tổ 4 - Vợ chồng hưu trí
-- ------------------------------------------------------------
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001060010001', N'Bùi Văn Kiên', '1960-11-30', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Hưu trí', N'Số 22 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001062010002', N'Đỗ Thị Minh', '1962-02-17', 'Female', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Hưu trí', N'Số 22 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by) 
VALUES (N'HK-HN-LB-008', @c1, N'Số 22 Phố Phúc Lợi, Tổ 4, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @h_id = SCOPE_IDENTITY();

INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES 
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ');


-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 7: Tổ 1 - Hộ gia đình trẻ (Có đăng ký khai sinh con)
-- ------------------------------------------------------------
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001092011001', N'Phạm Minh Đức', '1992-04-05', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Lập trình viên', N'Số 18 Ngõ 12 Phố Tình Quang, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001093011002', N'Trần Thu Trang', '1993-08-16', 'Female', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Thiết kế', N'Số 18 Ngõ 12 Phố Tình Quang, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001117011003', N'Phạm Bảo Châu', '2017-10-25', 'Female', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Trẻ em', N'Số 18 Ngõ 12 Phố Tình Quang, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @c3 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by) 
VALUES (N'HK-HN-LB-009', @c1, N'Số 18 Ngõ 12 Phố Tình Quang, Tổ 1, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @h_id = SCOPE_IDENTITY();

INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES 
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ'), (@h_id, @c3, N'Con');


-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 8: Tổ 2 - Hộ gia đình 3 thế hệ (4 thành viên)
-- ------------------------------------------------------------
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001055012001', N'Nguyễn Văn An', '1955-06-20', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Hưu trí', N'Số 55 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001085012002', N'Nguyễn Thanh Tùng', '1985-03-12', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Giám đốc', N'Số 55 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001087012003', N'Võ Thị Bích', '1987-11-01', 'Female', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Trưởng phòng', N'Số 55 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c3 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by) 
VALUES (N'001112012004', N'Nguyễn Hoàng Anh', '2012-07-07', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Kinh', N'Học sinh', N'Số 55 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c4 = SCOPE_IDENTITY();

-- Sửa lỗi cú pháp bị cắt ngắn tại đây:
INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by) 
VALUES (N'HK-HN-LB-010', @c1, N'Số 55 Phố Phúc Lợi, Tổ 2, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @h_id = SCOPE_IDENTITY();

INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES 
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Con'), (@h_id, @c3, N'Con dâu'), (@h_id, @c4, N'Cháu');

UPDATE Citizens
SET 
    phone = '09' + RIGHT('00000000' + CAST(ABS(CHECKSUM(NEWID())) % 100000000 AS VARCHAR(8)), 8),
    email = 'cudan' + CAST(citizen_id AS VARCHAR(10)) + '@gmail.com'
WHERE phone IS NULL OR email IS NULL;
GO

-- ==============================================================
-- TẠO DỮ LIỆU MẪU CHO LOẠI HỘ KHẨU KHÁC (TẠM TRÚ)
-- ==============================================================
DECLARE @c_id INT, @h_id INT;

-- 1. Hộ Tạm trú
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, permanent_address, ward_id, created_by, phone, email)
VALUES (N'001090023002', N'Nguyễn Thị Thu Hương', '1990-09-20', 'Female', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Số 15 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2, '0987654321', 'huong.tamtru@gmail.com');
SET @c_id = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, household_type, created_by)
VALUES (N'HK-TR-002', @c_id, N'Nhà trọ số 12 Phố Phúc Lợi, Tổ 1, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, N'Tạm trú', 2);
SET @h_id = SCOPE_IDENTITY();

INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) 
VALUES (@h_id, @c_id, N'Chủ hộ tạm trú');
GO

-- ============================================================================
-- 5B. CHÈN DỮ LIỆU MẪU CHO CÁC BẢNG KHÁC (TẠM TRÚ, TẠM VẮNG, KHAI SINH, KHAI TỬ, TOKENS, LOGS)
-- ============================================================================
DECLARE @c_id INT;

-- 2. Đăng ký Tạm trú (TemporaryResidences) cho Nguyễn Thị Thu Hương
SELECT @c_id = citizen_id FROM Citizens WHERE citizen_code = N'001090023002';
INSERT INTO TemporaryResidences (citizen_id, temporary_address, ward_id, reason, start_date, end_date, created_by)
VALUES (@c_id, N'Nhà trọ số 12 Phố Phúc Lợi, Tổ 1, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, N'Đi làm việc', '2026-01-01', '2026-12-31', 2);

-- 3. Đăng ký Tạm vắng (TemporaryAbsences) cho Đặng Minh Khang
DECLARE @citizen_khang INT;
SELECT @citizen_khang = citizen_id FROM Citizens WHERE citizen_code = N'001095005003';
INSERT INTO TemporaryAbsences (citizen_id, destination_address, destination_ward_code, reason, start_date, expected_return_date, created_by)
VALUES (@citizen_khang, N'Số 90 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'PL-TO-01', N'Học tập', '2026-02-01', '2026-10-31', 2);

-- 4. Giấy khai sinh (BirthCertificates) cho Phạm Bảo Châu
DECLARE @child_id INT, @father_id INT, @mother_id INT;
SELECT @child_id = citizen_id FROM Citizens WHERE citizen_code = N'001117011003';
SELECT @father_id = citizen_id FROM Citizens WHERE citizen_code = N'001092011001';
SELECT @mother_id = citizen_id FROM Citizens WHERE citizen_code = N'001093011002';
INSERT INTO BirthCertificates (certificate_number, child_citizen_id, father_citizen_id, mother_citizen_id, birth_place, registrar_name, created_by)
VALUES (N'KS-2017-0001', @child_id, @father_id, @mother_id, N'Trạm y tế Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Nguyễn Văn A', 2);

-- 5. Giấy khai tử (DeathCertificates) cho một công dân cao tuổi mới
DECLARE @deceased_id INT;
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, permanent_address, ward_id, created_by)
VALUES (N'001035001234', N'Nguyễn Văn Cụt', '1935-05-15', 'Male', N'Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Số 10 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @deceased_id = SCOPE_IDENTITY();

INSERT INTO DeathCertificates (certificate_number, citizen_id, date_of_death, place_of_death, cause_of_death, burial_place, registrar_name, created_by)
VALUES (N'KT-2026-0001', @deceased_id, '2026-01-10', N'Nhà riêng, Số 10 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Tuổi già', N'Nghĩa trang Phường Phúc Lợi, Quận Long Biên, Hà Nội', N'Nguyễn Văn A', 2);

-- 6. Refresh Tokens (RefreshTokens)
DECLARE @admin_user_id INT;
SELECT @admin_user_id = user_id FROM Users WHERE username = N'admin';
INSERT INTO RefreshTokens (user_id, token, expires_at)
VALUES (@admin_user_id, N'definitely-a-valid-refresh-token-for-admin-demo-purposes', DATEADD(day, 7, GETDATE()));

-- 7. Nhật ký thao tác (AuditLogs)
DECLARE @staff_user_id INT;
SELECT @staff_user_id = user_id FROM Users WHERE username = N'staff01';
INSERT INTO AuditLogs (user_id, action, table_name, record_id, old_value, new_value, ip_address, user_agent)
VALUES (@staff_user_id, N'INSERT', N'Citizens', 1, NULL, N'{"citizen_code": "001070005001", "full_name": "Đặng Văn Hùng"}', N'127.0.0.1', N'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
GO

-- ============================================================================
-- 6. GÁN citizen_id CHO VIEWER01 → công dân đầu tiên (citizen_id = 1)
-- ============================================================================
UPDATE Users
SET citizen_id = 1
WHERE username = 'viewer01';
GO

PRINT N'=== Hoàn tất! Dữ liệu mẫu đã được nạp thành công. ===';
GO
