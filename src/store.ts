import { useState, useCallback } from 'react';
import { Board, Post, PostType, CARD_COLORS, REACTION_TYPES, ReactionType } from './types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

const SAMPLE_POSTS: Post[] = [
  {
    id: generateId(),
    type: 'text',
    title: '환영합니다!',
    content: '공유 보드에 오신 것을 환영합니다. 자유롭게 포스트를 작성해보세요.',
    author: '선생님',
    color: CARD_COLORS[0],
    reactions: REACTION_TYPES.map(type => ({ type, count: type === '👍' ? 3 : type === '❤️' ? 2 : 0, userReacted: false })),
    comments: [{ id: generateId(), author: '학생1', content: '안녕하세요!', createdAt: new Date() }],
    createdAt: new Date(),
  },
  {
    id: generateId(),
    type: 'image',
    title: '오늘의 학습 주제',
    content: '태양계의 행성들에 대해 알아봅시다.',
    imageUrl: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=300&fit=crop',
    author: '선생님',
    color: CARD_COLORS[1],
    reactions: REACTION_TYPES.map(type => ({ type, count: type === '⭐' ? 5 : 0, userReacted: false })),
    comments: [],
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: generateId(),
    type: 'link',
    title: '참고 자료',
    content: '태양계에 대한 재미있는 영상입니다.',
    linkUrl: 'https://www.youtube.com/watch?v=libKVRa01L8',
    author: '학생2',
    color: CARD_COLORS[2],
    reactions: REACTION_TYPES.map(type => ({ type, count: 0, userReacted: false })),
    comments: [],
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: generateId(),
    type: 'text',
    title: '수성은 가장 작은 행성',
    content: '수성은 태양계에서 가장 작은 행성이며, 태양에 가장 가까운 행성입니다. 표면 온도는 낮에 430°C까지 올라갑니다.',
    author: '학생3',
    color: CARD_COLORS[3],
    reactions: REACTION_TYPES.map(type => ({ type, count: type === '😄' ? 1 : 0, userReacted: false })),
    comments: [{ id: generateId(), author: '선생님', content: '잘 조사했어요!', createdAt: new Date() }],
    createdAt: new Date(Date.now() - 5400000),
  },
  {
    id: generateId(),
    type: 'text',
    title: '지구 - 우리의 행성',
    content: '지구는 태양계에서 유일하게 생명체가 살고 있는 것으로 알려진 행성입니다. 달이라는 하나의 위성을 가지고 있습니다.',
    author: '학생1',
    color: CARD_COLORS[4],
    reactions: REACTION_TYPES.map(type => ({ type, count: type === '👍' ? 4 : type === '❤️' ? 6 : 0, userReacted: false })),
    comments: [],
    createdAt: new Date(Date.now() - 1800000),
  },
];

const DEFAULT_BOARD: Board = {
  id: generateId(),
  title: '🪐 태양계 탐구 보드',
  description: '태양계의 행성들에 대해 함께 알아봅시다!',
  layout: 'wall',
  wallpaper: 'bg-gray-50',
  posts: SAMPLE_POSTS,
  settings: {
    allowComments: true,
    allowReactions: true,
    allowAnonymous: false,
  },
  createdAt: new Date(),
};

export function useBoard() {
  const [board, setBoard] = useState<Board>(DEFAULT_BOARD);
  const [currentUser] = useState('나');

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
    setBoard(prev => ({ ...prev, posts: [newPost, ...prev.posts] }));
  }, [currentUser]);

  const deletePost = useCallback((postId: string) => {
    setBoard(prev => ({ ...prev, posts: prev.posts.filter(p => p.id !== postId) }));
  }, []);

  const toggleReaction = useCallback((postId: string, reactionType: ReactionType) => {
    setBoard(prev => ({
      ...prev,
      posts: prev.posts.map(post => {
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
  }, []);

  const addComment = useCallback((postId: string, content: string) => {
    const newComment = {
      id: generateId(),
      author: currentUser,
      content,
      createdAt: new Date(),
    };
    setBoard(prev => ({
      ...prev,
      posts: prev.posts.map(post => {
        if (post.id !== postId) return post;
        return { ...post, comments: [...post.comments, newComment] };
      }),
    }));
  }, [currentUser]);

  const updateBoard = useCallback((updates: Partial<Board>) => {
    setBoard(prev => ({ ...prev, ...updates }));
  }, []);

  return { board, addPost, deletePost, toggleReaction, addComment, updateBoard };
}
