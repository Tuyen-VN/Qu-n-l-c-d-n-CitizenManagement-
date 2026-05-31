import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  Result,
  Row,
  Col,
  Skeleton,
  Tag,
  Typography,
  message,
} from "antd";
import {
  LockOutlined,
  ReloadOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  FieldTimeOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import "../../assets/styles/userProfile.scss";
import {
  callChangePassword,
  callFetchAccount,
  callUserById,
} from "../../services/api.service";

dayjs.locale("vi");
const { Title, Text } = Typography;

const UserProfile = () => {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [personalInfo, setPersonalInfo] = useState({
    user_id: null,
    username: "",
    full_name: "",
    email: "",
    phone: "",
    role_id: null,
    role_name: "",
    role_description: "",
    ward_id: null,
    ward_name: "",
    ward_code: "",
    district_name: "",
    district_code: "",
    province_name: "",
    province_code: "",
    is_active: true,
    last_login: null,
    created_at: "",
    updated_at: "",
  });

  const [form] = Form.useForm();

  useEffect(() => {
    getAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAccount = async () => {
    try {
      setLoading(true);
      setFetchError("");
      const res = await callFetchAccount();
      console.log(res);
      if (res?.data?.userId) {
        const detail = await callUserById(res.data.userId);
        console.log("detail ", detail);
        if (detail?.data) setPersonalInfo(detail.data);
      } else {
        setFetchError("Không thể xác định tài khoản hiện tại.");
      }
    } catch (e) {
      setFetchError("Không thể tải thông tin người dùng.");
      // eslint-disable-next-line no-console
      console.error("Error fetching account:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    const d = dayjs(dateString).subtract(7, "hour"); // trừ 7h
    return d.isValid() ? d.format("HH:mm DD/MM/YYYY") : "Chưa cập nhật";
  };

  const fullAddress = useMemo(() => {
    const parts = [
      personalInfo.ward_name,
      personalInfo.district_name,
      personalInfo.province_name,
    ].filter(Boolean);
    return parts.join(", ") || "Chưa cập nhật";
  }, [personalInfo]);

  const statusTag = personalInfo.is_active ? (
    <Tag icon={<CheckCircleTwoTone twoToneColor="#52c41a" />} color="success">
      Hoạt động
    </Tag>
  ) : (
    <Tag icon={<CloseCircleTwoTone twoToneColor="#ff4d4f" />} color="error">
      Không hoạt động
    </Tag>
  );

  const handleOpenChangePassword = () => {
    form.resetFields();
    setShowChangePassword(true);
  };

  const onSubmitChangePassword = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      };

      const res = await callChangePassword(payload);
      if (res && res.success === true) {
        message.success("Đổi mật khẩu thành công!");
        setShowChangePassword(false);
      } else {
        message.error(
          res?.details
            ? `Đổi mật khẩu thất bại: ${JSON.stringify(res.details)}`
            : "Đổi mật khẩu thất bại. Vui lòng thử lại."
        );
      }
    } catch (e) {
      // validateFields error hoặc API throw
      if (e?.errorFields) return; // lỗi validate -> đã hiển thị
      message.error(
        "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại."
      );
      // eslint-disable-next-line no-console
      console.error("Error changing password:", e);
    }
  };

  if (loading) {
    return (
      <div className="user-profile-page">
        <div className="container">
          <Card>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="user-profile-page">
        <div className="container">
          <Result
            status="warning"
            title="Lỗi tải dữ liệu"
            subTitle={fetchError}
            extra={
              <Button
                icon={<ReloadOutlined />}
                type="primary"
                onClick={getAccount}
              >
                Thử lại
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="container">
        <div className="page-header">
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Hồ Sơ Cá Nhân
            </Title>
            <Text type="secondary">
              Xem thông tin chi tiết về {personalInfo.full_name}
            </Text>
          </div>
          <div className="header-actions">
            {statusTag}
            <Button
              type="primary"
              icon={<LockOutlined />}
              onClick={handleOpenChangePassword}
            >
              Đổi mật khẩu
            </Button>
          </div>
        </div>

        <Card>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Descriptions
                title="Thông tin cơ bản"
                column={1}
                labelStyle={{ width: 180 }}
              >
                <Descriptions.Item label="Mã người dùng">
                  <Text strong>
                    <IdcardOutlined /> #{personalInfo.user_id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tên đăng nhập">
                  <UserOutlined /> {personalInfo.username || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Họ và tên">
                  {personalInfo.full_name || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  <MailOutlined /> {personalInfo.email || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  <PhoneOutlined /> {personalInfo.phone || "—"}
                </Descriptions.Item>
              </Descriptions>
            </Col>

            <Col xs={24} lg={12}>
              <Descriptions
                title="Vai trò & Trạng thái"
                column={1}
                labelStyle={{ width: 180 }}
              >
                <Descriptions.Item label="Vai trò">
                  <Tag color="processing">{personalInfo.role_name || "—"}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Mô tả vai trò">
                  <Text type="secondary">
                    {personalInfo.role_description || "—"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {statusTag}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={14}>
              <Descriptions
                title="Địa chỉ"
                column={1}
                labelStyle={{ width: 180 }}
              >
                <Descriptions.Item label="Địa chỉ đầy đủ">
                  <EnvironmentOutlined /> {fullAddress}
                </Descriptions.Item>
                <Descriptions.Item label="Mã địa bàn">
                  <Row gutter={8}>
                    <Col>
                      <Tag>Phường: {personalInfo.ward_code || "—"}</Tag>
                    </Col>
                    <Col>
                      <Tag>Quận: {personalInfo.district_code || "—"}</Tag>
                    </Col>
                    <Col>
                      <Tag>TP: {personalInfo.province_code || "—"}</Tag>
                    </Col>
                  </Row>
                </Descriptions.Item>
              </Descriptions>
            </Col>

            <Col xs={24} lg={10}>
              <Descriptions
                title="Mốc thời gian"
                column={1}
                labelStyle={{ width: 160 }}
              >
                <Descriptions.Item label="Đăng nhập gần nhất">
                  <FieldTimeOutlined /> {formatDate(personalInfo.last_login)}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {formatDate(personalInfo.created_at)}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật lần cuối">
                  {formatDate(personalInfo.updated_at)}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Modal đổi mật khẩu */}
      <Modal
        title="🔒 Đổi mật khẩu"
        open={showChangePassword}
        onCancel={() => setShowChangePassword(false)}
        onOk={onSubmitChangePassword}
        okText="Đổi mật khẩu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="Mật khẩu hiện tại"
            name="oldPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu hiện tại" },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu hiện tại" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới" },
              { min: 6, message: "Mật khẩu mới phải có ít nhất 6 ký tự" },
            ]}
            hasFeedback
          >
            <Input.Password placeholder="Nhập mật khẩu mới (≥ 6 ký tự)" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={["newPassword"]}
            hasFeedback
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp")
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserProfile;
