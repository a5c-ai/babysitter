/**
 * debt-closure-d39.test.ts — regression coverage for D-39.
 *
 * D-39 ("learn() blanks NodeView.kind when it co-authors a node's existence AND that node's
 * properties in one accept batch"): `learn()`'s accept-commit loop mints an explicit
 * `{kind:"node", eid, nodeKind}` existence candidate directly, but `ensureExistenceFor` — invoked
 * for a same-eid `node-prop` candidate in the SAME batch — could not see that staged-but-not-yet-
 * durable existence fact (its `getNode` liveness probe only reads durable facts, and
 * `stagedExistenceEids` tracked only eids it had itself synthesized). It therefore minted a SECOND,
 * `nodeKind`-less `{kind:"node", eid}` existence fact that folds over the explicit one and BLANKS
 * the projected `NodeView.kind`.
 *
 * Surfaced by high-level manual testing of the text/markdown → graph (`learn()`) path: a learned
 * person node carrying learned props came back with `kind === ""` while a sibling company node
 * (no learned props, so no synthesized duplicate) projected `kind === "company"` correctly.
 *
 * Fix (index.ts, learn() accept loop): pre-seed `stagedExistenceEids` with every eid that has an
 * explicit `node`/`edge` existence candidate in the batch, so `ensureExistenceFor` never mints a
 * kind-less duplicate. Order-independent; does not affect the D-36 test-(4) dedup path.
 */
import { afterEach, describe, expect, it } from "vitest";
import { KipRepo, type AssertInput } from "../index";
import {
  baseLearnOptions,
  buildManifest,
  decodeOk,
  encodeOk,
  freshReplicaId,
  lossOk,
  makeScriptedDispatch,
  nodePropAssert,
  registerManifest,
  FIXED_RAW_REF,
} from "./conformance/fixtures-m6";

function nodeExistence(eid: string, nodeKind: string): AssertInput {
  return {
    type: "assert",
    v: 1,
    target: { kind: "node", eid, nodeKind },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: "d39-scripted-encode",
    provenance: { author: "d39-scripted-encode", signature: "", publicKeyFingerprint: "", signedFields: [] },
  };
}

describe("D-39: learn() preserves NodeView.kind when a node's existence and its props are learned together", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const r of repos.splice(0)) r.close();
  });

  async function runLearn(candidates: AssertInput[]) {
    const encode = buildManifest({ name: "d39-encode" });
    const decode = buildManifest({ name: "d39-decode" });
    const learner = buildManifest({ name: "d39-learner" });
    const loss = buildManifest({ name: "d39-loss" });
    const { dispatch } = makeScriptedDispatch({
      [encode.name]: () => encodeOk(candidates),
      [decode.name]: () => decodeOk(),
      [loss.name]: () => lossOk(0.0), // converges immediately (threshold 0.5) → encode candidate accepted
    });
    const repo = new KipRepo({ replicaId: freshReplicaId("d39"), dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);
    const result = await repo.learn(
      FIXED_RAW_REF,
      baseLearnOptions({
        encode: { name: encode.name, version: encode.version },
        decode: { name: decode.name, version: decode.version },
        learner: { name: learner.name, version: learner.version },
        loss: { name: loss.name, version: loss.version },
      }),
    );
    expect(result.status).toBe("accept");
    return repo;
  }

  it("keeps nodeKind when the existence candidate PRECEDES its prop candidates", async () => {
    const eid = "d39/person/a";
    const repo = await runLearn([
      nodeExistence(eid, "person"),
      nodePropAssert(eid, "name", "Tal"),
      nodePropAssert(eid, "role", "CEO"),
    ]);
    const view = await repo.getNode(eid);
    expect(view).not.toBeNull();
    expect(view!.kind).toBe("person"); // was "" before the D-39 fix
  });

  it("keeps nodeKind when a prop candidate PRECEDES the existence candidate (order-independent)", async () => {
    const eid = "d39/person/b";
    const repo = await runLearn([
      nodePropAssert(eid, "name", "Tal"),
      nodeExistence(eid, "person"),
    ]);
    const view = await repo.getNode(eid);
    expect(view).not.toBeNull();
    expect(view!.kind).toBe("person");
  });

  it("does not blank a sibling node that has no learned props, and both coexist", async () => {
    const person = "d39/person/c";
    const company = "d39/company/c";
    const repo = await runLearn([
      nodeExistence(person, "person"),
      nodeExistence(company, "company"),
      nodePropAssert(person, "name", "Tal"),
    ]);
    const p = await repo.getNode(person);
    const c = await repo.getNode(company);
    expect(p!.kind).toBe("person");
    expect(c!.kind).toBe("company");
  });
});
