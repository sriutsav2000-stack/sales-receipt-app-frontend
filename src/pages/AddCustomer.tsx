// AddCustomer.tsx - Elegant Mobile Responsive Design
import React, { useState } from "react";
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonToast, 
  IonButton,
  IonIcon 
} from "@ionic/react";
import { arrowBack, personAdd } from "ionicons/icons";
import { api } from "../services/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faPhone, faSave, faArrowLeft,
  faCheckCircle, faBuilding
} from '@fortawesome/free-solid-svg-icons';

import Navigation from "../components/Navigation";

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

      setToastMessage("🎉 Customer added successfully!");
      setShowToast(true);

      setFormData({ name: "", contact: "" });
    } catch (err) {
      console.error(err);
      setToastMessage("❌ Failed to add customer.");
      setShowToast(true);
    }
  };

  return (
    <IonPage>
    <IonHeader>
          <Navigation title="Add Customer" />
        </IonHeader>

      <IonContent className="ion-padding">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-6">
              <div className="elegant-card p-4 p-md-5">
                <div className="text-center mb-5">
                  <div className="bg-primary bg-gradient p-3 rounded-circle d-inline-flex mb-3">
                    <FontAwesomeIcon icon={faBuilding} className="text-white" size="2x" />
                  </div>
                  <h1 className="h3 fw-bold gradient-text mb-2">Add New Customer</h1>
                  <p className="text-muted">Enter customer details to continue</p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Customer Name */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-2">
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      Customer Name *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FontAwesomeIcon icon={faUser} />
                      </span>
                      <input
                        type="text"
                        name="name"
                        className="form-control form-control-sm"
                        placeholder="Enter customer name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="mb-5">
                    <label className="form-label fw-semibold mb-2">
                      <FontAwesomeIcon icon={faPhone} className="me-2" />
                      Contact Number (Optional)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FontAwesomeIcon icon={faPhone} />
                      </span>
                      <input
                        type="tel"
                        name="contact"
                        className="form-control form-control-sm"
                        placeholder="Enter contact number"
                        value={formData.contact}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-text text-muted mt-2">
                      You can add contact details later
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
                        Save Customer
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
                    Customer will be available immediately for receipts
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setShowToast(false)}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default AddCustomer;