import { Word } from "./types";

/**
 * Strips emojis from a string using a comprehensive Unicode pattern.
 */
export function stripEmojis(text: string): string {
  if (!text) return "";
  // Removes Emoji_Presentation and Extended_Pictographic characters.
  return text
    .replace(
      /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]/gu,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Aligns emojis from the enhancedText (which is words + emojis) onto the original Word array.
 */
export function alignEmojisWithWords(words: Word[], enhancedText: string): Word[] {
  if (!words || words.length === 0) return [];
  const result = words.map((w) => ({ ...w }));

  let searchIndex = 0;
  for (let i = 0; i < result.length; i++) {
    const wordText = stripEmojis(result[i].text).toLowerCase();
    if (!wordText) continue;

    // Find the word in the enhanced text starting from searchIndex
    const index = enhancedText.toLowerCase().indexOf(wordText, searchIndex);
    if (index !== -1) {
      // Advance our search index past the word
      searchIndex = index + wordText.length;

      // Look ahead to find the boundary of the next word to capture any emojis placed between them
      let nextWordIndex = enhancedText.length;
      if (i < result.length - 1) {
        const nextWordText = stripEmojis(result[i + 1].text).toLowerCase();
        if (nextWordText) {
          const nextIndex = enhancedText.toLowerCase().indexOf(nextWordText, searchIndex);
          if (nextIndex !== -1) {
            nextWordIndex = nextIndex;
          }
        }
      }

      // Extract the segment between this word and the next word
      const segment = enhancedText.substring(index, nextWordIndex);

      // Extract all emojis in this segment
      const emojis =
        segment.match(
          /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1FA00}-\u{1FAFF}]/gu,
        ) || [];
      if (emojis.length > 0) {
        result[i].text = stripEmojis(result[i].text) + " " + emojis.join("");
      }
    }
  }

  return result;
}
