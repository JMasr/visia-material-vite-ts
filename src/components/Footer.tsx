import React from "react";
import { Box, Typography } from "@mui/material";

const Footer: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: "#2788ff",
        color: "white",
        textAlign: "center",
        py: 2,
        mt: "auto",
      }}
    >
      <Typography variant="body2">
        {`© ${new Date().getFullYear()} atlanTTic Research Center.`}
      </Typography>
    </Box>
  );
};

export default Footer;
