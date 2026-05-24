"use client";

import React, {useRef, useEffect, useState, forwardRef, useImperativeHandle} from 'react';

interface InpaintCanvasProps {
    image: string;
    brushSize?: number;
}

export interface InpaintCanvasHandle {
    getMask: () => string | null;
    clear: () => void;
}

const InpaintCanvas = forwardRef<InpaintCanvasHandle, InpaintCanvasProps>(({image, brushSize = 20}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        const img = new Image();
        img.src = image;
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setImgElement(img);
            resizeCanvas();
        };
    }, [image]);

    const resizeCanvas = () => {
        if (!canvasRef.current || !containerRef.current) return;
        const canvas = canvasRef.current;
        const container = containerRef.current;

        // Set canvas dimensions to match container
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        // Initialize canvas with transparent black (or just transparent)
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0, 0, 0, 0)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    };

    useEffect(() => {
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    useImperativeHandle(ref, () => ({
        getMask: () => {
            if (!canvasRef.current) return null;

            // Create a temporary canvas to draw the black and white mask
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasRef.current.width;
            tempCanvas.height = canvasRef.current.height;
            const tempCtx = tempCanvas.getContext('2d');

            if (!tempCtx) return null;

            // Fill background with black (original area)
            tempCtx.fillStyle = 'black';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

            // Draw the strokes as white (area to change)
            // We need to extract only the painted part.
            // Actually, our canvas already has the strokes.
            // We can use globalCompositeOperation to map strokes to white.
            tempCtx.drawImage(canvasRef.current, 0, 0);

            // Convert non-transparent pixels to white
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 0) { // If alpha > 0, it means user painted here
                    data[i] = 255;     // R
                    data[i + 1] = 255;   // G
                    data[i + 2] = 255;   // B
                    data[i + 3] = 255;   // A (opaque)
                } else {
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                    data[i + 3] = 255;
                }
            }
            tempCtx.putImageData(imageData, 0, 0);

            return tempCanvas.toDataURL('image/png');
        },
        clear: () => {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx && canvasRef.current) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    }));

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.beginPath();
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = (e as React.MouseEvent).clientX - rect.left;
            y = (e as React.MouseEvent).clientY - rect.top;
        }

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // Semi-transparent white for UI feedback

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black/10"
            style={{minHeight: '400px'}}
        >
            {image && (
                <img
                    src={image}
                    alt="To be inpainted"
                    className="max-w-full max-h-full object-contain select-none"
                    onLoad={resizeCanvas}
                />
            )}
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        </div>
    );
});

InpaintCanvas.displayName = "InpaintCanvas";

export default InpaintCanvas;
