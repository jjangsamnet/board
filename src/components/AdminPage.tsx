import { useState } from 'react';
import type { UserProfile } from '../types';
import { useAllUsers, updateUserMaxBoards, UPGRADED_MAX_BOARDS, DEFAULT_MAX_BOARDS } from '../store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Users, Crown, ChevronUp, ChevronDown, Search } from 'lucide-react';

interface AdminPageProps {
  onBack: () => void;
  userName: string;
  userPhoto?: string;
}

export function AdminPage({ onBack, userName, userPhoto }: AdminPageProps) {
  const { users, loading } = useAllUsers();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const upgradedCount = users.filter(u => u.maxBoards > DEFAULT_MAX_BOARDS).length;

  const handleToggleQuota = async (user: UserProfile) => {
    const newMax = user.maxBoards > DEFAULT_MAX_BOARDS ? DEFAULT_MAX_BOARDS : UPGRADED_MAX_BOARDS;
    await updateUserMaxBoards(user.uid, newMax);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">사용자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Shield size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">관리자 페이지</h1>
                <p className="text-xs text-gray-500">사용자 권한 관리</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-xs text-indigo-700">
            {userPhoto ? (
              <img src={userPhoto} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-indigo-400 flex items-center justify-center text-white text-[10px] font-bold">
                {userName.charAt(0)}
              </div>
            )}
            <Crown size={12} />
            <span>관리자</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-gray-400" />
              <span className="text-xs text-gray-500">전체 사용자</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Crown size={16} className="text-amber-500" />
              <span className="text-xs text-gray-500">관리자</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <ChevronUp size={16} className="text-emerald-500" />
              <span className="text-xs text-gray-500">권한 부여됨</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{upgradedCount}</p>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            기본 사용자는 <strong>보드 3개</strong>까지 생성할 수 있습니다.
            권한을 부여하면 <strong>보드 200개</strong>까지 생성 가능합니다.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="이메일 또는 이름으로 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
          />
        </div>

        {/* User list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center text-xs font-medium text-gray-500">
            <span className="flex-1">사용자</span>
            <span className="w-28 text-center">보드 제한</span>
            <span className="w-24 text-center">역할</span>
            <span className="w-32 text-center">권한 관리</span>
          </div>
          {filteredUsers.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
            </div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.uid} className="px-4 py-3 border-b border-gray-100 last:border-b-0 flex items-center hover:bg-gray-50 transition-colors">
                {/* User info */}
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {user.displayName?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Max boards */}
                <div className="w-28 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.maxBoards > DEFAULT_MAX_BOARDS
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.maxBoards}개
                  </span>
                </div>

                {/* Role */}
                <div className="w-24 text-center">
                  {user.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      <Crown size={10} />
                      관리자
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      사용자
                    </span>
                  )}
                </div>

                {/* Action */}
                <div className="w-32 text-center">
                  {user.role === 'admin' ? (
                    <span className="text-xs text-gray-400">-</span>
                  ) : user.maxBoards > DEFAULT_MAX_BOARDS ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleQuota(user)}
                      className="text-xs h-7 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <ChevronDown size={12} />
                      권한 해제
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleQuota(user)}
                      className="text-xs h-7 gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    >
                      <ChevronUp size={12} />
                      권한 부여
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Last login info */}
        <p className="text-xs text-gray-400 mt-4 text-center">
          사용자는 Google로 로그인하면 자동으로 목록에 추가됩니다.
        </p>
      </main>
    </div>
  );
}
