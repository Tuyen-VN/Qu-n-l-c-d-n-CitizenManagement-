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
  createTemporaryResidencesAPI,
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

const ResidenceCreateModal = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // citizens
  const [citizens, setCitizens] = useState([]);
  const [citizenSearch, setCitizenSearch] = useState("");
  const debCitizen = useDebounce(citizenSearch, 400);
  const [loadingCitizens, setLoadingCitizens] = useState(false);

  // wards (use ward_id)
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
      } catch (e) {
        // tránh làm ồn
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
      } catch (e) {
        // tránh làm ồn
      } finally {
        setLoadingWards(false);
      }
    })();
  }, [debWard, open]);

  // citizen_id yêu cầu STRING
  const citizenOptions = useMemo(
    () =>
      citizens.map((c) => ({
        value: String(c.citizen_id), // <-- string
        label: `${c.citizen_code} — ${c.full_name}${
          c.phone ? " (" + c.phone + ")" : ""
        }`,
      })),
    [citizens]
  );

  // ward_id là NUMBER
  const wardOptions = useMemo(
    () =>
      wards.map((w) => ({
        value: Number(w.ward_id), // number
        label: `${w.ward_name} — ${w.district_name || ""} — ${
          w.province_name || ""
        } [${w.ward_code}]`,
      })),
    [wards]
  );

  const handleCancel = () => {
    form.resetFields();
    onClose && onClose();
  };

  const onSubmit = async () => {
    try {
      const v = await form.validateFields();

      const payload = {
        citizen_id: v.citizen_id,
        temporary_address: v.temporary_address,
        ward_id: Number(v.ward_id),
        reason: v.reason || null,
        start_date: v.start_date,
        end_date: v.end_date || null
      };
      setSubmitting(true);
      console.log(payload);
      const res = await createTemporaryResidencesAPI(payload);

      if (res && res.success === true) {
        message.success("Tạo tạm trú thành công");
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
        message.error(e?.response?.data?.message || "Tạo tạm trú thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Validate end_date >= start_date
  const validateEndDate = (_, value) => {
    const start = form.getFieldValue("start_date");
    if (!value || !start) return Promise.resolve();
    // value & start là STRING YYYY-MM-DD
    if (
      dayjs(value, "YYYY-MM-DD").isBefore(dayjs(start, "YYYY-MM-DD"), "day")
    ) {
      return Promise.reject(new Error("Ngày kết thúc phải >= ngày bắt đầu"));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title="Thêm tạm trú"
      open={open}
      onCancel={handleCancel}
      onOk={onSubmit}
      okText="Tạo"
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ start_date: dayjs().format("YYYY-MM-DD") }} // lưu string
      >
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

        <Form.Item
          label="Địa chỉ tạm trú"
          name="temporary_address"
          rules={[{ required: true, message: "Nhập địa chỉ tạm trú" }]}
        >
          <Input placeholder="Số nhà, tên đường , Phường Phúc Lợi" />
        </Form.Item>

        <Form.Item
          label="Tổ dân phố"
          name="ward_id"
          rules={[{ required: true, message: "Chọn tổ dân phố" }]}
        >
          <Select
            showSearch
            allowClear
            placeholder="Tìm theo tên/code…"
            filterOption={false}
            onSearch={setWardSearch}
            notFoundContent={
              loadingWards ? <Spin size="small" /> : "Không có dữ liệu"
            }
            options={wardOptions}
          />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label="Ngày bắt đầu"
              name="start_date"
              rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
              // Form nhận string từ onChange
              getValueFromEvent={(_, dateString) => dateString || undefined}
              // Form render string -> dayjs để hiển thị DatePicker
              getValueProps={(v) => ({
                value: v ? dayjs(v, "YYYY-MM-DD") : null,
              })}
            >
              <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Ngày kết thúc (nếu có)"
              name="end_date"
              rules={[{ validator: validateEndDate }]}
              getValueFromEvent={(_, dateString) => dateString || undefined}
              getValueProps={(v) => ({
                value: v ? dayjs(v, "YYYY-MM-DD") : null,
              })}
            >
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                // Chặn chọn trước start_date
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
          <Input.TextArea rows={3} />
        </Form.Item>
        
      </Form>
    </Modal>
  );
};

export default ResidenceCreateModal;
