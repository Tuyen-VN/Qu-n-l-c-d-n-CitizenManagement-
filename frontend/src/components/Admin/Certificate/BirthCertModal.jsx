import { useState } from "react";
import { Modal, Form, Input, DatePicker, Select, Row, Col, message, notification } from "antd";
import { createBirthCertificateAPI, callListCitizensAPI, callGetCitizenSpouseAPI } from "../../../services/api.service";

const BirthCertModal = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Options riêng cho cha và mẹ (không dùng chung để tránh ghi đè)
  const [fatherOptions, setFatherOptions] = useState([]);
  const [motherOptions, setMotherOptions] = useState([]);

  // Tìm kiếm cha
  const handleFatherSearch = async (val) => {
    if (!val) return;
    const res = await callListCitizensAPI({ searchTerm: val });
    if (res?.data) {
      setFatherOptions(res.data
        .filter(c => c.gender === 'Male' || c.gender === 'Nam')
        .map(c => ({
          label: `${c.citizen_code} - ${c.full_name}`,
          value: c.citizen_id,
        }))
      );
    }
  };

  // Tìm kiếm mẹ
  const handleMotherSearch = async (val) => {
    if (!val) return;
    const res = await callListCitizensAPI({ searchTerm: val });
    if (res?.data) {
      setMotherOptions(res.data
        .filter(c => c.gender === 'Female' || c.gender === 'Nữ')
        .map(c => ({
          label: `${c.citizen_code} - ${c.full_name}`,
          value: c.citizen_id,
        }))
      );
    }
  };

  // Khi chọn Cha → tự động tìm Mẹ (vợ cùng hộ khẩu, giới tính Female)
  const handleFatherSelect = async (citizenId) => {
    if (!citizenId) return;
    try {
      const res = await callGetCitizenSpouseAPI(citizenId);
      if (res?.data) {
        const spouse = res.data;
        // Thêm vợ vào danh sách options của mẹ và tự điền
        const spouseOption = {
          label: `${spouse.citizen_code} - ${spouse.full_name}`,
          value: spouse.citizen_id,
        };
        setMotherOptions([spouseOption]);
        form.setFieldsValue({ mother_citizen_id: spouse.citizen_id });
      }
    } catch (_) {
      // Không tìm được vợ thì bỏ qua, không báo lỗi
    }
  };

  // Khi chọn Mẹ → tự động tìm Cha (chồng cùng hộ khẩu, giới tính Male)
  const handleMotherSelect = async (citizenId) => {
    if (!citizenId) return;
    try {
      const res = await callGetCitizenSpouseAPI(citizenId);
      if (res?.data) {
        const spouse = res.data;
        const spouseOption = {
          label: `${spouse.citizen_code} - ${spouse.full_name}`,
          value: spouse.citizen_id,
        };
        setFatherOptions([spouseOption]);
        form.setFieldsValue({ father_citizen_id: spouse.citizen_id });
      }
    } catch (_) {
      // Không tìm được chồng thì bỏ qua
    }
  };

  // Khi xóa chọn Cha → xóa luôn Mẹ đã tự điền
  const handleFatherClear = () => {
    form.setFieldsValue({ mother_citizen_id: undefined });
    setMotherOptions([]);
  };

  // Khi xóa chọn Mẹ → xóa luôn Cha đã tự điền
  const handleMotherClear = () => {
    form.setFieldsValue({ father_citizen_id: undefined });
    setFatherOptions([]);
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
        setFatherOptions([]);
        setMotherOptions([]);
        onClose();
        onCreated();
      } else {
        notification.error({ message: "Lỗi", description: res?.error?.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFatherOptions([]);
    setMotherOptions([]);
    onClose();
  };

  return (
    <Modal
      title="Đăng ký khai sinh mới"
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={700}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>

        {/* ── Thông tin trẻ ── */}
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

        {/* ── Thông tin cha mẹ ── */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="father_citizen_id" label="Họ tên Cha">
              <Select
                showSearch
                allowClear
                onSearch={handleFatherSearch}
                onSelect={handleFatherSelect}
                onClear={handleFatherClear}
                filterOption={false}
                options={fatherOptions}
                placeholder="Tìm kiếm cha..."
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="mother_citizen_id" label="Họ tên Mẹ">
              <Select
                showSearch
                allowClear
                onSearch={handleMotherSearch}
                onSelect={handleMotherSelect}
                onClear={handleMotherClear}
                filterOption={false}
                options={motherOptions}
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