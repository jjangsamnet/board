import { useState, useEffect } from 'react';
import type { BoardSettings } from './types';
import { useBoardManager, useBoard } from './store';
import { Dashboard } from './components/Dashboard';
import { BoardHeader } from './components/BoardHeader';
import { BoardView } from './components/BoardView';
import { CreatePostDialog } from './components/CreatePostDialog';
import { ShareDialog } from './components/ShareDialog';
import { CursorsOverlay, useSimulatedUsers } from './components/OnlineUsers';
import { Toaster, toast } from 'sonner';

// Simple hash-based router
function useHashRouter() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  // Parse route: #/b/:boardId
  const match = hash.match(/^#\/b\/(.+)$/);
  const boardId = match ? match[1] : null;

  return { boardId, navigate };
}

export default function App() {
  const { boardId, navigate } = useHashRouter();

  if (boardId) {
    return <BoardPage boardId={boardId} onBack={() => navigate('/')} />;
  }

  return <DashboardPage onOpenBoard={(id) => navigate(`/b/${id}`)} />;
}

// Dashboard page
function DashboardPage({ onOpenBoard }: { onOpenBoard: (id: string) => void }) {
  const { boards, createBoard, deleteBoard } = useBoardManager();

  return (
    <>
      <Dashboard
        boards={boards}
        onCreateBoard={createBoard}
        onDeleteBoard={deleteBoard}
        onOpenBoard={onOpenBoard}
      />
      <Toaster />
    </>
  );
}

// Individual board page
function BoardPage({ boardId, onBack }: { boardId: string; onBack: () => void }) {
  const { board, addPost, deletePost, toggleReaction, addComment, updateBoard } = useBoard(boardId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
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

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">😢</div>
        <h2 className="text-xl font-semibold text-gray-700">보드를 찾을 수 없습니다</h2>
        <p className="text-gray-500 text-sm">삭제되었거나 잘못된 주소입니다.</p>
        <button
          onClick={onBack}
          className="mt-2 px-4 py-2 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600 transition-colors"
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

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
        onShare={() => setShowShareDialog(true)}
        onBack={onBack}
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

      <ShareDialog
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        boardId={board.id}
        boardTitle={board.title}
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
