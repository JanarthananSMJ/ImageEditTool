import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import type { Layer, Crop, CropType } from '../types/editor';

interface ExportModalProps {
  layers: Layer[];
  canvasWidth: number;
  canvasHeight: number;
  crop: Crop | null;
  cropType: CropType;
  onClose: () => void;
}

export default function ExportModal({ layers, canvasWidth, canvasHeight, crop, cropType, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(85);
  const [filename, setFilename] = useState(`election-poster-${new Date().toISOString().split('T')[0]}`);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    renderPreview();
  }, [layers, canvasWidth, canvasHeight, crop]);

  const getCropSize = () => {
    if (!crop) return { width: canvasWidth, height: canvasHeight };
    if (crop.type === 'circle') {
      const c = crop as { type: 'circle'; radius: number };
      return { width: c.radius * 2, height: c.radius * 2 };
    } else {
      const r = crop as { type: 'square' | 'rectangle'; width: number; height: number };
      return { width: r.width, height: r.height };
    }
  };

  const cropSize = getCropSize();

  const renderPreview = async () => {
    const maxPreviewSize = 400;
    const scale = Math.min(maxPreviewSize / cropSize.width, maxPreviewSize / cropSize.height, 1);
    
    const canvas = document.createElement('canvas');
    canvas.width = cropSize.width * scale;
    canvas.height = cropSize.height * scale;
    
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.save();
      
      if (layer.type === 'template' || layer.type === 'photo') {
        const img = new Image();
        await new Promise(resolve => {
          img.onload = resolve;
          img.src = (layer as any).src;
        });
        
        const imgLayer = layer as any;
        let x: number, y: number, width: number, height: number;
        
        if (crop) {
          if (crop.type === 'circle') {
            const c = crop as { type: 'circle'; x: number; y: number; radius: number };
            x = (imgLayer.x - c.x + c.radius) * scale;
            y = (imgLayer.y - c.y + c.radius) * scale;
          } else {
            const r = crop as { type: 'square' | 'rectangle'; x: number; y: number; width: number; height: number };
            x = (imgLayer.x - r.x) * scale;
            y = (imgLayer.y - r.y) * scale;
          }
          width = imgLayer.width * scale;
          height = imgLayer.height * scale;
        } else {
          x = imgLayer.x * scale;
          y = imgLayer.y * scale;
          width = imgLayer.width * scale;
          height = imgLayer.height * scale;
        }
        
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
        const textLayer = layer as any;
        let x: number, y: number, fontSize: number;
        
        if (crop) {
          if (crop.type === 'circle') {
            const c = crop as { type: 'circle'; x: number; y: number; radius: number };
            x = (textLayer.x - c.x + c.radius) * scale;
            y = (textLayer.y - c.y + c.radius) * scale;
          } else {
            const r = crop as { type: 'square' | 'rectangle'; x: number; y: number; width: number; height: number };
            x = (textLayer.x - r.x) * scale;
            y = (textLayer.y - r.y) * scale;
          }
          fontSize = textLayer.fontSize * scale;
        } else {
          x = textLayer.x * scale;
          y = textLayer.y * scale;
          fontSize = textLayer.fontSize * scale;
        }
        
        ctx.globalAlpha = textLayer.opacity;
        ctx.font = `${textLayer.fontStyle} ${textLayer.fontWeight} ${fontSize}px ${textLayer.fontFamily}`;
        ctx.fillStyle = textLayer.color;
        ctx.textAlign = textLayer.textAlign;
        ctx.textBaseline = 'top';
        
        const lines = textLayer.text.split('\n');
        const lineHeight = fontSize * textLayer.lineHeight;
        
        lines.forEach((line: string, i: number) => {
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

    let previewFinalUrl: string | null = null;

    if (crop && crop.type === 'circle') {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      
      tempCtx.beginPath();
      tempCtx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
      tempCtx.clip();
      tempCtx.drawImage(canvas, 0, 0);
      
      previewFinalUrl = tempCanvas.toDataURL('image/png');
    } else {
      previewFinalUrl = canvas.toDataURL('image/png');
    }

    setPreviewUrl(previewFinalUrl);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    const canvas = document.createElement('canvas');
    canvas.width = cropSize.width;
    canvas.height = cropSize.height;
    
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.save();
      
      if (layer.type === 'template' || layer.type === 'photo') {
        const img = new Image();
        await new Promise(resolve => {
          img.onload = resolve;
          img.src = (layer as any).src;
        });
        
        const imgLayer = layer as any;
        let x: number, y: number, width: number, height: number;
        
        if (crop) {
          if (crop.type === 'circle') {
            const c = crop as { type: 'circle'; x: number; y: number; radius: number };
            x = imgLayer.x - c.x + c.radius;
            y = imgLayer.y - c.y + c.radius;
          } else {
            const r = crop as { type: 'square' | 'rectangle'; x: number; y: number; width: number; height: number };
            x = imgLayer.x - r.x;
            y = imgLayer.y - r.y;
          }
          width = imgLayer.width;
          height = imgLayer.height;
        } else {
          x = imgLayer.x;
          y = imgLayer.y;
          width = imgLayer.width;
          height = imgLayer.height;
        }
        
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
        const textLayer = layer as any;
        let x: number, y: number, fontSize: number;
        
        if (crop) {
          if (crop.type === 'circle') {
            const c = crop as { type: 'circle'; x: number; y: number; radius: number };
            x = textLayer.x - c.x + c.radius;
            y = textLayer.y - c.y + c.radius;
          } else {
            const r = crop as { type: 'square' | 'rectangle'; x: number; y: number; width: number; height: number };
            x = textLayer.x - r.x;
            y = textLayer.y - r.y;
          }
          fontSize = textLayer.fontSize;
        } else {
          x = textLayer.x;
          y = textLayer.y;
          fontSize = textLayer.fontSize;
        }
        
        ctx.globalAlpha = textLayer.opacity;
        ctx.font = `${textLayer.fontStyle} ${textLayer.fontWeight} ${fontSize}px ${textLayer.fontFamily}`;
        ctx.fillStyle = textLayer.color;
        ctx.textAlign = textLayer.textAlign;
        ctx.textBaseline = 'top';
        
        const lines = textLayer.text.split('\n');
        const lineHeight = fontSize * textLayer.lineHeight;
        
        lines.forEach((line: string, i: number) => {
          const lineY = y + i * lineHeight;
          if (textLayer.strokeWidth > 0) {
            ctx.strokeStyle = textLayer.strokeColor;
            ctx.lineWidth = textLayer.strokeWidth;
            ctx.lineJoin = 'round';
            ctx.strokeText(line, x, lineY);
          }
          ctx.fillText(line, x, lineY);
        });
      }
      
      ctx.restore();
    }

    let finalCanvas = canvas;
    if (crop && crop.type === 'circle') {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      
      tempCtx.beginPath();
      tempCtx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
      tempCtx.clip();
      tempCtx.drawImage(canvas, 0, 0);
      
      finalCanvas = tempCanvas;
    }

    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const qualityValue = format === 'jpeg' ? quality / 100 : undefined;
    
    finalCanvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${filename}.${format}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
      setIsExporting(false);
    }, mimeType, qualityValue);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Export Poster</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex justify-center bg-gray-100 rounded-lg p-4">
            {previewUrl && (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className={`max-w-full max-h-48 object-contain ${crop?.type === 'circle' ? 'rounded-full' : ''}`} 
              />
            )}
          </div>

          <div className="text-sm text-gray-600 text-center">
            {crop && cropType === 'circle'
              ? `WhatsApp DP: ${cropSize.width} × ${cropSize.height} px (circular)`
              : crop && cropType === 'square'
              ? `Square: ${cropSize.width} × ${cropSize.height} px`
              : crop && cropType === 'rectangle'
              ? `Widescreen: ${cropSize.width} × ${cropSize.height} px`
              : `Export size: ${canvasWidth} × ${canvasHeight} px`
            }
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Format</label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setFormat('png')}
                className={`px-4 py-2 text-sm border rounded ${format === 'png' ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-300'}`}
              >
                PNG
              </button>
              <button
                onClick={() => setFormat('jpeg')}
                className={`px-4 py-2 text-sm border rounded ${format === 'jpeg' ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-300'}`}
              >
                JPEG
              </button>
            </div>
          </div>

          {format === 'jpeg' && (
            <div>
              <label className="text-sm font-medium text-gray-700">Quality: {quality}%</label>
              <input
                type="range"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full mt-1"
                min={60}
                max={100}
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Filename</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
          >
            {isExporting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download
          </button>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Poster downloaded!
        </div>
      )}
    </div>
  );
}