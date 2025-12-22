// AddProduct.tsx - Elegant Mobile Responsive Design
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, faRupeeSign, faSave, faArrowLeft,
  faCube, faTag, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

import Navigation from "../components/Navigation";

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

      setToast({ show: true, message: "🎉 Product added successfully!" });
      setFormData({ name: "", price: "" });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: "❌ Failed to add product" });
    }
  };

  return (
    <IonPage>
       <IonHeader>
          <Navigation title="Add Product" />
        </IonHeader>

      <IonContent className="ion-padding">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-6">
              <div className="elegant-card p-4 p-md-5">
                <div className="text-center mb-5">
                  <div className="bg-success bg-gradient p-3 rounded-circle d-inline-flex mb-3">
                    <FontAwesomeIcon icon={faCube} className="text-white" size="2x" />
                  </div>
                  <h1 className="h3 fw-bold gradient-text mb-2">Add New Product</h1>
                  <p className="text-muted">Enter product details to continue</p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Product Name */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-2">
                      <FontAwesomeIcon icon={faTag} className="me-2" />
                      Product Name *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FontAwesomeIcon icon={faBox} />
                      </span>
                      <input
                        type="text"
                        name="name"
                        className="form-control form-control-sm"
                        placeholder="Enter product name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <label className="form-label fw-semibold mb-2">
                      <FontAwesomeIcon icon={faRupeeSign} className="me-2" />
                      Price *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FontAwesomeIcon icon={faRupeeSign} />
                      </span>
                      <input
                        type="number"
                        name="price"
                        className="form-control form-control-sm"
                        placeholder="Enter price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="form-text text-muted mt-2">
                      Enter the base price for this product
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <IonButton 
                        type="submit" 
                        className="btn-elegant btn-elegant-primary w-100 py-3"
                        expand="block"
                      >
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        Add Product
                      </IonButton>
                    </div>
                    <div className="col-12 col-md-6">
                      <IonButton 
                        className="btn-elegant btn-elegant-secondary w-100 py-3"
                        routerLink="/add-receipt"
                        routerDirection="back"
                        expand="block"
                      >
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                        Back to Receipt
                      </IonButton>
                    </div>
                  </div>
                </form>

                {/* Help Text */}
                <div className="mt-5 pt-4 border-top text-center">
                  <small className="text-muted">
                    <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                    Product will be available immediately for receipts
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <IonToast
          isOpen={toast.show}
          message={toast.message}
          duration={3000}
          onDidDismiss={() => setToast({ ...toast, show: false })}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default AddProduct;