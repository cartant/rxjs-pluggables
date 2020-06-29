/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { Observable, OperatorFunction, Subscription } from "rxjs";
import { closedSubscription } from "./closed-subscription";
import { ShareStrategy } from "./share-strategy";

export function limitedRefCount(limit: number): ShareStrategy {
  return {
    operator: (connect) => limitedRefCountOperator(connect, limit),
    reuseSubject: () => true,
  };
}

export function limitedRefCountOperator<T>(
  connect: () => Subscription,
  limit: number
): OperatorFunction<T, T> {
  return (connectable) => {
    let connectableSubscription = closedSubscription;
    let count = 0;

    return new Observable<T>((observer) => {
      const subscription = connectable.subscribe(observer);
      if (++count === limit) {
        connectableSubscription = connect();
      }
      subscription.add(() => {
        if (--count < limit) {
          connectableSubscription.unsubscribe();
        }
      });
      return subscription;
    });
  };
}
