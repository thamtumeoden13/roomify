"use client";

import React, {useRef, useEffect, useState, forwardRef, useImperativeHandle} from 'react';

interface InpaintCanvasProps {
    image: string;
    brushSize?: number;
}

export interface InpaintCanvasHandle {
    getMask: () => { mask: string; width: number; height: number } | null;
    clear: () => void;
}

const InpaintCanvas = forwardRef<InpaintCanvasHandle, InpaintCanvasProps>(({image, brushSize = 20}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
    const [strokes, setStrokes] = useState<{ points: { x: number, y: number }[], size: number }[]>([]);

    useEffect(() => {
        const img = new Image();
        img.src = image;
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setImgElement(img);
        };
    }, [image]);

    // This effect handles canvas resizing and initial setup
    useEffect(() => {
        const resizeCanvas = () => {
            if (!canvasRef.current || !containerRef.current) return;
            const canvas = canvasRef.current;
            const container = containerRef.current;

            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;

            redrawCanvas();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [imgElement]);

    const getMapping = () => {
        if (!imgElement || !containerRef.current) return null;

        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const imgWidth = imgElement.naturalWidth;
        const imgHeight = imgElement.naturalHeight;

        const containerRatio = containerWidth / containerHeight;
        const imgRatio = imgWidth / imgHeight;

        let displayWidth, displayHeight, offsetX, offsetY;

        if (imgRatio > containerRatio) {
            // Image is wider than container ratio (Letterboxed)
            displayWidth = containerWidth;
            displayHeight = containerWidth / imgRatio;
            offsetX = 0;
            offsetY = (containerHeight - displayHeight) / 2;
        } else {
            // Image is taller than container ratio (Pillarboxed)
            displayHeight = containerHeight;
            displayWidth = containerHeight * imgRatio;
            offsetX = (containerWidth - displayWidth) / 2;
            offsetY = 0;
        }

        const scale = imgWidth / displayWidth;

        return {scale, offsetX, offsetY, imgWidth, imgHeight};
    };

    const redrawCanvas = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        strokes.forEach(stroke => {
            if (stroke.points.length < 2) return;
            ctx.beginPath();
            ctx.lineWidth = stroke.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';

            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        });
    };

    useImperativeHandle(ref, () => ({
        getMask: () => {
            if (!imgElement) return null;
            const mapping = getMapping();
            if (!mapping) return null;

            const {scale, offsetX, offsetY, imgWidth, imgHeight} = mapping;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imgWidth;
            tempCanvas.height = imgHeight;
            const tempCtx = tempCanvas.getContext('2d');

            if (!tempCtx) return null;

            // 4. Background strictly black
            tempCtx.fillStyle = '#000000';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

            // 3. Draw strokes onto full-resolution canvas
            tempCtx.lineCap = 'round';
            tempCtx.lineJoin = 'round';
            tempCtx.strokeStyle = '#FFFFFF'; // Painted area strictly white

            strokes.forEach(stroke => {
                if (stroke.points.length < 1) return;

                tempCtx.lineWidth = stroke.size * scale;
                tempCtx.beginPath();

                const startX = (stroke.points[0].x - offsetX) * scale;
                const startY = (stroke.points[0].y - offsetY) * scale;
                tempCtx.moveTo(startX, startY);

                for (let i = 1; i < stroke.points.length; i++) {
                    const x = (stroke.points[i].x - offsetX) * scale;
                    const y = (stroke.points[i].y - offsetY) * scale;
                    tempCtx.lineTo(x, y);
                }
                tempCtx.stroke();
            });

            return {
                mask: tempCanvas.toDataURL('image/png'),
                width: imgWidth,
                height: imgHeight
            };
        },
        clear: () => {
            setStrokes([]);
        }
    }));

    useEffect(() => {
        redrawCanvas();
    }, [strokes]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const rect = canvasRef.current!.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = (e as React.MouseEvent).clientX - rect.left;
            y = (e as React.MouseEvent).clientY - rect.top;
        }

        setStrokes(prev => [...prev, {points: [{x, y}], size: brushSize}]);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = (e as React.MouseEvent).clientX - rect.left;
            y = (e as React.MouseEvent).clientY - rect.top;
        }

        setStrokes(prev => {
            const newStrokes = [...prev];
            const lastStroke = newStrokes[newStrokes.length - 1];
            if (lastStroke) {
                lastStroke.points.push({x, y});
            }
            return newStrokes;
        });
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
                />
            )}
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        </div>
    );
});

InpaintCanvas.displayName = "InpaintCanvas";

export default InpaintCanvas;
