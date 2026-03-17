export type PostType = 'text' | 'image' | 'link' | 'video';
export type LayoutMode = 'wall' | 'grid' | 'stream';
export type ReactionType = '👍' | '❤️' | '⭐' | '😄';

export interface Reaction {
  type: ReactionType;
  count: number;
  userReacted: boolean;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  type: PostType;
  title: string;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  videoUrl?: string;
  imageRotation?: number;
  author: string;
  color: string;
  reactions: Reaction[];
  comments: Comment[];
  createdAt: Date;
  x?: number;
  y?: number;
}

export interface BoardSettings {
  allowComments: boolean;
  allowReactions: boolean;
  allowAnonymous: boolean;
}

export interface Board {
  id: string;
  title: string;
  description: string;
  layout: LayoutMode;
  wallpaper: string;
  posts: Post[];
  settings: BoardSettings;
  createdAt: Date;
  ownerEmail?: string;
}

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  maxBoards: number;
  createdAt: string;
  lastLoginAt: string;
}

export const CARD_COLORS = [
  '#FEF3C7', // amber-100
  '#DBEAFE', // blue-100
  '#D1FAE5', // emerald-100
  '#FCE7F3', // pink-100
  '#EDE9FE', // violet-100
  '#FEE2E2', // red-100
  '#E0E7FF', // indigo-100
  '#CCFBF1', // teal-100
  '#FEF9C3', // yellow-100
  '#F3E8FF', // purple-100
];

export const WALLPAPERS = [
  { name: '화이트보드', value: 'bg-gray-50' },
  { name: '코르크보드', value: 'bg-amber-100' },
  { name: '칠판', value: 'bg-emerald-900' },
  { name: '밤하늘', value: 'bg-slate-900' },
  { name: '하늘', value: 'bg-sky-200' },
  { name: '숲', value: 'bg-green-800' },
];

export const REACTION_TYPES: ReactionType[] = ['👍', '❤️', '⭐', '😄'];
