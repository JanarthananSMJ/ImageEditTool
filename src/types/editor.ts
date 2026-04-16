export type CanvasSize = {
  width: number;
  height: number;
};

export type LayerType = 'template' | 'photo' | 'text';

export interface BaseLayer {
  id: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
}

export interface ImageLayer extends BaseLayer {
  type: 'template' | 'photo';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  brightness: number;
  contrast: number;
  saturation: number;
  flipH: boolean;
  flipV: boolean;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
}

export type Layer = ImageLayer | TextLayer;

export type CropType = 'circle' | 'square' | 'rectangle';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleCrop {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

export interface RectangleCrop {
  type: 'square' | 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: string;
}

export type Crop = CircleCrop | RectangleCrop;

export interface EditorState {
  canvasWidth: number;
  canvasHeight: number;
  layers: Layer[];
  selectedLayerId: string | null;
  crop: Crop | null;
  cropType: CropType;
  isDirty: boolean;
}