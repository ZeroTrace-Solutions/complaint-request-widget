import { describe, expect, it } from "vitest";
import { mergeMissingDeep } from "../src/cli/jsonMerge";

describe("mergeMissingDeep", () => {
  it("adds only missing keys", () => {
    const current = {
      title: "Keep me",
      nested: {
        a: "one"
      }
    };

    const merged = mergeMissingDeep(current, {
      title: "Default title",
      nested: {
        a: "default one",
        b: "two"
      },
      addMe: "new"
    });

    expect(merged).toEqual({
      title: "Keep me",
      nested: {
        a: "one",
        b: "two"
      },
      addMe: "new"
    });
  });
});
