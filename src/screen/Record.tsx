import "../App.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackendHandler from "../api/backendHandler";
import ImageDisplay from "../components/ImageDisplay";
import ImageRecording from "../../public/static/image/recording_default.gif";
import ImageNotSignal from "../../public/static/image/not_signal_default.jpg";

import Swal from "sweetalert2";

import React, { useEffect, useRef, useState } from "react";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import VideocamIcon from "@mui/icons-material/Videocam";

import {
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { s } from "vitest/dist/reporters-5f784f42";

interface RecordProps {
  backendHandler: BackendHandler;
}

const Record: React.FC<RecordProps> = ({ backendHandler }) => {
  // Define constants
  const RECORD_BUTTON_LABEL = "Grabar";
  const STOP_RECORDING_BUTTON_LABEL = "Detener Grabación";
  const PREVIEW_BUTTON_LABEL = "Previsualizar";

  const COUNTDOWN_DURATION_SECONDS = 540; // 9 minutes in seconds

  // Video recording logic
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION_SECONDS);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Preview image URL
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Render the component
  const [crdId, setCrdId] = useState<string | null>(null);
  const [oviedoMetric, setOviedoMetric] = useState<number | null>(null);

  // URL for redirecting after video has been uploaded
  const REDIRECT_URL =
    "http://localhost/visiaq/preguntas/?crd=" + crdId + "&ov=" + oviedoMetric;

  const handlePreview = async () => {
    console.log("Preview button clicked");
    setIsPreviewing(true);
    try {
      // Set image to recording image
      setPreviewImage(ImageRecording);

      // Call backendHandler.previewFunction() to get the preview image URL
      const imageSrc = await backendHandler.getPreviewPicture();

      if (imageSrc) {
        // Handle the case where fetching the preview succeeded
        setPreviewImage(imageSrc);
      } else {
        // Handle the case where fetching the preview failed
        console.error("Failed to fetch preview image");
        Swal.fire({
          title: "Alerta!",
          text: "No se ha podido obtener la previsualización. Por favor, revise si la cámara está encendida y con baterías.",
          icon: "error",
          confirmButtonText: "Vale",
        });

        // Reset the states
        setPreviewImage(ImageNotSignal);
      }
    } catch (error) {
      // Handle other errors
      console.error("Error handling preview:", error);
      alert("An error occurred while handling the preview");
      Swal.fire({
        title: "Alerta!",
        text: "No se ha podido obtener la previsualización. Por favor, revise si la cámara está encendida y con baterías.",
        icon: "error",
        confirmButtonText: "Vale",
      });

      // Reset the states
      setPreviewImage(ImageNotSignal);
    } finally {
      setIsPreviewing(false);
    }
  };

  const startRecording = async () => {
    console.log("Start Recording button clicked");

    try {
      // Get the CRD-ID text field
      const crdTextField = document.getElementById(
        "textField-crd"
      ) as HTMLInputElement;

      // Check if the text field is empty
      if (crdTextField.value === "") {
        // Alert the user
        Swal.fire({
          title: "Alerta!",
          text: "Por favor, introduzca el CRD-ID de la sesión.",
          icon: "warning",
          confirmButtonText: "Vale",
        });

        // Reset the states
        setIsRecording(false);

        // Log the event
        await backendHandler.addLogFrontEnd(
          "Recording started - Empty text fields",
          true
        );
        console.log("Empty text fields");
        return;
      } else {
        console.log("CRD-ID:", crdTextField.value);
        // Set image to recording image
        setIsRecording(true);
        setPreviewImage(ImageRecording);

        // Send a request to the backend to start recording
        const response = await backendHandler.startRecording();

        if (response) {
          // Backend successfully started recording
          setCountdown(COUNTDOWN_DURATION_SECONDS);
          startTimeRef.current = Date.now();
          requestRef.current = requestAnimationFrame(updateTimer);

          // Log the event
          await backendHandler.addLogFrontEnd("Recording started", true);
          console.log("Recording started");
        } else {
          // Backend failed to start recording, handle error
          console.error("Backend failed to start recording:");
          await backendHandler.addLogFrontEnd(
            "Recording started - Backend error",
            false
          );

          // Alert the user
          Swal.fire({
            title: "Alerta!",
            text: "La grabación no se ha podido iniciar. Por favor, revise si la cámara está encendida y con baterías.",
            icon: "error",
            confirmButtonText: "Vale",
          });

          // Reset the states
          setIsRecording(false);
          setPreviewImage(ImageNotSignal);
        }
      }
    } catch (error) {
      await backendHandler.addLogFrontEnd("Recording started", false);
      console.error("Error starting recording:", error);

      // Reset the states
      setPreviewImage(ImageNotSignal);
    }
  };

  const stopRecording = async () => {
    // Check if recording is in progress before sending the stop request
    if (isRecording) {
      console.log("Stop Recording button clicked");

      // Reset the states
      setIsRecording(false);
      setIsPreviewing(true);
      setCountdown(0);
      cancelAnimationFrame(requestRef.current!);

      try {
        const crdTextField = document.getElementById(
          "textField-crd"
        ) as HTMLInputElement;

        // Send a request to the backend to stop recording
        const response = await backendHandler.stopRecording();

        if (response) {
          // Log the event
          console.log("Recording stopped");

          // Check if there is a new video file on the backend
          const responseNewVideo = await backendHandler.checkNewVideo();

          if (responseNewVideo) {
            // Backend successfully stopped recording
            console.log("New video file found");

            // Inform the user that the recording has stopped. Wait for the video to be processed
            Swal.fire({
              title: "Hurra!",
              text: "La grabación se ha detenido correctamente. Espere mientras se procesa el video.",
              icon: "success",
              confirmButtonText: "Vale",
              timer: 10000,
            });

            // Upload the video file to the MongoDB database
            const responseUploadVideo = await backendHandler.uploadVideo(
              crdTextField.value
            );

            if (responseUploadVideo) {
              // Backend successfully uploaded video
              console.log("Video uploaded");

              // Inform the user that the video has been uploaded
              Swal.fire({
                title: "Hurra!",
                text: "El video se ha subido correctamente.",
                icon: "success",
                confirmButtonText: "Vale",
                timer: 10000,
              });

              // Request the backend to backup the video file
              const responseBackupVideo = await backendHandler.makeBackUp();

              // Redirect after video has been uploaded
              window.location.href = REDIRECT_URL;
            } else {
              // Backend failed to upload video, handle error
              console.error("Backend failed to upload video:");
              await backendHandler.addLogFrontEnd(
                "Recording stopped - Backend error",
                false
              );

              // Inform the user that the video has not been uploaded
              Swal.fire({
                title: "Alerta!",
                text: "El video no se ha podido subir. Por favor, intentelo nuevamente.",
                icon: "error",
                confirmButtonText: "Vale",
              });
            }
          } else {
            // Backend failed to stop recording, handle error
            console.error("Backend failed to stop recording:");
            await backendHandler.addLogFrontEnd(
              "Recording stopped - Backend error",
              false
            );

            // Inform the user that the recording has not been stopped
            Swal.fire({
              title: "Alerta!",
              text: "La grabación ha fallado. Por favor, intentelo nuevamente.",
              icon: "error",
              confirmButtonText: "Vale",
            });
          }
        } else {
          // Backend failed to stop recording, handle error
          console.error("Backend failed to stop recording:");
          await backendHandler.addLogFrontEnd(
            "Recording stopped - Backend error",
            false
          );

          // Inform the user that the recording has not been stopped
          Swal.fire({
            title: "Alerta!",
            text: "La grabación no se ha podido detener. Por favor, intentelo nuevamente.",
            icon: "error",
            confirmButtonText: "Vale",
          });
        }
      } catch (error) {
        await backendHandler.addLogFrontEnd("Recording stopped", false);
        console.error("Error stopping recording:", error);
      } finally {
        // Reset preview states
        setIsPreviewing(false);
        setPreviewImage(ImageNotSignal);
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
    // Update the timer when isRecording changes
    if (isRecording) {
      startTimeRef.current = Date.now();
      updateTimer();
    }
  }, [isRecording]);

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
        <ImageDisplay imageUrl={previewImage} />

        <Stack direction="row" spacing={2} alignItems="center" marginTop={2}>
          <Button
            variant="outlined"
            startIcon={<VideocamIcon />}
            color="secondary"
            onClick={handlePreview}
            disabled={isRecording || isPreviewing}
          >
            {PREVIEW_BUTTON_LABEL}
          </Button>

          <Button
            variant="outlined"
            startIcon={<RadioButtonCheckedIcon />}
            color={isRecording ? "error" : "primary"}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isPreviewing || !crdId}
          >
            {isRecording ? STOP_RECORDING_BUTTON_LABEL : RECORD_BUTTON_LABEL}
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

        {crdId !== null && (
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{ marginTop: 2 }}
          >
            <Box width="76%" hidden={isRecording || isPreviewing}>
              <TextField
                required
                id="textField-crd"
                label="Identificador CRD"
                variant="outlined"
                value={crdId}
                onChange={(e: {
                  target: { value: React.SetStateAction<string | null> };
                }) => setCrdId(e.target.value)}
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

export default Record;
