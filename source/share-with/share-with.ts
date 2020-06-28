/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */
/* eslint rxjs/no-connectable: "off" */

import { OperatorFunction, Subject } from "rxjs";
import { multicast, tap } from "rxjs/operators";
import { ShareStrategy } from "./types";

export function shareWith<T>(
  strategy: ShareStrategy<T>,
  factory: () => Subject<T> = () => new Subject<T>()
): OperatorFunction<T, T> {
  const { getSubject, operator } = strategy(factory);
  let kind: "C" | "E" | undefined = undefined;
  let subject: Subject<T> | undefined = undefined;
  return (source) =>
    source.pipe(
      tap({
        complete() {
          kind = "C";
        },
        error() {
          kind = "E";
        },
      }),
      multicast(() => {
        subject = getSubject(kind, subject);
        kind = undefined;
        return subject;
      }),
      operator
    );
}
