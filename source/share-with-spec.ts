/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { expect } from "chai";
import { ReplaySubject, Subject } from "rxjs";
import { marbles } from "rxjs-marbles";
import { shareWith } from "./share-with";

describe("shareWith", () => {
  it(
    "should indicate closing via a complete notification",
    marbles((m) => {
      let kind: "C" | "E" | undefined = undefined;
      let subject: Subject<string> | undefined = undefined;

      const source = m.cold(" a-|");
      //                      a-#
      const sub1 = "          ^------";
      const time1 = m.time("  -|-----");
      const out1 = "          a-|----";
      //                         a-#
      const sub2 = "          ---^---";
      const time2 = m.time("  ----|--");
      const out2 = "          ---a-|-";
      const time3 = m.time("  ------|");

      const result = source.pipe(
        shareWith((k, s) => {
          kind = k;
          subject = s;
          return new Subject<string>();
        })
      );
      m.expect(result, sub1).toBeObservable(out1);
      m.expect(result, sub2).toBeObservable(out2);

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
      const sub1 = "          ^------";
      const time1 = m.time("  -|-----");
      const out1 = "          a-#----";
      //                         a-#
      const sub2 = "          ---^---";
      const time2 = m.time("  ----|--");
      const out2 = "          ---a-#-";
      const time3 = m.time("  ------|");

      const result = source.pipe(
        shareWith((k, s) => {
          kind = k;
          subject = s;
          return new Subject<string>();
        })
      );
      m.expect(result, sub1).toBeObservable(out1);
      m.expect(result, sub2).toBeObservable(out2);

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
      const sub1 = "          ^-!----";
      const time1 = m.time("  -|-----");
      const out1 = "          a------";
      //                         a--
      const sub2 = "          ---^-!-";
      const time2 = m.time("  ----|--");
      const out2 = "          ---a---";
      const time3 = m.time("  ------|");

      const result = source.pipe(
        shareWith((k, s) => {
          kind = k;
          subject = s;
          return new Subject<string>();
        })
      );
      m.expect(result, sub1).toBeObservable(out1);
      m.expect(result, sub2).toBeObservable(out2);

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
      const source = m.cold(" ab|");
      const sub0 = "          ^-!";
      //                      ab|
      const sub1 = "          ^-------";
      const out1 = "          ab|-----";
      //                         ab|
      const sub2 = "          ---^----";
      const out2 = "          ---(b|)-";

      const result = source.pipe(
        shareWith((kind, subject) =>
          kind === "C" && subject ? subject : new ReplaySubject<string>(1)
        )
      );
      m.expect(result, sub1).toBeObservable(out1);
      m.expect(result, sub2).toBeObservable(out2);
      m.expect(source).toHaveSubscriptions([sub0]);
    })
  );
});
