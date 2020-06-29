/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { expect } from "chai";
import { concat, of, NEVER } from "rxjs";
import { marbles } from "rxjs-marbles";
import { finalize } from "rxjs/operators";
import { noRefCount } from "./no-ref-count";
import { shareWith } from "./share-with";

describe("noRefCount", () => {
  it("should not unsubscribe from the source", () => {
    let unsubscribes = 0;
    const values: number[] = [];
    const source = concat(of(1, 2, 3), NEVER).pipe(
      finalize(() => ++unsubscribes)
    );
    const shared = source.pipe(shareWith(noRefCount()));
    const subscription = shared.subscribe((value) => values.push(value));
    expect(values).to.deep.equal([1, 2, 3]);
    subscription.unsubscribe();
    expect(unsubscribes).to.equal(0);
  });

  it(
    "should subscribe to the source once",
    marbles((m) => {
      const source = m.cold(" -1-2-3----4--");
      const sourceSub1 = "    ^------------";

      const sharedSub1 = "    ^------------";
      const expected1 = "     -1-2-3----4--";
      const sharedSub2 = "    ----^--------";
      const expected2 = "     -----3----4--";
      const sharedSub3 = "    --------^----";
      const expected3 = "     ----------4--";

      const shared = source.pipe(shareWith(noRefCount()));
      m.expect(source).toHaveSubscriptions([sourceSub1]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);
      m.expect(shared, sharedSub3).toBeObservable(expected3);
    })
  );

  it(
    "should not unsubscribe on a ref count of zero",
    marbles((m) => {
      const source = m.cold(" -1-2-3----4--");
      const sourceSub1 = "    ^------------";

      const sharedSub1 = "    ^-----------!";
      const expected1 = "     -1-2-3----4--";
      const sharedSub2 = "    ----^-------!";
      const expected2 = "     -----3----4--";
      const sharedSub3 = "    --------^---!";
      const expected3 = "     ----------4--";

      const shared = source.pipe(shareWith(noRefCount()));
      m.expect(source).toHaveSubscriptions([sourceSub1]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);
      m.expect(shared, sharedSub3).toBeObservable(expected3);
    })
  );

  it(
    "should unsubscribe on completion",
    marbles((m) => {
      const source = m.cold(" -1-2-3----4-|");
      const sourceSub1 = "    ^-----------!";

      const sharedSub1 = "    ^------------";
      const expected1 = "     -1-2-3----4-|";
      const sharedSub2 = "    ----^--------";
      const expected2 = "     -----3----4-|";
      const sharedSub3 = "    --------^----";
      const expected3 = "     ----------4-|";

      const shared = source.pipe(shareWith(noRefCount()));
      m.expect(source).toHaveSubscriptions([sourceSub1]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);
      m.expect(shared, sharedSub3).toBeObservable(expected3);
    })
  );

  it(
    "should unsubscribe on completion",
    marbles((m) => {
      const source = m.cold(" -1-2-3----4-#");
      const sourceSub1 = "    ^-----------!";

      const sharedSub1 = "    ^------------";
      const expected1 = "     -1-2-3----4-#";
      const sharedSub2 = "    ----^--------";
      const expected2 = "     -----3----4-#";
      const sharedSub3 = "    --------^----";
      const expected3 = "     ----------4-#";

      const shared = source.pipe(shareWith(noRefCount()));
      m.expect(source).toHaveSubscriptions([sourceSub1]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);
      m.expect(shared, sharedSub3).toBeObservable(expected3);
    })
  );
});
