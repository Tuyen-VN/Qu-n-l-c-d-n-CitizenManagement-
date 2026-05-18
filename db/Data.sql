USE CitizenManagementDB;
GO

-- ============================================================================
-- BƯỚC 1: DỌN DẸP SẠCH SẼ DỮ LIỆU CŨ ĐỂ TRÁNH LỖI TRÙNG KHÓA (UNIQUE KEY CONFLICT)
-- Khi người mới chạy lại nhiều lần, kịch bản này vẫn hoạt động mượt mà.
-- ============================================================================

PRINT '--- Đang dọn dẹp dữ liệu cũ để chuẩn bị làm mới ---';

-- Tắt tạm thời các Trigger để quá trình xóa/chèn dữ liệu không bị đá nhau
DISABLE TRIGGER trg_UpdateHouseholdMemberCount ON HouseholdMembers;
DISABLE TRIGGER trg_UpdateCitizenStatusOnDeath ON DeathCertificates;

-- Xóa dữ liệu theo thứ tự từ bảng con (bảng chứa khóa ngoại) lên bảng cha
DELETE FROM AuditLogs;
DELETE FROM RefreshTokens;
DELETE FROM DeathCertificates;
DELETE FROM BirthCertificates;
DELETE FROM TemporaryAbsences;
DELETE FROM TemporaryResidences;
DELETE FROM HouseholdMembers;
DELETE FROM Households;

-- Chỉ xóa các công dân mẫu (giữ lại 3 tài khoản Users hệ thống và các công dân gốc nếu có id <= 4)
DELETE FROM Citizens WHERE citizen_id > 4; 

-- Bật lại các Trigger sau khi đã dọn dẹp sạch sẽ
ENABLE TRIGGER trg_UpdateHouseholdMemberCount ON HouseholdMembers;
ENABLE TRIGGER trg_UpdateCitizenStatusOnDeath ON DeathCertificates;
GO

-- ============================================================================
-- BƯỚC 2: CHÈN DỮ LIỆU MẪU ĐỒNG BỘ (ĐỊA BÀN: PHƯỜNG PHÚC LỢI, QUẬN LONG BIÊN)
-- Sử dụng biến tạm SCOPE_IDENTITY() để lấy ID tự động, chống sập liên kết dữ liệu.
-- ============================================================================

PRINT '--- Đang tiến hành chèn dữ liệu mẫu cho 17 Hộ gia đình ---';

-- Khai báo các biến tạm lưu ID để map chính xác mối quan hệ gia đình
DECLARE @c1 INT, @c2 INT, @c3 INT, @c4 INT;
DECLARE @h_id INT;

-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 1: Tổ 3 - Nhà gồm 4 thành viên
-- ------------------------------------------------------------
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


-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 2: Tổ 4 - Nhà gồm 3 thành viên
-- ------------------------------------------------------------
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


-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 3: Tổ 1 - Nhà gồm 3 thành viên
-- ------------------------------------------------------------
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


-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 4: Tổ 2 - Nhà gồm 2 thành viên
-- ------------------------------------------------------------
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


-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 5: Tổ 3 - Gia đình người dân tộc thiểu số
-- ------------------------------------------------------------
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


-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 6: Tổ 4 - Vợ chồng hưu trí
-- ------------------------------------------------------------
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


-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 7: Tổ 1 - Hộ gia đình trẻ (Có đăng ký khai sinh con)
-- ------------------------------------------------------------
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


-- ------------------------------------------------------------
-- HỘ GIA ĐÌNH 8: Tổ 2 - Hộ gia đình 3 thế hệ (4 thành viên)
-- ------------------------------------------------------------
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
VALUES (N'HK-HN-LB-010', @c1, N

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
VALUES (N'001090023002', N'Nguyễn Thị Thu Hương', '1990-09-20', 'Female', N'Nghệ An', N'Quỳnh Lưu, Nghệ An', 1, 2, '0987654321', 'huong.tamtru@gmail.com');
SET @c_id = SCOPE_IDENTITY();

INSERT INTO Households (household_code, head_of_household_id, address, ward_id, household_type, created_by)
VALUES (N'HK-TR-002', @c_id, N'Nhà trọ số 12, Phường Việt Hưng', 1, N'Tạm trú', 2);
SET @h_id = SCOPE_IDENTITY();

INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head) 
VALUES (@h_id, @c_id, N'Chủ hộ tạm trú');
GO