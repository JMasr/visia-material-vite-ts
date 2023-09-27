// Basic logging function to log events to the backend
export const logEvent = async (message: string, success: boolean = true) => {
  const now = new Date().toLocaleString();
  console.log(`[${now}] ${message} - ${success ? "Event" : "Error"}`);

  const payload = new FormData();
  payload.append("success", success ? "Event" : "Error");
  payload.append("message", message);
  payload.append("date", now);

  // try {
  //   const response = await fetch("http://localhost:5000/addLog", {
  //     method: "POST",
  //     body: payload,
  //   });

  //   if (!response.ok) {
  //     throw new Error("Failed to log event");
  //   }
  // } catch (error) {
  //   console.error("Error logging event:", error);
  // }
};
