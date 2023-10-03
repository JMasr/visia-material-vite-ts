class BackendHandler {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async makeBasicRequest<T>(
    url: string,
    method: string,
    payload?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: payload ? JSON.stringify(payload) : undefined,
    };

    try {
      const response = await fetch(`${this.baseUrl}${url}`, options);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("Request error:", error);
      throw error;
    }
  }

  public async requestTokenByUsrPass(
    username: string,
    password: string
  ): Promise<string | null> {
    const url = "http://your-backend-url/login"; // Replace with your actual login endpoint

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    if (!response.ok) {
      // TODO: Handle error with log
      console.error("Failed to request token:", response.statusText);
      return null;
    }

    const data = await response.json();
    // TODO: Handle success with log
    return data.access_token; // Assuming the token is returned in the response as 'access_token'
  }

  public async addLogFrontEnd(message: string, success: boolean = true) {
    const now = new Date().toLocaleString();
    console.log(`[${now}] ${message} - ${success ? "Event" : "Error"}`);

    const payload = {
      log_type: success ? "INFO" : "ERROR",
      message: message,
    };

    try {
      const response = await fetch(`${this.baseUrl}/log/addLogFrontEnd`, {
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
  }

  public async getRenderData(url: string): Promise<any | null> {
    const response = await fetch(`${this.baseUrl}${url}`);

    if (!response.ok) {
      console.error("Failed to get render data:", response.statusText);
      return null; // Return empty strings instead of null
    }

    const response_json = await response.json();
    return response_json.data;
  }

  public async sendVideoToServer(
    crdId: string,
    patientId: string,
    videoBlob: Blob
  ): Promise<boolean> {
    // Prepare the payload and send it to the server
    const date = new Date().toLocaleString();
    const videoName = "sesion_" + patientId + "_" + date + "_.webm";
    // Make the payload
    const payload = new FormData();
    payload.append("crd_id", crdId);
    payload.append("patient_id", patientId);
    payload.append("video", videoBlob);
    payload.append("video_name", videoName);
    payload.append("date", date);

    try {
      // Send the payload to the server
      const response = await fetch(`${this.baseUrl}/video/uploads`, {
        method: "POST",
        body: payload,
      });

      // Check the response
      if (!response.ok) {
        // Handle error
        this.addLogFrontEnd("Failed to send video to the server", false); // Log the error
        console.error(
          "Failed to send video to the server:",
          response.statusText
        );
        return false;
      }

      // Handle success
      const data = await response.json();
      console.log("Video sent successfully:", data);
      return true;
    } catch (error) {
      // Handle error
      console.error("Error sending video to the server:", error);
      return false;
    }
  }
}

export default BackendHandler;
