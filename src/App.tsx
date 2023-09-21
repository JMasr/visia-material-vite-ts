import React, { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import { Container, Button, Stack } from "@mui/material";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import "./App.css"; // Import a CSS file for styling

export default function App() {
  const [isRecording, setIsRecording] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Run only once on component mount
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
      // Cleanup: stop the stream when the component unmounts
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
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);

    // Wait for the mediaRecorder to stop and generate the download link
    mediaRecorderRef.current?.addEventListener("stop", () => {
      // Merge all recorded chunks into a single Blob
      const blob = new Blob(chunksRef.current, { type: "video/webm" });

      // Create a download link
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = "recorded-video.webm";

      // Append the link to the body
      document.body.appendChild(downloadLink);

      // Trigger the download
      downloadLink.click();

      // Clean up the temporary download link
      document.body.removeChild(downloadLink);

      // Reset the chunks for the next recording
      chunksRef.current = [];
    });
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
            color="error"
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? "Detener Grabación" : "Grabar"}
          </Button>
        </Stack>
      </Container>
    </Container>
  );
}
