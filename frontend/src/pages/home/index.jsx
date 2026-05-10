import { Users, Home, FileText, BarChart3, ArrowRight } from "lucide-react";
import "../../assets/styles/homePage.scss";
const HomePage = () => {
  const features = [
    {
      icon: <Users className="feature-icon" />,
      title: "Quản Lý Công Dân",
      description:
        "Đăng ký và quản lý hồ sơ công dân với thông tin đầy đủ",
    },
    {
      icon: <Home className="feature-icon" />,
      title: "Hồ Sơ Hộ Khẩu",
      description: "Theo dõi thông tin gia đình và mối quan hệ thành viên",
    },
    {
      icon: <FileText className="feature-icon" />,
      title: "Giấy Tờ Quan Trọng",
      description: "Cấp và quản lý giấy khai sinh, giấy khai tử",
    },
    {
      icon: <BarChart3 className="feature-icon" />,
      title: "Báo Cáo & Thống Kê",
      description: "Tạo báo cáo toàn diện và thống kê chi tiết",
    },
  ];
  return (
    <>
      <main className="main-content">
        <div className="hero-section">
          <h1 className="hero-title">Hệ Thống Quản Lý Công Dân Chính Phủ</h1>
          <p className="hero-description">
            Giải pháp toàn diện để quản lý hồ sơ công dân,
            <br />
            Hộ khẩu, giấy tờ quan trọng và dữ liệu hành chính
          </p>
          <button className="get-started-btn">
            Bắt Đầu <ArrowRight size={20} />
          </button>
        </div>

        <div className="features-section">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-content">
                {feature.icon}
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
};
export default HomePage;
