
import React, { useState, useMemo, useRef } from 'react';
import { Character, Relationship, RelationshipTypeConfig } from '../types';

interface RelationshipLineProps {
  relationship: Relationship;
  fromChar: Character;
  toChar: Character;
  typeConfig?: RelationshipTypeConfig;
  onEdit: (rel: Relationship) => void;
  onHoverChange: (id: string | null) => void;
  relIndex: number;
  relTotal: number;
  isDimmed?: boolean;
  isReadOnly?: boolean;
}

const RelationshipLine: React.FC<RelationshipLineProps> = ({ 
  relationship, 
  fromChar, 
  toChar,
  typeConfig,
  onEdit,
  onHoverChange,
  relIndex,
  relTotal,
  isDimmed = false,
  isReadOnly = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const touchTimer = useRef<number | null>(null);

  const W = 160;
  const H = 220;

  const points = useMemo(() => {
    const anchorsA = [
      { x: fromChar.position.x + W / 2, y: fromChar.position.y, side: 'T' },
      { x: fromChar.position.x + W / 2, y: fromChar.position.y + H, side: 'B' },
      { x: fromChar.position.x, y: fromChar.position.y + H / 2, side: 'L' },
      { x: fromChar.position.x + W, y: fromChar.position.y + H / 2, side: 'R' },
    ];
    const anchorsB = [
      { x: toChar.position.x + W / 2, y: toChar.position.y, side: 'T' },
      { x: toChar.position.x + W / 2, y: toChar.position.y + H, side: 'B' },
      { x: toChar.position.x, y: toChar.position.y + H / 2, side: 'L' },
      { x: toChar.position.x + W, y: toChar.position.y + H / 2, side: 'R' },
    ];

    let minData = { dist: Infinity, p1: anchorsA[0], p2: anchorsB[0] };
    anchorsA.forEach(a1 => {
      anchorsB.forEach(a2 => {
        const d = Math.sqrt((a1.x - a2.x) ** 2 + (a1.y - a2.y) ** 2);
        if (d < minData.dist) minData = { dist: d, p1: a1, p2: a2 };
      });
    });

    const { p1, p2 } = minData;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = -dy / dist;
    const uy = dx / dist;
    
    const offsetMag = (relIndex - (relTotal - 1) / 2) * 35;
    const startX = p1.x + ux * offsetMag;
    const startY = p1.y + uy * offsetMag;
    const endX = p2.x + ux * offsetMag;
    const endY = p2.y + uy * offsetMag;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const cur = 50; 
    const cpX = midX + ux * cur;
    const cpY = midY + uy * cur;

    return { x1: startX, y1: startY, x2: endX, y2: endY, cpX, cpY };
  }, [fromChar.position, toChar.position, relIndex, relTotal]);

  const color = typeConfig?.color || '#ffffff';

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDimmed) return;
    touchTimer.current = window.setTimeout(() => {
      setIsHovered(true);
      onHoverChange(relationship.id);
    }, 500); // 500ms long press to show info on mobile
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  };

  const labelStyles = useMemo(() => {
    const base = relationship.isDashed ? {
      backgroundColor: 'transparent',
      color: '#ffffff',
      border: '2px solid #ffffff',
      borderRadius: '9999px',
      padding: '4px 16px',
      backdropFilter: 'blur(4px)',
    } : {
      backgroundColor: '#000000',
      color: color,
      border: `2px solid ${color}`,
      borderRadius: '2px',
      padding: '4px 12px',
    };
    return { ...base, filter: isDimmed ? 'grayscale(1) opacity(0.3)' : 'none' };
  }, [relationship.isDashed, color, isDimmed]);

  return (
    <g 
      className={`group transition-all duration-500 ${isDimmed ? 'grayscale opacity-30 pointer-events-none' : ''}`}
      onMouseEnter={() => {
        if (!isDimmed) {
          setIsHovered(true);
          onHoverChange(relationship.id);
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHoverChange(null);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ pointerEvents: isDimmed ? 'none' : 'all' }}
    >
      <defs>
        <marker
          id={`arrow-end-${relationship.id}`}
          viewBox="0 0 10 10"
          refX="8" 
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>

      <path
        d={`M ${points.x1} ${points.y1} Q ${points.cpX} ${points.cpY} ${points.x2} ${points.y2}`}
        stroke="transparent"
        strokeWidth="30"
        fill="none"
        className={isReadOnly ? "" : "cursor-pointer"}
        onClick={() => {
          if (!isDimmed && !isReadOnly) {
            onEdit(relationship);
            onHoverChange(relationship.id);
          }
        }}
      />

      <path
        d={`M ${points.x1} ${points.y1} Q ${points.cpX} ${points.cpY} ${points.x2} ${points.y2}`}
        stroke={color}
        strokeWidth={isHovered ? "4" : "2"}
        fill="none"
        strokeDasharray={relationship.isDashed ? "8,4" : "0"}
        markerEnd={relationship.isBiDirectional ? undefined : `url(#arrow-end-${relationship.id})`}
        className="string-path transition-all duration-300"
        style={{ filter: isDimmed ? 'grayscale(1)' : `drop-shadow(0 0 4px ${color}88)` }}
      />

      <foreignObject 
        x={points.cpX - 150} 
        y={points.cpY - 150} 
        width="300" 
        height="300" 
        style={{ pointerEvents: 'none', overflow: 'visible' }}
      >
        <div className="flex flex-col items-center justify-center h-full w-full relative">
          <div 
            className={`absolute mb-6 bg-zinc-950/95 border-2 p-3 rounded shadow-[0_20px_60px_rgba(0,0,0,1)] w-64 text-center transition-all duration-300 transform ${isHovered && relationship.description && !isDimmed ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
            style={{ 
              bottom: '50%', 
              zIndex: 1000,
              pointerEvents: 'none',
              borderColor: `${color}cc`
            }}
          >
            <div className="bebas text-[10px] mb-1 tracking-[0.3em]" style={{ color }}>DOSSIER FRAGMENT</div>
            <p className="text-[12px] text-white font-bold leading-relaxed source-han px-1">{relationship.description}</p>
          </div>

          <button 
            onClick={(e) => { 
              if (isReadOnly) return;
              e.stopPropagation(); 
              if(!isDimmed) { 
                onEdit(relationship); 
                onHoverChange(relationship.id); 
              } 
            }}
            className={`pointer-events-auto text-[11px] font-black shadow-[0_0_15px_rgba(0,0,0,0.8)] transition-all source-han tracking-widest uppercase relative z-10 ${isDimmed ? 'opacity-30 grayscale cursor-default' : ''} ${isReadOnly ? 'cursor-default' : 'hover:scale-110'}`}
            style={labelStyles}
          >
            {!relationship.isDashed && (
              <>
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-black" style={{ backgroundColor: color }}></div>
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-black" style={{ backgroundColor: color }}></div>
              </>
            )}
            {relationship.label}
          </button>
        </div>
      </foreignObject>
    </g>
  );
};

export default RelationshipLine;
