import { useEffect } from "react";
import "../App.css";

function WarningToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="warning-toast">
      <span className="warning-icon">⚠️</span>
      <span className="warning-message">{message}</span>
      <button className="warning-close" onClick={onClose}>×</button>
    </div>
  );
}

export default WarningToast;
