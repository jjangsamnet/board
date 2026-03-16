import { useState } from 'react';
import type { Board } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, LayoutGrid, Clock, FileText, LogOut, Shield } from 'lucide-react';

interface DashboardProps {
  boards: Board[];
  onCreateBoard: (title: string, description: string) => string | Promise<string>;
  onDeleteBoard: (boardId: string) => void;
  onOpenBoard: (boardId: string) => void;
  onOpenAdmin: () => void;
  userName: string;
  userPhoto?: string;
  userEmail: string;
  isAdmin: boolean;
  maxBoards: number;
  myBoardCount: number;
  canCreateBoard: boolean;
  onLogout: () => void;
}

export function Dashboard({
  boards,
  onCreateBoard,
  onDeleteBoard,
  onOpenBoard,
  onOpenAdmin,
  userName,
  userPhoto,
  userEmail,
  isAdmin,
  maxBoards,
  myBoardCount,
  canCreateBoard,
  onLogout,
}: DashboardProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) return;
    const id = await onCreateBoard(title.trim(), description.trim());
    if (!id) return; // Creation was denied
    setTitle('');
    setDescription('');
    setShowCreate(false);
    onOpenBoard(id);
  };

  const handleDelete = (boardId: string) => {
    if (confirmDeleteId === boardId) {
      onDeleteBoard(boardId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(boardId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const timeAgo = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}일 전`;
    return `${Math.floor(days / 30)}개월 전`;
  };

  const BOARD_COLORS = [
    'from-rose-400 to-orange-300',
    'from-blue-400 to-cyan-300',
    'from-emerald-400 to-teal-300',
    'from-violet-400 to-purple-300',
    'from-amber-400 to-yellow-300',
    'from-pink-400 to-fuchsia-300',
    'from-sky-400 to-indigo-300',
    'from-lime-400 to-green-300',
  ];

  // Filter my boards for display
  const myBoards = boards.filter(b => b.ownerEmail === userEmail);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center">
              <LayoutGrid size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">공유보드</h1>
              <p className="text-xs text-gray-500">패들렛 스타일 공유 보드</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Admin button */}
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition-colors"
                title="관리자 페이지"
              >
                <Shield size={14} />
                <span className="hidden sm:inline">관리자</span>
              </button>
            )}
            {/* User profile */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-xs text-gray-600">
              {userPhoto ? (
                <img src={userPhoto} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-rose-400 flex items-center justify-center text-white text-[10px] font-bold">
                  {userName.charAt(0)}
                </div>
              )}
              <span className="max-w-[100px] truncate">{userName}</span>
              <button onClick={onLogout} className="ml-1 opacity-60 hover:opacity-100" title="로그아웃">
                <LogOut size={12} />
              </button>
            </div>
            <Button
              onClick={() => canCreateBoard ? setShowCreate(true) : null}
              disabled={!canCreateBoard}
              className="gap-2 bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-50"
            >
              <Plus size={16} />
              <span>새 보드 만들기</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Board quota info */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className={`rounded-lg px-4 py-2.5 flex items-center justify-between text-xs ${
          canCreateBoard ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
        }`}>
          <span>
            내 보드: <strong>{myBoardCount}</strong> / {maxBoards}개
            {!canCreateBoard && ' — 보드 생성 한도에 도달했습니다. 관리자에게 권한을 요청하세요.'}
          </span>
          <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${canCreateBoard ? 'bg-sky-400' : 'bg-amber-400'}`}
              style={{ width: `${Math.min(100, (myBoardCount / maxBoards) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Board list */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {myBoards.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
              <FileText size={36} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">아직 보드가 없습니다</h2>
            <p className="text-gray-500 mb-6">새 보드를 만들어 학생들과 함께 공유해보세요!</p>
            <Button
              onClick={() => canCreateBoard ? setShowCreate(true) : null}
              disabled={!canCreateBoard}
              className="gap-2 bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-50"
            >
              <Plus size={16} />
              첫 번째 보드 만들기
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-sm font-medium text-gray-500">내 보드</h2>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{myBoards.length}개</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {myBoards.map((board, idx) => (
                <div
                  key={board.id}
                  className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => onOpenBoard(board.id)}
                >
                  {/* Color header */}
                  <div className={`h-24 bg-gradient-to-br ${BOARD_COLORS[idx % BOARD_COLORS.length]} relative`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl opacity-60">{board.title.match(/\p{Emoji}/u)?.[0] || '📋'}</span>
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(board.id);
                      }}
                      className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${
                        confirmDeleteId === board.id
                          ? 'bg-red-500 text-white opacity-100'
                          : 'bg-black/20 text-white opacity-0 group-hover:opacity-100 hover:bg-black/40'
                      }`}
                      title={confirmDeleteId === board.id ? '한 번 더 클릭하면 삭제됩니다' : '보드 삭제'}
                    >
                      <Trash2 size={14} />
                    </button>
                    {confirmDeleteId === board.id && (
                      <div className="absolute top-10 right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                        한 번 더 클릭
                      </div>
                    )}
                  </div>
                  {/* Board info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{board.title}</h3>
                    {board.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{board.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {board.posts.length}개 포스트
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {timeAgo(board.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Create Board Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">새 보드 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">보드 제목</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="예: 우리반 독서 토론 보드"
                className="text-sm"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">설명 <span className="text-gray-400 font-normal">(선택)</span></label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="보드에 대한 설명을 입력하세요"
                rows={2}
                className="text-sm resize-none"
              />
            </div>
            <p className="text-xs text-gray-400">
              보드 {myBoardCount + 1} / {maxBoards}개
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>취소</Button>
            <Button size="sm" onClick={handleCreate} disabled={!title.trim()} className="bg-rose-500 hover:bg-rose-600 text-white">
              만들기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
