import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonContent, IonButton } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { api } from '../services/api';
import Navigation from '../components/Navigation';

interface CustomerApi {
  name: string;
  contact?: string;
  email?: string;
}

interface ReceiptDetail {
  id: number;
  date: string;
  due_date: string;
  quantity: number;
  advance_received: number;
  customer_id: number;
  customer_name: string;
  amount: number;
  total_due: number;
  status: string;
  product_id: number;
  product_name: string;
  customer_contact?: string;
  customer_email?: string;
}

const ReceiptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);

  useEffect(() => {
    loadReceiptDetail();
  }, [id]);

  const loadReceiptDetail = async () => {
    const receiptData = await api.getReceipt(parseInt(id));
    const [customerData, productData] = await Promise.all([
      api.getCustomer(receiptData.customer_id).catch((): CustomerApi => ({
        name: 'Unknown Customer',
        contact: '',
        email: ''
      })),
      api.getProduct(receiptData.product_id).catch(() => ({ name: 'Unknown Product' }))
    ]);

    setReceipt({
      ...receiptData,
      customer_name: customerData.name,
      product_name: productData.name,
      customer_contact: customerData.contact,
      customer_email: customerData.email
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <Navigation title="Receipt Details" />
      </IonHeader>
      <IonContent>
        {receipt && (
          <>
            <h2>Receipt #{receipt.id}</h2>
            <p>{receipt.customer_name}</p>
            <IonButton onClick={() => history.push(`/customer/${receipt.customer_id}`)}>
              View Customer
            </IonButton>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ReceiptDetail;
