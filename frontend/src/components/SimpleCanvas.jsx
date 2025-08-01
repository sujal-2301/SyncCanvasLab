import { useEffect, useRef, useState } from "react";
import {
  Canvas,
  PencilBrush as FabricPencilBrush,
  Path,
  Line,
  Rect,
  Circle,
} from "fabric";
import Cursor from "./Cursor";
import DrawingToolbar from "./DrawingToolbar";
import { useThrottle } from "../hooks/useThrottle";

const SimpleCanvas = ({ socket, roomId }) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const canvasContainerRef = useRef(null);

  // State for remote cursors
  const [remoteCursors, setRemoteCursors] = useState(new Map());

  // Drawing tool states
  const [activeTool, setActiveTool] = useState("pen");
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState("#000000");

  // Shape drawing states using refs to avoid closure issues
  const isDrawingShapeRef = useRef(false);
  const shapeStartPointRef = useRef(null);
  const currentShapeRef = useRef(null);

  // Tool state refs to avoid stale closures in event handlers
  const activeToolRef = useRef(activeTool);
  const brushColorRef = useRef(brushColor);
  const brushSizeRef = useRef(brushSize);

  // Throttled cursor emission to prevent spam (moved outside useEffect)
  const throttledCursorEmit = useThrottle((x, y) => {
    socket.emit("cursor-move", {
      roomId,
      x,
      y,
      visible: true,
    });
  }, 50); // 50ms throttle = ~20fps

  // Function to update canvas tool settings
  const updateCanvasSettings = (canvas) => {
    if (!canvas) return;

    // NEVER change isDrawingMode during tool switching to prevent canvas clearing
    // Drawing mode will be managed only during actual drawing operations

    // Only update brush properties if we have a brush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = brushSizeRef.current;
      canvas.freeDrawingBrush.color =
        activeToolRef.current === "eraser"
          ? canvas.backgroundColor || "white"
          : brushColorRef.current;
    }

    // Set cursor style based on tool
    canvas.defaultCursor = "crosshair";
    canvas.hoverCursor = "crosshair";
  };

  // Function to create shapes
  const createShape = (startPoint, endPoint, shapeType) => {
    if (!startPoint || !endPoint) return null;

    const commonProps = {
      stroke: brushColorRef.current,
      strokeWidth: brushSizeRef.current,
      fill: "transparent",
      selectable: false,
      evented: false, // Prevent shape from being interactive
    };

    let shape = null;
    const left = Math.min(startPoint.x, endPoint.x);
    const top = Math.min(startPoint.y, endPoint.y);
    const width = Math.abs(endPoint.x - startPoint.x);
    const height = Math.abs(endPoint.y - startPoint.y);

    // Ensure minimum size for visibility
    const minSize = 1;

    switch (shapeType) {
      case "line":
        shape = new Line([startPoint.x, startPoint.y, endPoint.x, endPoint.y], {
          ...commonProps,
          fill: "", // Lines don't have fill
        });
        break;
      case "rectangle":
        if (width > minSize && height > minSize) {
          shape = new Rect({
            ...commonProps,
            left,
            top,
            width,
            height,
          });
        }
        break;
      case "circle":
        const radius = Math.max(Math.min(width, height) / 2, minSize);
        // Position circle properly within the drag rectangle
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        shape = new Circle({
          ...commonProps,
          left: centerX,
          top: centerY,
          radius,
          originX: "center",
          originY: "center",
        });
        break;
      default:
        return null;
    }

    return shape;
  };

  // Function to clear the canvas
  const handleClearCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = "white";
      fabricCanvasRef.current.renderAll();

      // Emit clear event to other users
      socket.emit("drawing", {
        roomId,
        data: {
          type: "canvas:clear",
        },
      });
    }
  };

  // Update refs when state changes to avoid stale closures
  useEffect(() => {
    activeToolRef.current = activeTool;
    brushColorRef.current = brushColor;
    brushSizeRef.current = brushSize;
  }, [activeTool, brushColor, brushSize]);

  // Immediately apply brush changes to canvas for instant visual feedback
  useEffect(() => {
    if (fabricCanvasRef.current && fabricCanvasRef.current.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
      fabricCanvasRef.current.freeDrawingBrush.color =
        activeTool === "eraser"
          ? fabricCanvasRef.current.backgroundColor || "white"
          : brushColor;
    }
  }, [brushSize, brushColor, activeTool]);

  // Update canvas settings when tool properties change
  useEffect(() => {
    if (fabricCanvasRef.current) {
      // Clear any preview shapes when switching tools
      if (currentShapeRef.current) {
        fabricCanvasRef.current.remove(currentShapeRef.current);
        currentShapeRef.current = null;
      }

      // Reset shape drawing state when switching tools
      isDrawingShapeRef.current = false;
      shapeStartPointRef.current = null;

      // ONLY update brush properties, NEVER touch drawing mode during tool switching
      if (fabricCanvasRef.current.freeDrawingBrush) {
        fabricCanvasRef.current.freeDrawingBrush.width = brushSizeRef.current;
        fabricCanvasRef.current.freeDrawingBrush.color =
          activeToolRef.current === "eraser"
            ? fabricCanvasRef.current.backgroundColor || "white"
            : brushColorRef.current;
      }
    }
  }, [activeTool, brushSize, brushColor]);

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (fabricCanvasRef.current) return;

    // Initialize Fabric.js canvas
    const canvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 500,
      backgroundColor: "white",
    });

    fabricCanvasRef.current = canvas;

    // Create and set up the pencil brush properly
    const pencilBrush = new FabricPencilBrush(canvas);
    // Configure brush for smooth, rounded drawing
    pencilBrush.strokeLineCap = "round";
    pencilBrush.strokeLineJoin = "round";
    canvas.freeDrawingBrush = pencilBrush;

    // Set initial drawing mode based on default tool (pen)
    canvas.isDrawingMode =
      activeToolRef.current === "pen" || activeToolRef.current === "eraser";

    // Apply initial tool settings
    updateCanvasSettings(canvas);

    console.log("Canvas initialized");

    // Handle shape drawing events
    canvas.on("mouse:down", (e) => {
      // For shape tools, handle shape creation
      if (["line", "rectangle", "circle"].includes(activeToolRef.current)) {
        // Only disable drawing mode if it's currently enabled to prevent canvas clearing
        if (canvas.isDrawingMode) {
          canvas.isDrawingMode = false;
        }

        const pointer = canvas.getPointer(e.e);
        isDrawingShapeRef.current = true;
        shapeStartPointRef.current = pointer;

        // Clear any existing preview shape
        if (currentShapeRef.current) {
          canvas.remove(currentShapeRef.current);
          currentShapeRef.current = null;
        }

        // Prevent the event from triggering free drawing
        e.e.preventDefault();
        e.e.stopPropagation();
      } else if (
        activeToolRef.current === "pen" ||
        activeToolRef.current === "eraser"
      ) {
        // Enable drawing mode for pen/eraser tools
        if (!canvas.isDrawingMode) {
          canvas.isDrawingMode = true;
        }
      }
    });

    canvas.on("mouse:move", (e) => {
      if (
        !isDrawingShapeRef.current ||
        !shapeStartPointRef.current ||
        !["line", "rectangle", "circle"].includes(activeToolRef.current)
      )
        return;

      const pointer = canvas.getPointer(e.e);

      // Remove the current preview shape if it exists
      if (currentShapeRef.current) {
        canvas.remove(currentShapeRef.current);
        currentShapeRef.current = null;
      }

      // Create and add a new preview shape
      const newShape = createShape(
        shapeStartPointRef.current,
        pointer,
        activeToolRef.current
      );
      if (newShape) {
        // Make preview shape semi-transparent and distinct
        newShape.set({
          opacity: 0.6,
          stroke: brushColorRef.current,
          strokeDashArray: [5, 5], // Dashed line for preview
        });
        canvas.add(newShape);
        currentShapeRef.current = newShape;
        canvas.renderAll();
      }
    });

    canvas.on("mouse:up", (e) => {
      if (
        !isDrawingShapeRef.current ||
        !shapeStartPointRef.current ||
        !["line", "rectangle", "circle"].includes(activeToolRef.current)
      )
        return;

      const pointer = canvas.getPointer(e.e);

      // Remove the preview shape
      if (currentShapeRef.current) {
        canvas.remove(currentShapeRef.current);
        currentShapeRef.current = null;
      }

      // Create the final shape only if there's meaningful movement
      const distance = Math.sqrt(
        Math.pow(pointer.x - shapeStartPointRef.current.x, 2) +
          Math.pow(pointer.y - shapeStartPointRef.current.y, 2)
      );

      if (distance > 3) {
        // Minimum distance to create shape
        const finalShape = createShape(
          shapeStartPointRef.current,
          pointer,
          activeToolRef.current
        );
        if (finalShape) {
          // Make final shape fully opaque with solid stroke
          finalShape.set({
            opacity: 1,
            strokeDashArray: null, // Solid line for final shape
          });
          canvas.add(finalShape);
          canvas.renderAll();

          // Emit shape data to other users
          socket.emit("drawing", {
            roomId,
            data: {
              type: "shape:created",
              shapeType: activeToolRef.current,
              startPoint: shapeStartPointRef.current,
              endPoint: pointer,
              stroke: brushColorRef.current,
              strokeWidth: brushSizeRef.current,
            },
          });
        }
      }

      // Reset shape drawing state
      isDrawingShapeRef.current = false;
      shapeStartPointRef.current = null;

      // After shape drawing, don't immediately change drawing mode
      // Let the next mouse:down event handle it based on the current tool
    });

    // Handle drawing events
    canvas.on("path:created", (e) => {
      // Don't create paths when shape tools are selected
      if (["line", "rectangle", "circle"].includes(activeToolRef.current)) {
        canvas.remove(e.path);
        return;
      }

      const path = e.path;
      console.log("Path created, emitting to server");

      // Use current brush settings instead of path object properties
      // This ensures consistent stroke width and visual properties across all clients
      const currentStroke =
        activeToolRef.current === "eraser"
          ? fabricCanvasRef.current.backgroundColor || "white"
          : brushColorRef.current;
      const currentStrokeWidth =
        activeToolRef.current === "eraser"
          ? brushSizeRef.current * 2
          : brushSizeRef.current;

      const pathData = {
        type: "path:created",
        path: path.path,
        stroke: currentStroke,
        strokeWidth: currentStrokeWidth,
        fill: path.fill,
        strokeLineCap: "round", // Ensures rounded ends
        strokeLineJoin: "round", // Ensures rounded corners
      };

      // Also update the local path to match current settings
      path.set({
        stroke: currentStroke,
        strokeWidth: currentStrokeWidth,
        strokeLineCap: "round",
        strokeLineJoin: "round",
      });
      canvas.renderAll();

      // Emit drawing data to other users
      socket.emit("drawing", {
        roomId,
        data: pathData,
      });
    });

    // Listen for drawing events from other users
    socket.on("drawing", (drawingData) => {
      console.log("Received drawing data:", drawingData);

      if (drawingData.data && drawingData.data.type === "path:created") {
        const pathData = drawingData.data;
        const path = new Path(pathData.path, {
          stroke: pathData.stroke,
          strokeWidth: pathData.strokeWidth,
          fill: pathData.fill,
          strokeLineCap: pathData.strokeLineCap || "round",
          strokeLineJoin: pathData.strokeLineJoin || "round",
        });
        canvas.add(path);
        canvas.renderAll();
      } else if (
        drawingData.data &&
        drawingData.data.type === "shape:created"
      ) {
        const shapeData = drawingData.data;
        const shape = createShape(
          shapeData.startPoint,
          shapeData.endPoint,
          shapeData.shapeType
        );
        if (shape) {
          // Apply the original creator's styling (ensure solid, non-preview styling)
          shape.set({
            stroke: shapeData.stroke,
            strokeWidth: shapeData.strokeWidth,
            opacity: 1,
            strokeDashArray: null, // Ensure solid line for received shapes
          });
          canvas.add(shape);
          canvas.renderAll();
        }
      } else if (drawingData.data && drawingData.data.type === "canvas:clear") {
        canvas.clear();
        canvas.backgroundColor = "white";
        canvas.renderAll();
      }
    });

    // Listen for existing canvas data when joining room
    socket.on("canvas-data", (canvasData) => {
      console.log("Received canvas data:", canvasData);

      // Clear current canvas
      canvas.clear();

      // Replay all drawing events
      canvasData.forEach((drawingData) => {
        if (drawingData.data && drawingData.data.type === "path:created") {
          const pathData = drawingData.data;
          const path = new Path(pathData.path, {
            stroke: pathData.stroke,
            strokeWidth: pathData.strokeWidth,
            fill: pathData.fill,
            strokeLineCap: pathData.strokeLineCap || "round",
            strokeLineJoin: pathData.strokeLineJoin || "round",
          });
          canvas.add(path);
        } else if (
          drawingData.data &&
          drawingData.data.type === "shape:created"
        ) {
          const shapeData = drawingData.data;
          const shape = createShape(
            shapeData.startPoint,
            shapeData.endPoint,
            shapeData.shapeType
          );
          if (shape) {
            shape.set({
              stroke: shapeData.stroke,
              strokeWidth: shapeData.strokeWidth,
              opacity: 1,
              strokeDashArray: null, // Ensure solid line for loaded shapes
            });
            canvas.add(shape);
          }
        }
      });
      canvas.renderAll();
    });

    // Listen for cursor updates from other users
    socket.on("cursor-update", (cursorData) => {
      setRemoteCursors((prev) => {
        const newCursors = new Map(prev);
        newCursors.set(cursorData.userId, cursorData);
        return newCursors;
      });
    });

    // Handle user leaving (remove their cursor)
    socket.on("user-left", (data) => {
      setRemoteCursors((prev) => {
        const newCursors = new Map(prev);
        newCursors.delete(data.userId);
        return newCursors;
      });
    });

    // Mouse event handlers for cursor tracking
    const handleMouseMove = (e) => {
      if (!canvasContainerRef.current) return;

      const rect = canvasContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      throttledCursorEmit(x, y);
    };

    const handleMouseLeave = () => {
      socket.emit("cursor-leave", { roomId });
    };

    // Add mouse event listeners to canvas container
    if (canvasContainerRef.current) {
      canvasContainerRef.current.addEventListener("mousemove", handleMouseMove);
      canvasContainerRef.current.addEventListener(
        "mouseleave",
        handleMouseLeave
      );
    }

    // Cleanup
    return () => {
      console.log("Cleaning up canvas");
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }

      // Remove mouse event listeners
      if (canvasContainerRef.current) {
        canvasContainerRef.current.removeEventListener(
          "mousemove",
          handleMouseMove
        );
        canvasContainerRef.current.removeEventListener(
          "mouseleave",
          handleMouseLeave
        );
      }

      // Reset shape drawing refs
      isDrawingShapeRef.current = false;
      shapeStartPointRef.current = null;
      currentShapeRef.current = null;

      // Remove socket event listeners
      socket.off("drawing");
      socket.off("canvas-data");
      socket.off("cursor-update");
      socket.off("user-left");
    };
  }, [socket, roomId]);

  return (
    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
      {/* Drawing Toolbar */}
      <DrawingToolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        onClearCanvas={handleClearCanvas}
      />

      {/* Canvas Container */}
      <div
        ref={canvasContainerRef}
        style={{
          position: "relative", // Important for cursor positioning
          border: "2px solid #ddd",
          borderRadius: "8px",
          display: "inline-block",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        <canvas ref={canvasRef} />

        {/* Render remote cursors */}
        {Array.from(remoteCursors.values()).map((cursor) => (
          <Cursor
            key={cursor.userId}
            userId={cursor.userId}
            name={cursor.name}
            color={cursor.color}
            x={cursor.x}
            y={cursor.y}
            visible={cursor.visible}
          />
        ))}
      </div>
    </div>
  );
};

export default SimpleCanvas;
