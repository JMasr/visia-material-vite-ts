import React, { useState, useEffect, useRef } from "react";
import { Container } from "@mui/material";
import Swal from "sweetalert2";

import Header from "../components/Header";
import Footer from "../components/Footer";
import BackendHandler from "../api/backendHandler";
import ImageDisplay from "../components/ImageDisplay";
import backupImage from "../../public/static/image/backup.gif";
import { c } from "vitest/dist/reporters-5f784f42";

interface BackendHandlerProps {
  backendHandler: BackendHandler;
}

const Backup: React.FC<BackendHandlerProps> = ({ backendHandler }) => {
  const isMounted = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAlertClosed, setIsAlertClosed] = useState(false);

  const REDIRECTION_URL = "http://localhost/visiaq/";

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;

      const makeBackUp = async () => {
        try {
          const isBackUpReady = await backendHandler.makeBackUp();
          console.log("Success fetching data:", isBackUpReady);

          if (isBackUpReady) {
            setIsLoading(false);
            Swal.fire({
              title: "Copia de seguridad realizada.",
              text: "Se ha realizado una copia de seguridad de la base de datos.",
              icon: "success",
              confirmButtonText: "Aceptar",
            }).then(function () {
              window.location.href = "http://localhost/visiaq/";
            });
          } else {
            setIsLoading(true);
            Swal.fire({
              title: "Error al realizar la copia de seguridad.",
              text: "No se ha podido realizar una copia de seguridad de la base de datos.",
              icon: "error",
              timer: 30000,
              confirmButtonText: "Aceptar",
            }).then(function () {
              window.location.href = "http://localhost/visiaq/";
            });
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          // Redirect to the next page
          //window.location.href = "http://localhost/visiaq/";
        }
      };

      makeBackUp();
    }
  }, [backendHandler]);

  return (
    <Container
      maxWidth="xl"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Header headerText="Visia - Copias de seguridad." />

      <Container maxWidth="md" className="container">
        <ImageDisplay imageUrl={isLoading ? backupImage : null} />
      </Container>

      <Footer />
    </Container>
  );
};

export default Backup;
function timeout(arg0: number) {
  return new Promise((res) => setTimeout(res, arg0));
}
