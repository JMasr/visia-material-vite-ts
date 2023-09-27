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

  public async logEvent(message: string, success: boolean): Promise<void> {
    try {
      const date = new Date().toLocaleString();
      await this.makeBasicRequest<void>("/addLog", "POST", {
        message,
        success,
        date,
      });
      console.log("Event logged successfully.");
    } catch (error) {
      console.error("Failed to log event:", error);
      throw error;
    }
  }
}

export default BackendHandler;
