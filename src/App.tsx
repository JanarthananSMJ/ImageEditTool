import { useState, useEffect } from 'react';
import { useLayerManager } from './hooks/useLayerManager';
import Sidebar from './components/Sidebar';
import CanvasEditor from './components/CanvasEditor';
import TopBar from './components/TopBar';
import ExportModal from './components/ExportModal';
import Toast from './components/Toast';
import type { Layer } from './types/editor';

function App() {
  const { state, addTemplate, addPhoto, addText, updateLayer, deleteLayer, duplicateLayer, moveLayer, selectLayer, setCanvasSize, setCrop, updateCrop, setCropType, undo, redo } = useLayerManager();
  const [showExportModal, setShowExportModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedLayer = state.layers.find(l => l.id === state.selectedLayerId) || null;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedLayerId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          deleteLayer(state.selectedLayerId);
        }
      }

      if (cmdKey && e.key === 'd') {
        e.preventDefault();
        if (state.selectedLayerId) {
          duplicateLayer(state.selectedLayerId);
        }
      }

      if (cmdKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if (cmdKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }

      if (e.key === 'Escape') {
        selectLayer(null);
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (state.selectedLayerId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const patch: Partial<Layer> = {};
          if (e.key === 'ArrowUp') patch.y = selectedLayer!.y - step;
          if (e.key === 'ArrowDown') patch.y = selectedLayer!.y + step;
          if (e.key === 'ArrowLeft') patch.x = selectedLayer!.x - step;
          if (e.key === 'ArrowRight') patch.x = selectedLayer!.x + step;
          updateLayer(state.selectedLayerId, patch);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedLayerId, selectedLayer, deleteLayer, duplicateLayer, undo, redo, selectLayer, updateLayer]);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-100">
      <TopBar
        onExport={() => setShowExportModal(true)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
<div className="flex-1 relative overflow-hidden">
        {isMobile ? (
          sidebarOpen && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 rounded-xl shadow-xl w-[calc(100%-0.5rem)] max-w-[calc(100vw-0.5rem)]">
              <Sidebar
                onAddTemplate={addTemplate}
                onAddPhoto={addPhoto}
                onAddText={addText}
                layers={state.layers}
                canvasWidth={state.canvasWidth}
                canvasHeight={state.canvasHeight}
                onCanvasResize={setCanvasSize}
                crop={state.crop}
                cropType={state.cropType}
                onSetCrop={setCrop}
                onSetCropType={setCropType}
                selectedLayerId={state.selectedLayerId}
                onUpdateLayer={updateLayer}
                onDeleteLayer={deleteLayer}
                onDuplicateLayer={duplicateLayer}
                onMoveLayer={moveLayer}
                onError={(msg) => showToast(msg, 'error')}
                isMobile={true}
              />
            </div>
          )
        ) : (
          sidebarOpen && (
            <div className="absolute left-1 top-1/2 -translate-y-1/2 z-30 rounded-xl shadow-xl">
              <Sidebar
                onAddTemplate={addTemplate}
                onAddPhoto={addPhoto}
                onAddText={addText}
                layers={state.layers}
                canvasWidth={state.canvasWidth}
                canvasHeight={state.canvasHeight}
                onCanvasResize={setCanvasSize}
                crop={state.crop}
                cropType={state.cropType}
                onSetCrop={setCrop}
                onSetCropType={setCropType}
                selectedLayerId={state.selectedLayerId}
                onUpdateLayer={updateLayer}
                onDeleteLayer={deleteLayer}
                onDuplicateLayer={duplicateLayer}
                onMoveLayer={moveLayer}
                onError={(msg) => showToast(msg, 'error')}
                isMobile={false}
              />
            </div>
          )
        )}
        <div className="flex items-center justify-center w-full h-full">
          <CanvasEditor
            layers={state.layers}
            canvasWidth={state.canvasWidth}
            canvasHeight={state.canvasHeight}
            selectedLayerId={state.selectedLayerId}
            onSelectLayer={selectLayer}
            onUpdateLayer={updateLayer}
            crop={state.crop}
            onUpdateCrop={updateCrop}
          />
        </div>
      </div>
      {showExportModal && (
        <ExportModal
          layers={state.layers}
          canvasWidth={state.canvasWidth}
          canvasHeight={state.canvasHeight}
          crop={state.crop}
          cropType={state.cropType}
          onClose={() => setShowExportModal(false)}
        />
      )}
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}

export default App;