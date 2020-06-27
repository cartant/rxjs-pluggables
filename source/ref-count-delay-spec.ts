/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { expect } from "chai";
import { asyncScheduler, concat, NEVER, of, Subject } from "rxjs";
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
    const shared = source.pipe(
      shareWith(() => new Subject<number>(), refCountDelay(10))
    );
    const subscription = shared.subscribe((value) => values.push(value));
    expect(values).to.deep.equal([1, 2, 3]);
    subscription.unsubscribe();
    expect(unsubscribed).to.be.false;
    asyncScheduler.schedule(() => {
      expect(unsubscribed).to.be.true;
      done();
    }, 20);
  });
});
