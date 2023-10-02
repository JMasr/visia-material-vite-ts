import React, { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import { Container, Button, Stack, Typography, Box } from "@mui/material";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import "./App.css"; // Import a CSS file for styling
import Record from "./screen/Record";
import BackendHandler from "./api/backendHandler";

const baseUrl = "http://127.0.0.1:5000";
const backendHandler = new BackendHandler(baseUrl);

export default function App() {
  return <Record backendHandler={backendHandler} />;
}
