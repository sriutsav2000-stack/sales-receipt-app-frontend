import React, { useEffect, useState } from 'react';
import { 
  IonPage, IonHeader, IonContent, IonButton, 
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonList, IonItem, IonLabel, IonBadge,
  IonToast, IonButtons, IonBackButton, IonToolbar, IonTitle,
  IonIcon
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { api } from '../services/api';
import Navigation from '../components/Navigation';
import { 
  receipt, person, calendar, cash, pricetag, 
  arrowForward, create, trash, eye, document
} from 'ionicons/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRupeeSign, faCalendarDay, faUser, 
  faBox, faClock, faCheckCircle, 
  faExclamationTriangle, faFileInvoiceDollar
} from '@fortawesome/free-solid-svg-icons';

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
  product_price: number;
  customer_contact?: string;
  customer_email?: string;
}

const ReceiptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadReceiptDetail();
  }, [id]);

  const loadReceiptDetail = async () => {
    setIsLoading(true);
    try {
      const receiptData = await api.getReceipt(parseInt(id));
      
      // Fetch customer and product details in parallel
      const [customerData, productData] = await Promise.all([
        api.getCustomer(receiptData.customer_id).catch(() => ({
          name: 'Unknown Customer',
          contact: '',
          email: ''
        })),
        api.getProduct(receiptData.product_id).catch(() => ({ 
          name: 'Unknown Product',
          price: 0
        }))
      ]);

      setReceipt({
        ...receiptData,
        customer_name: customerData.name,
        customer_contact: customerData.contact,
        customer_email: customerData.email,
        product_name: productData.name,
        product_price: productData.price || receiptData.amount / receiptData.quantity
      });
    } catch (error) {
      console.error('Error loading receipt:', error);
      setToastMessage('Failed to load receipt details');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'open': return 'warning';
      case 'closed': return 'success';
      case 'overdue': return 'danger';
      default: return 'medium';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status.toLowerCase()) {
      case 'open': return faExclamationTriangle;
      case 'closed': return faCheckCircle;
      default: return faClock;
    }
  };

  const handleEdit = () => {
    history.push(`/edit-receipt/${id}`);
  };

  const handleViewForm = () => {
    history.push(`/view-receipt/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      try {
        // You'll need to add a deleteReceipt method to your api
        // await api.deleteReceipt(parseInt(id));
        setToastMessage('Receipt deleted successfully');
        setShowToast(true);
        setTimeout(() => history.push('/receipts'), 1500);
      } catch (error) {
        setToastMessage('Failed to delete receipt');
        setShowToast(true);
      }
    }
  };

  const handleViewCustomer = () => {
    if (receipt) {
      history.push(`/customer/${receipt.customer_id}`);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <Navigation title="Receipt Details" />
        </IonHeader>
        <IonContent className="ion-padding">
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

  if (!receipt) {
    return (
      <IonPage>
        <IonHeader>
          <Navigation title="Receipt Details" />
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="text-center py-5">
            <FontAwesomeIcon icon={faFileInvoiceDollar} size="4x" className="text-muted mb-3" />
            <h5>Receipt not found</h5>
            <p className="text-muted">The receipt you're looking for doesn't exist.</p>
            <IonButton onClick={() => history.push('/receipts')}>
              Back to Receipts
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <Navigation title={`Receipt #${receipt.id}`} />
      </IonHeader>
      <IonContent>
        {/* Receipt Header */}
        <div className="receipt-header">
          <div className="receipt-title">
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-3" size="2x" />
            <div>
              <h1 className="h4 fw-bold mb-0">Receipt #{receipt.id}</h1>
              <p className="text-muted mb-0">{formatDate(receipt.date)}</p>
            </div>
          </div>
          <IonBadge color={getStatusColor(receipt.status)} className="status-badge">
            <FontAwesomeIcon icon={getStatusIcon(receipt.status)} className="me-1" />
            {receipt.status}
          </IonBadge>
        </div>

        {/* Customer Card */}
        <IonCard className="customer-card">
          <IonCardHeader>
            <IonCardTitle className="d-flex align-items-center">
              <FontAwesomeIcon icon={faUser} className="me-2" />
              Customer Information
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              <IonItem>
                <IonLabel>
                  <h3>{receipt.customer_name}</h3>
                  <p>Customer ID: {receipt.customer_id}</p>
                  {receipt.customer_contact && (
                    <p>Contact: {receipt.customer_contact}</p>
                  )}
                  {receipt.customer_email && (
                    <p>Email: {receipt.customer_email}</p>
                  )}
                </IonLabel>
                <IonButton 
                  fill="clear" 
                  slot="end"
                  onClick={handleViewCustomer}
                >
                  View
                  <IonIcon icon={arrowForward} slot="end" />
                </IonButton>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Product Details */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="d-flex align-items-center">
              <FontAwesomeIcon icon={faBox} className="me-2" />
              Product Details
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="product-details">
              <div className="product-info">
                <h4>{receipt.product_name}</h4>
                <div className="product-stats">
                  <div className="stat">
                    <span className="label">Quantity:</span>
                    <span className="value">{receipt.quantity} units</span>
                  </div>
                  <div className="stat">
                    <span className="label">Unit Price:</span>
                    <span className="value">{formatCurrency(receipt.product_price)}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Total Price:</span>
                    <span className="value">{formatCurrency(receipt.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Payment Summary */}
        <IonCard className="payment-card">
          <IonCardHeader>
            <IonCardTitle className="d-flex align-items-center">
              <FontAwesomeIcon icon={faRupeeSign} className="me-2" />
              Payment Summary
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="payment-summary">
              <div className="payment-row">
                <span>Total Amount:</span>
                <strong>{formatCurrency(receipt.amount)}</strong>
              </div>
              <div className="payment-row">
                <span>Advance Received:</span>
                <strong className="text-success">{formatCurrency(receipt.advance_received)}</strong>
              </div>
              <div className="payment-divider"></div>
              <div className="payment-row total">
                <span>Balance Due:</span>
                <strong className="text-primary">{formatCurrency(receipt.total_due)}</strong>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Dates Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="d-flex align-items-center">
              <FontAwesomeIcon icon={faCalendarDay} className="me-2" />
              Important Dates
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="dates-grid">
              <div className="date-item">
                <div className="date-label">Issue Date</div>
                <div className="date-value">{formatDate(receipt.date)}</div>
              </div>
              <div className="date-item">
                <div className="date-label">Due Date</div>
                <div className={`date-value ${receipt.status === 'Open' ? 'text-warning' : ''}`}>
                  {formatDate(receipt.due_date)}
                  {receipt.status === 'Open' && (
                    <div className="date-note">Payment pending</div>
                  )}
                </div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Action Buttons */}
        <div className="action-section ion-padding">
          <h4 className="mb-3">Actions</h4>
          <div className="action-buttons">
            <IonButton 
              expand="block" 
              color="primary" 
              className="action-button"
              onClick={handleViewForm}
            >
              <IonIcon icon={eye} slot="start" />
              View Full Form
            </IonButton>
            
            <IonButton 
              expand="block" 
              color="warning" 
              className="action-button"
              onClick={handleEdit}
            >
              <IonIcon icon={create} slot="start" />
              Edit Receipt
            </IonButton>
            
            <IonButton 
              expand="block" 
              color="danger" 
              fill="outline" 
              className="action-button"
              onClick={handleDelete}
            >
              <IonIcon icon={trash} slot="start" />
              Delete Receipt
            </IonButton>
          </div>
        </div>

        {/* View More Link */}
        <div className="text-center py-3 border-top">
          <IonButton 
            fill="clear" 
            color="medium"
            onClick={() => history.push('/receipts')}
          >
            View All Receipts
            <IonIcon icon={arrowForward} slot="end" />
          </IonButton>
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

export default ReceiptDetail;