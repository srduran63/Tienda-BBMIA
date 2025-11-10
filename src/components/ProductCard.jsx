import React from 'react';
const ProductCard = ({ product, colors, setSelectedProduct, setSelectedImageIndex, setSelectedSize, handleAddToCart, handleAddToWishlist, showNotification, trackProductView }) => (
  <div onClick={() => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
    trackProductView(product);
  }}>
    <h3>{product.name}</h3>
    <p>${product.price}</p>
    <button onClick={() => handleAddToCart(product)}>Añadir al Carrito</button>
    <button onClick={() => handleAddToWishlist(product)}>Añadir a Favoritos</button>
  </div>
);
export default ProductCard;
