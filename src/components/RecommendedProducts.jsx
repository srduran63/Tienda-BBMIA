import React from 'react';
const RecommendedProducts = ({ user, products, onProductClick, colors, genderFilter, styleFilter, ProductCardProps }) => (
  <div>
    <h3>Productos Recomendados</h3>
    {products.slice(0, 3).map(product => (
      <div key={product.id} onClick={() => onProductClick(product)}>
        <h4>{product.name}</h4>
      </div>
    ))}
  </div>
);
export default RecommendedProducts;
