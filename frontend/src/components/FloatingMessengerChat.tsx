import React from 'react';
import { AIChat } from './AIChat';
import type { FestivalItem } from '../types';
import { Bot } from 'lucide-react';

interface FloatingMessengerChatProps {
  selectedFestival: FestivalItem | null;
  onClearSelection: () => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  setRouteCoordinates?: (coords: [number, number][] | null) => void;
}

export const FloatingMessengerChat: React.FC<FloatingMessengerChatProps> = ({
  selectedFestival,
  onClearSelection,
  isOpen,
  onOpen,
  onClose,
  setRouteCoordinates,
}) => {
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 xl:right-[404px] z-50 flex flex-col items-end gap-2 animate-in fade-in zoom-in duration-200">
        {selectedFestival && (
          <div
            onClick={onOpen}
            className="flex items-center gap-2 rounded-2xl border border-emerald-500/60 bg-[#0f1210]/95 px-3.5 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md cursor-pointer hover:bg-emerald-500 hover:text-black transition-all group max-w-[260px]"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="truncate">💬 Ask about: {selectedFestival.name}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onOpen}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-black shadow-2xl hover:bg-emerald-400 hover:scale-110 transition-all focus:outline-none border-2 border-white/20"
          title="Open AI Concierge Chat"
        >
          <Bot className="h-7 w-7 transition-transform duration-300 group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 border-2 border-[#111412] text-[9px] font-black text-black">
            1
          </span>
          <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 animate-ping pointer-events-none" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 xl:right-[404px] z-50 w-[390px] sm:w-[420px] max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-5rem)] flex flex-col shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200 border border-white/20">
      <AIChat
        selectedFestival={selectedFestival}
        onClearSelection={onClearSelection}
        onMinimize={onClose}
        onClose={() => {
          onClose();
        }}
        setRouteCoordinates={setRouteCoordinates}
      />
    </div>
  );
};

export default FloatingMessengerChat;
