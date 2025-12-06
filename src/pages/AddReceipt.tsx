// AddReceipt.tsx - Elegant Redesign with Bootstrap
import React, { useEffect, useState, useRef } from "react";
import {
  IonPage,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonContent,
  IonToast,
  IonButton,
  useIonRouter,
  IonIcon,
} from "@ionic/react";
import { add, arrowBack, receipt, close, search, chevronDown } from "ionicons/icons";
import { api } from "../services/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRupeeSign, faCalendarAlt, faUser, faBox,faSearch,faArrowLeft, faShoppingCart, faDollarSign, faReceipt, faPlus, faTrash, faUndo, faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';

interface Customer {
  id: number;
  name: string;
  contact?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface ProductRow {
  product_id: number | null;
  product_name: string;
  quantity: number | null;
  original_price: number | null;
  current_price: number | null;
  show: boolean;
}

const STORAGE_KEY = "add_receipt_form_data";

const AddReceipt: React.FC = () => {
  const router = useIonRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const [productRows, setProductRows] = useState<ProductRow[]>([
    {
      product_id: null,
      product_name: "",
      quantity: null,
      original_price: null,
      current_price: null,
      show: false,
    },
  ]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: "Open",
    amount: "",
    advance_received: "",
  });

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Load from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const d = JSON.parse(saved);

      setFormData(
        d.formData || {
          date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "Open",
          amount: "",
          advance_received: "",
        }
      );

      setCustomerSearch(d.customerSearch || "");
      setSelectedCustomerId(d.selectedCustomerId || null);

      setProductRows(
        (d.productRows || []).map((row: any) => ({
          product_id: row.product_id ?? null,
          product_name: row.product_name ?? "",
          quantity: row.quantity ?? null,
          original_price: row.original_price ?? row.price ?? null,
          current_price: row.current_price ?? row.price ?? null,
          show: false,
        }))
      );
    }
  }, []);

  // Save to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        formData,
        customerSearch,
        selectedCustomerId,
        productRows,
      })
    );
  }, [formData, customerSearch, selectedCustomerId, productRows]);

  // Fetch customers + products
  useEffect(() => {
    const load = async () => {
      try {
        const [cust, prod] = await Promise.all([
          api.getCustomers(),
          api.getProducts(),
        ]);

        setCustomers(cust);
        setProducts(prod);
      } catch (err) {
        setToastMessage("Failed to load customer/product list.");
        setShowToast(true);
      }
    };

    load();
  }, []);

  // Add new product row
  const addProductRow = () => {
    setProductRows((prev) => [
      ...prev,
      {
        product_id: null,
        product_name: "",
        quantity: null,
        original_price: null,
        current_price: null,
        show: false,
      },
    ]);
  };

  const updateProductRow = (
    index: number,
    field: keyof ProductRow,
    value: any
  ) => {
    const updated = [...productRows];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'current_price' || field === 'quantity') {
      recalc(updated);
    }
    
    setProductRows(updated);
  };

  const deleteProductRow = (index: number) => {
    const updated = productRows.filter((_, i) => i !== index);
    setProductRows(updated);
    recalc(updated);
  };

  const recalc = (rows: ProductRow[]) => {
    let total = 0;
    rows.forEach((r) => {
      if (r.current_price && r.quantity) total += r.current_price * r.quantity;
    });
    setFormData((prev) => ({ ...prev, amount: String(total || "") }));
  };

  const resetPrice = (index: number) => {
    const updated = [...productRows];
    if (updated[index].original_price) {
      updated[index].current_price = updated[index].original_price;
      recalc(updated);
    }
    setProductRows(updated);
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const items = productRows
        .filter((r) => r.product_id && r.quantity)
        .map((r) => ({
          product_id: r.product_id!,
          quantity: r.quantity!,
          price: r.current_price!,
        }));

      await api.addReceipt({
        date: formData.date,
        due_date: formData.due_date,
        status: formData.status,
        amount: Number(formData.amount),
        advance_received: Number(formData.advance_received),
        customer_id: selectedCustomerId,
        items,
      });

      sessionStorage.removeItem(STORAGE_KEY);

      setFormData({
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "Open",
        amount: "",
        advance_received: "",
      });
      setCustomerSearch("");
      setSelectedCustomerId(null);
      setProductRows([{
        product_id: null,
        product_name: "",
        quantity: null,
        original_price: null,
        current_price: null,
        show: false,
      }]);

      setToastMessage("🎉 Receipt added successfully!");
      setShowToast(true);
    } catch (err) {
      setToastMessage("❌ Failed to add receipt.");
      setShowToast(true);
    }
  };

  const goToAddCustomer = () => router.push("/add-customer");
  const goToAddProduct = () => router.push("/add-product");

  const handleProductSelect = (index: number, product: Product) => {
    const updatedRows = productRows.map((row, i) => {
      if (i === index) {
        return {
          ...row,
          product_id: product.id,
          product_name: product.name,
          original_price: product.price,
          current_price: product.price,
          show: false
        };
      }
      return row;
    });
    
    setProductRows(updatedRows);
    recalc(updatedRows);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (showCustomerDropdown) {
        setShowCustomerDropdown(false);
      }

      const updatedRows = productRows.map(row => ({
        ...row,
        show: false
      }));
      setProductRows(updatedRows);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showCustomerDropdown, productRows]);

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleProductInputClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const updatedRows = productRows.map((row, i) => ({
      ...row,
      show: i === index ? true : false
    }));
    setProductRows(updatedRows);
  };

  return (
    <IonPage>
      <IonHeader className="glass-effect">
        <IonToolbar>
          <div className="container-fluid">
            <div className="d-flex align-items-center justify-content-between">
              <button 
                className="btn btn-link text-dark p-0" 
                onClick={() => router.goBack()}
                style={{ fontSize: '1.5rem' }}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <IonTitle className="text-center gradient-text">
                <FontAwesomeIcon icon={faReceipt} className="me-2" />
                New Receipt
              </IonTitle>
              <div style={{ width: '40px' }}></div>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="container-fluid fade-in-up">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10 col-xl-8">
              <div className="elegant-card p-4 p-md-5 mb-4">
                <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                  <div className="bg-primary bg-gradient p-3 rounded-circle me-3">
                    <FontAwesomeIcon icon={faReceipt} className="text-white" size="lg" />
                  </div>
                  <div>
                    <h1 className="h3 fw-bold mb-1 gradient-text">Create New Receipt</h1>
                    <p className="text-muted mb-0">Fill in the details to generate a receipt</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Dates Section */}
                  <div className="row mb-4">
                    <div className="col-12 col-md-6 mb-3 mb-md-0">
                      <label className="form-label fw-semibold mb-2">
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                        Issue Date
                      </label>
                      <div className="input-group">
                        <input
                          type="date"
                          className="form-control form-control-lg"
                          value={formData.date}
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold mb-2">
                        <FontAwesomeIcon icon={faClock} className="me-2" />
                        Due Date
                      </label>
                      <div className="input-group">
                        <input
                          type="date"
                          className="form-control form-control-lg"
                          value={formData.due_date}
                          onChange={(e) =>
                            setFormData({ ...formData, due_date: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Search */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-2">
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      Customer
                    </label>
                    <div className="position-relative">
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <FontAwesomeIcon icon={faSearch} />
                        </span>
                        <input
                          className="form-control border-start-0"
                          placeholder="Search customer by name..."
                          value={customerSearch}
                          onFocus={() => setShowCustomerDropdown(true)}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setShowCustomerDropdown(true);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button 
                          className="btn btn-outline-secondary" 
                          type="button"
                          onClick={goToAddCustomer}
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                      </div>

                      {showCustomerDropdown && customerSearch.trim() !== "" && (
                        <div className="dropdown-menu show w-100 mt-1 shadow" onClick={handleDropdownClick}>
                          {filteredCustomers.length ? (
                            filteredCustomers.map((cust) => (
                              <button
                                key={cust.id}
                                type="button"
                                className="dropdown-item d-flex justify-content-between align-items-center py-3"
                                onClick={() => {
                                  setCustomerSearch(cust.name);
                                  setSelectedCustomerId(cust.id);
                                  setShowCustomerDropdown(false);
                                }}
                              >
                                <span>{cust.name}</span>
                                <small className="text-muted">{cust.contact || 'No contact'}</small>
                              </button>
                            ))
                          ) : (
                            <div className="dropdown-item text-muted py-3 text-center">
                              No results found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {selectedCustomerId && (
                      <div className="mt-2">
                        <span className="badge bg-primary bg-gradient">
                          Selected: {customers.find(c => c.id === selectedCustomerId)?.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Products Section */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <label className="form-label fw-semibold mb-0">
                        <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                        Products
                      </label>
                      <span className="badge bg-secondary bg-gradient">
                        {productRows.length} item{productRows.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {productRows.map((row, index) => (
                      <div key={index} className="product-row elegant-card p-3 mb-3 position-relative">
                        <div className="row g-3">
                          {/* Product Search */}
                          <div className="col-12 col-md-5 position-relative">
                            <label className="form-label small fw-semibold text-uppercase text-muted">
                              Product
                            </label>
                            <div className="input-group">
                              <span className="input-group-text bg-light">
                                <FontAwesomeIcon icon={faBox} />
                              </span>
                              <input
                                className="form-control"
                                placeholder="Search product..."
                                value={row.product_name}
                                onFocus={() => {
                                  const updatedRows = productRows.map((r, i) => ({
                                    ...r,
                                    show: i === index ? true : false
                                  }));
                                  setProductRows(updatedRows);
                                }}
                                onChange={(e) => {
                                  const updatedRows = productRows.map((r, i) => ({
                                    ...r,
                                    product_name: i === index ? e.target.value : r.product_name,
                                    show: i === index ? true : false
                                  }));
                                  setProductRows(updatedRows);
                                }}
                                onClick={(e) => handleProductInputClick(e, index)}
                              />
                            </div>

                            {row.show && (
                              <div className="dropdown-menu show w-100 mt-1 shadow" onClick={handleDropdownClick}>
                                {products
                                  .filter((p) =>
                                    p.name.toLowerCase().includes(row.product_name.toLowerCase())
                                  )
                                  .map((prod) => (
                                    <button
                                      key={prod.id}
                                      type="button"
                                      className="dropdown-item d-flex justify-content-between align-items-center py-2"
                                      onClick={() => handleProductSelect(index, prod)}
                                    >
                                      <span>{prod.name}</span>
                                      <small className="text-muted">₹{prod.price}</small>
                                    </button>
                                  ))}

                                {products.filter(p => 
                                  p.name.toLowerCase().includes(row.product_name.toLowerCase())
                                ).length === 0 && (
                                  <div className="dropdown-item text-muted py-2 text-center">
                                    No products found
                                  </div>
                                )}

                                <div className="dropdown-divider"></div>
                                <button
                                  type="button"
                                  className="dropdown-item text-primary py-2"
                                  onClick={goToAddProduct}
                                >
                                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                                  Add New Product
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Quantity */}
                          <div className="col-12 col-md-2">
                            <label className="form-label small fw-semibold text-uppercase text-muted">
                              Quantity
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Qty"
                              value={row.quantity ?? ""}
                              onChange={(e) => {
                                const value = e.target.value === "" ? null : Number(e.target.value);
                                const updatedRows = productRows.map((r, i) => ({
                                  ...r,
                                  quantity: i === index ? value : r.quantity
                                }));
                                setProductRows(updatedRows);
                                recalc(updatedRows);
                              }}
                              min="1"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          {/* Prices */}
                          <div className="col-12 col-md-4">
                            <div className="row g-2">
                              <div className="col-6">
                                <label className="form-label small fw-semibold text-uppercase text-muted">
                                  Original
                                </label>
                                <div className="form-control bg-light border-0">
                                  {row.original_price ? `₹${row.original_price}` : '-'}
                                </div>
                              </div>
                              <div className="col-6">
                                <label className="form-label small fw-semibold text-uppercase text-muted">
                                  Selling
                                </label>
                                <div className="input-group">
                                  <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Price"
                                    value={row.current_price ?? ""}
                                    onChange={(e) => {
                                      const value = e.target.value === "" ? null : Number(e.target.value);
                                      updateProductRow(index, 'current_price', value);
                                    }}
                                    min="0"
                                    step="0.01"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  {row.original_price && row.current_price !== row.original_price && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        resetPrice(index);
                                      }}
                                      className="btn btn-outline-warning"
                                      title="Reset to original price"
                                    >
                                      <FontAwesomeIcon icon={faUndo} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Delete */}
                          <div className="col-12 col-md-1 d-flex align-items-end">
                            <button
                              type="button"
                              className="btn btn-outline-danger w-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteProductRow(index);
                              }}
                              title="Remove product"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>

                        {/* Subtotal */}
                        {row.current_price && row.quantity && (
                          <div className="mt-3 pt-3 border-top">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <span className="text-muted me-2">Subtotal:</span>
                                <span className="h5 fw-bold text-primary mb-0">
                                  ₹{(row.current_price * row.quantity).toFixed(2)}
                                </span>
                              </div>
                              {row.original_price && row.current_price !== row.original_price && (
                                <span className="badge bg-warning text-dark">
                                  Modified from ₹{row.original_price}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <button 
                      type="button"
                      className="btn btn-outline-primary w-100 mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        addProductRow();
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      Add Another Product
                    </button>
                  </div>

                  {/* Totals Section */}
                  <div className="elegant-card p-4 mb-4 bg-gradient-primary text-white">
                    <h5 className="fw-bold mb-4 text-center">
                      <FontAwesomeIcon icon={faDollarSign} className="me-2" />
                      Payment Summary
                    </h5>
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label small text-black-50 mb-1">Total Amount</label>
                        <div className="input-group">
                          <span className="input-group-text bg-white border-0">
                            <FontAwesomeIcon icon={faRupeeSign} />
                          </span>
                          <input
                            type="number"
                            className="form-control border-0 bg-white"
                            value={formData.amount}
                            onChange={(e) =>
                              setFormData({ ...formData, amount: e.target.value })
                            }
                            required
                            readOnly
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small text-black-50 mb-1">Advance Received</label>
                        <div className="input-group">
                          <span className="input-group-text bg-white border-0">
                            <FontAwesomeIcon icon={faRupeeSign} />
                          </span>
                          <input
                            type="number"
                            className="form-control border-0"
                            value={formData.advance_received}
                            onChange={(e) =>
                              setFormData({ ...formData, advance_received: e.target.value })
                            }
                            required
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label small text-black-50 mb-1">Balance Due</label>
                        <div className="input-group">
                          <span className="input-group-text bg-white border-0">
                            <FontAwesomeIcon icon={faRupeeSign} />
                          </span>
                          <input
                            type="number"
                            className="form-control border-0 fw-bold"
                            value={(Number(formData.amount) - Number(formData.advance_received || 0)).toFixed(2)}
                            readOnly
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-3">Status</label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="statusOpen"
                          checked={formData.status === "Open"}
                          onChange={() =>
                            setFormData({ ...formData, status: "Open" })
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label className="form-check-label" htmlFor="statusOpen">
                          <span className="d-flex align-items-center">
                            <span className="badge bg-warning bg-gradient me-2">●</span>
                            Open
                          </span>
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="statusClosed"
                          checked={formData.status === "Closed"}
                          onChange={() =>
                            setFormData({ ...formData, status: "Closed" })
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label className="form-check-label" htmlFor="statusClosed">
                          <span className="d-flex align-items-center">
                            <span className="badge bg-success bg-gradient me-2">●</span>
                            Closed
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <button 
                        type="submit" 
                        className="btn btn-elegant btn-elegant-primary w-100 py-3"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                        Create Receipt
                      </button>
                    </div>
                    <div className="col-12 col-md-6">
                      <button 
                        type="button"
                        className="btn btn-elegant btn-elegant-secondary w-100 py-3"
                        onClick={() => router.push('/receipts')}
                      >
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
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

export default AddReceipt;