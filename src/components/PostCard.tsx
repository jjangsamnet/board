import { useState } from 'react';
import type { Post, ReactionType } from '../types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Trash2, Send, ExternalLink, Play } from 'lucide-react';

interface PostCardProps {
  post: Post;
  onReaction: (postId: string, type: ReactionType) => void;
  onComment: (postId: string, content: string) => void;
  onDelete: (postId: string) => void;
  onClick?: () => void;
  compact?: boolean;
  allowComments?: boolean;
  allowReactions?: boolean;
  canManagePosts?: boolean;
  currentUser?: string;
}

export function PostCard({ post, onReaction, onComment, onDelete, onClick, compact, allowComments = true, allowReactions = true, canManagePosts, currentUser }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleComment = () => {
    if (!commentText.trim()) return;
    onComment(post.id, commentText.trim());
    setCommentText('');
  };

  const timeAgo = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const rotation = post.imageRotation || 0;
  const canDelete = canManagePosts || (currentUser && post.author === currentUser);

  return (
    <Card
      className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg border-0 cursor-pointer"
      style={{ backgroundColor: post.color }}
      onClick={(e) => {
        // Don't trigger if clicking interactive elements
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('a')) return;
        onClick?.();
      }}
    >
      {/* Delete button - only for managers or post author */}
      {canDelete && <button
        onClick={(e) => {
          e.stopPropagation();
          if (showConfirmDelete) {
            onDelete(post.id);
          } else {
            setShowConfirmDelete(true);
            setTimeout(() => setShowConfirmDelete(false), 3000);
          }
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-black/10 z-10"
        title={showConfirmDelete ? '한번 더 클릭하면 삭제됩니다' : '삭제'}
      >
        <Trash2 size={14} className={showConfirmDelete ? 'text-red-600' : 'text-gray-500'} />
      </button>}

      <CardHeader className="pb-1 pt-3 px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center text-xs font-medium shrink-0">
            {post.author.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-600 truncate">{post.author} · {timeAgo(post.createdAt)}</p>
            {post.title && (
              <h3 className="font-semibold text-sm text-gray-900 leading-tight truncate">{post.title}</h3>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-2">
        {/* Image */}
        {post.type === 'image' && post.imageUrl && (
          <div className="mb-2 -mx-4 -mt-1 overflow-hidden">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-40 object-cover transition-transform duration-300"
              style={{ transform: rotation ? `rotate(${rotation}deg) scale(${rotation % 180 !== 0 ? 1.2 : 1})` : undefined }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTRhM2I4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+7J2066+47KeA66W8IOu2iOufrOyYrCDsiJgg7JeG7Iq164uI64ukPC90ZXh0Pjwvc3ZnPg==';
              }}
            />
          </div>
        )}

        {/* Video */}
        {post.type === 'video' && post.videoUrl && (
          <div className="mb-2 -mx-4 -mt-1 bg-black/10 h-36 flex items-center justify-center">
            <Play size={32} className="text-gray-500" />
          </div>
        )}

        {/* Link preview */}
        {post.type === 'link' && post.linkUrl && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 flex items-center gap-2 p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors text-xs text-blue-700 no-underline"
          >
            <ExternalLink size={14} className="shrink-0" />
            <span className="truncate">{post.linkUrl}</span>
          </a>
        )}

        {/* Content text */}
        {post.content && (
          <p className={`text-sm text-gray-700 leading-relaxed ${compact ? 'line-clamp-3' : 'line-clamp-6'}`}>
            {post.content}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 px-4 pb-3 pt-0">
        {/* Reactions & Comments toggle */}
        <div className="flex items-center gap-1 w-full flex-wrap">
          {allowReactions ? (
            post.reactions.map(reaction => (
              <button
                key={reaction.type}
                onClick={(e) => {
                  e.stopPropagation();
                  onReaction(post.id, reaction.type);
                }}
                className={`
                  inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs transition-all
                  ${reaction.userReacted
                    ? 'bg-white/80 shadow-sm ring-1 ring-black/10'
                    : 'bg-white/40 hover:bg-white/60'
                  }
                `}
              >
                <span>{reaction.type}</span>
                {reaction.count > 0 && <span className="text-gray-600">{reaction.count}</span>}
              </button>
            ))
          ) : (
            <span className="text-[10px] text-gray-400 italic">반응이 비활성화되었습니다</span>
          )}
          {allowComments && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/40 hover:bg-white/60 ml-auto"
            >
              <MessageCircle size={12} />
              {post.comments.length > 0 && <span>{post.comments.length}</span>}
            </button>
          )}
        </div>

        {/* Comments section */}
        {allowComments && showComments && (
          <div className="w-full space-y-2 pt-1 border-t border-black/5" onClick={e => e.stopPropagation()}>
            {post.comments.map(comment => (
              <div key={comment.id} className="text-xs bg-white/50 rounded-lg p-2">
                <span className="font-medium">{comment.author}</span>
                <span className="text-gray-500 ml-1">· {timeAgo(comment.createdAt)}</span>
                <p className="mt-0.5 text-gray-700">{comment.content}</p>
              </div>
            ))}
            <div className="flex gap-1.5">
              <Input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                placeholder="댓글을 입력하세요..."
                className="text-xs h-8 bg-white/50 border-0"
              />
              <Button size="sm" variant="ghost" onClick={handleComment} className="h-8 w-8 p-0 shrink-0">
                <Send size={14} />
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
