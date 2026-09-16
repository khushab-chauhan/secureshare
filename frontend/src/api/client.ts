const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  storage_used_bytes: number;
  storage_quota_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface FolderData {
  id: string;
  name: string;
  owner_id: string;
  parent_id: string | null;
  path: string;
  depth: number;
  is_trash: boolean;
  created_at: string;
  updated_at: string;
}

export interface Breadcrumb {
  id: string;
  name: string;
}

export interface FolderDetail extends FolderData {
  breadcrumbs: Breadcrumb[];
}

class ApiClient {
  private getAccessToken(): string | null {
    return localStorage.getItem('secureshare_access_token');
  }

  public setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('secureshare_access_token', accessToken);
    localStorage.setItem('secureshare_refresh_token', refreshToken);
  }

  public clearTokens() {
    localStorage.removeItem('secureshare_access_token');
    localStorage.removeItem('secureshare_refresh_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Auth Endpoints
  async register(email: string, password: string, fullName: string): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  }

  async login(email: string, password: string): Promise<{ access_token: string; refresh_token: string }> {
    const body = new URLSearchParams();
    body.append('username', email);
    body.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || 'Login failed');
    }

    const res = await response.json();
    this.setTokens(res.access_token, res.refresh_token);
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Folders Endpoints
  async getFolders(parentId?: string | null): Promise<FolderData[]> {
    const query = parentId ? `?parent_id=${parentId}` : '';
    return this.request<FolderData[]>(`/folders/${query}`);
  }

  async getFolder(folderId: string): Promise<FolderDetail> {
    return this.request<FolderDetail>(`/folders/${folderId}`);
  }

  async createFolder(name: string, parentId?: string | null): Promise<FolderData> {
    return this.request<FolderData>('/folders/', {
      method: 'POST',
      body: JSON.stringify({ name, parent_id: parentId || null }),
    });
  }

  async getBreadcrumbs(folderId: string): Promise<Breadcrumb[]> {
    return this.request<Breadcrumb[]>(`/folders/${folderId}/breadcrumbs`);
  }

  async deleteFolder(folderId: string): Promise<FolderData> {
    return this.request<FolderData>(`/folders/${folderId}`, {
      method: 'DELETE',
    });
  }

  // File Upload Endpoints
  async initiateUpload(payload: {
    file_name: string;
    content_type: string;
    size_bytes: number;
    folder_id?: string | null;
  }): Promise<{ file_id: string; upload_url: string; s3_key: string; expires_in_seconds: number }> {
    return this.request('/files/upload-url', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async completeUpload(payload: {
    file_id: string;
    etag: string;
  }): Promise<FileData> {
    return this.request<FileData>('/files/complete-upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async listFiles(folderId?: string | null): Promise<FileData[]> {
    const query = folderId ? `?folder_id=${folderId}` : '';
    return this.request<FileData[]>(`/files/${query}`);
  }

  async getDownloadUrl(fileId: string): Promise<{ file_id: string; file_name: string; download_url: string; expires_in_seconds: number }> {
    return this.request(`/files/${fileId}/download-url`);
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.request(`/files/${fileId}`, { method: 'DELETE' });
  }
}

export interface FileData {
  id: string;
  name: string;
  mime_type: string | null;
  owner_id: string;
  folder_id: string | null;
  status: 'pending' | 'active' | 'processing' | 'error' | 'trash';
  size_bytes: number;
  current_s3_key: string | null;
  created_at: string;
  updated_at: string;
}

export const api = new ApiClient();
