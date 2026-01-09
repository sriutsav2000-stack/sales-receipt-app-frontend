// src/pages/Customers.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonLoading,
  IonToast,
  IonSearchbar,
  IonItem,
  IonLabel,
  IonList,
  IonAvatar,
  IonBadge,
  IonButtons,
  IonMenuButton,
  IonFab,
  IonFabButton,
  IonActionSheet,
  IonAlert
} from "@ionic/react";
import { add, person, call, mail, business, trash, create, eye, chevronForward } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { api } from "../services/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserPlus, faReceipt, faPhone, faEnvelope, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import Navigation from "../components/Navigation";

interface Customer {
  id: number;
  name: string;
  contact?: string;
  email?: string;
  address?: string;
  created_at?: string;
  // Add receipt count if available from API
  receipt_count?: number;
}

const Customers: React.FC = () => {
  const history = useHistory();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter customers when search text changes
  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (customer.contact && customer.contact.includes(searchText)) ||
        (customer.email && customer.email.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchText, customers]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      console.log("📥 Loading customers...");
      const data = await api.getCustomers();
      console.log("✅ Customers loaded:", data);
      
      // If data is an array, use it directly
      if (Array.isArray(data)) {
        setCustomers(data);
        setFilteredCustomers(data);
      } else {
        console.error("❌ Unexpected customer data format:", data);
        setCustomers([]);
        setFilteredCustomers([]);
      }
    } catch (err: any) {
      console.error("❌ Failed to load customers:", err);
      setError("Failed to load customers. Please try again.");
      setToastMessage("❌ Failed to load customers");
      setShowToast(true);
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = () => {
    history.push("/add-customer");
  };

  const handleViewCustomer = (customer: Customer) => {
    history.push(`/customer/${customer.id}`);
  };

  const handleEditCustomer = (customer: Customer) => {
    // You can implement edit functionality here
    // For now, redirect to add-customer with edit mode
    history.push(`/add-customer?edit=${customer.id}`);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteAlert(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      // Note: Your backend has delete endpoint but api.ts doesn't have deleteCustomer method
      // You need to add deleteCustomer to your api.ts first
      // For now, I'll show you how to implement it
      
      // First, add this to your api.ts:
      /*
      deleteCustomer: (id: number) => {
        return request(`customers/${id}`, { method: "DELETE" });
      },
      */
      
      // Then uncomment this:
      // await api.deleteCustomer(customerToDelete.id);
      
      // For now, just show a message
      setToastMessage(`Delete functionality needs to be implemented in api.ts`);
      setShowToast(true);
      
      // Remove from local state
      setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
      setCustomerToDelete(null);
      
    } catch (err: any) {
      console.error("❌ Failed to delete customer:", err);
      setToastMessage("❌ Failed to delete customer");
      setShowToast(true);
    }
  };

  const handleCustomerActions = (customer: Customer, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedCustomer(customer);
    setShowActionSheet(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomColor = (id: number) => {
    const colors = [
      'bg-primary', 'bg-secondary', 'bg-success', 
      'bg-danger', 'bg-warning', 'bg-info', 'bg-dark'
    ];
    return colors[id % colors.length];
  };

  // Function to add deleteCustomer to api.ts
  const addDeleteMethodToApi = () => {
    console.log("Add this to your api.ts in the export const api object:");
    console.log(`
      deleteCustomer: (id: number) => {
        return request(\`customers/\${id}\`, { method: "DELETE" });
      },
    `);
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <Navigation title="Customers" />
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading customers...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <Navigation title="Customers" />
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="container-fluid">
          {/* Header Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h1 className="h3 fw-bold mb-1 gradient-text">
                    <FontAwesomeIcon icon={faUsers} className="me-2" />
                    Customers
                  </h1>
                  <p className="text-muted mb-0">
                    {customers.length} customer{customers.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                <IonButton 
                  onClick={handleAddCustomer}
                  className="btn-elegant btn-elegant-primary"
                >
                  <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                  Add Customer
                </IonButton>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="elegant-card p-3">
                <IonSearchbar
                  value={searchText}
                  onIonChange={e => setSearchText(e.detail.value || '')}
                  placeholder="Search customers by name, phone, or email..."
                  animated
                  className="custom-searchbar"
                />
              </div>
            </div>
          </div>

          {/* Customers List */}
          <div className="row">
            <div className="col-12">
              {filteredCustomers.length === 0 ? (
                <div className="elegant-card p-5 text-center">
                  <div className="mb-4">
                    <FontAwesomeIcon 
                      icon={faUsers} 
                      size="4x" 
                      className="text-muted opacity-50" 
                    />
                  </div>
                  <h4 className="fw-bold mb-3">No customers found</h4>
                  <p className="text-muted mb-4">
                    {searchText ? 'Try a different search term' : 'Get started by adding your first customer'}
                  </p>
                  {!searchText && (
                    <IonButton 
                      onClick={handleAddCustomer}
                      className="btn-elegant btn-elegant-primary"
                    >
                      <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                      Add Your First Customer
                    </IonButton>
                  )}
                </div>
              ) : (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                  {filteredCustomers.map(customer => (
                    <div key={customer.id} className="col">
                      <div 
                        className="elegant-card h-100 customer-card"
                        onClick={() => handleViewCustomer(customer)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex align-items-center">
                            <div className={`customer-avatar ${getRandomColor(customer.id)} me-3`}>
                              {getInitials(customer.name)}
                            </div>
                            <div>
                              <h5 className="fw-bold mb-1">{customer.name}</h5>
                              <small className="text-muted">
                                Added {formatDate(customer.created_at)}
                              </small>
                            </div>
                          </div>
                          <IonButton
                            fill="clear"
                            size="small"
                            onClick={(e) => handleCustomerActions(customer, e)}
                            className="text-muted"
                          >
                            <IonIcon icon={chevronForward} />
                          </IonButton>
                        </div>

                        <div className="customer-info mb-3">
                          {customer.contact && (
                            <div className="d-flex align-items-center mb-2">
                              <FontAwesomeIcon 
                                icon={faPhone} 
                                className="text-primary me-2" 
                                size="sm" 
                              />
                              <span className="text-muted small">{customer.contact}</span>
                            </div>
                          )}
                          {customer.email && (
                            <div className="d-flex align-items-center mb-2">
                              <FontAwesomeIcon 
                                icon={faEnvelope} 
                                className="text-primary me-2" 
                                size="sm" 
                              />
                              <span className="text-muted small">{customer.email}</span>
                            </div>
                          )}
                          {customer.address && (
                            <div className="d-flex align-items-center">
                              <FontAwesomeIcon 
                                icon={faMapMarkerAlt} 
                                className="text-primary me-2" 
                                size="sm" 
                              />
                              <span className="text-muted small">{customer.address}</span>
                            </div>
                          )}
                        </div>

                        <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                          <IonButton
                            fill="clear"
                            size="small"
                            onClick={() => handleViewCustomer(customer)}
                            className="text-primary"
                          >
                            <FontAwesomeIcon icon={faReceipt} className="me-1" />
                            View Receipts
                          </IonButton>
                          <div className="d-flex gap-2">
                            <IonButton
                              fill="clear"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCustomer(customer);
                              }}
                              className="text-warning"
                            >
                              <IonIcon icon={create} size="small" />
                            </IonButton>
                            <IonButton
                              fill="clear"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomer(customer);
                              }}
                              className="text-danger"
                            >
                              <IonIcon icon={trash} size="small" />
                            </IonButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats Summary */}
          {customers.length > 0 && (
            <div className="row mt-5">
              <div className="col-12">
                <div className="elegant-card p-4 bg-gradient-primary text-white">
                  <h5 className="fw-bold mb-3">Customer Summary</h5>
                  <div className="row text-center">
                    <div className="col-6 col-md-3 mb-3">
                      <div className="h3 fw-bold">{customers.length}</div>
                      <div className="small opacity-75">Total Customers</div>
                    </div>
                    <div className="col-6 col-md-3 mb-3">
                      <div className="h3 fw-bold">
                        {customers.filter(c => c.contact).length}
                      </div>
                      <div className="small opacity-75">With Contact</div>
                    </div>
                    <div className="col-6 col-md-3 mb-3">
                      <div className="h3 fw-bold">
                        {customers.filter(c => c.email).length}
                      </div>
                      <div className="small opacity-75">With Email</div>
                    </div>
                    <div className="col-6 col-md-3 mb-3">
                      <div className="h3 fw-bold">
                        {customers.filter(c => c.address).length}
                      </div>
                      <div className="small opacity-75">With Address</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAB for quick add */}
          {/* <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={handleAddCustomer}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab> */}
        </div>

        {/* Action Sheet */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header={selectedCustomer?.name}
          buttons={[
            {
              text: 'View Details',
              icon: eye,
              handler: () => {
                if (selectedCustomer) {
                  handleViewCustomer(selectedCustomer);
                }
              }
            },
            {
              text: 'Edit Customer',
              icon: create,
              handler: () => {
                if (selectedCustomer) {
                  handleEditCustomer(selectedCustomer);
                }
              }
            },
            {
              text: 'Delete Customer',
              icon: trash,
              role: 'destructive',
              handler: () => {
                if (selectedCustomer) {
                  handleDeleteCustomer(selectedCustomer);
                }
              }
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />

        {/* Delete Confirmation Alert */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete Customer"
          message={`Are you sure you want to delete ${customerToDelete?.name}? This action cannot be undone.`}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: 'Delete',
              role: 'destructive',
              handler: confirmDeleteCustomer
            }
          ]}
        />

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setShowToast(false)}
          position="top"
          color={toastMessage.includes("❌") ? "danger" : "success"}
        />

        <IonLoading isOpen={isLoading} message="Loading..." />
      </IonContent>
    </IonPage>
  );
};

export default Customers;