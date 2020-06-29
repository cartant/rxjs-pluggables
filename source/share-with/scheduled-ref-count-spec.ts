/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { expect } from "chai";
import { asapScheduler, concat, defer, NEVER, of, queueScheduler } from "rxjs";
import { finalize } from "rxjs/operators";
import { scheduledRefCount } from "./scheduled-ref-count";
import { shareWith } from "./share-with";

describe("scheduledRefCount", () => {
  it("should support a synchronous source", (done: Mocha.Done) => {
    let unsubscribes = 0;
    const values: number[] = [];
    const source = concat(of(1, 2, 3), NEVER).pipe(
      finalize(() => ++unsubscribes)
    );

    const shared = source.pipe(shareWith(scheduledRefCount(asapScheduler)));
    const subscription = shared.subscribe((value) => values.push(value));
    expect(values).to.deep.equal([]);
    asapScheduler.schedule(() => {
      expect(values).to.deep.equal([1, 2, 3]);
      subscription.unsubscribe();
      expect(unsubscribes).to.equal(0);
    });
    asapScheduler.schedule(() => {
      expect(unsubscribes).to.equal(1);
      done();
    }, 10);
  });

  it("should support queue-scheduled actions", () => {
    let receives = 0;
    let subscribes = 0;

    const source = defer(() => {
      ++subscribes;
      return of(42);
    });

    queueScheduler.schedule(() => {
      const subscription = source
        .pipe(shareWith(scheduledRefCount(queueScheduler)))
        .subscribe(() => ++receives);
      subscription.unsubscribe();
    });

    expect(receives).to.equal(0);
    expect(subscribes).to.equal(0);

    queueScheduler.schedule(() => {
      const subscription = source
        .pipe(shareWith(scheduledRefCount(queueScheduler)))
        .subscribe(() => ++receives);
      queueScheduler.schedule(() => {
        subscription.unsubscribe();
      });
    });

    expect(receives).to.equal(1);
    expect(subscribes).to.equal(1);
  });
});
