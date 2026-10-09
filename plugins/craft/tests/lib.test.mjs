import assert from "node:assert/strict";
import { test } from "node:test";
import { repoKeyFromRemote } from "../hooks/lib.mjs";

test("repo key is the same for ssh and https remotes", () => {
  const expected = "github.com-shekey-pijaca";
  assert.equal(repoKeyFromRemote("git@github.com:Shekey/pijaca.git"), expected);
  assert.equal(repoKeyFromRemote("https://github.com/Shekey/pijaca.git"), expected);
  assert.equal(repoKeyFromRemote("https://user@github.com/Shekey/pijaca"), expected);
});
