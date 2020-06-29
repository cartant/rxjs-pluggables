/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */
/* eslint rxjs/no-ignored-subscription: "off" */

import { expect } from "chai";
import { concat, defer, NEVER, of } from "rxjs";
import { marbles } from "rxjs-marbles";
import { finalize } from "rxjs/operators";
import { defaultRefCount } from "./default-ref-count";
import { shareWith } from "./share-with";

describe("defaultRefCount", () => {
  it("should support a synchronous source", () => {
    let unsubscribes = 0;
    const values: number[] = [];

    const source = concat(of(1, 2, 3), NEVER).pipe(
      finalize(() => ++unsubscribes)
    );
    const shared = source.pipe(shareWith(defaultRefCount()));

    const subscription = shared.subscribe((value) => values.push(value));
    expect(values).to.deep.equal([1, 2, 3]);
    subscription.unsubscribe();
    expect(unsubscribes).to.equal(1);
  });

  it("should not share multiple subscriptions to a synchronous source", () => {
    let completes = 0;
    let subscribes = 0;
    const values: number[] = [];

    const source = defer(() => {
      ++subscribes;
      return of(1, 2, 3);
    });
    const shared = source.pipe(shareWith(defaultRefCount()));

    shared.subscribe({
      complete() {
        ++completes;
      },
      next(value) {
        values.push(value);
      },
    });
    expect(completes).to.equal(1);
    expect(subscribes).to.equal(1);
    expect(values).to.deep.equal([1, 2, 3]);

    shared.subscribe({
      complete() {
        ++completes;
      },
      next(value) {
        values.push(value);
      },
    });
    expect(completes).to.equal(2);
    expect(subscribes).to.equal(2);
    expect(values).to.deep.equal([1, 2, 3, 1, 2, 3]);
  });

  it(
    "should share concurrent subscriptions",
    marbles((m) => {
      const source = m.cold(" -1-2-3|        ");
      const sourceSub1 = "    ^-----!        ";
      //                              -1-2-3|
      const sourceSub2 = "    --------^-----!";

      const sharedSub1 = "    ^--------------";
      const expected1 = "     -1-2-3|        ";
      const sharedSub2 = "    ----^----------";
      const expected2 = "     -----3|        ";
      const sharedSub3 = "    --------^------";
      const expected3 = "     ---------1-2-3|";

      const shared = source.pipe(shareWith(defaultRefCount()));
      m.expect(source).toHaveSubscriptions([sourceSub1, sourceSub2]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);
      m.expect(shared, sharedSub3).toBeObservable(expected3);
    })
  );
});
