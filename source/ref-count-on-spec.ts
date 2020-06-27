/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { expect } from "chai";
import { asapScheduler, concat, NEVER, of, Subject } from "rxjs";
import { finalize } from "rxjs/operators";
import { refCountOn } from "./ref-count-on";
import { shareWith } from "./share-with";

describe("refCountOn", () => {
  it("should support a synchronous source", (done: Mocha.Done) => {
    let unsubscribed = false;
    const values: number[] = [];
    const source = concat(of(1, 2, 3), NEVER).pipe(
      finalize(() => (unsubscribed = true))
    );
    const shared = source.pipe(
      shareWith(() => new Subject<number>(), refCountOn(asapScheduler))
    );
    const subscription = shared.subscribe((value) => values.push(value));
    expect(values).to.deep.equal([]);
    asapScheduler.schedule(() => {
      expect(values).to.deep.equal([1, 2, 3]);
      subscription.unsubscribe();
      expect(unsubscribed).to.be.false;
    });
    asapScheduler.schedule(() => {
      expect(unsubscribed).to.be.true;
      done();
    }, 10);
  });
});
