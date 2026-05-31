import { useState, useEffect } from "react";
import {
  Button, Card, Descriptions, Divider, Form, Input,
  Modal, Result, Row, Col, Skeleton, Tag, Typography, message,
} from "antd";
import {
  LockOutlined, ReloadOutlined, UserOutlined, MailOutlined,
  PhoneOutlined, EnvironmentOutlined, IdcardOutlined,
  FieldTimeOutlined, CheckCircleTwoTone, CloseCircleTwoTone,
  TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import "../../assets/styles/userProfile.scss";
import { useSelector } from "react-redux";
import { callChangePassword, callFetchAccount, callUserById } from "../../services/api.service";

dayjs.locale("vi");
const { Title, Text } = Typography;

const UserProfile = () => {
  const [loading, setLoading]               = useState(true);
  const [fetchError, setFetchError]         = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [accountInfo, setAccountInfo]       = useState(null);
  const [form] = Form.useForm();

  // Lay citizen tu Redux (duoc luu khi login)
  const citizen = useSelector((state) => state.account.user?.citizen ?? null);
  const user = useSelector((state) => state.account.user);
  const userRole = user?.role || accountInfo?.role_name || "";
  const isAdminOrStaff = userRole === "Admin" || userRole === "ADMIN" || userRole === "Staff";

  useEffect(() => { getAccount(); }, []);

  const getAccount = async () => {
    try {
      setLoading(true);
      setFetchError("");
      const res = await callFetchAccount();
      if (res?.data?.userId) {
        const detail = await callUserById(res.data.userId);
        if (detail?.data) setAccountInfo(detail.data);
      } else {
        setFetchError("Không thể xác định tài khoản hiện tại.");
      }
    } catch (e) {
      setFetchError("Không thể tải thông tin người dùng.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fmt     = (d) => d && dayjs(d).subtract(7,"hour").isValid()
    ? dayjs(d).subtract(7,"hour").format("HH:mm DD/MM/YYYY") : "Chưa cập nhật";
  const fmtDate = (d) => d && dayjs(d).isValid()
    ? dayjs(d).format("DD/MM/YYYY") : "—";

  const citizenStatusColor = {
    Active:"success", Inactive:"default",
    Moved:"warning",  Deceased:"error", Absent:"gold",
  };

  const statusTag = accountInfo?.is_active
    ? <Tag icon={<CheckCircleTwoTone twoToneColor="#52c41a"/>} color="success">Hoạt động</Tag>
    : <Tag icon={<CloseCircleTwoTone  twoToneColor="#ff4d4f"/>} color="error">Không hoạt động</Tag>;

  const onChangePassword = async () => {
    try {
      const values = await form.validateFields();
      const res = await callChangePassword({
        oldPassword:     values.oldPassword,
        newPassword:     values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      if (res?.success) {
        message.success("Đổi mật khẩu thành công!");
        setShowChangePassword(false);
      } else {
        message.error("Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.");
      }
    } catch (e) {
      if (e?.errorFields) return;
      message.error("Vui lòng kiểm tra lại mật khẩu hiện tại.");
    }
  };

  if (loading) return (
    <div className="user-profile-page">
      <div className="container">
        <Card><Skeleton active paragraph={{ rows: 8 }}/></Card>
      </div>
    </div>
  );

  if (fetchError) return (
    <div className="user-profile-page">
      <div className="container">
        <Result status="warning" title="Lỗi tải dữ liệu" subTitle={fetchError}
          extra={<Button icon={<ReloadOutlined/>} type="primary" onClick={getAccount}>Thử lại</Button>}
        />
      </div>
    </div>
  );

  return (
    <div className="user-profile-page">
      <div className="container">

        {/* Header */}
        <div className="page-header">
          <div>
            <Title level={2} style={{ margin: 0 }}>Hồ Sơ Cá Nhân</Title>
            <Text type="secondary">Xem thông tin chi tiết về {accountInfo?.full_name}</Text>
          </div>
          <div className="header-actions">
            {isAdminOrStaff && statusTag}
            <Button type="primary" icon={<LockOutlined/>}
              onClick={() => { form.resetFields(); setShowChangePassword(true); }}>
              Đổi mật khẩu
            </Button>
          </div>
        </div>

        {/* ── Card 1: Thong tin tai khoan ── */}
        {isAdminOrStaff && (
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Descriptions title="Thông tin tài khoản" column={1} labelStyle={{ width: 180 }}>
                  <Descriptions.Item label="Mã người dùng">
                    <Text strong><IdcardOutlined /> #{accountInfo?.user_id}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tên đăng nhập">
                    <UserOutlined /> {accountInfo?.username || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Họ và tên">{accountInfo?.full_name || "—"}</Descriptions.Item>
                  <Descriptions.Item label="Email">
                    <MailOutlined /> {accountInfo?.email || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    <PhoneOutlined /> {accountInfo?.phone || "—"}
                  </Descriptions.Item>
                </Descriptions>
              </Col>

              <Col xs={24} lg={12}>
                <Descriptions title="Vai trò & Trạng thái" column={1} labelStyle={{ width: 180 }}>
                  <Descriptions.Item label="Vai trò">
                    <Tag color="processing">{accountInfo?.role_name || "—"}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mô tả vai trò">
                    <Text type="secondary">{accountInfo?.role_description || "—"}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">{statusTag}</Descriptions.Item>
                  <Descriptions.Item label="Đăng nhập gần nhất">
                    <FieldTimeOutlined /> {fmt(accountInfo?.last_login)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo tài khoản">
                    {fmt(accountInfo?.created_at)}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>
        )}

        {/* ── Card 2: Ho so cong dan ── */}
        {!isAdminOrStaff && (
          citizen ? (
            <Card>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <TeamOutlined style={{ fontSize:18, color:"#1890ff" }}/>
                <Title level={5} style={{ margin:0 }}>Hồ Sơ Công Dân</Title>
                <Tag color="blue">Phường Phúc Lợi</Tag>
              </div>

              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Descriptions title="Thông tin cơ bản" column={1} labelStyle={{ width: 180 }}>
                    <Descriptions.Item label="Số CCCD">
                      <Text strong><IdcardOutlined /> {citizen.citizen_code || "—"}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Họ và tên">{citizen.citizen_full_name || "—"}</Descriptions.Item>
                    <Descriptions.Item label="Ngày sinh">{fmtDate(citizen.date_of_birth)}</Descriptions.Item>
                    <Descriptions.Item label="Giới tính">{citizen.gender || "—"}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái cư trú">
                      <Tag color={citizenStatusColor[citizen.citizen_status] ?? "default"}>
                        {citizen.citizen_status || "—"}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>

                <Col xs={24} lg={12}>
                  <Descriptions title="Liên hệ & Địa chỉ" column={1} labelStyle={{ width: 180 }}>
                    <Descriptions.Item label="Số điện thoại">
                      <PhoneOutlined /> {citizen.citizen_phone || "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      <MailOutlined /> {citizen.citizen_email || "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ thường trú">
                      <EnvironmentOutlined /> {citizen.permanent_address || "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Khu vực">
                      {[citizen.citizen_ward_name, citizen.citizen_district_name, citizen.citizen_province_name]
                        .filter(Boolean).join(", ") || "—"}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>
          ) : (
            // Admin / Staff hoac viewer khong co citizen
            <Card>
              <Result
                icon={<TeamOutlined style={{ color:"#bbb" }}/>}
                title="Không có hồ sơ công dân"
                subTitle="Tài khoản này không được liên kết với công dân trong hệ thống."
                style={{ padding:"24px 0" }}
              />
            </Card>
          )
        )}
      </div>

      {/* Modal doi mat khau */}
      <Modal title="🔒 Đổi mật khẩu" open={showChangePassword}
        onCancel={() => setShowChangePassword(false)}
        onOk={onChangePassword} okText="Đổi mật khẩu" cancelText="Hủy" destroyOnClose>
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label="Mật khẩu hiện tại" name="oldPassword"
            rules={[{ required:true, message:"Vui lòng nhập mật khẩu hiện tại" }]}>
            <Input.Password placeholder="Nhập mật khẩu hiện tại"/>
          </Form.Item>
          <Form.Item label="Mật khẩu mới" name="newPassword" hasFeedback
            rules={[
              { required:true, message:"Vui lòng nhập mật khẩu mới" },
              { min:8, message:"Mật khẩu mới phải có ít nhất 8 ký tự" },
            ]}>
            <Input.Password placeholder="Nhập mật khẩu mới (≥ 8 ký tự)"/>
          </Form.Item>
          <Form.Item label="Xác nhận mật khẩu mới" name="confirmPassword"
            dependencies={["newPassword"]} hasFeedback
            rules={[
              { required:true, message:"Vui lòng xác nhận mật khẩu mới" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                },
              }),
            ]}>
            <Input.Password placeholder="Nhập lại mật khẩu mới"/>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserProfile;
