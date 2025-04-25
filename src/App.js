// Import the main CSS file for styling the App component
import './App.css';

// Import necessary React features
import React, { useRef, useEffect, useState } from 'react';

// Import TensorFlow.js core
// import * as tf from '@tensorflow/tfjs';

// Import the handpose model (detects hand and fingers)
import * as handpose from '@tensorflow-models/handpose';

// Import webcam component for real-time video stream
import Webcam from 'react-webcam';

// Import a custom utility function to draw hand landmarks
import { drawHand } from './utilities';

// Import fingerpose library to detect gestures
import * as fp from "fingerpose";

// Import images that represent gestures
import victory from "./victory.png";
import thumbs_up from "./thumbs_up.png";

// Main functional component of the app
function App() {
  // Create reference to the webcam DOM element
  const webcamRef = useRef(null);

  // Create reference to the canvas DOM element
  const canvasRef = useRef(null);

  // React state to hold the current detected emoji/gesture name
  const [emoji, setEmoji] = useState(null);

  // Map emojis (gesture names) to corresponding images
  const images = { thumbs_up: thumbs_up, victory: victory };

  // useEffect hook to run code once when the component mounts
  useEffect(() => {
    // Async function to load handpose model and start detection loop
    const runHandpose = async () => {
      const net = await handpose.load(); // Load the handpose model
      console.log("Handpose model loaded");

      // Set interval to run the detect function every 100ms
      setInterval(() => {
        detect(net);
      }, 100);
    };

    // Call the function to start detection
    runHandpose();
  }, []); // Empty dependency array means run once on mount

  // Function to detect hands and recognize gestures
  const detect = async (net) => {
    // Check if webcam is available and video stream is ready
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;

      // Get video dimensions
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Set webcam video dimensions
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas dimensions same as webcam
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Detect hand using the model
      const hand = await net.estimateHands(video);

      // If hand is detected
      if (hand.length > 0) {
        // Create gesture estimator with defined gestures
        const GE = new fp.GestureEstimator([
          fp.Gestures.VictoryGesture,
          fp.Gestures.ThumbsUpGesture,
        ]);

        // Estimate gesture from hand landmarks (8 - prediction threshold)
        const gesture = await GE.estimate(hand[0].landmarks, 8);

        // If gestures are found
        if (gesture.gestures && gesture.gestures.length > 0) {
          // Map confidence values
          const confidence = gesture.gestures.map(
            (prediction) => prediction.confidence
          );

          // Get index of highest confidence prediction
          const maxConfidence = confidence.indexOf(
            Math.max.apply(null, confidence)
          );

          const prediction = gesture.gestures[maxConfidence];

          // If a prediction with name is found, set emoji state
          if (prediction && prediction.name) {
            setEmoji(prediction.name);
          }
        }
      }

      // Get canvas context and draw the hand landmarks
      const ctx = canvasRef.current.getContext("2d");
      drawHand(hand, ctx);
    }
  };

  // JSX - Render the webcam, canvas, and emoji if detected
  return (
    <div className="App">
      <header className="App-header">
        {/* Webcam video stream */}
        <Webcam
          ref={webcamRef}
          audio={false}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: 640,
            height: 480,
          }}
        />

        {/* Canvas to draw hand landmarks */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: 640,
            height: 480,
          }}
        />

        {/* Show emoji image if a gesture is recognized */}
        {emoji !== null ? (
          <img
            src={images[emoji]}
            alt="emoji"
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 400,
              bottom: 500,
              right: 0,
              textAlign: "center",
              height: 100,
            }}
          />
        ) : (
          "" // Show nothing if no emoji
        )}
      </header>
    </div>
  );
}

// Export the App component to be used in index.js
export default App;
