import { useState, useRef, useEffect } from 'react';
import { Layers, Image, Type, Square, Circle, RectangleHorizontal as RectHorizontal, ChevronDown, ChevronRight, Trash2, Copy, ArrowUp, ArrowDown, Lock, Unlock, FlipHorizontal, FlipVertical, Sun, Contrast, Droplets, Crop as CropIcon, PencilRuler, Upload, RotateCw, Maximize2 } from 'lucide-react';
import type { Layer, ImageLayer, TextLayer, Crop, CropType } from '../types/editor';

interface SidebarProps {
  onAddTemplate: (src: string) => void;
  onAddPhoto: (src: string, width: number, height: number) => void;
  onAddText: () => void;
  layers: Layer[];
  canvasWidth: number;
  canvasHeight: number;
  onCanvasResize: (width: number, height: number) => void;
  crop: Crop | null;
  cropType: CropType;
  onSetCrop: (crop: Crop | null, cropType: CropType) => void;
  onSetCropType: (cropType: CropType) => void;
  selectedLayerId: string | null;
  onSelectLayer?: (id: string | null) => void;
  onUpdateLayer: (id: string, patch: Partial<Layer>) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onUpdateCrop?: (patch: Partial<Crop>) => void;
  onError?: (message: string) => void;
  isMobile?: boolean;
}

type SidebarSection = 'canvas' | 'upload' | 'crop' | 'edit' | 'layer';

export default function Sidebar({
  onAddTemplate,
  onAddPhoto,
  onAddText,
  layers,
  canvasWidth,
  canvasHeight,
  onCanvasResize,
  crop,
  cropType,
  onSetCrop,
  onSetCropType,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onMoveLayer,
  onError,
  isMobile = false,
}: SidebarProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [widthInput, setWidthInput] = useState(canvasWidth.toString());
  const [heightInput, setHeightInput] = useState(canvasHeight.toString());
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setWidthInput(canvasWidth.toString());
    setHeightInput(canvasHeight.toString());
  }, [canvasWidth, canvasHeight]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => setIsHovered(false), 300);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'template' | 'photo') => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
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
          if (type === 'template') onAddTemplate(src);
          else onAddPhoto(src, img.width, img.height);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleSection = (section: SidebarSection) => {
    setExpanded(expanded === section ? null : section);
    setIsHovered(true);
  };

  const handleCropTypeChange = (type: CropType) => {
    if (crop && cropType === type) {
      onSetCrop(null, type);
    } else {
      onSetCropType(type);
      if (type === 'circle') {
        const radius = Math.min(canvasWidth, canvasHeight) / 2 - 20;
        onSetCrop({ type: 'circle', x: canvasWidth / 2, y: canvasHeight / 2, radius }, type);
      } else if (type === 'square') {
        const size = Math.min(canvasWidth, canvasHeight) - 40;
        onSetCrop({ type: 'square', x: (canvasWidth - size) / 2, y: (canvasHeight - size) / 2, width: size, height: size, aspectRatio: '1:1' }, type);
      } else if (type === 'rectangle') {
        const width = Math.min(canvasWidth - 40, canvasHeight * 1.5);
        const height = (width / 16) * 9;
        onSetCrop({ type: 'rectangle', x: (canvasWidth - width) / 2, y: (canvasHeight - height) / 2, width, height, aspectRatio: '16:9' }, type);
      }
    }
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const isTextLayer = selectedLayer?.type === 'text';

  if (isMobile) {
    return (
      <div className="bg-gray-900 text-white flex flex-col rounded-xl overflow-hidden max-h-[50vh]">
        <div className="flex flex-row items-center justify-center gap-2 px-2 py-2 border-b border-gray-700 shrink-0">
          <MobileSidebarItem
            icon={<Square className="w-5 h-5" />}
            label="Canvas"
            onClick={() => toggleSection('canvas')}
            isActive={expanded === 'canvas'}
          />
          <MobileSidebarItem
            icon={<Upload className="w-5 h-5" />}
            label="Upload"
            onClick={() => toggleSection('upload')}
            isActive={expanded === 'upload'}
          />
          <MobileSidebarItem
            icon={<CropIcon className="w-5 h-5" />}
            label="Crop"
            onClick={() => toggleSection('crop')}
            isActive={expanded === 'crop'}
          />
          <MobileSidebarItem
            icon={<PencilRuler className="w-5 h-5" />}
            label="Edit"
            onClick={() => toggleSection('edit')}
            isActive={expanded === 'edit'}
          />
          <MobileSidebarItem
            icon={<Layers className="w-5 h-5" />}
            label="Layer"
            onClick={() => toggleSection('layer')}
            isActive={expanded === 'layer'}
          />
        </div>
        {expanded === 'canvas' && (
          <div className="px-4 py-3 space-y-3 overflow-y-auto max-h-[45vh]">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Width</label>
              <input
                type="text"
                value={widthInput}
                onChange={(e) => setWidthInput(e.target.value)}
                onBlur={() => {
                  const w = parseInt(widthInput) || 100;
                  onCanvasResize(Math.max(1, w), canvasHeight);
                }}
                className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-center focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Height</label>
              <input
                type="text"
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                onBlur={() => {
                  const h = parseInt(heightInput) || 100;
                  onCanvasResize(canvasWidth, Math.max(1, h));
                }}
                className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-center focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="text-xs text-gray-500 text-center">
              {canvasWidth} × {canvasHeight} px
            </div>
          </div>
        )}
        {expanded === 'upload' && (
          <div className="px-4 py-3 space-y-3 overflow-y-auto max-h-[45vh]">
            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-800">
              <Upload className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-xs text-gray-400">Add Template</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'template')} />
            </label>
            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-800">
              <Image className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-xs text-gray-400">Add Image</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} />
            </label>
            <button onClick={onAddText} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 rounded-lg">
              <Type className="w-4 h-4" />
              <span className="text-sm font-medium">Add Text</span>
            </button>
            <button onClick={() => {
              onCanvasResize(512, 512);
              const img = new window.Image();
              img.onload = () => onAddPhoto(img.src, img.width, img.height);
              img.onerror = () => onError?.('DMK.png not found in /Political_Parties_template/DMK/');
              img.src = '/Political_Parties_template/DMK/DMK.png';
            }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 rounded-lg">
              <span className="text-sm font-medium">DMK</span>
            </button>
          </div>
        )}
        {expanded === 'crop' && (
          <div className="px-4 py-3 space-y-3 overflow-y-auto max-h-[45vh]">
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleCropTypeChange('circle')} className={`flex flex-col items-center p-3 rounded-lg ${crop?.type === 'circle' ? 'bg-orange-500' : 'bg-gray-800'}`}>
                <Circle className="w-6 h-6 mb-1" />
                <span className="text-xs">Circle</span>
              </button>
              <button onClick={() => handleCropTypeChange('square')} className={`flex flex-col items-center p-3 rounded-lg ${crop?.type === 'square' ? 'bg-orange-500' : 'bg-gray-800'}`}>
                <Square className="w-6 h-6 mb-1" />
                <span className="text-xs">Square</span>
              </button>
              <button onClick={() => handleCropTypeChange('rectangle')} className={`flex flex-col items-center p-3 rounded-lg ${crop?.type === 'rectangle' ? 'bg-orange-500' : 'bg-gray-800'}`}>
                <RectHorizontal className="w-6 h-6 mb-1" />
                <span className="text-xs">16:9</span>
              </button>
            </div>
            {crop && <div className="text-xs text-gray-500 text-center">Drag the crop area on canvas to position it</div>}
          </div>
        )}
        {expanded === 'edit' && selectedLayer && (
          <div className="px-4 py-3 space-y-3 overflow-y-auto max-h-[45vh]">
            {isTextLayer ? (
              <TextEditControls layer={selectedLayer as TextLayer} onUpdateLayer={onUpdateLayer} />
            ) : (
              <ImageEditControls layer={selectedLayer as ImageLayer} onUpdateLayer={onUpdateLayer} />
            )}
              <LayerActions layer={selectedLayer} onUpdateLayer={onUpdateLayer} onDelete={onDeleteLayer} onDuplicate={onDuplicateLayer} />
          </div>
        )}
        {expanded === 'edit' && !selectedLayer && (
          <div className="px-4 py-6 text-xs text-gray-500 text-center">Select a layer to edit</div>
        )}
        {expanded === 'layer' && (
          <div className="px-4 py-3 space-y-2 overflow-y-auto max-h-[45vh]">
              {layers.map((layer) => (
              <LayerItem
                key={layer.id}
                layer={layer}
                isSelected={selectedLayerId === layer.id}
                onSelect={() => onSelectLayer?.(layer.id)}
                onMoveUp={() => onMoveLayer(layer.id, 'up')}
                onMoveDown={() => onMoveLayer(layer.id, 'down')}
                onDuplicate={() => onDuplicateLayer(layer.id)}
                onDelete={() => onDeleteLayer(layer.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ease-out overflow-hidden rounded-xl ${
        isHovered || expanded ? 'w-72' : 'w-16'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col items-center justify-center py-4 gap-2 border-b border-gray-700 px-2 rounded-t-xl">
        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
          <Layers className="w-6 h-6 text-white" />
        </div>
        {(isHovered || expanded) && <span className="font-bold text-sm text-center">PosterMaker</span>}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <SidebarItem
          icon={<Square className="w-5 h-5" />}
          label="Canvas"
          expanded={expanded}
          section="canvas"
          isHovered={isHovered}
          onClick={() => toggleSection('canvas')}
        >
          {expanded === 'canvas' && (
            <div className="px-4 py-3 space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Width</label>
                <input
                  type="text"
                  value={widthInput}
                  onChange={(e) => setWidthInput(e.target.value)}
                  onBlur={() => {
                    const w = parseInt(widthInput) || 100;
                    onCanvasResize(Math.max(1, w), canvasHeight);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-center focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="Width"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Height</label>
                <input
                  type="text"
                  value={heightInput}
                  onChange={(e) => setHeightInput(e.target.value)}
                  onBlur={() => {
                    const h = parseInt(heightInput) || 100;
                    onCanvasResize(canvasWidth, Math.max(1, h));
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-center focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="Height"
/>
                </div>
                <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
                  {canvasWidth} × {canvasHeight} px
                </div>
            </div>
          )}
        </SidebarItem>

        <SidebarItem
          icon={<Upload className="w-5 h-5" />}
          label="Upload"
          expanded={expanded}
          section="upload"
          isHovered={isHovered}
          onClick={() => toggleSection('upload')}
        >
          {expanded === 'upload' && (
            <div className="px-4 py-3 space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-xs text-gray-400">Add Template</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'template')} />
              </label>
              <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <Image className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-xs text-gray-400">Add Image</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} />
              </label>
              <button
                onClick={onAddText}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Type className="w-4 h-4" />
                <span className="text-sm font-medium">Add Text</span>
              </button>
              <button
                onClick={() => {
                  onCanvasResize(512, 512);
                  const img = new window.Image();
                  img.onload = () => onAddPhoto(img.src, img.width, img.height);
                  img.onerror = () => onError?.('DMK.png not found in /Political_Parties_template/DMK/');
                  img.src = '/Political_Parties_template/DMK/DMK.png';
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <span className="text-sm font-medium">DMK</span>
              </button>
              <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
                {canvasWidth} × {canvasHeight} px
              </div>
            </div>
          )}
        </SidebarItem>

        <SidebarItem
          icon={<CropIcon className="w-5 h-5" />}
          label="Crop"
          expanded={expanded}
          section="crop"
          isHovered={isHovered}
          onClick={() => toggleSection('crop')}
        >
          {expanded === 'crop' && (
            <div className="px-4 py-3 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleCropTypeChange('circle')}
                  className={`flex flex-col items-center p-3 rounded-lg ${crop?.type === 'circle' ? 'bg-orange-500' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  <Circle className="w-6 h-6 mb-2" />
                  <span className="text-xs">Circle</span>
                </button>
                <button
                  onClick={() => handleCropTypeChange('square')}
                  className={`flex flex-col items-center p-3 rounded-lg ${crop?.type === 'square' ? 'bg-orange-500' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  <Square className="w-6 h-6 mb-2" />
                  <span className="text-xs">Square</span>
                </button>
                <button
                  onClick={() => handleCropTypeChange('rectangle')}
                  className={`flex flex-col items-center p-3 rounded-lg ${crop?.type === 'rectangle' ? 'bg-orange-500' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  <RectHorizontal className="w-6 h-6 mb-2" />
                  <span className="text-xs">16:9</span>
                </button>
              </div>
              {crop && (
                <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
                  Drag the crop area on canvas to position it
                </div>
              )}
            </div>
          )}
        </SidebarItem>

        <SidebarItem
          icon={<PencilRuler className="w-5 h-5" />}
          label="Edit"
          expanded={expanded}
          section="edit"
          isHovered={isHovered}
          onClick={() => toggleSection('edit')}
        >
          {expanded === 'edit' && selectedLayer && (
            <div className="px-4 py-3 space-y-4">
              {isTextLayer ? (
                <TextEditControls layer={selectedLayer as TextLayer} onUpdateLayer={onUpdateLayer} />
              ) : (
                <ImageEditControls layer={selectedLayer as ImageLayer} onUpdateLayer={onUpdateLayer} />
              )}
              <LayerActions layer={selectedLayer} onUpdateLayer={onUpdateLayer} onDelete={onDeleteLayer} onDuplicate={onDuplicateLayer} />
            </div>
          )}
          {expanded === 'edit' && !selectedLayer && (
            <div className="px-4 py-6 text-xs text-gray-500 text-center">
              Select a layer to edit
            </div>
          )}
        </SidebarItem>

        <SidebarItem
          icon={<Layers className="w-5 h-5" />}
          label="Layer"
          expanded={expanded}
          section="layer"
          isHovered={isHovered}
          onClick={() => toggleSection('layer')}
        >
          {expanded === 'layer' && (
            <div className="px-4 py-3 space-y-2 overflow-y-auto max-h-[50vh]">
            {layers.map((layer) => (
                <LayerItem
                  key={layer.id}
                  layer={layer}
                  isSelected={selectedLayerId === layer.id}
                  onSelect={() => onSelectLayer?.(layer.id)}
                  onMoveUp={() => onMoveLayer(layer.id, 'up')}
                  onMoveDown={() => onMoveLayer(layer.id, 'down')}
                  onDuplicate={() => onDuplicateLayer(layer.id)}
                  onDelete={() => onDeleteLayer(layer.id)}
                />
              ))}
            </div>
          )}
        </SidebarItem>
      </div>
      <div className="flex-1" />
    </div>
  );
}

function MobileSidebarItem({
  icon,
  label,
  onClick,
  isActive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
        isActive ? 'bg-orange-500' : 'hover:bg-gray-800'
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}

function SidebarItem({
  icon,
  label,
  expanded,
  section,
  isHovered,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  expanded: string | null;
  section: SidebarSection;
  isHovered: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const isActive = expanded === section;
  return (
    <div>
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-center gap-3 px-4 py-3 transition-colors ${
          isActive ? 'bg-gray-800 border-l-2 border-orange-500' : 'hover:bg-gray-800/50'
        }`}
      >
        <div className="flex-shrink-0">{icon}</div>
        {(isHovered || expanded) && (
          <>
            <span className="flex-1 text-left text-sm font-medium">{label}</span>
            {isActive ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </>
        )}
      </button>
      {children}
    </div>
  );
}

function TextEditControls({
  layer,
  onUpdateLayer,
}: {
  layer: TextLayer;
  onUpdateLayer: (id: string, patch: Partial<Layer>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Text</label>
        <textarea
          value={layer.text}
          onChange={(e) => onUpdateLayer(layer.id, { text: e.target.value })}
          className="w-full h-20 px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg resize-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Font</label>
        <select
          value={layer.fontFamily}
          onChange={(e) => onUpdateLayer(layer.id, { fontFamily: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        >
          <option value="system-ui">System UI</option>
          <option value="Roboto">Roboto</option>
          <option value="Oswald">Oswald</option>
          <option value="Merriweather">Merriweather</option>
          <option value="Bebas Neue">Bebas Neue</option>
          <option value="Noto Serif">Noto Serif</option>
          <option value="Mukta">Mukta</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={layer.fontSize}
          onChange={(e) => onUpdateLayer(layer.id, { fontSize: parseInt(e.target.value) || 24 })}
          className="w-20 px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg"
          min={8}
          max={200}
        />
        <input
          type="range"
          value={layer.fontSize}
          onChange={(e) => onUpdateLayer(layer.id, { fontSize: parseInt(e.target.value) })}
          className="flex-1"
          min={8}
          max={200}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateLayer(layer.id, { fontWeight: layer.fontWeight === 'bold' ? 'normal' : 'bold' })}
          className={`flex-1 py-2 rounded-lg text-sm font-bold ${layer.fontWeight === 'bold' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300'}`}
        >
          B
        </button>
        <button
          onClick={() => onUpdateLayer(layer.id, { fontStyle: layer.fontStyle === 'italic' ? 'normal' : 'italic' })}
          className={`flex-1 py-2 rounded-lg text-sm italic ${layer.fontStyle === 'italic' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300'}`}
        >
          I
        </button>
        <button
          onClick={() => onUpdateLayer(layer.id, { textAlign: 'left' })}
          className={`flex-1 py-2 rounded-lg text-sm ${layer.textAlign === 'left' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300'}`}
        >
          ←
        </button>
        <button
          onClick={() => onUpdateLayer(layer.id, { textAlign: 'center' })}
          className={`flex-1 py-2 rounded-lg text-sm ${layer.textAlign === 'center' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300'}`}
        >
          ↔
        </button>
        <button
          onClick={() => onUpdateLayer(layer.id, { textAlign: 'right' })}
          className={`flex-1 py-2 rounded-lg text-sm ${layer.textAlign === 'right' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300'}`}
        >
          →
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Color</label>
          <input
            type="color"
            value={layer.color}
            onChange={(e) => onUpdateLayer(layer.id, { color: e.target.value })}
            className="w-10 h-10 rounded-lg cursor-pointer"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Stroke</label>
          <input
            type="color"
            value={layer.strokeColor}
            onChange={(e) => onUpdateLayer(layer.id, { strokeColor: e.target.value })}
            className="w-10 h-10 rounded-lg cursor-pointer"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Width</label>
          <input
            type="number"
            value={layer.strokeWidth}
            onChange={(e) => onUpdateLayer(layer.id, { strokeWidth: parseInt(e.target.value) || 0 })}
            className="w-16 px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg"
            min={0}
            max={20}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Opacity</label>
        <input
          type="range"
          value={layer.opacity * 100}
          onChange={(e) => onUpdateLayer(layer.id, { opacity: parseInt(e.target.value) / 100 })}
          className="w-full"
          min={0}
          max={100}
        />
      </div>
    </div>
  );
}

function ImageEditControls({
  layer,
  onUpdateLayer,
}: {
  layer: ImageLayer;
  onUpdateLayer: (id: string, patch: Partial<Layer>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Brightness</label>
        <div className="flex items-center gap-3">
          <Sun className="w-4 h-4 text-gray-500" />
          <input
            type="range"
            value={layer.brightness}
            onChange={(e) => onUpdateLayer(layer.id, { brightness: parseInt(e.target.value) })}
            className="flex-1"
            min={-100}
            max={100}
          />
          <span className="text-xs w-8 text-right">{layer.brightness}</span>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Contrast</label>
        <div className="flex items-center gap-3">
          <Contrast className="w-4 h-4 text-gray-500" />
          <input
            type="range"
            value={layer.contrast}
            onChange={(e) => onUpdateLayer(layer.id, { contrast: parseInt(e.target.value) })}
            className="flex-1"
            min={-100}
            max={100}
          />
          <span className="text-xs w-8 text-right">{layer.contrast}</span>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Saturation</label>
        <div className="flex items-center gap-3">
          <Droplets className="w-4 h-4 text-gray-500" />
          <input
            type="range"
            value={layer.saturation}
            onChange={(e) => onUpdateLayer(layer.id, { saturation: parseInt(e.target.value) })}
            className="flex-1"
            min={-100}
            max={100}
          />
          <span className="text-xs w-8 text-right">{layer.saturation}</span>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Opacity</label>
        <input
          type="range"
          value={layer.opacity * 100}
          onChange={(e) => onUpdateLayer(layer.id, { opacity: parseInt(e.target.value) / 100 })}
          className="w-full"
          min={0}
          max={100}
        />
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Scale</label>
        <div className="flex items-center gap-3">
          <Maximize2 className="w-4 h-4 text-gray-500" />
          <input
            type="range"
            value={layer.scaleX * 100}
            onChange={(e) => onUpdateLayer(layer.id, { scaleX: parseInt(e.target.value) / 100, scaleY: parseInt(e.target.value) / 100 })}
            className="flex-1"
            min={10}
            max={300}
          />
          <span className="text-xs w-10 text-right">{Math.round(layer.scaleX * 100)}%</span>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Rotate</label>
        <div className="flex items-center gap-3">
          <RotateCw className="w-4 h-4 text-gray-500" />
          <input
            type="range"
            value={layer.rotation}
            onChange={(e) => onUpdateLayer(layer.id, { rotation: parseInt(e.target.value) })}
            className="flex-1"
            min={-180}
            max={180}
          />
          <span className="text-xs w-10 text-right">{layer.rotation}°</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onUpdateLayer(layer.id, { flipH: !layer.flipH })}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm ${layer.flipH ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300'}`}
        >
          <FlipHorizontal className="w-4 h-4" /> Flip H
        </button>
        <button
          onClick={() => onUpdateLayer(layer.id, { flipV: !layer.flipV })}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm ${layer.flipV ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300'}`}
        >
          <FlipVertical className="w-4 h-4" /> Flip V
        </button>
      </div>
    </div>
  );
}

function LayerItem({
  layer,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: {
  layer: Layer;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const getLayerName = () => {
    if (layer.type === 'text') {
      return (layer as TextLayer).text.slice(0, 15) + ((layer as TextLayer).text.length > 15 ? '...' : '');
    } else {
      return layer.type === 'template' ? 'Template' : 'Photo';
    }
  };

  const getThumbnail = () => {
    if (layer.type === 'text') {
      const textLayer = layer as TextLayer;
      return (
        <div
          className="w-10 h-7.5 border border-gray-600 rounded flex items-center justify-center text-xs"
          style={{ backgroundColor: '#d1d5db', color: textLayer.color, fontFamily: textLayer.fontFamily }}
        >
          {textLayer.text.slice(0, 3)}
        </div>
      );
    } else {
      const imgLayer = layer as ImageLayer;
      return (
        <div
          className="w-10 h-7.5 border border-gray-600 rounded bg-cover bg-center"
          style={{ backgroundImage: `url(${imgLayer.src})`, backgroundColor: '#d1d5db' }}
        />
      );
    }
  };

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer w-full text-left ${
        isSelected ? 'bg-orange-500' : 'bg-gray-800 hover:bg-gray-700'
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
    >
      {getThumbnail()}
      <div className="flex-1 text-xs text-gray-300">{getLayerName()}</div>
      <div className="flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          className="p-1 bg-gray-700 rounded hover:bg-gray-600"
          title="Move up"
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          className="p-1 bg-gray-700 rounded hover:bg-gray-600"
          title="Move down"
        >
          <ArrowDown className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="p-1 bg-gray-700 rounded hover:bg-gray-600"
          title="Duplicate"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 bg-red-700 rounded hover:bg-red-600"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function LayerActions({
  layer,
  onUpdateLayer,
  onDelete,
  onDuplicate,
}: {
  layer: Layer;
  onUpdateLayer: (id: string, patch: Partial<Layer>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
      <button
        onClick={() => onDuplicate(layer.id)}
        className="p-2.5 bg-gray-800 rounded-lg hover:bg-gray-700"
        title="Duplicate"
      >
        <Copy className="w-4 h-4" />
      </button>
      <button
        onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}
        className={`p-2.5 rounded-lg ${layer.locked ? 'bg-orange-500' : 'bg-gray-800 hover:bg-gray-700'}`}
        title={layer.locked ? 'Unlock' : 'Lock'}
      >
        {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
      </button>
      <button
        onClick={() => onDelete(layer.id)}
        className="p-2.5 bg-red-900/80 rounded-lg hover:bg-red-800 ml-auto"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}