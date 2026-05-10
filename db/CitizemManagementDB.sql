
USE master;
GO

-- Drop database if exists
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'CitizenManagementDB')
BEGIN
    ALTER DATABASE CitizenManagementDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE CitizenManagementDB;
END
GO

-- Create database
CREATE DATABASE CitizenManagementDB;
GO

USE CitizenManagementDB;
GO

-- =============================================
-- CITIZEN MANAGEMENT SYSTEM - DATABASE SCHEMA
-- SQL Server
-- =============================================

-- Drop existing tables if exists (for clean setup)
DROP TABLE IF EXISTS AuditLogs;
DROP TABLE IF EXISTS RefreshTokens;
DROP TABLE IF EXISTS DeathCertificates;
DROP TABLE IF EXISTS BirthCertificates;
DROP TABLE IF EXISTS TemporaryAbsences;
DROP TABLE IF EXISTS TemporaryResidences;
DROP TABLE IF EXISTS HouseholdMembers;
DROP TABLE IF EXISTS Households;
DROP TABLE IF EXISTS Citizens;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Wards;
DROP TABLE IF EXISTS Districts;
DROP TABLE IF EXISTS Provinces;
DROP TABLE IF EXISTS Roles;

-- =============================================
-- TABLE 1: Roles (Vai tro nguoi dung)
-- =============================================
CREATE TABLE Roles (
    role_id INT PRIMARY KEY IDENTITY(1,1),
    role_name NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- =============================================
-- TABLE 2: Provinces (Tinh/Thanh pho)
-- =============================================
CREATE TABLE Provinces (
    province_id INT PRIMARY KEY IDENTITY(1,1),
    province_code NVARCHAR(10) NOT NULL UNIQUE,
    province_name NVARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- =============================================
-- TABLE 3: Districts (Quan/Huyen)
-- =============================================
CREATE TABLE Districts (
    district_id INT PRIMARY KEY IDENTITY(1,1),
    district_code NVARCHAR(10) NOT NULL UNIQUE,
    district_name NVARCHAR(100) NOT NULL,
    province_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (province_id) REFERENCES Provinces(province_id) ON DELETE CASCADE
);

-- =============================================
-- TABLE 4: Wards (Phuong/Xa)
-- =============================================
CREATE TABLE Wards (
    ward_id INT PRIMARY KEY IDENTITY(1,1),
    ward_code NVARCHAR(10) NOT NULL UNIQUE,
    ward_name NVARCHAR(100) NOT NULL,
    district_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (district_id) REFERENCES Districts(district_id) ON DELETE CASCADE
);

-- =============================================
-- TABLE 5: Users (Nguoi dung he thong)
-- =============================================
CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE,
    phone NVARCHAR(20),
    role_id INT NOT NULL,
    ward_id INT, -- Ward ma user quan ly (neu la Staff)
    is_active BIT DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (role_id) REFERENCES Roles(role_id),
    FOREIGN KEY (ward_id) REFERENCES Wards(ward_id) ON DELETE SET NULL,
    CHECK (LEN(username) >= 3),
    CHECK (email LIKE '%@%.%')
);

-- =============================================
-- TABLE 6: Citizens (Cong dan)
-- =============================================
CREATE TABLE Citizens (
    citizen_id INT PRIMARY KEY IDENTITY(1,1),
    citizen_code NVARCHAR(20) NOT NULL UNIQUE, -- CCCD/CMND
    full_name NVARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender NVARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    place_of_birth NVARCHAR(255),
    ethnicity NVARCHAR(50) DEFAULT N'Kinh',
    religion NVARCHAR(50),
    nationality NVARCHAR(50) DEFAULT N'Vietnam',
    occupation NVARCHAR(100),
    education_level NVARCHAR(50),
    phone NVARCHAR(20),
    email NVARCHAR(100),
    permanent_address NVARCHAR(255), -- Dia chi thuong tru
    current_address NVARCHAR(255), -- Dia chi tam tru hien tai
    ward_id INT NOT NULL, -- Xa thuong tru
    is_active BIT DEFAULT 1, -- 0 neu da chet hoac khong con quan ly
    status NVARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Deceased', 'Moved', 'Inactive')),
    created_by INT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ward_id) REFERENCES Wards(ward_id),
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    CHECK (LEN(citizen_code) >= 9),
    CHECK (date_of_birth < GETDATE())
);

-- =============================================
-- TABLE 7: Households (Ho khau)
-- =============================================
CREATE TABLE Households (
    household_id INT PRIMARY KEY IDENTITY(1,1),
    household_code NVARCHAR(20) NOT NULL UNIQUE,
    head_of_household_id INT NOT NULL, -- Chu ho
    address NVARCHAR(255) NOT NULL,
    ward_id INT NOT NULL,
    household_type NVARCHAR(50) DEFAULT N'Thuong tru', -- Thuong tru / Tap the
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

-- =============================================
-- TABLE 8: HouseholdMembers (Thanh vien ho khau)
-- =============================================
CREATE TABLE HouseholdMembers (
    member_id INT PRIMARY KEY IDENTITY(1,1),
    household_id INT NOT NULL,
    citizen_id INT NOT NULL,
    relationship_to_head NVARCHAR(50) NOT NULL, -- Chu ho, Vo/Chong, Con, Bo/Me, Anh/Chi/Em...
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

-- =============================================
-- TABLE 9: TemporaryResidences (Tam tru)
-- =============================================
CREATE TABLE TemporaryResidences (
    temp_residence_id INT PRIMARY KEY IDENTITY(1,1),
    citizen_id INT NOT NULL,
    temporary_address NVARCHAR(255) NOT NULL,
    ward_id INT NOT NULL, -- Xa dang tam tru
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

-- =============================================
-- TABLE 10: TemporaryAbsences (Tam vang)
-- =============================================
CREATE TABLE TemporaryAbsences (
    temp_absence_id INT PRIMARY KEY IDENTITY(1,1),
    citizen_id INT NOT NULL,
    destination_address NVARCHAR(255) NOT NULL,
    destination_ward_code NVARCHAR(10), -- Ma xa noi den (neu co)
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

-- =============================================
-- TABLE 11: BirthCertificates (Giay khai sinh)
-- =============================================
CREATE TABLE BirthCertificates (
    birth_cert_id INT PRIMARY KEY IDENTITY(1,1),
    certificate_number NVARCHAR(20) NOT NULL UNIQUE,
    child_citizen_id INT NOT NULL UNIQUE, -- Tre moi sinh (da co trong Citizens)
    father_citizen_id INT,
    mother_citizen_id INT,
    birth_place NVARCHAR(255),
    registration_date DATE DEFAULT CAST(GETDATE() AS DATE),
    registrar_name NVARCHAR(100), -- Nguoi dang ky
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

-- =============================================
-- TABLE 12: DeathCertificates (Giay khai tu)
-- =============================================
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
    CHECK (date_of_death < GETDATE()),
    CHECK (DATEDIFF(DAY, date_of_death, registration_date) <= 7)
);

-- =============================================
-- TABLE 13: RefreshTokens (JWT Refresh Token)
-- =============================================
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

-- =============================================
-- TABLE 14: AuditLogs (Nhat ky hoat dong)
-- =============================================
CREATE TABLE AuditLogs (
    log_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT,
    action NVARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    table_name NVARCHAR(50),
    record_id INT,
    old_value NVARCHAR(MAX), -- JSON
    new_value NVARCHAR(MAX), -- JSON
    ip_address NVARCHAR(50),
    user_agent NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- =============================================
-- INDEXES (Non-clustered)
-- =============================================

-- Users table
CREATE INDEX IX_Users_Username ON Users(username);
CREATE INDEX IX_Users_Email ON Users(email);
CREATE INDEX IX_Users_RoleId ON Users(role_id);

-- Citizens table
CREATE INDEX IX_Citizens_CitizenCode ON Citizens(citizen_code);
CREATE INDEX IX_Citizens_FullName ON Citizens(full_name);
CREATE INDEX IX_Citizens_DateOfBirth ON Citizens(date_of_birth);
CREATE INDEX IX_Citizens_WardId ON Citizens(ward_id);
CREATE INDEX IX_Citizens_Status ON Citizens(status);

-- Households table
CREATE INDEX IX_Households_HouseholdCode ON Households(household_code);
CREATE INDEX IX_Households_HeadOfHousehold ON Households(head_of_household_id);
CREATE INDEX IX_Households_WardId ON Households(ward_id);

-- HouseholdMembers table
CREATE INDEX IX_HouseholdMembers_HouseholdId ON HouseholdMembers(household_id);
CREATE INDEX IX_HouseholdMembers_CitizenId ON HouseholdMembers(citizen_id);
CREATE INDEX IX_HouseholdMembers_IsCurrentMember ON HouseholdMembers(is_current_member);

-- TemporaryResidences table
CREATE INDEX IX_TempResidence_CitizenId ON TemporaryResidences(citizen_id);
CREATE INDEX IX_TempResidence_WardId ON TemporaryResidences(ward_id);
CREATE INDEX IX_TempResidence_Status ON TemporaryResidences(status);
CREATE INDEX IX_TempResidence_Dates ON TemporaryResidences(start_date, end_date);

-- TemporaryAbsences table
CREATE INDEX IX_TempAbsence_CitizenId ON TemporaryAbsences(citizen_id);
CREATE INDEX IX_TempAbsence_Status ON TemporaryAbsences(status);
CREATE INDEX IX_TempAbsence_Dates ON TemporaryAbsences(start_date, expected_return_date);

-- BirthCertificates table
CREATE INDEX IX_BirthCert_CertNumber ON BirthCertificates(certificate_number);
CREATE INDEX IX_BirthCert_ChildId ON BirthCertificates(child_citizen_id);
CREATE INDEX IX_BirthCert_FatherId ON BirthCertificates(father_citizen_id);
CREATE INDEX IX_BirthCert_MotherId ON BirthCertificates(mother_citizen_id);

-- DeathCertificates table
CREATE INDEX IX_DeathCert_CertNumber ON DeathCertificates(certificate_number);
CREATE INDEX IX_DeathCert_CitizenId ON DeathCertificates(citizen_id);
CREATE INDEX IX_DeathCert_DateOfDeath ON DeathCertificates(date_of_death);

-- AuditLogs table
CREATE INDEX IX_AuditLogs_UserId ON AuditLogs(user_id);
CREATE INDEX IX_AuditLogs_Action ON AuditLogs(action);
CREATE INDEX IX_AuditLogs_TableName ON AuditLogs(table_name);
CREATE INDEX IX_AuditLogs_CreatedAt ON AuditLogs(created_at);

-- RefreshTokens table
CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens(user_id);
CREATE INDEX IX_RefreshTokens_ExpiresAt ON RefreshTokens(expires_at);

-- =============================================
-- INSERT SAMPLE DATA
-- =============================================

-- Insert Roles
INSERT INTO Roles (role_name, description) VALUES 
(N'Admin', N'Quan tri vien he thong'),
(N'Staff', N'Can bo dia phuong'),
(N'Viewer', N'Nguoi xem thong tin');

-- Insert Provinces
INSERT INTO Provinces (province_code, province_name) VALUES 
(N'HN', N'Ha Noi'),
(N'HCM', N'Ho Chi Minh'),
(N'DN', N'Da Nang'),
(N'HP', N'Hai Phong');

-- Insert Districts (Ha Noi)
INSERT INTO Districts (district_code, district_name, province_id) VALUES 
(N'HN-BA', N'Ba Dinh', 1),
(N'HN-HK', N'Hoan Kiem', 1),
(N'HN-HD', N'Hai Ba Trung', 1),
(N'HN-DD', N'Dong Da', 1);

-- Insert Wards (Ba Dinh district)
INSERT INTO Wards (ward_code, ward_name, district_id) VALUES 
(N'HN-BA-01', N'Phuong Dien Bien', 1),
(N'HN-BA-02', N'Phuong Doi Can', 1),
(N'HN-BA-03', N'Phuong Ngoc Ha', 1),
(N'HN-BA-04', N'Phuong Giang Vo', 1);

-- Insert Admin User (password: Admin@123)
-- Hash generated by bcrypt with cost factor 10
INSERT INTO Users (username, password_hash, full_name, email, phone, role_id, is_active) VALUES 
(N'admin', N'$2a$12$YDVsQMoGx0Gj0DWdGbmqYONa5JBwAsnyfNOefg7fY7jL5PzC0oZM2', N'Administrator', N'admin@citizen.gov.vn', N'0123456789', 1, 1);

-- Insert Staff User (password: Staff@123)
INSERT INTO Users (username, password_hash, full_name, email, phone, role_id, ward_id, is_active) VALUES 
(N'staff01', N'$2a$12$m/pETcvT6F2stW5Oikc4m.DafCiK7TN3JEwuPs4bOJ1LTfGratlrC', N'Nguyen Van A', N'nguyenvana@citizen.gov.vn', N'0987654321', 2, 1, 1);

-- Insert Viewer User (password: Viewer@123)
INSERT INTO Users (username, password_hash, full_name, email, phone, role_id, ward_id, is_active) VALUES 
(N'viewer01', N'$2a$12$JMe8Akx8rrchmztQBA8rbuDRJniUzCyds1UKEfagug6hjPNpSfAze', N'Tran Thi B', N'tranthib@citizen.gov.vn', N'0912345678', 3, 1, 1);

-- Insert Sample Citizens
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, nationality, occupation, permanent_address, ward_id, created_by) VALUES 
(N'001099001234', N'Nguyen Van Minh', '1990-05-15', 'Male', N'Ha Noi', N'Kinh', N'Vietnam', N'Ky su', N'So 10 Dien Bien, Ba Dinh, Ha Noi', 1, 2),
(N'001088002345', N'Tran Thi Lan', '1992-08-20', 'Female', N'Ha Noi', N'Kinh', N'Vietnam', N'Giao vien', N'So 15 Dien Bien, Ba Dinh, Ha Noi', 1, 2),
(N'001095003456', N'Le Van Tuan', '1985-03-10', 'Male', N'Hai Phong', N'Kinh', N'Vietnam', N'Bac si', N'So 20 Doi Can, Ba Dinh, Ha Noi', 2, 2),
(N'001093004567', N'Pham Thi Hoa', '1995-12-25', 'Female', N'Ha Noi', N'Kinh', N'Vietnam', N'Nhan vien', N'So 25 Doi Can, Ba Dinh, Ha Noi', 2, 2);

-- Insert Sample Households
INSERT INTO Households (household_code, head_of_household_id, address, ward_id, registration_date, created_by) VALUES 
(N'HK-HN-BA-001', 1, N'So 10 Dien Bien, Phuong Dien Bien, Ba Dinh, Ha Noi', 1, '2020-01-15', 2),
(N'HK-HN-BA-002', 3, N'So 20 Doi Can, Phuong Doi Can, Ba Dinh, Ha Noi', 2, '2019-06-20', 2);

-- Insert Household Members
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head, join_date) VALUES 
(1, 1, N'Chu ho', '2020-01-15'),
(1, 2, N'Vo', '2020-01-15'),
(2, 3, N'Chu ho', '2019-06-20'),
(2, 4, N'Vo', '2019-06-20');

-- Update member count
UPDATE Households SET member_count = 2 WHERE household_id IN (1, 2);

-- =============================================
-- VIEWS
-- =============================================

-- View: Full Citizen Information with Ward/District/Province
GO
CREATE VIEW vw_CitizenDetails AS
SELECT 
    c.citizen_id,
    c.citizen_code,
    c.full_name,
    c.date_of_birth,
    DATEDIFF(YEAR, c.date_of_birth, GETDATE()) AS age,
    c.gender,
    c.ethnicity,
    c.nationality,
    c.occupation,
    c.education_level,
    c.phone,
    c.email,
    c.permanent_address,
    c.status,
    w.ward_name,
    d.district_name,
    p.province_name,
    c.created_at
FROM Citizens c
INNER JOIN Wards w ON c.ward_id = w.ward_id
INNER JOIN Districts d ON w.district_id = d.district_id
INNER JOIN Provinces p ON d.province_id = p.province_id
WHERE c.is_active = 1;
GO

-- View: Household with Head of Household Information
GO
CREATE VIEW vw_HouseholdDetails AS
SELECT 
    h.household_id,
    h.household_code,
    h.address,
    h.member_count,
    h.registration_date,
    c.citizen_code AS head_citizen_code,
    c.full_name AS head_full_name,
    c.phone AS head_phone,
    w.ward_name,
    d.district_name,
    p.province_name
FROM Households h
INNER JOIN Citizens c ON h.head_of_household_id = c.citizen_id
INNER JOIN Wards w ON h.ward_id = w.ward_id
INNER JOIN Districts d ON w.district_id = d.district_id
INNER JOIN Provinces p ON d.province_id = p.province_id;
GO

-- View: Active Temporary Residences
GO
CREATE VIEW vw_ActiveTemporaryResidences AS
SELECT 
    tr.temp_residence_id,
    c.citizen_code,
    c.full_name,
    tr.temporary_address,
    w.ward_name,
    d.district_name,
    tr.start_date,
    tr.end_date,
    DATEDIFF(DAY, GETDATE(), tr.end_date) AS days_remaining,
    tr.reason
FROM TemporaryResidences tr
INNER JOIN Citizens c ON tr.citizen_id = c.citizen_id
INNER JOIN Wards w ON tr.ward_id = w.ward_id
INNER JOIN Districts d ON w.district_id = d.district_id
WHERE tr.status = 'Active' AND tr.end_date >= CAST(GETDATE() AS DATE);
GO

-- View: Population Statistics by Ward
GO
CREATE VIEW vw_PopulationByWard AS
SELECT 
    w.ward_id,
    w.ward_name,
    d.district_name,
    p.province_name,
    COUNT(c.citizen_id) AS total_citizens,
    SUM(CASE WHEN c.gender = 'Male' THEN 1 ELSE 0 END) AS male_count,
    SUM(CASE WHEN c.gender = 'Female' THEN 1 ELSE 0 END) AS female_count,
    AVG(DATEDIFF(YEAR, c.date_of_birth, GETDATE())) AS avg_age
FROM Wards w
INNER JOIN Districts d ON w.district_id = d.district_id
INNER JOIN Provinces p ON d.province_id = p.province_id
LEFT JOIN Citizens c ON w.ward_id = c.ward_id AND c.is_active = 1 AND c.status = 'Active'
GROUP BY w.ward_id, w.ward_name, d.district_name, p.province_name;
GO

-- =============================================
-- STORED PROCEDURES
-- =============================================

-- Procedure: Get Citizen by ID with full details
GO
CREATE PROCEDURE sp_GetCitizenById
    @CitizenId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.*,
        w.ward_name,
        d.district_name,
        p.province_name,
        h.household_code,
        h.address AS household_address,
        hm.relationship_to_head
    FROM Citizens c
    INNER JOIN Wards w ON c.ward_id = w.ward_id
    INNER JOIN Districts d ON w.district_id = d.district_id
    INNER JOIN Provinces p ON d.province_id = p.province_id
    LEFT JOIN HouseholdMembers hm ON c.citizen_id = hm.citizen_id AND hm.is_current_member = 1
    LEFT JOIN Households h ON hm.household_id = h.household_id
    WHERE c.citizen_id = @CitizenId;
END;
GO

-- Procedure: Search Citizens
GO
CREATE PROCEDURE sp_SearchCitizens
    @SearchTerm NVARCHAR(100) = NULL,
    @WardId INT = NULL,
    @Gender NVARCHAR(10) = NULL,
    @MinAge INT = NULL,
    @MaxAge INT = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        c.citizen_id,
        c.citizen_code,
        c.full_name,
        c.date_of_birth,
        DATEDIFF(YEAR, c.date_of_birth, GETDATE()) AS age,
        c.gender,
        c.phone,
        c.permanent_address,
        w.ward_name,
        d.district_name,
        c.status
    FROM Citizens c
    INNER JOIN Wards w ON c.ward_id = w.ward_id
    INNER JOIN Districts d ON w.district_id = d.district_id
    WHERE 
        c.is_active = 1
        AND (@SearchTerm IS NULL OR c.full_name LIKE '%' + @SearchTerm + '%' OR c.citizen_code LIKE '%' + @SearchTerm + '%')
        AND (@WardId IS NULL OR c.ward_id = @WardId)
        AND (@Gender IS NULL OR c.gender = @Gender)
        AND (@MinAge IS NULL OR DATEDIFF(YEAR, c.date_of_birth, GETDATE()) >= @MinAge)
        AND (@MaxAge IS NULL OR DATEDIFF(YEAR, c.date_of_birth, GETDATE()) <= @MaxAge)
    ORDER BY c.full_name
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Return total count
    SELECT COUNT(*) AS total_count
    FROM Citizens c
    WHERE 
        c.is_active = 1
        AND (@SearchTerm IS NULL OR c.full_name LIKE '%' + @SearchTerm + '%' OR c.citizen_code LIKE '%' + @SearchTerm + '%')
        AND (@WardId IS NULL OR c.ward_id = @WardId)
        AND (@Gender IS NULL OR c.gender = @Gender)
        AND (@MinAge IS NULL OR DATEDIFF(YEAR, c.date_of_birth, GETDATE()) >= @MinAge)
        AND (@MaxAge IS NULL OR DATEDIFF(YEAR, c.date_of_birth, GETDATE()) <= @MaxAge);
END;
GO

-- Procedure: Get Household Members
GO
CREATE PROCEDURE sp_GetHouseholdMembers
    @HouseholdId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        hm.member_id,
        hm.household_id,
        c.citizen_id,
        c.citizen_code,
        c.full_name,
        c.date_of_birth,
        DATEDIFF(YEAR, c.date_of_birth, GETDATE()) AS age,
        c.gender,
        hm.relationship_to_head,
        hm.join_date,
        hm.is_current_member
    FROM HouseholdMembers hm
    INNER JOIN Citizens c ON hm.citizen_id = c.citizen_id
    WHERE hm.household_id = @HouseholdId
    ORDER BY 
        CASE 
            WHEN hm.relationship_to_head = N'Chu ho' THEN 1
            WHEN hm.relationship_to_head LIKE N'Vo%' OR hm.relationship_to_head LIKE N'Chong%' THEN 2
            ELSE 3
        END,
        c.date_of_birth;
END;
GO

-- Procedure: Population Statistics by Age Group
GO
CREATE PROCEDURE sp_GetPopulationByAgeGroup
    @WardId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        age_group,
        COUNT(*) AS count,
        SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) AS male_count,
        SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) AS female_count
    FROM (
        SELECT 
            c.citizen_id,
            c.gender,
            CASE 
                WHEN DATEDIFF(YEAR, c.date_of_birth, GETDATE()) < 6 THEN N'0-5'
                WHEN DATEDIFF(YEAR, c.date_of_birth, GETDATE()) BETWEEN 6 AND 14 THEN N'6-14'
                WHEN DATEDIFF(YEAR, c.date_of_birth, GETDATE()) BETWEEN 15 AND 24 THEN N'15-24'
                WHEN DATEDIFF(YEAR, c.date_of_birth, GETDATE()) BETWEEN 25 AND 54 THEN N'25-54'
                WHEN DATEDIFF(YEAR, c.date_of_birth, GETDATE()) BETWEEN 55 AND 64 THEN N'55-64'
                ELSE N'65+'
            END AS age_group
        FROM Citizens c
        WHERE 
            c.is_active = 1 
            AND c.status = 'Active'
            AND (@WardId IS NULL OR c.ward_id = @WardId)
    ) AS AgeData
    GROUP BY age_group
    ORDER BY 
        CASE age_group
            WHEN N'0-5' THEN 1
            WHEN N'6-14' THEN 2
            WHEN N'15-24' THEN 3
            WHEN N'25-54' THEN 4
            WHEN N'55-64' THEN 5
            WHEN N'65+' THEN 6
        END;
END;
GO

-- Procedure: Check Expiring Temporary Residences
GO
CREATE PROCEDURE sp_GetExpiringTemporaryResidences
    @DaysBeforeExpiry INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        tr.temp_residence_id,
        c.citizen_code,
        c.full_name,
        c.phone,
        tr.temporary_address,
        tr.end_date,
        DATEDIFF(DAY, GETDATE(), tr.end_date) AS days_remaining
    FROM TemporaryResidences tr
    INNER JOIN Citizens c ON tr.citizen_id = c.citizen_id
    WHERE 
        tr.status = 'Active'
        AND tr.end_date >= CAST(GETDATE() AS DATE)
        AND DATEDIFF(DAY, GETDATE(), tr.end_date) <= @DaysBeforeExpiry
    ORDER BY tr.end_date;
END;
GO

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function: Calculate Age from Date of Birth
GO
CREATE FUNCTION fn_CalculateAge(@DateOfBirth DATE)
RETURNS INT
AS
BEGIN
    DECLARE @Age INT;
    SET @Age = DATEDIFF(YEAR, @DateOfBirth, GETDATE());
    
    IF (MONTH(@DateOfBirth) > MONTH(GETDATE()) OR 
        (MONTH(@DateOfBirth) = MONTH(GETDATE()) AND DAY(@DateOfBirth) > DAY(GETDATE())))
    BEGIN
        SET @Age = @Age - 1;
    END
    
    RETURN @Age;
END;
GO

-- Function: Check if Citizen Code is Valid (9-12 digits)
GO
CREATE FUNCTION fn_IsValidCitizenCode(@CitizenCode NVARCHAR(20))
RETURNS BIT
AS
BEGIN
    IF @CitizenCode IS NULL OR LEN(@CitizenCode) < 9 OR LEN(@CitizenCode) > 12
        RETURN 0;
    
    IF @CitizenCode LIKE '%[^0-9]%'
        RETURN 0;
    
    RETURN 1;
END;
GO

-- Function: Get Total Population by Ward
GO
CREATE FUNCTION fn_GetPopulationByWard(@WardId INT)
RETURNS INT
AS
BEGIN
    DECLARE @Population INT;
    
    SELECT @Population = COUNT(*)
    FROM Citizens
    WHERE ward_id = @WardId AND is_active = 1 AND status = 'Active';
    
    RETURN ISNULL(@Population, 0);
END;
GO

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger: Update member_count in Households when HouseholdMembers changes
GO
CREATE TRIGGER trg_UpdateHouseholdMemberCount
ON HouseholdMembers
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update for inserted/updated records
    UPDATE h
    SET 
        h.member_count = (
            SELECT COUNT(*)
            FROM HouseholdMembers hm
            WHERE hm.household_id = h.household_id AND hm.is_current_member = 1
        ),
        h.updated_at = GETDATE()
    FROM Households h
    WHERE h.household_id IN (SELECT DISTINCT household_id FROM inserted);
    
    -- Update for deleted records
    UPDATE h
    SET 
        h.member_count = (
            SELECT COUNT(*)
            FROM HouseholdMembers hm
            WHERE hm.household_id = h.household_id AND hm.is_current_member = 1
        ),
        h.updated_at = GETDATE()
    FROM Households h
    WHERE h.household_id IN (SELECT DISTINCT household_id FROM deleted);
END;
GO

-- Trigger: Auto-update Citizen status when Death Certificate is created
GO
CREATE TRIGGER trg_UpdateCitizenStatusOnDeath
ON DeathCertificates
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE c
    SET 
        c.status = 'Deceased',
        c.is_active = 0,
        c.updated_at = GETDATE()
    FROM Citizens c
    INNER JOIN inserted i ON c.citizen_id = i.citizen_id;
    
    -- Remove from household (mark as not current member)
    UPDATE hm
    SET 
        hm.is_current_member = 0,
        hm.leave_date = (SELECT date_of_death FROM inserted WHERE citizen_id = hm.citizen_id),
        hm.updated_at = GETDATE()
    FROM HouseholdMembers hm
    INNER JOIN inserted i ON hm.citizen_id = i.citizen_id
    WHERE hm.is_current_member = 1;
END;
GO

-- Trigger: Auto-expire Temporary Residences
GO
CREATE TRIGGER trg_ExpireTemporaryResidence
ON TemporaryResidences
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE tr
    SET tr.status = 'Expired'
    FROM TemporaryResidences tr
    INNER JOIN inserted i ON tr.temp_residence_id = i.temp_residence_id
    WHERE tr.end_date < CAST(GETDATE() AS DATE) AND tr.status = 'Active';
END;
GO

-- =============================================
-- GRANT PERMISSIONS (Example)
-- =============================================

-- Create roles and grant permissions as needed
-- This is just an example structure

PRINT 'Database schema created successfully!';
PRINT 'Total tables: 14';
PRINT 'Total views: 4';
PRINT 'Total stored procedures: 5';
PRINT 'Total functions: 3';
PRINT 'Total triggers: 3';