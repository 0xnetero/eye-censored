import React, { useState, useRef, useEffect } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import './App.css';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detector, setDetector] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Initialize the face detector model
  useEffect(() => {
    const loadModel = async () => {
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig = {
        runtime: 'tfjs',
        refineLandmarks: true,
        maxFaces: 1
      };
      const faceDetector = await faceLandmarksDetection.createDetector(
        model,
        detectorConfig
      );
      setDetector(faceDetector);
    };
    loadModel();
  }, []);

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Process the image and detect eyes
  const processImage = async () => {
    if (!selectedImage || !detector) return;

    setIsProcessing(true);

    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw original image on canvas
    ctx.drawImage(img, 0, 0, img.width, img.height);

    // Detect face landmarks
    const faces = await detector.estimateFaces(img);

    if (faces.length > 0) {
      const face = faces[0];
      const keypoints = face.keypoints;

      // Get eye landmark indices for MediaPipe FaceMesh
      const rightEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133];
      const leftEyeIndices = [263, 249, 390, 373, 374, 380, 381, 382, 362];

      // Draw single seamless black bar across both eyes
      drawEyeCensor(ctx, keypoints, rightEyeIndices, leftEyeIndices);
    }

    setIsProcessing(false);
  };

  // Draw a single seamless censored black bar over both eyes
  const drawEyeCensor = (ctx, keypoints, rightEyeIndices, leftEyeIndices) => {
    // Get all eye points
    const rightEyePoints = rightEyeIndices.map(idx => keypoints[idx]);
    const leftEyePoints = leftEyeIndices.map(idx => keypoints[idx]);

    // Calculate bounding box for each eye
    const rightXCoords = rightEyePoints.map(p => p.x);
    const rightYCoords = rightEyePoints.map(p => p.y);
    const leftXCoords = leftEyePoints.map(p => p.x);
    const leftYCoords = leftEyePoints.map(p => p.y);

    // Get centers of each eye
    const rightEyeCenter = {
      x: (Math.min(...rightXCoords) + Math.max(...rightXCoords)) / 2,
      y: (Math.min(...rightYCoords) + Math.max(...rightYCoords)) / 2
    };

    const leftEyeCenter = {
      x: (Math.min(...leftXCoords) + Math.max(...leftXCoords)) / 2,
      y: (Math.min(...leftYCoords) + Math.max(...leftYCoords)) / 2
    };

    // Calculate angle between eyes
    const angle = Math.atan2(
      leftEyeCenter.y - rightEyeCenter.y,
      leftEyeCenter.x - rightEyeCenter.x
    );

    // Calculate dimensions for the bar
    const allXCoords = [...rightXCoords, ...leftXCoords];
    const allYCoords = [...rightYCoords, ...leftYCoords];

    const minX = Math.min(...allXCoords);
    const maxX = Math.max(...allXCoords);
    const minY = Math.min(...allYCoords);
    const maxY = Math.max(...allYCoords);

    // Bar dimensions
    const barWidth = maxX - minX + 40; // Extra width for padding
    const barHeight = Math.max(
      Math.max(...rightYCoords) - Math.min(...rightYCoords),
      Math.max(...leftYCoords) - Math.min(...leftYCoords)
    ) + 20; // Padding

    // Center point for the bar
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Save context state
    ctx.save();

    // Move to center point and rotate
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    // Draw black rectangle centered at origin
    ctx.fillStyle = 'black';
    ctx.fillRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight);

    // Restore context state
    ctx.restore();
  };

  // Download the censored image
  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas to data URL
    const dataURL = canvas.toDataURL('image/png');

    // Create a temporary link element
    const link = document.createElement('a');
    link.download = 'censored-image.png';
    link.href = dataURL;

    // Trigger download
    link.click();
  };

  const zcashAddress = 'u18xrncaltp2un23jc4gxtn5n6hvv0vgfghyh9s2xtwzqnh820hfv2edfasnmn74fx8a3a3akvr4l04hw5lyjlzc5ws4clhh9mf7q90vqazpc58ln5mnatn9n6zathwxj2xcahmxwukrvvweypq5nk8kjvr595fxflqm6mjyuqjvttacgx';

  const handleCopy = () => {
    navigator.clipboard.writeText(zcashAddress).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    });
  };

  const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M4 1.5H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-11a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h1v-1z" />
      <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zM9 1.5H7v1h2v-1z" />
    </svg>
  );

  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
    </svg>
  );


  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <h1>Eye Censor</h1>
          <p>Privacy for your avatar. Unstoppable private money.</p>
        </div>

        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            id="file-input"
          />
          <label htmlFor="file-input" className="upload-button">
            Choose Image
          </label>
        </div>

        {selectedImage && (
          <div className="image-section">
            <img
              ref={imageRef}
              src={selectedImage}
              alt="Selected"
              style={{ display: 'none' }}
              onLoad={processImage}
            />

            <canvas ref={canvasRef} className="output-canvas" />

            <div className="button-group">
              <button
                onClick={processImage}
                disabled={isProcessing}
                className="process-button"
              >
                {isProcessing ? 'Processing...' : 'Re-process Image'}
              </button>

              <button
                onClick={downloadImage}
                disabled={isProcessing}
                className="download-button"
              >
                Download Image
              </button>
            </div>
          </div>
        )}

        {!detector && (
          <div className="loading">Loading face detection model...</div>
        )}

        <div className="donation-section">
          <p>
            <img
              src="https://s2.coinmarketcap.com/static/img/coins/64x64/1437.png"
              alt="Zcash icon"
              className="zcash-icon"
            />
            Support with $ZEC:
          </p>
          <div className="address-container">
            <span className="address-text">
              {`${zcashAddress.substring(0, 10)}...${zcashAddress.substring(zcashAddress.length - 10)}`}
            </span>
            <button onClick={handleCopy} className="copy-button" title="Copy address">
              {isCopied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
          {isCopied && <span className="copy-feedback">Copied to clipboard!</span>}
        </div>

      </div>
    </div>
  );
}

export default App;
