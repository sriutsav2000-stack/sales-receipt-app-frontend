import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonToolbar,
  IonSpinner,
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
        {loading && (
          <div className="ion-text-center">
            <IonSpinner name="crescent" />
            <p>Loading receipts...</p>
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && receipts.length === 0 && (
          <p>No receipts found.</p>
        )}

        <IonButton
          expand="block"
          routerLink="/add-receipt"
          color="primary"
          className="ion-margin-bottom"
        >
          Add New Receipt
        </IonButton>

        <IonList>
          {receipts.map((r) => (
            <IonItem key={r.id}>
              <IonLabel>
                <h2>Date: {r.date}</h2>
                <p>Total Due: ₹{r.total_due}</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Receipts;
