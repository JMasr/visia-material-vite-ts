import "./App.css";
import "@fontsource/roboto";
import Record from "./screen/Record";
import BackendHandler from "./api/backendHandler";

const baseUrl = "http://127.0.0.1:8080";
const backendHandler = new BackendHandler(baseUrl);

export default function App() {
  return <Record backendHandler={backendHandler} />;
}
