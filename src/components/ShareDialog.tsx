import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, QrCode, Link } from 'lucide-react';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  boardTitle: string;
}

export function ShareDialog({ open, onClose, boardId, boardTitle }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const boardUrl = `${window.location.origin}${window.location.pathname}#/b/${boardId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(boardUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(boardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = boardUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <QrCode size={18} />
            보드 공유하기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Board name */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">{boardTitle}</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-xl border-2 border-gray-100 shadow-sm">
              <img
                src={qrCodeUrl}
                alt="QR 코드"
                width={200}
                height={200}
                className="rounded-lg"
              />
            </div>
          </div>
          <p className="text-xs text-center text-gray-500">
            QR코드를 스캔하여 보드에 접속할 수 있습니다
          </p>

          {/* URL copy */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
              <Link size={12} />
              보드 URL
            </label>
            <div className="flex gap-2">
              <Input
                value={boardUrl}
                readOnly
                className="text-xs bg-gray-50 font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                size="sm"
                variant={copied ? 'default' : 'outline'}
                onClick={handleCopy}
                className={`shrink-0 gap-1.5 ${copied ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button size="sm" variant="outline" onClick={onClose}>닫기</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
