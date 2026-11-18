import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ObjectId } from "mongodb";

import { getFeedById, getFeedBySubscriptionId } from "../lib/storage/feeds.js";

describe("getFeedBySubscriptionId", () => {
  it("returns null for a malformed id instead of throwing", async () => {
    const application = { collections: new Map() };

    assert.equal(
      await getFeedBySubscriptionId(application, "not-an-object-id"),
      null,
    );
  });

  it("looks up a valid hex id and preserves ObjectId callers", async () => {
    const id = new ObjectId();
    const feed = { _id: id, url: "https://reader.example/feed.xml" };
    const collection = {
      findOne: async ({ _id }) => {
        assert.ok(_id instanceof ObjectId);
        assert.ok(_id.equals(id));
        return feed;
      },
    };
    const application = {
      collections: new Map([["microsub_feeds", collection]]),
    };

    assert.equal(
      await getFeedBySubscriptionId(application, id.toHexString()),
      feed,
    );
    assert.equal(await getFeedById(application, id), feed);
  });
});
