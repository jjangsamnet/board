import { useState, useEffect } from 'react';
import type { BoardSettings } from './types';
import { useBoardManager, useBoard } from './store';
import { useAuth } from './useAuth';
import { Dashboard } from './components/Dashboard';
import { BoardHeader } from './components/BoardHeader';
import { BoardView } from './components/BoardView';
import { CreatePostDialog } from './components/CreatePostDialog';
import { ShareDialog } from './components/ShareDialog';
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

// Login page
function LoginPage({ onLogin, loading: authLoading }: { onLogin: () => void; loading: boolean }) {
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      await onLogin();
    } catch {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center mx-auto shadow-lg">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">공유보드</h1>
          <p className="text-sm text-gray-500 mt-1">패들렛 스타일 공유 보드</p>
        </div>

        <p className="text-sm text-gray-600">
          Google 계정으로 로그인하여<br />보드를 만들고 공유해보세요!
        </p>

        <button
          onClick={handleLogin}
          disabled={authLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-sm font-medium text-gray-700">
            {authLoading ? '로그인 중...' : 'Google로 로그인'}
          </span>
        </button>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <p className="text-xs text-gray-400">
          로그인하면 보드를 만들고 다른 사용자와 공유할 수 있습니다
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const { boardId, navigate } = useHashRouter();

  // Show auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onLogin={loginWithGoogle} loading={false} />;
  }

  const displayName = user.displayName || user.email || '사용자';
  const photoURL = user.photoURL || undefined;

  if (boardId) {
    return (
      <BoardPage
        boardId={boardId}
        onBack={() => navigate('/')}
        userName={displayName}
        userPhoto={photoURL}
        onLogout={logout}
      />
    );
  }

  return (
    <DashboardPage
      onOpenBoard={(id) => navigate(`/b/${id}`)}
      userName={displayName}
      userPhoto={photoURL}
      onLogout={logout}
    />
  );
}

// Dashboard page
function DashboardPage({
  onOpenBoard,
  userName,
  userPhoto,
  onLogout,
}: {
  onOpenBoard: (id: string) => void;
  userName: string;
  userPhoto?: string;
  onLogout: () => void;
}) {
  const { boards, loading, createBoard, deleteBoard } = useBoardManager();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">보드 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dashboard
        boards={boards}
        onCreateBoard={createBoard}
        onDeleteBoard={deleteBoard}
        onOpenBoard={onOpenBoard}
        userName={userName}
        userPhoto={userPhoto}
        onLogout={onLogout}
      />
      <Toaster />
    </>
  );
}

// Individual board page
function BoardPage({
  boardId,
  onBack,
  userName,
  userPhoto,
  onLogout,
}: {
  boardId: string;
  onBack: () => void;
  userName: string;
  userPhoto?: string;
  onLogout: () => void;
}) {
  const { board, loading, addPost, deletePost, toggleReaction, addComment, updateBoard } = useBoard(boardId, userName);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className={`min-h-screen ${board.wallpaper} transition-colors duration-500`}>
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
        userName={userName}
        userPhoto={userPhoto}
        onLogout={onLogout}
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

      <Toaster />
    </div>
  );
}
