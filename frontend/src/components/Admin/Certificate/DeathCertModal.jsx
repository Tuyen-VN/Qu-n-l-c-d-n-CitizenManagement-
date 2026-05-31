import { useState } from "react";
import { Modal, Form, Input, DatePicker, Select, Row, Col, message, notification } from "antd";
import { createDeathCertificateAPI, callListCitizensAPI } from "../../../services/api.service";

const DeathCertModal = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [citizenOptions, setCitizenOptions] = useState([]);

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
      const payload = { ...v, date_of_death: v.date_of_death.format("YYYY-MM-DD") };
      const res = await createDeathCertificateAPI(payload);
      if (res?.success) {
        message.success("Đăng ký khai tử thành công");
        form.resetFields();
        onClose();
        onCreated();
      } else {
        notification.error({ message: "Lỗi", description: res?.error?.message });
      }
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Đăng ký khai tử" open={open} onCancel={onClose} onOk={() => form.submit()} confirmLoading={loading} width={700}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="citizen_id" label="Người mất" rules={[{ required: true }]}>
          <Select showSearch onSearch={handleSearch} filterOption={false} options={citizenOptions} placeholder="Nhập tên hoặc mã định danh người mất..." />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="date_of_death" label="Ngày mất" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="place_of_death" label="Nơi mất">
              <Input placeholder="Địa chỉ nơi mất..." />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="cause_of_death" label="Nguyên nhân tử vong">
          <Input placeholder="Bệnh lý, tai nạn..." />
        </Form.Item>
        <Form.Item name="burial_place" label="Nơi an táng">
          <Input placeholder="Nghĩa trang, địa chỉ an táng..." />
        </Form.Item>
        <Form.Item name="registrar_name" label="Người thực hiện khai báo">
          <Input placeholder="Họ tên người đi khai tử..." />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DeathCertModal;