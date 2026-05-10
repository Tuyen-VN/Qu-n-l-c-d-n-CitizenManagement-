import dayjs from "dayjs";
import {
  Button,
  Card,
  Descriptions,
  List,
  Modal,
  Space,
  Tag,
  Typography,
  message,
  notification,
} from "antd";
import {
  LeftOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import "../../../assets/styles/viewDetailHousehold.scss";
import { useNavigate } from "react-router";
import { useState } from "react";
import HouseholdMemberAddModal from "./HouseholdMemberAddModal";
import { deleteHouseholdMemberAPI } from "../../../services/api.service";

const { Title, Text } = Typography;

const ViewDetailHousehold = (props) => {
  const { dataHousehold, dataHouseholdMembers, handleDelete } = props;
  // ===== Map chính xác theo payload bạn gửi =====
  const household = {
    number: dataHousehold?.household_code ?? "—",
    address: dataHousehold?.address ?? "—",
    headOfHousehold: dataHousehold?.head_full_name ?? "—",
    // ghép vị trí: Phường - Quận/Huyện - Tỉnh/TP
    locationName:
      [
        dataHousehold?.ward_name,
        dataHousehold?.district_name,
        dataHousehold?.province_name,
      ]
        .filter(Boolean)
        .join(" · ") || "—",
    totalMembers:
      dataHousehold?.member_count ?? dataHouseholdMembers?.length ?? 0,
    registrationDate: dataHousehold?.registration_date || null,
    createdAt: dataHousehold?.created_at || null,
  };

  const createdStr = household.createdAt
    ? dayjs(household.createdAt).format("DD/MM/YYYY HH:mm")
    : "—";
  const registrationStr = household.registrationDate
    ? dayjs(household.registrationDate).format("DD/MM/YYYY")
    : "—";

  const roleTagColor = (role) => {
    const r = (role || "").toLowerCase();
    if (r.includes("chủ") || r.includes("head")) return "geekblue";
    if (r.includes("vợ") || r.includes("chồng") || r.includes("spouse"))
      return "purple";
    if (r.includes("con") || r.includes("child")) return "green";
    return "default";
  };

  // Các action chỉ báo message để bạn tự gắn logic sau
  const navigate = useNavigate();
  const onBack = () => {
    navigate(-1);
  };
  const onDelete = () => {
    handleDelete();
  };

  const [isAddOpen, setIsAddOpen] = useState(false);

  const onAddMember = () => setIsAddOpen(true);

  // Optional: after adding, you might want to refresh the detail/members list
  const handleMemberAdded = () => {
    // e.g., call a parent-provided fetch function if available
    // fetchHousehold?.();
    // or fetchMembers?.();
    message.success("Đã cập nhật danh sách thành viên");
  };
  const onDeleteMember = (memberId) => {
    Modal.confirm({
      title: "Xóa thành viên này?",
      content: "Hành động này không thể hoàn tác.",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const res = await deleteHouseholdMemberAPI(
            dataHousehold?.household_id,
            memberId
          );
          console.log(dataHousehold?.household_id, memberId);
          if (res && (res.success === true || res.status === 200)) {
            notification.success({
              message: "Xóa thành viên",
              description: "Thành viên đã được xóa thành công.",
            });
            // refresh list if provided            handleMemberAdded?.();
          } else {
            const errMsg =
              res?.error?.message || res?.message || "Không thể xóa thành viên.";
            notification.error({
              message: "Xóa thất bại",
              description: String(errMsg),
            });
          }
        } catch (error) {
          notification.error({
            message: "Lỗi khi xóa thành viên",
            description:
              error?.response?.data?.message ||
              +error?.message ||
              "Đã xảy ra lỗi không mong muốn.",
          });
        }
      },
    });
  };

  return (
    <>
      <div className="vd-container">
        {/* Header */}
        <Card bodyStyle={{ padding: 24 }} className="vd-header-card">
          <div className="vd-header">
            <div className="vd-header__left">
              <Button type="text" icon={<LeftOutlined />} onClick={onBack}>
                Quay lại
              </Button>
              <div className="vd-header__title">
                <Title level={2} className="vd-h1">
                 Chi tiết hộ khẩu
                </Title>
                <p className="vd-subtitle">
                  Xem và quản lý thông tin chi tiết hộ gia đình
                </p>
              </div>
            </div>

            <div className="vd-header__actions">
              <Button
                danger
                type="primary"
                icon={<DeleteOutlined />}
                onClick={onDelete}
              >
                Xóa hộ khẩu
              </Button>
            </div>
          </div>
        </Card>

        <div className="vd-content">
          {/* Household Info */}
          <Card className="vd-card">
            <div className="vd-card__header">
              <div>
                <h2 className="vd-h2">Thông tin hộ khẩu</h2>
                <p className="vd-subtitle">
                  Các thông tin cơ bản của hộ gia đình
                </p>
              </div>
            </div>

            <Descriptions
              className="vd-info-grid"
              column={{ xs: 1, sm: 1, md: 2 }}
              labelStyle={{ color: "var(--ant-color-text-tertiary)" }}
              contentStyle={{ fontWeight: 600 }}
              items={[
                {
                  key: "number",
                  label: "Mã hộ khẩu",
                  children: household.number,
                },
                {
                  key: "address",
                  label: (
                    <Space size={6}>
                      <EnvironmentOutlined /> Địa chỉ
                    </Space>
                  ),
                  children: household.address,
                },
                {
                  key: "head",
                  label: "Chủ hộ",
                  children: household.headOfHousehold,
                },
                {
                  key: "location",
                  label: "Khu vực",
                  children: <Tag color="blue">{household.locationName}</Tag>,
                },
                {
                  key: "members",
                  label: (
                    <Space size={6}>
                      <TeamOutlined /> Tổng số thành viên
                    </Space>
                  ),
                  children: household.totalMembers,
                },
                {
                  key: "regDate",
                  label: (
                    <Space size={6}>
                      <CalendarOutlined /> Ngày đăng ký
                    </Space>
                  ),
                  children: registrationStr,
                },
                {
                  key: "created",
                  label: (
                    <Space size={6}>
                      <CalendarOutlined /> Ngày tạo hệ thống
                    </Space>
                  ),
                  children: createdStr,
                },
              ]}
            />
          </Card>

          {/* Members */}
          <Card className="vd-card">
            <div className="vd-card__header vd-card__header--with-btn">
              <div>
                <h2 className="vd-h2">Thành viên hộ khẩu</h2>
                <p className="vd-subtitle">Quản lý thành viên của hộ này</p>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onAddMember}
              >
                Thêm thành viên
              </Button>
            </div>

            <div className="vd-members">
              <List
                dataSource={dataHouseholdMembers}
                locale={{ emptyText: "Chưa có thành viên" }}
                renderItem={(m) => {
                  const name = m.full_name ?? m.name ?? "—";
                  const role =
                    m.relationship ??
                    m.relationship_to_head ??
                    m.role ??
                    "Member";
                  const idNumber = m.citizen_code ?? m.idNumber ?? "—";
                  const dobRaw = m.date_of_birth ?? m.dateOfBirth ?? null;
                  const dob = dobRaw ? dayjs(dobRaw).format("DD/MM/YYYY") : "—";
                  const gender = m.gender ?? "—";

                  return (
                    <List.Item
                      className="vd-member"
                      actions={[
                        <Button
                          key="delete"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() =>
                            onDeleteMember(
                              m.member_id ?? m.id ?? m.household_member_id
                            )
                          }
                        />,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space size={12} wrap>
                            <Text strong className="vd-h3">
                              {name}
                            </Text>
                            <Tag color={roleTagColor(role)} className="vd-role">
                              {role}
                            </Tag>
                          </Space>
                        }
                        description={
                          <div className="vd-member__details">
                            <div className="vd-detail">
                              <Text
                                type="secondary"
                                className="vd-detail__label"
                              >
                                Số định danh: <span> </span>
                              </Text>
                              <Text className="vd-detail__value">
                                {idNumber}
                              </Text>
                            </div>
                            <div className="vd-detail">
                              <Text
                                type="secondary"
                                className="vd-detail__label"
                              >
                                Ngày sinh: <span> </span>
                              </Text>
                              <Text className="vd-detail__value">{dob}</Text>
                            </div>
                            <div className="vd-detail">
                              <Text
                                type="secondary"
                                className="vd-detail__label"
                              >
                                Giới tính: <span> </span>
                              </Text>
                              <Text className="vd-detail__value">{gender}</Text>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            </div>
          </Card>
        </div>
      </div>
      <HouseholdMemberAddModal
        open={isAddOpen}
        setOpen={setIsAddOpen}
        householdId={dataHousehold?.household_id}
        handleMemberAdded={handleMemberAdded}
      />
    </>
  );
};

export default ViewDetailHousehold;
