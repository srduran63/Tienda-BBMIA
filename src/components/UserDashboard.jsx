import React from 'react';
const UserDashboard = ({ user, profile, setProfile, colors, showNotification, onClose, CATEGORY_LABELS, normalize }) => (
  <div>
    <h2>Perfil de {user.email}</h2>
    <button onClick={onClose}>Cerrar</button>
  </div>
);
export default UserDashboard;
