export type MentionParseResult = {
  names: string[];
  everyone: boolean;
};

export function parseMentions(message: string): MentionParseResult {
  const names = new Set<string>();
  const re = /@([a-zA-Z0-9_]{2,40})/g;
  let match: RegExpExecArray | null = re.exec(message);

  while (match) {
    const candidate = match[1].toLowerCase();
    if (candidate !== "everyone") {
      names.add(candidate);
    }
    match = re.exec(message);
  }

  return {
    names: [...names],
    everyone: /(^|\s)@everyone(\s|$)/i.test(message)
  };
}
