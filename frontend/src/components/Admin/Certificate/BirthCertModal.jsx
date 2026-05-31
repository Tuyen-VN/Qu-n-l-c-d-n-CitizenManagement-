import { useState } from "react";
import { Modal, Form, Input, DatePicker, Select, Row, Col, message, notification } from "antd";
import { createBirthCertificateAPI, callListCitizensAPI } from "../../../services/api.service";

const BirthCertModal = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [parentOptions, setParentOptions] = useState([]);

  // Chỉ dùng để tìm cha/mẹ (không cần tìm trẻ nữa)
  const handleParentSearch = async (val) => {
    if (!val) return;
    const res = await callListCitizensAPI({ searchTerm: val });
    if (res?.data) {
      setParentOptions(res.data.map(c => ({
        label: `${c.citizen_code} - ${c.full_name}`,
        value: c.citizen_id,
      })));
    }
  };

  const onFinish = async (v) => {
    setLoading(true);
    try {
      const payload = {
        ...v,
        child_dob: v.child_dob?.format("YYYY-MM-DD"),
      };
      const res = await createBirthCertificateAPI(payload);
      if (res?.success) {
        message.success("Đăng ký khai sinh thành công");
        form.resetFields();
        onClose();
        onCreated();
      } else {
        notification.error({ message: "Lỗi", description: res?.error?.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Đăng ký khai sinh mới"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={700}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>

        {/* ── Thông tin trẻ – nhập trực tiếp, không chọn từ danh sách ── */}
        <Form.Item label="Họ và tên trẻ" name="child_full_name" rules={[{ required: true, message: "Vui lòng nhập họ tên trẻ" }]}>
          <Input placeholder="Nguyễn Văn A..." />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Ngày sinh" name="child_dob" rules={[{ required: true, message: "Vui lòng chọn ngày sinh" }]}>
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                disabledDate={(d) => d && d.isAfter(new Date())}
                placeholder="Chọn ngày sinh..."
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Giới tính" name="child_gender" rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}>
              <Select placeholder="Chọn giới tính..." options={[
                { label: "Nam", value: "Male" },
                { label: "Nữ", value: "Female" },
              ]} />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Thông tin cha mẹ – vẫn tìm từ danh sách Công dân ── */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="father_citizen_id" label="Họ tên Cha">
              <Select
                showSearch
                onSearch={handleParentSearch}
                filterOption={false}
                options={parentOptions}
                placeholder="Tìm kiếm cha..."
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="mother_citizen_id" label="Họ tên Mẹ">
              <Select
                showSearch
                onSearch={handleParentSearch}
                filterOption={false}
                options={parentOptions}
                placeholder="Tìm kiếm mẹ..."
              />
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