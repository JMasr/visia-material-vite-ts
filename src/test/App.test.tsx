import { expect, test } from "vitest";
import BackendHandler from "../api/backendHandler";
import Record from "../screen/Record";

test("Check component", () => {
  const baseUrl = "http://127.0.0.1:5000";
  const backendHandler = new BackendHandler(baseUrl);
  // Test backendHandler
  expect(backendHandler).toBeDefined();
});
