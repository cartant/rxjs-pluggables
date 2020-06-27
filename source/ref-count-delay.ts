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
  Subscription,
  timer,
} from "rxjs";
import { scan, switchMap, tap } from "rxjs/operators";
import { asConnectable } from "./as-connectable";

export function refCountDelay<T>(
  delay: number,
  scheduler: SchedulerLike = asapScheduler
): OperatorFunction<T, T> {
  return (source) => {
    const connectable = asConnectable(source);
    let connectableSubscription: Subscription | undefined = undefined;
    let connectorSubscription: Subscription | undefined = undefined;

    const notifier = new Subject<number>();
    const connector = notifier.pipe(
      scan((count, step) => count + step, 0),
      switchMap((count) => {
        if (count === 0) {
          return timer(delay, scheduler).pipe(
            tap(() => {
              if (connectableSubscription) {
                connectableSubscription.unsubscribe();
                connectableSubscription = undefined;
              }
              if (connectorSubscription) {
                connectorSubscription.unsubscribe();
                connectorSubscription = undefined;
              }
            })
          );
        }
        if (!connectableSubscription && count > 0) {
          connectableSubscription = connectable.connect();
        }
        return NEVER;
      })
    );

    return new Observable<T>((observer) => {
      if (!connectorSubscription) {
        connectorSubscription = connector.subscribe();
      }
      const subscription = connectable.subscribe(observer);
      subscription.add(() => notifier.next(-1));
      notifier.next(1);
      return subscription;
    });
  };
}
