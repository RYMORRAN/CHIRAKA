
import { Character, Relationship, RelationshipTypeConfig, LayoutConfig, BoardData } from './types';

/**
 * @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * 
 *   🔴🔴🔴 [核心情报数据注入区 / CORE INTEL INJECTION ZONE] 🔴🔴🔴
 *   
 *   如果你想在部署后让所有人打开网页都默认显示你设计的布局：
 *   1. 在网页端点击 "SAVE" 导出 JSON 文件。
 *   2. 用记事本打开该 JSON，复制全部内容。
 *   3. 将内容粘贴在下方 PRELOADED_BOARD_DATA 的两个反引号 `` 之间。
 *   4. 如果这里保持为空 (``)，系统将加载下方的初始 Demo 演示数据。
 *   5. 用户在网页端手动导入(IMPORT)的 JSON 优先级高于此处的代码预设。
 * 
 * @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
export const PRELOADED_BOARD_DATA: string = ``; 


export const RELATIONSHIP_TYPES: RelationshipTypeConfig[] = [
  { id: 'love', label: '情感', color: '#ff4d4d' },
  { id: 'friendship', label: '友情', color: '#ffffff' },
  { id: 'rivalry', label: '宿敌', color: '#ffaa00' },
  { id: 'childhood', label: '童年', color: '#4da3ff' },
  { id: 'colleague', label: '业务', color: '#00ffaa' },
];

export const DEFAULT_LAYOUT: LayoutConfig = {
  imageSize: { width: 204, height: 255 },
  nameFontSize: 48,
  roleFontSize: 12,
  descFontSize: 14,
  spacing: 24,
  leftOffset: 24,
  cardScale: 1.0,
};

export const INITIAL_CHARACTERS: Character[] = [
  {
    id: 'c1',
    name: '金发女生',
    nameEn: 'BLONDE SINGER',
    role: '酒吧镇店主唱',
    affiliation: 'CHIRAKA Bar',
    description: '酒吧的灵魂。小时候救过金发男生，自己不以为意，却是男孩眼里的唯一。性格疏懒，习惯懒得搭理。',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    gallery: [],
    position: { x: 500, y: 150 }
  },
  {
    id: 'c2',
    name: '金发男生',
    nameEn: 'MAFIA HEIR',
    role: '黑道势力少爷',
    affiliation: 'Underworld',
    description: '铁血明恋。远远围着女生的世界，闷声干事，她是唯一的软肋。红发男生的老相识。',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600',
    gallery: [],
    position: { x: 200, y: 150 }
  },
  {
    id: 'c6',
    name: '红发男生',
    nameEn: 'MASTER FRAUD',
    role: '天下欺诈师',
    affiliation: 'Unknown',
    description: '金发男生的挚友。小时候与银发女生短暂相处过，记得对方。行骗天下，常在任务中遇见。',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    gallery: [],
    position: { x: 200, y: 450 }
  }
];

export const INITIAL_RELATIONSHIPS: Relationship[] = [
  { id: 'r1', fromId: 'c2', toId: 'c1', label: '铁血明恋', description: '虽然你救了我，但我只想默默守着你。', typeId: 'love' },
  { id: 'r3', fromId: 'c2', toId: 'c6', label: '打骂挚友', description: '有过不少合作的老相识。', typeId: 'friendship', isBiDirectional: true },
];
