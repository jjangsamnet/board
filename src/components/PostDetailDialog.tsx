import { useState } from 'react';
import type { Post, ReactionType } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  RotateCw,
  Trash2,
  MessageCircle,
  Send,
  ExternalLink,
  Play,
  Download,
} from 'lucide-react';
import { getFileIcon, getFileTypeLabel, formatFileSize } from '../uploadImage';

interface PostDetailDialogProps {
  post: Post;
  open: boolean;
  onClose: () => void;
  onReaction: (postId: string, type: ReactionType) => void;
  onComment: (postId: string, content: string) => void;
  onDelete?: (postId: string) => void;
  onRotateImage?: (postId: string, rotation: number) => void;
  currentUser?: string;
  canManagePosts?: boolean;
  allowComments?: boolean;
  allowReactions?: boolean;
}

export function PostDetailDialog({
  post,
  open,
  onClose,
  onReaction,
  onComment,
  onDelete,
  onRotateImage,
  currentUser,
  canManagePosts = false,
  allowComments = true,
  allowReactions = true,
}: PostDetailDialogProps) {
  const [commentText, setCommentText] = useState('');

  if (!open) return null;

  const handleComment = () => {
    if (!commentText.trim()) return;
    onComment(post.id, commentText.trim());
    setCommentText('');
  };

  const canRotate = canManagePosts || (currentUser && post.author === currentUser);
  const canDelete = canManagePosts || (currentUser && post.author === currentUser);
  const rotation = post.imageRotation || 0;
  const hasImage = post.type === 'image' && post.imageUrl;
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleRotate = () => {
    if (onRotateImage) {
      const newRotation = (rotation + 90) % 360;
      onRotateImage(post.id, newRotation);
    }
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

  // Right panel: author info, content, reactions, comments
  const contentPanel = (
    <div className="flex flex-col h-full">
      {/* Author header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-sm font-semibold">
            {post.author.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{post.author}</p>
            <p className="text-xs text-gray-500">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Delete button */}
          {canDelete && onDelete && (
            <button
              onClick={() => {
                if (showConfirmDelete) {
                  onDelete(post.id);
                  onClose();
                } else {
                  setShowConfirmDelete(true);
                  setTimeout(() => setShowConfirmDelete(false), 3000);
                }
              }}
              className="p-2 rounded-full hover:bg-black/10 transition-colors"
              title={showConfirmDelete ? '한번 더 클릭하면 삭제됩니다' : '포스트 삭제'}
            >
              <Trash2 size={18} className={showConfirmDelete ? 'text-red-600' : 'text-gray-400'} />
            </button>
          )}
          {/* Close button */}
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-black/10 transition-colors ${hasImage ? 'lg:hidden' : ''}`}
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Title */}
        {post.title && (
          <h2 className="text-xl font-bold text-gray-900">{post.title}</h2>
        )}

        {/* Image - mobile only for image posts (desktop shows in left panel) */}
        {hasImage && (
          <div className="lg:hidden relative group/img">
            <div className="rounded-xl overflow-hidden bg-white/30">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full max-h-[40vh] object-contain transition-transform duration-300"
                style={{ transform: `rotate(${rotation}deg)` }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTRhM2I4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+7J2066+47KeA66W8IOu2iOufrOyYrCDsiJgg7JeG7Iq164uI64ukPC90ZXh0Pjwvc3ZnPg==';
                }}
              />
            </div>
            {canRotate && (
              <button
                onClick={handleRotate}
                className="absolute bottom-3 right-3 p-2.5 rounded-full bg-white/90 shadow-lg hover:bg-white transition-colors opacity-0 group-hover/img:opacity-100"
                title="이미지 회전 (90°)"
              >
                <RotateCw size={18} className="text-gray-700" />
              </button>
            )}
          </div>
        )}

        {/* Video */}
        {post.type === 'video' && post.videoUrl && (
          <div className="rounded-xl bg-black/10 h-64 flex items-center justify-center">
            <Play size={48} className="text-gray-500" />
          </div>
        )}

        {/* File attachment */}
        {post.type === 'file' && post.fileUrl && post.fileName && (
          <a
            href={post.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={post.fileName}
            className="flex items-center gap-4 p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-colors no-underline"
          >
            <span className="text-4xl shrink-0">{getFileIcon(post.fileName)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">{post.fileName}</p>
              <p className="text-xs text-gray-500">
                {getFileTypeLabel(post.fileName)}
                {post.fileSize ? ` · ${formatFileSize(post.fileSize)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium shrink-0">
              <Download size={14} />
              다운로드
            </div>
          </a>
        )}

        {/* Link */}
        {post.type === 'link' && post.linkUrl && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-colors text-sm text-blue-700 no-underline"
          >
            <ExternalLink size={18} className="shrink-0" />
            <span className="truncate">{post.linkUrl}</span>
          </a>
        )}

        {/* Content */}
        {post.content && (
          <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        )}

        {/* Reactions */}
        <div className="flex items-center gap-2 flex-wrap">
          {allowReactions ? (
            post.reactions.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => onReaction(post.id, reaction.type)}
                className={`
                  inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all
                  ${
                    reaction.userReacted
                      ? 'bg-white/80 shadow-sm ring-1 ring-black/10'
                      : 'bg-white/40 hover:bg-white/60'
                  }
                `}
              >
                <span>{reaction.type}</span>
                {reaction.count > 0 && (
                  <span className="text-gray-600">{reaction.count}</span>
                )}
              </button>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">
              반응이 비활성화되었습니다
            </span>
          )}
        </div>

        {/* Comments */}
        {allowComments && (
          <div className="border-t border-black/10 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                댓글 {post.comments.length > 0 ? `(${post.comments.length})` : ''}
              </span>
            </div>
            <div className="space-y-2 mb-3">
              {post.comments.map((comment) => (
                <div key={comment.id} className="text-sm bg-white/50 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{comment.author}</span>
                    <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-gray-700">{comment.content}</p>
                </div>
              ))}
              {post.comments.length === 0 && (
                <p className="text-xs text-gray-400 italic">아직 댓글이 없습니다</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comment input - pinned at bottom */}
      {allowComments && (
        <div className="shrink-0 px-5 pb-4 pt-2 border-t border-black/5">
          <div className="flex gap-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              placeholder="댓글을 입력하세요..."
              className="text-sm h-10 bg-white/50 border-0 rounded-xl"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleComment}
              className="h-10 w-10 p-0 shrink-0 rounded-xl"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // Full-screen overlay
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {hasImage ? (
        /* ===== Image post: side-by-side on desktop, stacked on mobile ===== */
        <div
          className="relative w-full h-full lg:m-6 lg:h-auto lg:max-h-[94vh] lg:rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row"
          style={{ backgroundColor: post.color }}
        >
          {/* Close button - desktop (top-right over image) */}
          <button
            onClick={onClose}
            className="hidden lg:flex absolute top-3 right-3 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>

          {/* Left: Image panel (desktop only) - 80% */}
          <div className="hidden lg:flex lg:w-4/5 relative items-center justify-center bg-black/20 group/img min-h-0">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="max-w-full max-h-[94vh] object-contain transition-transform duration-300 p-4"
              style={{ transform: `rotate(${rotation}deg)` }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTRhM2I4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+7J2066+47KeA66W8IOu2iOufrOyYrCDsiJgg7JeG7Iq164uI64ukPC90ZXh0Pjwvc3ZnPg==';
              }}
            />
            {/* Rotate button */}
            {canRotate && (
              <button
                onClick={handleRotate}
                className="absolute bottom-4 right-4 p-3 rounded-full bg-white/90 shadow-lg hover:bg-white transition-all opacity-0 group-hover/img:opacity-100"
                title="이미지 회전 (90°)"
              >
                <RotateCw size={20} className="text-gray-700" />
              </button>
            )}
          </div>

          {/* Right: Content panel - 20% */}
          <div className="flex-1 lg:w-1/5 lg:min-w-[280px] flex flex-col min-h-0 overflow-hidden">
            {contentPanel}
          </div>
        </div>
      ) : (
        /* ===== Non-image post: centered wide card ===== */
        <div
          className="relative w-full h-full sm:m-6 sm:h-auto sm:max-h-[94vh] sm:max-w-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ backgroundColor: post.color }}
        >
          {contentPanel}
        </div>
      )}
    </div>
  );
}
