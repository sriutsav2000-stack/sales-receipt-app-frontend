import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import { camera } from "ionicons/icons";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

const UploadReceipt: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const takePhotoAndUpload = async () => {
    try {
      // 1️⃣ Open camera
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (!image.webPath) return;

      setLoading(true);

      // 2️⃣ Convert image to Blob
      const response = await fetch(image.webPath);
      const blob = await response.blob();

      // 3️⃣ Create FormData
      const formData = new FormData();
      formData.append("file", blob, "receipt.jpg");

      // 4️⃣ Upload to backend
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/receipts/upload-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();

      setToastMsg("Receipt uploaded successfully ✅");
      setShowToast(true);

      console.log("Server response:", data);
    } catch (err) {
      console.error(err);
      setToastMsg("Failed to upload receipt ❌");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Upload Receipt</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding ion-text-center">
        <div style={{ marginTop: "30%" }}>
          <IonButton
            size="large"
            color="primary"
            onClick={takePhotoAndUpload}
          >
            <IonIcon icon={camera} slot="start" />
            Capture Receipt
          </IonButton>

          {loading && (
            <div style={{ marginTop: 20 }}>
              <IonSpinner />
              <p>Uploading...</p>
            </div>
          )}
        </div>

        <IonToast
          isOpen={showToast}
          message={toastMsg}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default UploadReceipt;
