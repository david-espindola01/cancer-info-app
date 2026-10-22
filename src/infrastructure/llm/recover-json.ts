const CLOSERS: Record<string, string> = { "{": "}", "[": "]" };

/**
 * gpt-oss sometimes opens its answer with a stray «[» before the object
 * (`[\n{"ui":[...]\n]`), so Groq rejects it. This recovers only that case: it drops the
 * stray bracket and closes the ones left open. Returns null for anything else (other
 * malformed JSON, or an answer cut off inside a text), so the caller asks again.
 */
export function recoverJson(text: string): unknown {
  const body = text.trim().match(/^\[\s*(\{[\s\S]*)$/)?.[1];
  if (!body) return null;

  const open: string[] = [];
  let inString = false;
  let escaped = false;
  let end = body.length;
  for (let i = 0; i < body.length; i += 1) {
    const char = body[i]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') {
      inString = true;
    } else if (char === "{" || char === "[") {
      open.push(char);
    } else if (char === "}" || char === "]") {
      if (open.length === 0) {
        // The stray bracket's closer: everything after it must be blank.
        end = i;
        break;
      }
      if (CLOSERS[open.pop()!] !== char) return null;
    }
  }
  if (inString || body.slice(end + 1).trim() !== "") return null;

  try {
    return JSON.parse(body.slice(0, end) + open.reverse().map((char) => CLOSERS[char]).join(""));
  } catch {
    return null;
  }
}
