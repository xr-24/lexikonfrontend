class DictionaryService {
  private words: Set<string> | null = null;
  private loadingPromise: Promise<void> | null = null;

  async loadDictionary(): Promise<void> {
    if (this.words) {
      return; // Already loaded
    }

    if (this.loadingPromise) {
      return this.loadingPromise; // Already loading
    }

    this.loadingPromise = this.fetchAndParseDictionary();
    return this.loadingPromise;
  }

  private async fetchAndParseDictionary(): Promise<void> {
    try {
      const response = await fetch('/sowpods.txt');
      if (!response.ok) {
        throw new Error(`Failed to fetch dictionary: ${response.status}`);
      }
      
      const text = await response.text();
      const words = text
        .split('\n')
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length > 0);
      
      this.words = new Set(words);
      console.log(`Dictionary loaded with ${this.words.size} words`);
    } catch (error) {
      console.error('Error loading dictionary:', error);
      throw error;
    }
  }

  async isValidWord(word: string): Promise<boolean> {
    if (!word || word.length === 0) {
      return false;
    }

    await this.loadDictionary();
    
    if (!this.words) {
      throw new Error('Dictionary not loaded');
    }

    return this.words.has(word.toUpperCase());
  }

  getDictionarySize(): number {
    return this.words ? this.words.size : 0;
  }

  isDictionaryLoaded(): boolean {
    return this.words !== null;
  }
}

// Export a singleton instance
export const dictionaryService = new DictionaryService();
