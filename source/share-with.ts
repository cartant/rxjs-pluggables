/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */
/* eslint rxjs/no-connectable: "off" */

import { OperatorFunction, Subject } from "rxjs";
import { multicast, tap } from "rxjs/operators";

export function shareWith<T>(
  refCount: OperatorFunction<T, T>,
  subject?: Subject<T>
): OperatorFunction<T, T>;

export function shareWith<T>(
  refCount: OperatorFunction<T, T>,
  subjectFactory?: (
    kind: "C" | "E" | undefined,
    previousSubject: Subject<T> | undefined
  ) => Subject<T>
): OperatorFunction<T, T>;

export function shareWith<T>(
  refCount: OperatorFunction<T, T>,
  arg:
    | Subject<T>
    | ((
        kind: "C" | "E" | undefined,
        previousSubject: Subject<T> | undefined
      ) => Subject<T>) = new Subject<T>()
): OperatorFunction<T, T> {
  const factory = typeof arg === "function" ? arg : () => arg;
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
        subject = factory(kind, subject);
        kind = undefined;
        return subject;
      }),
      refCount as OperatorFunction<T, T>
    );
}
