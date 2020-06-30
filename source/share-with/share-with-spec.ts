/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-pluggables
 */

import { expect } from "chai";
import { ReplaySubject, Subject } from "rxjs";
import { marbles } from "rxjs-marbles";
import { defaultRefCountOperator } from "./default-ref-count";
import { shareWith } from "./share-with";

describe("shareWith", () => {
  it(
    "should indicate closing via a complete notification",
    marbles((m) => {
      let kind: "C" | "E" | undefined = undefined;
      let subject: Subject<string> | undefined = undefined;

      const source = m.cold(" a-|");
      //                      a-#
      const sourceSub1 = "    ^-!----";
      const sharedSub1 = "    ^------";
      const time1 = m.time("  -|-----");
      const expected1 = "     a-|----";
      //                         a-#
      const sourceSub2 = "    ---^-!-";
      const sharedSub2 = "    ---^---";
      const time2 = m.time("  ----|--");
      const expected2 = "     ---a-|-";
      const time3 = m.time("  ------|");

      const shared = source.pipe(
        shareWith({
          operator: (connect) => defaultRefCountOperator(connect),
          reuseSubject: (state) => {
            kind = state.kind;
            subject = state.subject;
            return false;
          },
        })
      );
      m.expect(source).toHaveSubscriptions([sourceSub1, sourceSub2]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);

      m.scheduler.schedule(() => {
        expect(kind).to.equal(undefined);
        expect(subject).to.be.undefined;
      }, time1);
      m.scheduler.schedule(() => {
        expect(kind).to.equal("C");
        expect(subject).to.not.be.undefined;
      }, time2);
      m.scheduler.schedule(() => {
        expect(kind).to.equal("C");
        expect(subject).to.not.be.undefined;
      }, time3);
    })
  );

  it(
    "should indicate closing via an error notification",
    marbles((m) => {
      let kind: "C" | "E" | undefined = undefined;
      let subject: Subject<string> | undefined = undefined;

      const source = m.cold(" a-#");
      //                      a-#
      const sourceSub1 = "    ^-!----";
      const sharedSub1 = "    ^------";
      const time1 = m.time("  -|-----");
      const expected1 = "     a-#----";
      //                         a-#
      const sourceSub2 = "    ---^-!-";
      const sharedSub2 = "    ---^---";
      const time2 = m.time("  ----|--");
      const expected2 = "     ---a-#-";
      const time3 = m.time("  ------|");

      const shared = source.pipe(
        shareWith({
          operator: (connect) => defaultRefCountOperator(connect),
          reuseSubject: (state) => {
            kind = state.kind;
            subject = state.subject;
            return false;
          },
        })
      );
      m.expect(source).toHaveSubscriptions([sourceSub1, sourceSub2]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);

      m.scheduler.schedule(() => {
        expect(kind).to.equal(undefined);
        expect(subject).to.be.undefined;
      }, time1);
      m.scheduler.schedule(() => {
        expect(kind).to.equal("E");
        expect(subject).to.not.be.undefined;
      }, time2);
      m.scheduler.schedule(() => {
        expect(kind).to.equal("E");
        expect(subject).to.not.be.undefined;
      }, time3);
    })
  );

  it(
    "should indicate closing via an unsubscription",
    marbles((m) => {
      let kind: "C" | "E" | undefined = undefined;
      let subject: Subject<string> | undefined = undefined;

      const source = m.cold(" a--");
      //                      a--
      const sharedSub1 = "    ^-!----";
      const time1 = m.time("  -|-----");
      const expected1 = "     a------";
      //                         a--
      const sharedSub2 = "    ---^-!-";
      const time2 = m.time("  ----|--");
      const expected2 = "     ---a---";
      const time3 = m.time("  ------|");

      const shared = source.pipe(
        shareWith({
          operator: (connect) => defaultRefCountOperator(connect),
          reuseSubject: (state) => {
            kind = state.kind;
            subject = state.subject;
            return false;
          },
        })
      );
      m.expect(source).toHaveSubscriptions([sharedSub1, sharedSub2]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);

      m.scheduler.schedule(() => {
        expect(kind).to.equal(undefined);
        expect(subject).to.be.undefined;
      }, time1);
      m.scheduler.schedule(() => {
        expect(kind).to.equal(undefined);
        expect(subject).to.not.be.undefined;
      }, time2);
      m.scheduler.schedule(() => {
        expect(kind).to.equal(undefined);
        expect(subject).to.not.be.undefined;
      }, time3);
    })
  );

  it(
    "should be able to reuse the subject",
    marbles((m) => {
      const source = m.cold(" ab|     ");
      //                      ab|
      const sourceSub1 = "    ^-!     ";
      const sharedSub1 = "    ^-------";
      const expected1 = "     ab|-----";
      //                         ab|
      const sharedSub2 = "    ---^----";
      const expected2 = "     ---(b|)-";

      const shared = source.pipe(
        shareWith(
          {
            operator: (connect) => defaultRefCountOperator(connect),
            reuseSubject: () => true,
          },
          () => new ReplaySubject(1)
        )
      );
      m.expect(source).toHaveSubscriptions([sourceSub1]);
      m.expect(shared, sharedSub1).toBeObservable(expected1);
      m.expect(shared, sharedSub2).toBeObservable(expected2);
    })
  );
});
