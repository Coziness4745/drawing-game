import React, { useEffect, useRef, useState } from 'react';
import { database } from '../firebase/config';
import { ref, push, set, onValue, off } from 'firebase/database';
import '../styles/Canvas.css';

const Canvas = ({ roomId, isDrawer, gameState, brushColor, brushSize }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prevPoint, setPrevPoint] = useState(null);
  const drawingRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 600;
    
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = brushColor;
    context.lineWidth = brushSize;
    contextRef.current = context;
    
    // Clear canvas when game state changes
    if (gameState === 'choosing' || gameState === 'waiting') {
      contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
      contextRef.current.fillStyle = '#ffffff';
      contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Listen for drawing updates from Firebase
    const drawingRef = ref(database, `rooms/${roomId}/drawing`);
    onValue(drawingRef, (snapshot) => {
      const drawingData = snapshot.val();
      if (!drawingData || isDrawing) return;
      
      if (drawingData.action === 'clear') {
        contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
        contextRef.current.fillStyle = '#ffffff';
        contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
      } else if (drawingData.action === 'draw') {
        drawLine(
          drawingData.from.x,
          drawingData.from.y,
          drawingData.to.x,
          drawingData.to.y,
          drawingData.color,
          drawingData.size
        );
      }
    });
    
    return () => {
      off(drawingRef);
    };
  }, [roomId, isDrawing, gameState]);

  // Update brush properties when they change
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = brushColor;
      contextRef.current.lineWidth = brushSize;
    }
  }, [brushColor, brushSize]);

  const startDrawing = ({ nativeEvent }) => {
    if (!isDrawer || gameState !== 'drawing') return;
    
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setPrevPoint({ x: offsetX, y: offsetY });
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !isDrawer || gameState !== 'drawing') return;
    
    const { offsetX, offsetY } = nativeEvent;
    
    // Draw locally
    drawLine(
      prevPoint.x,
      prevPoint.y,
      offsetX,
      offsetY,
      brushColor,
      brushSize
    );
    
    // Save to Firebase
    const drawingRef = ref(database, `rooms/${roomId}/drawing`);
    set(drawingRef, {
      action: 'draw',
      from: prevPoint,
      to: { x: offsetX, y: offsetY },
      color: brushColor,
      size: brushSize,
      timestamp: Date.now()
    });
    
    setPrevPoint({ x: offsetX, y: offsetY });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    contextRef.current.closePath();
    setIsDrawing(false);
    setPrevPoint(null);
  };

  const drawLine = (fromX, fromY, toX, toY, color, size) => {
    const ctx = contextRef.current;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
  };

  const clearCanvas = () => {
    if (!isDrawer || gameState !== 'drawing') return;
    
    contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    contextRef.current.fillStyle = '#ffffff';
    contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Save to Firebase
    const drawingRef = ref(database, `rooms/${roomId}/drawing`);
    set(drawingRef, {
      action: 'clear',
      timestamp: Date.now()
    });
  };

  return (
    <div className="canvas-wrapper">
      <canvas
        className="drawing-canvas"
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
          });
          canvasRef.current.dispatchEvent(mouseEvent);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
          });
          canvasRef.current.dispatchEvent(mouseEvent);
        }}
        onTouchEnd={() => {
          const mouseEvent = new MouseEvent('mouseup', {});
          canvasRef.current.dispatchEvent(mouseEvent);
        }}
      ></canvas>
      
      {isDrawer && gameState === 'drawing' && (
        <button className="clear-button" onClick={clearCanvas}>
          Clear Canvas
        </button>
      )}
    </div>
  );
};

export default Canvas;