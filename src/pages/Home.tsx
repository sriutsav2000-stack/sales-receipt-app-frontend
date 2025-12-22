import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { IonFab, IonFabButton, IonIcon, IonToast, IonButton, IonPage, IonHeader, IonContent } from "@ionic/react";
import { camera, receipt, eye, personAdd, cube } from "ionicons/icons";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { api, TopCustomer } from "../services/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faReceipt, faUsers, faClock, 
  faCrown, faExclamationTriangle, faCheckCircle,
  faCalendarAlt, faWallet, faBox,
  faChartBar, faArrowRight,
  faIndianRupeeSign, faFileInvoiceDollar,
  faMoneyBillWave, faHistory,
  faSearchDollar, faUserCircle,
  faCalendarCheck
} from '@fortawesome/free-solid-svg-icons';
import Navigation from "../components/Navigation";
import '../styles/main.css';

interface Receipt {
  id: number;
  date: string;
  due_date: string;
  quantity: number;
  advance_received: number;
  customer_id: number;
  amount: number;
  total_due: number;
  status: string;
  product_id: number;
}

interface TopReceipt extends Receipt {
  customer_name: string;
  is_overdue: boolean;
  days_overdue: number;
}

const Home: React.FC = () => {
  const history = useHistory();
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topReceipts, setTopReceipts] = useState<TopReceipt[]>([]);
  const [allReceipts, setAllReceipts] = useState<TopReceipt[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overdue' | 'all'>('all');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [receiptsData, customersData, topCustomersData] = await Promise.all([
        api.getReceipts().catch(() => []),
        api.getCustomers().catch(() => []),
        api.getTopCustomers().catch(() => [])
      ]);

      setCustomers(customersData);
      setTopCustomers(topCustomersData.slice(0, 5));
      const processedReceipts = processReceipts(receiptsData as Receipt[], customersData);
      setAllReceipts(processedReceipts);
      const topByAmount = processedReceipts
        .sort((a, b) => b.total_due - a.total_due)
        .slice(0, 5);
      setTopReceipts(topByAmount);

    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError('Failed to load dashboard data. Please try again.');
      
      // Fallback to mock data
      const mockReceipts: Receipt[] = [
        {
          id: 3, date: "2025-03-11", due_date: "2025-03-25", quantity: 1,
          advance_received: 1.0, customer_id: 1, amount: 10.0, total_due: 9.0,
          status: "Open", product_id: 1
        },
        {
          id: 6, date: "2025-11-15", due_date: "2025-11-15", quantity: 5,
          advance_received: 10.0, customer_id: 1, amount: 100.0, total_due: 490.0,
          status: "Open", product_id: 1
        },
        {
          id: 9, date: "2025-11-10", due_date: "2025-11-19", quantity: 2,
          advance_received: 15.0, customer_id: 2, amount: 30.0, total_due: 45.0,
          status: "Open", product_id: 1
        }
      ];

      const mockCustomers = [
        { id: 1, name: "John Foe", contact: "", email: "" },
        { id: 2, name: "shivam", contact: "", email: "" },
        { id: 3, name: "test1", contact: "", email: "" }
      ];

      const mockTopCustomers = [
        { customer_id: 1, name: "John Foe", total_due: 544.0 },
        { customer_id: 2, name: "shivam", total_due: 55.0 },
        { customer_id: 3, name: "test1", total_due: 15.0 }
      ];

      setCustomers(mockCustomers);
      setTopCustomers(mockTopCustomers.slice(0, 5));
      const processedReceipts = processReceipts(mockReceipts, mockCustomers);
      setAllReceipts(processedReceipts);
      const topByAmount = processedReceipts
        .sort((a, b) => b.total_due - a.total_due)
        .slice(0, 5);
      setTopReceipts(topByAmount);
      
    } finally {
      setLoading(false);
    }
  };

  const handleScanReceipt = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (!photo.webPath) return;

      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const file = new File([blob], "receipt.jpg", { type: "image/jpeg" });

      await api.uploadReceiptImage(file);

      setToastMessage("Receipt scanned successfully");
      setShowToast(true);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to scan receipt");
      setShowToast(true);
    }
  };

  const processReceipts = (receipts: Receipt[], customers: any[]): TopReceipt[] => {
    const today = new Date();
    
    return receipts
      .map(receipt => {
        const dueDate = new Date(receipt.due_date);
        const isOverdue = dueDate < today && receipt.status === 'Open';
        const daysOverdue = isOverdue ? 
          Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        const customer = customers.find(c => c.id === receipt.customer_id);
        
        return {
          ...receipt,
          customer_name: customer?.name || `Customer ${receipt.customer_id}`,
          is_overdue: isOverdue,
          days_overdue: daysOverdue
        };
      });
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

  const getStatusBadge = (receipt: TopReceipt) => {
    if (receipt.is_overdue) {
      return (
        <span className="status-badge overdue">
          <FontAwesomeIcon icon={faClock} className="me-1" />
          {receipt.days_overdue}d overdue
        </span>
      );
    }
    
    const dueDate = new Date(receipt.due_date);
    const today = new Date();
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
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

  // Calculate dashboard stats
  const totalReceipts = allReceipts.length;
  const totalRevenue = allReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const pendingAmount = allReceipts
    .filter(receipt => receipt.status === 'Open')
    .reduce((sum, receipt) => sum + receipt.total_due, 0);
  const overdueReceipts = allReceipts.filter(receipt => receipt.is_overdue).length;

  // Get receipts for display
  const getDisplayReceipts = () => {
    if (activeTab === 'overdue') {
      return allReceipts.filter(receipt => receipt.is_overdue)
        .sort((a, b) => b.days_overdue - a.days_overdue)
        .slice(0, 5);
    } else {
      return allReceipts
        .sort((a, b) => b.total_due - a.total_due)
        .slice(0, 5);
    }
  };

  const displayReceipts = getDisplayReceipts();

  const handleCustomerClick = (customerId: number) => {
    history.push(`/customer/${customerId}`);
  };

  const handleReceiptClick = (receiptId: number) => {
    history.push(`/receipt/${receiptId}`);
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <Navigation title="Dashboard" showBack={false} />
        </IonHeader>
        <IonContent>
          <div className="loading-state">
            <div className="spinner-border text-gradient" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading dashboard...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <Navigation title="Dashboard" showBack={false} />
      </IonHeader>

      <IonContent>
        <div className="dashboard-content">
          {/* Hero Section */}
          <div className="dashboard-hero">
            <h1 className="hero-title">Sales Dashboard</h1>
            <p className="hero-subtitle">Track your receipts and payments</p>
          </div>

          {/* Stats Cards - Horizontal Scroll */}
          <div className="stats-section">
            <h2 className="stats-title">
              <FontAwesomeIcon icon={faChartBar} className="me-1" />
              Quick Stats
            </h2>
            <div className="stats-scroll-container">
              <div className="stats-scroll">
                <div className="stat-card">
                  <div className="stat-icon-wrapper primary">
                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="stat-icon" />
                  </div>
                  <div className="stat-content">
                    <h3>{totalReceipts}</h3>
                    <p>Total Receipts</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon-wrapper success">
                    <FontAwesomeIcon icon={faIndianRupeeSign} className="stat-icon" />
                  </div>
                  <div className="stat-content">
                    <h3>{formatCurrency(totalRevenue)}</h3>
                    <p>Total Revenue</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon-wrapper warning">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="stat-icon" />
                  </div>
                  <div className="stat-content">
                    <h3>{formatCurrency(pendingAmount)}</h3>
                    <p>Pending Amount</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon-wrapper danger">
                    <FontAwesomeIcon icon={faClock} className="stat-icon" />
                  </div>
                  <div className="stat-content">
                    <h3>{overdueReceipts}</h3>
                    <p>Overdue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - 4 Buttons ALWAYS in one row */}
          <div className="actions-section">
            <div className="actions-header">
              <h2 className="actions-title">Quick Actions</h2>
            </div>
            
            <div className="actions-grid">
              <div 
                className="action-btn primary clickable" 
                onClick={() => history.push('/add-receipt')}
                title="New Receipt"
              >
                <IonIcon icon={receipt} className="action-icon" />
                <span className="action-text">New Receipt</span>
              </div>
              
              <div 
                className="action-btn clickable" 
                onClick={() => history.push('/receipts')}
                title="View Receipts"
              >
                <IonIcon icon={eye} className="action-icon" />
                <span className="action-text">View Receipts</span>
              </div>
              
              <div 
                className="action-btn clickable" 
                onClick={() => history.push('/add-customer')}
                title="Add Customer"
              >
                <IonIcon icon={personAdd} className="action-icon" />
                <span className="action-text">Add Customer</span>
              </div>
              
              <div 
                className="action-btn clickable" 
                onClick={() => history.push('/add-product')}
                title="Add Product"
              >
                <IonIcon icon={cube} className="action-icon" />
                <span className="action-text">Add Product</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="content-grid">
            {/* Top Customers */}
            <div className="content-card">
              <div className="card-header">
                <div className="card-title">
                  <FontAwesomeIcon icon={faCrown} className="text-warning" />
                  <div>
                    <h5>Top Customers</h5>
                    <p className="card-subtitle">Highest due amounts</p>
                  </div>
                </div>
                <button 
                  className="view-all-btn clickable"
                  onClick={() => history.push('/customers')}
                >
                  <span>View All</span>
                  <FontAwesomeIcon icon={faArrowRight} size="xs" />
                </button>
              </div>

              {topCustomers.length > 0 ? (
                <div className="ranking-list">
                  {topCustomers.map((customer, index) => (
                    <div 
                      key={customer.customer_id} 
                      className="ranking-item clickable"
                      onClick={() => handleCustomerClick(customer.customer_id)}
                    >
                      <div className={`rank-badge rank-${index + 1}`}>
                        {index + 1}
                      </div>
                      <div className="item-content">
                        <div className="item-title">{customer.name}</div>
                        <p className="item-subtitle">ID: {customer.customer_id}</p>
                      </div>
                      <div className="item-value">
                        {formatCurrency(customer.total_due)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FontAwesomeIcon icon={faUsers} className="empty-icon" />
                  <p className="empty-text">No customer data</p>
                </div>
              )}
            </div>

            {/* Top Receipts */}
            <div className="content-card">
              <div className="card-header">
                <div className="card-title">
                  <FontAwesomeIcon icon={faSearchDollar} className="text-primary" />
                  <div>
                    <h5>Top Receipts</h5>
                    <p className="card-subtitle">Highest due amounts</p>
                  </div>
                </div>
                <div className="tab-buttons">
                  <button 
                    type="button"
                    className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveTab('all')}
                  >
                    All
                  </button>
                  <button 
                    type="button"
                    className={`btn btn-sm ${activeTab === 'overdue' ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setActiveTab('overdue')}
                  >
                    Overdue
                  </button>
                </div>
              </div>

              {displayReceipts.length > 0 ? (
                <div className="ranking-list">
                  {displayReceipts.map((receipt, index) => (
                    <div 
                      key={receipt.id} 
                      className="ranking-item clickable"
                      onClick={() => handleReceiptClick(receipt.id)}
                    >
                      <div className={`rank-badge rank-${index + 1}`}>
                        {index + 1}
                      </div>
                      <div className="item-content">
                        <div className="item-title">{receipt.customer_name}</div>
                        <div className="flex-between">
                          <p className="item-subtitle">
                            Due: {formatDate(receipt.due_date)}
                          </p>
                          {getStatusBadge(receipt)}
                        </div>
                      </div>
                      <div className="item-value">
                        {formatCurrency(receipt.total_due)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FontAwesomeIcon icon={faCheckCircle} className="empty-icon text-success" />
                  <p className="empty-text">No overdue receipts!</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Receipts */}
          <div className="content-card">
            <div className="card-header">
              <div className="card-title">
                <FontAwesomeIcon icon={faHistory} className="text-primary" />
                <div>
                  <h5>Recent Receipts</h5>
                  <p className="card-subtitle">Latest receipts</p>
                </div>
              </div>
              <button 
                className="view-all-btn clickable"
                onClick={() => history.push('/receipts')}
              >
                <span>View All</span>
                <FontAwesomeIcon icon={faArrowRight} size="xs" />
              </button>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allReceipts.slice(0, 5).map((receipt) => (
                    <tr 
                      key={receipt.id} 
                      className="clickable"
                      onClick={() => handleReceiptClick(receipt.id)}
                    >
                      <td>
                        <div className="d-flex align-items-center">
                          <FontAwesomeIcon icon={faUserCircle} className="me-2 text-primary" />
                          <div>
                            <div className="item-title">{receipt.customer_name}</div>
                            <small className="item-subtitle">#{receipt.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="item-title">{formatDate(receipt.due_date)}</div>
                        <small className="item-subtitle">{formatDate(receipt.date)}</small>
                      </td>
                      <td className="item-title">{formatCurrency(receipt.amount)}</td>
                      <td className="item-value">{formatCurrency(receipt.total_due)}</td>
                      <td>{getStatusBadge(receipt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-card">
              <div className="error-content">
                <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
                <h5>Connection Issue</h5>
                <p>{error}</p>
                <IonButton 
                  className="mt-3"
                  onClick={loadDashboardData}
                >
                  Retry Loading 
                </IonButton>
              </div>
            </div>
          )}
        </div>

        {/* Beautiful Camera FAB */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed" className="camera-fab-container">
          <IonFabButton 
            onClick={handleScanReceipt}
            className="beautiful-camera-fab"
            title="Scan Receipt"
          >
            <IonIcon icon={camera} />
          </IonFabButton>
        </IonFab>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;