import React from 'react';
const Wishlist = ({ wishlist, colors, handleRemoveFromWishlist, setShowWishlist }) => (
  <div>
    <h2>Lista de Deseos</h2>
    {wishlist.map(item => (
      <div key={item.id}>
        <p>{item.name}</p>
        <button onClick={() => handleRemoveFromWishlist(item.id)}>Eliminar</button>
      </div>
    ))}
    <button onClick={() => setShowWishlist(false)}>Cerrar</button>
  </div>
);
export default Wishlist;
