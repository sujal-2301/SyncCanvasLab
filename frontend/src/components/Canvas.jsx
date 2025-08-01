import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import Cursor from "./Cursor";
import { useThrottle } from "../hooks/useThrottle";

const Canvas = ({ socket, tool, color, brushSize, roomId }) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState(new Map());

  useEffect(() => {
    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth - 250, // Account for sidebar
      height: window.innerHeight - 80, // Account for toolbar
      backgroundColor: "white",
    });

    fabricCanvasRef.current = canvas;

    // Enable free drawing mode
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.width = brushSize;
    canvas.freeDrawingBrush.color = color;

    // Handle drawing events
    canvas.on("path:created", (e) => {
      const path = e.path;
      const pathData = {
        type: "path",
        path: path.path,
        pathOffset: path.pathOffset,
        stroke: path.stroke,
        strokeWidth: path.strokeWidth,
        fill: path.fill,
      };

      // Emit drawing data to other users
      socket.emit("drawing", {
        roomId,
        type: "path:created",
        data: pathData,
      });
    });

    // Listen for drawing events from other users
    socket.on("drawing", (drawingData) => {
      if (drawingData.type === "path:created") {
        const path = new fabric.Path(drawingData.data.path, {
          stroke: drawingData.data.stroke,
          strokeWidth: drawingData.data.strokeWidth,
          fill: drawingData.data.fill,
          pathOffset: drawingData.data.pathOffset,
        });
        canvas.add(path);
        canvas.renderAll();
      }
    });

    // Listen for existing canvas data when joining room
    socket.on("canvas-data", (canvasData) => {
      // Clear current canvas
      canvas.clear();

      // Replay all drawing events
      canvasData.forEach((drawingData) => {
        if (drawingData.type === "path:created") {
          const path = new fabric.Path(drawingData.data.path, {
            stroke: drawingData.data.stroke,
            strokeWidth: drawingData.data.strokeWidth,
            fill: drawingData.data.fill,
            pathOffset: drawingData.data.pathOffset,
          });
          canvas.add(path);
        }
      });
      canvas.renderAll();
    });

    // Listen for cursor updates from other users
    socket.on("cursor-update", (cursorData) => {
      setRemoteCursors((prev) => {
        const newCursors = new Map(prev);
        if (cursorData.cursor.visible) {
          newCursors.set(cursorData.userId, cursorData);
        } else {
          newCursors.delete(cursorData.userId);
        }
        return newCursors;
      });
    });

    // Clean up cursors when users leave
    socket.on("user-left", (data) => {
      setRemoteCursors((prev) => {
        const newCursors = new Map(prev);
        newCursors.delete(data.userId);
        return newCursors;
      });
    });

    // Handle window resize
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth - 250,
        height: window.innerHeight - 80,
      });
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      canvas.dispose();
      window.removeEventListener("resize", handleResize);
      socket.off("drawing");
    };
  }, [socket, roomId]);

  // Update brush properties when tool settings change
  useEffect(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;

      if (tool === "pen") {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.width = brushSize;
        canvas.freeDrawingBrush.color = color;
      } else if (tool === "eraser") {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.width = brushSize * 2;
        canvas.freeDrawingBrush.color = "white"; // Eraser color
      } else {
        canvas.isDrawingMode = false;
      }
    }
  }, [tool, color, brushSize]);

  // Throttled cursor position emitter (60fps max)
  const emitCursorPosition = useThrottle((x, y) => {
    socket.emit("cursor-move", { x, y });
  }, 16); // ~60fps

  // Handle mouse movement for cursor tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!canvasContainerRef.current) return;

      const rect = canvasContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      emitCursorPosition(x, y);
    };

    const handleMouseLeave = () => {
      socket.emit("cursor-leave");
    };

    const container = canvasContainerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [socket, emitCursorPosition]);

  return (
    <div className="canvas-wrapper" ref={canvasContainerRef}>
      <canvas ref={canvasRef} />

      {/* Remote cursors */}
      {Array.from(remoteCursors.values()).map((cursorData) => (
        <Cursor
          key={cursorData.userId}
          userId={cursorData.userId}
          name={cursorData.name}
          color={cursorData.color}
          x={cursorData.cursor.x}
          y={cursorData.cursor.y}
          visible={cursorData.cursor.visible}
        />
      ))}
    </div>
  );
};

export default Canvas;
