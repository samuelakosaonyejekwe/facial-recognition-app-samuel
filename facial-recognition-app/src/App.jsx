import { useState } from "react";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("Please enter details and upload an image.");
  const [loading, setLoading] = useState(false);

  async function sendImage(e) {
    e.preventDefault();

    if (!image || !firstName || !lastName) {
      setMessage("Please fill all fields and select an image.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64Image = reader.result.split(",")[1];

      try {
        setLoading(true);
        setMessage("Uploading...");

        const response = await fetch(
          "https://h3v6z64lxd.execute-api.eu-west-1.amazonaws.com/dev/upload",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              firstName,
              lastName,
              image: base64Image,
            }),
          }
        );

        const data = await response.json();

        console.log("API RESPONSE:", data);

        if (data.Message === "Employee registered successfully") {
          setMessage(`✅ ${firstName} ${lastName} registered successfully`);

          // 🔥 BUILD S3 IMAGE URL
          // NOTE: assumes your Lambda stores imageKey like: employees/xxxx.jpeg
          const s3Url = `https://samuel-visitor-images.s3.eu-west-1.amazonaws.com/${data.ImageKey}`;
          setUploadedImageUrl(s3Url);

        } else if (data === "Failure" || data.Message === "Failure") {
          setMessage("❌ No face detected or authentication failed");
        } else {
          setMessage("❌ " + JSON.stringify(data));
        }

      } catch (error) {
        console.error(error);
        setMessage("❌ Error connecting to API");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(image);
  }

  return (
    <div className="App" style={{ padding: "20px" }}>
      <h2>Facial Recognition System</h2>

      <form onSubmit={sendImage}>
        {/* First Name */}
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <br /><br />

        {/* Last Name */}
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <br /><br />

        {/* Image Upload */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
          }}
        />

        <br /><br />

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {/* Message */}
      <div style={{ marginTop: "20px" }}>
        <strong>{message}</strong>
      </div>

      {/* Local Preview */}
      {preview && (
        <div style={{ marginTop: "20px" }}>
          <h4>Preview:</h4>
          <img src={preview} alt="Preview" width="250" />
        </div>
      )}

      {/* S3 Image */}
      {uploadedImageUrl && (
        <div style={{ marginTop: "20px" }}>
          <h4>Stored in S3:</h4>
          <img src={uploadedImageUrl} alt="S3 Upload" width="250" />
        </div>
      )}
    </div>
  );
}

export default App;