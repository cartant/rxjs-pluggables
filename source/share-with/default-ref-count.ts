/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-pluggables
 */

import { Observable, OperatorFunction, Subscription } from "rxjs";
import { closedSubscription } from "./closed-subscription";
import { ShareStrategy } from "./share-strategy";

export function defaultRefCount(): ShareStrategy {
  return {
    operator: (connect) => defaultRefCountOperator(connect),
    shouldReuseSubject: () => false,
  };
}

export function defaultRefCountOperator<T>(
  connect: () => Subscription
): OperatorFunction<T, T> {
  return (source) => {
    let connectSubscription = closedSubscription;
    let count = 0;

    return new Observable<T>((observer) => {
      const subscription = source.subscribe(observer);
      if (++count === 1) {
        connectSubscription = connect();
      }
      subscription.add(() => {
        if (--count === 0) {
          connectSubscription.unsubscribe();
        }
      });
      return subscription;
    });
  };
}
