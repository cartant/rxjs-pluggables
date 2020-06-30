/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-pluggables
 */
/* eslint rxjs/no-ignored-subscription: "off" */

import { expect } from "chai";
import { concat, defer, NEVER, of } from "rxjs";
import { marbles } from "rxjs-marbles";
import { finalize } from "rxjs/operators";
import { limitedRefCount } from "./limited-ref-count";
import { shareWith } from "./share-with";

describe("limitedRefCount", () => {
  it("should support a synchronous source", () => {
    let subscribes = 0;
    let unsubscribes = 0;
    const values: number[] = [];

    const source = defer(() => {
      ++subscribes;
      return concat(of(1, 2, 3), NEVER).pipe(finalize(() => ++unsubscribes));
    });
    const shared = source.pipe(shareWith(limitedRefCount(2)));

    const a = shared.subscribe((value) => values.push(value));
    a.unsubscribe();
    expect(subscribes).to.equal(0);
    expect(values).to.deep.equal([]);
    expect(unsubscribes).to.equal(0);

    const b = shared.subscribe((value) => values.push(value));
    const c = shared.subscribe((value) => values.push(value));
    b.unsubscribe();
    c.unsubscribe();
    expect(subscribes).to.equal(1);
    expect(values).to.deep.equal([1, 1, 2, 2, 3, 3]);
    expect(unsubscribes).to.equal(1);
  });

  it("should not share multiple subscriptions to a synchronous source", () => {
    let subscribes = 0;
    let unsubscribes = 0;
    const values: number[] = [];

    const source = defer(() => {
      ++subscribes;
      return concat(of(1, 2, 3), NEVER).pipe(finalize(() => ++unsubscribes));
    });
    const shared = source.pipe(shareWith(limitedRefCount(2)));

    const a = shared.subscribe((value) => values.push(value));
    const b = shared.subscribe((value) => values.push(value));
    a.unsubscribe();
    b.unsubscribe();
    expect(subscribes).to.equal(1);
    expect(values).to.deep.equal([1, 1, 2, 2, 3, 3]);
    expect(unsubscribes).to.equal(1);

    const c = shared.subscribe((value) => values.push(value));
    const d = shared.subscribe((value) => values.push(value));
    c.unsubscribe();
    d.unsubscribe();
    expect(subscribes).to.equal(2);
    expect(values).to.deep.equal([1, 1, 2, 2, 3, 3, 1, 1, 2, 2, 3, 3]);
    expect(unsubscribes).to.equal(2);
  });

  it(
    "should honour the limit",
    marbles((m) => {
      const source = m.hot(" -1-2-3-4-5-6-7-");
      const sourceSub1 = "   --^-------!----";

      const sharedSub1 = "   ^-------!------";
      const expected1 = "    ---2-3-4-------";
      const sharedSub2 = "   --^-------!----";
      const expected2 = "    ---2-3-4-5-----";
      const sharedSub3 = "   ----^----------";
      const expected3 = "    -----3-4-5-----";

      const shared = source.pipe(shareWith(limitedRefCount(2)));
      m.expect(source).toHaveSubscriptions([sourceSub1]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);
      m.expect(shared, sharedSub3).toBeObservable(expected3);
    })
  );
});
