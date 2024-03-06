import React, { useEffect, useRef, useState } from "react";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import { Button } from "@mui/material";


interface RedirectButtonProps {
    icon: React.ReactNode;
    redirectUri: string;
    textFieldValue: string;        
}

const RedirectButton: React.FC<RedirectButtonProps> = ({ icon, textFieldValue, redirectUri }) => {
    const handlePress = () => {
        window.location.href = redirectUri;
    };

    return (
        <Button
            variant="outlined"
            startIcon={icon}
            onClick={handlePress}            
          >
            {textFieldValue}
          </Button>
    );
};

export default RedirectButton;