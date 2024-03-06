import "./App.css";
import "@fontsource/roboto";
import { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Record from "./screen/Record";
import Backup from "./screen/Backup";
import BackendHandler from "./api/backendHandler";
import RecordWebCam from "./screen/RecordWebCam";

const baseUrl = "http://127.0.0.1:8181";
const backendHandler = new BackendHandler(baseUrl);

export default function App() {
  useEffect(() => {
    const initializeBackend = async () => {
      // Call the pollBackEnd method when the component mounts
      await backendHandler.pollBackEnd();
    };

    initializeBackend();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Record backendHandler={backendHandler} />} />
        <Route
          path="/backup"
          element={<Backup backendHandler={backendHandler} />}
        />
        <Route
          path="/webcam"
          element={<RecordWebCam backendHandler={backendHandler} />}
        />
        {/* Add more routes here as needed */}
      </Routes>
    </Router>
  );
}
