import { useEffect, useState } from "react";
import { Modal, Form, DatePicker, message, notification, Typography, Card } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { returnTemporaryAbsenceAPI } from "../../../services/api.service";

dayjs.locale("vi");
const { Text } = Typography;

const AbsenceReturnModal = ({ open, onClose, onSaved, absenceData }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        actual_return_date: dayjs().format("YYYY-MM-DD"),
      });
    }
  }, [open, form]);

  if (!absenceData) return null;

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const res = await returnTemporaryAbsenceAPI(absenceData.id, values.actual_return_date);

      if (res && res.success === true) {
        message.success("Cập nhật ngày về thực tế thành công");
        form.resetFields();
        onClose && onClose();
        onSaved && onSaved();
      } else {
        notification.error({
          message: "Lỗi cập nhật",
          description: res?.error?.message || res?.message || "Đã có lỗi xảy ra",
        });
      }
    } catch (e) {
      if (!e?.errorFields) {
        message.error(e?.response?.data?.message || "Cập nhật thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const validateReturnDate = (_, value) => {
    if (!value || !absenceData.start_date) return Promise.resolve();
    const start = dayjs(absenceData.start_date);
    if (dayjs(value, "YYYY-MM-DD").isBefore(start, "day")) {
      return Promise.reject(new Error(`Ngày về thực tế phải từ ngày bắt đầu (${start.format("DD/MM/YYYY")}) trở đi`));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title="Cập nhật ngày về thực tế"
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose && onClose();
      }}
      onOk={onSubmit}
      okText="Xác nhận về"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnClose
    >
      <Card size="small" style={{ marginBottom: 16, backgroundColor: "#fafafa", borderRadius: 8 }}>
        <div style={{ marginBottom: 4 }}>
          <Text type="secondary">Công dân: </Text>
          <Text strong>{absenceData.full_name}</Text> <Text type="secondary">({absenceData.citizen_code})</Text>
        </div>
        <div>
          <Text type="secondary">Ngày bắt đầu vắng: </Text>
          <Text strong>{absenceData.start_date ? dayjs(absenceData.start_date).format("DD/MM/YYYY") : "—"}</Text>
        </div>
      </Card>

      <Form form={form} layout="vertical">
        <Form.Item
          label="Ngày về thực tế"
          name="actual_return_date"
          rules={[
            { required: true, message: "Vui lòng chọn ngày về thực tế" },
            { validator: validateReturnDate },
          ]}
          getValueFromEvent={(date) => (date ? date.format("YYYY-MM-DD") : undefined)}
          getValueProps={(v) => ({
            value: v ? dayjs(v, "YYYY-MM-DD") : null,
          })}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            disabledDate={(current) => {
              const start = absenceData.start_date;
              return start
                ? current && current < dayjs(start).startOf("day")
                : false;
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AbsenceReturnModal;
