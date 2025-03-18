import React from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: React.ReactNode;
}

// This component checks if the user is logged in
// If not logged in, it redirects to login ("/")
// Otherwise, it renders the wrapped component
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const tokensString = sessionStorage.getItem("authTokens");
  const tokens = tokensString ? JSON.parse(tokensString) : null;
  const isAuthenticated = tokens?.accessToken; // or however you prefer to check

  // If there’s no token, push user to login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If authenticated, render the children
  return <>{children}</>;
};

export default PrivateRoute;
