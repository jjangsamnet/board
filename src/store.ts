import { useState, useCallback, useEffect } from 'react';
import type { Board, Post, PostType, ReactionType } from './types';
import { CARD_COLORS, REACTION_TYPES } from './types';
import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

const BOARDS_COLLECTION = 'boards';

// Convert Board to Firestore-safe format (no Date objects)
function boardToFirestore(board: Board) {
  return {
    ...board,
    createdAt: board.createdAt.toISOString(),
    posts: board.posts.map(p => ({
      ...p,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      comments: p.comments.map(c => ({
        ...c,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      })),
    })),
  };
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

  const createBoard = useCallback((title: string, description: string) => {
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
    };
    setDoc(doc(db, BOARDS_COLLECTION, id), boardToFirestore(newBoard));
    return id;
  }, []);

  const deleteBoard = useCallback((boardId: string) => {
    deleteDoc(doc(db, BOARDS_COLLECTION, boardId));
  }, []);

  return { boards, loading, createBoard, deleteBoard };
}

// Single board operations hook (for board page)
export function useBoard(boardId: string) {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser] = useState('나');

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
  const saveBoard = useCallback((updatedBoard: Board) => {
    setDoc(doc(db, BOARDS_COLLECTION, boardId), boardToFirestore(updatedBoard));
  }, [boardId]);

  const addPost = useCallback((type: PostType, title: string, content: string, extras?: { imageUrl?: string; linkUrl?: string; videoUrl?: string }) => {
    if (!board) return;
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

  const updateBoard = useCallback((updates: Partial<Board>) => {
    if (!board) return;
    const updated = { ...board, ...updates };
    saveBoard(updated);
  }, [board, saveBoard]);

  return { board, loading, addPost, deletePost, toggleReaction, addComment, updateBoard };
}
