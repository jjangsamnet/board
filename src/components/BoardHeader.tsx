import { useState } from 'react';
import { Board, BoardSettings, LayoutMode, WALLPAPERS } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, LayoutGrid, List, Columns, Settings, Users, Share2, Pencil, Check, Shield } from 'lucide-react';

interface BoardHeaderProps {
  board: Board;
  onAddPost: () => void;
  onLayoutChange: (layout: LayoutMode) => void;
  onWallpaperChange: (wallpaper: string) => void;
  onTitleChange: (title: string) => void;
  onDescChange: (desc: string) => void;
  onSettingsChange: (settings: Partial<BoardSettings>) => void;
  activeUsers: number;
}

export function BoardHeader({
  board, onAddPost, onLayoutChange, onWallpaperChange,
  onTitleChange, onDescChange, onSettingsChange, activeUsers,
}: BoardHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(board.title);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const isDarkWallpaper = board.wallpaper.includes('900') || board.wallpaper.includes('800');

  const layoutOptions = [
    { value: 'wall' as LayoutMode, label: '벽 보기', icon: Columns, desc: '자유롭게 배치' },
    { value: 'grid' as LayoutMode, label: '격자 보기', icon: LayoutGrid, desc: '정렬된 카드' },
    { value: 'stream' as LayoutMode, label: '스트림 보기', icon: List, desc: '세로 목록' },
  ];

  return (
    <>
      <header className={`sticky top-0 z-30 backdrop-blur-md border-b ${isDarkWallpaper ? 'bg-black/30 border-white/10' : 'bg-white/70 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Title area */}
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  className="text-lg font-bold h-9 max-w-sm bg-white/80"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      onTitleChange(titleDraft);
                      setEditingTitle(false);
                    }
                  }}
                />
                <Button size="sm" variant="ghost" onClick={() => { onTitleChange(titleDraft); setEditingTitle(false); }}>
                  <Check size={16} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setEditingTitle(true)}>
                <h1 className={`text-xl font-bold truncate ${isDarkWallpaper ? 'text-white' : 'text-gray-900'}`}>
                  {board.title}
                </h1>
                <Pencil size={14} className={`opacity-0 group-hover:opacity-60 transition-opacity ${isDarkWallpaper ? 'text-white' : 'text-gray-500'}`} />
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <p className={`text-xs truncate ${isDarkWallpaper ? 'text-white/60' : 'text-gray-500'}`}>
                {board.description} · 포스트 {board.posts.length}개
              </p>
              {/* Status badges */}
              {!board.settings.allowComments && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">댓글 OFF</span>
              )}
              {!board.settings.allowReactions && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">반응 OFF</span>
              )}
            </div>
          </div>

          {/* Active users indicator */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${isDarkWallpaper ? 'bg-white/10 text-white/70' : 'bg-green-50 text-green-700'}`}>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <Users size={12} />
            <span>{activeUsers}명 접속중</span>
          </div>

          {/* Layout selector */}
          <div className={`hidden sm:flex items-center rounded-lg p-0.5 ${isDarkWallpaper ? 'bg-white/10' : 'bg-gray-100'}`}>
            {layoutOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => onLayoutChange(opt.value)}
                className={`p-1.5 rounded-md transition-all ${
                  board.layout === opt.value
                    ? isDarkWallpaper ? 'bg-white/20 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDarkWallpaper ? 'text-white/50 hover:text-white/80' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={opt.label}
              >
                <opt.icon size={16} />
              </button>
            ))}
          </div>

          {/* Admin button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdminPanel(true)}
            className={isDarkWallpaper ? 'text-white/70 hover:text-white hover:bg-white/10' : ''}
            title="관리 설정"
          >
            <Shield size={16} />
          </Button>

          {/* Settings dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={isDarkWallpaper ? 'text-white/70 hover:text-white hover:bg-white/10' : ''}>
                <Settings size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">레이아웃</DropdownMenuLabel>
              {layoutOptions.map(opt => (
                <DropdownMenuItem key={opt.value} onClick={() => onLayoutChange(opt.value)} className="text-sm">
                  <opt.icon size={14} className="mr-2" />
                  {opt.label}
                  {board.layout === opt.value && <Check size={12} className="ml-auto" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">배경</DropdownMenuLabel>
              {WALLPAPERS.map(wp => (
                <DropdownMenuItem key={wp.value} onClick={() => onWallpaperChange(wp.value)} className="text-sm">
                  <div className={`w-4 h-4 rounded-sm mr-2 border ${wp.value}`} />
                  {wp.name}
                  {board.wallpaper === wp.value && <Check size={12} className="ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Share button */}
          <Button variant="outline" size="sm" className={`hidden sm:flex gap-1.5 ${isDarkWallpaper ? 'border-white/20 text-white hover:bg-white/10' : ''}`}>
            <Share2 size={14} />
            공유
          </Button>

          {/* Add post button */}
          <Button size="sm" onClick={onAddPost} className="gap-1.5 bg-rose-500 hover:bg-rose-600 text-white">
            <Plus size={16} />
            <span className="hidden sm:inline">포스트 추가</span>
          </Button>
        </div>
      </header>

      {/* Admin Settings Dialog */}
      <Dialog open={showAdminPanel} onOpenChange={setShowAdminPanel}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Shield size={18} />
              보드 관리 설정
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">댓글 허용</Label>
                <p className="text-xs text-gray-500 mt-0.5">학생들이 포스트에 댓글을 달 수 있습니다</p>
              </div>
              <Switch
                checked={board.settings.allowComments}
                onCheckedChange={(checked) => onSettingsChange({ allowComments: checked })}
              />
            </div>

            <div className="border-t" />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">반응 허용</Label>
                <p className="text-xs text-gray-500 mt-0.5">이모지 반응 (👍 ❤️ ⭐ 😄)을 사용할 수 있습니다</p>
              </div>
              <Switch
                checked={board.settings.allowReactions}
                onCheckedChange={(checked) => onSettingsChange({ allowReactions: checked })}
              />
            </div>

            <div className="border-t" />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">익명 접속 허용</Label>
                <p className="text-xs text-gray-500 mt-0.5">로그인 없이 보드에 접속할 수 있습니다</p>
              </div>
              <Switch
                checked={board.settings.allowAnonymous}
                onCheckedChange={(checked) => onSettingsChange({ allowAnonymous: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setShowAdminPanel(false)}>닫기</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
