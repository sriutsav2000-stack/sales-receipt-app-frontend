import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSpinner,
} from "@ionic/react";
import { api, TopCustomer } from "../services/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faReceipt, faUsers, faClock, 
  faPlus, faEye, faUserPlus,
  faCrown, faExclamationTriangle, faCheckCircle,
  faCalendarAlt, faWallet, faBox,
  faBolt, faChartBar, faArrowRight,
  faIndianRupeeSign
} from '@fortawesome/free-solid-svg-icons';

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
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topReceipts, setTopReceipts] = useState<TopReceipt[]>([]);
  const [allReceipts, setAllReceipts] = useState<TopReceipt[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overdue' | 'all'>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [receiptsData, customersData, topCustomersData] = await Promise.all([
        api.getReceipts(),
        api.getCustomers(),
        api.getTopCustomers().catch(() => [])
      ]);

      setCustomers(customersData);
      setTopCustomers(topCustomersData.slice(0, 5));
      const processedReceipts = processReceipts(receiptsData, customersData);
      setAllReceipts(processedReceipts);
      const topByAmount = processedReceipts
        .sort((a, b) => b.total_due - a.total_due)
        .slice(0, 5);
      setTopReceipts(topByAmount);

    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError('Failed to load dashboard data. Please try again.');
      
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
        { id: 1, name: "John Foe", contact: "" },
        { id: 2, name: "shivam", contact: "" },
        { id: 3, name: "test1", contact: "" }
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
        <span className="item-badge danger">
          {receipt.days_overdue}d overdue
        </span>
      );
    }
    
    const dueDate = new Date(receipt.due_date);
    const today = new Date();
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 7) {
      return (
        <span className="item-badge warning">
          Due in {daysUntilDue}d
        </span>
      );
    }
    
    return (
      <span className="item-badge success">
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

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle className="text-gradient">Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-state">
            <div className="spinner-border text-gradient" style={{width: '3rem', height: '3rem'}} role="status">
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
        <IonToolbar>
          <IonTitle className="text-gradient">Sales Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="dashboard-wrapper">
          <div className="dashboard-content">
            
            {/* Hero Section */}
            <div className="dashboard-hero fade-in">
              <h1 className="hero-title">Welcome to Sales Dashboard</h1>
              <p className="hero-subtitle">Track your receipts and payments in real-time</p>
            </div>

            {/* Stats Cards - Full Width Section */}
            <div className="full-width-section stats-section fade-in">
              <div className="stats-header">
                <h2 className="stats-title">
                  <FontAwesomeIcon icon={faChartBar} className="me-2" />
                  Quick Stats
                </h2>
              </div>
              
              <div className="stats-container">
                <div className="stats-scroll">
                  {/* Total Receipts */}
                  <div className="stat-card slide-in">
                    <div className="stat-icon-wrapper primary">
                      <FontAwesomeIcon icon={faReceipt} className="stat-icon primary" />
                    </div>
                    <div className="stat-content">
                      <h3>{totalReceipts}</h3>
                      <p>Total Receipts</p>
                    </div>
                  </div>
                  
                  {/* Total Revenue */}
                  <div className="stat-card slide-in">
                    <div className="stat-icon-wrapper success">
                      <FontAwesomeIcon icon={faIndianRupeeSign} className="stat-icon success" />
                    </div>
                    <div className="stat-content">
                      <h3>{formatCurrency(totalRevenue)}</h3>
                      <p>Total Revenue</p>
                    </div>
                  </div>
                  
                  {/* Pending Amount */}
                  <div className="stat-card slide-in">
                    <div className="stat-icon-wrapper warning">
                      <FontAwesomeIcon icon={faWallet} className="stat-icon warning" />
                    </div>
                    <div className="stat-content">
                      <h3>{formatCurrency(pendingAmount)}</h3>
                      <p>Pending Amount</p>
                    </div>
                  </div>
                  
                  {/* Overdue */}
                  <div className="stat-card slide-in">
                    <div className="stat-icon-wrapper danger">
                      <FontAwesomeIcon icon={faClock} className="stat-icon danger" />
                    </div>
                    <div className="stat-content">
                      <h3>{overdueReceipts}</h3>
                      <p>Overdue</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="actions-section fade-in">
              <div className="actions-header">
                <h2 className="actions-title">
                  <FontAwesomeIcon icon={faBolt} className="me-2" />
                  Quick Actions
                </h2>
                <p className="actions-subtitle">Common tasks for quick access</p>
              </div>
              
              <div className="actions-grid">
                {/* New Receipt */}
                <IonButton 
                  className="action-btn primary"
                  routerLink="/add-receipt"
                  routerDirection="forward"
                  fill="clear"
                >
                  <FontAwesomeIcon icon={faPlus} className="action-icon" />
                  <span className="action-text">New Receipt</span>
                </IonButton>
                
                {/* View Receipts */}
                <IonButton 
                  className="action-btn"
                  routerLink="/receipts"
                  routerDirection="forward"
                  fill="clear"
                >
                  <FontAwesomeIcon icon={faEye} className="action-icon" />
                  <span className="action-text">View Receipts</span>
                </IonButton>
                
                {/* Add Customer */}
                <IonButton 
                  className="action-btn"
                  routerLink="/add-customer"
                  routerDirection="forward"
                  fill="clear"
                >
                  <FontAwesomeIcon icon={faUserPlus} className="action-icon" />
                  <span className="action-text">Add Customer</span>
                </IonButton>
                
                {/* Add Products */}
                <IonButton 
                  className="action-btn"
                  routerLink="/add-product"
                  routerDirection="forward"
                  fill="clear"
                >
                  <FontAwesomeIcon icon={faBox} className="action-icon" />
                  <span className="action-text">Add Products</span>
                </IonButton>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="content-section">
              <div className="content-grid">
                
                {/* Top Customers Card */}
                <div className="content-card fade-in">
                  <div className="card-header">
                    <div className="card-title">
                      <FontAwesomeIcon icon={faCrown} className="card-icon text-warning" />
                      <div>
                        <h5>Top Customers</h5>
                        <p className="card-subtitle">Highest due amounts</p>
                      </div>
                    </div>
                    <IonButton 
                      fill="clear" 
                      size="small"
                      routerLink="/customers"
                      routerDirection="forward"
                      className="flex-center"
                    >
                      <span className="me-1">View All</span>
                      <FontAwesomeIcon icon={faArrowRight} size="xs" />
                    </IonButton>
                  </div>

                  {topCustomers.length > 0 ? (
                    <div className="ranking-list">
                      {topCustomers.map((customer, index) => (
                        <div key={customer.customer_id} className="ranking-item slide-in">
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
                      <p className="empty-text">No customer data available</p>
                      <IonButton 
                        size="small"
                        routerLink="/add-customer"
                        routerDirection="forward"
                        className="mt-2"
                      >
                        Add First Customer
                      </IonButton>
                    </div>
                  )}
                </div>

                {/* Top Receipts Card */}
                <div className="content-card fade-in">
                  <div className="card-header">
                    <div className="card-title">
                      <FontAwesomeIcon icon={faReceipt} className="card-icon text-primary" />
                      <div>
                        <h5>Top Receipts</h5>
                        <p className="card-subtitle">Highest due amounts</p>
                      </div>
                    </div>
                    <div className="flex-center">
                      <button 
                        type="button"
                        className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
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
                        <div key={receipt.id} className="ranking-item slide-in">
                          <div className={`rank-badge rank-${index + 1}`}>
                            {index + 1}
                          </div>
                          <div className="item-content">
                            <div className="item-title text-truncate">{receipt.customer_name}</div>
                            <div className="flex-between">
                              <p className="item-subtitle">
                                Due: {formatDate(receipt.due_date)} • #{receipt.id}
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
                      <p className="empty-text">No overdue receipts! Great job!</p>
                      <small className="text-muted">All payments are up to date</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Receipts Table */}
            <div className="content-section fade-in">
              <div className="content-card">
                <div className="card-header">
                  <div className="card-title">
                    <FontAwesomeIcon icon={faCalendarAlt} className="card-icon" />
                    <div>
                      <h5>Recent Receipts</h5>
                      <p className="card-subtitle">Latest 10 receipts</p>
                    </div>
                  </div>
                  <IonButton 
                    fill="clear" 
                    size="small"
                    routerLink="/receipts"
                    routerDirection="forward"
                    className="flex-center"
                  >
                    <span className="me-1">View All</span>
                    <FontAwesomeIcon icon={faArrowRight} size="xs" />
                  </IonButton>
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
                      {allReceipts.slice(0, 10).map((receipt) => (
                        <tr key={receipt.id}>
                          <td>
                            <div className="item-title">{receipt.customer_name}</div>
                            <small className="item-subtitle">#{receipt.id}</small>
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
            </div>

            {/* Error Message */}
            {error && (
              <div className="content-section fade-in">
                <div className="content-card border-danger">
                  <div className="text-center text-danger">
                    <FontAwesomeIcon icon={faExclamationTriangle} size="2xl" className="mb-3" />
                    <h5 className="mb-2">Connection Issue</h5>
                    <p className="mb-3">{error}</p>
                    <IonButton 
                      className="btn-primary"
                      onClick={loadDashboardData}
                    >
                      Retry Loading 
                    </IonButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home; 