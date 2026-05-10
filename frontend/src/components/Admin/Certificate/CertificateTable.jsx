import { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Card, Table, Tabs, Tag, Typography, message } from "antd";
import { ReloadOutlined, PlusOutlined, FileProtectOutlined, UserDeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "../../../assets/styles/certificateTable.scss";
import { callListBirthCertificatesAPI, callListDeathCertificatesAPI } from "../../../services/api.service";

import BirthCertModal from "./BirthCertModal";
import DeathCertModal from "./DeathCertModal";

const { Title, Text } = Typography;
const fmt = (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "—");

const CertificateTable = () => {
  const [activeTab, setActiveTab] = useState("birth");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ birth: [], death: [] });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [openBirth, setOpenBirth] = useState(false);
  const [openDeath, setOpenDeath] = useState(false);

  const fetchBirths = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callListBirthCertificatesAPI({
        page: pagination.current,
        pageSize: pagination.pageSize
      });
      if (res?.success) {
        setData(prev => ({ ...prev, birth: res.data }));
        setPagination(prev => ({ ...prev, total: res.pagination.totalCount }));
      }
    } finally { setLoading(false); }
  }, [pagination.current, pagination.pageSize]);

  const fetchDeaths = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callListDeathCertificatesAPI({
        page: pagination.current,
        pageSize: pagination.pageSize
      });
      if (res?.success) {
        setData(prev => ({ ...prev, death: res.data }));
        setPagination(prev => ({ ...prev, total: res.pagination.totalCount }));
      }
    } finally { setLoading(false); }
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    activeTab === "birth" ? fetchBirths() : fetchDeaths();
  }, [activeTab, fetchBirths, fetchDeaths]);

  const birthCols = useMemo(() => [
    { title: "Số định danh", dataIndex: "certificate_number", key: "certificate_number", width: 150, fixed: 'left', className: 'id-column' },
    { title: "Trẻ em", dataIndex: "child_name", key: "child_name", width: 180, ellipsis: true },
    { title: "Giới tính", dataIndex: "child_gender", key: "child_gender", width: 100, render: (g) => g === 'Male' ? 'Nam' : 'Nữ' },
    { title: "Ngày sinh", dataIndex: "child_dob", key: "child_dob", width: 120, render: fmt },
    { title: "Cha", dataIndex: "father_name", key: "father_name", width: 180, ellipsis: true },
    { title: "Mẹ", dataIndex: "mother_name", key: "mother_name", width: 180, ellipsis: true },
    { title: "Nơi sinh", dataIndex: "birth_place", key: "birth_place", width: 200, ellipsis: true },
    { title: "Ngày đăng ký", dataIndex: "registration_date", key: "registration_date", width: 130, render: fmt },
  ], []);

  const deathCols = useMemo(() => [
    { title: "Số định danh", dataIndex: "certificate_number", key: "certificate_number", width: 150, fixed: 'left', className: 'id-column' },
    { title: "Người mất", dataIndex: "full_name", key: "full_name", width: 180, ellipsis: true },
    { title: "Ngày mất", dataIndex: "date_of_death", key: "date_of_death", width: 120, render: fmt },
    { title: "Tuổi mất", dataIndex: "age_at_death", key: "age_at_death", width: 100, align: 'center' },
    { title: "Nguyên nhân", dataIndex: "cause_of_death", key: "cause_of_death", width: 200, ellipsis: true },
    { title: "Nơi mất", dataIndex: "place_of_death", key: "place_of_death", width: 200, ellipsis: true },
    { title: "Người khai báo", dataIndex: "registrar_name", key: "registrar_name", width: 150 },
    { title: "Ngày đăng ký", dataIndex: "registration_date", key: "registration_date", width: 130, render: fmt },
  ], []);

  return (
    <div className="certificate-tracker">
      <div className="certificate-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>Giấy tờ & Chứng nhận</Title>
          <Text className="certificate-subtitle">Quản lý các sự kiện khai sinh và khai tử của công dân</Text>
        </div>
      </div>

      <Card className="certificate-records">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => { setActiveTab(key); setPagination({ ...pagination, current: 1 }); }}
          items={[
            {
              key: "birth",
              label: <span><FileProtectOutlined /> Khai sinh</span>,
              children: (
                <>
                  <div className="tab-actions" style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenBirth(true)}>Đăng ký khai sinh</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchBirths}>Làm mới</Button>
                  </div>
                  <Table
                    rowKey="birth_cert_id"
                    columns={birthCols}
                    dataSource={data.birth}
                    loading={loading}
                    size="small"
                    scroll={{ x: 1300 }}
                    pagination={pagination}
                  />
                </>
              )
            },
            {
              key: "death",
              label: <span><UserDeleteOutlined /> Khai tử</span>,
              children: (
                <>
                  <div className="tab-actions" style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                    <Button type="primary" danger icon={<PlusOutlined />} onClick={() => setOpenDeath(true)}>Đăng ký khai tử</Button>
                    <Button icon={<ReloadOutlined />} onClick={fetchDeaths}>Làm mới</Button>
                  </div>
                  <Table
                    rowKey="death_cert_id"
                    columns={deathCols}
                    dataSource={data.death}
                    loading={loading}
                    size="small"
                    scroll={{ x: 1300 }}
                    pagination={pagination}
                  />
                </>
              )
            }
          ]}
        />
      </Card>

      <BirthCertModal open={openBirth} onClose={() => setOpenBirth(false)} onCreated={fetchBirths} />
      <DeathCertModal open={openDeath} onClose={() => setOpenDeath(false)} onCreated={fetchDeaths} />
    </div>
  );
};

export default CertificateTable;