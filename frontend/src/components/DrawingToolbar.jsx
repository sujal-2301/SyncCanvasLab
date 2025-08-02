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
  onSaveAsJPG,
  isMobile = false,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const tools = [
    { id: "pen", name: "Pen", icon: "✏️", cursor: "crosshair" },
    { id: "eraser", name: "Eraser", icon: "🧽", cursor: "pointer" },
    { id: "line", name: "Line", icon: "📏", cursor: "crosshair" },
    { id: "rectangle", name: "Rectangle", icon: "⬜", cursor: "crosshair" },
    { id: "circle", name: "Circle", icon: "⭕", cursor: "crosshair" },
  ];

  const predefinedColors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
    "#A52A2A",
    "#808080",
  ];

  const brushSizes = [1, 2, 5, 10, 15, 20, 30];

  if (isMobile) {
    return (
      <div className="w-full">
        {/* Mobile Layout - Horizontal */}
        <div className="flex items-center gap-2 mb-3">
          {/* Tools */}
          <div className="flex gap-1">
            {tools.map((tool) => (
              <button
                key={tool.id}
                className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-lg transition-all duration-200 ${
                  activeTool === tool.id
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
                onClick={() => setActiveTool(tool.id)}
                title={tool.name}
              >
                {tool.icon}
              </button>
            ))}
          </div>

          {/* Color Picker */}
          <div className="relative">
            <button
              className="w-10 h-10 rounded-lg border-2 border-gray-200"
              style={{ backgroundColor: brushColor }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Choose color"
            />
            {showColorPicker && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
                <div className="grid grid-cols-3 gap-4 mb-3">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors duration-200"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setBrushColor(color);
                        setShowColorPicker(false);
                      }}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-600 text-center">
                  Tap to select color
                </div>
              </div>
            )}
          </div>

          {/* Size Slider */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-900 w-8 text-center">
              {brushSize}
            </span>
          </div>
        </div>

        {/* Mobile Actions Row */}
        <div className="flex gap-2">
          <button
            onClick={onClearCanvas}
            className="flex-1 px-3 py-2 bg-danger-50 text-danger-600 border border-danger-200 rounded-lg text-sm font-medium"
            title="Clear canvas"
          >
            🗑️
          </button>
          <button
            onClick={onSaveAsPNG}
            className="flex-1 px-3 py-2 bg-primary-50 text-primary-600 border border-primary-200 rounded-lg text-sm font-medium"
            title="Save PNG"
          >
            💾
          </button>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-lg w-full font-sans h-fit">
      {/* Tools Section */}
      <div className="mb-6 pb-5 border-b border-gray-100">
        <h4 className="m-0 mb-4 text-xs font-semibold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
          🛠️ Tools
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`flex items-center gap-2.5 px-3.5 py-3 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTool === tool.id
                  ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              }`}
              onClick={() => setActiveTool(tool.id)}
              title={tool.name}
            >
              <span className="text-base leading-none">{tool.icon}</span>
              <span className="text-xs">{tool.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Section */}
      <div className="mb-6 pb-5 border-b border-gray-100">
        <h4 className="m-0 mb-4 text-xs font-semibold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
          🎨 Color
        </h4>
        <div className="relative">
          <button
            className="w-full h-12 rounded-lg border-2 border-gray-200 flex items-center justify-between px-3 text-sm font-medium transition-all duration-200 hover:border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            style={{ backgroundColor: brushColor }}
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Choose color"
          >
            <span className="text-white text-shadow font-mono text-xs">
              {brushColor}
            </span>
            <svg
              className="w-4 h-4 text-white text-shadow"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 animate-slide-in">
              <div className="grid grid-cols-4 gap-2 mb-4">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                      brushColor === color
                        ? "border-primary-500 shadow-md"
                        : "border-gray-200"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setBrushColor(color);
                      setShowColorPicker(false);
                    }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="color-picker w-8 h-8 rounded-lg border border-gray-200 cursor-pointer"
                />
                <label className="text-xs font-medium text-gray-600">
                  Custom Color
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Size Section */}
      <div className="mb-6 pb-5 border-b border-gray-100">
        <h4 className="m-0 mb-4 text-xs font-semibold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
          📏 Size
        </h4>
        <div className="space-y-4">
          <div className="space-y-3">
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${
                  ((brushSize - 1) / 49) * 100
                }%, #e2e8f0 ${((brushSize - 1) / 49) * 100}%, #e2e8f0 100%)`,
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                {brushSize}px
              </span>
              <div
                className="rounded-full border border-gray-200"
                style={{
                  width: Math.min(brushSize, 30),
                  height: Math.min(brushSize, 30),
                  backgroundColor: brushColor,
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {brushSizes.map((size) => (
              <button
                key={size}
                className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  brushSize === size
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                onClick={() => setBrushSize(size)}
                title={`${size}px`}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: Math.min(size, 20),
                    height: Math.min(size, 20),
                    backgroundColor: brushColor,
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div>
        <h4 className="m-0 mb-4 text-xs font-semibold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
          🗑️ Actions
        </h4>
        <div className="space-y-2">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-danger-200 text-danger-600 bg-danger-50 rounded-lg text-sm font-medium transition-all duration-200 hover:border-danger-300 hover:bg-danger-100 focus:border-danger-500 focus:ring-2 focus:ring-danger-200"
            onClick={onClearCanvas}
            title="Clear canvas"
          >
            🗑️ Clear All
          </button>
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary-200 text-primary-600 bg-primary-50 rounded-lg text-sm font-medium transition-all duration-200 hover:border-primary-300 hover:bg-primary-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            onClick={onSaveAsPNG}
            title="Save as PNG (high quality)"
          >
            💾 Save PNG
          </button>
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary-200 text-primary-600 bg-primary-50 rounded-lg text-sm font-medium transition-all duration-200 hover:border-primary-300 hover:bg-primary-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            onClick={onSaveAsJPG}
            title="Save as JPG (smaller file)"
          >
            📄 Save JPG
          </button>
        </div>
      </div>

      <style jsx>{`
        .text-shadow {
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          background: #6366f1;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default DrawingToolbar;
