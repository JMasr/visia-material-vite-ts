import "../App.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackendHandler from "../api/backendHandler";

import Swal from "sweetalert2";

import React, { useEffect, useRef, useState } from "react";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import { Cameraswitch } from "@mui/icons-material";

import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import RedirectButton from "../components/RedirectBotton";

interface RecordWebCamProps {
  backendHandler: BackendHandler;
}

const RecordWebCam: React.FC<RecordWebCamProps> = ({ backendHandler }) => {
  // Define constants
  const RECORD_BUTTON_LABEL = "Grabar";
  const STOP_RECORDING_BUTTON_LABEL = "Detener Grabación";

  const COUNTDOWN_DURATION_SECONDS = 540; // 9 minutes in seconds

  // Video recording logic
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION_SECONDS);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Preview image URL
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Render the component
  const [crdId, setCrdId] = useState<string | null>(null);
  const [oviedoMetric, setOviedoMetric] = useState<number | null>(null);
  const [textFieldValue, setTextFieldValue] = useState<string | null>("");

  // WebCam logic
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const previewWebCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      videoRef.current!.srcObject = stream;
      streamRef.current = stream;
    } catch (error) {
      console.error("Error previewing webcam:", error);
    }
  };

  const startRecording = async () => {
    try {
      // Get the text fields
      const crdTextField = document.getElementById(
        "textField-crd"
      ) as HTMLInputElement;

      // Check if the text fields are empty
      if (crdTextField.value === "") {
        // Alert the user
        Swal.fire({
          title: "Alerta!",
          text: "Por favor, introduzca los datos de la sesión.",
          icon: "warning",
          confirmButtonText: "Vale",
        });

        // Reset the states
        setIsRecording(false);

        // Console log the event
        await backendHandler.addLogFrontEnd(
          "Recording started - Empty text fields",
          true
        );
        console.log("Empty text fields");
        return;
      } else {
        // All good, set states
        setCrdId(crdTextField.value);

        try {
          // Console log the event
          await backendHandler.addLogFrontEnd("Recording started", true);

          // Get the video stream
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
          const options = {
            mimeType: "video/x-matroska;codecs=avc1",
          };
          const mediaRecorder = new MediaRecorder(stream, options);
          await backendHandler.addLogFrontEnd(
            "MediaRecorder initialized",
            true
          );

          // Add event listener for dataavailable
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunksRef.current.push(event.data);
            }
          };
          // Add event listener for stop
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: "video/mp4" });
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
      }
    } catch (error) {
      await backendHandler.addLogFrontEnd("Recording started", false);
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    // Check if recording is in progress before sending the stop request
    if (isRecording) {
      // Console log the event
      console.log("Stop Recording button clicked");

      try {
        // Get the text fields
        const crdTextField = document.getElementById(
          "textField-crd"
        ) as HTMLInputElement;
        setCrdId(crdTextField.value);

        // Stop the recording
        mediaRecorderRef.current?.stop();
        setIsRecording(false);

        // Stop the video post-recording
        mediaRecorderRef.current?.addEventListener("stop", async () => {
          backendHandler.addLogFrontEnd("Video recording stopped", true);

          // Init the video Blob
          const blob = new Blob(chunksRef.current, { type: "video/mp4" });
          backendHandler.addLogFrontEnd("Video Blob created", true);

          // Send the video to the server
          const response = await backendHandler.sendVideoToServer(
            crdTextField.value,
            blob
          );
          if (response) {
            backendHandler.addLogFrontEnd("Video sent to the server", true);
            // Redirect to the next page
            window.location.href =
              "http://localhost/visiaq/preguntas/?crd=" +
              crdTextField.value +
              "&ov=" +
              oviedoMetric;
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

        // Reset the states
        setCountdown(0);
      }
    }
  };

  const updateTimer = () => {
    try {
      const intervalId = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current!;
        const newCountdown = Math.max(
          0,
          COUNTDOWN_DURATION_SECONDS - Math.floor(elapsed / 1000)
        );
        setCountdown(newCountdown);

        if (newCountdown === 0 || !isRecording) {
          // Countdown reached zero or recording stopped/interrupted
          clearInterval(intervalId);
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      console.error("Error updating timer:", error);
      // Handle error as needed
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
    const fetchData = async () => {
      try {
        // Fetch data from the backend
        const response_backend = await backendHandler.getRenderData(
          "/render/getRecordData"
        );

        if (typeof response_backend === "object" && response_backend !== null) {
          // Store the data fetched
          const response_crd_id = (response_backend as { crd_id: string })
            .crd_id;
          const response_oviedo_metric = (response_backend as { ov: number })
            .ov;

          console.log(
            "Data CRD_ID:",
            response_crd_id,
            "Data OVIEDO_METRIC:",
            response_oviedo_metric
          );

          // Use the callback form of state updater functions
          setCrdId(response_crd_id);
          setTextFieldValue(response_crd_id);
          setOviedoMetric(response_oviedo_metric);

          // Inform the user about the result of Oviedo metric
          if (
            response_crd_id !== null &&
            oviedoMetric !== null &&
            oviedoMetric <= 2
          ) {
            Swal.fire({
              title: "Test de Ovideo",
              html:
                "Resultado del Test de Oviedo: " +
                "<strong>" +
                oviedoMetric +
                "<strong>" +
                ".<br />Por favor, proceda a grabar la sesión.",
              icon: "success",
              timer: 10000,
              confirmButtonText: "Vale",
            });
          } else {
            Swal.fire({
              title: "Test de Ovideo",
              html:
                "Resultado del Test de Oviedo:" +
                oviedoMetric +
                "<br /> Por favor, anote al paciente " +
                "<strong>" +
                crdId +
                "<strong>.",
              icon: "warning",
              timer: 10000,
              confirmButtonText: "Vale",
            });
          }
        } else {
          // Handle error
          console.error("Failed to fetch RecordSession data");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [crdId, oviedoMetric]);

  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now();
      updateTimer();
    }
  }, [isRecording]);

  useEffect(() => {
    previewWebCam();
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
      <Header headerText="Visia - Grabaciones de sesiones." />
      <Container maxWidth="md" className="container">
        <div className="video-container">
          <video ref={videoRef} autoPlay playsInline muted className="video" />
        </div>

        <Stack direction="row" spacing={2} alignItems="center" marginTop={2}>
          <Button
            variant="outlined"
            startIcon={<RadioButtonCheckedIcon />}
            color={isRecording ? "error" : "primary"}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!textFieldValue}
          >
            {isRecording ? STOP_RECORDING_BUTTON_LABEL : RECORD_BUTTON_LABEL}
          </Button>

          <RedirectButton
            icon={<Cameraswitch />}
            textFieldValue={"Cámara Externa"}
            redirectUri="http://localhost:8080/"
          />

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

        {crdId !== null && (
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{ marginTop: 2 }}
          >
            <Box width="76%" hidden={isRecording}>
              <TextField
                required
                id="textField-crd"
                label="Identificador CRD"
                variant="outlined"
                value={textFieldValue}
                onChange={(e) => setTextFieldValue(e.target.value)}
                fullWidth
                helperText="Identificador único del CRD"
              />
            </Box>
          </Stack>
        )}
      </Container>
      <Footer />
    </Container>
  );
};

export default RecordWebCam;
