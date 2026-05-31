USE CitizenManagementDB;
GO

-- ============================================================================
-- BƯỚC 1: DỌN DẸP DỮ LIỆU CŨ (an toàn khi chạy lại nhiều lần)
-- ============================================================================
PRINT N'--- Đang dọn dẹp dữ liệu cũ ---';

DISABLE TRIGGER trg_UpdateHouseholdMemberCount  ON HouseholdMembers   IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_UpdateHouseholdMemberCount');
DISABLE TRIGGER trg_UpdateCitizenStatusOnDeath  ON DeathCertificates  IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_UpdateCitizenStatusOnDeath');

DELETE FROM AuditLogs;
DELETE FROM RefreshTokens;
DELETE FROM DeathCertificates;
DELETE FROM BirthCertificates;
DELETE FROM TemporaryAbsences;
DELETE FROM TemporaryResidences;
DELETE FROM HouseholdMembers;
DELETE FROM Households;
-- Bỏ liên kết citizen_id trên Users trước khi xóa Citizens
UPDATE Users SET citizen_id = NULL;
DELETE FROM Citizens;
-- Reset IDENTITY counter về 0
DBCC CHECKIDENT ('Citizens', RESEED, 0);
GO

ENABLE TRIGGER trg_UpdateHouseholdMemberCount  ON HouseholdMembers   IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_UpdateHouseholdMemberCount');
ENABLE TRIGGER trg_UpdateCitizenStatusOnDeath  ON DeathCertificates  IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_UpdateCitizenStatusOnDeath');
GO

-- ============================================================================
-- BƯỚC 2: CHÈN DỮ LIỆU MẪU (gender đồng nhất 'Male'/'Female' khớp backend)
-- ============================================================================
PRINT N'--- Đang chèn dữ liệu 17 hộ gia đình ---';

DECLARE @c1 INT, @c2 INT, @c3 INT, @c4 INT, @h_id INT;

-- ── HỘ 1: Tổ 3 – 4 thành viên ──────────────────────────────────────────────
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001070005001', N'Đặng Văn Hùng', '1970-01-20', 'Male', N'Hà Nội', N'Kinh', N'Kinh doanh', N'Số 50 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001072005002', N'Bùi Thị Thu', '1972-03-15', 'Female', N'Hà Nội', N'Kinh', N'Nội trợ', N'Số 50 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001095005003', N'Đặng Minh Khang', '1995-07-10', 'Male', N'Hà Nội', N'Kinh', N'Sinh viên', N'Số 50 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c3 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001098005004', N'Đặng Thị Anh', '1998-11-05', 'Female', N'Hà Nội', N'Kinh', N'Nhân viên văn phòng', N'Số 50 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c4 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-003', @c1, N'Số 50 Phố Phúc Lợi, Tổ 3, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ'), (@h_id, @c3, N'Con'), (@h_id, @c4, N'Con');

-- ── HỘ 2: Tổ 4 – 3 thành viên ──────────────────────────────────────────────
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001080006001', N'Hoàng Văn Nam', '1980-02-28', 'Male', N'Hải Phòng', N'Kinh', N'Kỹ sư', N'Số 12 Ngõ 193 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001082006002', N'Phan Thị Mai', '1982-06-12', 'Female', N'Hà Nội', N'Kinh', N'Kế toán', N'Số 12 Ngõ 193 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001105006003', N'Hoàng Gia Bảo', '2005-09-30', 'Male', N'Hà Nội', N'Kinh', N'Học sinh', N'Số 12 Ngõ 193 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @c3 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-004', @c1, N'Số 12 Ngõ 193 Phố Phúc Lợi, Tổ 4, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ'), (@h_id, @c3, N'Con');

-- ── HỘ 3: Tổ 1 – 3 thành viên ──────────────────────────────────────────────
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001065007001', N'Vũ Đình Trọng', '1965-10-10', 'Male', N'Nam Định', N'Kinh', N'Giáo viên', N'Số 30 Phố Tình Quang, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001068007002', N'Lê Thị Hoa', '1968-04-22', 'Female', N'Hà Nội', N'Kinh', N'Nội trợ', N'Số 30 Phố Tình Quang, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001090007003', N'Vũ Anh Tuấn', '1990-12-01', 'Male', N'Hà Nội', N'Kinh', N'Bác sĩ', N'Số 30 Phố Tình Quang, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @c3 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-005', @c1, N'Số 30 Phố Tình Quang, Tổ 1, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ'), (@h_id, @c3, N'Con');

-- ── HỘ 4: Tổ 2 – 2 thành viên ──────────────────────────────────────────────
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001078008001', N'Trần Văn Long', '1978-08-08', 'Male', N'Hà Nội', N'Kinh', N'Lái xe', N'Số 45 Ngõ 210 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001080008002', N'Nguyễn Thị Kim', '1980-01-19', 'Female', N'Hà Nội', N'Kinh', N'Thợ may', N'Số 45 Ngõ 210 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-006', @c1, N'Số 45 Ngõ 210 Phố Phúc Lợi, Tổ 2, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ');

-- ── HỘ 5: Tổ 3 – Dân tộc thiểu số ─────────────────────────────────────────
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001085009001', N'Lý Văn Hùng', '1985-07-14', 'Male', N'Cao Bằng', N'Tày', N'Công nhân', N'Số 60 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001088009002', N'Triệu Thị Lan', '1988-09-03', 'Female', N'Cao Bằng', N'Nùng', N'Công nhân', N'Số 60 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001110009003', N'Lý Gia Huy', '2010-05-20', 'Male', N'Hà Nội', N'Tày', N'Học sinh', N'Số 60 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c3 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-007', @c1, N'Số 60 Phố Phúc Lợi, Tổ 3, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ'), (@h_id, @c3, N'Con');

-- ── HỘ 6: Tổ 4 – Vợ chồng hưu trí ─────────────────────────────────────────
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001060010001', N'Bùi Văn Kiên', '1960-11-30', 'Male', N'Hà Nội', N'Kinh', N'Hưu trí', N'Số 22 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001062010002', N'Đỗ Thị Minh', '1962-02-17', 'Female', N'Hà Nội', N'Kinh', N'Hưu trí', N'Số 22 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-008', @c1, N'Số 22 Phố Phúc Lợi, Tổ 4, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ');

-- ── HỘ 7: Tổ 1 – Gia đình trẻ (có khai sinh con) ───────────────────────────
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001092011001', N'Phạm Minh Đức', '1992-04-05', 'Male', N'Hải Dương', N'Kinh', N'Lập trình viên', N'Số 18 Ngõ 12 Phố Tình Quang, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001093011002', N'Trần Thu Trang', '1993-08-16', 'Female', N'Hà Nội', N'Kinh', N'Thiết kế', N'Số 18 Ngõ 12 Phố Tình Quang, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001117011003', N'Phạm Bảo Châu', '2017-10-25', 'Female', N'Hà Nội', N'Kinh', N'Trẻ em', N'Số 18 Ngõ 12 Phố Tình Quang, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @c3 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-009', @c1, N'Số 18 Ngõ 12 Phố Tình Quang, Tổ 1, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ'), (@h_id, @c3, N'Con');

-- ── HỘ 8: Tổ 2 – 3 thế hệ (4 thành viên) ───────────────────────────────────
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001055012001', N'Nguyễn Văn An', '1955-06-20', 'Male', N'Hà Nội', N'Kinh', N'Hưu trí', N'Số 55 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001085012002', N'Nguyễn Thanh Tùng', '1985-03-12', 'Male', N'Hà Nội', N'Kinh', N'Giám đốc', N'Số 55 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001087012003', N'Võ Thị Bích', '1987-11-01', 'Female', N'Đà Nẵng', N'Kinh', N'Trưởng phòng', N'Số 55 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c3 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001112012004', N'Nguyễn Hoàng Anh', '2012-07-07', 'Male', N'Hà Nội', N'Kinh', N'Học sinh', N'Số 55 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c4 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-010', @c1, N'Số 55 Phố Phúc Lợi, Tổ 2, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Con'), (@h_id, @c3, N'Con dâu'), (@h_id, @c4, N'Cháu');

-- ── HỘ 9: Tổ 1 – Hộ đơn thân ───────────────────────────────────────────────
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001086013001', N'Đinh Thị Loan', '1986-03-18', 'Female', N'Thái Nguyên', N'Kinh', N'Giáo viên', N'Số 7 Phố Tình Quang, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-011', @c1, N'Số 7 Phố Tình Quang, Tổ 1, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES
(@h_id, @c1, N'Chủ hộ');

-- ── HỘ 10: Tổ 2 – Ông bà và cháu ───────────────────────────────────────────
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001058014001', N'Cao Văn Thắng', '1958-09-09', 'Male', N'Hà Nội', N'Kinh', N'Hưu trí', N'Số 33 Ngõ 210 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c1 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001061014002', N'Nguyễn Thị Sen', '1961-12-25', 'Female', N'Hà Nội', N'Kinh', N'Hưu trí', N'Số 33 Ngõ 210 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c2 = SCOPE_IDENTITY();

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001108014003', N'Cao Minh Triết', '2008-04-14', 'Male', N'Hà Nội', N'Kinh', N'Học sinh', N'Số 33 Ngõ 210 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c3 = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-012', @c1, N'Số 33 Ngõ 210 Phố Phúc Lợi, Tổ 2, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES
(@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ'), (@h_id, @c3, N'Cháu');

-- ── HỘ 11–17: Các hộ bổ sung Tổ 3 & 4 ──────────────────────────────────────
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001075015001', N'Trịnh Công Sơn', '1975-05-05', 'Male', N'Hà Nội', N'Kinh', N'Buôn bán', N'Số 11 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c1 = SCOPE_IDENTITY();
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001077015002', N'Nguyễn Thị Phương', '1977-08-20', 'Female', N'Hà Nội', N'Kinh', N'Kế toán', N'Số 11 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c2 = SCOPE_IDENTITY();
INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-013', @c1, N'Số 11 Phố Phúc Lợi, Tổ 3, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES (@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ');

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001083016001', N'Lê Thanh Hải', '1983-11-11', 'Male', N'Hải Phòng', N'Kinh', N'Thợ hàn', N'Số 99 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @c1 = SCOPE_IDENTITY();
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001086016002', N'Đào Thị Hằng', '1986-02-14', 'Female', N'Hà Nội', N'Kinh', N'Y tá', N'Số 99 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @c2 = SCOPE_IDENTITY();
INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-014', @c1, N'Số 99 Phố Phúc Lợi, Tổ 4, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES (@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ');

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001070017001', N'Phùng Văn Đạt', '1970-06-06', 'Male', N'Hà Nội', N'Kinh', N'Thợ mộc', N'Số 14 Phố Tình Quang, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @c1 = SCOPE_IDENTITY();
INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-015', @c1, N'Số 14 Phố Tình Quang, Tổ 1, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 1, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES (@h_id, @c1, N'Chủ hộ');

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001091018001', N'Vương Thị Ngọc', '1991-01-01', 'Female', N'Hà Nội', N'Kinh', N'Dược sĩ', N'Số 20 Ngõ 210 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @c1 = SCOPE_IDENTITY();
INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-016', @c1, N'Số 20 Ngõ 210 Phố Phúc Lợi, Tổ 2, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 2, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES (@h_id, @c1, N'Chủ hộ');

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001079019001', N'Đoàn Văn Phúc', '1979-07-07', 'Male', N'Hà Nội', N'Kinh', N'Cảnh sát', N'Số 88 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c1 = SCOPE_IDENTITY();
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001081019002', N'Bùi Thị Ngân', '1981-10-10', 'Female', N'Hà Nội', N'Kinh', N'Bưu điện', N'Số 88 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @c2 = SCOPE_IDENTITY();
INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-017', @c1, N'Số 88 Phố Phúc Lợi, Tổ 3, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 3, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES (@h_id, @c1, N'Chủ hộ'), (@h_id, @c2, N'Vợ');

INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, ethnicity, occupation, permanent_address, ward_id, created_by)
VALUES (N'001064020001', N'Hoàng Thị Yến', '1964-04-04', 'Female', N'Hà Nội', N'Kinh', N'Hưu trí', N'Số 5 Phố Phúc Lợi, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @c1 = SCOPE_IDENTITY();
INSERT INTO Households (household_code, head_of_household_id, address, ward_id, created_by)
VALUES (N'HK-HN-LB-018', @c1, N'Số 5 Phố Phúc Lợi, Tổ 4, Phường Phúc Lợi, Quận Long Biên, Hà Nội', 4, 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES (@h_id, @c1, N'Chủ hộ');

-- ── Hộ tạm trú ───────────────────────────────────────────────────────────────
INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, place_of_birth, permanent_address, ward_id, created_by, phone, email)
VALUES (N'001090023002', N'Nguyễn Thị Thu Hương', '1990-09-20', 'Female', N'Nghệ An', N'Quỳnh Lưu, Nghệ An', 1, 2, N'0987654321', N'huong.tamtru@gmail.com');
SET @c1 = SCOPE_IDENTITY();
INSERT INTO Households (household_code, head_of_household_id, address, ward_id, household_type, created_by)
VALUES (N'HK-TR-002', @c1, N'Nhà trọ số 12, Phường Việt Hưng', 1, N'Tạm trú', 2);
SET @h_id = SCOPE_IDENTITY();
INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) VALUES (@h_id, @c1, N'Chủ hộ tạm trú');
GO

-- ============================================================================
-- BƯỚC 3: CẬP NHẬT THÔNG TIN LIÊN LẠC NGẪU NHIÊN
-- ============================================================================
UPDATE Citizens
SET phone = '09' + RIGHT('00000000' + CAST(ABS(CHECKSUM(NEWID())) % 100000000 AS VARCHAR(8)), 8),
    email = 'cudan' + CAST(citizen_id AS VARCHAR(10)) + '@gmail.com'
WHERE phone IS NULL OR email IS NULL;
GO

-- ============================================================================
-- BƯỚC 4: GÁN citizen_id CHO VIEWER01 → công dân đầu tiên (citizen_id = 1)
-- ============================================================================
UPDATE Users
SET citizen_id = 1
WHERE username = 'viewer01';

-- Kiểm tra kết quả
SELECT
    u.user_id, u.username, u.full_name, u.role_id,
    u.citizen_id,
    c.full_name   AS citizen_name,
    c.citizen_code
FROM Users u
LEFT JOIN Citizens c ON u.citizen_id = c.citizen_id
ORDER BY u.user_id;
GO

PRINT N'=== Hoàn tất! Dữ liệu mẫu đã được nạp thành công. ===';
GO