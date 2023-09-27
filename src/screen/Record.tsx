import { Box, Button, Container, Stack, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import Header from "../components/Header";
import { logEvent } from "../api/backendLog";

const Record = () => {
  const countdownDurationSeconds = 540; // 9 minutes in seconds
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(countdownDurationSeconds);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      // Console log the event
      await logEvent("Recording started", true);

      // Get the patient ID from the URL
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      videoRef.current!.srcObject = stream;
      await logEvent("Camera and microphone access granted", true);

      // Initialize the MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });
      await logEvent("MediaRecorder initialized", true);

      // Add event listener for dataavailable
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      // Add event listener for stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const videoUrl = URL.createObjectURL(blob);
        console.log("Recorded video URL:", videoUrl);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      mediaRecorderRef.current = mediaRecorder;

      // Start the countdown timer
      startTimeRef.current = performance.now();
      updateTimer();
    } catch (error) {
      await logEvent("Recording started", false);
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    // Console log the event
    logEvent("Recording stopped", true);

    try {
      // Stop the recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);

      // Stop the video post-recording
      mediaRecorderRef.current?.addEventListener("stop", () => {
        logEvent("Video recording stopped", true);

        // Init the video Blob
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        logEvent("Video Blob created", true);

        // Create a download link
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = "recorded-video.webm";
        logEvent("Download link created", true);

        // Click the download link
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        logEvent("Download link clicked", true);

        // Send the video to the server
        const patientId = "patient_test";
        const medId = "med_test";
        sendVideoToServer(blob, patientId, medId);

        // Empty the chunks array
        chunksRef.current = [];
        logEvent("Chunks array emptied", true);
      });

      cancelAnimationFrame(requestRef.current!);
    } catch (error) {
      logEvent("Recording stopped", false);
      console.error("Error stopping recording:", error);
    }
  };

  const updateTimer = () => {
    const elapsed = performance.now() - startTimeRef.current!;
    const newCountdown = Math.max(
      0,
      countdownDurationSeconds - Math.floor(elapsed / 1000)
    );
    setCountdown(newCountdown);

    if (newCountdown > 0) {
      requestRef.current = requestAnimationFrame(updateTimer);
    } else {
      stopRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes < 10 ? "0" : ""}${minutes}:${
      remainingSeconds < 10 ? "0" : ""
    }${remainingSeconds}`;
  };

  const sendVideoToServer = async (
    videoBlob: Blob,
    patientId: string,
    medId: string
  ) => {
    // Prepare the payload and send it to the server
    const date = new Date().toLocaleString();
    const videoName = "sesion_" + patientId + "_" + date + "_.webm";

    const payload = new FormData();
    payload.append("patient_id", patientId);
    payload.append("med_id", medId);
    payload.append("video", videoBlob, videoName);
    payload.append("date", date);

    // try {
    //   const response = await fetch("http://localhost:5000/sendVideo", {
    //     method: "POST",
    //     body: payload,
    //   });

    //   if (!response.ok) {
    //     throw new Error("Failed to send video to the server");
    //   }

    //   const data = await response.json();
    //   console.log("Video sent successfully:", data);
    //   logEvent("Video sent to server", true);
    // } catch (error) {
    //   console.error("Error sending video to the server:", error);
    //   logEvent("Video sent to server", false);
    // }
  };

  useEffect(() => {
    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
      } catch (error) {
        console.error("Error starting stream:", error);
      }
    };

    startStream();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <Container maxWidth="xl">
      <Header />
      <Container maxWidth="sm" className="container">
        <div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="videoElement"
          />
        </div>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<RadioButtonCheckedIcon />}
            color={isRecording ? "error" : "primary"}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? "Detener Grabación" : "Grabar"}
          </Button>
          {isRecording && (
            <Box display="flex" alignItems="center" marginLeft={2}>
              <Typography variant="body1">
                Tiempo: {formatTime(countdown)}
              </Typography>
              {countdown === 0 && (
                <Typography variant="body1">Recording ended</Typography>
              )}
            </Box>
          )}
        </Stack>
      </Container>
    </Container>
  );
};

export default Record;
