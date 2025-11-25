import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonToast,
  IonButton,
} from "@ionic/react";
import { api } from "../services/api";

const AddProduct: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
  });

  const [toast, setToast] = useState({ show: false, message: "" });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await api.addProduct({
        name: formData.name,
        price: Number(formData.price),
      });

      setToast({ show: true, message: "Product added successfully" });
      setFormData({ name: "", price: "" });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: "Failed to add product" });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add Product</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="container mt-4">
          <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "500px" }}>
            <h4 className="mb-3 text-center text-primary">Add New Product</h4>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Price</label>
                <input
                  type="number"
                  name="price"
                  className="form-control"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <IonButton expand="block" type="submit" color="primary">
                Add Product
              </IonButton>

              <IonButton
                expand="block"
                fill="clear"
                routerLink="/add-receipt"
                className="mt-2"
              >
                Back
              </IonButton>
            </form>
          </div>
        </div>

        <IonToast
          isOpen={toast.show}
          message={toast.message}
          duration={2000}
          onDidDismiss={() => setToast({ ...toast, show: false })}
        />
      </IonContent>
    </IonPage>
  );
};

export default AddProduct;
