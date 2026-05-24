import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Spin, Tag } from "antd";
import {
  Users,
  Home,
  FileText,
  MapPin,
  UserPlus,
  HomeIcon,
  FilePlus,
  Car,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import CountUp from "react-countup";
import {
  callListCitizensAPI,
  callListHouseholdAPI,
  callListBirthCertificatesAPI,
  callListDeathCertificatesAPI,
  callListTemporaryResidencesAPI,
  callListTemporaryAbsencesAPI,
} from "../../services/api.service";
import "../../assets/styles/dashboard.scss";

// ─── Helper: Format thời gian tương đối ────────────────────────────────────
const timeAgo = (dateStr) => {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  return `${d} ngày trước`;
};

const AdminPage = () => {
  const navigate = useNavigate();

  // ── Stats state ──────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    citizens: 0,
    households: 0,
    certificates: 0,
    tempResidences: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // ── Recent activity state ────────────────────────────────────────────────
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // ── Fetch stats API ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const [citizenRes, householdRes, birthRes, deathRes, tempRes, absRes] =
          await Promise.allSettled([
            callListCitizensAPI("page=1&pageSize=1"),
            callListHouseholdAPI("page=1&pageSize=1"),
            callListBirthCertificatesAPI("page=1&pageSize=1"),
            callListDeathCertificatesAPI("page=1&pageSize=1"),
            callListTemporaryResidencesAPI("page=1&pageSize=1"),
            callListTemporaryAbsencesAPI("page=1&pageSize=1"),
          ]);

        const getTotal = (res) =>
          res.status === "fulfilled"
            ? res.value?.pagination?.totalCount ??
              res.value?.data?.totalCount ??
              res.value?.total ??
              0
            : 0;

        const birthTotal = getTotal(birthRes);
        const deathTotal = getTotal(deathRes);
        const tempTotal = getTotal(tempRes);
        const absTotal = getTotal(absRes);

        setStats({
          citizens: getTotal(citizenRes),
          households: getTotal(householdRes),
          certificates: birthTotal + deathTotal,
          tempResidences: tempTotal + absTotal,
        });
      } catch (e) {
        console.error("Fetch stats error:", e);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  // ── Fetch recent activity API ────────────────────────────────────────────
  useEffect(() => {
    const fetchRecent = async () => {
      setLoadingActivity(true);
      try {
        const [citizenRes, householdRes, birthRes, deathRes, tempRes, absRes] =
          await Promise.allSettled([
            callListCitizensAPI("page=1&pageSize=5&sortBy=created_at&sortOrder=desc"),
            callListHouseholdAPI("page=1&pageSize=5&sortBy=created_at&sortOrder=desc"),
            callListBirthCertificatesAPI("page=1&pageSize=5"),
            callListDeathCertificatesAPI("page=1&pageSize=5"),
            callListTemporaryResidencesAPI("page=1&pageSize=5"),
            callListTemporaryAbsencesAPI("page=1&pageSize=5"),
          ]);

        const getData = (res) =>
          res.status === "fulfilled" ? res.value?.data ?? [] : [];

        const citizens = getData(citizenRes).map((c) => ({
          type: "citizen",
          icon: <Users size={16} />,
          color: "#1890ff",
          bgColor: "#e6f4ff",
          title: `Thêm công dân: ${c.full_name ?? c.fullName ?? "—"}`,
          detail: `CCCD: ${c.citizen_code ?? c.citizenCode ?? "—"}`,
          time: c.created_at ?? c.createdAt,
          tag: "Công dân",
          tagColor: "blue",
        }));

        const households = getData(householdRes).map((h) => ({
          type: "household",
          icon: <Home size={16} />,
          color: "#13c2c2",
          bgColor: "#e6fffb",
          title: `Tạo hộ khẩu: ${h.household_code ?? h.householdCode ?? "—"}`,
          detail: `Chủ hộ: ${h.head_full_name ?? "—"}`,
          time: h.created_at ?? h.createdAt,
          tag: "Hộ khẩu",
          tagColor: "cyan",
        }));

        const births = getData(birthRes).map((b) => ({
          type: "birth",
          icon: <FileText size={16} />,
          color: "#722ed1",
          bgColor: "#f9f0ff",
          title: `Khai sinh: ${b.certificate_number ?? b.certificateNumber ?? "—"}`,
          detail: b.child_full_name ?? b.childName ?? "—",
          time: b.created_at ?? b.registration_date,
          tag: "Khai sinh",
          tagColor: "purple",
        }));

        const deaths = getData(deathRes).map((d) => ({
          type: "death",
          icon: <FileText size={16} />,
          color: "#595959",
          bgColor: "#f5f5f5",
          title: `Khai tử: ${d.certificate_number ?? d.certificateNumber ?? "—"}`,
          detail: d.citizen_name ?? d.citizenName ?? "—",
          time: d.created_at ?? d.date_of_death,
          tag: "Khai tử",
          tagColor: "default",
        }));

        const temps = getData(tempRes).map((t) => ({
          type: "temp",
          icon: <MapPin size={16} />,
          color: "#fa8c16",
          bgColor: "#fff7e6",
          title: `Tạm trú: ${t.citizen_name ?? t.citizenName ?? t.citizen_code ?? "—"}`,
          detail: t.temporary_address ?? t.temporaryAddress ?? "—",
          time: t.created_at ?? t.registration_date,
          tag: "Tạm trú",
          tagColor: "orange",
        }));

        const absences = getData(absRes).map((a) => ({
          type: "absence",
          icon: <Car size={16} />,
          color: "#f5222d",
          bgColor: "#fff1f0",
          title: `Tạm vắng: ${a.citizen_name ?? a.citizenName ?? "—"}`,
          detail: a.destination_address ?? a.destinationAddress ?? "—",
          time: a.created_at ?? a.start_date,
          tag: "Tạm vắng",
          tagColor: "red",
        }));

        // Gộp và sắp xếp theo thời gian mới nhất
        const all = [
          ...citizens,
          ...households,
          ...births,
          ...deaths,
          ...temps,
          ...absences,
        ]
          .filter((item) => item.time)
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 8);

        setRecentActivities(all);
      } catch (e) {
        console.error("Fetch recent activity error:", e);
      } finally {
        setLoadingActivity(false);
      }
    };
    fetchRecent();
  }, []);

  // ── Dữ liệu hiển thị Thống Kê ─────────────────────────────────────────────
  const statCards = [
    {
      title: "Cư Dân",
      value: stats.citizens,
      change: "Cập nhật trực tiếp từ hệ thống",
      icon: <Users size={24} />,
      iconBg: "#e6f4ff",
      iconColor: "#1890ff",
    },
    {
      title: "Hộ Gia Đình",
      value: stats.households,
      change: "Cập nhật trực tiếp từ hệ thống",
      icon: <Home size={24} />,
      iconBg: "#e6fffb",
      iconColor: "#13c2c2",
    },
    {
      title: "Giấy Tờ",
      value: stats.certificates,
      change: "Cập nhật trực tiếp từ hệ thống",
      icon: <FileText size={24} />,
      iconBg: "#f9f0ff",
      iconColor: "#722ed1",
    },
    {
      title: "Tạm Trú / Tạm Vắng",
      value: stats.tempResidences,
      change: "Cập nhật trực tiếp từ hệ thống",
      icon: <MapPin size={24} />,
      iconBg: "#fff7e6",
      iconColor: "#fa8c16",
    },
  ];

  // ── Dữ liệu hiển thị Hành Động Nhanh (Đã thay đổi theo yêu cầu) ──────────
  const quickActions = [
    {
      icon: <UserPlus size={20} />,
      title: "Thêm Công Dân",
      description: "Đăng ký công dân mới vào hệ thống",
      path: "/admin/citizen",
    },
    {
      icon: <HomeIcon size={20} />,
      title: "Tạo Hộ Khẩu",
      description: "Lập hồ sơ hộ khẩu mới",
      path: "/admin/household",
    },
    {
      icon: <MapPin size={20} />,
      title: "Đăng Ký Lưu Trú",
      description: "Khai báo tạm trú hoặc tạm vắng",
      path: "/admin/residence",
    },
    {
      icon: <FilePlus size={20} />,
      title: "Giấy Tờ Hộ Tịch",
      description: "Cấp giấy khai sinh hoặc khai tử",
      path: "/admin/certificates",
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Bảng Điều Khiển</h1>
        <p className="dashboard-subtitle">
          Chào mừng trở lại! Đây là tổng quan về hệ thống của bạn dựa trên dữ liệu thực tế.
        </p>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-content">
              <div className="stat-text">
                <div className="stat-label">{stat.title}</div>
                <div className="stat-value">
                  {loadingStats ? (
                    <Spin size="small" />
                  ) : (
                    <CountUp end={stat.value} separator="," duration={2} />
                  )}
                </div>
                {!loadingStats && (
                  <div className="stat-change" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={12} />
                    {stat.change}
                  </div>
                )}
              </div>
              <div
                className="stat-icon"
                style={{ background: stat.iconBg, color: stat.iconColor }}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="content-grid">
        <div className="quick-actions-card">
          <div className="card-header">
            <h2 className="card-title">Hành Động Nhanh</h2>
            <p className="card-subtitle">Các tác vụ hệ thống thường dùng</p>
          </div>
          <div className="actions-list">
            {quickActions.map((action, index) => (
              <button 
                key={index} 
                className="action-item"
                onClick={() => navigate(action.path)}
                style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                <div className="action-icon">{action.icon}</div>
                <div className="action-text">
                  <div className="action-title">{action.title}</div>
                  <div className="action-description">{action.description}</div>
                </div>
                <ArrowRight size={16} color="#aaa" style={{ marginLeft: 'auto' }} />
              </button>
            ))}
          </div>
        </div>

        <div className="activity-card">
          <div className="card-header">
            <h2 className="card-title">Hoạt Động Gần Đây</h2>
            <p className="card-subtitle">Các bản ghi mới nhất trong hệ thống</p>
          </div>
          
          {loadingActivity ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Spin />
            </div>
          ) : recentActivities.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
              <Clock size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p>Chưa có hoạt động nào</p>
            </div>
          ) : (
            <div className="activity-list">
              {recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div
                    className="activity-icon"
                    style={{
                      background: activity.bgColor,
                      color: activity.color,
                    }}
                  >
                    {activity.icon}
                  </div>
                  <div className="activity-content">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <div className="activity-title" style={{ margin: 0 }}>{activity.title}</div>
                      <Tag
                        color={activity.tagColor}
                        style={{ fontSize: 10, padding: "0 6px", lineHeight: "16px", borderRadius: 10 }}
                      >
                        {activity.tag}
                      </Tag>
                    </div>
                    <div className="activity-description">
                      {activity.detail}
                    </div>
                  </div>
                  <div className="activity-time">{timeAgo(activity.time)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
