import React, { useState } from "react";
import {
  IonPage, IonHeader, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton
} from "@ionic/react";
import { api } from "../services/api";
import "../styles/form.css";

const AddCustomer: React.FC = () => {
  const [form, setForm] = useState({ name: "", contact: "" });

  const handleChange = (key: string, value: any) =>
    setForm({ ...form, [key]: value });

  const handleSubmit = async () => {
    try {
      await api.addCustomer(form);
      alert("Customer added successfully!");
      setForm({ name: "", contact: "" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Error adding customer: " + message);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonTitle>Add Customer</IonTitle>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Name</IonLabel>
          <IonInput
            value={form.name}
            placeholder="Enter customer name"
            onIonChange={(e) => handleChange("name", e.detail.value!)}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Contact</IonLabel>
          <IonInput
            type="tel"
            value={form.contact}
            placeholder="Enter contact number"
            onIonChange={(e) => handleChange("contact", e.detail.value!)}
          />
        </IonItem>

        <IonButton expand="block" className="submit-btn" onClick={handleSubmit}>
          Save Customer
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default AddCustomer;
