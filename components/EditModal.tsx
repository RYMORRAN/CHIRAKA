
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Character, Relationship, RelationshipTypeConfig } from '../types';
import { X, Save, Trash2, Plus, ArrowRightLeft, Spline, Undo2, Redo2, Settings2, Palette, Users } from 'lucide-react';

interface EditModalProps {
  type: 'character' | 'relationship' | 'settings';
  data: any;
  relTypes: RelationshipTypeConfig[];
  onSave: (data: any) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onUpdateRelTypes?: (types: RelationshipTypeConfig[]) => void;
  onOpenSettings?: () => void;
}

const GROUPS_META = [
  { id: 'villains', name: '恶人' },
  { id: 'queen_bee', name: '女王蜂' },
  { id: 'angel_zoo', name: 'ANGEL ZOO' },
  { id: 'eden', name: '伊甸之东' },
];

const COLOR_PRESETS = [
  '#ff4d4d', // 1: Red
  '#ffaa00', // 2: Orange
  '#fbbf24', // 3: Yellow
  '#00ffaa', // 4: Green
  '#4da3ff', // 5: Cyan
  '#3b82f6', // 6: Blue
  '#a855f7', // 7: Purple
  '#ec4899', // 8: Pink
  '#ffffff', // 9: White
];

const EditModal: React.FC<EditModalProps> = ({ 
  type, data, relTypes, onSave, onDelete, onClose, onUpdateRelTypes, onOpenSettings
}) => {
  const [formData, setFormData] = useState({ ...data });
  const [history, setHistory] = useState<any[]>([{ ...data }]);
  const [historyPointer, setHistoryPointer] = useState(0);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (isInternalChange.current) {
      onSave(formData);
    }
  }, [formData, onSave]);

  const recordHistory = useCallback((newData: any) => {
    if (JSON.stringify(newData) === JSON.stringify(history[historyPointer])) return;

    const newHistory = history.slice(0, historyPointer + 1);
    newHistory.push(JSON.parse(JSON.stringify(newData)));
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryPointer(newHistory.length - 1);
  }, [history, historyPointer]);

  const undo = useCallback(() => {
    if (historyPointer > 0) {
      isInternalChange.current = true;
      const prev = history[historyPointer - 1];
      setHistoryPointer(historyPointer - 1);
      setFormData({ ...prev });
    }
  }, [history, historyPointer]);

  const redo = useCallback(() => {
    if (historyPointer < history.length - 1) {
      isInternalChange.current = true;
      const next = history[historyPointer + 1];
      setHistoryPointer(historyPointer + 1);
      setFormData({ ...next });
    }
  }, [history, historyPointer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const updateField = (field: string, value: any) => {
    isInternalChange.current = true;
    const next = { ...formData, [field]: value };
    setFormData(next);
  };

  const handleBlur = () => {
    recordHistory(formData);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const nameToDisplay = type === 'character' ? formData.name : formData.label;
    const confirmed = window.confirm(
      type === 'character' 
        ? `确认要从情报网中抹除角色 [${nameToDisplay}] 吗？所有关联线索也将一并移除。`
        : `确认要移除这段关系 [${nameToDisplay}] 吗？`
    );
    
    if (confirmed) {
      onDelete(data.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div 
        className="bg-zinc-900 border-4 border-zinc-800 w-full max-w-md rounded-sm shadow-2xl overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-zinc-800 p-4 flex justify-between items-center border-b-2 border-black">
          <div className="flex flex-col">
            <h3 className="bebas text-3xl text-yellow-500 uppercase tracking-tight leading-none">
              {type === 'character' ? '档案编辑 / FILE' : type === 'relationship' ? '关系调查 / DOSSIER' : '类型设置 / SCHEMA'}
            </h3>
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Dossier Access Authorized</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={undo} 
              disabled={historyPointer === 0} 
              className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
              title="UNDO (Ctrl+Z)"
            >
              <Undo2 size={20} />
            </button>
            <button 
              onClick={redo} 
              disabled={historyPointer === history.length - 1} 
              className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
              title="REDO (Ctrl+Shift+Z)"
            >
              <Redo2 size={20} />
            </button>
            <button onClick={onClose} className="ml-2 hover:text-yellow-500 transition-colors"><X size={28} /></button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scroll">
          {type === 'character' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-500 uppercase">CHINESE NAME / 中文名称</label>
                <input 
                  className="w-full bg-zinc-800 border-2 border-zinc-700 p-2 rounded text-lg font-black focus:border-yellow-500 outline-none text-white"
                  value={(formData as Character).name}
                  onChange={e => updateField('name', e.target.value)}
                  onBlur={handleBlur}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-500 uppercase">ENGLISH NAME / 英文名称</label>
                <input 
                  className="w-full bg-zinc-800 border-2 border-zinc-700 p-2 rounded text-lg font-black focus:border-yellow-500 outline-none text-yellow-500 bebas uppercase tracking-widest"
                  value={(formData as Character).nameEn || ''}
                  onChange={e => updateField('nameEn', e.target.value)}
                  onBlur={handleBlur}
                />
              </div>

              {/* Group Selection */}
              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-500 uppercase flex items-center gap-2">
                  <Users size={12} /> 所属组别 / NEXUS GROUP
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GROUPS_META.map(g => (
                    <button
                      key={g.id}
                      onClick={() => {
                        const newVal = (formData as Character).groupId === g.id ? undefined : g.id;
                        updateField('groupId', newVal);
                        recordHistory({ ...formData, groupId: newVal });
                      }}
                      className={`text-[11px] py-2 px-3 border-2 rounded font-black transition-all ${(formData as Character).groupId === g.id ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500' : 'border-zinc-700 text-zinc-500'}`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-500 uppercase">ROLE / 身份</label>
                <input 
                  className="w-full bg-zinc-800 border-2 border-zinc-700 p-2 rounded text-sm text-yellow-500 bebas tracking-widest focus:border-yellow-500 outline-none"
                  value={(formData as Character).role}
                  onChange={e => updateField('role', e.target.value)}
                  onBlur={handleBlur}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-500 uppercase">INTEL / 简介</label>
                <textarea 
                  className="w-full bg-zinc-800 border-2 border-zinc-700 p-2 rounded h-32 text-sm resize-none focus:border-yellow-500 outline-none"
                  value={(formData as Character).description}
                  onChange={e => updateField('description', e.target.value)}
                  onBlur={handleBlur}
                />
              </div>
            </>
          )}

          {type === 'relationship' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-500 uppercase">TAG / 关键词</label>
                <input 
                  className="w-full bg-zinc-800 border-2 border-zinc-700 p-2 rounded text-lg font-black focus:border-yellow-500 outline-none"
                  value={(formData as Relationship).label}
                  onChange={e => updateField('label', e.target.value)}
                  onBlur={handleBlur}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase text-zinc-500 font-black">TYPE / 分类类型</label>
                  <button 
                    onClick={onOpenSettings}
                    className="text-[10px] text-yellow-500 hover:text-white flex items-center gap-1 font-black uppercase"
                  >
                    <Settings2 size={12} /> 管理类型
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {relTypes.map(rt => (
                    <button 
                      key={rt.id}
                      onClick={() => {
                        updateField('typeId', rt.id);
                        recordHistory({ ...formData, typeId: rt.id });
                      }}
                      className={`text-xs py-2 px-3 border-2 rounded font-black transition-all ${(formData as Relationship).typeId === rt.id ? 'border-yellow-500 bg-yellow-500/10' : 'border-zinc-700 opacity-50 hover:opacity-100'}`}
                      style={{ color: rt.color }}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    const nextVal = !formData.isBiDirectional;
                    updateField('isBiDirectional', nextVal);
                    recordHistory({ ...formData, isBiDirectional: nextVal });
                  }}
                  className={`flex items-center justify-center gap-2 p-3 border-2 rounded font-black text-xs uppercase transition-all ${formData.isBiDirectional ? 'bg-yellow-500 text-black border-black shadow-inner' : 'border-zinc-700 text-zinc-500'}`}
                >
                  <ArrowRightLeft size={16} /> 相互关系
                </button>
                <button 
                  onClick={() => {
                    const nextVal = !formData.isDashed;
                    updateField('isDashed', nextVal);
                    recordHistory({ ...formData, isDashed: nextVal });
                  }}
                  className={`flex items-center justify-center gap-2 p-3 border-2 rounded font-black text-xs uppercase transition-all ${formData.isDashed ? 'bg-zinc-100 text-black border-black' : 'border-zinc-700 text-zinc-500'}`}
                >
                  <Spline size={16} /> 虚线(主观印象)
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-500 uppercase">DETAILS / 情报详情</label>
                <textarea 
                  className="w-full bg-zinc-800 border-2 border-zinc-700 p-2 rounded h-32 text-sm resize-none focus:border-yellow-500 outline-none"
                  value={(formData as Relationship).description}
                  onChange={e => updateField('description', e.target.value)}
                  onBlur={handleBlur}
                />
              </div>
            </>
          )}

          {type === 'settings' && (
            <div className="space-y-6">
              {relTypes.map((rt, idx) => (
                <div key={rt.id} className="bg-black/40 p-4 border border-zinc-800 rounded space-y-3">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] text-zinc-500 font-black uppercase">TYPE NAME / 类型名称</label>
                      <input 
                        className="w-full bg-zinc-800 border-2 border-zinc-700 rounded px-2 py-1.5 text-sm font-black focus:border-yellow-500 outline-none"
                        value={rt.label}
                        onChange={(e) => {
                          const next = [...relTypes];
                          next[idx].label = e.target.value;
                          onUpdateRelTypes?.(next);
                        }}
                        onBlur={handleBlur}
                      />
                    </div>
                    <button 
                      onClick={() => onUpdateRelTypes?.(relTypes.filter(t => t.id !== rt.id))}
                      className="mt-4 text-red-500 hover:bg-red-500/10 p-2 rounded transition-colors"
                      title="REMOVE TYPE"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 font-black uppercase">CHOOSE COLOR / 选择颜色 (PRESETS)</label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            const next = [...relTypes];
                            next[idx].color = color;
                            onUpdateRelTypes?.(next);
                            handleBlur();
                          }}
                          className={`w-8 h-8 rounded border-2 transition-transform hover:scale-110 active:scale-95 ${rt.color.toLowerCase() === color.toLowerCase() ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-black'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <div className="relative group">
                        <input 
                          type="color" 
                          value={rt.color} 
                          onChange={(e) => {
                            const next = [...relTypes];
                            next[idx].color = e.target.value;
                            onUpdateRelTypes?.(next);
                          }}
                          onBlur={handleBlur}
                          className="w-8 h-8 bg-transparent rounded cursor-pointer border-2 border-zinc-700"
                        />
                        <Palette size={10} className="absolute bottom-0 right-0 text-white bg-black/50 rounded pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => onUpdateRelTypes?.([...relTypes, { id: 'rt' + Date.now(), label: '新分类', color: '#ffffff' }])}
                className="w-full flex items-center justify-center gap-2 py-4 border-4 border-dashed border-zinc-700 rounded hover:border-yellow-500 hover:text-yellow-500 transition-all font-black uppercase text-xs"
              >
                <Plus size={16} /> 增加分类 / NEW SCHEMA
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-800 flex justify-between items-center border-t-2 border-black">
          {type !== 'settings' && type !== 'character' ? (
            <button 
              type="button"
              onClick={handleDelete} 
              className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-3 py-2 rounded text-xs font-black uppercase tracking-widest transition-colors z-20"
            >
              <Trash2 size={16} /> 删除项 / PURGE
            </button>
          ) : (
            <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest source-han">
              {type === 'character' ? '抹除档案请长按主面板画像' : '分类定义管理'}
            </div>
          )}
          <button onClick={onClose} className="btn-flat px-8 py-3 text-sm bebas uppercase tracking-widest shadow-[4px_4px_0px_#000]">确认修改 / COMMIT</button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
