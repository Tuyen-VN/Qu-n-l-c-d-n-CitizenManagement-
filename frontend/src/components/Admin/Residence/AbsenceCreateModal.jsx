import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Row,
  Col,
  message,
  Select,
  Spin,
  notification,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  createTemporaryAbsencesAPI,
  callListCitizensAPI,
  callListWardAPI,
} from "../../../services/api.service";

dayjs.locale("vi");

// Debounce nhỏ gọn
function useDebounce(v, ms = 500) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

const AbsenceCreateModal = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Citizens
  const [citizens, setCitizens] = useState([]);
  const [citizenSearch, setCitizenSearch] = useState("");
  const debCitizen = useDebounce(citizenSearch, 400);
  const [loadingCitizens, setLoadingCitizens] = useState(false);

  // Wards
  const [wards, setWards] = useState([]);
  const [wardSearch, setWardSearch] = useState("");
  const debWard = useDebounce(wardSearch, 400);
  const [loadingWards, setLoadingWards] = useState(false);

  // Fetch citizens
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingCitizens(true);
      try {
        const res = await callListCitizensAPI({
          page: 1,
          size: 50,
          search: debCitizen || undefined,
        });
        setCitizens(Array.isArray(res?.data) ? res.data : []);
      } finally {
        setLoadingCitizens(false);
      }
    })();
  }, [debCitizen, open]);

  // Fetch wards
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingWards(true);
      try {
        const res = await callListWardAPI({
          page: 1,
          size: 50,
          search: debWard || undefined,
        });
        setWards(Array.isArray(res?.data) ? res.data : []);
      } finally {
        setLoadingWards(false);
      }
    })();
  }, [debWard, open]);

  // citizen_id (Form giữ string, submit convert Number)
  const citizenOptions = useMemo(
    () =>
      citizens.map((c) => ({
        value: String(c.citizen_id),
        label: `${c.citizen_code} — ${c.full_name}${
          c.phone ? " (" + c.phone + ")" : ""
        }`,
      })),
    [citizens]
  );

  // destination_ward_code (giá trị là ward_code string)
  const wardOptions = useMemo(
    () =>
      wards.map((w) => ({
        value: String(w.ward_code),
        label: `${w.ward_name} — ${w.district_name || ""} — ${
          w.province_name || ""
        } [${w.ward_code}]`,
      })),
    [wards]
  );

  const onSubmit = async () => {
    try {
      const v = await form.validateFields();
      setSubmitting(true);

      const payload = {
        citizen_id: Number(v.citizen_id), // convert sang number
        destination_address: v.destination_address,
        destination_ward_code: v.destination_ward_code, // string (ward_code)
        reason: v.reason || null,
        start_date: v.start_date, // "YYYY-MM-DD"
        expected_return_date: v.expected_return_date || null // "YYYY-MM-DD" | null
      };

      const res = await createTemporaryAbsencesAPI(payload);
      if (res && res.success === true) {
        message.success("Tạo tạm vắng thành công");
        form.resetFields();
        onClose && onClose();
        onCreated && onCreated();
      } else {
        notification.error({
          message: "Đã có lỗi xảy ra",
          description:
            JSON.stringify(res?.error.message) || JSON.stringify(res?.details),
        });
      }
    } catch (e) {
      if (!e?.errorFields) {
        message.error(e?.response?.data?.message || "Tạo tạm vắng thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Validate: expected_return_date >= start_date
  const validateReturnDate = (_, value) => {
    const start = form.getFieldValue("start_date"); // string YYYY-MM-DD
    if (!value || !start) return Promise.resolve();
    if (
      dayjs(value, "YYYY-MM-DD").isBefore(dayjs(start, "YYYY-MM-DD"), "day")
    ) {
      return Promise.reject(new Error("Ngày về dự kiến phải >= ngày bắt đầu"));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title="Thêm tạm vắng"
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose && onClose();
      }}
      onOk={onSubmit}
      okText="Tạo"
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          start_date: dayjs().format("YYYY-MM-DD"), // lưu string
        }}
      >
        {/* Chọn công dân */}
        <Form.Item
          label="Công dân"
          name="citizen_id"
          rules={[{ required: true, message: "Chọn công dân" }]}
        >
          <Select
            showSearch
            allowClear
            placeholder="Tìm mã, tên, SĐT…"
            filterOption={false}
            onSearch={setCitizenSearch}
            notFoundContent={
              loadingCitizens ? <Spin size="small" /> : "Không có dữ liệu"
            }
            options={citizenOptions}
          />
        </Form.Item>



        {/* Địa chỉ đến */}
        <Form.Item
          label="Địa chỉ đến"
          name="destination_address"
          rules={[{ required: true, message: "Nhập địa chỉ đến" }]}
        >
          <Input placeholder="Số nhà, tên đường , Phường Phúc Lợi" />
        </Form.Item>

        {/* Ngày bắt đầu / Ngày về dự kiến – lưu string, hiển thị DD/MM/YYYY */}
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label="Ngày bắt đầu"
              name="start_date"
              rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
              getValueFromEvent={(date) =>
                date ? date.format("YYYY-MM-DD") : undefined
              }
              getValueProps={(v) => ({
                value: v ? dayjs(v, "YYYY-MM-DD") : null,
              })}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Dự kiến về"
              name="expected_return_date"
              rules={[{ validator: validateReturnDate }]}
              getValueFromEvent={(date) =>
                date ? date.format("YYYY-MM-DD") : undefined
              }
              getValueProps={(v) => ({
                value: v ? dayjs(v, "YYYY-MM-DD") : null,
              })}
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                disabledDate={(current) => {
                  const start = form.getFieldValue("start_date");
                  return start
                    ? current &&
                        current < dayjs(start, "YYYY-MM-DD").startOf("day")
                    : false;
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Lý do" name="reason">
          <Input.TextArea rows={3} placeholder="Lý do tạm vắng..." />
        </Form.Item>

      </Form>
    </Modal>
  );
};

export default AbsenceCreateModal;
