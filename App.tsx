
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { toJpeg } from 'html-to-image';
import Sortable from 'sortablejs';
import LZString from 'lz-string';
import { Character, Relationship, RelationshipTypeConfig, BoardData, LayoutConfig } from './types';
import { INITIAL_CHARACTERS, INITIAL_RELATIONSHIPS, RELATIONSHIP_TYPES, DEFAULT_LAYOUT } from './constants';
import CharacterCard from './components/CharacterCard';
import RelationshipLine from './components/RelationshipLine';
import EditModal from './components/EditModal';
import { Sparkles, Plus, Download, Upload, Image as ImageIcon, X, Save, ChevronLeft, ChevronRight, Palette, FolderHeart, Loader2, FileJson, FolderDown, FileUp, Undo2, Redo2, Layout, GripVertical, HelpCircle, MousePointer2, Move, Link, ZoomIn, Terminal, Check, Box, Type, Filter, Users, Skull, Lock, Eye, ShieldCheck, Database, PencilLine, ShieldAlert, Share2 } from 'lucide-react';

// 自定义玫瑰图标 (女王蜂)
const RoseIcon = ({ size = 22, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 7c2.5 0 4.5 2 4.5 4.5S14.5 16 12 16s-4.5-2-4.5-4.5S9.5 7 12 7z" />
    <path d="M12 7c-1-3-4-4-6-2.5S4 9 6 11" />
    <path d="M12 7c1-3 4-4 6-2.5S20 9 18 11" />
    <path d="M12 16c-1 3-4 4-6 2.5S4 14 6 12" />
    <path d="M12 16c1 3 4 4 6 2.5S20 14 18 12" />
    <path d="M12 16v5" />
  </svg>
);

// 自定义分子三角形图标 (ANGEL ZOO)
const MoleculeTriangleIcon = ({ size = 22, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 4L4 18h16L12 4z" />
    <circle cx="12" cy="4" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="20" cy="18" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);

// 自定义荆棘图标 (伊甸之东)
const ThornsIcon = ({ size = 22, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12c4 0 4-4 8-4s4 4 8 4 4-4 8-4" />
    <path d="M2 16c4 0 4 4 8 4s4-4 8-4 4 4 8 4" />
    <path d="M7 10l-2-3" />
    <path d="M11 7l1-3" />
    <path d="M16 9l2-2" />
    <path d="M6 17l-1 3" />
    <path d="M13 19l1 3" />
    <path d="M19 17l2 1" />
  </svg>
);

const GROUPS = [
  { id: 'villains', name: '罪人', label: '韩亦尧×莫昕', icon: Skull, color: '#ff4d4d' },
  { id: 'queen_bee', name: '女王蜂', label: '周昱扬×纪子贤', icon: RoseIcon, color: '#ec4899' },
  { id: 'angel_zoo', name: 'ANGEL ZOO', label: '方泽墨×穆宇岚+晋苑', icon: MoleculeTriangleIcon, color: '#fbbf24' },
  { id: 'eden', name: '伊甸之东', label: '孔承宇×权宥安×孔延宇', icon: ThornsIcon, color: '#4da3ff' },
];

type ViewMode = 'architect' | 'observer' | 'none';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('none');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [showObserverWelcome, setShowObserverWelcome] = useState(false);
  
  // 组别编辑状态
  const [isGroupAssignmentMode, setIsGroupAssignmentMode] = useState(false);

  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [relationships, setRelationships] = useState<Relationship[]>(INITIAL_RELATIONSHIPS);
  const [relTypes, setRelTypes] = useState<RelationshipTypeConfig[]>(RELATIONSHIP_TYPES);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({ ...DEFAULT_LAYOUT, cardScale: 1.0 });
  const [titleWhite, setTitleWhite] = useState('CHIRAKA');
  const [titleYellow, setTitleYellow] = useState('NEXUS');
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isGlobalBW, setIsGlobalBW] = useState(false);
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDeletionMode, setIsDeletionMode] = useState(false);
  const [activeGalleryMode, setActiveGalleryMode] = useState<'global' | 'personal'>('global');
  const [backgroundStyle, setBackgroundStyle] = useState('default');
  const [cardStyle, setCardStyle] = useState('default');
  const [titleStyle, setTitleStyle] = useState('comic');
  const [isBgPickerOpen, setIsBgPickerOpen] = useState(false);
  const [isStylePickerOpen, setIsStylePickerOpen] = useState(false);
  
  const [history, setHistory] = useState<BoardData[]>([]);
  const [redoStack, setRedoStack] = useState<BoardData[]>([]);
  
  const [panelView, setPanelView] = useState<'intel' | 'info' | 'edit' | 'settings'>('intel');
  const [activeData, setActiveData] = useState<any>(null);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [viewedImage, setViewedImage] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const [viewPos, setViewPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const [linkingFrom, setLinkingFrom] = useState<{ id: string, startPos: { x: number, y: number } } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [focusedCharId, setFocusedCharId] = useState<string | null>(null);
  
  const [hoveredRelId, setHoveredRelId] = useState<string | null>(null);
  const [hoveredCharId, setHoveredCharId] = useState<string | null>(null);

  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const isReadOnly = viewMode === 'observer';

  const applyState = useCallback((state: BoardData) => {
    setCharacters(state.characters || INITIAL_CHARACTERS);
    setRelationships(state.relationships || INITIAL_RELATIONSHIPS);
    setRelTypes(state.relTypes || RELATIONSHIP_TYPES);
    setLayoutConfig(state.layoutConfig || DEFAULT_LAYOUT);
    setTitleWhite(state.titleWhite || 'CHIRAKA');
    setTitleYellow(state.titleYellow || 'NEXUS');
    setSidebarWidth(state.sidebarWidth || 320);
    setIsGlobalBW(state.isGlobalBlackAndWhite || false);
    setBackgroundStyle(state.backgroundStyle || 'default');
    setCardStyle(state.cardStyle || 'default');
    setTitleStyle(state.titleStyle || 'comic');
  }, []);

  // On mount: check URL for shared state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedState = params.get('s');
    if (sharedState) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(sharedState);
        if (decompressed) {
          const data = JSON.parse(decompressed);
          applyState(data);
          // Auto-enter as observer if shared via link
          setViewMode('observer');
        }
      } catch (err) {
        console.error("Failed to load shared state:", err);
      }
    }
  }, [applyState]);

  // 定位聚焦放大功能
  const handleFocusGroup = useCallback((groupId: string) => {
    const groupChars = characters.filter(c => c.groupId === groupId);
    if (groupChars.length === 0) return;

    const padding = 150;
    const cardW = 160;
    const cardH = 220;

    const minX = Math.min(...groupChars.map(c => c.position.x));
    const minY = Math.min(...groupChars.map(c => c.position.y));
    const maxX = Math.max(...groupChars.map(c => c.position.x + cardW));
    const maxY = Math.max(...groupChars.map(c => c.position.y + cardH));

    const boxW = maxX - minX;
    const boxH = maxY - minY;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // 计算最佳缩放比例使得刚好能看全
    const zoomX = (viewportW - padding * 2) / boxW;
    const zoomY = (viewportH - padding * 2) / boxH;
    let targetZoom = Math.min(zoomX, zoomY);
    targetZoom = Math.max(0.3, Math.min(targetZoom, 1.2));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(targetZoom);
    setViewPos({
      x: viewportW / 2 - centerX * targetZoom,
      y: viewportH / 2 - centerY * targetZoom
    });
  }, [characters]);

  const handleAuth = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (passwordInput === 'RYMM') {
      setViewMode('architect');
      setAuthError(false);
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 1000);
    }
  };

  const handleObserverEntry = () => {
    setShowObserverWelcome(true);
    setTimeout(() => {
      setViewMode('observer');
      setShowObserverWelcome(false);
    }, 2000);
  };

  const handleStartupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          applyState(data);
          handleObserverEntry();
        } catch (err) {
          alert("Invalid JSON data format.");
        }
      };
      reader.readAsText(file);
    }
  };

  const getCurrentBoardData = useCallback((): BoardData => ({
    characters: JSON.parse(JSON.stringify(characters)),
    relationships: JSON.parse(JSON.stringify(relationships)),
    relTypes: JSON.parse(JSON.stringify(relTypes)),
    layoutConfig: JSON.parse(JSON.stringify(layoutConfig)),
    titleWhite,
    titleYellow,
    sidebarWidth,
    isGlobalBlackAndWhite: isGlobalBW,
    backgroundStyle,
    cardStyle,
    titleStyle
  }), [characters, relationships, relTypes, layoutConfig, titleWhite, titleYellow, sidebarWidth, isGlobalBW, backgroundStyle, cardStyle, titleStyle]);

  const generateShareLink = () => {
    const data = getCurrentBoardData();
    const jsonStr = JSON.stringify(data);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    const url = `${window.location.origin}${window.location.pathname}?s=${compressed}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopyStatus("LINK COPIED!");
      setTimeout(() => setCopyStatus(null), 2000);
    }).catch(err => {
      console.error("Failed to copy:", err);
      alert("Failed to copy link. Check console.");
    });
  };

  const recordHistory = useCallback(() => {
    if (isReadOnly) return;
    setHistory(prev => [...prev.slice(-49), getCurrentBoardData()]);
    setRedoStack([]);
  }, [getCurrentBoardData, isReadOnly]);

  const handleUndo = useCallback(() => {
    if (history.length === 0 || isReadOnly) return;
    const currentState = getCurrentBoardData();
    const lastState = history[history.length - 1];
    setRedoStack(prev => [...prev, currentState]);
    setHistory(prev => prev.slice(0, -1));
    applyState(lastState);
  }, [history, getCurrentBoardData, isReadOnly, applyState]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || isReadOnly) return;
    const currentState = getCurrentBoardData();
    const nextState = redoStack[redoStack.length - 1];
    setHistory(prev => [...prev, currentState]);
    setRedoStack(prev => prev.slice(0, -1));
    applyState(nextState);
  }, [redoStack, getCurrentBoardData, isReadOnly, applyState]);

  const handleAutoLayout = useCallback(() => {
    if (isReadOnly) return;
    recordHistory();
    const padding = 100;
    const cardW = 160;
    const cardH = 220;
    let currentChars = [...characters];
    for (let iter = 0; iter < 50; iter++) {
      for (let i = 0; i < currentChars.length; i++) {
        for (let j = i + 1; j < currentChars.length; j++) {
          const c1 = currentChars[i];
          const c2 = currentChars[j];
          const dx = (c1.position.x + cardW/2) - (c2.position.x + cardW/2);
          const dy = (c1.position.y + cardH/2) - (c2.position.y + cardH/2);
          const minX = cardW + padding;
          const minY = cardH + padding;
          if (Math.abs(dx) < minX && Math.abs(dy) < minY) {
            const moveX = (minX - Math.abs(dx)) * (dx >= 0 ? 0.6 : -0.6);
            const moveY = (minY - Math.abs(dy)) * (dy >= 0 ? 0.6 : -0.6);
            currentChars[i] = { ...currentChars[i], position: { x: currentChars[i].position.x + moveX, y: currentChars[i].position.y + moveY } };
            currentChars[j] = { ...currentChars[j], position: { x: currentChars[j].position.x - moveX, y: currentChars[j].position.y - moveY } };
          }
        }
      }
    }
    if (currentChars.length > 0) {
      const avgX = currentChars.reduce((sum, c) => sum + c.position.x, 0) / currentChars.length;
      const avgY = currentChars.reduce((sum, c) => sum + c.position.y, 0) / currentChars.length;
      const offsetX = 800 - avgX;
      const offsetY = 400 - avgY;
      currentChars = currentChars.map(c => ({ ...c, position: { x: c.position.x + offsetX, y: c.position.y + offsetY } }));
    }
    setCharacters(currentChars);
  }, [characters, recordHistory, isReadOnly]);

  const handleCharacterClick = (char: Character) => {
    // 组别编辑模式下的特殊逻辑
    if (isGroupAssignmentMode && !isReadOnly && activeGroupId) {
      recordHistory();
      setCharacters(prev => prev.map(c => {
        if (c.id === char.id) {
          // 如果已经是该组，则移除；否则归入该组
          return { ...c, groupId: c.groupId === activeGroupId ? undefined : activeGroupId };
        }
        return c;
      }));
      return;
    }

    if (isDeletionMode) return;
    if (focusedCharId === char.id) {
      setFocusedCharId(null);
    } else {
      setFocusedCharId(char.id);
      setActiveGroupId(null);
    }
  };

  const { highlightedCharIds, highlightedRelIds } = useMemo(() => {
    const charIds = new Set<string>();
    const relIds = new Set<string>();
    if (activeGroupId) {
      characters.forEach(c => {
        if (c.groupId === activeGroupId) charIds.add(c.id);
      });
      relationships.forEach(r => {
        if (charIds.has(r.fromId) && charIds.has(r.toId)) relIds.add(r.id);
      });
    } else if (focusedCharId) {
      charIds.add(focusedCharId);
      relationships.forEach(r => {
        const isOutgoing = r.fromId === focusedCharId;
        const isBi = r.isBiDirectional && (r.fromId === focusedCharId || r.toId === focusedCharId);
        const isOS = r.isDashed && (r.fromId === focusedCharId || r.toId === focusedCharId);
        if (isOutgoing || isBi || isOS) {
          relIds.add(r.id);
          charIds.add(r.fromId);
          charIds.add(r.toId);
        }
      });
    }
    return { highlightedCharIds: charIds, highlightedRelIds: relIds };
  }, [activeGroupId, focusedCharId, characters, relationships]);

  const isAnyFilterActive = activeGroupId !== null || focusedCharId !== null;

  useEffect(() => {
    if (isAlbumOpen && activeGalleryMode === 'personal' && galleryRef.current && activeData && !isReadOnly) {
      const sortable = Sortable.create(galleryRef.current, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: (evt) => {
          const { oldIndex, newIndex } = evt;
          if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
            setCharacters(prev => prev.map(c => {
              if (c.id === activeData.id) {
                const newGallery = [...c.gallery];
                const [moved] = newGallery.splice(oldIndex, 1);
                newGallery.splice(newIndex, 0, moved);
                setActiveData({ ...c, gallery: newGallery });
                return { ...c, gallery: newGallery };
              }
              return c;
            }));
            recordHistory();
          }
        }
      });
      return () => sortable.destroy();
    }
  }, [isAlbumOpen, activeGalleryMode, activeData?.id, isReadOnly]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDeletionMode(false);
        setIsGroupAssignmentMode(false);
        setIsSidebarOpen(false);
        setIsAlbumOpen(false);
        setIsBgPickerOpen(false);
        setIsStylePickerOpen(false);
        setFocusedCharId(null);
        setActiveGroupId(null);
      }
      if (viewMode === 'architect') {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault(); handleRedo();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
          e.preventDefault(); handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, viewMode]);

  useEffect(() => {
    if (isPanning) {
      document.body.style.cursor = 'grabbing';
    } else {
      document.body.style.cursor = '';
    }
    const handleNativeMouseDown = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault(); 
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        setIsPanning(true);
      }
    };
    window.addEventListener('mousedown', handleNativeMouseDown, { passive: false });
    return () => { 
      document.body.style.cursor = ''; 
      window.removeEventListener('mousedown', handleNativeMouseDown);
    };
  }, [isPanning]);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (isResizingSidebar) {
      const maxW = window.innerWidth * 0.4;
      setSidebarWidth(Math.min(maxW, Math.max(250, e.clientX)));
      return;
    }
    const transformedMouseX = (e.clientX - viewPos.x) / zoom;
    const transformedMouseY = (e.clientY - viewPos.y) / zoom;
    setMousePos({ x: transformedMouseX, y: transformedMouseY });
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setViewPos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    }
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [isPanning, isResizingSidebar, viewPos, zoom]);

  const handleGlobalMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsResizingSidebar(false);
    if (linkingFrom && !isReadOnly) {
      const cardNodes = document.querySelectorAll('.char-node');
      let targetId: string | null = null;
      cardNodes.forEach(node => {
        const rect = node.getBoundingClientRect();
        if (
          mousePos.x * zoom + viewPos.x >= rect.left && 
          mousePos.x * zoom + viewPos.x <= rect.right &&
          mousePos.y * zoom + viewPos.y >= rect.top && 
          mousePos.y * zoom + viewPos.y <= rect.bottom
        ) {
          targetId = node.getAttribute('data-id');
        }
      });
      if (targetId && targetId !== linkingFrom.id) {
        recordHistory();
        setRelationships(prev => [...prev, {
          id: 'r' + Date.now(),
          fromId: linkingFrom.id,
          toId: targetId,
          label: '新关系',
          description: '',
          typeId: 'colleague',
          isBiDirectional: false,
          isDashed: false,
          curvature: 40
        }]);
      }
      setLinkingFrom(null);
    } else {
      setLinkingFrom(null);
    }
  }, [linkingFrom, mousePos, zoom, viewPos, recordHistory, isReadOnly]);

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  const addToPersonalGallery = (characterId: string, base64List: string[]) => {
    if (isReadOnly) return;
    recordHistory();
    setCharacters(prev => prev.map(c => {
      if (c.id === characterId) {
        return { ...c, gallery: [...c.gallery, ...base64List] };
      }
      return c;
    }));
  };

  const exportBoard = () => {
    const data = getCurrentBoardData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CHIRAKA_Nexus_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const takeScreenshot = async () => {
    if (!boardRef.current) return;
    try {
      const dataUrl = await toJpeg(boardRef.current, { quality: 0.95, backgroundColor: '#000' });
      const link = document.createElement('a');
      link.download = `CHIRAKA_Snapshot_${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to take screenshot:', err);
    }
  };

  const downloadAsset = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `CHIRAKA_Asset_${Date.now()}.png`;
    link.click();
  };

  const exportAssetPackage = () => {
    const assets = characters.map(c => ({
      id: c.id,
      name: c.name,
      imageUrl: c.imageUrl,
      gallery: c.gallery
    }));
    const blob = new Blob([JSON.stringify({ type: 'CHIRAKA_ASSET_PACKAGE', assets }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CHIRAKA_Assets_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAssetPackage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isReadOnly) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.type === 'CHIRAKA_ASSET_PACKAGE' && Array.isArray(data.assets)) {
          recordHistory();
          setCharacters(prev => prev.map(c => {
            const found = data.assets.find((a: any) => a.id === c.id || a.name === c.name);
            if (found) {
              return { 
                ...c, 
                imageUrl: found.imageUrl || c.imageUrl,
                gallery: Array.from(new Set([...c.gallery, ...(found.gallery || [])]))
              };
            }
            return c;
          }));
        }
      } catch (err) {
        console.error('Import failed', err);
      }
    };
    reader.readAsText(file);
  };

  const handleAiAnalyze = async () => {
    if (!aiInput.trim() || isReadOnly) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `分析文案，捕捉角色联系: ${aiInput}`,
        config: { responseMimeType: "application/json" }
      });
      recordHistory();
      setAiInput('');
    } catch (err) { console.error(err); } finally { setIsAiLoading(false); }
  };

  const handleBoardDoubleClick = (e: React.MouseEvent) => {
    if (isReadOnly) return;
    if ((e.target as HTMLElement).closest('.char-node, .link-handle')) return;
    recordHistory();
    const newId = 'c' + Date.now();
    const newChar: Character = {
      id: newId, name: '新角色', nameEn: 'NEW AGENT', role: 'UNKNOWN', affiliation: 'UNKNOWN', description: '', gallery: [], imageUrl: `https://picsum.photos/seed/${newId}/200/250`, position: { x: (e.clientX - viewPos.x) / zoom - 80, y: (e.clientY - viewPos.y) / zoom - 110 }
    };
    setCharacters(prev => [...prev, newChar]);
    setActiveData(newChar); setPanelView('edit'); setIsSidebarOpen(true);
  };

  const handleLiveUpdate = (updatedData: any) => {
    if (isReadOnly) return;
    if ('position' in updatedData) {
      setCharacters(prev => prev.map(c => c.id === updatedData.id ? updatedData : c));
    } else {
      setRelationships(prev => prev.map(r => r.id === updatedData.id ? updatedData : r));
    }
    setActiveData(updatedData);
  };

  const handleDeleteItem = (id: string) => {
    if (isReadOnly) return;
    recordHistory();
    setCharacters(prev => prev.filter(c => c.id !== id));
    setRelationships(prev => prev.filter(r => r.id !== id && r.fromId !== id && r.toId !== id));
    setActiveData(null); 
    if (panelView !== 'intel') setPanelView('intel');
  };

  const handleMultipleFiles = (files: FileList | null, characterId?: string) => {
    if (!files || isReadOnly) return;
    const loaders = Array.from(files).map(file => {
      return new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = ev => resolve(ev.target?.result as string);
        r.readAsDataURL(file);
      });
    });
    Promise.all(loaders).then(base64List => {
      if (characterId) addToPersonalGallery(characterId, base64List);
      else if (activeData?.id) addToPersonalGallery(activeData.id, base64List);
    });
  };

  const allGalleryImages = characters.flatMap(c => c.gallery);

  const getRelInfo = (relId: string, char1Id: string, char2Id: string) => {
    const sortedRels = relationships.filter(r => 
      (r.fromId === char1Id && r.toId === char2Id) || (r.fromId === char2Id && r.toId === char1Id)
    ).sort((a, b) => a.id.localeCompare(b.id));
    return { index: sortedRels.findIndex(r => r.id === relId), total: sortedRels.length };
  };

  const bgStyles: Record<string, string> = {
    default: 'grid-bg',
    urban_blueprint: 'bg-[#0a1014] bg-[linear-gradient(rgba(0,180,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] after:pointer-events-none after:-z-10',
    redacted_dossier: 'bg-[#151515] bg-[radial-gradient(#222_10%,transparent_10%)] bg-[size:15px_15px] after:absolute after:inset-0 after:bg-[linear-gradient(45deg,rgba(255,255,255,0.01)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.01)_75%,rgba(255,255,255,0.01))] after:bg-[size:100px_100px] after:pointer-events-none after:-z-10',
    noir_halftone: 'bg-[#050010] [background:radial-gradient(circle_at_50%_50%,rgba(139,0,255,0.05),transparent),radial-gradient(circle_at_20%_80%,rgba(0,255,255,0.03),transparent)] after:absolute after:inset-0 after:bg-[url("https://www.transparenttextures.com/patterns/halftone.png")] after:opacity-10 after:pointer-events-none after:-z-10',
    grunge_file: 'bg-[#1a1917] bg-[url("https://www.transparenttextures.com/patterns/carbon-fibre.png")] opacity-95 after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.5))] after:pointer-events-none after:-z-10'
  };

  const cardStyles: Record<string, string> = {
    default: 'Standard Edition',
    intel: 'Cyber Intelligence',
    stencil: 'Stencil Poster',
    noir: 'Noir High-Contrast',
    warning: 'Hazard Zone'
  };

  const titleStyles: Record<string, string> = {
    comic: 'Comic Tension (Noir)',
    street: 'Street Soul (Stencil)',
    pop: 'Pop Art Blast (Blast)',
    pollock: 'Action Pollock (Splatter)'
  };

  const titleClassMap: Record<string, string> = {
    comic: 'title-art-comic',
    street: 'title-art-street',
    pop: 'title-art-pop',
    pollock: 'title-art-pollock'
  };

  const sortedRelationships = useMemo(() => {
    return [...relationships].sort((a, b) => {
      if (a.id === hoveredRelId) return 1;
      if (b.id === hoveredRelId) return -1;
      if (a.isDashed && !b.isDashed) return -1;
      if (!a.isDashed && b.isDashed) return 1;
      return 0;
    });
  }, [relationships, hoveredRelId]);

  if (viewMode === 'none') {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0c0c0e] flex items-center justify-center p-6 overflow-hidden font-['PingFang_SC','Hiragino_Sans_GB','Microsoft_YaHei',sans-serif]">
        {showObserverWelcome ? (
          <div className="text-center animate-pulse">
            <h1 className="bebas text-7xl text-yellow-500 tracking-widest mb-4">WELCOME TO CHIRAKA</h1>
            <p className="text-zinc-400 tracking-[0.3em] uppercase text-sm font-bold">Initializing Connection / 建立连接中</p>
          </div>
        ) : (
          <div className="w-full max-w-2xl bg-zinc-900 border-4 border-black shadow-[30px_30px_0px_#000] p-12 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/30 animate-scan"></div>
            <div className="flex flex-col items-center mb-12">
              <div className="w-20 h-20 bg-yellow-500/10 border-2 border-yellow-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                <Terminal size={40} className="text-yellow-500" />
              </div>
              <div className="text-center">
                <h1 className="bebas text-7xl text-white tracking-tighter leading-none mb-2">ACCESS PROTOCOL</h1>
                <p className="text-3xl font-black text-zinc-500 uppercase tracking-[0.2em]">选择模式</p>
              </div>
              <p className="text-zinc-600 text-[10px] tracking-[0.5em] uppercase mt-4">NEXUS OPERATIONAL INTERFACE V3.1</p>
            </div>

            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* Architect Mode Card */}
                <form 
                  onSubmit={handleAuth} 
                  className={`flex flex-col p-8 border-4 transition-all h-full ${authError ? 'border-red-600 animate-shake bg-red-900/10' : 'border-zinc-800 hover:border-yellow-500 bg-black/40'}`}
                >
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                      <Lock size={22} className="text-yellow-500" />
                      <h2 className="bebas text-4xl text-white">ARCHITECT</h2>
                    </div>
                    <p className="text-xl font-black text-zinc-500">架构者</p>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed mb-6 flex-grow">具备完整权限。允许对情报网进行实时编辑、逻辑重组及深度解析。需验证密钥。</p>
                  <div className="flex flex-col gap-2 mt-auto">
                    <input 
                      type="password"
                      placeholder="ENTER KEY"
                      className="w-full bg-zinc-900 border-2 border-zinc-800 p-3 text-sm bebas tracking-widest focus:border-yellow-500 outline-none text-yellow-500"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                    />
                    <button type="submit" className="btn-flat w-full py-3 flex items-center justify-center gap-2 text-sm">
                      <ShieldCheck size={18} /> INITIALIZE
                    </button>
                  </div>
                </form>

                {/* Observer Mode Card */}
                <button 
                  onClick={handleObserverEntry}
                  className="p-8 border-4 border-zinc-800 hover:border-white bg-black/40 transition-all text-left flex flex-col group/obs h-full"
                >
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                      <Eye size={22} className="text-zinc-400 group-hover/obs:text-white" />
                      <h2 className="bebas text-4xl text-white">OBSERVER</h2>
                    </div>
                    <p className="text-xl font-black text-zinc-500">漫游者</p>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed mb-6 flex-grow">访客模式。仅允许对现存情报进行查阅和视觉漫游。禁止所有编辑行为，无需密钥。</p>
                  <div className="mt-auto btn-secondary w-full py-3 flex items-center justify-center gap-2 group-hover/obs:bg-white group-hover/obs:text-black text-sm uppercase">
                    <Move size={18} /> ENTER VOID
                  </div>
                </button>
              </div>

              {/* Smaller Import Button at bottom */}
              <div className="flex justify-center">
                <label className="flex items-center gap-2 px-6 py-2 border-2 border-dashed border-zinc-800 hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer group/imp">
                  <Database size={16} className="text-zinc-500 group-hover/imp:text-blue-500" />
                  <span className="text-[10px] font-black text-zinc-500 group-hover/imp:text-blue-500 uppercase tracking-widest">LOAD EXTERNAL INTEL / 导入数据</span>
                  <input type="file" className="hidden" accept=".json" onChange={handleStartupImport} />
                </label>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-zinc-800/50 flex justify-between items-center opacity-40">
              <span className="bebas text-[10px] text-zinc-500 tracking-widest uppercase">ENCRYPTED // 256-BIT // AES</span>
              <span className="bebas text-[10px] text-zinc-500 tracking-widest uppercase">RYMORRAN PRESENTS © 2025</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden relative transition-all duration-700 ${bgStyles[backgroundStyle] || bgStyles.default}`}>
      
      <div className="corner-frame corner-top-left"></div>
      <div className="corner-frame corner-bottom-right"></div>

      {/* 右侧组别栏 - 增强了组别名称展示和图标更新 */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[80] flex flex-col gap-2 p-3 bg-zinc-900/40 backdrop-blur-md border-l-4 border-black border-y-4 rounded-l-xl">
        <div className="bebas text-[10px] text-zinc-500 tracking-[0.2em] mb-1 text-center">NEXUS GROUPS</div>
        
        {!isReadOnly && (
          <button 
            onClick={() => {
              setIsGroupAssignmentMode(!isGroupAssignmentMode);
              if (!isGroupAssignmentMode) setIsDeletionMode(false);
            }}
            className={`w-12 h-12 flex flex-col items-center justify-center border-2 transition-all group relative mb-2 ${isGroupAssignmentMode ? 'bg-blue-500 border-black text-black' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-blue-500'}`}
            title="BATCH GROUP EDIT / 批量编辑组别"
          >
            <PencilLine size={20} />
            <div className="absolute right-full mr-4 bg-blue-600 text-white px-2 py-1 text-[10px] font-black uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-zinc-700 shadow-xl" style={{ fontFamily: '"PingFang SC", sans-serif' }}>
              {isGroupAssignmentMode ? 'FINISH EDIT' : 'BATCH EDIT'}
            </div>
          </button>
        )}

        {GROUPS.map(group => (
          <button
            key={group.id}
            onClick={() => {
              const isAlreadyActive = activeGroupId === group.id;
              setActiveGroupId(isAlreadyActive ? null : group.id);
              setFocusedCharId(null);
              // 如果不是进入编辑模式，则触发聚焦放大
              if (!isGroupAssignmentMode && !isAlreadyActive) {
                handleFocusGroup(group.id);
              }
            }}
            className={`w-auto min-w-[3rem] px-3 h-14 flex items-center gap-3 border-2 transition-all group relative ${activeGroupId === group.id ? 'bg-yellow-500 border-black text-black scale-105 shadow-lg' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-yellow-500'}`}
          >
            <group.icon size={22} className="shrink-0" />
            <div className="flex flex-col items-start leading-none pr-1">
              <span className="text-[13px] font-black whitespace-nowrap" style={{ fontFamily: '"PingFang SC", sans-serif' }}>{group.name}</span>
              <span className={`text-[9px] font-bold uppercase tracking-tighter opacity-70 ${activeGroupId === group.id ? 'text-black' : 'text-zinc-500'}`} style={{ fontFamily: '"PingFang SC", sans-serif' }}>{group.label}</span>
            </div>
            
            <div className="absolute right-full mr-4 bg-black text-white px-2 py-1 text-[10px] font-black uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-zinc-700 shadow-xl" style={{ fontFamily: '"PingFang SC", sans-serif' }}>
              LOCATE: {group.name}
            </div>
          </button>
        ))}
        {activeGroupId && (
          <button 
            onClick={() => setActiveGroupId(null)}
            className="w-full h-8 bg-zinc-950 text-red-500 flex items-center justify-center border-2 border-zinc-800 hover:bg-red-500 hover:text-white transition-colors mt-2"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div 
        className={`h-full bg-[#1e1e22] border-r-4 border-black z-[95] flex flex-col absolute top-0 left-0 shadow-[10px_0px_30px_rgba(0,0,0,0.8)] transition-transform duration-700 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} 
        style={{ width: sidebarWidth, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="absolute right-0 top-0 w-1 h-full cursor-ew-resize hover:bg-yellow-500/50 z-20" onMouseDown={() => setIsResizingSidebar(true)} />
        <div className="p-6 border-b-4 border-black bg-zinc-800 flex justify-between items-center h-24 shrink-0">
          <h2 className="bebas text-4xl text-yellow-500 tracking-tighter flex items-center gap-2 truncate uppercase">
            {panelView !== 'intel' && (
              <button onClick={() => setPanelView('intel')} className="mr-2 text-zinc-500 hover:text-yellow-500 transition-colors">
                <ChevronLeft size={24} />
              </button>
            )}
            {panelView === 'info' || panelView === 'edit' || panelView === 'settings' ? <ImageIcon size={24} /> : <Terminal size={24} />}
            <span className="truncate bebas">{panelView === 'info' || panelView === 'edit' || panelView === 'settings' ? 'DOSSIER' : 'INTEL'}</span>
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scroll text-left relative flex flex-col">
          {(panelView === 'info' || panelView === 'edit') && activeData && 'position' in activeData && (
            <div className="flex flex-col space-y-4">
              <div className="border-4 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.5)] overflow-hidden shrink-0 cursor-zoom-in" style={{ width: '100%', height: 'auto', aspectRatio: '4/5' }} onClick={() => setViewedImage(activeData.imageUrl)}>
                <img src={activeData.imageUrl} className="w-full h-full object-cover grayscale-0" />
              </div>
              <div className="space-y-0">
                <h3 className="bebas text-yellow-500 text-5xl leading-none uppercase">{activeData.nameEn || activeData.name}</h3>
                <h4 className="chinese-hard-edge text-white text-3xl leading-none">{activeData.name}</h4>
              </div>
              <p className="source-han tracking-[0.1em] text-zinc-500 text-[11px] mt-2 uppercase">{activeData.role}</p>
              <div className="p-4 bg-black/40 border border-zinc-800 font-bold leading-relaxed text-zinc-400 text-sm">{activeData.description}</div>
              <div className="pt-4 border-t border-zinc-800 space-y-4">
                <div className="flex justify-between items-center">
                   <span className="bebas text-[11px] tracking-widest text-zinc-500 uppercase">COLLECTION / 个人图库</span>
                   {!isReadOnly && (
                     <label className="cursor-pointer hover:text-yellow-500 transition-colors">
                       <Plus size={16} />
                       <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleMultipleFiles(e.target.files, activeData.id)} />
                     </label>
                   )}
                </div>
                <div className="flex gap-2 h-20 overflow-hidden">
                  {activeData.gallery.slice(0, 3).map((img: string, i: number) => (
                    <div key={i} className="relative w-1/3 group cursor-pointer" onClick={() => setViewedImage(img)}>
                      <img src={img} className="w-full h-full object-cover border-2 border-zinc-800 group-hover:border-yellow-500 transition-colors" />
                    </div>
                  ))}
                  {activeData.gallery.length === 0 && <div className="w-full flex items-center justify-center bebas text-[10px] tracking-widest text-zinc-600 border-2 border-dashed border-zinc-800">NO MEDIA LINKED</div>}
                </div>
                <button onClick={() => { setActiveGalleryMode('personal'); setIsAlbumOpen(true); }} className="btn-secondary w-full py-2 text-[11px] tracking-widest font-black hover:bg-yellow-500 hover:text-black flex items-center justify-center gap-2 bebas uppercase">VIEW FULL GALLERY <ChevronRight size={14} /></button>
              </div>
              {panelView === 'edit' && !isReadOnly && <button onClick={() => setPanelView('info')} className="btn-flat w-full py-3 flex items-center justify-center gap-2 mt-4 bebas"><Save size={18} /> DONE</button>}
            </div>
          )}
          {panelView === 'intel' && (
            <div className="flex flex-col h-full space-y-4">
              <textarea 
                value={aiInput} 
                onChange={e => setAiInput(e.target.value)} 
                placeholder={isReadOnly ? "INTEL TERMINAL DISABLED" : "PASTE RAW INTEL SNIPPETS..."} 
                className="flex-1 bg-zinc-950 border-2 border-zinc-800 p-4 text-sm font-bold resize-none focus:border-yellow-500 outline-none disabled:opacity-50"
                disabled={isReadOnly}
              />
              {!isReadOnly && (
                <button onClick={handleAiAnalyze} disabled={isAiLoading || !aiInput.trim()} className="btn-flat w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">{isAiLoading ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />} {isAiLoading ? 'ANALYZING...' : 'DECRYPT INTEL'}</button>
              )}
            </div>
          )}
        </div>
        {!isReadOnly && (
          <div className="p-6 bg-zinc-900 border-t-4 border-black space-y-3 shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={exportBoard} className="btn-flat py-2 text-[10px] uppercase flex items-center justify-center gap-1 hover:bg-white hover:text-black shadow-sm font-black tracking-widest"><Save size={14} /> SAVE NEXUS</button>
              <label className="btn-secondary py-2 text-[10px] uppercase flex items-center justify-center gap-1 hover:bg-yellow-500 hover:text-black cursor-pointer shadow-sm font-black tracking-widest">
                <Upload size={14} /> IMPORT
                <input type="file" className="hidden" accept=".json" onChange={(e) => { 
                  const file = e.target.files?.[0]; 
                  if (file) { 
                    const r = new FileReader(); 
                    r.onload = (ev) => { 
                      try { 
                        const data = JSON.parse(ev.target?.result as string);
                        if (data.type === 'CHIRAKA_ASSET_PACKAGE') return; 
                        recordHistory(); 
                        applyState(data); 
                      } catch(e){} 
                    }; 
                    r.readAsText(file); 
                  } 
                }} />
              </label>
            </div>
            {/* Share Link Button - Added based on request */}
            <div className="relative">
              <button 
                onClick={generateShareLink} 
                className="w-full btn-secondary py-3 text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white font-black tracking-widest border-2 border-zinc-700"
              >
                <Share2 size={18} /> {copyStatus || 'GENERATE SHARE LINK'}
              </button>
            </div>
            <button onClick={takeScreenshot} className="w-full btn-secondary py-3 text-[11px] uppercase flex items-center justify-center gap-2 hover:border-yellow-500 font-black tracking-widest"><ImageIcon size={18} /> SNAPSHOT BOARD</button>
          </div>
        )}
      </div>

      <div 
        className="flex-1 relative overflow-hidden board-container h-full w-full" 
        onMouseDown={(e) => { 
          if (e.button === 1) {
            e.preventDefault();
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            setIsPanning(true);
            return;
          }
          const target = e.target as HTMLElement;
          const isCard = !!target.closest('.char-node');
          const isHandle = !!target.closest('.link-handle');
          const isUI = !!target.closest('button, .sidebar, .album-drawer, .corner-frame, textarea, input, .fixed');
          if (e.button === 0 && !isCard && !isHandle && !isUI) {
            if (isDeletionMode) setIsDeletionMode(false);
            if (isGroupAssignmentMode) setIsGroupAssignmentMode(false);
            if (isAlbumOpen) setIsAlbumOpen(false);
            if (isSidebarOpen) setIsSidebarOpen(false);
            if (isBgPickerOpen) setIsBgPickerOpen(false);
            if (isStylePickerOpen) setIsStylePickerOpen(false);
            setFocusedCharId(null);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            setIsPanning(true);
          }
        }} 
        onWheel={(e) => { const delta = e.deltaY > 0 ? 0.9 : 1.1; setZoom(prev => Math.min(Math.max(prev * delta, 0.2), 3)); }} 
        onDoubleClick={handleBoardDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div 
          ref={boardRef} 
          className="absolute inset-0 w-full h-full" 
          style={{ 
            transform: `translate(${viewPos.x}px, ${viewPos.y}px) scale(${zoom})`, 
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          
          <div className="absolute inset-0 pointer-events-none">
            {characters.map(char => {
              const isHighlighted = !isAnyFilterActive || highlightedCharIds.has(char.id);
              const isMemberOfActiveGroup = isGroupAssignmentMode && activeGroupId && char.groupId === activeGroupId;

              return (
                <div key={char.id} className="pointer-events-auto">
                  <CharacterCard 
                    character={char} 
                    isSelected={activeData?.id === char.id || focusedCharId === char.id || isMemberOfActiveGroup} 
                    isHovered={hoveredCharId === char.id}
                    isGlobalBW={isGlobalBW || (!isHighlighted && isAnyFilterActive)} 
                    isDeletionMode={isDeletionMode}
                    cardStyle={cardStyle}
                    onPositionChange={(id, x, y) => { if(!isReadOnly) setCharacters(prev => prev.map(c => { if(c.id === id) return { ...c, position: { x, y } }; return c; })); }} 
                    onDragEnd={recordHistory} 
                    onHoverChange={(h) => setHoveredCharId(h ? char.id : null)}
                    onUpdateImage={(id, url) => { if(!isReadOnly) { recordHistory(); setCharacters(prev => prev.map(c => { if(c.id === id) return { ...c, imageUrl: url }; return c; })); } }} 
                    onInfoClick={(c) => { 
                      handleCharacterClick(c);
                      if (!isDeletionMode && !isGroupAssignmentMode) { 
                        if (isSidebarOpen && activeData?.id === c.id && panelView === 'info') {
                          setIsSidebarOpen(false);
                          setPanelView('intel');
                          setActiveData(null);
                        } else {
                          setActiveData(c); 
                          setPanelView('info'); 
                          setIsSidebarOpen(true);
                        }
                      } 
                    }} 
                    onEditDoubleClick={(c) => { 
                      if (!isDeletionMode && !isReadOnly && !isGroupAssignmentMode) { 
                        recordHistory(); 
                        setActiveData(c); 
                        setPanelView('edit'); 
                        setIsSidebarOpen(true);
                      } 
                    }} 
                    onStartLink={(id, pos) => { if(!isReadOnly) setLinkingFrom({ id, startPos: pos }); }} 
                    onDelete={handleDeleteItem}
                    onStartDeletionMode={() => { if(!isReadOnly) setIsDeletionMode(true); }}
                    isReadOnly={isReadOnly}
                  />
                </div>
              );
            })}
          </div>

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[30] overflow-visible">
            {sortedRelationships.map((rel) => {
              const from = characters.find(c => c.id === rel.fromId);
              const to = characters.find(c => c.id === rel.toId);
              if (!from || !to) return null;
              const isHighlighted = !isAnyFilterActive || highlightedRelIds.has(rel.id);
              const { index, total } = getRelInfo(rel.id, rel.fromId, rel.toId);
              return (
                <RelationshipLine 
                  key={rel.id} 
                  relationship={rel} 
                  fromChar={from} 
                  toChar={to} 
                  typeConfig={relTypes.find(t => t.id === rel.typeId)} 
                  onEdit={(r) => { 
                    if (!isDeletionMode && !isReadOnly) { 
                      recordHistory(); 
                      setActiveData(r); 
                      setPanelView('edit'); 
                      setIsSidebarOpen(true); 
                    } 
                  }} 
                  onHoverChange={setHoveredRelId}
                  relIndex={index}
                  relTotal={total}
                  isDimmed={!isHighlighted && isAnyFilterActive}
                  isReadOnly={isReadOnly}
                />
              );
            })}
            {linkingFrom && <path d={`M ${linkingFrom.startPos.x} ${linkingFrom.startPos.y} L ${mousePos.x} ${mousePos.y}`} stroke="#fbbf24" strokeWidth="3" strokeDasharray="5,5" fill="none" />}
          </svg>
        </div>

        <div 
          className={`absolute top-10 left-10 z-[60] text-left pointer-events-auto transition-transform duration-700 ease-in-out ${isSidebarOpen ? '-translate-x-[150%]' : 'translate-x-0'}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <div className="title-wrapper group">
            <div className="orbital-container">
              <div className="orbit orbit-1"><div className="orbit-node"></div></div>
              <div className="orbit orbit-2"><div className="orbit-node orbit-node-white"></div></div>
              <div className="orbit orbit-3"><div className="orbit-node"></div></div>
            </div>
            <div className={titleClassMap[titleStyle] || ''} data-text={`${titleWhite}\n${titleYellow}`}>
              <h1 className="bebas text-8xl text-white leading-none tracking-tighter drop-shadow-[8px_8px_0px_#000] uppercase select-none whitespace-pre-line">
                {titleWhite}
                <br />
                <span className="text-yellow-500 bebas">{titleYellow}</span>
              </h1>
              {titleStyle === 'pollock' && (
                <>
                  <div className="splatter" style={{ width: '40px', height: '40px', top: '10px', left: '-20px', animationDelay: '0s' }}></div>
                  <div className="splatter" style={{ width: '20px', height: '20px', top: '80px', left: '120px', animationDelay: '0.5s', background: '#fff' }}></div>
                  <div className="splatter" style={{ width: '30px', height: '30px', top: '40px', left: '200px', animationDelay: '1.2s' }}></div>
                </>
              )}
            </div>
          </div>
        </div>

        <div 
          className={`absolute bottom-10 left-10 z-[80] pointer-events-auto flex items-center gap-4 transition-transform duration-700 ease-in-out ${isSidebarOpen ? '-translate-x-[150%]' : 'translate-x-0'}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setIsHelpOpen(!isHelpOpen); }}
            className={`w-14 h-14 border-4 border-black shadow-xl transition-all flex items-center justify-center ${isHelpOpen ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-yellow-500'}`}
            title="OPERATION GUIDE"
          >
            <HelpCircle size={24} />
          </button>
          {!isReadOnly && (
            <>
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsBgPickerOpen(!isBgPickerOpen); setIsStylePickerOpen(false); }}
                  className={`w-14 h-14 border-4 border-black shadow-xl transition-all flex items-center justify-center ${isBgPickerOpen ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-yellow-500'}`}
                  title="BACKGROUND THEME"
                >
                  <Palette size={24} />
                </button>
                {isBgPickerOpen && (
                  <div className="absolute left-0 bottom-full mb-4 bg-zinc-900/95 border-4 border-black p-4 w-64 shadow-2xl animate-in slide-in-from-bottom-2 duration-300 z-[100]">
                    <h4 className="bebas text-2xl text-yellow-500 mb-4 tracking-widest uppercase">Thematic Nexus / 背景库</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.keys(bgStyles).map(styleKey => (
                        <button 
                          key={styleKey}
                          onClick={() => { recordHistory(); setBackgroundStyle(styleKey); setIsBgPickerOpen(false); }}
                          className={`h-10 border-2 px-3 transition-all flex items-center justify-between group ${backgroundStyle === styleKey ? 'border-yellow-500 bg-yellow-500/10' : 'border-zinc-800 hover:border-zinc-500'}`}
                        >
                          <span className="bebas text-xs text-zinc-400 group-hover:text-white uppercase tracking-widest">{styleKey.replace('_', ' ')}</span>
                          {backgroundStyle === styleKey && <Check size={14} className="text-yellow-500" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsStylePickerOpen(!isStylePickerOpen); setIsBgPickerOpen(false); }}
                  className={`w-14 h-14 border-4 border-black shadow-xl transition-all flex items-center justify-center ${isStylePickerOpen ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-yellow-500'}`}
                  title="VISUAL STYLE SELECTOR"
                >
                  <Sparkles size={24} />
                </button>
                {isStylePickerOpen && (
                  <div className="absolute left-0 bottom-full mb-4 bg-zinc-900/95 border-4 border-black p-4 w-72 shadow-2xl animate-in slide-in-from-bottom-2 duration-300 z-[100]">
                    <h4 className="bebas text-2xl text-yellow-500 mb-2 tracking-widest uppercase">Style Matrix / 视觉矩阵</h4>
                    <div className="mb-4">
                      <label className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-2 block">Card Aesthetic / 画幅效果</label>
                      <div className="grid grid-cols-1 gap-1">
                        {Object.keys(cardStyles).map(key => (
                          <button 
                            key={key} 
                            onClick={() => { recordHistory(); setCardStyle(key); }}
                            className={`h-9 border-2 px-3 flex items-center justify-between transition-all ${cardStyle === key ? 'border-yellow-500 bg-yellow-500/10' : 'border-zinc-800 hover:border-zinc-500'}`}
                          >
                            <span className="bebas text-[11px] text-zinc-400 tracking-widest uppercase">{cardStyles[key]}</span>
                            {cardStyle === key && <Box size={14} className="text-yellow-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-2 block">Title Art / 标题风格</label>
                      <div className="grid grid-cols-1 gap-1">
                        {Object.keys(titleStyles).map(key => (
                          <button 
                            key={key} 
                            onClick={() => { recordHistory(); setTitleStyle(key); }}
                            className={`h-9 border-2 px-3 flex items-center justify-between transition-all ${titleStyle === key ? 'border-yellow-500 bg-yellow-500/10' : 'border-zinc-800 hover:border-zinc-500'}`}
                          >
                            <span className="bebas text-[11px] text-zinc-400 tracking-widest uppercase">{titleStyles[key]}</span>
                            {titleStyle === key && <Check size={14} className="text-yellow-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {isHelpOpen && (
            <div className="absolute left-0 bottom-full mb-6 bg-zinc-900/80 backdrop-blur-md border-2 border-zinc-700 p-6 rounded shadow-2xl animate-in slide-in-from-bottom-4 duration-300 w-80">
              <h3 className="bebas text-2xl text-yellow-500 mb-4 tracking-widest uppercase">FIELD OPERATING GUIDE / 操作指南</h3>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <MousePointer2 size={18} className="text-yellow-500 shrink-0 mt-1" />
                  <div>
                    <div className="bebas text-sm text-white uppercase">Tactical Control</div>
                    <div className="source-han text-[11px] text-zinc-400">所有操作基于十字瞄准形态进行交互</div>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <Move size={18} className="text-yellow-500 shrink-0 mt-1" />
                  <div>
                    <div className="bebas text-sm text-white uppercase">Drag & Pan</div>
                    <div className="source-han text-[11px] text-zinc-400">左键(背景)或中键(全屏)拖拽画布：平移调查版；滚轮：缩放</div>
                  </div>
                </div>
                {!isReadOnly && (
                  <div className="flex gap-3 items-start">
                    <Link size={18} className="text-yellow-500 shrink-0 mt-1" />
                    <div>
                      <div className="bebas text-sm text-white uppercase">Deletion Mode</div>
                      <div className="source-han text-[11px] text-zinc-400">长按画像进入删除模式，点击 [×] 抹除特工</div>
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsHelpOpen(false); }}
                className="mt-6 w-full py-2 bg-yellow-500 text-black bebas text-sm font-black tracking-widest uppercase hover:bg-white transition-colors"
              >
                Understood / 收到
              </button>
            </div>
          )}
        </div>

        <div className="absolute top-10 right-10 z-[80] flex gap-4 pointer-events-auto">
          {!isReadOnly && (
            <div className="flex border-4 border-black shadow-xl overflow-hidden bg-zinc-800 rounded-sm">
              <button onClick={handleUndo} disabled={history.length === 0} className="p-4 hover:bg-yellow-500 hover:text-black transition-all border-r-2 border-black disabled:opacity-30" title="UNDO (Ctrl+Z)"><Undo2 size={24} /></button>
              <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-4 hover:bg-yellow-500 hover:text-black transition-all border-r-2 border-black disabled:opacity-30" title="REDO (Ctrl+Shift+Z)"><Redo2 size={24} /></button>
              <button onClick={handleAutoLayout} className="p-4 hover:bg-yellow-500 hover:text-black transition-all" title="AUTO ARRANGE LAYOUT"><Layout size={24} /></button>
            </div>
          )}
          <div className="flex border-4 border-black shadow-xl overflow-hidden bg-zinc-800 rounded-sm">
            <button 
              onClick={() => { setIsSidebarOpen(!isSidebarOpen); if(!isSidebarOpen) setPanelView('intel'); }} 
              className={`p-4 transition-all border-r-2 border-black ${isSidebarOpen && panelView === 'intel' ? 'bg-yellow-500 text-black' : 'text-zinc-400 hover:text-yellow-500'}`} 
              title="OPEN INTEL TERMINAL"
            >
              <Terminal size={24} />
            </button>
            {!isReadOnly && (
              <button onClick={() => setIsGlobalBW(!isGlobalBW)} className={`p-4 transition-all ${isGlobalBW ? 'bg-white text-black' : 'text-white hover:bg-zinc-700'}`} title="TOGGLE B&W STYLE"><Palette size={24} /></button>
            )}
          </div>
          <button onClick={() => { setActiveGalleryMode('global'); setIsAlbumOpen(!isAlbumOpen); }} className={`p-4 border-4 border-black shadow-xl transition-all ${isAlbumOpen ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-yellow-500 hover:text-white'}`} title="OPEN ALBUM"><FolderHeart size={24} /></button>
        </div>
      </div>

      <div 
        className={`absolute right-0 top-0 h-full w-1/3 z-[95] album-drawer flex flex-col p-6 shadow-2xl transition-transform duration-700 border-l-4 border-black bg-[#1e1e22] ${isAlbumOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h3 className="bebas text-3xl text-yellow-500 tracking-widest truncate uppercase">{activeGalleryMode === 'personal' ? `${activeData?.nameEn || activeData?.name} ASSETS` : 'GLOBAL NEXUS COLLECTION'}</h3>
          <button onClick={() => setIsAlbumOpen(false)} className="p-2 bg-zinc-800 text-white rounded hover:bg-red-500 transition-all"><X size={20} /></button>
        </div>
        {!isReadOnly && (
          <div className="flex gap-2 mb-4 shrink-0">
             <button onClick={exportAssetPackage} className="flex-1 btn-secondary py-2 text-[10px] uppercase flex items-center justify-center gap-1 hover:bg-blue-600 hover:text-white shadow-sm font-black tracking-widest"><FolderDown size={14} /> EXPORT MANIFEST</button>
             <label className="flex-1 btn-secondary py-2 text-[10px] uppercase flex items-center justify-center gap-1 hover:bg-green-600 hover:text-white cursor-pointer shadow-sm font-black tracking-widest">
               <FileUp size={14} /> IMPORT ASSETS
               <input type="file" className="hidden" accept=".json" onChange={importAssetPackage} />
             </label>
             <label className="p-2 btn-secondary hover:bg-yellow-500 hover:text-black cursor-pointer shadow-sm">
               <Plus size={18} />
               <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleMultipleFiles(e.target.files)} />
             </label>
          </div>
        )}
        <div className="flex-1 overflow-y-auto pr-2 custom-scroll">
          <div ref={galleryRef} className="waterfall-container">
            {(activeGalleryMode === 'personal' && activeData?.gallery ? activeData.gallery : allGalleryImages).map((img: string, i: number) => (
              <div key={i} className="waterfall-item group relative">
                <img src={img} className="w-full border border-zinc-700 group-hover:border-yellow-500 transition-all cursor-zoom-in" onClick={() => setViewedImage(img)} />
                {activeGalleryMode === 'personal' && !isReadOnly && (
                  <div className="drag-handle absolute top-2 left-2 p-1.5 bg-black/80 text-white rounded opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity">
                    <GripVertical size={16} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); downloadAsset(img); }} className="p-1.5 bg-black/80 text-white rounded shadow-lg transition-transform active:scale-95"><Download size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {viewedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-10 cursor-zoom-out" onClick={() => setViewedImage(null)}>
          <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img src={viewedImage} className="max-w-full max-h-[85vh] shadow-2xl border-4 border-white/5 relative z-10" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-20">
              <span className="bebas text-[12vw] text-white/5 whitespace-nowrap -rotate-12 select-none uppercase tracking-tighter">
                CHIRAKA // RYMORRAN PRESENTS
              </span>
            </div>
            <div className="absolute top-4 right-4 flex gap-2 z-30">
               <button onClick={() => downloadAsset(viewedImage)} className="p-3 bg-yellow-500 text-black rounded-sm shadow-xl hover:scale-105 transition-transform">
                 <Download size={24} strokeWidth={3} />
               </button>
               <button onClick={() => setViewedImage(null)} className="p-3 bg-zinc-800 text-white rounded-sm shadow-xl hover:bg-red-500">
                 <X size={24} />
               </button>
            </div>
          </div>
        </div>
      )}
      
      {panelView === 'edit' && activeData && !isReadOnly && (
        <EditModal 
          type={activeData.position ? 'character' : 'relationship'} 
          data={activeData} 
          relTypes={relTypes} 
          onSave={handleLiveUpdate} 
          onDelete={handleDeleteItem} 
          onClose={() => setPanelView('info')} 
          onUpdateRelTypes={setRelTypes}
          onOpenSettings={() => setPanelView('settings')}
        />
      )}
      {panelView === 'settings' && !isReadOnly && (
        <EditModal 
          type="settings" 
          data={{}} 
          relTypes={relTypes} 
          onSave={() => {}} 
          onDelete={() => {}} 
          onClose={() => setPanelView('edit')} 
          onUpdateRelTypes={setRelTypes}
        />
      )}
    </div>
  );
};

export default App;
