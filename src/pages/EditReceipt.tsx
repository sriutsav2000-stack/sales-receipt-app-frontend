import React, { useEffect, useState } from "react";
import { 
  useParams, 
  useLocation,
  useHistory 
} from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonToast,
  IonLoading
} from "@ionic/react";
import { api } from "../services/api";
import Navigation from "../components/Navigation";
import ReceiptForm from "./ReceiptForm";

interface LocationState {
  dummyData?: any;
  isFromCamera?: boolean;
  scannedData?: any;
}

const EditReceipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation<LocationState>();
  const history = useHistory();
  
  const [isLoading, setIsLoading] = useState(true);
  const [dummyData, setDummyData] = useState<any>(null);
  const [isFromCamera, setIsFromCamera] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    checkReceiptAndLoadData();
  }, [id, location.state]);

  const checkReceiptAndLoadData = async () => {
    try {
      setIsLoading(true);
      
      // Check if we have data from camera scan
      const locationState = location.state as LocationState;
      
      if (locationState?.scannedData) {
        console.log("📸 Processing camera scan data:", locationState.scannedData);
        
        // For camera scans, we generate a temporary ID since receipt doesn't exist yet
        const tempId = Date.now(); // Generate a temporary unique ID
        const scannedData = locationState.scannedData;
        
        setDummyData({
          id: tempId,
          date: scannedData.date || new Date().toISOString().split('T')[0],
          due_date: scannedData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          quantity: scannedData.quantity || 1,
          advance_received: scannedData.advance_received || 0,
          customer_id: scannedData.customer_id || 1,
          amount: scannedData.amount || 0,
          total_due: scannedData.total_due || 0,
          status: scannedData.status || "Open",
          product_id: scannedData.product_id || 1,
          product_name: scannedData.product_name || "Scanned Product",
          product_price: scannedData.product_price || 0
        });
        
        setIsFromCamera(true);
        setToastMessage("📸 Receipt data loaded from camera scan");
        setShowToast(true);
        
        setIsLoading(false);
        return;
      }
      
      if (locationState?.dummyData && locationState?.isFromCamera) {
        console.log("📸 Processing legacy camera data:", locationState.dummyData);
        
        // Legacy format support
        setDummyData({
          id: parseInt(id) || Date.now(),
          ...locationState.dummyData
        });
        
        setIsFromCamera(true);
        setToastMessage("📸 Receipt data loaded from camera scan");
        setShowToast(true);
        
        setIsLoading(false);
        return;
      }
      
      // Try to load existing receipt
      console.log(`📥 Attempting to load receipt ${id}...`);
      
      try {
        const receipt = await api.getReceipt(parseInt(id));
        console.log("✅ Existing receipt found:", receipt);
        
        // Load customer and product details for existing receipt
        const [customerData, productData] = await Promise.all([
          api.getCustomer(receipt.customer_id).catch(() => ({ name: 'Unknown Customer' })),
          api.getProduct(receipt.product_id).catch(() => ({ name: 'Unknown Product', price: 0 }))
        ]);
        
        const enhancedReceipt = {
          ...receipt,
          customer_name: customerData.name,
          product_name: productData.name,
          product_price: productData.price || 0
        };
        
        setDummyData(enhancedReceipt);
        setIsFromCamera(false);
        
      } catch (error) {
        console.log("ℹ️ Receipt doesn't exist yet, creating new from ID:", id);
        
        // Create new receipt with default data
        setDummyData({
          id: parseInt(id),
          date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          quantity: 1,
          advance_received: 0,
          customer_id: 1,
          amount: 0,
          total_due: 0,
          status: "Open",
          product_id: 1,
          product_name: "New Product",
          product_price: 0
        });
        
        setIsFromCamera(true);
        setToastMessage("📝 Creating new receipt");
        setShowToast(true);
      }
      
    } catch (error) {
      console.error("❌ Error checking receipt:", error);
      setToastMessage("Failed to load receipt data");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <Navigation title="Loading..." />
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <div className="scanner-animation">
              <div className="scanner-beam"></div>
              <div className="document-icon">📄</div>
            </div>
            <h4 className="mt-4">
              {isFromCamera ? "Processing scanned receipt..." : "Loading receipt..."}
            </h4>
            <p className="text-muted">
              {isFromCamera 
                ? "Extracting data from your photo..." 
                : "Fetching receipt details..."}
            </p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        {/* <Navigation title={isFromCamera ? "Create from Scan" : "Edit Receipt"} /> */}
      </IonHeader>
      
      <IonContent>
        {dummyData ? (
          <ReceiptForm 
            receiptId={dummyData.id}
            mode="edit"
            dummyData={dummyData}
            isFromCamera={isFromCamera}
          />
        ) : (
          <div className="text-center py-5">
            <p>Failed to load receipt data</p>
            <button 
              className="btn btn-primary"
              onClick={() => history.push('/add-receipt')}
            >
              Create New Receipt
            </button>
          </div>
        )}
        
        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setShowToast(false)}
          position="top"
          color="primary"
        />
      </IonContent>
    </IonPage>
  );
};

export default EditReceipt;