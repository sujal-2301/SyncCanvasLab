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
      className="absolute pointer-events-none z-50 transition-all duration-100 ease-out"
      style={{
        left: x,
        top: y,
        transform: "translate(-2px, -2px)",
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
          className="absolute left-4 -top-2 px-2 py-0.5 rounded-full text-xs font-medium text-white whitespace-nowrap shadow-lg animate-fade-in"
          style={{
            backgroundColor: color,
          }}
        >
          {name}
        </div>
      )}
    </div>
  );
};

export default Cursor;