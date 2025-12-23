
import { Character, Relationship, RelationshipTypeConfig, LayoutConfig } from './types';

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
    id: 'c3',
    name: '紫发男生',
    nameEn: 'CHAMBER SON',
    role: '商会少爷',
    affiliation: 'Chamber',
    description: '商会当家少爷。与金发男生分属不同势力。与橙发男孩、黑发女孩在地下车场相识。',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    gallery: [],
    position: { x: 800, y: 150 }
  },
  {
    id: 'c4',
    name: '橙发男孩',
    nameEn: 'STREET RACER',
    role: '地下车手',
    affiliation: 'Street',
    description: '在街头长大，话多，巴拉巴拉说个没完。与黑发女孩是半路幼驯染。相识于地下车场。',
    imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600',
    gallery: [],
    position: { x: 800, y: 450 }
  },
  {
    id: 'c5',
    name: '黑发女孩',
    nameEn: 'DRIFT MASTER',
    role: '地下车手',
    affiliation: 'Street',
    description: '在街头长大，沉默寡言。与橙发男孩是半路幼驯染。',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
    gallery: [],
    position: { x: 1050, y: 450 }
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
  },
  {
    id: 'c7',
    name: '银发女生',
    nameEn: 'ELITE HITMAN',
    role: '专业打手',
    affiliation: 'Syndicate',
    description: '天降幼驯染。孤儿血腥巷弄成长史，被大佬带走。不记得红发，但在任务中结缘。',
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=600',
    gallery: [],
    position: { x: 500, y: 450 }
  }
];

export const INITIAL_RELATIONSHIPS: Relationship[] = [
  { id: 'r1', fromId: 'c2', toId: 'c1', label: '铁血明恋', description: '虽然你救了我，但我只想默默守着你。', typeId: 'love' },
  { id: 'r2', fromId: 'c4', toId: 'c5', label: '半路幼驯染', description: '街头长大的死党，默契十足。', typeId: 'childhood', isBiDirectional: true },
  { id: 'r3', fromId: 'c2', toId: 'c6', label: '打骂挚友', description: '有过不少合作的老相识。', typeId: 'friendship', isBiDirectional: true },
  { id: 'r4', fromId: 'c6', toId: 'c7', label: '天降幼驯染', description: '男生记得女生，在任务中结缘，主力输出。', typeId: 'childhood' },
  { id: 'r5', fromId: 'c3', toId: 'c4', label: '地下车场相识', description: '速度与激情的起点。', typeId: 'colleague' },
];
