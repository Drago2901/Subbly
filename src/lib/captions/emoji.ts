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

  // Helper to clean a string for comparison (strip emojis, punctuation, spacing)
  const clean = (str: string) => {
    return stripEmojis(str)
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, "")
      .trim()
      .toLowerCase();
  };

  // Split enhancedText into tokens
  const tokens = enhancedText.split(/\s+/).filter(Boolean);

  let tokenIdx = 0;

  for (let i = 0; i < result.length; i++) {
    const target = clean(result[i].text);
    if (!target) continue;

    // Find the next token in enhancedText that matches this word
    let matchIdx = -1;
    for (let j = tokenIdx; j < tokens.length; j++) {
      const cleanedToken = clean(tokens[j]);
      if (cleanedToken.includes(target) || target.includes(cleanedToken)) {
        matchIdx = j;
        break;
      }
    }

    if (matchIdx !== -1) {
      // Find any emojis in the tokens between the previous index (tokenIdx) and the current match index (matchIdx),
      // or directly inside/attached to the current matched token.
      const collectedEmojis: string[] = [];

      // 1. Check for emojis in the matched token itself
      const matchedToken = tokens[matchIdx];
      const emojisInMatch = matchedToken.match(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1FA00}-\u{1FAFF}]/gu);
      if (emojisInMatch) {
        collectedEmojis.push(...emojisInMatch);
      }

      // 2. Check for separate emoji tokens between tokenIdx and matchIdx
      for (let k = tokenIdx; k < matchIdx; k++) {
        const token = tokens[k];
        const emojis = token.match(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1FA00}-\u{1FAFF}]/gu);
        if (emojis) {
          collectedEmojis.push(...emojis);
        }
      }

      // 3. Look ahead: if the next tokens are purely emojis (until we hit a text word), collect them too!
      let nextTokenIdx = matchIdx + 1;
      while (nextTokenIdx < tokens.length) {
        const nextToken = tokens[nextTokenIdx];
        const cleanedNext = clean(nextToken);
        // If the next token has no text letters/numbers (just emojis/punctuation), it's an emoji token
        if (cleanedNext === "") {
          const emojis = nextToken.match(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1FA00}-\u{1FAFF}]/gu);
          if (emojis) {
            collectedEmojis.push(...emojis);
          }
          nextTokenIdx++;
        } else {
          break; // Hit a text word, stop looking ahead
        }
      }

      if (collectedEmojis.length > 0) {
        // Remove duplicate emojis to keep it clean
        const uniqueEmojis = Array.from(new Set(collectedEmojis));
        result[i].text = stripEmojis(result[i].text) + " " + uniqueEmojis.join("");
      }

      // Move our search cursor to the next token after the matched one (and any trailing emojis)
      tokenIdx = nextTokenIdx;
    }
  }

  return result;
}
