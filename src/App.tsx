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
import CreatePost from "./pages/CreatePostPage";
import ViewPost from "./pages/ViewPost";
import ReserveSharedSpace from "./pages/ReserveSpace";
import BillSplittingPage from "./pages/Bills";
import ShoppingListPage from "./pages/ShoppingList";
import ShoppingListDetail from "./pages/ShoppingListDetail";
import NoticeBoardPage from "./pages/Noticeboard";
import HouseholdSettings from "./pages/HouseholdSettings";

import PrivateRoute from "./components/PrivateRoute";

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/confirm" element={<Confirm />} />

          {/* Private routes */}
          <Route path="/setup-space" element={<PrivateRoute><SetupSpace /></PrivateRoute>} />
          <Route path="/create-space" element={<PrivateRoute><CreateSpace /></PrivateRoute>} />
          <Route path="/join-space" element={<PrivateRoute><JoinSpace /></PrivateRoute>} />
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/cleaning-rota" element={<PrivateRoute><CleaningRota /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/reserve-space" element={<PrivateRoute><ReserveSharedSpace /></PrivateRoute>} />
          <Route path="/bills" element={<PrivateRoute><BillSplittingPage /></PrivateRoute>} />
          <Route path="/social-feed" element={<PrivateRoute><SocialFeed /></PrivateRoute>} />
          {/* Updated route for creating a post */}
          <Route path="/create-post" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
          <Route path="/view-post/:postId" element={<PrivateRoute><ViewPost /></PrivateRoute>} />
          <Route path="/shopping-list" element={<PrivateRoute><ShoppingListPage /></PrivateRoute>} />
          <Route path="/shopping-list/:id" element={<PrivateRoute><ShoppingListDetail /></PrivateRoute>} />
          <Route path="/notice-board" element={<PrivateRoute><NoticeBoardPage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><HouseholdSettings /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
