import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

interface HeaderProps {
  headerText?: string;
}

interface HeaderProps {
  headerText?: string;
}

const Header: React.FC<HeaderProps> = ({ headerText }) => {
  return (
    <AppBar position="static">
      <Toolbar style={{ backgroundColor: "#2788ff" }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {headerText}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
