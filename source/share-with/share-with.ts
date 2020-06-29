/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { defer, OperatorFunction, Subject, Subscription } from "rxjs";
import { tap } from "rxjs/operators";
import { closedSubscription } from "./closed-subscription";
import { ShareStrategy } from "./share-strategy";

export function shareWith<T>(
  strategy: ShareStrategy,
  factory: () => Subject<T> = () => new Subject<T>()
): OperatorFunction<T, T> {
  const { operator, reuseSubject } = strategy;
  let kind: "C" | "E" | undefined = undefined;
  let subject: Subject<T> | undefined = undefined;

  return (source) => {
    function connect(): Subscription {
      if (!subject || subject.isStopped) {
        return closedSubscription as Subscription;
      }
      // The lifetime of the subject is not bound to the lifetime of the source
      // subscription. The subject remains available for reuse until the
      // strategy indicates it is not to be reused or until the operator calls
      // unsubscribe on the subscription returned from connect - which
      // indicates that the operator no longer needs the shared subject.
      const connectSubject = subject;
      const connectSubscription = new Subscription();
      const sourceSubscription = source
        .pipe(
          tap({
            complete() {
              kind = "C";
            },
            error() {
              kind = "E";
            },
          })
        )
        .subscribe(connectSubject);
      sourceSubscription.add(() => {
        if (!reuseSubject({ kind, shared: true, subject: connectSubject })) {
          subject = undefined;
          connectSubscription.unsubscribe();
        }
      });
      // Although the subject's lifetime is not bound to the source
      // subscription, the reverse is not true. If the operator no longer needs
      // the subject - and unsubscribes from the subscription returned from
      // connect - the subject should be unsubscribed from the source.
      connectSubscription.add(sourceSubscription);
      connectSubscription.add(() => {
        if (!reuseSubject({ kind, shared: false, subject: connectSubject })) {
          subject = undefined;
        }
      });
      return connectSubscription;
    }
    return defer(() => subject || (subject = factory())).pipe(
      operator(connect)
    );
  };
}
