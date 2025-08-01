import { useState } from "react";

const DrawingToolbar = ({ 
  activeTool, 
  setActiveTool, 
  brushSize, 
  setBrushSize, 
  brushColor, 
  setBrushColor,
  onClearCanvas,
  onSaveAsPNG,
  onSaveAsJPG 
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const tools = [
    { id: 'pen', name: 'Pen', icon: '✏️', cursor: 'crosshair' },
    { id: 'eraser', name: 'Eraser', icon: '🧽', cursor: 'pointer' },
    { id: 'line', name: 'Line', icon: '📏', cursor: 'crosshair' },
    { id: 'rectangle', name: 'Rectangle', icon: '⬜', cursor: 'crosshair' },
    { id: 'circle', name: 'Circle', icon: '⭕', cursor: 'crosshair' },
  ];

  const predefinedColors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
    '#800080', '#FFC0CB', '#A52A2A', '#808080'
  ];

  const brushSizes = [1, 2, 5, 10, 15, 20, 30];

  return (
    <div className="drawing-toolbar">
      <div className="toolbar-section">
        <h4>🛠️ Tools</h4>
        <div className="tool-grid">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => setActiveTool(tool.id)}
              title={tool.name}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-name">{tool.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <h4>🎨 Color</h4>
        <div className="color-section">
          <button
            className="color-preview"
            style={{ backgroundColor: brushColor }}
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Choose color"
          >
            <span className="color-text">{brushColor}</span>
          </button>
          
          {showColorPicker && (
            <div className="color-picker">
              <div className="predefined-colors">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    className={`color-option ${brushColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setBrushColor(color);
                      setShowColorPicker(false);
                    }}
                    title={color}
                  />
                ))}
              </div>
              <div className="custom-color">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="color-input"
                />
                <label>Custom</label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-section">
        <h4>📏 Size</h4>
        <div className="size-section">
          <div className="size-slider">
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="slider"
            />
            <div className="size-display">
              <span className="size-value">{brushSize}px</span>
              <div 
                className="size-preview"
                style={{
                  width: Math.min(brushSize, 30),
                  height: Math.min(brushSize, 30),
                  backgroundColor: brushColor
                }}
              />
            </div>
          </div>
          
          <div className="size-presets">
            {brushSizes.map((size) => (
              <button
                key={size}
                className={`size-btn ${brushSize === size ? 'active' : ''}`}
                onClick={() => setBrushSize(size)}
                title={`${size}px`}
              >
                <div 
                  className="size-dot"
                  style={{
                    width: Math.min(size, 20),
                    height: Math.min(size, 20),
                    backgroundColor: brushColor
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="toolbar-section">
        <h4>🗑️ Actions</h4>
        <div className="action-buttons">
          <button 
            className="action-btn clear-btn"
            onClick={onClearCanvas}
            title="Clear canvas"
          >
            🗑️ Clear All
          </button>
          <button 
            className="action-btn save-btn"
            onClick={onSaveAsPNG}
            title="Save as PNG (high quality)"
          >
            💾 Save PNG
          </button>
          <button 
            className="action-btn save-btn"
            onClick={onSaveAsJPG}
            title="Save as JPG (smaller file)"
          >
            📄 Save JPG
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawingToolbar;