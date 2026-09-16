export interface FolderItem {
  id: string;
  name: string;
  filesCount: number;
  updatedDate: string;
}

export type FileType = 'pdf' | 'png' | 'docx' | 'xlsx' | 'mp4';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size: string;
  updatedTime: string;
  previewType: 'pdf' | 'image' | 'docx' | 'sheet';
  imageUrl?: string;
  isSelected?: boolean;
  isStarred?: boolean;
  status?: string;
  rawSizeBytes?: number;
  rawUpdatedAt?: string;
  sharedWith?: string;
}

export interface SharedUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Owner' | 'Editor' | 'Viewer';
  isCurrentUser?: boolean;
}
