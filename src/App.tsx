import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "mdb-react-ui-kit/dist/css/mdb.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import Login from "./pages/Login";
import SetupSpace from "./pages/SetupSpace";
import CreateSpace from "./pages/CreateSpace";
import JoinSpace from "./pages/JoinSpace";
import Home from "./pages/Home";
import Register from "./pages/Registration";
import CleaningRota from "./pages/CleaningRota";
import Profile from "./pages/Profile";
import Confirm from "./pages/Confirm";
import SocialFeed from "./pages/SocialFeed";
import AddPost from "./pages/AddPost";
import ViewPost from "./pages/ViewPost";
import ReserveSharedSpace from "./pages/ReserveSpace";
import BillSplittingPage from "./pages/Bills";

// 1) Import your PrivateRoute
import PrivateRoute from "./components/PrivateRoute";

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes (accessible even when not logged in) */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* If your /confirm page needs to be public, keep it outside PrivateRoute */}
          <Route path="/confirm" element={<Confirm />} />

          {/* Private routes: wrap with <PrivateRoute> */}
          <Route
            path="/setup-space"
            element={
              <PrivateRoute>
                <SetupSpace />
              </PrivateRoute>
            }
          />
          <Route
            path="/create-space"
            element={
              <PrivateRoute>
                <CreateSpace />
              </PrivateRoute>
            }
          />
          <Route
            path="/join-space"
            element={
              <PrivateRoute>
                <JoinSpace />
              </PrivateRoute>
            }
          />
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/cleaning-rota"
            element={
              <PrivateRoute>
                <CleaningRota />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/reserve-space"
            element={
              <PrivateRoute>
                <ReserveSharedSpace />
              </PrivateRoute>
            }
          />
          <Route
            path="/bills"
            element={
              <PrivateRoute>
                <BillSplittingPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/social-feed"
            element={
              <PrivateRoute>
                <SocialFeed />
              </PrivateRoute>
            }
          />
          <Route
            path="/add-post"
            element={
              <PrivateRoute>
                <AddPost />
              </PrivateRoute>
            }
          />
          <Route
            path="/view-post/:postId"
            element={
              <PrivateRoute>
                <ViewPost />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
