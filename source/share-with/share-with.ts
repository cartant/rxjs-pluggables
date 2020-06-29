/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { defer, OperatorFunction, Subject, Subscription } from "rxjs";
import { tap } from "rxjs/operators";
import { closedSubscription } from "./closed-subscription";
import { ShareStrategy } from "./types";

export function shareWith<T>(
  strategy: ShareStrategy<T>,
  factory: () => Subject<T> = () => new Subject<T>()
): OperatorFunction<T, T> {
  const { operator, reuseSubject } = strategy(factory);
  let kind: "C" | "E" | undefined = undefined;
  let subject: Subject<T> | undefined = undefined;
  let subjectSubscription = closedSubscription;

  return (source) => {
    function connect(): Subscription {
      if (!subject || subject.isStopped) {
        return closedSubscription as Subscription;
      }
      return (subjectSubscription = source
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
        .subscribe(subject));
    }
    return defer(() => {
      if (!subject || subject.isStopped || subjectSubscription.closed) {
        subject = reuseSubject(kind, subject);
        kind = undefined;
      }
      return subject;
    }).pipe(operator(connect));
  };
}
