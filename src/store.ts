import { useState, useCallback, useEffect } from 'react';
import type { Board, Post, PostType, ReactionType, UserProfile } from './types';
import { CARD_COLORS, REACTION_TYPES } from './types';
import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

const BOARDS_COLLECTION = 'boards';
const USERS_COLLECTION = 'users';
const ADMIN_EMAIL = 'kd12345@gmail.com';
const DEFAULT_MAX_BOARDS = 3;
const UPGRADED_MAX_BOARDS = 200;

// Remove undefined values (Firestore doesn't accept undefined)
function removeUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// Convert Board to Firestore-safe format (no Date objects, no undefined values)
function boardToFirestore(board: Board) {
  return removeUndefined({
    ...board,
    createdAt: board.createdAt.toISOString(),
    posts: board.posts.map(p => removeUndefined({
      ...p,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      comments: (p.comments || []).map(c => removeUndefined({
        ...c,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      })),
    })),
  });
}

// Convert Firestore data back to Board with Dates
function firestoreToBoard(data: Record<string, unknown>): Board {
  return {
    ...(data as unknown as Board),
    createdAt: new Date(data.createdAt as string),
    posts: ((data.posts as Record<string, unknown>[]) || []).map(p => ({
      ...(p as unknown as Post),
      createdAt: new Date(p.createdAt as string),
      comments: ((p.comments as Record<string, unknown>[]) || []).map(c => ({
        ...(c as unknown as Post['comments'][0]),
        createdAt: new Date(c.createdAt as string),
      })),
    })),
  };
}

// Multi-board management hook (for dashboard)
export function useBoardManager() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener for all boards
  useEffect(() => {
    const q = query(collection(db, BOARDS_COLLECTION), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const boardList: Board[] = [];
      snapshot.forEach((docSnap) => {
        boardList.push(firestoreToBoard(docSnap.data()));
      });
      setBoards(boardList);
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const createBoard = useCallback(async (title: string, description: string, ownerEmail?: string) => {
    const id = generateId();
    const newBoard: Board = {
      id,
      title,
      description,
      layout: 'wall',
      wallpaper: 'bg-gray-50',
      posts: [],
      settings: {
        allowComments: true,
        allowReactions: true,
        allowAnonymous: false,
      },
      createdAt: new Date(),
      ownerEmail,
    };
    try {
      await setDoc(doc(db, BOARDS_COLLECTION, id), boardToFirestore(newBoard));
      console.log('[createBoard] 보드 생성 성공:', id);
    } catch (error) {
      console.error('[createBoard] 보드 생성 실패:', error);
    }
    return id;
  }, []);

  const deleteBoard = useCallback((boardId: string) => {
    deleteDoc(doc(db, BOARDS_COLLECTION, boardId));
  }, []);

  return { boards, loading, createBoard, deleteBoard };
}

// Single board operations hook (for board page)
export function useBoard(boardId: string, currentUser: string = '익명') {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  // Real-time listener for single board
  useEffect(() => {
    const unsub = onSnapshot(doc(db, BOARDS_COLLECTION, boardId), (docSnap) => {
      if (docSnap.exists()) {
        setBoard(firestoreToBoard(docSnap.data()));
      } else {
        setBoard(null);
      }
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return () => unsub();
  }, [boardId]);

  // Save board to Firestore
  const saveBoard = useCallback(async (updatedBoard: Board) => {
    try {
      const data = boardToFirestore(updatedBoard);
      console.log('[saveBoard] 저장 시도:', boardId, '포스트 수:', (data.posts as unknown[])?.length);
      await setDoc(doc(db, BOARDS_COLLECTION, boardId), data);
      console.log('[saveBoard] 저장 성공');
    } catch (error) {
      console.error('[saveBoard] 저장 실패:', error);
    }
  }, [boardId]);

  const addPost = useCallback((type: PostType, title: string, content: string, extras?: { imageUrl?: string; linkUrl?: string; videoUrl?: string }) => {
    console.log('[addPost] 호출됨:', { type, title, content, hasBoard: !!board, currentUser });
    if (!board) {
      console.error('[addPost] board가 null입니다!');
      return;
    }
    const newPost: Post = {
      id: generateId(),
      type,
      title,
      content,
      ...extras,
      author: currentUser,
      color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)],
      reactions: REACTION_TYPES.map(t => ({ type: t, count: 0, userReacted: false })),
      comments: [],
      createdAt: new Date(),
    };
    console.log('[addPost] 새 포스트:', newPost);
    const updated = { ...board, posts: [newPost, ...board.posts] };
    saveBoard(updated);
  }, [board, currentUser, saveBoard]);

  const deletePost = useCallback((postId: string) => {
    if (!board) return;
    const updated = { ...board, posts: board.posts.filter(p => p.id !== postId) };
    saveBoard(updated);
  }, [board, saveBoard]);

  const toggleReaction = useCallback((postId: string, reactionType: ReactionType) => {
    if (!board) return;
    const updated = {
      ...board,
      posts: board.posts.map(post => {
        if (post.id !== postId) return post;
        return {
          ...post,
          reactions: post.reactions.map(r => {
            if (r.type !== reactionType) return r;
            return {
              ...r,
              count: r.userReacted ? r.count - 1 : r.count + 1,
              userReacted: !r.userReacted,
            };
          }),
        };
      }),
    };
    saveBoard(updated);
  }, [board, saveBoard]);

  const addComment = useCallback((postId: string, content: string) => {
    if (!board) return;
    const newComment = {
      id: generateId(),
      author: currentUser,
      content,
      createdAt: new Date(),
    };
    const updated = {
      ...board,
      posts: board.posts.map(post => {
        if (post.id !== postId) return post;
        return { ...post, comments: [...post.comments, newComment] };
      }),
    };
    saveBoard(updated);
  }, [board, currentUser, saveBoard]);

  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    if (!board) return;
    const updated = {
      ...board,
      posts: board.posts.map(post => {
        if (post.id !== postId) return post;
        return { ...post, ...updates };
      }),
    };
    saveBoard(updated);
  }, [board, saveBoard]);

  const updateBoard = useCallback((updates: Partial<Board>) => {
    if (!board) return;
    const updated = { ...board, ...updates };
    saveBoard(updated);
  }, [board, saveBoard]);

  return { board, loading, addPost, deletePost, toggleReaction, addComment, updatePost, updateBoard };
}

// ============ User Profile Management ============

// Ensure user profile exists in Firestore (called on login)
export async function ensureUserProfile(uid: string, email: string, displayName: string, photoURL?: string): Promise<UserProfile> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  const now = new Date().toISOString();

  if (userSnap.exists()) {
    // Update last login
    const existing = userSnap.data() as UserProfile;
    const updated = { ...existing, displayName, photoURL: photoURL || '', lastLoginAt: now };
    await setDoc(userRef, removeUndefined(updated));
    return updated;
  } else {
    // Create new profile
    const isAdmin = email === ADMIN_EMAIL;
    const newProfile: UserProfile = {
      uid,
      email,
      displayName,
      photoURL: photoURL || '',
      role: isAdmin ? 'admin' : 'user',
      maxBoards: isAdmin ? UPGRADED_MAX_BOARDS : DEFAULT_MAX_BOARDS,
      createdAt: now,
      lastLoginAt: now,
    };
    await setDoc(userRef, removeUndefined({ ...newProfile } as unknown as Record<string, unknown>));
    return newProfile;
  }
}

// Hook to listen to current user's profile
export function useUserProfile(uid: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, USERS_COLLECTION, uid), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [uid]);

  return { profile, loading };
}

// Hook to list all users (admin only)
export function useAllUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, USERS_COLLECTION), orderBy('lastLoginAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as UserProfile);
      });
      setUsers(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  return { users, loading };
}

// Admin action: grant or revoke board quota
export async function updateUserMaxBoards(uid: string, maxBoards: number) {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    await setDoc(userRef, { ...userSnap.data(), maxBoards });
  }
}

// Admin action: toggle user role
export async function updateUserRole(uid: string, role: 'admin' | 'user') {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const maxBoards = role === 'admin' ? UPGRADED_MAX_BOARDS : (userSnap.data() as UserProfile).maxBoards;
    await setDoc(userRef, { ...userSnap.data(), role, maxBoards });
  }
}

export { ADMIN_EMAIL, DEFAULT_MAX_BOARDS, UPGRADED_MAX_BOARDS };
