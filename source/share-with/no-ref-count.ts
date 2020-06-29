/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { OperatorFunction, Observable, Subscription } from "rxjs";
import { closedSubscription } from "./closed-subscription";
import { ShareStrategy } from "./share-strategy";

export function noRefCount(): ShareStrategy {
  return {
    operator: (connect) => noRefCountOperator(connect),
    reuseSubject: () => false,
  };
}

export function noRefCountOperator<T>(
  connect: () => Subscription
): OperatorFunction<T, T> {
  return (connectable) => {
    let connectableSubscription = closedSubscription;

    return new Observable<T>((observer) => {
      const subscription = connectable.subscribe(observer);
      if (connectableSubscription.closed) {
        connectableSubscription = connect();
      }
      return subscription;
    });
  };
}
