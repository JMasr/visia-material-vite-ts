import Swal from "sweetalert2";

class BackendHandler {
  private baseUrl: string;
  private accessToken!: string;
  private user: string= "frontUser";
  private password: string = "frontPass";

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.initializeAccessToken();
  }

  private async initializeAccessToken(): Promise<void> {
    await this.requestAccessToken(this.user, this.password);
    if (typeof this.accessToken === "string") {
      this.accessToken = this.accessToken;
      console.log("Access token received");
      this.addLogFrontEnd("Access token received", true);
    } else {
      console.error("Access token is not a string:", this.accessToken);
      this.addLogFrontEnd("Access token", false);
      throw new Error("Access token is not a string");
    }
  }

  
  public async requestAccessToken(username: string, password: string): Promise<void> {
    const url = `${this.baseUrl}/requestAccessTokenByUser`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        console.error("Failed to request access token:");
        this.addLogFrontEnd("Failed to request access token", false);
        throw new Error("Failed to request access token");
      }

      const data = await response.json();
      this.accessToken = data.access_token;

      console.log("Access token received:" + this.accessToken);
      this.addLogFrontEnd("Access token received");
    } catch (error) {
      console.error("Error requesting access token:", error);
      this.addLogFrontEnd("Error requesting access token", false);
      throw error;
    }
  }

  public async pollBackEnd(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/poll`);
      const data = await response.json();
      if (!data.success) {
        console.error("Error pinging the backend:", data.message);
        console.log("Response from the backend:", response);
        // Alert the user
        Swal.fire({
          title: "Alerta!",
          text: "Backend no disponible: " + data.message,
          icon: "error",
          confirmButtonText: "OK",
        });
      }
      console.log("Response from the backend:", response);

      return data.success;
    } catch (error) {
      // Alert the user
      Swal.fire({
        title: "Alerta!",
        text: "Backend no disponible",
        icon: "error",
        confirmButtonText: "OK",
      });
      return false;
    }
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
        headers: { Authorization: `Bearer ${this.accessToken}`},
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
