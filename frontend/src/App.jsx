// import reactLogo from "./assets/react.svg";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import "./App.css";
import LayoutAdmin from "./components/Admin/LayoutAdmin";
import AdminPage from "./pages/admin";
import NotFound from "./components/NotFound";
import HomePage from "./pages/home";
import LoginPage from "./pages/login";
import CitizensTable from "./components/Admin/Citizens/CitizensTable";
import { useDispatch, useSelector } from "react-redux";
import Loading from "./components/Loading";
import { useEffect, useState } from "react";
import { callFetchAccount, callUserById } from "./services/api.service";
import { doGetAccountAction } from "./redux/account/accountSlice";
import HouseholdTable from "./components/Admin/Household/HouseholdTable";
import HouseholdDetail from "./components/Admin/Household/HouseholdDetail";
import HouseholdList from "./components/Admin/Household/HouseholdList";
import UserProfile from "./components/User/UserProfile";
import ResidenceTable from "./components/Admin/Residence/ResidenceTable";
import CertificateTable from "./components/Admin/Certificate/CertificateTable";
const Layout = () => {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <Header />
        <div
          style={{
            flex: "1",
            // background: "red",
          }}
        >
          <Outlet />
        </div>
        <Footer />
      </div>
    </>
  );
};
const routes = [
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      { path: "/profile", element: <UserProfile /> },
    ],
  },
  {
    path: "/admin",
    element: <LayoutAdmin />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <AdminPage /> },
      { path: "citizen", element: <CitizensTable /> },
      {
        path: "household",
        element: <HouseholdList />,
        children: [
          { index: true, element: <HouseholdTable /> },
          { path: ":id", element: <HouseholdDetail /> },
        ],
      },
      { path: "residence", element: <ResidenceTable /> },
      { path: "certificates", element: <CertificateTable /> },
      { path: "reports", element: <div>reports</div> },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
];
const App = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.account.isLoading);
  const router = createBrowserRouter(routes);
  const [accountUser, setAccountUser] = useState();
  const getAccount = async () => {
    if (
      window.location.pathname === "/login" ||
      window.location.pathname === "/register"
    )
      return;
    const res = await callFetchAccount();
    if (res && res?.data) {
      const resUser = await callUserById(res.data.userId);
      setAccountUser(resUser);
      if (resUser) {
        const dataUser = {
          email: resUser.data.email,
          phone: resUser.data.phone,
          fullName: resUser.data.full_name,
          role: resUser.data.role_name,
          userId: resUser.data.user_id,
          username: resUser.data.username,
        };
        dispatch(doGetAccountAction({ user: dataUser }));
      }
    }
  };

  useEffect(() => {
    getAccount();
  }, []);

  return (
    <>
      {/* <a href="https://react.dev" target="_blank">
        <img src={reactLogo} className="logo react" alt="React logo" />
      </a> */}

      {isLoading === false ||
      window.location.pathname === "/login" ||
      window.location.pathname === "/register" ||
      window.location.pathname === "/" ? (
        <RouterProvider router={router} />
      ) : (
        <Loading />
      )}
    </>
  );
};

export default App;
