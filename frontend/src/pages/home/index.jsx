import { Users, Home, FileText, BarChart3, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Thêm useNavigate để chuyển trang
import { useSelector } from "react-redux"; // Thêm useSelector để lấy trạng thái đăng nhập
import "../../assets/styles/homePage.scss";

const HomePage = () => {
  const navigate = useNavigate(); // Khởi tạo hook chuyển hướng
  
  // Lấy trạng thái đăng nhập và thông tin user từ Redux
  const isAuthenticated = useSelector((state) => state.account.isAuthenticated);
  const user = useSelector((state) => state.account.user);

  const features = [
    {
      icon: <Users className="feature-icon" />,
      title: "Quản Lý Công Dân",
      description: "Đăng ký và quản lý hồ sơ công dân với thông tin đầy đủ",
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

  // XỬ LÝ KHI BẤM NÚT "BẮT ĐẦU"
  const handleGetStarted = () => {
    if (isAuthenticated) {
      // Đã đăng nhập: Kiểm tra role
      const role = user?.role || user?.roleName;
      if (role === "Admin" || role === "ADMIN" || role === "Staff") {
        navigate("/admin"); // Là quản trị viên thì vào Admin
      } else {
        // Nếu chỉ là user thường, bạn có thể chuyển hướng đi đâu đó tùy ý (hoặc để trống)
        alert("Bạn là người dùng thường, đang ở trang chủ rồi!");
      }
    } else {
      // Chưa đăng nhập: Bắt đi đăng nhập
      navigate("/login"); 
    }
  };

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
          
          {/* Đã thêm sự kiện onClick vào nút này */}
          <button className="get-started-btn" onClick={handleGetStarted}>
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
