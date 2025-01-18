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

const Navigation: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    // Clear session or auth data here if needed
    console.log("User logged out");
    window.location.href = "/"; // Redirect to login page
  };

  return (
    <MDBNavbar expand="lg" light bgColor="light">
      <div className="container-fluid">
        <MDBNavbarBrand href="/home">
          <MDBIcon fas icon="home" className="me-2" />
          Home
        </MDBNavbarBrand>

        {isMobile ? (
          <MDBDropdown>
            <MDBDropdownToggle tag="a" href="#!" role="button">
              ☰ {/* Hamburger menu as plain text */}
            </MDBDropdownToggle>
            <MDBDropdownMenu>
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
