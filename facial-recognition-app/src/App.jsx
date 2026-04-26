import React, { useRef, useState, useEffect } from "react";

const API_URL = "https://h3v6z64lxd.execute-api.eu-west-1.amazonaws.com/dev/upload";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const [mode, setMode] = useState("upload");
  const [status, setStatus] = useState("");
  const [file, setFile] = useState(null);

  // ✅ ADDED (timestamp state)
  const [timestamp, setTimestamp] = useState("");

  // 🔥 Auto start/stop camera
  useEffect(() => {
    if (mode === "snapshot" || mode === "live") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [mode]);

  // 🔥 Live loop
  useEffect(() => {
    if (mode === "live") {
      intervalRef.current = setInterval(() => {
        captureAndSend();
      }, 1500);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [mode]);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndSend = async () => {
    const video = videoRef.current;
    if (!video) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;

    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const base64 = tempCanvas
      .toDataURL("image/jpeg")
      .replace(/^data:image\/jpeg;base64,/, "");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 })
      });

      const data = await res.json();
      setStatus(data.status);

      // ✅ ADDED (timestamp safely)
      if (data.timestamp) {
        setTimestamp(data.timestamp);
      }

      drawBox(data.box);

      if (data.status === "Failure") {
        console.log("Unknown face detected");
      }

    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 FINAL FIXED DRAW FUNCTION (NO OFFSET)
  const drawBox = (box) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video || !box) return;

    const ctx = canvas.getContext("2d");

    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isMirrored = true;

    const left = isMirrored
      ? (1 - box.Left - box.Width) * displayWidth
      : box.Left * displayWidth;

    const top = box.Top * displayHeight;
    const width = box.Width * displayWidth;
    const height = box.Height * displayHeight;

    ctx.strokeStyle = "lime";
    ctx.lineWidth = 3;

    ctx.strokeRect(left, top, width, height);
  };

  const handleUpload = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 })
      });

      const data = await res.json();
      setStatus(data.status);

      // ✅ ADDED (timestamp safely)
      if (data.timestamp) {
        setTimestamp(data.timestamp);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Facial Recognition System</h2>

      {/* STATUS */}
      {status && <p style={{ marginBottom: "10px" }}>Status: {status}</p>}

      {/* ✅ TIMESTAMP DISPLAY */}
      {timestamp && (
        <p style={{ color: "black" }}>
          Time: {new Date(timestamp).toLocaleString()}
        </p>
      )}

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br /><br />

      <button onClick={handleUpload}>Upload</button>

      <button onClick={() => setMode("snapshot")}>Snapshot</button>
      <button onClick={() => setMode("live")}>Live</button>

      <br /><br />

      {/* UPLOAD */}
      {mode === "upload" && (
        <div>
          {file && (
            <div style={{ marginTop: "10px" }}>
              <img
                src={URL.createObjectURL(file)}
                alt="preview"
                style={{ maxWidth: "300px", borderRadius: "8px" }}
              />
            </div>
          )}
          <br /><br />
        </div>
      )}

      {/* CAMERA */}
      {(mode === "snapshot" || mode === "live") && (
        <div style={{ position: "relative", display: "inline-block" }}>
          <video
            ref={videoRef}
            autoPlay
            style={{
              width: "400px",
              transform: "scaleX(-1)"
            }}
          />

          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0
            }}
          />
        </div>
      )}

      <br /><br />

      {mode === "snapshot" && (
        <button onClick={captureAndSend}>Capture</button>
      )}
    </div>
  );
}

export default App;