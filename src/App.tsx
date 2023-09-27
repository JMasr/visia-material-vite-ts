import React, { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import { Container, Button, Stack, Typography, Box } from "@mui/material";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import "./App.css"; // Import a CSS file for styling

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(540); // 9 minutes in seconds
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      videoRef.current!.srcObject = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const videoUrl = URL.createObjectURL(blob);
        console.log("Recorded video URL:", videoUrl);
      };

      mediaRecorder.start();
      setIsRecording(true);
      mediaRecorderRef.current = mediaRecorder;

      // Start the countdown timer
      startTimeRef.current = performance.now();
      updateTimer();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);

    mediaRecorderRef.current?.addEventListener("stop", () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });

      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = "recorded-video.webm";

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      chunksRef.current = [];
    });

    cancelAnimationFrame(requestRef.current!);
  };

  const updateTimer = () => {
    const elapsed = performance.now() - startTimeRef.current!;
    const newCountdown = Math.max(0, 540 - Math.floor(elapsed / 1000));
    setCountdown(newCountdown);

    if (newCountdown > 0) {
      requestRef.current = requestAnimationFrame(updateTimer);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes < 10 ? "0" : ""}${minutes}:${
      remainingSeconds < 10 ? "0" : ""
    }${remainingSeconds}`;
  };

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
                Tiempo restante: {formatTime(countdown)}
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
}
