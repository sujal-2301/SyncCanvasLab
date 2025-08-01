import { useEffect, useRef, useState, useCallback } from "react";
import {
  Canvas,
  PencilBrush as FabricPencilBrush,
  Path,
  Line,
  Rect,
  Circle,
  util as fabricUtil,
} from "fabric";
import Cursor from "./Cursor";
import { useThrottle } from "../hooks/useThrottle";

const SimpleCanvas = ({
  socket,
  roomId,
  activeTool,
  brushSize,
  brushColor,
  onCanvasFunctionsReady,
}) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const canvasContainerRef = useRef(null);

  // State for remote cursors
  const [remoteCursors, setRemoteCursors] = useState(new Map());

  // Shape drawing states using refs to avoid closure issues
  const isDrawingShapeRef = useRef(false);
  const shapeStartPointRef = useRef(null);
  const currentShapeRef = useRef(null);

  // Tool state refs to reflect current props
  const activeToolRef = useRef(activeTool);
  const brushColorRef = useRef(brushColor);
  const brushSizeRef = useRef(brushSize);

  // Pan and zoom state for infinite canvas
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const touchStartDistance = useRef(0);
  const wasDrawingMode = useRef(false);

  // Update refs when props change
  useEffect(() => {
    activeToolRef.current = activeTool;
    brushColorRef.current = brushColor;
    brushSizeRef.current = brushSize;

    // Update canvas settings when tool state changes
    if (fabricCanvasRef.current) {
      updateCanvasSettings(fabricCanvasRef.current);
    }
  }, [activeTool, brushColor, brushSize]);

  // Expose canvas functions to parent component
  useEffect(() => {
    if (onCanvasFunctionsReady) {
      onCanvasFunctionsReady({
        clearCanvas: handleClearCanvas,
        saveAsPNG: handleSaveAsPNG,
        saveAsJPG: handleSaveAsJPG,
      });
    }
  }, [onCanvasFunctionsReady]);

  // Handle window resize for responsive canvas
  useEffect(() => {
    const handleResize = () => {
      if (fabricCanvasRef.current && canvasContainerRef.current) {
        const container = canvasContainerRef.current;
        const containerRect = container.getBoundingClientRect();

        const newWidth = Math.max(containerRect.width, 800);
        const newHeight = Math.max(containerRect.height, 600);

        fabricCanvasRef.current.setWidth(newWidth);
        fabricCanvasRef.current.setHeight(newHeight);
        fabricCanvasRef.current.renderAll();
      }
    };

    window.addEventListener("resize", handleResize);
    // Initial resize after mount
    const timeoutId = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Throttled cursor emission to prevent spam
  const throttledCursorEmit = useThrottle((x, y) => {
    socket.emit("cursor-move", {
      roomId,
      x,
      y,
      visible: true,
    });
  }, 50); // 50ms throttle = ~20fps

  // Pan and zoom handlers for infinite canvas
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      if (!fabricCanvasRef.current) return;

      const canvas = fabricCanvasRef.current;
      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      let newZoom = canvas.getZoom() * delta;
      newZoom = Math.max(0.1, Math.min(10, newZoom)); // Clamp zoom

      canvas.zoomToPoint({ x: e.offsetX, y: e.offsetY }, newZoom);

      // Emit viewport update after zooming
      const newViewport = canvas.viewportTransform;
      socket.emit("viewport:update", { roomId, viewport: newViewport });

      setZoomLevel(newZoom); // Update local state for UI
    },
    [roomId, socket]
  );

  const handleMouseDown = useCallback((e) => {
    if (
      e.button === 1 ||
      (e.button === 0 && e.ctrlKey) ||
      (e.button === 0 && e.metaKey)
    ) {
      // Middle mouse or Ctrl+click for panning
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      const canvas = fabricCanvasRef.current;
      const container = canvasContainerRef.current;
      if (!canvas || !container) return;

      if (isPanning) {
        const deltaX = e.clientX - lastPanPoint.x;
        const deltaY = e.clientY - lastPanPoint.y;

        setLastPanPoint({ x: e.clientX, y: e.clientY });
        canvas.relativePan({ x: deltaX, y: deltaY });
      }

      // Always emit the correct cursor position in canvas coordinates
      const rect = container.getBoundingClientRect();
      const containerX = e.clientX - rect.left;
      const containerY = e.clientY - rect.top;

      const invertedVpt = fabricUtil.invertTransform(canvas.viewportTransform);
      const canvasPoint = fabricUtil.transformPoint(
        { x: containerX, y: containerY },
        invertedVpt
      );

      throttledCursorEmit(canvasPoint.x, canvasPoint.y);
    },
    [isPanning, lastPanPoint, throttledCursorEmit]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);

    // After panning, emit the final viewport state
    if (fabricCanvasRef.current) {
      const newViewport = fabricCanvasRef.current.viewportTransform;
      socket.emit("viewport:update", { roomId, viewport: newViewport });
    }
  }, [roomId, socket]);

  const handleMouseLeave = useCallback(() => {
    socket.emit("cursor-leave", { roomId });
  }, [roomId, socket]);

  // Mobile touch handlers
  const handleTouchStart = useCallback((e) => {
    if (!fabricCanvasRef.current || e.touches.length > 2) return;
    const canvas = fabricCanvasRef.current;

    // Prevent accidental drawing when starting a multi-touch gesture
    if (e.touches.length > 1) {
      if (canvas.isDrawingMode) {
        wasDrawingMode.current = true;
        canvas.isDrawingMode = false;
      }
    }

    if (e.touches.length === 2) {
      // Two-finger gesture: can be pan or zoom
      setIsPanning(true);
      // Set initial pan point as the midpoint of the two touches
      setLastPanPoint({
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      });

      // Set initial pinch distance for zooming
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
    // Note: One-finger touch is handled by fabric's native 'mouse:down' for drawing
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (!fabricCanvasRef.current) return;
      e.preventDefault(); // Prevent scrolling

      const canvas = fabricCanvasRef.current;
      const container = canvasContainerRef.current;
      if (!canvas || !container) return;

      // Handle one-finger drawing cursor emit
      if (e.touches.length === 1 && canvas.isDrawingMode) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const containerX = touch.clientX - rect.left;
        const containerY = touch.clientY - rect.top;

        const invertedVpt = fabricUtil.invertTransform(
          canvas.viewportTransform
        );
        const canvasPoint = fabricUtil.transformPoint(
          { x: containerX, y: containerY },
          invertedVpt
        );
        throttledCursorEmit(canvasPoint.x, canvasPoint.y);
        return; // Exit early, let fabric handle the drawing
      }

      // Handle two-finger pan and zoom
      if (e.touches.length === 2 && isPanning) {
        // --- PAN LOGIC ---
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const deltaX = midX - lastPanPoint.x;
        const deltaY = midY - lastPanPoint.y;
        setLastPanPoint({ x: midX, y: midY });
        canvas.relativePan({ x: deltaX, y: deltaY });

        // --- ZOOM LOGIC ---
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);

        // Add a threshold to differentiate pan from zoom
        if (Math.abs(currentDistance - touchStartDistance.current) > 5) {
          const zoomFactor = currentDistance / touchStartDistance.current;
          let newZoom = canvas.getZoom() * zoomFactor;
          newZoom = Math.max(0.1, Math.min(10, newZoom)); // Clamp zoom

          const rect = container.getBoundingClientRect();
          canvas.zoomToPoint(
            { x: midX - rect.left, y: midY - rect.top },
            newZoom
          );
          setZoomLevel(newZoom);

          // Update distance for next move event
          touchStartDistance.current = currentDistance;
        }
      }
    },
    [isPanning, lastPanPoint]
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    if (fabricCanvasRef.current) {
      // Restore drawing mode if it was active before the gesture
      if (wasDrawingMode.current) {
        fabricCanvasRef.current.isDrawingMode = true;
        wasDrawingMode.current = false;
      }

      const newViewport = fabricCanvasRef.current.viewportTransform;
      socket.emit("viewport:update", { roomId, viewport: newViewport });
    }
  }, [roomId, socket]);

  // Add event listeners for pan and zoom
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (container) {
      // Mouse events
      container.addEventListener("wheel", handleWheel, { passive: false });
      container.addEventListener("mousedown", handleMouseDown);
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseup", handleMouseUp);

      // Touch events
      container.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      container.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      container.addEventListener("touchend", handleTouchEnd);

      const leaveHandler = () => {
        handleMouseUp(); // Stop panning
        handleMouseLeave(); // Hide cursor
      };
      container.addEventListener("mouseleave", leaveHandler);

      return () => {
        // Mouse events cleanup
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("mousedown", handleMouseDown);
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseup", handleMouseUp);
        container.removeEventListener("mouseleave", leaveHandler);

        // Touch events cleanup
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
        container.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

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

  // Function to save canvas as PNG
  const handleSaveAsPNG = () => {
    if (fabricCanvasRef.current) {
      const dataURL = fabricCanvasRef.current.toDataURL({
        format: "png",
        quality: 1.0,
        multiplier: 2, // Higher resolution for better quality
      });

      const link = document.createElement("a");
      link.download = `canvas-${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-")}.png`;
      link.href = dataURL;
      link.click();
    }
  };

  // Function to save canvas as JPG
  const handleSaveAsJPG = () => {
    if (fabricCanvasRef.current) {
      const dataURL = fabricCanvasRef.current.toDataURL({
        format: "jpeg",
        quality: 0.8,
        multiplier: 2, // Higher resolution for better quality
      });

      const link = document.createElement("a");
      link.download = `canvas-${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-")}.jpg`;
      link.href = dataURL;
      link.click();
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

    // Get container dimensions for full-size canvas
    const container = canvasContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const canvasWidth = Math.max(containerRect.width || window.innerWidth, 800);
    const canvasHeight = Math.max(
      containerRect.height || window.innerHeight,
      600
    );

    // Initialize Fabric.js canvas with full size
    const canvas = new Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
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
        selectable: false,
        evented: false,
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
          selectable: false,
          evented: false,
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
            selectable: false,
            evented: false,
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
    <div className="w-full h-full relative bg-gray-50">
      {/* Full-Size Canvas Container */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 bg-white cursor-crosshair"
        style={{
          cursor:
            activeTool === "pen"
              ? "crosshair"
              : activeTool === "eraser"
              ? "grab"
              : activeTool === "line"
              ? "crosshair"
              : activeTool === "rectangle"
              ? "crosshair"
              : activeTool === "circle"
              ? "crosshair"
              : "default",
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none"
          style={{ touchAction: "none" }}
        />

        {/* Render remote cursors */}
        {Array.from(remoteCursors.values()).map((cursor) => {
          if (!fabricCanvasRef.current || !cursor.visible) {
            return null;
          }
          const canvas = fabricCanvasRef.current;
          const vpt = canvas.viewportTransform;

          const screenPoint = fabricUtil.transformPoint(
            { x: cursor.x, y: cursor.y },
            vpt
          );

          return (
            <Cursor
              key={cursor.userId}
              userId={cursor.userId}
              name={cursor.name}
              color={cursor.color}
              x={screenPoint.x}
              y={screenPoint.y}
              visible={cursor.visible}
            />
          );
        })}

        {/* Infinite Canvas Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />

        {/* Canvas Info Overlay */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-xs font-medium pointer-events-none">
          <div className="flex items-center space-x-2">
            <span className="capitalize">{activeTool}</span>
            {(activeTool === "pen" || activeTool === "eraser") && (
              <>
                <span>•</span>
                <span>{brushSize}px</span>
              </>
            )}
            <span>•</span>
            <span style={{ color: brushColor }}>●</span>
            <span>•</span>
            <span>{Math.round(zoomLevel * 100)}%</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
          <button
            onClick={() => {
              const newZoom = Math.min(5, zoomLevel * 1.2);
              setZoomLevel(newZoom);
              if (fabricCanvasRef.current) {
                fabricCanvasRef.current.setZoom(newZoom);
                fabricCanvasRef.current.renderAll();
              }
            }}
            className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 flex items-center justify-center text-lg font-bold text-gray-700"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => {
              const newZoom = Math.max(0.1, zoomLevel * 0.8);
              setZoomLevel(newZoom);
              if (fabricCanvasRef.current) {
                fabricCanvasRef.current.setZoom(newZoom);
                fabricCanvasRef.current.renderAll();
              }
            }}
            className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 flex items-center justify-center text-lg font-bold text-gray-700"
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
              if (fabricCanvasRef.current) {
                fabricCanvasRef.current.setZoom(1);
                fabricCanvasRef.current.setViewportTransform([
                  1, 0, 0, 1, 0, 0,
                ]);
                fabricCanvasRef.current.renderAll();
              }
            }}
            className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-700"
            title="Reset View"
          >
            ⌂
          </button>
        </div>

        {/* Pan Instructions */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-xs pointer-events-none">
          <div className="text-center">
            <div>Scroll: Zoom</div>
            <div>Ctrl+Drag: Pan</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleCanvas;
