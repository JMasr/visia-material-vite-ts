import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { colors } from "@mui/material";

const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar style={{ backgroundColor: "#2788ff" }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Visia - Grabación de sesiones.
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
