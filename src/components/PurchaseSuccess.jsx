import React from 'react';
const PurchaseSuccess = ({ order, onClose }) => (
  <div>
    <h2>¡Compra Exitosa!</h2>
    <p>Orden ID: {order.id}</p>
    <button onClick={onClose}>Cerrar</button>
  </div>
);
export default PurchaseSuccess;
