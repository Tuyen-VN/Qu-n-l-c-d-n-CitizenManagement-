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
  updateCitizenAPI,
  //   updateCitizenAPI,
} from "../../../services/api.service";

const CitizenModalUpdate = (props) => {
  const {
    isModalOpenUpdate,
    setIsModalOpenUpdate,
    fetchCitizen,
    setCitizenUpdate,
    citizenUpdate,
  } = props;
  const [isSubmit, setIsSubmit] = useState(false);
  const [form] = Form.useForm();

  const [wards, setWards] = useState([]);

  // load danh sách phường/xã
  useEffect(() => {
    const fetchWards = async () => {
      try {
        const res = await callListWardAPI();
        if (res && res.data) {
          const data = res.data.map((w) => ({
            label: w.ward_name,
            value: w.ward_id,
          }));
          setWards(data);
        }
      } catch (e) {
        console.log(e);
      }
    };
    fetchWards();
  }, []);

  // khi mở modal hoặc citizenUpdate thay đổi -> fill form
  useEffect(() => {
    if (!citizenUpdate) return;

    form.setFieldsValue({
      citizen_code: citizenUpdate.citizen_code ?? "",
      full_name: citizenUpdate.full_name ?? "",
      date_of_birth: citizenUpdate.date_of_birth
        ? dayjs(citizenUpdate.date_of_birth, ["YYYY-MM-DD", "DD/MM/YYYY"])
        : null,
      gender: citizenUpdate.gender ?? undefined,
      permanent_address: citizenUpdate.permanent_address ?? "",
      ward_id: citizenUpdate.ward_id ?? undefined,
      phone: citizenUpdate.phone ?? "",
      email: citizenUpdate.email ?? "",
    });
  }, [citizenUpdate, form, isModalOpenUpdate]);

  const toDateISO = (d) => {
    if (!d) return null;
    const m = dayjs.isDayjs(d) ? d : dayjs(d, ["DD/MM/YYYY", "YYYY-MM-DD"]);
    return m.isValid() ? m.format("YYYY-MM-DD") : null;
  };

  const onFinish = async (values) => {
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

      setIsSubmit(true);
      const res = await updateCitizenAPI(citizenUpdate?.citizen_id, payload);
      if (res && (res.data || res.success)) {
        message.success("Cập nhật công dân thành công!");
        form.resetFields();
        setIsModalOpenUpdate(false);
        setCitizenUpdate(res);
        await fetchCitizen?.();
      } else {
        notification.error({
          message: "Đã có lỗi xảy ra",
          description:
            JSON.stringify(res?.details || res?.message) ||
            "Không thể cập nhật công dân",
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
    <Modal
      title="Cập nhật công dân"
      open={isModalOpenUpdate}
      onOk={() => form.submit()}
      onCancel={() => {
        form.resetFields();
        setIsModalOpenUpdate(false);
      }}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      confirmLoading={isSubmit}
      width={800}
      destroyOnClose
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
              rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
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
              rules={[{ required: true, message: "Vui lòng chọn ngày sinh!" }]}
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
              rules={[{ required: true, message: "Vui lòng chọn giới tính!" }]}
            >
              <Select
                placeholder="Chọn giới tính"
                options={[
                  { label: "Nam", value: "Nam" },
                  { label: "Nữ", value: "Nữ" },
                  { label: "Khác", value: "Khác" },
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
              label="Tổ dân phố"
              name="ward_id"
              rules={[{ required: true, message: "Vui lòng chọn tổ dân phố!" }]}
            >
              <Select
                showSearch
                allowClear
                placeholder="Chọn tổ dân phố"
                options={wards}
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

          {/* Nếu muốn nhập ward_id dạng số trực tiếp:
          <Col xs={24} sm={12}>
            <Form.Item label="Ward ID" name="ward_id">
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col> */}
        </Row>
      </Form>
    </Modal>
  );
};

export default CitizenModalUpdate;
