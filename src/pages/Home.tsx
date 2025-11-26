import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonItem,
  IonLabel,
} from "@ionic/react";
import { api, TopCustomer } from "../services/api";
import "../styles/dashboard.css";

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

      // Load all receipts and customers
      const [receiptsData, customersData, topCustomersData] = await Promise.all([
        api.getReceipts(),
        api.getCustomers(),
        api.getTopCustomers().catch(() => [])
      ]);

      setCustomers(customersData);
      setTopCustomers(topCustomersData.slice(0, 5));

      // Process all receipts
      const processedReceipts = processReceipts(receiptsData, customersData);
      setAllReceipts(processedReceipts);
      
      // Get top 5 receipts by total due amount
      const topByAmount = processedReceipts
        .sort((a, b) => b.total_due - a.total_due)
        .slice(0, 5);
      setTopReceipts(topByAmount);

    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError('Failed to load dashboard data. Please try again.');
      
      // Set mock data for demonstration based on your response
      const mockReceipts: Receipt[] = [
        {
          id: 3, date: "2025-03-11", due_date: "2025-03-25", quantity: 1,
          advance_received: 1.0, customer_id: 1, amount: 10.0, total_due: 9.0,
          status: "Open", product_id: 1
        },
        {
          id: 4, date: "2000-03-22", due_date: "2001-03-23", quantity: 1,
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
        },
        {
          id: 13, date: "2025-11-26", due_date: "2025-11-28", quantity: 1,
          advance_received: 10.0, customer_id: 1, amount: 20.0, total_due: 10.0,
          status: "Open", product_id: 2
        },
        {
          id: 14, date: "2024-01-10", due_date: "2024-01-15", quantity: 3,
          advance_received: 50.0, customer_id: 2, amount: 200.0, total_due: 150.0,
          status: "Open", product_id: 1
        },
        {
          id: 15, date: "2024-01-08", due_date: "2024-01-12", quantity: 2,
          advance_received: 20.0, customer_id: 3, amount: 80.0, total_due: 60.0,
          status: "Open", product_id: 2
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
      
      // Get top 5 receipts by total due amount
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

  const getOverdueBadgeColor = (days: number) => {
    if (days > 30) return 'danger';
    if (days > 7) return 'warning';
    return 'medium';
  };

  const getOverdueText = (days: number) => {
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day overdue';
    return `${days} days overdue`;
  };

  const getStatusBadge = (receipt: TopReceipt) => {
    if (receipt.is_overdue) {
      return (
        <IonBadge 
          color={getOverdueBadgeColor(receipt.days_overdue)}
          style={{ fontSize: '0.7rem', fontWeight: '600' }}
        >
          {getOverdueText(receipt.days_overdue)}
        </IonBadge>
      );
    }
    
    const dueDate = new Date(receipt.due_date);
    const today = new Date();
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 7) {
      return (
        <IonBadge color="warning" style={{ fontSize: '0.7rem', fontWeight: '600' }}>
          Due in {daysUntilDue} days
        </IonBadge>
      );
    }
    
    return (
      <IonBadge color="success" style={{ fontSize: '0.7rem', fontWeight: '600' }}>
        On track
      </IonBadge>
    );
  };

  // Calculate dashboard stats
  const totalReceipts = allReceipts.length;
  const totalRevenue = allReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const pendingAmount = allReceipts
    .filter(receipt => receipt.status === 'Open')
    .reduce((sum, receipt) => sum + receipt.total_due, 0);
  const overdueReceipts = allReceipts.filter(receipt => receipt.is_overdue).length;

  // Get receipts for display based on active tab
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
            <IonTitle>Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" fullscreen>
        {/* Hero Section */}
        <div className="dashboard-hero fade-in-up">
          <div className="hero-content">
            <h1 className="hero-title">Sales Dashboard</h1>
            <p className="hero-subtitle">Track payments and manage receipts</p>
            
            <div className="stats-grid">
              <div className="stat-card pulse-glow">
                <div className="stat-value">{totalReceipts}</div>
                <div className="stat-label">Total Receipts</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatCurrency(totalRevenue)}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatCurrency(pendingAmount)}</div>
                <div className="stat-label">Pending Amount</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{overdueReceipts}</div>
                <div className="stat-label">Overdue</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <IonButton 
            className="action-btn" 
            routerLink="/add-receipt"
            expand="block"
          >
            📝 Create Receipt
          </IonButton>
          <IonButton 
            className="action-btn secondary" 
            routerLink="/receipts"
            expand="block"
          >
            📋 View Receipts
          </IonButton>
          <IonButton 
            className="action-btn success" 
            routerLink="/add-customer"
            expand="block"
          >
            👥 Add Customer
          </IonButton>
        </div>

        {/* Main Content Grid */}
        <IonGrid>
          <IonRow>
            {/* Top Customers Section */}
            <IonCol size="12" size-lg="6">
              <div className="dashboard-section">
                <div className="section-header">
                  <h2 className="section-title">Top 5 Customers</h2>
                  <IonButton fill="clear" routerLink="/customers">
                    View All
                  </IonButton>
                </div>

                <div className="dashboard-card slide-in-left">
                  <div className="card-header">
                    <div className="card-icon">👑</div>
                    <h3 className="card-title">Highest Due Amount</h3>
                  </div>

                  {topCustomers.length > 0 ? (
                    <div className="ranking-list">
                      {topCustomers.map((customer, index) => (
                        <div key={customer.customer_id} className="ranking-item">
                          <div className={`rank-badge rank-${index + 1}`}>
                            {index + 1}
                          </div>
                          <div className="customer-info">
                            <div className="customer-name">{customer.name}</div>
                            <small>Customer ID: {customer.customer_id}</small>
                          </div>
                          <div className="amount-badge">
                            {formatCurrency(customer.total_due)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📊</div>
                      <p>No customer data available</p>
                    </div>
                  )}
                </div>
              </div>
            </IonCol>

            {/* Top Receipts Section */}
            <IonCol size="12" size-lg="6">
              <div className="dashboard-section">
                <div className="section-header">
                  <h2 className="section-title">Top 5 Receipts</h2>
                  <IonButton fill="clear" routerLink="/receipts">
                    View All
                  </IonButton>
                </div>

                <div className="dashboard-card slide-in-left">
                  <div className="card-header">
                    <div className="card-icon">💰</div>
                    <h3 className="card-title">
                      {activeTab === 'overdue' ? 'Overdue Receipts' : 'Highest Due Amount'}
                    </h3>
                  </div>

                  {/* Tab Switcher */}
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <IonButton 
                      fill={activeTab === 'all' ? 'solid' : 'outline'}
                      size="small"
                      onClick={() => setActiveTab('all')}
                    >
                      Top Amounts
                    </IonButton>
                    <IonButton 
                      fill={activeTab === 'overdue' ? 'solid' : 'outline'}
                      size="small"
                      onClick={() => setActiveTab('overdue')}
                    >
                      Overdue
                    </IonButton>
                  </div>

                  {displayReceipts.length > 0 ? (
                    <div className="ranking-list">
                      {displayReceipts.map((receipt, index) => (
                        <div key={receipt.id} className="ranking-item">
                          <div className={`rank-badge rank-${index + 1}`}>
                            {index + 1}
                          </div>
                          <div className="customer-info" style={{ flex: 2 }}>
                            <div className="customer-name">{receipt.customer_name}</div>
                            <small>
                              Due: {formatDate(receipt.due_date)} • 
                              Receipt #{receipt.id}
                            </small>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <div className="amount-badge">
                              {formatCurrency(receipt.total_due)}
                            </div>
                            {getStatusBadge(receipt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activeTab === 'overdue' ? (
                    <div className="empty-state">
                      <div className="empty-icon">🎉</div>
                      <p>No overdue receipts! Great job!</p>
                      <small>All payments are up to date</small>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📄</div>
                      <p>No receipt data available</p>
                    </div>
                  )}
                </div>
              </div>
            </IonCol>
          </IonRow>

          {/* All Receipts Section */}
          <IonRow>
            <IonCol size="12">
              <div className="dashboard-section">
                <div className="section-header">
                  <h2 className="section-title">All Receipts</h2>
                  <IonButton fill="clear" routerLink="/receipts">
                    View Detailed List
                  </IonButton>
                </div>
                
                <div className="dashboard-card">
                  <div className="card-header">
                    <div className="card-icon">📋</div>
                    <h3 className="card-title">Complete Receipt List</h3>
                  </div>
                  
                  {allReceipts.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {allReceipts.map((receipt) => (
                        <IonItem key={receipt.id} lines="full">
                          <IonLabel>
                            <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>
                              {receipt.customer_name} 
                              <IonBadge 
                                color={receipt.is_overdue ? 'danger' : 'success'} 
                                style={{ marginLeft: '8px', fontSize: '0.7rem' }}
                              >
                                #{receipt.id}
                              </IonBadge>
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>
                              Due: {formatDate(receipt.due_date)} • 
                              Amount: {formatCurrency(receipt.amount)} • 
                              Due: {formatCurrency(receipt.total_due)}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: '#999' }}>
                              Created: {formatDate(receipt.date)} • 
                              Status: {receipt.status}
                            </p>
                          </IonLabel>
                          <div slot="end" style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '4px' }}>
                              {formatCurrency(receipt.total_due)}
                            </div>
                            {getStatusBadge(receipt)}
                          </div>
                        </IonItem>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📄</div>
                      <p>No receipts found</p>
                      <IonButton routerLink="/add-receipt" className="mt-3">
                        Create First Receipt
                      </IonButton>
                    </div>
                  )}
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Error Message */}
        {error && (
          <div className="dashboard-card" style={{ borderColor: '#fed7d7', background: '#fff5f5' }}>
            <div style={{ textAlign: 'center', color: '#c53030' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{ marginBottom: '0.5rem' }}>Connection Issue</h3>
              <p>{error}</p>
              <IonButton className="mt-3" onClick={loadDashboardData}>
                Retry Loading
              </IonButton>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;