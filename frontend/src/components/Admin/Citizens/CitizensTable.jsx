import { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Tag,
  Popconfirm,
  Space,
  notification,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {  
  callListCitizensAPI,
  deleteCitizenAPI,
} from "../../../services/api.service";
import "../../../assets/styles/citizensTable.scss";
import CitizenModalDetail from "./CitizenModalDetail";
import CitizenModalCreate from "./CitizenModalCreate";
import CitizenModalUpdate from "./CitizenModalUpdate";

const DEBOUNCE_MS = 400;

const STATUS_LABELS = {
  Active:   "Đang sinh sống",
  Absent:   "Tạm vắng",
  Deceased: "Đã mất",
  Inactive: "Không hoạt động",
};

const STATUS_COLORS = {
  Active:   "green",
  Absent:   "orange",
  Deceased: "red",
  Inactive: "default",
};

const CitizensTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(100);
  const [citizensData, setCitizensData] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);

  // const [sortQuery, setSortQuery] = useState("");
  // const [filter, setFilter] = useState("");

  const [citizenDetail, setCitizenDetail] = useState();
  const [isDetailCitizenOpen, setIsDetailCitizenOpen] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [isModalOpenUpdate, setIsModalOpenUpdate] = useState(false);
  const [citizenUpdate, setCitizenUpdate] = useState(null);
  const fetchCitizen = async () => {
    setLoadingTable(true);
    let query = `page=${current}&pageSize=${pageSize}`;
    // if (filter) {
    //   query += `${filter}`;
    // }
    // if (sortQuery) {
    //   query += `&${sortQuery}`;
    // }
    if (searchTerm) {
      query += `&searchTerm=${searchTerm}`;
    }
    const res = await callListCitizensAPI(query);
    if (res && res.data) {
      setCurrent(+res.pagination.page);
      setPageSize(+res.pagination.pageSize);
      setTotal(res.pagination.totalCount);
      setCitizensData(res.data);
    }
    setLoadingTable(false);
  };

  useEffect(() => {
    fetchCitizen();
  }, [current, pageSize, searchTerm]);
  // , sortQuery, filter

  const handleOnChangePagi = (pagination, filters, sorter) => {
    if (
      pagination &&
      pagination.pageSize &&
      +pagination.pageSize !== +pageSize
    ) {
      setPageSize(+pagination.pageSize);
      setCurrent(1);
    }

    if (pagination && pagination.current && +pagination.current !== +current) {
      setCurrent(+pagination.current);
      console.log(pagination.current);
    }
    if (sorter && sorter.order) {
      // const q =
      //   sorter.order === "ascend"
      //     ? `sort=${sorter.field}`
      //     : `sort=-${sorter.field}`;
      // if (q) setSortQuery(q);
    }
  };

  // const handleExport = () => {
  //   if (userData.length > 0) {
  //     const worksheet = XLSX.utils.json_to_sheet(userData);
  //     const workbook = XLSX.utils.book_new();
  //     XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  //     XLSX.writeFile(workbook, "ExportUser.xlsx");
  //   }
  // };

  const handleView = (record) => {
    setCitizenDetail(record);
    setIsDetailCitizenOpen(true);
  };
  const handleEdit = (record) => {
    setCitizenUpdate(record);
    setIsModalOpenUpdate(true);
  };
  const handleDelete = async (id) => {
    const res = await deleteCitizenAPI(id);
    console.log(res);
    if (res && res.success === true) {
      notification.success({
        message: "Xóa công dân",
        description: "thành công!",
      });
      await fetchCitizen();
    } else {
      notification.error({
        message: "lỗi",
        description: JSON.stringify(res.error.message),
      });
    }
  };
  const columns = [
    {
      title: "Tên",
      dataIndex: "full_name",
      key: "full_name",
      // ellipsis: true,
      render: (t) => <span style={{ fontWeight: 500 }}>{t}</span>,
    },
    {
      title: "Mã công dân",
      dataIndex: "citizen_code",
      key: "citizen_code",
      render: (t) => <code style={{ color: "rgba(0,0,0,.65)" }}>{t}</code>,
    },
    {
      title: "Ngày sinh",
      dataIndex: "date_of_birth",
      key: "date_of_birth",
      sorter: false,
      render: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "—"),
    },
    {
      title: "Địa chỉ",
      dataIndex: "permanent_address",
      key: "lpermanent_address",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s) => (
        <Tag color={STATUS_COLORS[s] || "default"} style={{ fontWeight: 600 }}>
          {STATUS_LABELS[s] || s}
        </Tag>
      ),
      filters: [
        { text: "Đang sinh sống", value: "Active" },
        { text: "Tạm vắng",       value: "Absent" },
        { text: "Đã mất",         value: "Deceased" },
        { text: "Không hoạt động", value: "Inactive" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 160,
      render: (_, r) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleView(r)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(r)}
          />
          <Popconfirm
            title="Xóa công dân"
            description="Bạn có chắc chắn muốn xóa công dân này không?"
            okType="danger"
            onConfirm={() => handleDelete(r.citizen_id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="citizens-container">
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Công dân</h1>
            <p className="page-subtitle">
              Quản lý hồ sơ và thông tin công dân
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateOpen(true)}
          >
            Thêm công dân
          </Button>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div className="card-header-text">
              <h2 className="card-title">Hồ sơ công dân</h2>
              <p className="card-subtitle">
                Xem và quản lý tất cả thông tin công dân
              </p>
            </div>
          </div>

          <div
            style={{
              marginBottom: 16,
              display: "flex",
              gap: 20,
              width: "100%",
            }}
          >
            <Input
              allowClear
              placeholder="Tìm kiếm theo tên hoặc mã số..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              prefix={<SearchOutlined />}
              // style={{ flex: 1, minWidth: 0 }}
            />
          </div>

          <Table
            rowKey="citizen_id"
            columns={columns}
            dataSource={citizensData}
            loading={loadingTable}
            onChange={handleOnChangePagi}
            pagination={{
              current,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: [5, 10, 20, 50],

              showTotal: (total, range) =>
                `${range[0]}-${range[1]} trên ${total} dòng`,
            }}
            scroll={{ x: 900 }}
            size="middle"
            sticky
          />
        </div>
      </div>
      <CitizenModalDetail
        citizenDetail={citizenDetail}
        setCitizenDetail={setCitizenDetail}
        isDetailCitizenOpen={isDetailCitizenOpen}
        setIsDetailCitizenOpen={setIsDetailCitizenOpen}
      />
      <CitizenModalCreate
        isCreateOpen={isCreateOpen}
        setIsCreateOpen={setIsCreateOpen}
        fetchCitizen={fetchCitizen}
      />
      <CitizenModalUpdate
        isModalOpenUpdate={isModalOpenUpdate}
        setIsModalOpenUpdate={setIsModalOpenUpdate}
        fetchCitizen={fetchCitizen}
        setCitizenUpdate={setCitizenUpdate}
        citizenUpdate={citizenUpdate}
      />
    </>
  );
};
export default CitizensTable;
