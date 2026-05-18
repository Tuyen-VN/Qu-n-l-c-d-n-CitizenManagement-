import { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Tag,
  Popconfirm,
  Space,
  notification,
  Select,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  callListHouseholdAPI,
  deleteHouseholdAPI,
  updateHouseholdAPI,
} from "../../../services/api.service";
import "../../../assets/styles/householdTable.scss";
import { useNavigate } from "react-router";
import HouseholdModalCreate from "./HouseholdModalCreate";

const HouseholdTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(100);
  const [householdData, setHouseholdData] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // inline edit state
  const [editingKey, setEditingKey] = useState(null); // household_id đang edit
  const [draft, setDraft] = useState({}); // bản nháp cho hàng đang edit

  const fetchHousehold = async () => {
    setLoadingTable(true);
    let query = `page=${current}&pageSize=${pageSize}`;
    if (searchTerm) query += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    const res = await callListHouseholdAPI(query);
    if (res && res.data) {
      setCurrent(+res.pagination.page);
      setPageSize(+res.pagination.pageSize);
      setTotal(res.pagination.totalCount);
      setHouseholdData(res.data);
    }
    setLoadingTable(false);
  };

  useEffect(() => {
    fetchHousehold();
  }, [current, pageSize, searchTerm]);

  const handleOnChangePagi = (pagination) => {
    if (pagination?.pageSize && +pagination.pageSize !== +pageSize) {
      setPageSize(+pagination.pageSize);
      setCurrent(1);
    }
    if (pagination?.current && +pagination.current !== +current) {
      setCurrent(+pagination.current);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteHouseholdAPI(id);
      if (res && (res.success === true || res.status === 200)) {
        notification.success({
          message: "Xóa hộ khẩu",
          description: "Thành công!",
        });
        await fetchHousehold();
      } else {
        notification.error({
          message: "Lỗi",
          description:
            res?.error?.message ||
            res?.message ||
            "Không thể xóa hộ khẩu.",
        });
      }
    } catch (err) {
      notification.error({
        message: "Lỗi",
        description:
          err?.response?.data?.message || err?.message || "Đã xảy ra lỗi không mong muốn.",
      });
    }
  };

  // -------- slug helpers (giữ nguyên) ----------
  const removeVietnameseTones = (str) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
    str = str.replace(/\u02C6|\u0306|\u031B/g, "");
    str = str.replace(/ + /g, " ");
    str = str.trim();
    str = str.replace(
      /!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g,
      " "
    );
    return str;
  };
  const convertSlug = (str) => {
    str = removeVietnameseTones(str);
    str = str.replace(/^\s+|\s+$/g, "");
    str = str.toLowerCase();
    var from =
      "ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆĞÍÌÎÏİŇÑÓÖÒÔÕØŘŔŠŞŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇğíìîïıňñóöòôõøðřŕšşťúůüùûýÿžþÞĐđßÆa·/_,:;";
    var to =
      "AAAAAACCCDEEEEEEEEGIIIIINNOOOOOORRSSTUUUUUYYZaaaaaacccdeeeeeeeegiiiiinnooooooorrsstuuuuuyyzbBDdBAa------";
    for (var i = 0, l = from.length; i < l; i++) {
      str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
    }
    str = str
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    return str;
  };
  const navigate = useNavigate();
  const handleRedirectHousehold = (householdDetail) => {
    const str =
      householdDetail.head_full_name +
      householdDetail.household_id +
      householdDetail.household_code;
    const slug = convertSlug(str);
    navigate(`/admin/household/${slug}?id=${householdDetail.household_id}`);
  };

  // ---------- Inline edit handlers ----------
  const startEdit = (record) => {
    setEditingKey(record.household_id);
    setDraft({
      address: record.address || "",
      household_type: record.household_type || "Thường trú",
      notes: record.notes || "",
    });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraft({});
  };

  const saveEdit = async (record) => {
    const id = record.household_id;
    try {
      const res = await updateHouseholdAPI(id, {
        address: (draft.address || "").trim(),
        household_type: draft.household_type,
        notes: draft.notes?.trim() || null,
      });
      console.log(res);
      if (res && res.success === true) {
        notification.success({
          message: "Cập nhật",
          description: "Cập nhật hộ khẩu thành công!",
        });
        setEditingKey(null);
        setDraft({});
        await fetchHousehold();
      } else {
        notification.error({
          message: "Đã có lỗi xảy ra",
          description: JSON.stringify(res?.details),
        });
      }
    } catch (err) {
      notification.error({
        message: "Cập nhật thất bại",
        description:
          err?.response?.data?.message || err?.message || "Đã xảy ra lỗi không mong muốn.",
      });
    }
  };

  const columns = [
    {
      title: "Mã hộ khẩu",
      dataIndex: "household_code",
      key: "household_code",
      render: (t) => <span style={{ fontWeight: 500 }}>{t}</span>,
    },
    {
      title: "Chủ hộ",
      dataIndex: "head_full_name",
      key: "head_full_name",
      ellipsis: true,
    },
    {
      title: "Tổ dân phố",
      dataIndex: "ward_name",
      key: "ward_name",
      width: 150,
      render: (wardName) => (
        <Tag color="blue">{wardName || "—"}</Tag>
      ),
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      width: 250,
      ellipsis: true,
      render: (text, record) => {
        // Lọc bỏ mã để chỉ hiện địa chỉ nhà
        const cleanAddress = text?.replace(/^[A-Z0-9-]+(?:\s*-\s*)/, "") || "—";
        
        if (editingKey === record.household_id) {
          return (
            <Input
              value={draft.address}
              onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
            />
          );
        }
        return cleanAddress;
      },
    },
    {
      title: "Loại hộ khẩu",
      dataIndex: "household_type",
      key: "household_type",
      width: 160,
      render: (type, record) => {
        if (editingKey === record.household_id) {
          return (
            <Select
              style={{ width: 140 }}
              value={draft.household_type}
              onChange={(v) => setDraft((d) => ({ ...d, household_type: v }))}
              options={[
                { label: "Thường trú", value: "Thường trú" },
                { label: "Tạm trú", value: "Tạm trú" },
              ]}
              placeholder="Select type"
            />
          );
        }
        let color = "default";
        if (type === "Thường trú" || type === "Thuong tru") color = "green";
        else if (type === "Tạm trú" || type === "Tam tru") color = "gold";
        return (
          <Tag color={color} style={{ fontWeight: 500 }}>
            {type || "—"}
          </Tag>
        );
      },
    },
    
    {
      title: "Thành viên",
      dataIndex: "member_count",
      key: "member_count",
      width: 120,
      render: (s) => (
        <Tag color="blue" style={{ fontWeight: 600 }}>
          {s} thành viên
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, r) => {
        const editing = editingKey === r.household_id;
        return editing ? (
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => saveEdit(r)}
            >
              Save
            </Button>
            <Button icon={<CloseOutlined />} onClick={cancelEdit}>
              Cancel
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleRedirectHousehold(r)}
            />
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => startEdit(r)}
            />
            <Popconfirm
              title="Xóa hộ khẩu"
              description="Bạn có chắc chắn muốn xóa hộ khẩu này không?"
              okType="danger"
              okText="Xóa" // Thêm okText tiếng Việt
              cancelText="Hủy" // Thêm cancelText tiếng Việt
              onConfirm={() => handleDelete(r.household_id)}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <div className="household-container">
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">Hộ khẩu</h1>
            <p className="page-subtitle">
              Quản lý thông tin hộ khẩu và thành viên
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateOpen(true)}
          >
            Thêm hộ khẩu mới
          </Button>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div className="card-header-text">
              <h2 className="card-title">Danh sách hộ khẩu</h2>
              <p className="card-subtitle">
                Xem và quản lý tất cả thông tin hộ khẩu
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
              placeholder="Tìm kiếm theo mã hộ khẩu, số định danh hoặc địa chỉ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </div>

          <Table
            rowKey="household_id"
            columns={columns}
            dataSource={householdData}
            loading={loadingTable}
            onChange={handleOnChangePagi}
            pagination={{
              current,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: [5, 10, 20, 50],
              showTotal: (t, range) => `${range[0]}-${range[1]} trên ${t} dòng`,
            }}
            // ĐIỀU CHỈNH TẠI ĐÂY:
            // x: 'max-content' sẽ tự động tính toán độ rộng dựa trên nội dung cột
            // Hoặc đặt một con số cụ thể như 1200, 1500 tùy số lượng cột bạn thêm vào
            scroll={{ x: 'max-content' }}
            size="small"
            sticky
          />
        </div>
      </div>

      <HouseholdModalCreate
        isCreateOpen={isCreateOpen}
        setIsCreateOpen={setIsCreateOpen}
        fetchHousehold={fetchHousehold}
      />
    </>
  );
};
export default HouseholdTable;
