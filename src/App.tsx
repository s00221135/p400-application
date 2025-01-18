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

        </Routes>
      </div>
    </Router>
  );
};

export default App;