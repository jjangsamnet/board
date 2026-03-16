import { useState, useCallback } from 'react';
import { PostType } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Type, Image, Link, Video, ClipboardPaste, X } from 'lucide-react';

interface CreatePostDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (type: PostType, title: string, content: string, extras?: { imageUrl?: string; linkUrl?: string; videoUrl?: string }) => void;
}

export function CreatePostDialog({ open, onClose, onSubmit }: CreatePostDialogProps) {
  const [postType, setPostType] = useState<PostType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [pasteHint, setPasteHint] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() && !content.trim() && !pastedImage) return;
    const finalImageUrl = pastedImage || imageUrl.trim() || undefined;
    const finalType = pastedImage ? 'image' : postType;
    onSubmit(finalType, title.trim(), content.trim(), {
      imageUrl: finalImageUrl,
      linkUrl: linkUrl.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setImageUrl('');
    setLinkUrl('');
    setVideoUrl('');
    setPastedImage(null);
    setPostType('text');
  };

  // Handle paste from clipboard (images and text)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;

    // Check for pasted images
    const items = clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setPastedImage(dataUrl);
            setPostType('image');
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }

    // Check for pasted text that looks like a URL
    const pastedText = clipboardData.getData('text/plain').trim();
    if (pastedText && isUrl(pastedText)) {
      // Don't prevent default — let it also paste into the focused input
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
  }, []);

  const handlePasteButton = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        // Try image first
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = (ev) => {
            setPastedImage(ev.target?.result as string);
            setPostType('image');
          };
          reader.readAsDataURL(blob);
          return;
        }
        // Try text
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          const text = await blob.text();
          if (isUrl(text.trim())) {
            if (isImageUrl(text.trim())) {
              setImageUrl(text.trim());
              setPostType('image');
            } else if (isVideoUrl(text.trim())) {
              setVideoUrl(text.trim());
              setPostType('video');
            } else {
              setLinkUrl(text.trim());
              setPostType('link');
            }
          } else {
            setContent(prev => prev ? prev + '\n' + text : text);
          }
          return;
        }
      }
    } catch {
      // Fallback: read text
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          if (isUrl(text.trim())) {
            setLinkUrl(text.trim());
            setPostType('link');
          } else {
            setContent(prev => prev ? prev + '\n' + text : text);
          }
        }
      } catch {
        setPasteHint(true);
        setTimeout(() => setPasteHint(false), 3000);
      }
    }
  };

  const tabs = [
    { value: 'text', label: '텍스트', icon: Type },
    { value: 'image', label: '이미지', icon: Image },
    { value: 'link', label: '링크', icon: Link },
    { value: 'video', label: '동영상', icon: Video },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <DialogContent className="sm:max-w-md" onPaste={handlePaste}>
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
            {/* Pasted image preview */}
            {pastedImage && (
              <div className="relative">
                <img src={pastedImage} alt="붙여넣은 이미지" className="w-full h-40 object-cover rounded-lg border" />
                <button
                  onClick={() => setPastedImage(null)}
                  className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                >
                  <X size={14} />
                </button>
                <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                  클립보드에서 붙여넣음
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
              {!pastedImage && (
                <>
                  <Input
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="이미지 URL (https://...) 또는 Ctrl+V로 붙여넣기"
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
          <Button size="sm" onClick={handleSubmit} disabled={!title.trim() && !content.trim() && !pastedImage}>
            게시하기
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
