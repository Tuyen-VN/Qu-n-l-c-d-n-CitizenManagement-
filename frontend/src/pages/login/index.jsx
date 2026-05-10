import { useState } from "react";
import { Users, ArrowLeft } from "lucide-react";
import { Form, Input, Button, Typography, notification, Flex } from "antd";
import { useNavigate } from "react-router-dom";
import { loginUserAPI } from "../../services/api.service";
import "../../assets/styles/loginPage.scss";
import { useDispatch } from "react-redux";
import { doLoginAction } from "../../redux/account/accountSlice";

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const onFinish = async (values) => {
    const { username, password } = values;
    try {
      setLoading(true);
      const res = await loginUserAPI(username.trim(), password);
      if (res && res.data) {
        localStorage.setItem("access_token", res.data.accessToken);
        localStorage.setItem("refresh_token", res.data.refreshToken);
        notification.success({
          message: "Sign in",
          description: "Signed in successfully.",
        });
        dispatch(doLoginAction(res.data.user));
        navigate("/");
      } else {
        notification.error({
          message: "Sign in failed",
          description: "Invalid credentials or server rejected the request.",
        });
      }
    } catch (err) {
      notification.error({
        message: "Sign in failed",
        description:
          err?.response?.data?.message ||
          "An error occurred. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-container">
          <div className="logo-icon">
            <Users size={32} />
          </div>
        </div>

        <Title level={3} className="login-title" style={{ marginBottom: 8 }}>
          Hệ Thống Quản Lý Công Dân
        </Title>
        <Text
          type="secondary"
          className="login-subtitle"
          style={{ display: "block", marginBottom: 24 }}
        >
          Đăng nhập để truy cập hệ thống
        </Text>

        <Form
          layout="vertical"
          className="login-form"
          size="large"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={{ username: "", password: "" }}
        >
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập." }]}
          >
            <Input
              // placeholder="e.g. admin"
              autoComplete="username"
              onPressEnter={(e) =>
                e.currentTarget.form?.dispatchEvent(
                  new Event("submit", { cancelable: true, bubbles: true })
                )
              }
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu." }]}
          >
            <Input.Password
              placeholder="Your password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="sign-in-btn"
              loading={loading}
              block
              style={{ height: 48, background: "#1a4d8f" }}
            >
              Đăng Nhập
            </Button>
          </Form.Item>
        </Form>

        <Flex justify="center">
          <Button
            type="link"
            className="back-link"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate("/")}
          >
            Quay Lại Trang Chủ
          </Button>
        </Flex>
      </div>
    </div>
  );
};
export default LoginPage;
