import React from 'react';
const LuckyWheel = ({ profile, setProfile, colors, showNotification, intervalDays, isModal, onClose }) => (
  <div>
    <h3>Rueda de la Suerte</h3>
    {isModal && <button onClick={onClose}>Cerrar</button>}
  </div>
);
export default LuckyWheel;
