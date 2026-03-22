import { describe, expect, it } from "vitest";
import { submitComplaint } from "../src/request";

describe("submitComplaint security", () => {
  it("rejects unsafe endpoint schemes", async () => {
    await expect(
      submitComplaint(
        {
          body: "test",
          selectedElement: null,
          page: {
            title: "t",
            url: "https://example.com",
            language: "en",
            direction: "ltr"
          },
          createdAt: new Date().toISOString()
        },
        "javascript:alert(1)"
      )
    ).rejects.toThrow(/protocol/i);
  });
});
