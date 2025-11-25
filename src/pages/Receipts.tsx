import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonTitle,
  IonContent,
  IonToolbar,
  IonSpinner,
  IonButton,
} from "@ionic/react";
import { api } from "../services/api";

interface Receipt {
  id: number;
  date: string;
  total_due: number;
}

const Receipts: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const data = await api.getReceipts();
        setReceipts(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load receipts");
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Receipts</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">

        {/* Add Button */}
        <div className="d-flex justify-content-end mb-3">
          <IonButton routerLink="/add-receipt" color="primary">
            + Add New Receipt
          </IonButton>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center mt-4">
            <IonSpinner name="crescent" />
            <p>Loading receipts...</p>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-danger text-center">{error}</p>}

        {/* No Data */}
        {!loading && !error && receipts.length === 0 && (
          <p className="text-center">No receipts found.</p>
        )}

        {/* Receipts Table */}
        {!loading && receipts.length > 0 && (
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">All Receipts</h5>
            </div>

            <div className="card-body p-0">
              <table className="table table-striped table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "120px" }}>ID</th>
                    <th>Date</th>
                    <th>Total Due</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td>{receipt.id}</td>
                      <td>{receipt.date}</td>
                      <td>₹{receipt.total_due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Receipts;
