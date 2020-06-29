/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import {
  asapScheduler,
  NEVER,
  Observable,
  OperatorFunction,
  SchedulerLike,
  Subject,
  timer,
  Subscription,
} from "rxjs";
import { scan, switchMap, tap } from "rxjs/operators";
import { closedSubscription } from "./closed-subscription";
import { ShareStrategy } from "./share-strategy";

export function delayedRefCount(
  delay: number,
  scheduler: SchedulerLike = asapScheduler
): ShareStrategy {
  return {
    operator: (connect) => delayedRefCountOperator(connect, delay, scheduler),
    reuseSubject: ({ kind, shared }) => shared && kind === "C",
  };
}

export function delayedRefCountOperator<T>(
  connect: () => Subscription,
  delay: number,
  scheduler: SchedulerLike = asapScheduler
): OperatorFunction<T, T> {
  return (source) => {
    let connectSubscription = closedSubscription;
    let connectorSubscription = closedSubscription;

    const notifier = new Subject<number>();
    const connector = notifier.pipe(
      scan((count, step) => count + step, 0),
      switchMap((count) => {
        if (count === 0) {
          return timer(delay, scheduler).pipe(
            tap(() => {
              connectSubscription.unsubscribe();
              connectorSubscription.unsubscribe();
            })
          );
        }
        if (count > 0 && connectSubscription.closed) {
          connectSubscription = connect();
        }
        return NEVER;
      })
    );

    return new Observable<T>((observer) => {
      if (connectorSubscription.closed) {
        connectorSubscription = connector.subscribe();
      }
      const subscription = source.subscribe(observer);
      notifier.next(1);
      // The decrementing teardown is added *after* the increment to ensure the
      // reference count cannot go negative. If the source completes
      // synchronously, the decrementing teardown will run when it's added to
      // the subscription.
      subscription.add(() => notifier.next(-1));
      return subscription;
    });
  };
}
