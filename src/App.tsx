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
import SocialFeed from "./pages/SocialFeed"; // New Social Feed Page
import AddPost from "./pages/AddPost"; // New Page for Creating a Post
import ViewPost from "./pages/ViewPost"; // New Page to View a Post
import ReserveSharedSpace from "./pages/ReserveSpace";
import BillSplittingPage from "./pages/Bills";

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} /> {/* Default to Login page */}
          <Route path="/setup-space" element={<SetupSpace />} />
          <Route path="/create-space" element={<CreateSpace />} />
          <Route path="/join-space" element={<JoinSpace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cleaning-rota" element={<CleaningRota />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/confirm" element={<Confirm />} />
<Route path="/reserve-space" element={<ReserveSharedSpace/>}/>
<Route path="/bills" element={<BillSplittingPage />} />
          {/* Social Feed Routes */}
          <Route path="/social-feed" element={<SocialFeed />} /> {/* Main Feed */}
          <Route path="/add-post" element={<AddPost />} /> {/* Fix: No props passed */}
          <Route path="/view-post/:postId" element={<ViewPost />} /> {/* View a Single Post */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
