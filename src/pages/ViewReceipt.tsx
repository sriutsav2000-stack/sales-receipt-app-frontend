import React from "react";
import { useParams } from "react-router-dom";
import ReceiptForm from "./ReceiptForm";

const ViewReceipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <ReceiptForm 
      receiptId={parseInt(id)} 
      mode="view" 
    />
  );
};

export default ViewReceipt;