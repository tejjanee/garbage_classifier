import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import './UploadImage.css';

// Rename the component to start with an uppercase letter
const UploadImage= () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [prediction, setPrediction] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [webcamImage, setWebcamImage] = useState(null);
  const [webcamOn, setWebcamOn] = useState(true);
  const webcamRef = useRef(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const capture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setWebcamImage(imageSrc);
      setSelectedFile(null); // Clear file input if any
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const file = selectedFile || (webcamImage && dataURLToFile(webcamImage, 'webcam-image.jpg'));
    setWebcamImage(null);
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setPrediction(result.predicted_class);
        setImageURL(`http://localhost:5000${result.image_url}`);
      } else {
        setPrediction(`Error: ${result.error}`);
      }
    } catch (error) {
      setPrediction(`Error: ${error.message}`);
    }
  };

  const dataURLToFile = (dataURL, filename) => {
    const [header, data] = dataURL.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(data);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new File([new Uint8Array(array)], filename, { type: mime });
  };

  const toggleWebcam = () => {
    setWebcamOn(!webcamOn);
  };

  const clearAll = () => {
    setSelectedFile(null);
    setWebcamImage(null);
    setPrediction('');
    setImageURL('');
    if (webcamRef.current) {
      webcamRef.current.video.srcObject?.getTracks().forEach(track => track.stop());
    }
  };
  const handleWebcamPredict = () => {
    // Clear previous webcam image before capturing new one
    setWebcamImage(null);
    capture(); // Capture the latest image and set it for prediction
  };
  return (
    <div className="App">
      <h1>Garbage Classifier</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input type="file" onChange={handleFileChange} accept="image/*" />
          <button type="submit">Upload and Predict</button>
        </div>
        <div className="webcam-container">
          {webcamOn && (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={320}
                height={240}
              />
              <button type="button" onClick={capture}>Capture Photo</button>
              <button type="submit">Predict from Webcam</button>
            </>
          )}
          <button type="button" onClick={toggleWebcam}>
            {webcamOn ? 'Turn Off Webcam' : 'Turn On Webcam'}
          </button>
        </div>
        <button type="button" onClick={clearAll}>Clear</button>
      </form>
      {prediction && <h2>Prediction: {prediction}</h2>}
      {imageURL && <img src={imageURL} alt="Uploaded" />}
      {webcamImage && <img src={webcamImage} alt="Webcam" />}
    </div>
  );
}

export default UploadImage;
