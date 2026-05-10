import {
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  notification,
  Row,
  Select,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import {
  callListWardAPI,
  createCitizenAPI,
} from "../../../services/api.service";
// Cập nhật API cho công dân (đổi tên theo service của bạn)

const CitizenModalCreate = (props) => {
  const { isCreateOpen, setIsCreateOpen, fetchCitizen, wardOptions } = props;
  const [isSubmit, setIsSubmit] = useState(false);
  const [form] = Form.useForm();

  const [wards, setWards] = useState(
    Array.isArray(wardOptions) ? wardOptions : []
  );

  useEffect(() => {
    const fetchWards = async () => {
      const res = await callListWardAPI();
      if (res && res.data) {
        const data = res.data.map((w) => ({
          label: w.ward_name,
          value: w.ward_id,
        }));
        setWards(data);
      }
    };
    fetchWards();
  }, []);
  const onFinish = async (values) => {
    const toDateISO = (d) => {
      if (!d) return null;
      const m = dayjs.isDayjs(d) ? d : dayjs(d, ["DD/MM/YYYY", "YYYY-MM-DD"]);
      return m.isValid() ? m.format("YYYY-MM-DD") : null;
    };
    try {
      const payload = {
        citizen_code: values.citizen_code?.trim(),
        full_name: values.full_name?.trim(),
        date_of_birth: toDateISO(values.date_of_birth),
        gender: values.gender,
        permanent_address: values.permanent_address?.trim(),
        ward_id: values.ward_id,
        phone: values.phone?.trim(),
        email: values.email?.trim(),
      };
      console.log(payload);
      setIsSubmit(true);
      const res = await createCitizenAPI(payload);
      console.log(res);
      if (res && res.data) {
        message.success("Tạo mới công dân thành công!");
        form.resetFields();
        setIsCreateOpen(false);
        await fetchCitizen?.();
      } else {
        notification.error({
          message: "Đã có lỗi xảy ra",
          description: JSON.stringify(res?.details) || "Không thể tạo công dân",
        });
      }
    } catch (e) {
      notification.error({
        message: "Đã có lỗi xảy ra",
        description: e?.message || "Vui lòng thử lại",
      });
    } finally {
      setIsSubmit(false);
    }
  };

  return (
    <>
      <Modal
        title="Thêm người dùng mới"
        open={isCreateOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          form.resetFields();
          setIsCreateOpen(false);
        }}
        okText="Tạo mới"
        cancelText="Hủy"
        confirmLoading={isSubmit}
        width={800}
      >
        <Form
          form={form}
          style={{
            maxWidth: 800,
            margin: "0 auto",
            background: "#fff",
            borderRadius: 12,
          }}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Divider />
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Mã công dân"
                name="citizen_code"
                rules={[
                  { required: true, message: "Vui lòng nhập mã công dân!" },
                  {
                    pattern: /^[0-9]{6,12}$/,
                    message: "Mã công dân chỉ gồm số (6–12 ký tự).",
                  },
                ]}
              >
                <Input placeholder="012345678" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Họ và tên"
                name="full_name"
                rules={[
                  { required: true, message: "Vui lòng nhập họ và tên!" },
                ]}
              >
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Ngày sinh"
                name="date_of_birth"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày sinh!" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="01/01/1990"
                  disabledDate={(current) => current && current > dayjs()}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Giới tính"
                name="gender"
                rules={[
                  { required: true, message: "Vui lòng chọn giới tính!" },
                ]}
              >
                <Select
                  placeholder="Chọn giới tính"
                  options={[
                    { label: "Nam", value: "Male" },
                    { label: "Nữ", value: "Female" },
                    { label: "Khác", value: "Other" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[20, 20]}>
            <Col xs={24}>
              <Form.Item
                label="Địa chỉ thường trú"
                name="permanent_address"
                rules={[
                  { required: true, message: "Vui lòng nhập địa chỉ!" },
                  { min: 5, message: "Địa chỉ quá ngắn." },
                ]}
              >
                <Input placeholder="123 Lê Lợi, Phường 1" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Phường/Xã (ward_id)"
                name="ward_id"
                rules={[
                  { required: true, message: "Vui lòng chọn phường/xã!" },
                ]}
              >
                <Select
                  showSearch
                  allowClear
                  placeholder="Chọn phường/xã"
                  options={wards}
                  // Nếu ward_id là số, đảm bảo value là number:
                  onChange={(v) => form.setFieldsValue({ ward_id: v })}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại!" },
                  {
                    pattern: /^(0|\+84)(\d{9}|\d{10})$/,
                    message: "Số điện thoại không hợp lệ.",
                  },
                ]}
              >
                <Input placeholder="0912345678" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email!" },
                  { type: "email", message: "Email không hợp lệ." },
                ]}
              >
                <Input placeholder="nvA@example.com" />
              </Form.Item>
            </Col>

            {/* Ví dụ nếu bạn cần nhập ward_id bằng số trực tiếp thay vì Select:
            <Col xs={24} sm={12}>
              <Form.Item label="Ward ID" name="ward_id">
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col> */}
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default CitizenModalCreate;
