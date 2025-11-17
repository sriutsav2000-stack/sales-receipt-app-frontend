import React, { useState } from "react";
import {
  IonPage, IonHeader, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton
} from "@ionic/react";
import { api } from "../services/api";
import "../styles/form.css";

const AddProduct: React.FC = () => {
  const [form, setForm] = useState({ name: "", price: "" });

  const handleChange = (key: string, value: any) =>
    setForm({ ...form, [key]: value });

  const handleSubmit = async () => {
    try {
      await api.addProduct({ ...form, price: parseFloat(form.price) });
      alert("Product added successfully!");
      setForm({ name: "", price: "" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Error adding product: " + message);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonTitle>Add Product</IonTitle>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Product Name</IonLabel>
          <IonInput
            value={form.name}
            placeholder="Enter product name"
            onIonChange={(e) => handleChange("name", e.detail.value!)}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Price</IonLabel>
          <IonInput
            type="number"
            value={form.price}
            placeholder="Enter price"
            onIonChange={(e) => handleChange("price", e.detail.value!)}
          />
        </IonItem>

        <IonButton expand="block" className="submit-btn" onClick={handleSubmit}>
          Save Product
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default AddProduct;
