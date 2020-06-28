/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */
/* eslint rxjs/no-ignored-subscription: "off" */

import { expect } from "chai";
import { asyncScheduler, concat, defer, NEVER, of, ReplaySubject } from "rxjs";
import { marbles } from "rxjs-marbles";
import { finalize } from "rxjs/operators";
import { refCountDelay } from "./ref-count-delay";
import { shareWith } from "./share-with";

describe("refCountDelay", () => {
  it("should support a synchronous source", (done: Mocha.Done) => {
    let unsubscribed = false;
    const values: number[] = [];

    const source = concat(of(1, 2, 3), NEVER).pipe(
      finalize(() => (unsubscribed = true))
    );
    const shared = source.pipe(shareWith(refCountDelay(10)));

    const subscription = shared.subscribe((value) => values.push(value));
    expect(values).to.deep.equal([1, 2, 3]);
    subscription.unsubscribe();
    expect(unsubscribed).to.be.false;

    asyncScheduler.schedule(() => {
      expect(unsubscribed).to.be.true;
      done();
    }, 20);
  });

  it("should support multiple subscriptions to a synchronous source", (done: Mocha.Done) => {
    let completes = 0;
    let subscribes = 0;
    const values: number[] = [];

    const source = defer(() => {
      ++subscribes;
      return of(1, 2, 3);
    });
    const shared = source.pipe(shareWith(refCountDelay(0)));

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
    expect(subscribes).to.equal(1);
    expect(values).to.deep.equal([1, 2, 3]);

    asyncScheduler.schedule(() => {
      done();
    });
  });

  it(
    "should multicast to multiple observers and complete",
    marbles((m) => {
      const source = m.cold(" -1-2-3----4-|");
      const sourceSub1 = "    ^-----------!";
      const delay = m.time("  --|          ");

      const sharedSub1 = "    ^------------";
      const expected1 = "     -1-2-3----4-|";
      const sharedSub2 = "    ----^--------";
      const expected2 = "     -----3----4-|";
      const sharedSub3 = "    --------^----";
      const expected3 = "     ----------4-|";

      const shared = source.pipe(shareWith(refCountDelay(delay)));
      m.expect(source).toHaveSubscriptions([sourceSub1]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);
      m.expect(shared, sharedSub3).toBeObservable(expected3);
    })
  );

  it(
    "should multicast an error to multiple observers",
    marbles((m) => {
      const source = m.cold(" -1-2-3----4-#");
      const sourceSub1 = "    ^-----------!";
      const delay = m.time("  --|          ");

      const sharedSub1 = "    ^------------";
      const expected1 = "     -1-2-3----4-#";
      const sharedSub2 = "    ----^--------";
      const expected2 = "     -----3----4-#";
      const sharedSub3 = "    --------^----";
      const expected3 = "     ----------4-#";

      const shared = source.pipe(shareWith(refCountDelay(delay)));
      m.expect(source).toHaveSubscriptions([sourceSub1]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);
      m.expect(shared, sharedSub3).toBeObservable(expected3);
    })
  );

  it(
    "should disconnect after the specified duration once the last subscriber unsubscribes",
    marbles((m) => {
      const source = m.cold(" -1-2-3----4---");
      const sourceSub1 = "    ^-------------!";
      const delay = m.time("      --|        ");
      //                          --|
      const sharedSub1 = "    ^---!----------";
      const expected1 = "     -1-2-----------";
      //                               --|
      const sharedSub2 = "    ----^----!-----";
      const expected2 = "     -----3---------";
      //                                  --|
      const sharedSub3 = "    --------^---!--";
      const expected3 = "     ----------4----";

      const shared = source.pipe(shareWith(refCountDelay(delay)));
      m.expect(source).toHaveSubscriptions([sourceSub1]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);
      m.expect(shared, sharedSub3).toBeObservable(expected3);
    })
  );

  it(
    "should not disconnect if a subscription occurs within the duration",
    marbles((m) => {
      const source = m.cold(" -1-2-3----4-5---");
      const sourceSub1 = "    ^--------------!";
      const delay = m.time("         --|      ");
      //                             --|
      const sharedSub1 = "    ^------!        ";
      const expected1 = "     -1-2-3--        ";
      //                               --|
      const sharedSub2 = "    ----^----!      ";
      const expected2 = "     -----3----      ";
      //                                   --|
      const sharedSub3 = "    -----------^-!  ";
      const expected3 = "     ------------5-  ";

      const shared = source.pipe(shareWith(refCountDelay(delay)));
      m.expect(source).toHaveSubscriptions([sourceSub1]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);
      m.expect(shared, sharedSub3).toBeObservable(expected3);
    })
  );

  it(
    "should reconnect if a subscription occurs after the duration",
    marbles((m) => {
      const source = m.cold(" -1-2-3----4-5---------");
      const sourceSub1 = "    ^----------!          ";
      const sourceSub2 = "    -----------------^---!";
      const delay = m.time("         --|            ");
      //                             --|
      const sharedSub1 = "    ^------!              ";
      const expected1 = "     -1-2-3--              ";
      //                               --|
      const sharedSub2 = "    ----^----!            ";
      const expected2 = "     -----3----            ";
      //                                         --|
      const sharedSub3 = "    -----------------^-!  ";
      const expected3 = "     ------------------1-  ";

      const shared = source.pipe(shareWith(refCountDelay(delay)));
      m.expect(source).toHaveSubscriptions([sourceSub1, sourceSub2]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);
      m.expect(shared, sharedSub3).toBeObservable(expected3);
    })
  );

  it(
    "should support a ReplaySubject",
    marbles((m) => {
      const source = m.cold(" --(r|)                   ");
      const sourceSub1 = "    ^-!                      ";
      const sourceSub2 = "    -----------------^-!     ";
      const delay = m.time("    -----|                 ");
      //                        -----|
      const sharedSub1 = "    ^--                      ";
      const expected1 = "     --(r|)                   ";
      //                            -----|
      const sharedSub2 = "    ------^--                ";
      const expected2 = "     ------(r|)               ";
      //                                         -----|
      const sharedSub3 = "    -----------------^--     ";
      const expected3 = "     -------------------(r|)  ";

      // Note that when a multicast source completes or errors and effects the
      // unsubscription of the subject, the subject is nulled. So the following
      // factory needs to look at what effected the unsubscription and needs to
      // decide whether or not to reuse the subject.

      const shared = source.pipe(
        shareWith(refCountDelay(delay), (kind, previousSubject) =>
          kind === "C" && previousSubject
            ? previousSubject
            : new ReplaySubject(1)
        )
      );
      m.expect(source).toHaveSubscriptions([sourceSub1, sourceSub2]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);
      m.expect(shared, sharedSub3).toBeObservable(expected3);
    })
  );
});
