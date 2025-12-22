// Receipts.tsx - Updated with enhanced header
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
import Navigation from "../components/Navigation";

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
          <Navigation title="Receipts" />
        </IonHeader>

      <IonContent className="ion-padding">
        {/* Enhanced Header */}
        <div className="page-header">
          <h1 className="page-title">All Receipts</h1>
          <IonButton 
            routerLink="/add-receipt" 
            color="primary" 
            className="custom-button"
            style={{ 
              '--background': 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              '--background-hover': 'linear-gradient(135deg, var(--primary-dark), var(--primary))'
            } as any}
          >
            ＋ Add New Receipt
          </IonButton>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="text-muted">Loading receipts...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <p className="text-danger">{error}</p>
          </div>
        )}

        {/* No Data */}
        {!loading && !error && receipts.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <p className="text-muted">No receipts found.</p>
            <IonButton 
              routerLink="/add-receipt" 
              color="primary" 
              className="mt-3 custom-button"
              style={{ 
                '--background': 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                '--background-hover': 'linear-gradient(135deg, var(--primary-dark), var(--primary))'
              } as any}
            >
              Create Your First Receipt
            </IonButton>
          </div>
        )}

        {/* Receipts Table */}
        {!loading && receipts.length > 0 && (
          <div className="card hover-lift">
            <div className="card-header">
              <h5 className="mb-0">Receipts List</h5>
            </div>

            <div className="card-body p-0">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "120px" }}>ID</th>
                    <th>Date</th>
                    <th>Total Due</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="slide-in">
                      <td className="font-semibold">#{receipt.id}</td>
                      <td>{receipt.date}</td>
                      <td className="font-bold text-primary">₹{receipt.total_due}</td>
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