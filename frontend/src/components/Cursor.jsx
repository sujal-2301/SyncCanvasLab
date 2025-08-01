import { useState, useEffect } from "react";

const Cursor = ({ userId, name, color, x, y, visible }) => {
  const [showLabel, setShowLabel] = useState(true);

  useEffect(() => {
    // Hide label after 3 seconds of no movement
    const timer = setTimeout(() => {
      setShowLabel(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [x, y]);

  if (!visible) return null;

  return (
    <div
      className="remote-cursor"
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-2px, -2px)",
        pointerEvents: "none",
        zIndex: 1000,
        transition: "all 0.1s ease-out",
      }}
    >
      {/* Cursor pointer */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 0L20 7.5L7.5 20L0 0Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      {/* User label */}
      {showLabel && (
        <div
          className="cursor-label"
          style={{
            position: "absolute",
            left: "18px",
            top: "-8px",
            background: color,
            color: "white",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {name}
        </div>
      )}
    </div>
  );
};

export default Cursor;
