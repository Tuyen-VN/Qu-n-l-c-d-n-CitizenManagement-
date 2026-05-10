import { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Card, Table, Tabs, Tag, Typography, message } from "antd";
import { ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import "../../../assets/styles/residenceTable.scss";
import {
  callListTemporaryResidencesAPI,
  callListTemporaryAbsencesAPI,
} from "../../../services/api.service";

// === NEW: import 2 modal tạo mới ===
import ResidenceCreateModal from "./ResidenceCreateModal";
import AbsenceCreateModal from "./AbsenceCreateModal";

dayjs.locale("vi");
const { Title, Text } = Typography;

const STATUS_COLORS = {
  Active: "green",
  Pending: "gold",
  Completed: "default",
};

const fmt = (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "—");

const ResidenceTable = () => {
  const [activeTab, setActiveTab] = useState("residence"); // "residence" | "absence"

  // phân trang & sort dùng chung cho 2 tab (đơn giản)
  const [loadingTable, setLoadingTable] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState(null); // e.g. "start_date"
  const [sortDir, setSortDir] = useState(null); // "asc" | "desc" | null

  // data per tab
  const [residenceRows, setResidenceRows] = useState([]);
  const [absenceRows, setAbsenceRows] = useState([]);

  // === NEW: state mở/đóng modal ===
  const [openCreateResidence, setOpenCreateResidence] = useState(false);
  const [openCreateAbsence, setOpenCreateAbsence] = useState(false);

  // ===== API fetchers with query =====
  const fetchResidence = useCallback(async () => {
    setLoadingTable(true);
    try {
      const res = await callListTemporaryResidencesAPI({
        page: current,
        size: pageSize,
        sortBy,
        sortDir,
      });
      const list = Array.isArray(res?.data) ? res.data : [];
      const rows = list.map((x) => ({
        key: x.temp_residence_id,
        id: x.temp_residence_id,
        citizen_code: x.citizen_code,
        full_name: x.full_name,
        phone: x.phone ?? "—",
        address: x.temporary_address,
        ward: x.ward_name,
        district: x.district_name,
        province: x.province_name,
        reason: x.reason,
        start_date: x.start_date,
        end_date: x.end_date,
        days_remaining: x.days_remaining,
        status: x.status,
        registration_date: x.registration_date,
        created_at: x.created_at,
      }));
      setResidenceRows(rows);
      setTotal(+res?.total || +res?.meta?.total || list.length);
    } catch (e) {
      console.error(e);
      message.error("Không tải được danh sách tạm trú.");
    } finally {
      setLoadingTable(false);
    }
  }, [current, pageSize, sortBy, sortDir]);

  const fetchAbsence = useCallback(async () => {
    setLoadingTable(true);
    try {
      const res = await callListTemporaryAbsencesAPI({
        page: current,
        size: pageSize,
        sortBy,
        sortDir,
      });
      const list = Array.isArray(res?.data) ? res.data : [];
      const rows = list.map((x) => ({
        key: x.temp_absence_id,
        id: x.temp_absence_id,
        citizen_code: x.citizen_code,
        full_name: x.full_name,
        phone: x.phone ?? "—",
        destination: x.destination_address,
        home_ward: x.home_ward,
        home_district: x.home_district,
        reason: x.reason,
        start_date: x.start_date,
        expected_return_date: x.expected_return_date,
        actual_return_date: x.actual_return_date,
        days_until_return: x.days_until_return,
        status: x.status,
        registration_date: x.registration_date,
        created_at: x.created_at,
      }));
      setAbsenceRows(rows);
      setTotal(+res?.total || +res?.meta?.total || list.length);
    } catch (e) {
      console.error(e);
      message.error("Không tải được danh sách tạm vắng.");
    } finally {
      setLoadingTable(false);
    }
  }, [current, pageSize, sortBy, sortDir]);

  // ===== initial & when tab/params change =====
  useEffect(() => {
    if (activeTab === "residence") fetchResidence();
    else fetchAbsence();
  }, [activeTab, fetchResidence, fetchAbsence]);

  // ===== Table events: pagination + sorter =====
  const handleOnChangePagi = (pagination, _filters, sorter) => {
    if (pagination?.pageSize && +pagination.pageSize !== +pageSize) {
      setPageSize(+pagination.pageSize);
      setCurrent(1);
    }
    if (pagination?.current && +pagination.current !== +current) {
      setCurrent(+pagination.current);
    }

    if (sorter && sorter.field) {
      if (sorter.order === "ascend") {
        setSortBy(sorter.field);
        setSortDir("asc");
      } else if (sorter.order === "descend") {
        setSortBy(sorter.field);
        setSortDir("desc");
      } else {
        setSortBy(null);
        setSortDir(null);
      }
    }
  };
  // console.log(residenceRows);

  // ===== Columns =====
  const residenceCols = useMemo(
    () => [
      {
        title: "Mã công dân",
        dataIndex: "citizen_code",
        key: "citizen_code",
        width: 130,
      },
      {
        title: "Họ tên",
        dataIndex: "full_name",
        key: "full_name",
        width: 180, ellipsis: true
      },
      { title: "SĐT", dataIndex: "phone", key: "phone", width: 110 },
      { title: "Đ/c tạm trú", dataIndex: "address", key: "address", width: 250, ellipsis: true },
      {
        title: "Phường/Quận/Tỉnh",
        key: "pqd",
        width: 220,
        render: (_, r) =>
          `${r.ward || "—"} / ${r.district || "—"} / ${r.province || "—"}`,
        responsive: ["lg"],
      },
      {
        title: "Lý do",
        dataIndex: "reason",
        key: "reason",
        width: 150, ellipsis: true,
        responsive: ["lg"],
      },
      {
        title: "Bắt đầu",
        dataIndex: "start_date",
        key: "start_date",
        render: fmt,
        width: 110,
      },
      {
        title: "Kết thúc",
        dataIndex: "end_date",
        key: "end_date",
        render: fmt,
        width: 110,
      },
      {
        title: "Còn lại (ngày)",
        dataIndex: "days_remaining",
        key: "days_remaining",
        align: "center",
        width: 100,
        render: (v) => (
          <Tag color={v > 0 ? "processing" : "default"}>{v ?? "—"}</Tag>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 110,
        render: (s) => <Tag color={STATUS_COLORS[s] || "default"}>{s}</Tag>,
      },
      {
        title: "ĐK ngày",
        dataIndex: "registration_date",
        key: "registration_date",
        render: fmt,
        width: 130,
        responsive: ["xl"],
      },
    ],
    []
  );

  const absenceCols = useMemo(
    () => [
      {
        title: "Mã công dân",
        dataIndex: "citizen_code",
        key: "citizen_code",
        width: 130,
        fixed: 'left',
      },
      {
        title: "Họ tên",
        dataIndex: "full_name",
        key: "full_name",
        width: 180, ellipsis: true
      },
      { title: "SĐT", dataIndex: "phone", key: "phone", width: 110 },
      { title: "Địa chỉ đến", dataIndex: "destination", key: "destination", width: 250, ellipsis: true },
      {
        title: "Phường/Huyện (nhà)",
        key: "home_addr",
        width: 200,
        render: (_, r) => `${r.home_ward || "—"} / ${r.home_district || "—"}`,
        responsive: ["lg"],
      },
      {
        title: "Lý do",
        dataIndex: "reason",
        key: "reason",
        width: 150, ellipsis: true,
        responsive: ["lg"],
      },
      {
        title: "Bắt đầu",
        dataIndex: "start_date",
        key: "start_date",
        render: fmt,
        width: 110,
      },
      {
        title: "Dự kiến về",
        dataIndex: "expected_return_date",
        key: "expected_return_date",
        render: fmt,
        width: 120,
      },
      {
        title: "Thực tế về",
        dataIndex: "actual_return_date",
        key: "actual_return_date",
        render: fmt,
        width: 130,
        responsive: ["lg"],
      },
      {
        title: "Còn lại (ngày)",
        dataIndex: "days_until_return",
        key: "days_until_return",
        align: "center",
        width: 130,
        render: (v) => (
          <Tag color={v > 0 ? "processing" : "default"}>{v ?? "—"}</Tag>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (s) => (
          <Tag color={STATUS_COLORS[s] || "default"} style={{ fontWeight: 600, borderRadius: '12px' }}>
            {s === 'Active' ? 'Đang vắng' : s === 'Pending' ? 'Chờ duyệt' : 'Đã về'} 
            {/* Bạn có thể Việt hóa trực tiếp nhãn ở đây nếu muốn */}
          </Tag>
        ),
      },
    ],
    []
  );

  // ===== render =====
  return (
    <div className="residence-tracker">
      <div className="residence-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Tạm trú & Tạm vắng
          </Title>
          <Text className="residence-subtitle">
            Quản lý hồ sơ tạm trú và tạm vắng công dân
          </Text>
        </div>
        {/* BỎ nút create khỏi header chung để mỗi tab có nút riêng */}
      </div>

      <Card className="residence-records">
        <div className="residence-section-header">
          <div className="residence-section-title">Hồ sơ danh sách</div>
          <div className="residence-section-subtitle">
            Thông tin chi tiết các bản ghi tạm trú và tạm vắng
          </div>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setCurrent(1); // reset trang khi đổi tab
          }}
          destroyInactiveTabPane
          items={[
            {
              key: "residence",
              label: "Tạm trú",
              children: (
                <>
                  {/* Actions riêng tab Tạm trú */}
                  <div
                    className="tab-actions"
                    style={{ marginBottom: 12, display: "flex", gap: 8 }}
                  >
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setOpenCreateResidence(true)}
                    >
                      Thêm tạm trú
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchResidence}>
                      Làm mới
                    </Button>
                  </div>

                  <Table
                    rowKey="key"
                    loading={loadingTable}
                    onChange={handleOnChangePagi}
                    columns={residenceCols}
                    dataSource={residenceRows}
                    pagination={{
                      current,
                      pageSize,
                      total,
                      showSizeChanger: true,
                      pageSizeOptions: [5, 10, 20, 50],
                      showTotal: (t, range) =>
                        `${range[0]}-${range[1]} trên ${t} dòng`,
                    }}
                    scroll={{ x: 900 }}
                    size="small"
                    sticky
                    locale={{
                      emptyText: (
                        <span className="residence-no-records">
                          Không có dữ liệu
                        </span>
                      ),
                    }}
                  />
                </>
              ),
            },
            {
              key: "absence",
              label: "Tạm vắng",
              children: (
                <>
                  {/* Actions riêng tab Tạm vắng */}
                  <div
                    className="tab-actions"
                    style={{ marginBottom: 12, display: "flex", gap: 8 }}
                  >
                    <Button
                      type="primary"
                      ghost
                      icon={<PlusOutlined />}
                      onClick={() => setOpenCreateAbsence(true)}
                    >
                      Thêm tạm vắng
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchAbsence}>
                      Làm mới
                    </Button>
                  </div>

                  <Table
                    rowKey="key"
                    loading={loadingTable}
                    onChange={handleOnChangePagi}
                    columns={absenceCols}
                    dataSource={absenceRows}
                    pagination={{
                      current,
                      pageSize,
                      total,
                      showSizeChanger: true,
                      pageSizeOptions: [5, 10, 20, 50],
                      showTotal: (t, range) =>
                        `${range[0]}-${range[1]} trên ${t} dòng`,
                    }}
                    scroll={{ x: 900 }}
                    size="small"
                    sticky
                    locale={{
                      emptyText: (
                        <span className="residence-no-records">
                          Không có dữ liệu
                        </span>
                      ),
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* === 2 Modal create === */}
      <ResidenceCreateModal
        open={openCreateResidence}
        onClose={() => setOpenCreateResidence(false)}
        onCreated={() => {
          if (activeTab === "residence") fetchResidence();
        }}
      />

      <AbsenceCreateModal
        open={openCreateAbsence}
        onClose={() => setOpenCreateAbsence(false)}
        onCreated={() => {
          if (activeTab === "absence") fetchAbsence();
        }}
      />
    </div>
  );
};

export default ResidenceTable;
