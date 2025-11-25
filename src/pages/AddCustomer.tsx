// AddCustomer.tsx - Updated with new styling
import React, { useState } from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonToast, IonButton } from "@ionic/react";
import { api } from "../services/api";

const AddCustomer: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        contact: formData.contact,
      };

      await api.addCustomer(payload);

      setToastMessage("Customer added successfully!");
      setShowToast(true);

      setFormData({ name: "", contact: "" });
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to add customer.");
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add Customer</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="form-container fade-in">
          <div className="form-card hover-lift">
            <h4 className="form-title">Create Customer</h4>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact (Optional)</label>
                <input
                  type="text"
                  name="contact"
                  className="form-input"
                  value={formData.contact}
                  onChange={handleChange}
                />
              </div>

              <IonButton type="submit" expand="block" color="primary">
                Save Customer
              </IonButton>
            </form>

            <IonButton
              expand="block"
              fill="clear"
              color="medium"
              routerLink="/add-receipt"
              className="mt-2"
            >
              Back to Receipt Form
            </IonButton>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default AddCustomer;