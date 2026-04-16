import type { Layer, ImageLayer, TextLayer } from '../types/editor';

export function renderToCanvas(
  layers: Layer[],
  canvasWidth: number,
  canvasHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const visibleLayers = layers.filter(l => l.visible);
  
  for (const layer of visibleLayers) {
    ctx.save();
    
    if (layer.type === 'template' || layer.type === 'photo') {
      renderImageLayer(ctx, layer as ImageLayer);
    } else if (layer.type === 'text') {
      renderTextLayer(ctx, layer as TextLayer);
    }
    
    ctx.restore();
  }
  
  return canvas;
}

function renderImageLayer(ctx: CanvasRenderingContext2D, layer: ImageLayer) {
  const img = new Image();
  img.src = layer.src;
  
  const x = layer.x;
  const y = layer.y;
  const width = layer.width;
  const height = layer.height;
  
  ctx.globalAlpha = layer.opacity;
  
  const brightness = 100 + layer.brightness;
  const contrast = 100 + layer.contrast;
  const saturation = 100 + layer.saturation;
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  ctx.filter = 'none';
}

function renderTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer) {
  const x = layer.x;
  const y = layer.y;
  const fontSize = layer.fontSize;
  
  ctx.globalAlpha = layer.opacity;
  ctx.font = `${layer.fontStyle} ${layer.fontWeight} ${fontSize}px ${layer.fontFamily}`;
  ctx.fillStyle = layer.color;
  ctx.textAlign = layer.textAlign;
  ctx.textBaseline = 'top';
  
  const lines = layer.text.split('\n');
  const lineHeight = fontSize * layer.lineHeight;
  
  lines.forEach((line, i) => {
    const lineY = y + i * lineHeight;
    
    if (layer.strokeWidth > 0) {
      ctx.strokeStyle = layer.strokeColor;
      ctx.lineWidth = layer.strokeWidth;
      ctx.lineJoin = 'round';
      ctx.strokeText(line, x, lineY);
    }
    
    ctx.fillText(line, x, lineY);
  });
}