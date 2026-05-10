import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, message, Spin, notification } from "antd";
import {
  callListCitizensAPI,
  callListWardAPI,
  createHouseholdAPI,
} from "../../../services/api.service";

const HouseholdModalCreate = ({
  isCreateOpen,
  setIsCreateOpen,
  fetchHousehold,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [citizens, setCitizens] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingCitizens, setLoadingCitizens] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // === Fetch Citizens (Head of Household) ===
  const fetchCitizens = async () => {
    setLoadingCitizens(true);
    try {
      const res = await callListCitizensAPI();
      if (res && res.data) {
        const data = res.data.map((c) => ({
          label: `${c.full_name} (${c.citizen_code})`,
          value: c.citizen_id,
        }));
        setCitizens(data);
      }
    } catch (err) {
      message.error("Không thể tải danh sách công dân");
      console.log(err);
    } finally {
      setLoadingCitizens(false);
    }
  };

  // === Fetch Wards ===
  const fetchWards = async () => {
    setLoadingWards(true);
    try {
      const res = await callListWardAPI();
      if (res && res.data) {
        const data = res.data.map((w) => ({
          label: w.ward_name, // tiếng Việt từ DB
          value: w.ward_id,
        }));
        setWards(data);
      }
    } catch (err) {
      message.error("Không thể tải danh sách phường/xã");
      console.log(err);
    } finally {
      setLoadingWards(false);
    }
  };

  useEffect(() => {
    if (isCreateOpen) {
      fetchCitizens();
      fetchWards();
      form.setFieldsValue({
        household_type: "Thường trú", // tiếng Việt cho dữ liệu
      });
    } else {
      form.resetFields();
    }
  }, [isCreateOpen]);

  const handleCancel = () => {
    setIsCreateOpen(false);
    form.resetFields();
  };

  const handleOk = () => {
    form.submit();
  };

  const onFinish = async (values) => {
    const payload = {
      head_of_household_id: values.head_of_household_id,
      address: values.address?.trim(),
      ward_id: values.ward_id,
      household_type: values.household_type, // giữ tiếng Việt
      notes: values.notes?.trim() || null,
    };
    console.log(">>> Kiểm tra payload gửi đi:", payload);

    setSubmitting(true);
    try {
      const res = await createHouseholdAPI(payload);
      console.log(res);
      if (res && res.data) {
        message.success("Tạo mới hộ khẩu thành công!");
        setIsCreateOpen(false);
        form.resetFields();
        await fetchHousehold?.();
      } else {
        notification.error({
          message: "Đã có lỗi xảy ra, tạo hộ khẩu thất bại",
          description: JSON.stringify(res?.error.message),
        });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tạo hộ khẩu mới";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Tạo mới hộ khẩu"
      open={isCreateOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Tạo"
      cancelText="Hủy"
      confirmLoading={submitting}
      maskClosable={!submitting}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        
      >
        {/* Head of Household */}
        <Form.Item
          label="Chủ hộ"
          name="head_of_household_id"
          rules={[
            { required: true, message: "Vui lòng chọn chủ hộ" },
          ]}
        >
          <Select
            showSearch
            allowClear
            placeholder="Chọn hoặc tìm kiếm công dân"
            notFoundContent={loadingCitizens ? <Spin size="small" /> : null}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={citizens}
          />
        </Form.Item>

        {/* Address */}
        <Form.Item
          label="Địa chỉ"
          name="address"
          rules={[
            { required: true, message: "Vui lòng nhập địa chỉ" },
            { max: 255, message: "Địa chỉ tối đa 255 ký tự" },
          ]}
        >
          <Input placeholder="e.g., Số 3 Đường HK Seed" />
        </Form.Item>

        {/* Ward */}
        <Form.Item
          label="Tổ dân phố"
          name="ward_id"
          rules={[{ required: true, message: "Vui lòng chọn tổ dân phố" }]}
        >
          <Select
            showSearch
            placeholder="Chọn tổ dân phố"
            loading={loadingWards}
            options={wards}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        {/* Household Type */}
        <Form.Item
          label="Loại hộ khẩu"
          name="household_type"
          rules={[{ required: true, message: "Vui lòng chọn loại hộ khẩu" }]}
        >
          <Select
            options={[{ label: "Thường trú", value: "Thuong tru" }]}
            placeholder="Chọn loại hộ khẩu"
          />
        </Form.Item>

        {/* Notes */}
        <Form.Item
          label="Ghi chú"
          name="notes"
          rules={[{ max: 500, message: "Tối đa 500 ký tự" }]}
        >
          <Input.TextArea
            placeholder="Nhập ghi chú thêm (nếu có)"
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default HouseholdModalCreate;
