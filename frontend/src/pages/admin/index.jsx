import {
  Users,
  Home,
  FileText,
  MapPin,
  Plus,
  Search,
  Download,
  User,
} from "lucide-react";
import CountUp from "react-countup";
import "../../assets/styles/dashboard.scss";
const AdminPage = () => {
  const stats = [
    {
      title: "Cư Dân",
      value: 12543,
      change: "+2.5% so với tháng trước",
      icon: <Users size={24} />,
      iconBg: "#e6f4ff",
      iconColor: "#1890ff",
    },
    {
      title: "Hộ Gia Đình",
      value: 3842,
      change: "+1.2% so với tháng trước",
      icon: <Home size={24} />,
      iconBg: "#e6fffb",
      iconColor: "#13c2c2",
    },
    {
      title: "Giấy Tờ",
      value: 8291,
      change: "+5.1% so với tháng trước",
      icon: <FileText size={24} />,
      iconBg: "#f9f0ff",
      iconColor: "#722ed1",
    },
    {
      title: "Tạm Trú",
      value: 456,
      change: "+0.8% so với tháng trước",
      icon: <MapPin size={24} />,
      iconBg: "#fff7e6",
      iconColor: "#fa8c16",
    },
  ];

  const quickActions = [
    {
      icon: <Plus size={20} />,
      title: "Thêm Cư Dân",
      description: "Đăng ký một cư dân mới",
    },
    {
      icon: <Plus size={20} />,
      title: "Hộ Gia Đình Mới",
      description: "Tạo hồ sơ hộ gia đình mới",
    },
    {
      icon: <Search size={20} />,
      title: "Tìm Kiếm Hồ Sơ",
      description: "Tìm thông tin cư dân",
    },
    {
      icon: <Download size={20} />,
      title: "Xuất Dữ Liệu",
      description: "Tạo báo cáo",
    },
  ];

  const activities = [
    {
      icon: <User size={20} />,
      iconBg: "#e6f4ff",
      iconColor: "#1890ff",
      title: "Cư dân mới đăng ký",
      description: "Nguyen Van A",
      time: "2 giờ trước",
    },
    {
      icon: <Home size={20} />,
      iconBg: "#e6fffb",
      iconColor: "#13c2c2",
      title: "Hộ gia đình được cập nhật",
      description: "Hộ gia đình #HH-2025-001",
      time: "4 giờ trước",
    },
    {
      icon: <FileText size={20} />,
      iconBg: "#f9f0ff",
      iconColor: "#722ed1",
      title: "Giấy khai sinh được phát hành",
      description: "Giấy tờ #BC-2025-0542",
      time: "1 ngày trước",
    },
    {
      icon: <MapPin size={20} />,
      iconBg: "#fff7e6",
      iconColor: "#fa8c16",
      title: "Tạm trú được đăng ký",
      description: "Tran Thi B",
      time: "2 ngày trước",
    },
    {
      icon: <User size={20} />,
      iconBg: "#e6f4ff",
      iconColor: "#1890ff",
      title: "Hồ sơ cư dân được cập nhật",
      description: "Le Van C",
      time: "3 ngày trước",
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Bảng Điều Khiển</h1>
        <p className="dashboard-subtitle">
          Chào mừng trở lại! Đây là tổng quan về hệ thống của bạn.
        </p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-content">
              <div className="stat-text">
                <div className="stat-label">{stat.title}</div>
                <div className="stat-value">
                  <CountUp end={stat.value} separator="," />
                </div>
                <div className="stat-change">{stat.change}</div>
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
            <p className="card-subtitle">Các tác vụ thường dùng</p>
          </div>
          <div className="actions-list">
            {quickActions.map((action, index) => (
              <button key={index} className="action-item">
                <div className="action-icon">{action.icon}</div>
                <div className="action-text">
                  <div className="action-title">{action.title}</div>
                  <div className="action-description">{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="activity-card">
          <div className="card-header">
            <h2 className="card-title">Hoạt Động Gần Đây</h2>
            <p className="card-subtitle">Các hoạt động hệ thống gần đây</p>
          </div>
          <div className="activity-list">
            {activities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div
                  className="activity-icon"
                  style={{
                    background: activity.iconBg,
                    color: activity.iconColor,
                  }}
                >
                  {activity.icon}
                </div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-description">
                    {activity.description}
                  </div>
                </div>
                <div className="activity-time">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminPage;
