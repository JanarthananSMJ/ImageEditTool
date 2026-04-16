import { ArrowUp, ArrowDown, Copy, Trash2, Lock, Unlock, FlipHorizontal, FlipVertical } from 'lucide-react';
import type { Layer, ImageLayer, TextLayer } from '../types/editor';

interface ToolPanelProps {
  selectedLayer: Layer | null;
  onUpdateLayer: (id: string, patch: Partial<Layer>) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

export default function ToolPanel({
  selectedLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onMoveLayer,
}: ToolPanelProps) {
  if (!selectedLayer) {
    return (
      <div className="w-[280px] bg-white border-l border-gray-200 flex items-center justify-center p-8">
        <p className="text-gray-400 text-sm text-center">Select a layer to edit</p>
      </div>
    );
  }

  const isTextLayer = selectedLayer.type === 'text';
  const imageLayer = selectedLayer as ImageLayer;
  const textLayer = selectedLayer as TextLayer;

  return (
    <div className="w-[280px] bg-white border-l border-gray-200 overflow-y-auto">
      {isTextLayer ? (
        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Text Content</h3>
            <textarea
              value={textLayer.text}
              onChange={(e) => onUpdateLayer(selectedLayer.id, { text: e.target.value })}
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Font</h3>
            <div className="space-y-3">
              <select
                value={textLayer.fontFamily}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { fontFamily: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="system-ui">System UI</option>
                <option value="Roboto">Roboto</option>
                <option value="Oswald">Oswald</option>
                <option value="Merriweather">Merriweather</option>
                <option value="Bebas Neue">Bebas Neue</option>
                <option value="Noto Serif">Noto Serif</option>
                <option value="Mukta">Mukta</option>
              </select>
              
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={textLayer.fontSize}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) || 24 })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  min={8}
                  max={200}
                />
                <input
                  type="range"
                  value={textLayer.fontSize}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })}
                  className="flex-1"
                  min={8}
                  max={200}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateLayer(selectedLayer.id, { fontWeight: textLayer.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className={`px-3 py-1.5 text-sm border rounded ${textLayer.fontWeight === 'bold' ? 'bg-gray-800 text-white' : 'border-gray-300'}`}
                >
                  B
                </button>
                <button
                  onClick={() => onUpdateLayer(selectedLayer.id, { fontStyle: textLayer.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  className={`px-3 py-1.5 text-sm border rounded italic ${textLayer.fontStyle === 'italic' ? 'bg-gray-800 text-white' : 'border-gray-300'}`}
                >
                  I
                </button>
                <div className="flex items-center border border-gray-300 rounded">
                  <button
                    onClick={() => onUpdateLayer(selectedLayer.id, { textAlign: 'left' })}
                    className={`px-2 py-1 text-sm ${textLayer.textAlign === 'left' ? 'bg-gray-100' : ''}`}
                  >
                    ←
                  </button>
                  <button
                    onClick={() => onUpdateLayer(selectedLayer.id, { textAlign: 'center' })}
                    className={`px-2 py-1 text-sm ${textLayer.textAlign === 'center' ? 'bg-gray-100' : ''}`}
                  >
                    ↔
                  </button>
                  <button
                    onClick={() => onUpdateLayer(selectedLayer.id, { textAlign: 'right' })}
                    className={`px-2 py-1 text-sm ${textLayer.textAlign === 'right' ? 'bg-gray-100' : ''}`}
                  >
                    →
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500">Letter Spacing</label>
                <input
                  type="range"
                  value={textLayer.letterSpacing}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { letterSpacing: parseFloat(e.target.value) })}
                  className="w-full"
                  min={-5}
                  max={20}
                  step={0.5}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Line Height</label>
                <input
                  type="range"
                  value={textLayer.lineHeight}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { lineHeight: parseFloat(e.target.value) })}
                  className="w-full"
                  min={0.8}
                  max={3}
                  step={0.1}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Color & Effects</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textLayer.color}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={textLayer.color}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { color: e.target.value })}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textLayer.strokeColor}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { strokeColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={textLayer.strokeColor}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { strokeColor: e.target.value })}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  value={textLayer.strokeWidth}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { strokeWidth: parseInt(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  min={0}
                  max={20}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Opacity</label>
                <input
                  type="range"
                  value={textLayer.opacity * 100}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { opacity: parseInt(e.target.value) / 100 })}
                  className="w-full"
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </div>

          <TransformControls layer={selectedLayer} onUpdateLayer={onUpdateLayer} />
          <LayerActions
            layer={selectedLayer}
            onUpdateLayer={onUpdateLayer}
            onDelete={onDeleteLayer}
            onDuplicate={onDuplicateLayer}
            onMove={onMoveLayer}
          />
        </div>
      ) : (
        <div className="p-4 space-y-6">
          <TransformControls layer={selectedLayer} onUpdateLayer={onUpdateLayer} />

          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Adjustments</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Brightness</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    value={imageLayer.brightness}
                    onChange={(e) => onUpdateLayer(selectedLayer.id, { brightness: parseInt(e.target.value) })}
                    className="flex-1"
                    min={-100}
                    max={100}
                  />
                  <span className="text-xs w-8">{imageLayer.brightness}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Contrast</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    value={imageLayer.contrast}
                    onChange={(e) => onUpdateLayer(selectedLayer.id, { contrast: parseInt(e.target.value) })}
                    className="flex-1"
                    min={-100}
                    max={100}
                  />
                  <span className="text-xs w-8">{imageLayer.contrast}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Saturation</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    value={imageLayer.saturation}
                    onChange={(e) => onUpdateLayer(selectedLayer.id, { saturation: parseInt(e.target.value) })}
                    className="flex-1"
                    min={-100}
                    max={100}
                  />
                  <span className="text-xs w-8">{imageLayer.saturation}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Opacity</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    value={imageLayer.opacity * 100}
                    onChange={(e) => onUpdateLayer(selectedLayer.id, { opacity: parseInt(e.target.value) / 100 })}
                    className="flex-1"
                    min={0}
                    max={100}
                  />
                  <span className="text-xs w-8">{Math.round(imageLayer.opacity * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Flip</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateLayer(selectedLayer.id, { flipH: !imageLayer.flipH })}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm border rounded ${imageLayer.flipH ? 'bg-orange-100 border-orange-500' : 'border-gray-300'}`}
              >
                <FlipHorizontal className="w-4 h-4" />
                Flip H
              </button>
              <button
                onClick={() => onUpdateLayer(selectedLayer.id, { flipV: !imageLayer.flipV })}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm border rounded ${imageLayer.flipV ? 'bg-orange-100 border-orange-500' : 'border-gray-300'}`}
              >
                <FlipVertical className="w-4 h-4" />
                Flip V
              </button>
            </div>
          </div>

          <LayerActions
            layer={selectedLayer}
            onUpdateLayer={onUpdateLayer}
            onDelete={onDeleteLayer}
            onDuplicate={onDuplicateLayer}
            onMove={onMoveLayer}
          />
        </div>
      )}
    </div>
  );
}

function TransformControls({ layer, onUpdateLayer }: { layer: Layer; onUpdateLayer: (id: string, patch: Partial<Layer>) => void }) {
  const isText = layer.type === 'text';
  
  return (
    <div>
      <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Transform</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500">X</label>
          <input
            type="number"
            value={Math.round(layer.x)}
            onChange={(e) => onUpdateLayer(layer.id, { x: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Y</label>
          <input
            type="number"
            value={Math.round(layer.y)}
            onChange={(e) => onUpdateLayer(layer.id, { y: parseInt(e.target.value) || 0 })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        {!isText && (
          <>
            <div>
              <label className="text-xs text-gray-500">Width</label>
              <input
                type="number"
                value={Math.round((layer as ImageLayer).width)}
                onChange={(e) => onUpdateLayer(layer.id, { width: parseInt(e.target.value) || 20 })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                min={20}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Height</label>
              <input
                type="number"
                value={Math.round((layer as ImageLayer).height)}
                onChange={(e) => onUpdateLayer(layer.id, { height: parseInt(e.target.value) || 20 })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                min={20}
              />
            </div>
          </>
        )}
        <div className="col-span-2">
          <label className="text-xs text-gray-500">Rotation</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              value={layer.rotation}
              onChange={(e) => onUpdateLayer(layer.id, { rotation: parseInt(e.target.value) })}
              className="flex-1"
              min={-180}
              max={180}
            />
            <span className="text-xs w-12">{layer.rotation}°</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LayerActions({
  layer,
  onUpdateLayer,
  onDelete,
  onDuplicate,
  onMove,
}: {
  layer: Layer;
  onUpdateLayer: (id: string, patch: Partial<Layer>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Layer Actions</h3>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onMove(layer.id, 'up')}
          className="p-1.5 border border-gray-300 rounded hover:bg-gray-100"
          title="Move up"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => onMove(layer.id, 'down')}
          className="p-1.5 border border-gray-300 rounded hover:bg-gray-100"
          title="Move down"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDuplicate(layer.id)}
          className="p-1.5 border border-gray-300 rounded hover:bg-gray-100"
          title="Duplicate"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}
          className={`p-1.5 border rounded ${layer.locked ? 'bg-orange-100 border-orange-500' : 'border-gray-300 hover:bg-gray-100'}`}
          title={layer.locked ? 'Unlock' : 'Lock'}
        >
          {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
        <button
          onClick={() => onDelete(layer.id)}
          className="p-1.5 border border-red-300 text-red-600 rounded hover:bg-red-50 ml-auto"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}