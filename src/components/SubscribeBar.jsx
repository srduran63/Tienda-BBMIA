import React from 'react';
const SubscribeBar = ({ colors, showNotification }) => (
  <div style={{ backgroundColor: colors.bgSurface }}>
    <h3>Suscríbete al Newsletter</h3>
    <button onClick={() => showNotification('Suscripción exitosa', colors.acentoVerde)}>Suscribirse</button>
  </div>
);
export default SubscribeBar;
