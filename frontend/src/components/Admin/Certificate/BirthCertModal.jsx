import { useEffect, useState } from "react";
import { Modal, Form, Input, DatePicker, Select, Spin, Row, Col, message, notification } from "antd";
import { createBirthCertificateAPI, callListCitizensAPI } from "../../../services/api.service";

const BirthCertModal = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [citizenOptions, setCitizenOptions] = useState([]);

  // Hàm search công dân dùng chung
  const handleSearch = async (val) => {
    if (!val) return;
    const res = await callListCitizensAPI({ searchTerm: val });
    if (res?.data) {
      setCitizenOptions(res.data.map(c => ({
        label: `${c.citizen_code} - ${c.full_name}`,
        value: c.citizen_id
      })));
    }
  };

  const onFinish = async (v) => {
    setLoading(true);
    try {
      const res = await createBirthCertificateAPI(v);
      if (res?.success) {
        message.success("Đăng ký khai sinh thành công");
        form.resetFields();
        onClose();
        onCreated();
      } else {
        notification.error({ message: "Lỗi", description: res?.error?.message });
      }
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Đăng ký khai sinh mới" open={open} onCancel={onClose} onOk={() => form.submit()} confirmLoading={loading} width={700}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="child_citizen_id" label="Chọn trẻ em (Đã tạo trong mục Công dân)" rules={[{ required: true }]}>
          <Select showSearch onSearch={handleSearch} filterOption={false} options={citizenOptions} placeholder="Nhập tên hoặc mã định danh của trẻ..." />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="father_citizen_id" label="Họ tên Cha">
              <Select showSearch onSearch={handleSearch} filterOption={false} options={citizenOptions} placeholder="Tìm kiếm cha..." />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="mother_citizen_id" label="Họ tên Mẹ">
              <Select showSearch onSearch={handleSearch} filterOption={false} options={citizenOptions} placeholder="Tìm kiếm mẹ..." />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="birth_place" label="Nơi sinh">
          <Input placeholder="Tên bệnh viện, địa chỉ..." />
        </Form.Item>
        <Form.Item name="registrar_name" label="Cán bộ thực hiện">
          <Input placeholder="Tên cán bộ tư pháp..." />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BirthCertModal;