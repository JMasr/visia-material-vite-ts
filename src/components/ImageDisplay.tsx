import React from "react";
import ImageNoSignal from "../../public/static/image/not_signal_default.jpg";

interface ImageDisplayProps {
  imageUrl: string | null;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageUrl }) => {
  const imageStyle = {
    maxWidth: "100%", // Adjust the maximum width as needed
    height: "auto", // Maintain the aspect ratio
    display: "block", // Remove extra space below the image
  };

  if (!imageUrl) {
    // Use a default image when imageUrl is null
    return <img src={ImageNoSignal} alt="Default" style={imageStyle} />;
  }

  return <img src={imageUrl} alt="Preview" style={imageStyle} />;
};

export default ImageDisplay;
