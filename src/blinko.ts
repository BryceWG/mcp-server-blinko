/**
 * Blinko client used to interact with the Blinko API.
 */
export interface SearchNotesParams {
  size?: number;
  type?: -1 | 0 | 1;
  isArchived?: boolean;
  isRecycle?: boolean;
  searchText: string;
  isUseAiQuery?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  hasTodo?: boolean;
}

export interface Note {
  id: number;
  type: number;
  content: string;
  isArchived: boolean;
  isRecycle: boolean;
  isShare: boolean;
  isTop: boolean;
  isReviewed: boolean;
  sharePassword?: string;
  shareEncryptedUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShareNoteParams {
  id: number;
  isCancel?: boolean;
  password?: string;
}

export interface ShareNoteResult {
  id: number;
  isShare: boolean;
  sharePassword?: string;
  shareEncryptedUrl?: string | null;
}

export class BlinkoClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  /**
   * Create a new Blinko client.
   * @param domain - The domain of Blinko service. Supports both formats:
   *                 - Pure domain: "example.com" or "example.com:3000"
   *                 - Full URL: "https://example.com" or "http://example.com:3000"
   * @param apiKey - The API key for authentication.
   */
  constructor({ domain, apiKey }: { domain: string; apiKey: string }) {
    this.baseUrl = this.normalizeDomain(domain);
    this.apiKey = apiKey;
  }

  /**
   * Normalize domain to a full base URL.
   * @param domain - Input domain in various formats
   * @returns Normalized base URL
   */
  private normalizeDomain(domain: string): string {
    if (!domain) {
      throw new Error("Domain cannot be empty");
    }

    // Remove trailing slash if present
    domain = domain.replace(/\/$/, '');

    // If domain already starts with http:// or https://, use it as is
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      return domain;
    }

    // Otherwise, assume it's a pure domain and add https://
    return `https://${domain}`;
  }

  /**
   * Search notes in Blinko.
   * @param params - Search parameters.
   * @returns Array of matching notes.
   */
  async searchNotes(params: SearchNotesParams): Promise<Note[]> {
    try {
      const apiUrl = `${this.baseUrl}/api/v1/note/list`;
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          size: params.size ?? 5,
          type: params.type ?? -1,
          isArchived: params.isArchived ?? false,
          isRecycle: params.isRecycle ?? false,
          searchText: params.searchText,
          isUseAiQuery: params.isUseAiQuery ?? true,
          startDate: params.startDate ?? null,
          endDate: params.endDate ?? null,
          hasTodo: params.hasTodo ?? false,
        }),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`request failed with status ${resp.status}: ${errorText}`);
      }

      return await resp.json();
    } catch (e) {
      throw e;
    }
  }

  /**
   * Get daily review notes from Blinko.
   * @returns Array of notes for daily review.
   */
  async getDailyReviewNotes(): Promise<Note[]> {
    try {
      const apiUrl = `${this.baseUrl}/api/v1/note/daily-review-list`;
      const resp = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`request failed with status ${resp.status}: ${errorText}`);
      }

      return await resp.json();
    } catch (e) {
      throw e;
    }
  }

  /**
   * Clear the recycle bin in Blinko.
   * @returns The result of the operation.
   */
  async clearRecycleBin(): Promise<{ success: boolean }> {
    try {
      const apiUrl = `${this.baseUrl}/api/v1/note/clear-recycle-bin`;
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`request failed with status ${resp.status}: ${errorText}`);
      }

      return { success: true };
    } catch (e) {
      throw e;
    }
  }

  /**
   * Upsert a note to Blinko.
   * @param content - The content of the note.
   * @param type - 0 for flash note, 1 for normal note.
   * @returns The created/updated note.
   */
  async upsertNote({ content, type = 0 }: { content: string; type?: 0 | 1 | 2 }): Promise<Note> {
    try {
      if (!content) {
        throw new Error("invalid content");
      }

      const apiUrl = `${this.baseUrl}/api/v1/note/upsert`;
      const reqBody = { content, type };

      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(reqBody),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`request failed with status ${resp.status}: ${errorText}`);
      }

      return await resp.json();
    } catch (e) {
      throw e;
    }
  }

  /**
   * Share a note or cancel sharing.
   * @param params - Share parameters including note ID and optional password
   * @returns The result of the share operation
   */
  async shareNote(params: ShareNoteParams): Promise<ShareNoteResult> {
    try {
      const apiUrl = `${this.baseUrl}/api/v1/note/share`;
      const reqBody = {
        id: params.id,
        isCancel: params.isCancel ?? false,
        password: params.password ?? "",
      };

      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(reqBody),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`request failed with status ${resp.status}: ${errorText}`);
      }

      const result = await resp.json();
      return {
        id: result.id,
        isShare: result.isShare,
        sharePassword: result.sharePassword,
        shareEncryptedUrl: result.shareEncryptedUrl,
      };
    } catch (e) {
      throw e;
    }
  }
}
