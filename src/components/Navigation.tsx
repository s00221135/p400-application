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

  // Track mobile view
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

  // Determine the page title based on the current path
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

  // Optionally choose an icon based on the route
  let pageIcon = "home";
  if (pageTitle === "Cleaning Rota") {
    pageIcon = "broom";
  }

  return (
    <MDBNavbar expand="lg" light bgColor="light">
      <div className="container-fluid">
        {/* 
          The brand link or text:
          - You can make it navigate to /home onClick
          - Or set it to an <MDBNavbarBrand href="/home">. 
          - We'll navigate to /home if user clicks, but show the "current page" text. 
        */}
        <MDBNavbarBrand 
          style={{ cursor: "pointer" }} 
          onClick={() => navigate("/home")} 
        >
          <MDBIcon fas icon={pageIcon} className="me-2" />
          {pageTitle}
        </MDBNavbarBrand>

        {/* -- Remove the second line "Cleaning Rota" -- */}
        {/* <MDBIcon fas icon="cleaning" className="me-2" /> Cleaning Rota (Removed) */}

        {/* If mobile, show dropdown menu */}
        {isMobile ? (
          <MDBDropdown>
            <MDBDropdownToggle tag="a" href="#!" role="button">
              ☰ {/* Hamburger menu */}
            </MDBDropdownToggle>
            <MDBDropdownMenu>
  <MDBDropdownItem>
    <MDBNavbarLink href="/home">Home</MDBNavbarLink>
  </MDBDropdownItem>
  <MDBDropdownItem>
    <MDBNavbarLink href="/todo-list">To Do List</MDBNavbarLink>
  </MDBDropdownItem>
  <MDBDropdownItem>
    <MDBNavbarLink href="/reserve-space">Reserve Space</MDBNavbarLink>
  </MDBDropdownItem>
  <MDBDropdownItem>
    <MDBNavbarLink href="/cleaning-rota">Cleaning Rota</MDBNavbarLink>
  </MDBDropdownItem>
  <MDBDropdownItem>
    <MDBNavbarLink href="/profile">Profile</MDBNavbarLink>
  </MDBDropdownItem>
  <MDBDropdownItem>
    <MDBBtn color="danger" size="sm" className="w-100" onClick={handleLogout}>
      Log Out
    </MDBBtn>
  </MDBDropdownItem>
</MDBDropdownMenu>

          </MDBDropdown>
        ) : (
          // Else display normal navbar links
          <MDBNavbarNav>
            <MDBNavbarItem>
              <MDBNavbarLink href="/todo-list">To Do List</MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink href="/reserve-space">Reserve Space</MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink href="/cleaning-rota">Cleaning Rota</MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink href="/profile">Profile</MDBNavbarLink>
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
