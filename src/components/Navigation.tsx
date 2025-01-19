import React, { useState, useEffect } from "react";
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
  const getActiveClass = (path: string) => {
    return location.pathname === path ? "fw-bold text-decoration-underline" : "";
  };

  // Detect if view is mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Logout
  const handleLogout = () => {
    console.log("User logged out");
    window.location.href = "/";
  };

  // Page title logic based on current path
  let pageTitle = "Home";
  switch (location.pathname) {
    case "/cleaning-rota":
      pageTitle = "Cleaning Rota";
      break;
    case "/todo-list":
      pageTitle = "To Do List";
      break;
    case "/reserve-space":
      pageTitle = "Reserve Space";
      break;
    case "/profile":
      pageTitle = "Profile";
      break;
    default:
      pageTitle = "Home";
      break;
  }

  // Optional route-based icon
  let pageIcon = "home";
  if (pageTitle === "Cleaning Rota") {
    pageIcon = "broom";
  } else if (pageTitle === "Profile") {
    pageIcon = "user";
  }

  return (
    <MDBNavbar expand="lg" light bgColor="light" fixed="top">
      <div className="container-fluid">
        <MDBNavbarBrand
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/home")}
        >
          <MDBIcon fas icon={pageIcon} className="me-2" />
          {pageTitle}
        </MDBNavbarBrand>

        {isMobile ? (
          <MDBDropdown>
            <MDBDropdownToggle tag="a" href="#!" role="button">
              ☰ {/* Hamburger menu */}
            </MDBDropdownToggle>
            <MDBDropdownMenu>
              <MDBDropdownItem>
                <MDBNavbarLink 
                  href="/home"
                  className={getActiveClass("/home")}  
                >
                  Home
                </MDBNavbarLink>
              </MDBDropdownItem>
              <MDBDropdownItem>
                <MDBNavbarLink 
                  href="/todo-list"
                  className={getActiveClass("/todo-list")}
                >
                  To Do List
                </MDBNavbarLink>
              </MDBDropdownItem>
              <MDBDropdownItem>
                <MDBNavbarLink 
                  href="/reserve-space"
                  className={getActiveClass("/reserve-space")}
                >
                  Reserve Space
                </MDBNavbarLink>
              </MDBDropdownItem>
              <MDBDropdownItem>
                <MDBNavbarLink
                  href="/cleaning-rota"
                  className={getActiveClass("/cleaning-rota")}
                >
                  Cleaning Rota
                </MDBNavbarLink>
              </MDBDropdownItem>
              <MDBDropdownItem>
                <MDBNavbarLink 
                  href="/profile"
                  className={getActiveClass("/profile")}
                >
                  Profile
                </MDBNavbarLink>
              </MDBDropdownItem>
              <MDBDropdownItem>
                <MDBBtn
                  color="danger"
                  size="sm"
                  className="w-100"
                  onClick={handleLogout}
                >
                  Log Out
                </MDBBtn>
              </MDBDropdownItem>
            </MDBDropdownMenu>
          </MDBDropdown>
        ) : (
          <MDBNavbarNav>
            <MDBNavbarItem>
              <MDBNavbarLink 
                href="/todo-list"
                className={getActiveClass("/todo-list")}
              >
                To Do List
              </MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink 
                href="/reserve-space"
                className={getActiveClass("/reserve-space")}
              >
                Reserve Space
              </MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink
                href="/cleaning-rota"
                className={getActiveClass("/cleaning-rota")}
              >
                Cleaning Rota
              </MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink
                href="/profile"
                className={getActiveClass("/profile")}
              >
                Profile
              </MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBBtn
                color="danger"
                size="sm"
                className="ms-3"
                onClick={handleLogout}
              >
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
