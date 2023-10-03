import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
  TableFooter,
  TableContainer,
  Table,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import Header from "../components/Header";
import "../App.css";
import BackendHandler from "../api/backendHandler";
import Swal from "sweetalert2";
import Footer from "../components/Footer";

interface RecordProps {
  backendHandler: BackendHandler;
}

const Record: React.FC<RecordProps> = ({ backendHandler }) => {
  // Video recording logic
  const countdownDurationSeconds = 540; // 9 minutes in seconds
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(countdownDurationSeconds);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Render the component
  const [crdId, setCrdId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);

  const startRecording = async () => {
    // Get the text fields
    const crdTextField = document.getElementById(
      "textField-crd"
    ) as HTMLInputElement;
    const patientTextField = document.getElementById(
      "textField-patient"
    ) as HTMLInputElement;
    // Check if the text fields are empty
    if (crdTextField.value === "" || patientTextField.value === "") {
      // Alert the user
      Swal.fire({
        title: "Alerta!",
        text: "Por favor, introduzca los datos de la sesión.",
        icon: "warning",
        confirmButtonText: "Vale",
      });

      // Console log the event
      await backendHandler.addLogFrontEnd(
        "Recording started - Empty text fields",
        true
      );
      console.log("Empty text fields");
      return;
    }

    // All good, start recording
    try {
      // Console log the event
      await backendHandler.addLogFrontEnd("Recording started", true);

      // Get the patient ID from the URL
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      videoRef.current!.srcObject = stream;
      await backendHandler.addLogFrontEnd(
        "Camera and microphone access granted",
        true
      );

      // Initialize the MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });
      await backendHandler.addLogFrontEnd("MediaRecorder initialized", true);

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
      await backendHandler.addLogFrontEnd("Recording started", false);
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    // Console log the event
    backendHandler.addLogFrontEnd("Recording stopped", true);

    try {
      // Stop the recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);

      // Stop the video post-recording
      mediaRecorderRef.current?.addEventListener("stop", async () => {
        backendHandler.addLogFrontEnd("Video recording stopped", true);

        // Init the video Blob
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        backendHandler.addLogFrontEnd("Video Blob created", true);

        // Create a download link
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = "recorded-video.webm";
        backendHandler.addLogFrontEnd("Download link created", true);

        // Click the download link
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        backendHandler.addLogFrontEnd("Download link clicked", true);

        // Send the video to the server
        const response = await backendHandler.sendVideoToServer(
          crdId!,
          patientId!,
          blob
        );
        if (response) {
          backendHandler.addLogFrontEnd("Video sent to the server", true);
        }
      });
    } catch (error) {
      chunksRef.current = [];
      backendHandler.addLogFrontEnd("Recording fail!", false);
      console.error("Error during recording:", error);
    } finally {
      // Stop the stream
      cancelAnimationFrame(requestRef.current!);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Empty the chunks array
      chunksRef.current = [];
      backendHandler.addLogFrontEnd("Chunks array emptied", true);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data from the backend
        const response_backend = await backendHandler.getRenderData(
          "/getRecordData"
        );

        if (response_backend === null) {
          // Handle error
          await backendHandler.addLogFrontEnd(
            "Data fetched for RecordSession",
            false
          );
          console.error("Failed to fetch RecordSession data");

          // Set default values
          setCrdId("Por favor, introduzca el CRD-id");
          setPatientId("Por favor, introduzca el Patient-id");
        }

        // Handle success
        setCrdId(response_backend.crd_id);
        setPatientId(response_backend.patient_id);

        console.log(
          "Data fetched for RecordSession successfully:",
          response_backend
        );
        await backendHandler.addLogFrontEnd(
          "Data fetched for RecordSession: " +
            response_backend.crd_id +
            " " +
            response_backend.patient_id,
          true
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        await backendHandler.addLogFrontEnd(
          "Data fetched for RecordSession - Error RXTX",
          false
        );
      }
    };

    fetchData();
  }, []);

  return (
    <Container
      maxWidth="xl"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh", // Ensure the container takes full height of the viewport
      }}
    >
      <Header />
      <Container maxWidth="sm" className="container">
        <div>
          <video ref={videoRef} autoPlay playsInline muted className="video" />
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

        {crdId !== null &&
          patientId !== null && ( // Only render when data is available
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
              sx={{ marginTop: 2 }}
            >
              <Box width="48%">
                <TextField
                  required
                  id="textField-crd"
                  label="CRD-id"
                  variant="outlined"
                  defaultValue={crdId}
                  fullWidth
                  helperText="Identificador único del CRD"
                />
              </Box>
              <Box width="48%">
                <TextField
                  required
                  id="textField-patient"
                  label="Patient-id"
                  variant="outlined"
                  defaultValue={patientId}
                  fullWidth
                  helperText="Identificador único del paciente"
                />
              </Box>
            </Stack>
          )}
      </Container>
      <Footer />
    </Container>
  );
};

export default Record;
