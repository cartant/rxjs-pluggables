/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { Observable, OperatorFunction, Subscription } from "rxjs";
import { closedSubscription } from "./closed-subscription";
import { ShareStrategy } from "./types";

export function defaultRefCount(): ShareStrategy {
  return {
    operator: (connect) => defaultRefCountOperator(connect),
    reuseSubject: () => false,
  };
}

export function defaultRefCountOperator<T>(
  connect: () => Subscription
): OperatorFunction<T, T> {
  return (connectable) => {
    let connectableSubscription = closedSubscription;
    let count = 0;

    return new Observable<T>((observer) => {
      const subscription = connectable.subscribe(observer);
      if (++count === 1) {
        connectableSubscription = connect();
      }
      subscription.add(() => {
        if (--count === 0) {
          connectableSubscription.unsubscribe();
        }
      });
      return subscription;
    });
  };
}
