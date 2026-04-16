import { Download, Layers, PanelLeft, PanelLeftClose } from 'lucide-react';

interface TopBarProps {
  onExport: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function TopBar({ onExport, onToggleSidebar, sidebarOpen }: TopBarProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-2 sm:px-4 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {sidebarOpen ? <PanelLeftClose className="w-5 h-5 text-gray-600" /> : <PanelLeft className="w-5 h-5 text-gray-600" />}
        </button>
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-gray-800">PosterMaker</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  );
}