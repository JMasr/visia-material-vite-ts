import "./App.css";
import "@fontsource/roboto";
import Record from "./screen/Record";
import BackendHandler from "./api/backendHandler";
import React from "react";

const baseUrl = "http://127.0.0.1:8181";
const backendHandler = new BackendHandler(baseUrl);

export default function App() {
  return <Record backendHandler={backendHandler} />;
}
