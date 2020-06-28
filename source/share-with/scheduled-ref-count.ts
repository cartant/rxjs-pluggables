/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import {
  Observable,
  OperatorFunction,
  SchedulerLike,
  Subscription,
} from "rxjs";
import { asConnectable } from "./as-connectable";
import { ShareStrategy } from "./types";

export function scheduledRefCount(
  scheduler: SchedulerLike
): ShareStrategy<any> {
  return (factory) => ({
    getSubject: (kind, subject) => (kind === "C" && subject) || factory(),
    operator: scheduledRefCountOperator(scheduler),
  });
}

export function scheduledRefCountOperator<T>(
  scheduler: SchedulerLike
): OperatorFunction<T, T> {
  return (source) => {
    const connectable = asConnectable(source);
    let connectableSubscription: Subscription | undefined = undefined;
    let count = 0;
    return new Observable<T>((observer) => {
      ++count;
      const subscription = connectable.subscribe(observer);
      subscription.add(
        scheduler.schedule(() => {
          if (!connectableSubscription && count > 0) {
            connectableSubscription = connectable.connect();
          }
        })
      );
      subscription.add(() => {
        --count;
        scheduler.schedule(() => {
          if (connectableSubscription && count === 0) {
            connectableSubscription.unsubscribe();
            connectableSubscription = undefined;
          }
        });
      });
      return subscription;
    });
  };
}
