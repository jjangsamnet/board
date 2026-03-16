import { useState, useCallback, useRef } from 'react';
import type { PostType } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Type, Image, Link, Video, ClipboardPaste, X, Upload, Loader2 } from 'lucide-react';
import { uploadImageToStorage } from '../uploadImage';

interface CreatePostDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (type: PostType, title: string, content: string, extras?: { imageUrl?: string; linkUrl?: string; videoUrl?: string }) => void;
  userId?: string;
}

export function CreatePostDialog({ open, onClose, onSubmit, userId }: CreatePostDialogProps) {
  const [postType, setPostType] = useState<PostType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | Blob | null>(null);
  const [imageLabel, setImageLabel] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pasteHint, setPasteHint] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!title.trim() && !content.trim() && !previewImage && !imageUrl.trim()) return;
    setUploading(true);

    try {
      let finalImageUrl: string | undefined;

      // If we have a file to upload, send to Firebase Storage
      if (uploadedFile && userId) {
        finalImageUrl = await uploadImageToStorage(uploadedFile, userId);
      } else if (imageUrl.trim()) {
        finalImageUrl = imageUrl.trim();
      }

      const finalType = finalImageUrl && postType !== 'link' && postType !== 'video' ? 'image' : postType;

      onSubmit(finalType, title.trim(), content.trim(), {
        imageUrl: finalImageUrl,
        linkUrl: linkUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
      });

      resetForm();
      onClose();
    } catch (err) {
      console.error('포스트 게시 실패:', err);
      alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setImageUrl('');
    setLinkUrl('');
    setVideoUrl('');
    setPreviewImage(null);
    setUploadedFile(null);
    setImageLabel(null);
    setPostType('text');
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Create local preview from file
  const previewFile = useCallback((file: File | Blob, label: string) => {
    setUploadedFile(file);
    setImageLabel(label);
    setPostType('image');
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
  }, []);

  // Handle file input change
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    previewFile(file, `${file.name} (${sizeMB}MB)`);
  }, [previewFile]);

  // Handle drag & drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      previewFile(file, `${file.name} (${sizeMB}MB)`);
    }
  }, [previewFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handle paste from clipboard
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    const items = clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          previewFile(file, '클립보드에서 붙여넣음');
        }
        return;
      }
    }

    const pastedText = clipboardData.getData('text/plain').trim();
    if (pastedText && isUrl(pastedText)) {
      if (isImageUrl(pastedText)) {
        setImageUrl(pastedText);
        setPostType('image');
      } else if (isVideoUrl(pastedText)) {
        setVideoUrl(pastedText);
        setPostType('video');
      } else {
        setLinkUrl(pastedText);
        setPostType('link');
      }
    }
  }, [previewFile]);

  const handlePasteButton = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          previewFile(blob, '클립보드에서 붙여넣음');
          return;
        }
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          const text = await blob.text();
          if (isUrl(text.trim())) {
            if (isImageUrl(text.trim())) { setImageUrl(text.trim()); setPostType('image'); }
            else if (isVideoUrl(text.trim())) { setVideoUrl(text.trim()); setPostType('video'); }
            else { setLinkUrl(text.trim()); setPostType('link'); }
          } else {
            setContent(prev => prev ? prev + '\n' + text : text);
          }
          return;
        }
      }
    } catch {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          if (isUrl(text.trim())) { setLinkUrl(text.trim()); setPostType('link'); }
          else { setContent(prev => prev ? prev + '\n' + text : text); }
        }
      } catch {
        setPasteHint(true);
        setTimeout(() => setPasteHint(false), 3000);
      }
    }
  };

  const clearImage = () => {
    if (previewImage) URL.revokeObjectURL(previewImage);
    setPreviewImage(null);
    setUploadedFile(null);
    setImageLabel(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const tabs = [
    { value: 'text', label: '텍스트', icon: Type },
    { value: 'image', label: '이미지', icon: Image },
    { value: 'link', label: '링크', icon: Link },
    { value: 'video', label: '동영상', icon: Video },
  ] as const;

  const hasContent = title.trim() || content.trim() || previewImage || imageUrl.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <DialogContent className="sm:max-w-md" onPaste={handlePaste} onDrop={handleDrop} onDragOver={handleDragOver}>
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center justify-between">
            새 포스트 작성
            <Button
              variant="outline"
              size="sm"
              onClick={handlePasteButton}
              className="text-xs gap-1.5 h-7 font-normal"
            >
              <ClipboardPaste size={13} />
              붙여넣기
            </Button>
          </DialogTitle>
          {pasteHint && (
            <p className="text-xs text-amber-600 mt-1">
              클립보드 접근 권한이 필요합니다. Ctrl+V로 직접 붙여넣어 보세요.
            </p>
          )}
        </DialogHeader>

        <Tabs value={postType} onValueChange={(v) => setPostType(v as PostType)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-9">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs flex items-center gap-1">
                <tab.icon size={14} />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4 space-y-3">
            {/* Image preview */}
            {previewImage && (
              <div className="relative">
                <img src={previewImage} alt="업로드 이미지" className="w-full h-40 object-cover rounded-lg border" />
                <button
                  onClick={clearImage}
                  className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                >
                  <X size={14} />
                </button>
                <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {imageLabel || '이미지'}
                </span>
              </div>
            )}

            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목"
              className="text-sm"
            />

            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="내용을 입력하세요... (Ctrl+V로 이미지/텍스트/URL 붙여넣기 가능)"
              rows={4}
              className="text-sm resize-none"
            />

            <TabsContent value="image" className="mt-0 space-y-2">
              {!previewImage && (
                <>
                  {/* File upload area */}
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-rose-400 hover:bg-rose-50/30 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 font-medium">이미지 파일 선택</p>
                    <p className="text-xs text-gray-400 mt-1">
                      클릭하여 선택하거나, 이 영역에 드래그 앤 드롭
                    </p>
                    <p className="text-xs text-gray-400">
                      JPG, PNG, GIF, WebP (최대 5MB, 자동 리사이즈)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span>또는 URL 입력</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <Input
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="이미지 URL (https://...)"
                    className="text-sm"
                  />
                  {imageUrl && (
                    <img src={imageUrl} alt="미리보기" className="w-full h-32 object-cover rounded-lg" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="link" className="mt-0">
              <Input
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="링크 URL (https://...)"
                className="text-sm"
              />
            </TabsContent>

            <TabsContent value="video" className="mt-0">
              <Input
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="동영상 URL (https://...)"
                className="text-sm"
              />
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => { resetForm(); onClose(); }}>취소</Button>
          <Button size="sm" onClick={handleSubmit} disabled={uploading || !hasContent}>
            {uploading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={14} className="animate-spin" />
                업로드 중...
              </span>
            ) : '게시하기'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function isUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url) ||
    url.includes('unsplash.com') || url.includes('imgur.com') || url.includes('images.');
}

function isVideoUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be') ||
    url.includes('vimeo.com') || /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
}
