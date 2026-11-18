import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ObjectId } from "mongodb";

import { opmlController } from "../lib/controllers/opml.js";

const userId = "reader";
const channels = [
  { _id: new ObjectId(), uid: "projects", name: "Projects", userId },
  { _id: new ObjectId(), uid: "news", name: "News & Notes", userId },
  { _id: new ObjectId(), uid: "empty", name: "Empty", userId },
  { _id: new ObjectId(), uid: "other", name: "Other", userId: "another-reader" },
];
const feedUrls = new Map([
  [channels[0]._id, ["https://projects.example/atom.xml"]],
  [channels[1]._id, ["https://news.example/feed.xml"]],
  [channels[3]._id, ["https://other.example/feed.xml"]],
]);

describe("exportOpml", () => {
  it("exports the user's subscribed feeds grouped by channel", async () => {
    const application = {
      collections: new Map([
        [
          "microsub_channels",
          {
            find: (filter) => ({
              sort: () => ({
                toArray: async () =>
                  channels.filter((channel) => channel.userId === filter.userId),
              }),
            }),
          },
        ],
        [
          "microsub_items",
          { aggregate: () => ({ toArray: async () => [] }) },
        ],
        [
          "microsub_feeds",
          {
            find: ({ channelId }) => ({
              toArray: async () =>
                (feedUrls.get(channelId) ?? []).map((url) => ({ url })),
            }),
          },
        ],
      ]),
    };
    const request = {
      app: {
        locals: { application, publication: { me: "https://reader.example/" } },
      },
      session: { userId },
    };
    const headers = new Map();
    let body;
    const response = {
      set: (name, value) => headers.set(name, value),
      send: (value) => {
        body = value;
      },
    };

    await opmlController.exportOpml(request, response);

    assert.equal(headers.get("Content-Type"), "text/x-opml");
    assert.match(
      body,
      /<title>reader\.example - Microsub Subscriptions<\/title>/,
    );
    assert.match(
      body,
      /<outline text="Projects"[^>]*>\s+<outline [^>]*xmlUrl="https:\/\/projects\.example\/atom\.xml"/,
    );
    assert.match(
      body,
      /<outline text="News &amp; Notes"[^>]*>\s+<outline [^>]*xmlUrl="https:\/\/news\.example\/feed\.xml"/,
    );
    assert.doesNotMatch(body, /text="Empty"|other\.example/);
  });
});
