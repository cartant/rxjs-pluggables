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
import { closedSubscription } from "./closed-subscription";
import { ShareStrategy } from "./types";

export function scheduledRefCount(scheduler: SchedulerLike): ShareStrategy {
  return {
    operator: (connect) => scheduledRefCountOperator(connect, scheduler),
    reuseSubject: ({ kind, shared }) => shared && kind === "C",
  };
}

export function scheduledRefCountOperator<T>(
  connect: () => Subscription,
  scheduler: SchedulerLike
): OperatorFunction<T, T> {
  return (connectable) => {
    let connectableSubscription = closedSubscription;
    let count = 0;
    return new Observable<T>((observer) => {
      ++count;
      const subscription = connectable.subscribe(observer);
      subscription.add(
        scheduler.schedule(() => {
          if (count > 0 && connectableSubscription.closed) {
            connectableSubscription = connect();
          }
        })
      );
      subscription.add(() => {
        --count;
        scheduler.schedule(() => {
          if (count === 0) {
            connectableSubscription.unsubscribe();
          }
        });
      });
      return subscription;
    });
  };
}
