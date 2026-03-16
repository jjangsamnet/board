import { Post, LayoutMode, ReactionType, BoardSettings } from '../types';
import { PostCard } from './PostCard';

interface BoardViewProps {
  posts: Post[];
  layout: LayoutMode;
  settings: BoardSettings;
  onReaction: (postId: string, type: ReactionType) => void;
  onComment: (postId: string, content: string) => void;
  onDelete: (postId: string) => void;
}

export function BoardView({ posts, layout, settings, onReaction, onComment, onDelete }: BoardViewProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="text-6xl mb-4">📋</div>
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

  // Wall layout - masonry-like columns
  if (layout === 'wall') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {posts.map(post => (
            <div key={post.id} className="break-inside-avoid">
              <PostCard post={post} {...cardProps} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid layout - uniform cards
  if (layout === 'grid') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} {...cardProps} compact />
          ))}
        </div>
      </div>
    );
  }

  // Stream layout - single column
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} {...cardProps} />
      ))}
    </div>
  );
}
