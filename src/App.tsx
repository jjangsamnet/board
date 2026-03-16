import { useState, useEffect } from 'react';
import type { BoardSettings } from './types';
import { useBoard } from './store';
import { BoardHeader } from './components/BoardHeader';
import { BoardView } from './components/BoardView';
import { CreatePostDialog } from './components/CreatePostDialog';
import { CursorsOverlay, useSimulatedUsers } from './components/OnlineUsers';
import { Toaster, toast } from 'sonner';

export default function App() {
  const { board, addPost, deletePost, toggleReaction, addComment, updateBoard } = useBoard();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { activeCount } = useSimulatedUsers();
  const [showCursors, setShowCursors] = useState(true);

  // Simulate real-time notifications
  useEffect(() => {
    const messages = [
      '학생2님이 새 포스트를 작성했습니다',
      '학생1님이 반응을 남겼습니다 👍',
      '학생3님이 댓글을 달았습니다',
      '선생님이 보드를 업데이트했습니다',
      '학생4님이 접속했습니다',
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const msg = messages[Math.floor(Math.random() * messages.length)];
        toast(msg, {
          position: 'bottom-right',
          duration: 3000,
          style: { fontSize: '13px' },
        });
      }
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const handleSettingsChange = (updates: Partial<BoardSettings>) => {
    updateBoard({ settings: { ...board.settings, ...updates } });
    const key = Object.keys(updates)[0] as keyof BoardSettings;
    const labels: Record<string, [string, string]> = {
      allowComments: ['댓글이 허용되었습니다', '댓글이 차단되었습니다'],
      allowReactions: ['반응이 허용되었습니다', '반응이 차단되었습니다'],
      allowAnonymous: ['익명 접속이 허용되었습니다', '익명 접속이 차단되었습니다'],
    };
    const pair = labels[key];
    if (pair) {
      toast(updates[key] ? pair[0] : pair[1], { position: 'bottom-right', duration: 2000 });
    }
  };

  const isDarkWallpaper = board.wallpaper.includes('900') || board.wallpaper.includes('800');

  return (
    <div className={`min-h-screen ${board.wallpaper} transition-colors duration-500`}>
      <CursorsOverlay enabled={showCursors} />

      <BoardHeader
        board={board}
        onAddPost={() => setShowCreateDialog(true)}
        onLayoutChange={(layout) => updateBoard({ layout })}
        onWallpaperChange={(wallpaper) => updateBoard({ wallpaper })}
        onTitleChange={(title) => updateBoard({ title })}
        onDescChange={(description) => updateBoard({ description })}
        onSettingsChange={handleSettingsChange}
        activeUsers={activeCount}
      />

      <BoardView
        posts={board.posts}
        layout={board.layout}
        settings={board.settings}
        onReaction={toggleReaction}
        onComment={(postId, content) => {
          addComment(postId, content);
          toast('댓글이 추가되었습니다', { position: 'bottom-right', duration: 2000 });
        }}
        onDelete={(postId) => {
          deletePost(postId);
          toast('포스트가 삭제되었습니다', { position: 'bottom-right', duration: 2000 });
        }}
      />

      <CreatePostDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={(type, title, content, extras) => {
          addPost(type, title, content, extras);
          toast('새 포스트가 추가되었습니다!', { position: 'bottom-right', duration: 2000 });
        }}
      />

      {/* Cursor toggle */}
      <button
        onClick={() => setShowCursors(!showCursors)}
        className={`fixed bottom-4 left-4 z-50 text-xs px-3 py-1.5 rounded-full transition-all ${
          isDarkWallpaper
            ? 'bg-white/10 text-white/60 hover:bg-white/20'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {showCursors ? '🖱️ 커서 숨기기' : '🖱️ 커서 보기'}
      </button>

      <Toaster />
    </div>
  );
}
