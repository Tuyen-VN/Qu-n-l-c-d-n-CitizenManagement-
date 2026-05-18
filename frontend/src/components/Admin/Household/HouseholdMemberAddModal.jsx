import { useEffect, useState } from "react";
import { Modal, Form, Select, Input, message, Spin } from "antd";
import {
  callListCitizensAPI,
  addHouseholdMemberAPI,
} from "../../../services/api.service";

const relationshipOptions = [
  { label: "Chủ hộ", value: "Chủ hộ" },
  { label: "Vợ", value: "Vợ" },
  { label: "Chồng", value: "Chồng" },
  { label: "Con", value: "Con" },
  { label: "Anh", value: "Anh" },
  { label: "Chị", value: "Chị" },
  { label: "Em", value: "Em" },
  { label: "Ông", value: "Ông" },
  { label: "Bà", value: "Bà" },
  { label: "Khác", value: "Khác" },
];

const HouseholdMemberAddModal = (props) => {
  const { open, setOpen, householdId, handleMemberAdded } = props;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [citizens, setCitizens] = useState([]);
  const [loadingCitizens, setLoadingCitizens] = useState(false);

  const fetchCitizens = async () => {
    setLoadingCitizens(true);
    try {
      const res = await callListCitizensAPI();
      if (res && res.data) {
        setCitizens(
          res.data.map((c) => ({
            label: `${c.full_name} (${c.citizen_code})`,
            value: c.citizen_id,
          }))
        );
      }
    } catch {
      message.error("Không thể tải danh sách công dân");
    } finally {
      setLoadingCitizens(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCitizens();
      form.resetFields();
    }
  }, [open]);

  const handleCancel = () => {
    setOpen(false);
    form.resetFields();
  };

  const handleOk = () => form.submit();

  const onFinish = async (values) => {
    const payload = {
      citizen_id: values.citizen_id,
      // DATA stays Vietnamese:
      relationship_to_head: values.relationship_to_head?.trim(),
    };
    setSubmitting(true);
    try {
      await addHouseholdMemberAPI(householdId, payload);
      message.success("Thêm thành viên thành công");
      setOpen(false);
      form.resetFields();
      handleMemberAdded?.(); // optional refresh callback
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Không thể thêm thành viên";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Thêm thành viên hộ khẩu"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Thêm"
      cancelText="Hủy"
      confirmLoading={submitting}
      maskClosable={!submitting}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
      >
        <Form.Item
          label="Công dân"
          name="citizen_id"
          rules={[{ required: true, message: "Please select a citizen" }]}
        >
          <Select
            showSearch
            allowClear
            placeholder="Chọn tên công dân"
            notFoundContent={loadingCitizens ? <Spin size="small" /> : null}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={citizens}
          />
        </Form.Item>

        <Form.Item
          label="Mối quan hệ với chủ hộ"
          name="relationship_to_head"
          rules={[
            { required: true, message: "Vui lòng chọn quan hệ với chủ hộ" },
          ]}
        >
          <Select
            showSearch
            placeholder="Chọn quan hệ gia đình"
            options={relationshipOptions}
            // Let users type custom Vietnamese value:
            // Use mode="combobox" if you want totally free typing:
            // mode="combobox"
          />
        </Form.Item>

        {/* If you prefer fully free text instead of Select, replace above with: 
        <Input placeholder="VD: Con, Vợ, Chồng, ..." /> */}
      </Form>
    </Modal>
  );
};

export default HouseholdMemberAddModal;
