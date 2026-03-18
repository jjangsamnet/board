import { useState } from 'react';
import type { Post, LayoutMode, ReactionType, BoardSettings } from '../types';
import { PostCard } from './PostCard';
import { PostDetailDialog } from './PostDetailDialog';

interface BoardViewProps {
  posts: Post[];
  layout: LayoutMode;
  settings: BoardSettings;
  onReaction: (postId: string, type: ReactionType) => void;
  onComment: (postId: string, content: string) => void;
  onDelete: (postId: string) => void;
  onRotateImage?: (postId: string, rotation: number) => void;
  currentUser?: string;
  isAdmin?: boolean;
}

export function BoardView({ posts, layout, settings, onReaction, onComment, onDelete, onRotateImage, currentUser, isAdmin }: BoardViewProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const selectedPost = selectedPostId ? posts.find(p => p.id === selectedPostId) : null;

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="text-6xl mb-4">📌</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">아직 포스트가 없습니다</h2>
        <p className="text-gray-500 text-sm">첫 번째 포스트를 추가해보세요!</p>
      </div>
    );
  }

  const cardProps = {
    onReaction,
    onComment,
    onDelete,
    allowComments: settings.allowComments,
    allowReactions: settings.allowReactions,
  };

  const renderPosts = (compact?: boolean) =>
    posts.map(post => (
      <div key={post.id} className={layout === 'wall' ? 'break-inside-avoid' : undefined}>
        <PostCard
          post={post}
          {...cardProps}
          compact={compact}
          onClick={() => setSelectedPostId(post.id)}
        />
      </div>
    ));

  return (
    <>
      {/* Wall layout */}
      {layout === 'wall' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {renderPosts()}
          </div>
        </div>
      )}

      {/* Grid layout */}
      {layout === 'grid' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {renderPosts(true)}
          </div>
        </div>
      )}

      {/* Stream layout */}
      {layout === 'stream' && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {renderPosts()}
        </div>
      )}

      {/* Post detail dialog */}
      {selectedPost && (
        <PostDetailDialog
          post={selectedPost}
          open={true}
          onClose={() => setSelectedPostId(null)}
          onReaction={onReaction}
          onComment={onComment}
          onRotateImage={onRotateImage}
          currentUser={currentUser}
          isAdmin={isAdmin}
          allowComments={settings.allowComments}
          allowReactions={settings.allowReactions}
        />
      )}
    </>
  );
}
