import React, { useEffect, useState } from "react";
import {
  MDBNavbar,
  MDBNavbarBrand,
  MDBNavbarNav,
  MDBNavbarItem,
  MDBNavbarLink,
  MDBDropdown,
  MDBDropdownToggle,
  MDBDropdownMenu,
  MDBDropdownItem,
  MDBBtn,
  MDBIcon,
} from "mdb-react-ui-kit";
import { useLocation, useNavigate } from "react-router-dom";

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to apply "bold + underline" classes if the path is active
  const getActiveClass = (path: string) =>
    location.pathname === path ? "fw-bold text-decoration-underline" : "";

  // Detect mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Logout function – remove tokens from sessionStorage and navigate to "/"
  const handleLogout = () => {
    sessionStorage.removeItem("authTokens");
    navigate("/");
  };

  // Determine page title and icon based on the current path
  let pageTitle = "Home";
  let pageIcon = "home";
  switch (location.pathname) {
    case "/cleaning-rota":
      pageTitle = "Cleaning Rota";
      pageIcon = "broom";
      break;
    case "/bills":
      pageTitle = "Bills";
      pageIcon = "file-invoice-dollar";
      break;
    case "/reserve-space":
      pageTitle = "Reserve Space";
      break;
    case "/shopping-list":
      pageTitle = "Shopping List";
      pageIcon = "shopping-cart";
      break;
    case "/profile":
      pageTitle = "Profile";
      pageIcon = "user";
      break;
    case "/social-feed":
      pageTitle = "Social Feed";
      pageIcon = "user-group";
      break;
    default:
      pageTitle = "Home";
      pageIcon = "home";
      break;
  }

  return (
    <MDBNavbar expand="lg" light bgColor="light" fixed="top">
      <div className="container-fluid">
        <MDBNavbarBrand style={{ cursor: "pointer" }} onClick={() => navigate("/home")}>
          <MDBIcon fas icon={pageIcon} className="me-2" />
          {pageTitle}
        </MDBNavbarBrand>

        {isMobile ? (
          <MDBDropdown>
            <MDBDropdownToggle tag="a" href="#!" role="button">
              ☰
            </MDBDropdownToggle>
            <MDBDropdownMenu>
              <MDBDropdownItem>
                <MDBNavbarLink href="/home" className={getActiveClass("/home")}>
                  Home
                </MDBNavbarLink>
              </MDBDropdownItem>
              <MDBDropdownItem>
                <MDBNavbarLink href="/bills" className={getActiveClass("/bills")}>
                  Bills
                </MDBNavbarLink>
              </MDBDropdownItem>
              <MDBDropdownItem>
                <MDBNavbarLink href="/reserve-space" className={getActiveClass("/reserve-space")}>
                  Reserve Space
                </MDBNavbarLink>
              </MDBDropdownItem>
              <MDBDropdownItem>
                <MDBNavbarLink href="/cleaning-rota" className={getActiveClass("/cleaning-rota")}>
                  Cleaning Rota
                </MDBNavbarLink>
              </MDBDropdownItem>
              <MDBDropdownItem>
                <MDBNavbarLink href="/shopping-list" className={getActiveClass("/shopping-list")}>
                  Shopping List
                </MDBNavbarLink>
              </MDBDropdownItem>
              <MDBDropdownItem>
                <MDBNavbarLink href="/profile" className={getActiveClass("/profile")}>
                  Profile
                </MDBNavbarLink>
              </MDBDropdownItem>
              <MDBDropdownItem>
                <MDBBtn color="danger" size="sm" className="w-100" onClick={handleLogout}>
                  Log Out
                </MDBBtn>
              </MDBDropdownItem>
            </MDBDropdownMenu>
          </MDBDropdown>
        ) : (
          <MDBNavbarNav>
            <MDBNavbarItem>
              <MDBNavbarLink href="/bills" className={getActiveClass("/bills")}>
                Bills
              </MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink href="/reserve-space" className={getActiveClass("/reserve-space")}>
                Reserve Space
              </MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink href="/cleaning-rota" className={getActiveClass("/cleaning-rota")}>
                Cleaning Rota
              </MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink href="/shopping-list" className={getActiveClass("/shopping-list")}>
                Shopping List
              </MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink href="/profile" className={getActiveClass("/profile")}>
                Profile
              </MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink href="/social-feed" className={getActiveClass("/social-feed")}>
                Social Feed
              </MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBBtn color="danger" size="sm" className="ms-3" onClick={handleLogout}>
                Log Out
              </MDBBtn>
            </MDBNavbarItem>
          </MDBNavbarNav>
        )}
      </div>
    </MDBNavbar>
  );
};

export default Navigation;
