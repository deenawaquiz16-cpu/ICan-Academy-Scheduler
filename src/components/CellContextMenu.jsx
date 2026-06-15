import { useEffect, useRef } from "react";
import "../App.css";

function CellContextMenu({ x, y, day, isBlocked, isDayBlocked, onAddClass, onBlockSlot, onBlockRange, onBlockUntilEndOfDay, onCustomBlock, onUnblockSlot, onBlockDay, onUnblockDay, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Adjust position if menu would go off-screen
  const menuStyle = {
    position: "fixed",
    left: Math.min(x, window.innerWidth - 220),
    top: Math.min(y, window.innerHeight - 250),
  };

  return (
    <div className="context-menu-overlay" onClick={onClose}>
      <div className="context-menu" style={menuStyle} ref={menuRef} onClick={(e) => e.stopPropagation()}>
        {!isBlocked && (
          <button className="context-menu-item primary" onClick={onAddClass}>
            📝 Add Class
          </button>
        )}

        {isBlocked ? (
          <button className="context-menu-item unblock" onClick={onUnblockSlot}>
            🔓 Unblock This Time
          </button>
        ) : (
          <>
            <button className="context-menu-item block" onClick={onBlockSlot}>
              🔒 Block This Time (30m)
            </button>
            <button className="context-menu-item block" onClick={() => onBlockRange(50)}>
              🔒 Block 1 Hour
            </button>
            <button className="context-menu-item block" onClick={() => onBlockRange(100)}>
              🔒 Block 2 Hours
            </button>
            <button className="context-menu-item block" onClick={onBlockUntilEndOfDay}>
              ⏳ Block Rest of Day
            </button>
            <button className="context-menu-item block" onClick={onCustomBlock}>
              🛠️ Custom Block...
            </button>
          </>
        )}

        <div className="context-menu-divider" />

        {isDayBlocked ? (
          <button className="context-menu-item unblock" onClick={onUnblockDay}>
            🔓 Unblock {dayName(day)}
          </button>
        ) : (
          <button className="context-menu-item block" onClick={onBlockDay}>
            🚫 Block All {dayName(day)}
          </button>
        )}
      </div>
    </div>
  );
}

function dayName(d) {
  const names = {
    Monday: "Monday",
    Tuesday: "Tuesday",
    Wednesday: "Wednesday",
    Thursday: "Thursday",
    Friday: "Friday",
    Saturday: "Saturday",
    Sunday: "Sunday",
  };
  return names[d] || d;
}

export default CellContextMenu;
