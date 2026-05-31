import { Users, LogIn } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { callLogout } from "../../services/api.service";
import { doLogoutAction } from "../../redux/account/accountSlice";
import { Dropdown, message } from "antd";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state) => state.account.isAuthenticated);
  const user = useSelector((state) => state.account.user);
  const fullName = user.fullName;

  const handleLogin = () => {
    navigate("/login");
  };

  const handleLogout = async () => {
    const res = await callLogout();
    console.log(res);
    if (res) {
      dispatch(doLogoutAction());
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      message.success("Đăng xuất thành công");
      navigate("/");
    }
  };
  const items = [
    {
      key: "HomePage",
      label: <Link to="/profile">Thông tin cá nhân</Link>,
    },
    // {
    //   key: "manageUser",
    //   label: (
    //     <label
    //       style={{ cursor: "pointer" }}
    //       onClick={() => setIsModalOpenUser(true)}
    //     >
    //       Quản lý tài khoản
    //     </label>
    //   ),
    // },

    {
      key: "logout",
      label: (
        <label style={{ cursor: "pointer" }} onClick={handleLogout}>
          Đăng Xuất
        </label>
      ),
      // icon: <IoLogOutOutline />,
    },
  ];
  if (user?.role === "Admin") {
    items.unshift({
      label: <Link to="/admin">Quản Lý</Link>,
      key: "admin",
    });
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo-icon">
            <Users size={20} />
          </div>
          <span className="logo-text">Hệ Thống Quản Lý Công Dân</span>
        </div>
        <div className="header-actions">
          {isAuthenticated === true ? (
            <></>
          ) : (
            <button className="login-btn" onClick={handleLogin}>
              <LogIn size={18} />
              Đăng Nhập
            </button>
          )}
          {isAuthenticated === true ? (
            <div style={{ cursor: "pointer" }}>
              <Dropdown menu={{ items }}>
                <button
                  className="access-btn"
                  onClick={(e) => e.preventDefault()}
                >
                  Truy Cập Hệ Thống
                </button>
              </Dropdown>
            </div>
          ) : (
            <button className="access-btn">Truy Cập Hệ Thống</button>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;
