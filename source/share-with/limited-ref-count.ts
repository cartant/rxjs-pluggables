/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-pluggables
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
  return (source) => {
    let connectSubscription = closedSubscription;
    let count = 0;

    return new Observable<T>((observer) => {
      const subscription = source.subscribe(observer);
      if (++count === limit) {
        connectSubscription = connect();
      }
      subscription.add(() => {
        if (--count < limit) {
          connectSubscription.unsubscribe();
        }
      });
      return subscription;
    });
  };
}
