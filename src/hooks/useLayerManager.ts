import { useReducer, useCallback } from 'react';
import type { Layer, ImageLayer, TextLayer, Crop, CropType } from '../types/editor';

interface EditorState {
  canvasWidth: number;
  canvasHeight: number;
  layers: Layer[];
  selectedLayerId: string | null;
  crop: Crop | null;
  cropType: CropType;
  isDirty: boolean;
  history: EditorState[];
  historyIndex: number;
}

type LayerAction =
  | { type: 'ADD_TEMPLATE'; src: string }
  | { type: 'ADD_PHOTO'; src: string }
  | { type: 'ADD_TEXT' }
  | { type: 'UPDATE_LAYER'; id: string; patch: Partial<Layer> }
  | { type: 'DELETE_LAYER'; id: string }
  | { type: 'DUPLICATE_LAYER'; id: string }
  | { type: 'MOVE_LAYER'; id: string; direction: 'up' | 'down' }
  | { type: 'SELECT_LAYER'; id: string | null }
  | { type: 'SET_CANVAS_SIZE'; width: number; height: number }
  | { type: 'SET_CROP'; crop: Crop | null; cropType: CropType }
  | { type: 'UPDATE_CROP'; patch: Partial<Crop> }
  | { type: 'SET_CROP_TYPE'; cropType: CropType }
  | { type: 'UNDO' }
  | { type: 'REDO' };

const generateId = () => Math.random().toString(36).substring(2, 11);

const initialState: EditorState = {
  canvasWidth: 800,
  canvasHeight: 600,
  layers: [],
  selectedLayerId: null,
  crop: null,
  cropType: 'circle',
  isDirty: false,
  history: [],
  historyIndex: -1,
};

function pushHistory(state: EditorState): EditorState {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push({
    canvasWidth: state.canvasWidth,
    canvasHeight: state.canvasHeight,
    layers: [...state.layers],
    selectedLayerId: state.selectedLayerId,
    crop: state.crop,
    cropType: state.cropType,
    isDirty: state.isDirty,
    history: [],
    historyIndex: -1,
  });
  if (newHistory.length > 30) newHistory.shift();
  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

function editorReducer(state: EditorState, action: LayerAction): EditorState {
  switch (action.type) {
    case 'ADD_TEMPLATE': {
      const existingTemplateIndex = state.layers.findIndex(l => l.type === 'template');
      const newLayer: ImageLayer = {
        id: generateId(),
        type: 'template',
        src: action.src,
        x: 0,
        y: 0,
        width: state.canvasWidth,
        height: state.canvasHeight,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        flipH: false,
        flipV: false,
        visible: true,
        locked: true,
      };
      if (existingTemplateIndex >= 0) {
        const newLayers = [...state.layers];
        newLayers[existingTemplateIndex] = newLayer;
        return { ...pushHistory(state), layers: newLayers, isDirty: true };
      }
      return { ...pushHistory(state), layers: [newLayer, ...state.layers], isDirty: true };
    }

    case 'ADD_PHOTO': {
      const newLayer: ImageLayer = {
        id: generateId(),
        type: 'photo',
        src: action.src,
        x: state.canvasWidth / 2 - 100,
        y: state.canvasHeight / 2 - 100,
        width: 200,
        height: 200,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        flipH: false,
        flipV: false,
        visible: true,
        locked: false,
      };
      return { ...pushHistory(state), layers: [...state.layers, newLayer], selectedLayerId: newLayer.id, isDirty: true };
    }

    case 'ADD_TEXT': {
      const newLayer: TextLayer = {
        id: generateId(),
        type: 'text',
        text: 'Click to edit',
        x: state.canvasWidth / 2 - 75,
        y: state.canvasHeight / 2,
        fontSize: 24,
        fontFamily: 'system-ui',
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        strokeColor: '#ffffff',
        strokeWidth: 0,
        opacity: 1,
        rotation: 0,
        textAlign: 'center',
        lineHeight: 1.2,
        letterSpacing: 0,
        visible: true,
        locked: false,
      };
      return { ...pushHistory(state), layers: [...state.layers, newLayer], selectedLayerId: newLayer.id, isDirty: true };
    }

    case 'UPDATE_LAYER': {
      const newLayers = state.layers.map(l =>
        l.id === action.id ? { ...l, ...action.patch } as Layer : l
      );
      return { ...pushHistory(state), layers: newLayers, isDirty: true };
    }

    case 'DELETE_LAYER': {
      const newLayers = state.layers.filter(l => l.id !== action.id);
      return {
        ...pushHistory(state),
        layers: newLayers,
        selectedLayerId: state.selectedLayerId === action.id ? null : state.selectedLayerId,
        isDirty: true,
      };
    }

    case 'DUPLICATE_LAYER': {
      const layer = state.layers.find(l => l.id === action.id);
      if (!layer) return state;
      const newLayer = { ...layer, id: generateId(), x: layer.x + 20, y: layer.y + 20 };
      return { ...pushHistory(state), layers: [...state.layers, newLayer], selectedLayerId: newLayer.id, isDirty: true };
    }

    case 'MOVE_LAYER': {
      const index = state.layers.findIndex(l => l.id === action.id);
      if (index < 0) return state;
      const newLayers = [...state.layers];
      const [layer] = newLayers.splice(index, 1);
      const newIndex = action.direction === 'up' ? Math.min(index + 1, newLayers.length) : Math.max(index - 1, 0);
      newLayers.splice(newIndex, 0, layer);
      return { ...pushHistory(state), layers: newLayers, isDirty: true };
    }

    case 'SELECT_LAYER': {
      return { ...state, selectedLayerId: action.id };
    }

    case 'SET_CANVAS_SIZE': {
      const scaleX = action.width / state.canvasWidth;
      const scaleY = action.height / state.canvasHeight;
      const newLayers = state.layers.map(l => {
        if (l.type === 'text') return { ...l, x: l.x * scaleX, y: l.y * scaleY, fontSize: l.fontSize * scaleX };
        const imgL = l as ImageLayer;
        return { ...imgL, x: imgL.x * scaleX, y: imgL.y * scaleY, width: imgL.width * scaleX, height: imgL.height * scaleY };
      });
      return { ...pushHistory(state), canvasWidth: action.width, canvasHeight: action.height, layers: newLayers, isDirty: true };
    }

    case 'SET_CROP': {
      return { ...pushHistory(state), crop: action.crop, cropType: action.cropType, isDirty: true };
    }

    case 'UPDATE_CROP': {
      if (!state.crop) return state;
      return { ...state, crop: { ...state.crop, ...action.patch } as Crop };
    }

    case 'SET_CROP_TYPE': {
      return { ...state, cropType: action.cropType, crop: null };
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const prevState = state.history[state.historyIndex - 1];
      return { ...prevState, history: state.history, historyIndex: state.historyIndex - 1 };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextState = state.history[state.historyIndex + 1];
      return { ...nextState, history: state.history, historyIndex: state.historyIndex + 1 };
    }

    default:
      return state;
  }
}

export function useLayerManager() {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  const addTemplate = useCallback((src: string) => dispatch({ type: 'ADD_TEMPLATE', src }), []);
  const addPhoto = useCallback((src: string) => dispatch({ type: 'ADD_PHOTO', src }), []);
  const addText = useCallback(() => dispatch({ type: 'ADD_TEXT' }), []);
  const updateLayer = useCallback((id: string, patch: Partial<Layer>) => dispatch({ type: 'UPDATE_LAYER', id, patch }), []);
  const deleteLayer = useCallback((id: string) => dispatch({ type: 'DELETE_LAYER', id }), []);
  const duplicateLayer = useCallback((id: string) => dispatch({ type: 'DUPLICATE_LAYER', id }), []);
  const moveLayer = useCallback((id: string, direction: 'up' | 'down') => dispatch({ type: 'MOVE_LAYER', id, direction }), []);
  const selectLayer = useCallback((id: string | null) => dispatch({ type: 'SELECT_LAYER', id }), []);
  const setCanvasSize = useCallback((width: number, height: number) => dispatch({ type: 'SET_CANVAS_SIZE', width, height }), []);
  const setCrop = useCallback((crop: Crop | null, cropType: CropType) => dispatch({ type: 'SET_CROP', crop, cropType }), []);
  const updateCrop = useCallback((patch: Partial<Crop>) => dispatch({ type: 'UPDATE_CROP', patch }), []);
  const setCropType = useCallback((cropType: CropType) => dispatch({ type: 'SET_CROP_TYPE', cropType }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  return {
    state,
    addTemplate,
    addPhoto,
    addText,
    updateLayer,
    deleteLayer,
    duplicateLayer,
    moveLayer,
    selectLayer,
    setCanvasSize,
    setCrop,
    updateCrop,
    setCropType,
    undo,
    redo,
  };
}