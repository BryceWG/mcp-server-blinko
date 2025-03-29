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
  createdAt: string;
  updatedAt: string;
}

export class BlinkoClient {
  private readonly domain: string;
  private readonly apiKey: string;

  /**
   * Create a new Blinko client.
   * @param domain - The domain of Blinko service.
   * @param apiKey - The API key for authentication.
   */
  constructor({ domain, apiKey }: { domain: string; apiKey: string }) {
    this.domain = domain;
    this.apiKey = apiKey;
  }

  /**
   * Search notes in Blinko.
   * @param params - Search parameters.
   * @returns Array of matching notes.
   */
  async searchNotes(params: SearchNotesParams): Promise<Note[]> {
    try {
      const apiUrl = `https://${this.domain}/api/v1/note/list`;
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
      const apiUrl = `https://${this.domain}/api/v1/note/daily-review-list`;
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
      const apiUrl = `https://${this.domain}/api/v1/note/clear-recycle-bin`;
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
   * @returns The result of the operation.
   */
  async upsertNote({ content, type = 0 }: { content: string; type?: 0 | 1 }) {
    try {
      if (!content) {
        throw new Error("invalid content");
      }

      const apiUrl = `https://${this.domain}/api/v1/note/upsert`;
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

      return { success: true };
    } catch (e) {
      throw e;
    }
  }
}
