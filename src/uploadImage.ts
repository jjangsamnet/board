import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

const MAX_IMAGE_WIDTH = 1200;
const MAX_IMAGE_HEIGHT = 1200;
const IMAGE_QUALITY = 0.8;

// Compress and resize image using canvas, returns a Blob
function compressImage(file: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Scale down if needed
      if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
        const ratio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('이미지 변환 실패'));
        },
        'image/jpeg',
        IMAGE_QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 읽을 수 없습니다'));
    };
    img.src = url;
  });
}

// Upload image to Firebase Storage and return the download URL
export async function uploadImageToStorage(file: File | Blob, userId: string): Promise<string> {
  // Compress first
  const compressed = await compressImage(file);

  // Generate unique filename
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const fileName = `images/${userId}/${timestamp}_${random}.jpg`;

  // Upload to Storage
  const storageRef = ref(storage, fileName);
  await uploadBytes(storageRef, compressed, {
    contentType: 'image/jpeg',
  });

  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

// Allowed document file extensions and their MIME types
const ALLOWED_FILE_TYPES: Record<string, string> = {
  // 한글 문서
  '.hwp': 'application/x-hwp',
  '.hwpx': 'application/haansofthwpx',
  // MS Office
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.ppt': 'application/vnd.ms-powerpoint',
  // PDF
  '.pdf': 'application/pdf',
  // 텍스트
  '.txt': 'text/plain',
  '.csv': 'text/csv',
};

// Allowed audio file extensions and their MIME types
const ALLOWED_AUDIO_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.aac': 'audio/aac',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.wma': 'audio/x-ms-wma',
  '.webm': 'audio/webm',
};

// Max audio file size: 20MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024;

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot >= 0 ? fileName.substring(lastDot).toLowerCase() : '';
}

export function isAllowedFileType(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ext in ALLOWED_FILE_TYPES;
}

export function getAllowedExtensions(): string {
  return Object.keys(ALLOWED_FILE_TYPES).join(', ');
}

export function getAcceptString(): string {
  return Object.entries(ALLOWED_FILE_TYPES)
    .map(([ext, mime]) => `${ext},${mime}`)
    .join(',');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// Get icon emoji based on file extension
export function getFileIcon(fileName: string): string {
  const ext = getFileExtension(fileName);
  switch (ext) {
    case '.hwp':
    case '.hwpx':
      return '📝';
    case '.doc':
    case '.docx':
      return '📄';
    case '.xls':
    case '.xlsx':
      return '📊';
    case '.ppt':
    case '.pptx':
      return '📽️';
    case '.pdf':
      return '📕';
    case '.txt':
      return '📃';
    case '.csv':
      return '📈';
    default:
      return '📎';
  }
}

// Get display label for file type
export function getFileTypeLabel(fileName: string): string {
  const ext = getFileExtension(fileName);
  switch (ext) {
    case '.hwp':
    case '.hwpx':
      return '한글 문서';
    case '.doc':
    case '.docx':
      return 'Word 문서';
    case '.xls':
    case '.xlsx':
      return 'Excel 문서';
    case '.ppt':
    case '.pptx':
      return 'PPT 문서';
    case '.pdf':
      return 'PDF 문서';
    case '.txt':
      return '텍스트 파일';
    case '.csv':
      return 'CSV 파일';
    default:
      return '첨부 파일';
  }
}

// ============ Audio file helpers ============

export function isAllowedAudioType(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ext in ALLOWED_AUDIO_TYPES;
}

export function getAllowedAudioExtensions(): string {
  return Object.keys(ALLOWED_AUDIO_TYPES).join(', ');
}

export function getAudioAcceptString(): string {
  return Object.entries(ALLOWED_AUDIO_TYPES)
    .map(([ext, mime]) => `${ext},${mime}`)
    .join(',');
}

export function getAudioIcon(): string {
  return '🎵';
}

export function getAudioTypeLabel(fileName: string): string {
  const ext = getFileExtension(fileName);
  switch (ext) {
    case '.mp3': return 'MP3 오디오';
    case '.wav': return 'WAV 오디오';
    case '.ogg': return 'OGG 오디오';
    case '.aac': return 'AAC 오디오';
    case '.m4a': return 'M4A 오디오';
    case '.flac': return 'FLAC 오디오';
    case '.wma': return 'WMA 오디오';
    case '.webm': return 'WebM 오디오';
    default: return '오디오 파일';
  }
}

// Upload an audio file to Firebase Storage and return the download URL
export async function uploadAudioToStorage(
  file: File,
  userId: string
): Promise<{ url: string; fileName: string; fileSize: number; fileType: string }> {
  // Validate file type
  if (!isAllowedAudioType(file.name)) {
    throw new Error(`지원하지 않는 오디오 형식입니다. 지원 형식: ${getAllowedAudioExtensions()}`);
  }

  // Validate file size
  if (file.size > MAX_AUDIO_SIZE) {
    throw new Error(`오디오 파일 크기가 20MB를 초과합니다. (현재: ${formatFileSize(file.size)})`);
  }

  // Generate unique filename preserving original extension
  const ext = getFileExtension(file.name);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const storagePath = `audio/${userId}/${timestamp}_${random}${ext}`;

  // Determine content type
  const contentType = ALLOWED_AUDIO_TYPES[ext] || 'audio/mpeg';

  // Upload to Storage with original filename in metadata
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, {
    contentType,
    customMetadata: {
      originalName: file.name,
    },
  });

  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);

  return {
    url: downloadURL,
    fileName: file.name,
    fileSize: file.size,
    fileType: ext,
  };
}

// Upload a document file to Firebase Storage and return the download URL
export async function uploadFileToStorage(
  file: File,
  userId: string
): Promise<{ url: string; fileName: string; fileSize: number; fileType: string }> {
  // Validate file type
  if (!isAllowedFileType(file.name)) {
    throw new Error(`지원하지 않는 파일 형식입니다. 지원 형식: ${getAllowedExtensions()}`);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`파일 크기가 10MB를 초과합니다. (현재: ${formatFileSize(file.size)})`);
  }

  // Generate unique filename preserving original extension
  const ext = getFileExtension(file.name);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const storagePath = `files/${userId}/${timestamp}_${random}${ext}`;

  // Determine content type
  const contentType = ALLOWED_FILE_TYPES[ext] || 'application/octet-stream';

  // Upload to Storage with original filename in metadata
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, {
    contentType,
    customMetadata: {
      originalName: file.name,
    },
  });

  // Get download URL
  const downloadURL = await getDownloadURL(storageRef);

  return {
    url: downloadURL,
    fileName: file.name,
    fileSize: file.size,
    fileType: ext,
  };
}
