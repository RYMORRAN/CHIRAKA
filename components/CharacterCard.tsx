
import React, { useState, useRef, useEffect } from 'react';
import { Character } from '../types';
import { Camera, Plus, X } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  onPositionChange: (id: string, x: number, y: number) => void;
  onDragEnd: () => void;
  onInfoClick: (character: Character) => void;
  onEditDoubleClick: (character: Character) => void;
  onUpdateImage: (id: string, url: string) => void;
  onStartLink: (id: string, startPos: { x: number, y: number }) => void;
  onDelete: (id: string) => void;
  onStartDeletionMode: () => void;
  onHoverChange?: (isHovered: boolean) => void;
  isDeletionMode?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
  isGlobalBW?: boolean;
  cardStyle?: string;
  isReadOnly?: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  onPositionChange, 
  onDragEnd,
  onInfoClick,
  onEditDoubleClick,
  onUpdateImage,
  onStartLink,
  onDelete,
  onStartDeletionMode,
  onHoverChange,
  isDeletionMode,
  isHovered,
  isSelected,
  isGlobalBW,
  cardStyle = 'default',
  isReadOnly = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<number | null>(null);
  const startMousePos = useRef({ x: 0, y: 0 });
  const hasMovedSignificant = useRef(false);

  const styleClasses = {
    default: 'flat-card',
    intel: 'style-intel',
    stencil: 'style-stencil',
    noir: 'style-noir',
    warning: 'style-warning'
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isReadOnly) return;
    if ((e.target as HTMLElement).closest('.link-handle')) return;
    if ((e.target as HTMLElement).closest('.delete-btn')) return;

    startMousePos.current = { x: e.clientX, y: e.clientY };
    hasMovedSignificant.current = false;

    // Start long-press timer
    longPressTimer.current = window.setTimeout(() => {
      if (!hasMovedSignificant.current && !isDeletionMode) {
        onStartDeletionMode();
      }
    }, 700);

    setIsDragging(true);
    setOffset({
      x: e.clientX - character.position.x,
      y: e.clientY - character.position.y
    });
    
    onHoverChange?.(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const dx = Math.abs(e.clientX - startMousePos.current.x);
      const dy = Math.abs(e.clientY - startMousePos.current.y);
      if (dx > 5 || dy > 5) {
        hasMovedSignificant.current = true;
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      onPositionChange(character.id, e.clientX - offset.x, e.clientY - offset.y);
    }
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isDragging) {
      onDragEnd();
    }
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateImage(character.id, reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 核心逻辑：底层 z-20，悬浮或点击后升至 z-40 (越过 z-30 的连线层)
  const zIndex = (isDragging || isHovered || isSelected) ? 40 : 20;

  return (
    <div
      className={`absolute select-none w-40 char-node transition-all duration-300 ${styleClasses[cardStyle as keyof typeof styleClasses] || styleClasses.default} ${isSelected ? 'ring-4 ring-yellow-500/50' : ''} ${isDeletionMode ? 'jiggle' : ''} ${isReadOnly ? 'cursor-zoom-in' : 'cursor-crosshair active:scale-95'}`}
      data-id={character.id}
      style={{
        left: character.position.x,
        top: character.position.y,
        zIndex: zIndex,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => !isDragging && onHoverChange?.(false)}
    >
      {isDeletionMode && !isReadOnly && (
        <button 
          className="delete-btn absolute -top-3 -left-3 bg-red-600 text-white p-1 rounded-full border-2 border-black shadow-lg z-[110] hover:scale-110 active:scale-95 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(character.id);
          }}
        >
          <X size={16} strokeWidth={4} />
        </button>
      )}

      <div 
        className="image-area relative h-44 bg-zinc-950 border-b-2 border-zinc-800 overflow-hidden group"
        onDoubleClick={(e) => {
          if (isReadOnly) return;
          e.stopPropagation();
          const input = (e.currentTarget as HTMLElement).querySelector('input');
          input?.click();
        }}
      >
        <img 
          src={character.imageUrl} 
          alt={character.name}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
          style={{ 
            filter: isGlobalBW ? 'grayscale(1) brightness(0.85) contrast(1.1)' : 'none' 
          }}
        />
        {!isReadOnly && (
          <div className="absolute inset-0 bg-yellow-500/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity pointer-events-none">
            <Camera size={24} className="text-black" />
            <span className="mt-1 text-[8px] font-black uppercase text-black">UPDATE IMAGE</span>
          </div>
        )}
        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>

      <div 
        className="p-3 bg-zinc-900/50 backdrop-blur-sm transition-colors hover:bg-zinc-800"
        onClick={(e) => { e.stopPropagation(); onInfoClick(character); }}
        onDoubleClick={(e) => { 
          if (isReadOnly) return;
          e.stopPropagation(); 
          onEditDoubleClick(character); 
        }}
      >
        <div className="bebas text-lg text-yellow-500 leading-none tracking-wider mb-0.5 truncate uppercase">
          {character.nameEn || character.name}
        </div>
        <div className="chinese-hard-edge text-sm text-white leading-none break-all">
          {character.name}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mt-2 source-han border-t border-zinc-800/50 pt-2 leading-tight">
          {character.role}
        </div>
      </div>

      {!isReadOnly && (
        <button 
          className="link-handle absolute -right-2 top-1/2 -translate-y-1/2 bg-yellow-500 text-black p-0.5 rounded-full border-2 border-black shadow-lg hover:scale-125 transition-transform"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartLink(character.id, { 
              x: character.position.x + 160,
              y: character.position.y + 110 
            });
          }}
        >
          <Plus size={14} strokeWidth={4} />
        </button>
      )}
    </div>
  );
};

export default CharacterCard;
