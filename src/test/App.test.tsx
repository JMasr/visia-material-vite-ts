import { expect, test } from "vitest";
import App from "../App";

test("Check component", () => {
  const app = new App();
  expect(app).not.toBe(null);
});
