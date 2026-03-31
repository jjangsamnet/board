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
  getDocs,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

const BOARDS_COLLECTION = 'boards';
const POSTS_SUBCOLLECTION = 'posts';
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

// ============ Firestore Converters ============

// Convert Board metadata to Firestore-safe format (posts are now in subcollection)
function boardMetaToFirestore(board: Board) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { posts, ...meta } = board;
  return removeUndefined({
    ...meta,
    createdAt: board.createdAt instanceof Date ? board.createdAt.toISOString() : board.createdAt,
    postCount: posts ? posts.length : 0,
  });
}

// Convert a single Post to Firestore-safe format
function postToFirestore(post: Post): Record<string, unknown> {
  return removeUndefined({
    ...post,
    createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
    comments: (post.comments || []).map(c => removeUndefined({
      ...c,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    })),
  }) as Record<string, unknown>;
}

// Convert Firestore data back to Board metadata
function firestoreToBoardMeta(data: Record<string, unknown>): Board {
  return {
    ...(data as unknown as Board),
    createdAt: new Date(data.createdAt as string),
    posts: [], // posts are loaded separately from subcollection
  };
}

// Convert Firestore data back to Post
function firestoreToPost(data: Record<string, unknown>): Post {
  return {
    ...(data as unknown as Post),
    createdAt: new Date(data.createdAt as string),
    comments: ((data.comments as Record<string, unknown>[]) || []).map(c => ({
      ...(c as unknown as Post['comments'][0]),
      createdAt: new Date(c.createdAt as string),
    })),
  };
}

// ============ Legacy Migration ============

// Migrate posts from embedded array to subcollection (one-time per board)
async function migrateBoardPostsIfNeeded(boardId: string, boardData: Record<string, unknown>) {
  const embeddedPosts = boardData.posts as Record<string, unknown>[] | undefined;
  if (!embeddedPosts || embeddedPosts.length === 0) return;

  // Check if subcollection already has posts (already migrated)
  const postsRef = collection(db, BOARDS_COLLECTION, boardId, POSTS_SUBCOLLECTION);
  const existingSnap = await getDocs(postsRef);
  if (!existingSnap.empty) {
    // Subcollection already populated; clean up embedded array
    const boardRef = doc(db, BOARDS_COLLECTION, boardId);
    const cleaned = { ...boardData };
    delete cleaned.posts;
    cleaned.postCount = existingSnap.size;
    await setDoc(boardRef, removeUndefined(cleaned as Record<string, unknown>));
    return;
  }

  console.log(`[migration] 보드 ${boardId}: ${embeddedPosts.length}개 포스트를 서브컬렉션으로 이전 중...`);

  // Batch write all posts to subcollection
  const batch = writeBatch(db);
  for (const p of embeddedPosts) {
    const postId = (p.id as string) || generateId();
    const postRef = doc(db, BOARDS_COLLECTION, boardId, POSTS_SUBCOLLECTION, postId);
    batch.set(postRef, removeUndefined(p as Record<string, unknown>));
  }

  // Remove posts array from board document and set postCount
  const boardRef = doc(db, BOARDS_COLLECTION, boardId);
  const cleanedBoard = { ...boardData };
  delete cleanedBoard.posts;
  cleanedBoard.postCount = embeddedPosts.length;
  batch.set(boardRef, removeUndefined(cleanedBoard as Record<string, unknown>));

  await batch.commit();
  console.log(`[migration] 보드 ${boardId}: 이전 완료`);
}

// ============ Multi-board Management (Dashboard) ============

export function useBoardManager() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, BOARDS_COLLECTION), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const boardList: Board[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const board = firestoreToBoardMeta(data as Record<string, unknown>);
        // Use postCount from metadata for dashboard display
        (board as Board & { postCount?: number }).postCount = (data.postCount as number) || 0;
        boardList.push(board);
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
      await setDoc(doc(db, BOARDS_COLLECTION, id), boardMetaToFirestore(newBoard));
      console.log('[createBoard] 보드 생성 성공:', id);
    } catch (error) {
      console.error('[createBoard] 보드 생성 실패:', error);
    }
    return id;
  }, []);

  const deleteBoard = useCallback(async (boardId: string) => {
    try {
      // Delete all posts in subcollection first
      const postsRef = collection(db, BOARDS_COLLECTION, boardId, POSTS_SUBCOLLECTION);
      const postsSnap = await getDocs(postsRef);
      const batch = writeBatch(db);
      postsSnap.forEach((postDoc) => {
        batch.delete(postDoc.ref);
      });
      // Delete the board document itself
      batch.delete(doc(db, BOARDS_COLLECTION, boardId));
      await batch.commit();
      console.log('[deleteBoard] 보드 삭제 성공:', boardId);
    } catch (error) {
      console.error('[deleteBoard] 보드 삭제 실패:', error);
      // Fallback: at least delete the board doc
      await deleteDoc(doc(db, BOARDS_COLLECTION, boardId));
    }
  }, []);

  return { boards, loading, createBoard, deleteBoard };
}

// ============ Single Board Operations (Board Page) ============

export function useBoard(boardId: string, currentUser: string = '익명') {
  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener for board metadata
  useEffect(() => {
    const unsub = onSnapshot(doc(db, BOARDS_COLLECTION, boardId), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Auto-migrate embedded posts to subcollection
        if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
          try {
            await migrateBoardPostsIfNeeded(boardId, data as Record<string, unknown>);
          } catch (err) {
            console.error('[migration] 이전 실패:', err);
          }
        }

        const boardMeta = firestoreToBoardMeta(data as Record<string, unknown>);
        setBoard(prev => {
          // Keep existing posts while updating board meta
          const currentPosts = prev?.posts || [];
          return { ...boardMeta, posts: currentPosts };
        });
      } else {
        setBoard(null);
      }
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return () => unsub();
  }, [boardId]);

  // Real-time listener for posts subcollection
  useEffect(() => {
    const postsRef = collection(db, BOARDS_COLLECTION, boardId, POSTS_SUBCOLLECTION);
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const postList: Post[] = [];
      snapshot.forEach((docSnap) => {
        postList.push(firestoreToPost(docSnap.data() as Record<string, unknown>));
      });
      setPosts(postList);
      // Also update the board.posts reference
      setBoard(prev => prev ? { ...prev, posts: postList } : null);
    }, (error) => {
      console.error('[useBoard] 포스트 리스너 에러:', error);
    });
    return () => unsub();
  }, [boardId]);

  // Save board metadata only (not posts)
  const saveBoardMeta = useCallback(async (updatedBoard: Board) => {
    try {
      const data = boardMetaToFirestore(updatedBoard);
      await setDoc(doc(db, BOARDS_COLLECTION, boardId), data);
      console.log('[saveBoardMeta] 보드 메타 저장 성공');
    } catch (error) {
      console.error('[saveBoardMeta] 저장 실패:', error);
    }
  }, [boardId]);

  // Save a single post to subcollection
  const savePost = useCallback(async (post: Post) => {
    try {
      const postRef = doc(db, BOARDS_COLLECTION, boardId, POSTS_SUBCOLLECTION, post.id);
      await setDoc(postRef, postToFirestore(post));
    } catch (error) {
      console.error('[savePost] 포스트 저장 실패:', error);
    }
  }, [boardId]);

  // Update postCount in board metadata
  const updatePostCount = useCallback(async (delta: number) => {
    try {
      const boardRef = doc(db, BOARDS_COLLECTION, boardId);
      const boardSnap = await getDoc(boardRef);
      if (boardSnap.exists()) {
        const data = boardSnap.data();
        const currentCount = (data.postCount as number) || 0;
        await setDoc(boardRef, { ...data, postCount: Math.max(0, currentCount + delta) });
      }
    } catch (error) {
      console.error('[updatePostCount] 실패:', error);
    }
  }, [boardId]);

  const addPost = useCallback(async (type: PostType, title: string, content: string, extras?: { imageUrl?: string; linkUrl?: string; videoUrl?: string; audioUrl?: string; fileUrl?: string; fileName?: string; fileSize?: number; fileType?: string }) => {
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
    console.log('[addPost] 새 포스트:', newPost.id);
    await savePost(newPost);
    await updatePostCount(1);
  }, [board, currentUser, savePost, updatePostCount]);

  const deletePost = useCallback(async (postId: string) => {
    if (!board) return;
    try {
      const postRef = doc(db, BOARDS_COLLECTION, boardId, POSTS_SUBCOLLECTION, postId);
      await deleteDoc(postRef);
      await updatePostCount(-1);
      console.log('[deletePost] 포스트 삭제 성공:', postId);
    } catch (error) {
      console.error('[deletePost] 포스트 삭제 실패:', error);
    }
  }, [board, boardId, updatePostCount]);

  const toggleReaction = useCallback(async (postId: string, reactionType: ReactionType) => {
    // Find current post from local state
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const updatedPost = {
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
    await savePost(updatedPost);
  }, [posts, savePost]);

  const addComment = useCallback(async (postId: string, content: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newComment = {
      id: generateId(),
      author: currentUser,
      content,
      createdAt: new Date(),
    };
    const updatedPost = { ...post, comments: [...post.comments, newComment] };
    await savePost(updatedPost);
  }, [posts, currentUser, savePost]);

  const updatePost = useCallback(async (postId: string, updates: Partial<Post>) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const updatedPost = { ...post, ...updates };
    await savePost(updatedPost);
  }, [posts, savePost]);

  const updateBoard = useCallback((updates: Partial<Board>) => {
    if (!board) return;
    const updated = { ...board, ...updates };
    saveBoardMeta(updated);
  }, [board, saveBoardMeta]);

  return { board, loading, addPost, deletePost, toggleReaction, addComment, updatePost, updateBoard };
}

// ============ User Profile Management ============

export async function ensureUserProfile(uid: string, email: string, displayName: string, photoURL?: string): Promise<UserProfile> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  const now = new Date().toISOString();

  if (userSnap.exists()) {
    const existing = userSnap.data() as UserProfile;
    const updated = { ...existing, displayName, photoURL: photoURL || '', lastLoginAt: now };
    await setDoc(userRef, removeUndefined(updated));
    return updated;
  } else {
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

export async function updateUserMaxBoards(uid: string, maxBoards: number) {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    await setDoc(userRef, { ...userSnap.data(), maxBoards });
  }
}

export async function updateUserRole(uid: string, role: 'admin' | 'user') {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const maxBoards = role === 'admin' ? UPGRADED_MAX_BOARDS : (userSnap.data() as UserProfile).maxBoards;
    await setDoc(userRef, { ...userSnap.data(), role, maxBoards });
  }
}

export { ADMIN_EMAIL, DEFAULT_MAX_BOARDS, UPGRADED_MAX_BOARDS };
