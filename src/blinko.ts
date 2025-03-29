/**
 * Blinko client used to interact with the Blinko API.
 */
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
