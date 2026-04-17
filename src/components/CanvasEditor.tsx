import { useRef, useEffect, useState, useCallback } from 'react';
import type { Layer, ImageLayer, TextLayer, Crop } from '../types/editor';
import { Download } from 'lucide-react';
import { saveAs } from 'file-saver';

interface CanvasEditorProps {
  layers: Layer[];
  canvasWidth: number;
  canvasHeight: number;
  canvasBackgroundColor: string;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, patch: Partial<Layer>) => void;
  crop: Crop | null;
  onUpdateCrop: (patch: Partial<Crop>) => void;
  onAddPhoto: (src: string, width: number, height: number) => void;
  onError?: (message: string) => void;
}

type Handle = 'tl' | 'tr' | 'bl' | 'br' | 'tm' | 'bm' | 'lm' | 'rm' | 'rotate' | null;

export default function CanvasEditor({
  layers,
  canvasWidth,
  canvasHeight,
  canvasBackgroundColor,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  crop,
  onUpdateCrop,
  onAddPhoto,
  onError,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, layerX: 0, layerY: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });
  const [activeHandle, setActiveHandle] = useState<Handle>(null);
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
  const [zoom, setZoom] = useState(100);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  const selectedLayer = layers.find(l => l.id === selectedLayerId) as ImageLayer | TextLayer | null;
  const dmklayers = layers.filter(l => l.type === 'photo' && (l as ImageLayer).src.includes('DMK.png'));
  const otherPhotos = layers.filter(l => l.type === 'photo' && !(l as ImageLayer).src.includes('DMK.png'));
  const hasDMK = dmklayers.length > 0;
  const showUploadButton = hasDMK && otherPhotos.length === 0;

  useEffect(() => {
    const cache = new Map<string, HTMLImageElement>();
    let loadedCount = 0;
    let totalImages = 0;

    layers.forEach(layer => {
      if (layer.type === 'template' || layer.type === 'photo') {
        totalImages++;
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            setImageCache(new Map(cache));
            setRenderKey(k => k + 1);
          }
        };
        img.src = (layer as ImageLayer).src;
        cache.set(layer.id, img);
      }
    });

    if (totalImages === 0) {
      setImageCache(cache);
    }
  }, [layers]);

  const [renderKey, setRenderKey] = useState(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    layers.filter(l => l.visible).forEach(layer => {
      ctx.save();
      
      if (layer.type === 'template' || layer.type === 'photo') {
        renderImageLayer(ctx, layer as ImageLayer);
      } else if (layer.type === 'text') {
        renderTextLayer(ctx, layer as TextLayer);
      }
      
      ctx.restore();
    });

    if (selectedLayer && selectedLayerId) {
      drawSelectionBox(ctx, selectedLayer);
    }

    if (crop) {
      drawCropArea(ctx, crop);
    }
  }, [layers, selectedLayer, selectedLayerId, canvasWidth, canvasHeight, renderKey, crop]);

  useEffect(() => {
    render();
  }, [render]);

  const drawCropArea = (ctx: CanvasRenderingContext2D, crop: Crop) => {
    ctx.save();

    if (crop.type === 'circle') {
      const c = crop as { type: 'circle'; x: number; y: number; radius: number };
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius - 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 16;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(c.x - 6, c.y - 6, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    } else {
      const r = crop as { type: 'square' | 'rectangle'; x: number; y: number; width: number; height: number };
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(r.x, r.y, r.width, r.height);
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(r.x, r.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(r.x + r.width, r.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(r.x, r.y + r.height, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(r.x + r.width, r.y + r.height, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    }

    ctx.restore();
  };

  const renderImageLayer = (ctx: CanvasRenderingContext2D, layer: ImageLayer) => {
    const img = imageCache.get(layer.id);
    if (!img) return;

    ctx.globalAlpha = layer.opacity;
    
    const brightness = 100 + layer.brightness;
    const contrast = 100 + layer.contrast;
    const saturation = 100 + layer.saturation;
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    const cx = layer.x + (layer.width * layer.scaleX) / 2;
    const cy = layer.y + (layer.height * layer.scaleY) / 2;
    const scaledWidth = layer.width * layer.scaleX;
    const scaledHeight = layer.height * layer.scaleY;

    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);
    ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
    ctx.filter = 'none';

    if (selectedLayerId === layer.id) {
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 8;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.setLineDash([]);
    }
  };

  const renderTextLayer = (ctx: CanvasRenderingContext2D, layer: TextLayer) => {
    ctx.globalAlpha = layer.opacity;
    ctx.font = `${layer.fontStyle} ${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
    ctx.fillStyle = layer.color;
    ctx.textAlign = layer.textAlign;
    ctx.textBaseline = 'top';

    const lines = layer.text.split('\n');
    const lineHeight = layer.fontSize * layer.lineHeight;
    
    lines.forEach((line, i) => {
      const lineY = layer.y + i * lineHeight;
      
      if (layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth = layer.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, layer.x, lineY);
      }
      
      ctx.fillText(line, layer.x, lineY);
    });

    if (selectedLayerId === layer.id) {
      const textWidth = Math.max(100, layer.text.length * layer.fontSize * 0.6);
      const textHeight = layer.fontSize * 1.2 * lines.length;
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 8;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(layer.x - textWidth / 2, layer.y, textWidth, textHeight);
      ctx.setLineDash([]);
    }
  };

  const drawSelectionBox = (ctx: CanvasRenderingContext2D, layer: Layer) => {
    let x: number, y: number, width: number, height: number;
    
    if (layer.type === 'text') {
      const textLayer = layer as TextLayer;
      ctx.font = `${textLayer.fontStyle} ${textLayer.fontWeight} ${textLayer.fontSize}px ${textLayer.fontFamily}`;
      const lines = textLayer.text.split('\n');
      const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
      width = maxWidth || 100;
      height = lines.length * textLayer.fontSize * textLayer.lineHeight;
      x = textLayer.textAlign === 'center' ? textLayer.x - width / 2 : 
          textLayer.textAlign === 'right' ? textLayer.x - width : textLayer.x;
      y = textLayer.y;
    } else {
      const imgLayer = layer as ImageLayer;
      x = imgLayer.x;
      y = imgLayer.y;
      width = imgLayer.width;
      height = imgLayer.height;
    }

    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
    ctx.setLineDash([]);

    const handles: { x: number; y: number }[] = [
      { x: x - 4, y: y - 4 },
      { x: x + width / 2 - 4, y: y - 4 },
      { x: x + width - 4, y: y - 4 },
      { x: x - 4, y: y + height / 2 - 4 },
      { x: x + width - 4, y: y + height / 2 - 4 },
      { x: x - 4, y: y + height - 4 },
      { x: x + width / 2 - 4, y: y + height - 4 },
      { x: x + width - 4, y: y + height - 4 },
    ];

    handles.forEach(handle => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(handle.x, handle.y, 8, 8);
      ctx.strokeStyle = '#3b82f6';
      ctx.strokeRect(handle.x, handle.y, 8, 8);
    });

    const rotateY = y - 24;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2, rotateY);
    ctx.strokeStyle = '#3b82f6';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x + width / 2, rotateY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.stroke();
    
    ctx.fillStyle = '#3b82f6';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↻', x + width / 2, rotateY + 3);

    ctx.restore();
  };

  const getHandleAtPoint = (mx: number, my: number): Handle => {
    if (!selectedLayer) return null;
    
    let x: number, y: number, width: number, height: number;
    
    if (selectedLayer.type === 'text') {
      const textLayer = selectedLayer as TextLayer;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.font = `${textLayer.fontStyle} ${textLayer.fontWeight} ${textLayer.fontSize}px ${textLayer.fontFamily}`;
        const lines = textLayer.text.split('\n');
        const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        width = maxWidth || 100;
        height = lines.length * textLayer.fontSize * textLayer.lineHeight;
        x = textLayer.textAlign === 'center' ? textLayer.x - width / 2 : 
            textLayer.textAlign === 'right' ? textLayer.x - width : textLayer.x;
        y = textLayer.y;
      } else return null;
    } else {
      const imgLayer = selectedLayer as ImageLayer;
      x = imgLayer.x;
      y = imgLayer.y;
      width = imgLayer.width;
      height = imgLayer.height;
    }

    const handles: { h: Handle; x: number; y: number }[] = [
      { h: 'tl', x: x - 4, y: y - 4 },
      { h: 'tm', x: x + width / 2 - 4, y: y - 4 },
      { h: 'tr', x: x + width - 4, y: y - 4 },
      { h: 'lm', x: x - 4, y: y + height / 2 - 4 },
      { h: 'rm', x: x + width - 4, y: y + height / 2 - 4 },
      { h: 'bl', x: x - 4, y: y + height - 4 },
      { h: 'bm', x: x + width / 2 - 4, y: y + height - 4 },
      { h: 'br', x: x + width - 4, y: y + height - 4 },
      { h: 'rotate', x: x + width / 2 - 8, y: y - 24 - 8 },
    ];

    for (const handle of handles) {
      if (mx >= handle.x && mx <= handle.x + 16 && my >= handle.y && my <= handle.y + 16) {
        return handle.h;
      }
    }

    return null;
  };

  const isPointInCrop = (mx: number, my: number, cropArea: Crop): boolean => {
    if (cropArea.type === 'circle') {
      const c = cropArea as { type: 'circle'; x: number; y: number; radius: number };
      const dx = mx - c.x;
      const dy = my - c.y;
      return Math.sqrt(dx * dx + dy * dy) <= c.radius;
    } else {
      const r = cropArea as { type: 'square' | 'rectangle'; x: number; y: number; width: number; height: number };
      return mx >= r.x && mx <= r.x + r.width && my >= r.y && my <= r.y + r.height;
    }
  };

  const hitTestLayer = (mx: number, my: number): string | null => {
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible) continue;
      
      if (layer.type === 'text') {
        const textLayer = layer as TextLayer;
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.font = `${textLayer.fontStyle} ${textLayer.fontWeight} ${textLayer.fontSize}px ${textLayer.fontFamily}`;
          const lines = textLayer.text.split('\n');
          const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
          const width = maxWidth || 100;
          const height = lines.length * textLayer.fontSize * textLayer.lineHeight;
          const x = textLayer.textAlign === 'center' ? textLayer.x - width / 2 : 
                    textLayer.textAlign === 'right' ? textLayer.x - width : textLayer.x;
          if (mx >= x && mx <= x + width && my >= textLayer.y && my <= textLayer.y + height) {
            return layer.id;
          }
        }
      } else {
        const imgLayer = layer as ImageLayer;
        if (mx >= imgLayer.x && mx <= imgLayer.x + imgLayer.width &&
            my >= imgLayer.y && my <= imgLayer.y + imgLayer.height) {
          return layer.id;
        }
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.shiftKey) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY, offsetX: canvasOffset.x, offsetY: canvasOffset.y });
      return;
    }

    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvasWidth / rect.width);
    const my = (e.clientY - rect.top) * (canvasHeight / rect.height);

    if (crop && isPointInCrop(mx, my, crop)) {
      if (crop.type === 'circle') {
        const c = crop as { type: 'circle'; x: number; y: number; radius: number };
        setIsDraggingCrop(true);
        setDragStart({ x: mx, y: my, layerX: 0, layerY: 0, cropX: c.x, cropY: c.y, cropW: 0, cropH: 0 });
      } else {
        const r = crop as { type: 'square' | 'rectangle'; x: number; y: number; width: number; height: number };
        setIsDraggingCrop(true);
        setDragStart({ x: mx, y: my, layerX: 0, layerY: 0, cropX: r.x, cropY: r.y, cropW: r.width, cropH: r.height });
      }
      return;
    }

    const handle = getHandleAtPoint(mx, my);
    
    if (handle === 'rotate') {
      setIsRotating(true);
      setActiveHandle('rotate');
      return;
    }

    if (handle) {
      setIsResizing(true);
      setActiveHandle(handle);
      setDragStart({ x: mx, y: my, layerX: selectedLayer!.x, layerY: selectedLayer!.y, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });
      return;
    }

    const layerId = hitTestLayer(mx, my);
    if (layerId) {
      const layer = layers.find(l => l.id === layerId);
      if (layer && layer.locked) {
        return;
      }
      onSelectLayer(layerId);
      setIsDragging(true);
      setDragStart({ x: mx, y: my, layerX: selectedLayer!.x, layerY: selectedLayer!.y, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });
    } else {
      onSelectLayer(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setCanvasOffset({ x: panStart.offsetX + dx, y: panStart.offsetY + dy });
      return;
    }

    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvasWidth / rect.width);
    const my = (e.clientY - rect.top) * (canvasHeight / rect.height);

    if (isDraggingCrop && crop) {
      const dx = mx - dragStart.x;
      const dy = my - dragStart.y;
      if (crop.type === 'circle') {
        const c = crop as { type: 'circle'; x: number; y: number; radius: number };
        const newX = Math.max(c.radius, Math.min(canvasWidth - c.radius, dragStart.cropX + dx));
        const newY = Math.max(c.radius, Math.min(canvasHeight - c.radius, dragStart.cropY + dy));
        onUpdateCrop({ x: newX, y: newY });
      } else {
        const r = crop as { type: 'square' | 'rectangle'; x: number; y: number; width: number; height: number };
        const newX = Math.max(0, Math.min(canvasWidth - r.width, dragStart.cropX + dx));
        const newY = Math.max(0, Math.min(canvasHeight - r.height, dragStart.cropY + dy));
        onUpdateCrop({ x: newX, y: newY });
      }
      return;
    }

    if (!selectedLayer || (!isDragging && !isResizing && !isRotating)) return;

    if (isDragging) {
      const dx = mx - dragStart.x;
      const dy = my - dragStart.y;
      onUpdateLayer(selectedLayerId!, { x: dragStart.layerX + dx, y: dragStart.layerY + dy });
    }

    if (isResizing && activeHandle) {
      const dx = mx - dragStart.x;
      const dy = my - dragStart.y;
      const layer = selectedLayer as ImageLayer;
      
      let newWidth = layer.width;
      let newHeight = layer.height;
      let newX = layer.x;
      let newY = layer.y;

      if (activeHandle.includes('r')) newWidth = Math.max(20, layer.width + dx);
      if (activeHandle.includes('l')) { newWidth = Math.max(20, layer.width - dx); newX = dragStart.layerX + dx; }
      if (activeHandle.includes('b')) newHeight = Math.max(20, layer.height + dy);
      if (activeHandle.includes('t')) { newHeight = Math.max(20, layer.height - dy); newY = dragStart.layerY + dy; }

      onUpdateLayer(selectedLayerId!, { width: newWidth, height: newHeight, x: newX, y: newY });
      setDragStart({ ...dragStart, x: mx, y: my });
    }

    if (isRotating) {
      const imgLayer = selectedLayer as ImageLayer;
      const cx = imgLayer.x + imgLayer.width / 2;
      const cy = imgLayer.y + imgLayer.height / 2;
      const angle = Math.atan2(my - cy, mx - cx) * (180 / Math.PI) + 90;
      onUpdateLayer(selectedLayerId!, { rotation: angle });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setIsDraggingCrop(false);
    setIsPanning(false);
    setActiveHandle(null);
  };

  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const mx = (clientX - rect.left) * (canvasWidth / rect.width);
    const my = (clientY - rect.top) * (canvasHeight / rect.height);
    return { mx, my };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const { mx, my } = getPointerPosition(e);

    if (crop && isPointInCrop(mx, my, crop)) {
      if (crop.type === 'circle') {
        const c = crop as { type: 'circle'; x: number; y: number; radius: number };
        setIsDraggingCrop(true);
        setDragStart({ x: mx, y: my, layerX: 0, layerY: 0, cropX: c.x, cropY: c.y, cropW: 0, cropH: 0 });
      } else {
        const r = crop as { type: 'square' | 'rectangle'; x: number; y: number; width: number; height: number };
        setIsDraggingCrop(true);
        setDragStart({ x: mx, y: my, layerX: 0, layerY: 0, cropX: r.x, cropY: r.y, cropW: r.width, cropH: r.height });
      }
      return;
    }

    const handle = getHandleAtPoint(mx, my);
    
    if (handle === 'rotate') {
      setIsRotating(true);
      setActiveHandle('rotate');
      return;
    }

    if (handle) {
      setIsResizing(true);
      setActiveHandle(handle);
      setDragStart({ x: mx, y: my, layerX: selectedLayer!.x, layerY: selectedLayer!.y, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });
      return;
    }

    const layerId = hitTestLayer(mx, my);
    if (layerId) {
      const layer = layers.find(l => l.id === layerId);
      if (layer && layer.locked) {
        return;
      }
      onSelectLayer(layerId);
      setIsDragging(true);
      setDragStart({ x: mx, y: my, layerX: selectedLayer!.x, layerY: selectedLayer!.y, cropX: 0, cropY: 0, cropW: 0, cropH: 0 });
    } else {
      onSelectLayer(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const { mx, my } = getPointerPosition(e);

    if (isDraggingCrop && crop) {
      const dx = mx - dragStart.x;
      const dy = my - dragStart.y;
      if (crop.type === 'circle') {
        const c = crop as { type: 'circle'; x: number; y: number; radius: number };
        const newX = Math.max(c.radius, Math.min(canvasWidth - c.radius, dragStart.cropX + dx));
        const newY = Math.max(c.radius, Math.min(canvasHeight - c.radius, dragStart.cropY + dy));
        onUpdateCrop({ x: newX, y: newY });
      } else {
        const r = crop as { type: 'square' | 'rectangle'; x: number; y: number; width: number; height: number };
        const newX = Math.max(0, Math.min(canvasWidth - r.width, dragStart.cropX + dx));
        const newY = Math.max(0, Math.min(canvasHeight - r.height, dragStart.cropY + dy));
        onUpdateCrop({ x: newX, y: newY });
      }
      return;
    }

    if (!selectedLayer || (!isDragging && !isResizing && !isRotating)) return;

    if (isDragging) {
      const dx = mx - dragStart.x;
      const dy = my - dragStart.y;
      onUpdateLayer(selectedLayerId!, { x: dragStart.layerX + dx, y: dragStart.layerY + dy });
    }

    if (isResizing && activeHandle) {
      const dx = mx - dragStart.x;
      const dy = my - dragStart.y;
      const layer = selectedLayer as ImageLayer;
      
      let newWidth = layer.width;
      let newHeight = layer.height;
      let newX = layer.x;
      let newY = layer.y;

      if (activeHandle.includes('r')) newWidth = Math.max(20, layer.width + dx);
      if (activeHandle.includes('l')) { newWidth = Math.max(20, layer.width - dx); newX = dragStart.layerX + dx; }
      if (activeHandle.includes('b')) newHeight = Math.max(20, layer.height + dy);
      if (activeHandle.includes('t')) { newHeight = Math.max(20, layer.height - dy); newY = dragStart.layerY + dy; }

      onUpdateLayer(selectedLayerId!, { width: newWidth, height: newHeight, x: newX, y: newY });
      setDragStart({ ...dragStart, x: mx, y: my });
    }

    if (isRotating) {
      const imgLayer = selectedLayer as ImageLayer;
      const cx = imgLayer.x + imgLayer.width / 2;
      const cy = imgLayer.y + imgLayer.height / 2;
      const angle = Math.atan2(my - cy, mx - cx) * (180 / Math.PI) + 90;
      onUpdateLayer(selectedLayerId!, { rotation: angle });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    const newZoom = Math.max(25, Math.min(200, zoom + delta));
    setZoom(newZoom);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      onError?.('Please upload valid image files only');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        let src = reader.result as string;
        if (img.width > 4000 || img.height > 4000) {
          const canvas = document.createElement('canvas');
          const scale = 4000 / Math.max(img.width, img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          src = canvas.toDataURL('image/jpeg', 0.9);
        }
        onAddPhoto(src, img.width, img.height);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStartZoom = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = getTouchDistance(e.touches);
      if (lastTouchDistance === null) {
        setLastTouchDistance(dist);
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        setPanStart({ x: midX, y: midY, offsetX: canvasOffset.x, offsetY: canvasOffset.y });
      } else {
        if (Math.abs(dist - lastTouchDistance) < 30) {
          setIsPanning(true);
        }
      }
    }
  };

  const handleTouchMoveZoom = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = getTouchDistance(e.touches);
      const currentDistance = dist;
      
      if (isPanning) {
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        const dx = midX - panStart.x;
        const dy = midY - panStart.y;
        setCanvasOffset({ x: panStart.offsetX + dx, y: panStart.offsetY + dy });
      } else {
        e.preventDefault();
        const delta = (currentDistance - lastTouchDistance) * 0.5;
        const newZoom = Math.max(25, Math.min(200, zoom + delta));
        setZoom(newZoom);
      }
      setLastTouchDistance(currentDistance);
    }
  };

  const handleTouchEndZoom = () => {
    setLastTouchDistance(null);
    setIsPanning(false);
  };

  const handleDownloadWhatsAppDP = async () => {
    const dpSize = 512;
    const canvas = document.createElement('canvas');
    canvas.width = dpSize;
    canvas.height = dpSize;
    
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = canvasBackgroundColor;
    ctx.fillRect(0, 0, dpSize, dpSize);

    const scale = dpSize / Math.max(canvasWidth, canvasHeight);

    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.save();
      
      if (layer.type === 'template' || layer.type === 'photo') {
        const imgLayer = layer as ImageLayer;
        const img = imageCache.get(layer.id);
        if (!img) continue;

        const x = imgLayer.x * scale;
        const y = imgLayer.y * scale;
        const width = imgLayer.width * scale;
        const height = imgLayer.height * scale;

        ctx.globalAlpha = imgLayer.opacity;
        const brightness = 100 + imgLayer.brightness;
        const contrast = 100 + imgLayer.contrast;
        const saturation = 100 + imgLayer.saturation;
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate((imgLayer.rotation * Math.PI) / 180);
        ctx.scale(imgLayer.flipH ? -1 : 1, imgLayer.flipV ? -1 : 1);
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.filter = 'none';
      } else if (layer.type === 'text') {
        const textLayer = layer as TextLayer;
        const x = textLayer.x * scale;
        const y = textLayer.y * scale;
        const fontSize = textLayer.fontSize * scale;

        ctx.globalAlpha = textLayer.opacity;
        ctx.font = `${textLayer.fontStyle} ${textLayer.fontWeight} ${fontSize}px ${textLayer.fontFamily}`;
        ctx.fillStyle = textLayer.color;
        ctx.textAlign = textLayer.textAlign;
        ctx.textBaseline = 'top';

        const lines = textLayer.text.split('\n');
        const lineHeight = fontSize * textLayer.lineHeight;

        lines.forEach((line, i) => {
          const lineY = y + i * lineHeight;
          if (textLayer.strokeWidth > 0) {
            ctx.strokeStyle = textLayer.strokeColor;
            ctx.lineWidth = textLayer.strokeWidth * scale;
            ctx.lineJoin = 'round';
            ctx.strokeText(line, x, lineY);
          }
          ctx.fillText(line, x, lineY);
        });
      }
      
      ctx.restore();
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = dpSize;
        tempCanvas.height = dpSize;
        const tempCtx = tempCanvas.getContext('2d')!;
        
        tempCtx.beginPath();
        tempCtx.arc(dpSize / 2, dpSize / 2, dpSize / 2, 0, Math.PI * 2);
        tempCtx.clip();
        tempCtx.drawImage(canvas, 0, 0);
        
        tempCanvas.toBlob((circleBlob) => {
          if (circleBlob) {
            saveAs(circleBlob, `whatsapp-dp-${new Date().toISOString().split('T')[0]}.png`);
          }
        }, 'image/png');
      }
    }, 'image/png');
  };

  const hasTemplate = layers.some(l => l.type === 'template');

  return (
    <div className="flex-1 bg-gray-100 relative overflow-hidden flex items-center justify-center"
        onWheel={handleWheel}
      >
      <div
        className="relative shadow-lg"
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom / 100})`,
          transformOrigin: 'center',
        }}
      >
        {!hasTemplate && layers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white border-2 border-dashed border-gray-300 m-2 rounded-md pointer-events-none z-10">
            <p className="text-gray-400 text-sm">Upload a template to begin</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="bg-white cursor-crosshair touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={(e) => { handleTouchStartZoom(e); handleTouchStart(e); }}
          onTouchMove={(e) => { handleTouchMoveZoom(e); handleTouchMove(e); }}
          onTouchEnd={() => { handleTouchEndZoom(); handleMouseUp(); }}
        />
        {showUploadButton && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-orange-600 transition-colors pointer-events-auto"
            >
              Upload Your Image
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        onClick={handleDownloadWhatsAppDP}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 touch-manipulation"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">WhatsApp DP</span>
      </button>
    </div>
  );
}