import { useState, useCallback, useEffect } from 'react';
import type { Board, Post, PostType, ReactionType } from './types';
import { CARD_COLORS, REACTION_TYPES } from './types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// localStorage helpers
function loadBoards(): Board[] {
  try {
    const raw = localStorage.getItem('shared-boards');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.map((b: Board) => ({
        ...b,
        createdAt: new Date(b.createdAt),
        posts: b.posts.map((p: Post) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          comments: p.comments.map(c => ({ ...c, createdAt: new Date(c.createdAt) })),
        })),
      }));
    }
  } catch { /* ignore */ }
  return [];
}

function saveBoards(boards: Board[]) {
  try {
    localStorage.setItem('shared-boards', JSON.stringify(boards));
  } catch { /* ignore */ }
}

// Multi-board management hook
export function useBoardManager() {
  const [boards, setBoards] = useState<Board[]>(() => loadBoards());

  useEffect(() => {
    saveBoards(boards);
  }, [boards]);

  const createBoard = useCallback((title: string, description: string) => {
    const newBoard: Board = {
      id: generateId(),
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
    setBoards(prev => [newBoard, ...prev]);
    return newBoard.id;
  }, []);

  const deleteBoard = useCallback((boardId: string) => {
    setBoards(prev => prev.filter(b => b.id !== boardId));
  }, []);

  return { boards, createBoard, deleteBoard };
}

// Single board operations hook
export function useBoard(boardId: string) {
  const [boards, setBoards] = useState<Board[]>(() => loadBoards());
  const [currentUser] = useState('나');
  const board = boards.find(b => b.id === boardId) || null;

  useEffect(() => {
    saveBoards(boards);
  }, [boards]);

  // Sync with localStorage changes from other components
  useEffect(() => {
    const handleStorage = () => {
      setBoards(loadBoards());
    };
    window.addEventListener('boards-updated', handleStorage);
    return () => window.removeEventListener('boards-updated', handleStorage);
  }, []);

  const updateBoardInList = useCallback((updater: (board: Board) => Board) => {
    setBoards(prev => {
      const updated = prev.map(b => b.id === boardId ? updater(b) : b);
      return updated;
    });
  }, [boardId]);

  const addPost = useCallback((type: PostType, title: string, content: string, extras?: { imageUrl?: string; linkUrl?: string; videoUrl?: string }) => {
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
    updateBoardInList(b => ({ ...b, posts: [newPost, ...b.posts] }));
  }, [currentUser, updateBoardInList]);

  const deletePost = useCallback((postId: string) => {
    updateBoardInList(b => ({ ...b, posts: b.posts.filter(p => p.id !== postId) }));
  }, [updateBoardInList]);

  const toggleReaction = useCallback((postId: string, reactionType: ReactionType) => {
    updateBoardInList(b => ({
      ...b,
      posts: b.posts.map(post => {
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
    }));
  }, [updateBoardInList]);

  const addComment = useCallback((postId: string, content: string) => {
    const newComment = {
      id: generateId(),
      author: currentUser,
      content,
      createdAt: new Date(),
    };
    updateBoardInList(b => ({
      ...b,
      posts: b.posts.map(post => {
        if (post.id !== postId) return post;
        return { ...post, comments: [...post.comments, newComment] };
      }),
    }));
  }, [currentUser, updateBoardInList]);

  const updateBoard = useCallback((updates: Partial<Board>) => {
    updateBoardInList(b => ({ ...b, ...updates }));
  }, [updateBoardInList]);

  return { board, addPost, deletePost, toggleReaction, addComment, updateBoard };
}
