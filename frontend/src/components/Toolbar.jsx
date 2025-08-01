import { useState } from "react";

const Toolbar = ({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#008000",
  ];

  const tools = [
    { id: "pen", name: "Pen", icon: "✏️" },
    { id: "eraser", name: "Eraser", icon: "🧽" },
    { id: "select", name: "Select", icon: "👆" },
  ];

  return (
    <div className="toolbar">
      {/* Tools */}
      <div className="tool-group">
        {tools.map((t) => (
          <button
            key={t.id}
            className={`tool-btn ${tool === t.id ? "active" : ""}`}
            onClick={() => setTool(t.id)}
            title={t.name}
          >
            {t.icon}
          </button>
        ))}
      </div>

      {/* Colors */}
      <div className="tool-group">
        <button
          className="color-btn"
          onClick={() => setShowColorPicker(!showColorPicker)}
          style={{ backgroundColor: color }}
          title="Color"
        />
        {showColorPicker && (
          <div className="color-picker">
            {colors.map((c) => (
              <button
                key={c}
                className="color-option"
                style={{ backgroundColor: c }}
                onClick={() => {
                  setColor(c);
                  setShowColorPicker(false);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Brush Size */}
      <div className="tool-group">
        <label htmlFor="brush-size">Size: {brushSize}</label>
        <input
          type="range"
          id="brush-size"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="brush-slider"
        />
      </div>

      {/* Actions */}
      <div className="tool-group">
        <button className="action-btn" title="Clear Canvas">
          🗑️
        </button>
        <button className="action-btn" title="Undo">
          ↶
        </button>
        <button className="action-btn" title="Redo">
          ↷
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
