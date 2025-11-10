import React from 'react';
const Cart = ({ cart, colors, shippingOption, SHIPPING_OPTIONS, cartTotal, buying, handleUpdateQuantity, handleRemoveFromCart, setShippingOption, handleCheckoutWithOrder, setShowCart }) => (
  <div>
    <h2>Carrito</h2>
    {cart.map(item => (
      <div key={item.id}>
        <p>{item.name} - ${item.price} x {item.quantity}</p>
        <button onClick={() => handleRemoveFromCart(item.id, item.size)}>Eliminar</button>
      </div>
    ))}
    <p>Total: ${cartTotal}</p>
    <button onClick={handleCheckoutWithOrder}>Pagar</button>
    <button onClick={() => setShowCart(false)}>Cerrar</button>
  </div>
);
export default Cart;
