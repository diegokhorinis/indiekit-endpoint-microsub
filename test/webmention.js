import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { receive } from "../lib/webmention/receiver.js";

describe("webmention receiver", () => {
  it("rejects an empty request with 400", async () => {
    const response = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
      },
    };

    await receive({}, response);

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error, "invalid_request");
  });
});
