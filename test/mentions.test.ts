import { describe, expect, it } from "vitest";
import { parseMentions } from "../src/lib/mentions";

describe("parseMentions", () => {
  it("extracts usernames and @everyone", () => {
    const result = parseMentions("Hey @Alex and @maria and @everyone");
    expect(result.names).toEqual(["alex", "maria"]);
    expect(result.everyone).toBe(true);
  });

  it("deduplicates repeated mentions", () => {
    const result = parseMentions("@alex hi @alex again");
    expect(result.names).toEqual(["alex"]);
    expect(result.everyone).toBe(false);
  });
});
