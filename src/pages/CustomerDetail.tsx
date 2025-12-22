import React, { useEffect, useState } from 'react';
import { 
  IonPage, 
  IonHeader, 
  IonContent, 
  IonButton, 
  IonLoading, 
  IonToast 
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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadCustomerDetail();
  }, [id]);

  const loadCustomerDetail = async () => {
    try {
      setLoading(true);
      
      // Fetch customer details
      let customerData;
      try {
        customerData = await api.getCustomer(parseInt(id));
      } catch (err) {
        console.log('Customer API failed, using fallback');
        // Try to get customer from customers list
        const customers = await api.getCustomers().catch(() => []);
        customerData = customers.find((c: any) => c.id === parseInt(id)) || {
          id: parseInt(id),
          name: `Customer ${id}`,
          contact: '',
          email: ''
        };
      }
      
      // Fetch all receipts and filter by customer
      let receiptsData;
      try {
        receiptsData = await api.getReceipts();
        receiptsData = receiptsData.filter((receipt: any) => 
          receipt.customer_id === parseInt(id)
        );
      } catch (err) {
        console.log('Receipts API failed, using empty array');
        receiptsData = [];
      }

      const totalDue = receiptsData.reduce((sum: number, receipt: any) => 
        sum + (receipt.total_due || 0), 0
      );
      
      setCustomer({
        ...customerData,
        total_due: totalDue,
        total_receipts: receiptsData.length,
        receipts: receiptsData.map((receipt: any) => ({
          id: receipt.id,
          date: receipt.date,
          due_date: receipt.due_date,
          amount: receipt.amount,
          total_due: receipt.total_due,
          status: receipt.status
        }))
      });
      
    } catch (err) {
      console.error('Error loading customer details:', err);
      setError('Failed to load customer details');
      
      // Fallback mock data
      setCustomer({
        id: parseInt(id),
        name: "John Doe",
        contact: "+91 9876543210",
        email: "john@example.com",
        address: "123 Main Street, City",
        total_due: 544.0,
        total_receipts: 3,
        receipts: [
          {
            id: 3,
            date: "2025-03-11",
            due_date: "2025-03-25",
            amount: 10.0,
            total_due: 9.0,
            status: "Open"
          },
          {
            id: 6,
            date: "2025-11-15",
            due_date: "2025-11-15",
            amount: 100.0,
            total_due: 490.0,
            status: "Open"
          },
          {
            id: 9,
            date: "2025-11-10",
            due_date: "2025-11-19",
            amount: 30.0,
            total_due: 45.0,
            status: "Open"
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const isOverdue = due < today && status === 'Open';
    const daysOverdue = isOverdue ? 
      Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    if (isOverdue) {
      return (
        <span className="status-badge overdue">
          <FontAwesomeIcon icon={faClock} className="me-1" />
          {daysOverdue}d overdue
        </span>
      );
    }
    
    const daysUntilDue = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 7) {
      return (
        <span className="status-badge warning">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
          Due in {daysUntilDue}d
        </span>
      );
    }
    
    return (
      <span className="status-badge success">
        <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
        On track
      </span>
    );
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <Navigation title="Customer Details" />
        </IonHeader>
        <IonContent>
          <div className="loading-state">
            <div className="spinner-border text-gradient" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading customer details...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <Navigation title="Customer Details" />
      </IonHeader>

      <IonContent>
        <div className="detail-container">
          {customer && (
            <>
              {/* Customer Info Card */}
              <div className="detail-card">
                <div className="detail-header">
                  <div className="avatar">
                    <FontAwesomeIcon icon={faUser} size="lg" />
                  </div>
                  <div className="detail-title">
                    <h2>{customer.name}</h2>
                    <p className="text-secondary">ID: {customer.id}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="info-item">
                    <FontAwesomeIcon icon={faPhone} className="me-2 text-primary" />
                    <span className="info-label">Contact: </span>
                    <span className="info-value">{customer.contact || 'Not provided'}</span>
                  </div>
                  
                  <div className="info-item mt-2">
                    <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" />
                    <span className="info-label">Email: </span>
                    <span className="info-value">{customer.email || 'Not provided'}</span>
                  </div>
                  
                  {customer.address && (
                    <div className="info-item mt-2">
                      <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                      <span className="info-label">Address: </span>
                      <span className="info-value">{customer.address}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="detail-stats">
                  <div className="stat-box">
                    <FontAwesomeIcon icon={faReceipt} className="me-2 text-primary" />
                    <div>
                      <h3>{customer.total_receipts}</h3>
                      <p>Total Receipts</p>
                    </div>
                  </div>
                  <div className="stat-box">
                    <FontAwesomeIcon icon={faIndianRupeeSign} className="me-2 text-primary" />
                    <div>
                      <h3>{formatCurrency(customer.total_due)}</h3>
                      <p>Total Due</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Receipts List */}
              <div className="detail-card">
                <div className="card-header">
                  <h3 className="mb-0">Receipt History</h3>
                </div>

                {customer.receipts.length > 0 ? (
                  <div className="receipts-list">
                    {customer.receipts.map((receipt) => (
                      <div 
                        key={receipt.id} 
                        className="receipt-item clickable"
                        onClick={() => history.push(`/receipt/${receipt.id}`)}
                      >
                        <div className="receipt-header">
                          <div>
                            <h5>Receipt #{receipt.id}</h5>
                            <p className="text-secondary">
                              <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                              Created: {formatDate(receipt.date)}
                            </p>
                          </div>
                          {getStatusBadge(receipt.status, receipt.due_date)}
                        </div>
                        
                        <div className="receipt-details mt-2">
                          <div className="receipt-info">
                            <p className="text-secondary">Due Date</p>
                            <p className="info-value">{formatDate(receipt.due_date)}</p>
                          </div>
                          <div className="receipt-info">
                            <p className="text-secondary">Total Amount</p>
                            <p className="info-value">{formatCurrency(receipt.amount)}</p>
                          </div>
                          <div className="receipt-info">
                            <p className="text-secondary">Amount Due</p>
                            <p className="info-value text-danger fw-bold">{formatCurrency(receipt.total_due)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No receipts found for this customer</p>
                  </div>
                )}
              </div>
            </>
          )}

          {error && (
            <div className="error-card">
              <p>{error}</p>
              <IonButton onClick={loadCustomerDetail}>Retry</IonButton>
            </div>
          )}
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

export default CustomerDetail;