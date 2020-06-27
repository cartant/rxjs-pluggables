/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { expect } from "chai";
import { concat, of, NEVER, Subject } from "rxjs";
import { finalize } from "rxjs/operators";
import { refCountForever } from "./ref-count-forever";
import { shareWith } from "./share-with";

describe("refCountForever", () => {
  it("should not unsubscribe from the source", () => {
    let unsubscribed = false;
    const values: number[] = [];
    const source = concat(of(1, 2, 3), NEVER).pipe(
      finalize(() => (unsubscribed = true))
    );
    const shared = source.pipe(
      shareWith(() => new Subject<number>(), refCountForever())
    );
    const subscription = shared.subscribe((value) => values.push(value));
    expect(values).to.deep.equal([1, 2, 3]);
    subscription.unsubscribe();
    expect(unsubscribed).to.be.false;
  });
});
