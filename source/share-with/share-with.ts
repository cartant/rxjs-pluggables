/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { defer, OperatorFunction, Subject, Subscription } from "rxjs";
import { tap } from "rxjs/operators";
import { closedSubscription } from "./closed-subscription";
import { ShareStrategy } from "./types";

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
      // unsubscribe of the subscription returned from connect - which
      // indicates that the operator no longer needs the shared subject.
      const reusableSubject = subject;
      const reusableSubjectSubscription = new Subscription();
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
        .subscribe(reusableSubject);
      sourceSubscription.add(() => {
        if (!reuseSubject({ kind, shared: true, subject: reusableSubject })) {
          subject = undefined;
          reusableSubjectSubscription.unsubscribe();
        }
      });
      reusableSubjectSubscription.add(sourceSubscription);
      reusableSubjectSubscription.add(() => {
        if (!reuseSubject({ kind, shared: false, subject: reusableSubject })) {
          subject = undefined;
        }
      });
      return reusableSubjectSubscription;
    }
    return defer(() => subject || (subject = factory())).pipe(
      operator(connect)
    );
  };
}
