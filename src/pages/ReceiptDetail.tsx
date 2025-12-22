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
  faReceipt, faUser, faCalendarAlt, 
  faIndianRupeeSign, faBox, faFileInvoiceDollar,
  faClock, faCheckCircle, faExclamationTriangle,
  faArrowLeft, faHome, faPrint
} from '@fortawesome/free-solid-svg-icons';
import Navigation from '../components/Navigation';
import '../styles/form.css'

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadReceiptDetail();
  }, [id]);

  const loadReceiptDetail = async () => {
    try {
      setLoading(true);
      console.log(`Loading receipt details for ID: ${id}`);
      
      // Fetch receipt details
      const receiptData = await api.getReceipt(parseInt(id));
      console.log("Receipt data:", receiptData);

      // Fetch customer and product details
      const [customerData, productData] = await Promise.all([
        api.getCustomer(receiptData.customer_id).catch(() => ({ name: 'Unknown Customer' })),
        api.getProduct(receiptData.product_id).catch(() => ({ name: 'Unknown Product' }))
      ]);

      setReceipt({
        ...receiptData,
        customer_name: customerData.name || 'Unknown Customer',
        product_name: productData.name || 'Unknown Product',
        customer_contact: customerData.contact,
        customer_email: customerData.email
      });
      
    } catch (err) {
      console.error('Error loading receipt details:', err);
      setError('Failed to load receipt details');
      
      // Mock data for testing
      setReceipt({
        id: parseInt(id),
        date: "2025-03-11",
        due_date: "2025-03-25",
        quantity: 1,
        advance_received: 1.0,
        customer_id: 1,
        customer_name: "John Foe",
        customer_contact: "+91 9876543210",
        customer_email: "john@example.com",
        amount: 10.0,
        total_due: 9.0,
        status: "Open",
        product_id: 1,
        product_name: "Product A"
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

  const getStatusInfo = () => {
    if (!receipt) return null;
    
    const today = new Date();
    const dueDate = new Date(receipt.due_date);
    const isOverdue = dueDate < today && receipt.status === 'Open';
    const daysOverdue = isOverdue ? 
      Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (isOverdue) {
      return {
        text: `${daysOverdue} days overdue`,
        icon: faClock,
        className: 'overdue'
      };
    }
    
    if (daysUntilDue <= 7) {
      return {
        text: `Due in ${daysUntilDue} days`,
        icon: faExclamationTriangle,
        className: 'warning'
      };
    }
    
    return {
      text: 'On track',
      icon: faCheckCircle,
      className: 'success'
    };
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <Navigation title="Receipt Details" />
        </IonHeader>
        <IonContent>
          <div className="loading-state">
            <div className="spinner-border text-gradient" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading receipt details...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <IonPage>
      <IonHeader>
        <Navigation title="Receipt Details" />
      </IonHeader>

      <IonContent>
        <div className="detail-container">
          {receipt && (
            <>
              {/* Receipt Header */}
              <div className="detail-card receipt-header-card fade-in">
                <div className="receipt-title">
                  <FontAwesomeIcon icon={faReceipt} className="receipt-icon" />
                  <div>
                    <h2>Receipt #{receipt.id}</h2>
                    <p className="receipt-subtitle">Issued on {formatDate(receipt.date)}</p>
                  </div>
                </div>
                
                {statusInfo && (
                  <div className={`status-badge ${statusInfo.className}`}>
                    <FontAwesomeIcon icon={statusInfo.icon} className="me-2" />
                    {statusInfo.text}
                  </div>
                )}
              </div>

              {/* Receipt Details */}
              <div className="detail-grid fade-in">
                {/* Customer Info */}
                <div className="detail-card">
                  <div className="card-header">
                    <FontAwesomeIcon icon={faUser} className="card-icon" />
                    <h3>Customer Information</h3>
                  </div>
                  <div className="card-content">
                    <div className="info-item">
                      <p className="info-label">Name</p>
                      <p 
                        className="info-value clickable" 
                        onClick={() => history.push(`/customer/${receipt.customer_id}`)}
                      >
                        {receipt.customer_name}
                      </p>
                    </div>
                    <div className="info-item">
                      <p className="info-label">Customer ID</p>
                      <p className="info-value">{receipt.customer_id}</p>
                    </div>
                    {receipt.customer_contact && (
                      <div className="info-item">
                        <p className="info-label">Contact</p>
                        <p className="info-value">{receipt.customer_contact}</p>
                      </div>
                    )}
                    {receipt.customer_email && (
                      <div className="info-item">
                        <p className="info-label">Email</p>
                        <p className="info-value">{receipt.customer_email}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="detail-card">
                  <div className="card-header">
                    <FontAwesomeIcon icon={faBox} className="card-icon" />
                    <h3>Product Information</h3>
                  </div>
                  <div className="card-content">
                    <div className="info-item">
                      <p className="info-label">Product</p>
                      <p className="info-value">{receipt.product_name}</p>
                    </div>
                    <div className="info-item">
                      <p className="info-label">Product ID</p>
                      <p className="info-value">{receipt.product_id}</p>
                    </div>
                    <div className="info-item">
                      <p className="info-label">Quantity</p>
                      <p className="info-value">{receipt.quantity}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="detail-card">
                  <div className="card-header">
                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="card-icon" />
                    <h3>Payment Details</h3>
                  </div>
                  <div className="card-content">
                    <div className="info-item">
                      <p className="info-label">Total Amount</p>
                      <p className="info-value amount">{formatCurrency(receipt.amount)}</p>
                    </div>
                    <div className="info-item">
                      <p className="info-label">Advance Received</p>
                      <p className="info-value advance">{formatCurrency(receipt.advance_received)}</p>
                    </div>
                    <div className="info-item">
                      <p className="info-label">Amount Due</p>
                      <p className="info-value due">{formatCurrency(receipt.total_due)}</p>
                    </div>
                    <div className="info-item">
                      <p className="info-label">Status</p>
                      <p className={`info-value status-${receipt.status.toLowerCase()}`}>
                        {receipt.status}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="detail-card">
                  <div className="card-header">
                    <FontAwesomeIcon icon={faCalendarAlt} className="card-icon" />
                    <h3>Dates</h3>
                  </div>
                  <div className="card-content">
                    <div className="info-item">
                      <p className="info-label">Issue Date</p>
                      <p className="info-value">{formatDate(receipt.date)}</p>
                    </div>
                    <div className="info-item">
                      <p className="info-label">Due Date</p>
                      <p className={`info-value ${statusInfo?.className}`}>
                        {formatDate(receipt.due_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="actions-section fade-in">
                <div className="actions-grid">
                  <IonButton 
                    expand="block" 
                    className="print-btn"
                    onClick={handlePrint}
                  >
                    <FontAwesomeIcon icon={faPrint} className="me-2" />
                    Print Receipt
                  </IonButton>
                  <IonButton 
                    expand="block" 
                    fill="outline"
                    onClick={() => history.push(`/customer/${receipt.customer_id}`)}
                  >
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    View Customer
                  </IonButton>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="error-card">
              <p>{error}</p>
              <IonButton onClick={loadReceiptDetail}>Retry</IonButton>
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

export default ReceiptDetail;