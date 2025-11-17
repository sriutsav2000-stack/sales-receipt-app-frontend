import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonContent,
  IonToast,
  IonButton,
} from "@ionic/react";
import { api } from "../services/api";

interface Customer {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
}

const AddReceipt: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    date: "",
    due_date: "",
    status: "Open",
    customer_id: "",
    product_id: "",
    quantity: "",
    amount: "",
    advance_received: "",
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custData, prodData] = await Promise.all([
          api.getCustomers(),
          api.getProducts(),
        ]);
        setCustomers(custData);
        setProducts(prodData);
      } catch (err) {
        console.error(err);
        setToastMessage("Failed to load data.");
        setShowToast(true);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        customer_id: Number(formData.customer_id),
        product_id: Number(formData.product_id),
        quantity: Number(formData.quantity),
        amount: Number(formData.amount),
        advance_received: Number(formData.advance_received),
      };

      await api.addReceipt(payload);
      setToastMessage("Receipt added successfully!");
      setShowToast(true);

      setFormData({
        date: "",
        due_date: "",
        status: "Open",
        customer_id: "",
        product_id: "",
        quantity: "",
        amount: "",
        advance_received: "",
      });
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to add receipt.");
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add Receipt</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="container mt-4">
          <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "600px" }}>
            <h4 className="mb-3 text-center text-primary">Create New Receipt</h4>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  name="date"
                  className="form-control"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  name="due_date"
                  className="form-control"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Customer</label>
                <select
                  name="customer_id"
                  className="form-select"
                  value={formData.customer_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Product</label>
                <select
                  name="product_id"
                  className="form-select"
                  value={formData.product_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    className="form-control"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    className="form-control"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Advance Received</label>
                <input
                  type="number"
                  name="advance_received"
                  className="form-control"
                  value={formData.advance_received}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <IonButton type="submit" expand="block" color="primary" className="mt-3">
                Submit Receipt
              </IonButton>

              <IonButton
                expand="block"
                fill="clear"
                color="medium"
                routerLink="/receipts"
                className="mt-2"
              >
                Back to Receipts
              </IonButton>
            </form>
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

export default AddReceipt;
