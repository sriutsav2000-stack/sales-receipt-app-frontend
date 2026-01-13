import React, { useEffect, useState } from 'react';
import { 
  IonPage, IonHeader, IonContent, IonButton, IonToast 
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { api } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faPhone, faEnvelope, 
  faReceipt, faIndianRupeeSign, faCalendarAlt,
  faClock, faExclamationTriangle, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import Navigation from '../components/Navigation';

interface ReceiptApi {
  id: number;
  date: string;
  due_date: string;
  amount: number;
  total_due: number;
  status: string;
  customer_id: number;
}

interface CustomerDetail {
  id: number;
  name: string;
  contact: string;
  email: string;
  address?: string;
  total_due: number;
  total_receipts: number;
  receipts: Array<{
    id: number;
    date: string;
    due_date: string;
    amount: number;
    total_due: number;
    status: string;
  }>;
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomerDetail();
  }, [id]);

  const loadCustomerDetail = async () => {
    try {
      setLoading(true);

      let customerData: Partial<CustomerDetail>;
      try {
        customerData = await api.getCustomer(parseInt(id));
      } catch {
        const customers = await api.getCustomers().catch(() => []);
        customerData = customers.find((c: any) => c.id === parseInt(id)) || {
          id: parseInt(id),
          name: `Customer ${id}`,
          contact: '',
          email: ''
        };
      }

      let receiptsData: ReceiptApi[] = [];
      try {
        receiptsData = await api.getReceipts();
        receiptsData = receiptsData.filter(r => r.customer_id === parseInt(id));
      } catch {}

      const totalDue = receiptsData.reduce(
        (sum, r) => sum + (r.total_due || 0),
        0
      );

      setCustomer({
        ...customerData,
        total_due: totalDue,
        total_receipts: receiptsData.length,
        receipts: receiptsData.map(r => ({
          id: r.id,
          date: r.date,
          due_date: r.due_date,
          amount: r.amount,
          total_due: r.total_due,
          status: r.status
        }))
      } as CustomerDetail);
    } catch {
      setError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <IonPage><IonContent>Loading...</IonContent></IonPage>;

  return (
    <IonPage>
      <IonHeader>
        <Navigation title="Customer Details" />
      </IonHeader>
      <IonContent>
        {customer && customer.receipts.map(r => (
          <IonButton key={r.id} onClick={() => history.push(`/receipt/${r.id}`)}>
            Receipt #{r.id}
          </IonButton>
        ))}
        {error && <p>{error}</p>}
      </IonContent>
    </IonPage>
  );
};

export default CustomerDetail;
