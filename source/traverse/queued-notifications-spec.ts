/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-pluggables
 */
/* eslint rxjs/no-ignored-subscription: "off" */

import { AsyncSubject } from "rxjs";
import { marbles } from "rxjs-marbles";
import { concatMap } from "rxjs/operators";
import { QueuedNotifications } from "./queued-notifications";

describe("QueuedNotifications", () => {
  it(
    "should emit nothing without a notification",
    marbles((m) => {
      const notifier = m.hot("  --");
      const queuings = m.cold(" q-");
      const expected = m.cold(" --");

      const notifications = new QueuedNotifications(notifier);
      notifications.connect();

      const result = queuings.pipe(
        concatMap(() => {
          const subject = new AsyncSubject<string>();
          notifications.queue.subscribe(
            (index) => subject.error(new Error("Unexpected index.")),
            (error) => subject.error(error),
            () => subject.error(new Error("Unexpected completion."))
          );
          return subject;
        })
      );

      m.expect(result).toBeObservable(expected);
    })
  );

  it(
    "should emit the subscription index upon notification",
    marbles((m) => {
      const notifier = m.hot("  -n");
      const queuings = m.cold(" q-");
      const expected = m.cold(" -0");

      const notifications = new QueuedNotifications(notifier);
      notifications.connect();

      const result = queuings.pipe(
        concatMap(() => {
          const subject = new AsyncSubject<string>();
          notifications.queue.subscribe(
            (index) => subject.next(index.toString()),
            (error) => subject.error(error),
            () => subject.complete()
          );
          return subject;
        })
      );

      m.expect(result).toBeObservable(expected);
    })
  );

  it(
    "should emit the subscription index for each notification",
    marbles((m) => {
      const notifier = m.hot("  -----n-n");
      const queuings = m.cold(" (qq)----");
      const expected = m.cold(" -----0-1");

      const notifications = new QueuedNotifications(notifier);
      notifications.connect();

      const result = queuings.pipe(
        concatMap(() => {
          const subject = new AsyncSubject<string>();
          notifications.queue.subscribe(
            (index) => subject.next(index.toString()),
            (error) => subject.error(error),
            () => subject.complete()
          );
          return subject;
        })
      );

      m.expect(result).toBeObservable(expected);
    })
  );

  it(
    "should queue notifications",
    marbles((m) => {
      const notifier = m.hot("  (nn)----");
      const queuings = m.cold(" -----q-q");
      const expected = m.cold(" -----0-1");

      const notifications = new QueuedNotifications(notifier);
      notifications.connect();

      const result = queuings.pipe(
        concatMap(() => {
          const subject = new AsyncSubject<string>();
          notifications.queue.subscribe(
            (index) => subject.next(index.toString()),
            (error) => subject.error(error),
            () => subject.complete()
          );
          return subject;
        })
      );

      m.expect(result).toBeObservable(expected);
    })
  );
});
