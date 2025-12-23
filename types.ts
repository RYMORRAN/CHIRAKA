
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Character {
  id: string;
  name: string;
  nameEn?: string;
  role: string;
  description: string;
  imageUrl: string;
  gallery: string[]; // URLs or base64 strings
  position: Position;
  affiliation: string;
  groupId?: string; // 新增：所属组别ID
}

export interface RelationshipTypeConfig {
  id: string;
  label: string;
  color: string;
}

export interface Relationship {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  description: string;
  typeId: string;
  isBiDirectional?: boolean;
  isDashed?: boolean;
  curvature?: number;
}

export interface LayoutConfig {
  imageSize: Size;
  nameFontSize: number;
  roleFontSize: number;
  descFontSize: number;
  spacing: number;
  leftOffset: number;
  cardScale: number;
}

export interface BoardData {
  characters: Character[];
  relationships: Relationship[];
  relTypes: RelationshipTypeConfig[];
  layoutConfig: LayoutConfig;
  titleWhite: string;
  titleYellow: string;
  sidebarWidth: number;
  isGlobalBlackAndWhite: boolean;
  backgroundStyle?: string;
  cardStyle?: string;
  cursorStyle?: string;
  titleStyle?: string;
}
