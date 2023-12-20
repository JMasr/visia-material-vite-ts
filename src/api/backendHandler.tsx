import Swal from "sweetalert2";

class BackendHandler {
  private baseUrl: string;
  private accessToken!: string;
  private user: string = "frontUser";
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

  public async requestAccessToken(
    username: string,
    password: string
  ): Promise<void> {
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

      try {
        const data = await response.json();
        this.accessToken = data.access_token;
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        this.addLogFrontEnd("Error parsing JSON", false);
        throw jsonError;
      }

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
      if (!response.ok) {
        console.error(
          "Error pinging the backend:",
          response.status,
          response.statusText
        );
        // Alert the user
        Swal.fire({
          title: "Alerta!",
          text: "Backend no disponible: " + response.statusText,
          icon: "error",
          confirmButtonText: "OK",
        });
        return false;
      }

      try {
        const data = await response.json();
        console.log("Response from the backend:", data);

        if (!data.success) {
          console.error("Error pinging the backend:", data.message);
          console.error("Response from the backend:", response);
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
      } catch (jsonError) {
        // Alert the user
        Swal.fire({
          title: "Alerta!",
          text: "Backend no disponible",
          icon: "error",
          confirmButtonText: "OK",
        });
        return false;
      }
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
        console.error(
          "Error response from the server:",
          response.status,
          response.statusText
        );
        throw new Error("Failed to log event");
      }

      try {
        const responseData = await response.json(); // This line extracts the JSON response
        console.log("Response from the server:", responseData);
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        throw jsonError;
      }
    } catch (error) {
      console.error("Error logging event:", error);
    }
  }

  public async getRenderData(url: string): Promise<string | object> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`);

      if (!response.ok) {
        console.error(
          "Failed to get render data:",
          response.status,
          response.statusText
        );
        return "";
      }

      try {
        const response_json = await response.json();
        return response_json.data;
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        return "";
      }
    } catch (error) {
      console.error("Error getting render data:", error);
      return "";
    }
  }

  public async getPreviewPicture(): Promise<any> {
    const url = `${this.baseUrl}/video/digicam/preview`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.success) {
        // Handle error
        console.error(
          "Failed to fetch preview:",
          response.statusText,
          data.message
        );
        this.addLogFrontEnd(
          "Failed to fetch preview: " + response.statusText,
          false
        );
        return null;
      }

      // Handle success
      console.log("Preview fetched successfully");
      this.addLogFrontEnd("Preview fetched successfully", true);

      // Extract frame data from the response
      const frameData = data.data;

      // Assuming frameData.frame_base64 contains the base64-encoded frame
      const imageSrc = `data:image/jpeg;base64,${frameData.frame_base64}`;

      return imageSrc;
    } catch (error) {
      console.error("Error fetching preview:", error);
      this.addLogFrontEnd("Error fetching preview", false);
      return null;
    }
  }

  public async sendVideoToServer(
    crdId: string,
    videoBlob: Blob
  ): Promise<boolean> {
    // Prepare the payload and send it to the server
    const date = new Date().toLocaleString();
    const videoName = "sesion_" + crdId + "_" + date + "_.webm";
    // Make the payload
    const payload = new FormData();
    payload.append("crd_id", crdId);
    payload.append("video", videoBlob);
    payload.append("video_name", videoName);
    payload.append("date", date);

    try {
      // Send the payload to the server
      const response = await fetch(`${this.baseUrl}/video/uploads`, {
        method: "POST",
        body: payload,
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      // Check the response
      if (!response.ok) {
        // Handle error
        this.addLogFrontEnd("Failed to send video to the server", false); // Log the error
        console.error(
          "Failed to send video to the server:",
          response.status,
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

  public async startRecording(): Promise<boolean> {
    const url = `${this.baseUrl}/video/digicam/startVideo`;

    try {
      const response = await fetch(`${url}`);

      try {
        const data = await response.json();
        if (!response.ok) {
          console.error(
            "Failed to start recording:",
            response.status,
            response.statusText
          );
          this.addLogFrontEnd(
            "Failed to start recording: " + response.statusText,
            false
          );
          return false;
        }

        if (data.success) {
          console.log("Recording started successfully");
          this.addLogFrontEnd("Recording started successfully", true);
          return true;
        } else {
          console.error("Failed to start recording:", data.message);
          this.addLogFrontEnd(
            "Failed to start recording: " + data.message,
            false
          );
          return false;
        }
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        this.addLogFrontEnd("Error parsing JSON", false);
        return false;
      }
    } catch (error) {
      console.error("Error requesting access token:", error);
      this.addLogFrontEnd("Error requesting access token", false);
      return false;
    }
  }

  public async stopRecording(): Promise<boolean> {
    // Prepare the payload and send it to the server
    const url = `${this.baseUrl}/video/digicam/stopVideo`;

    try {
      // Send the payload to the server
      const response = await fetch(url);
      try {
        // Check the response
        const data = await response.json();

        if (!response.ok) {
          // Handle error
          console.error(
            "Failed to stop recording:",
            response.status,
            response.statusText
          );
          this.addLogFrontEnd(
            "Failed to stop recording: " + response.statusText,
            false
          );
          return false;
        }

        if (data.success) {
          // Handle success
          console.log("Recording stopped successfully");
          this.addLogFrontEnd("Recording stopped successfully", true);

          return true;
        } else {
          // Handle error
          console.error("Failed to stop recording:", data.message);
          this.addLogFrontEnd(
            "Failed to stop recording: " + data.message,
            false
          );

          return false;
        }
      } catch (jsonError) {
        // Handle error
        console.error("Error parsing JSON:", jsonError);
        this.addLogFrontEnd("Error parsing JSON", false);

        return false;
      }
    } catch (error) {
      // Handle error
      console.error("Error stopping recording:", error);
      this.addLogFrontEnd("Error stopping recording", false);

      return false;
    }
  }

  public async checkNewVideo(): Promise<boolean> {
    // Prepare the payload and send it to the server
    const url = `${this.baseUrl}/file/checkFile`;

    try {
      // Send the payload to the server
      const response = await fetch(url);
      try {
        // Check the response
        const data = await response.json();

        if (!response.ok) {
          // Handle error
          console.error(
            "Recording failed.",
            response.status,
            response.statusText
          );
          this.addLogFrontEnd(
            "Recording failed: " + response.statusText,
            false
          );
          return false;
        }

        if (data.success) {
          // Handle success
          console.log("Recording successfully");
          this.addLogFrontEnd("Recording successfully", true);

          return true;
        } else {
          // Handle error
          console.error("Recording failed: ", data.message);
          this.addLogFrontEnd("Recording failed: " + data.message, false);

          return false;
        }
      } catch (jsonError) {
        // Handle error
        console.error("Error parsing JSON:", jsonError);
        this.addLogFrontEnd("Error parsing JSON", false);

        return false;
      }
    } catch (error) {
      // Handle error
      console.error("Recording failed: ", error);
      this.addLogFrontEnd("Recording failed: ", false);

      return false;
    }
  }

  public async uploadVideo(crdId: string): Promise<boolean> {
    if (!crdId || crdId.trim() === "") {
      console.error("Invalid crdId provided:", crdId);
      this.addLogFrontEnd("Invalid crdId provided", false);
      return false;
    }

    const url = `${this.baseUrl}/file/uploadLastCreated`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          crdId,
        }),
      });

      try {
        const data = await response.json();

        if (!response.ok) {
          console.error(
            "Failed to upload video: ",
            response.status,
            response.statusText
          );
          this.addLogFrontEnd(
            "Failed to upload video: " + response.statusText,
            false
          );
          return false;
        }

        if (data.success) {
          console.log("Upload video successfully");
          this.addLogFrontEnd("Upload video successfully", true);

          return true;
        } else {
          console.error("Failed to upload video: ", data.message);
          this.addLogFrontEnd("Failed to upload video: " + data.message, false);

          return false;
        }
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        this.addLogFrontEnd("Error parsing JSON", false);

        return false;
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      this.addLogFrontEnd("Error uploading video", false);
      return false;
    }
  }

  public async makeBackUp(): Promise<boolean> {
    const url = `${this.baseUrl}/backup/make`;
    try {
      const response = await fetch(url);
      console.log("Response from the backend:", response);
      return true;
    } catch (error) {
      console.error("Error making backup:", error);
      this.addLogFrontEnd("Error making backup", false);
      return false;
    }
  }
}

export default BackendHandler;
