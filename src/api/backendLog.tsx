export const logEvent = async (message: string, success: boolean = true) => {
  const now = new Date().toLocaleString();
  console.log(`[${now}] ${message} - ${success ? "Event" : "Error"}`);

  const payload = {
    log_type: success ? "INFO" : "ERROR",
    message: message,
  };

  try {
    const response = await fetch("http://127.0.0.1:5000/log/addLogFrontEnd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.log("Error response from the server:", response);
      throw new Error("Failed to log event");
    }

    const responseData = await response.json(); // This line extracts the JSON response
    console.log("Response from the server:", responseData);
  } catch (error) {
    console.error("Error logging event:", error);
  }
};
