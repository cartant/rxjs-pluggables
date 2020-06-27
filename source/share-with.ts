/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */
/* eslint rxjs/no-connectable: "off" */

import {
  ConnectableObservable,
  Observable,
  OperatorFunction,
  Subject,
} from "rxjs";
import { multicast, refCount as defaultRefCount, tap } from "rxjs/operators";

export type RefCountFunction<T> = (
  connectableObservable: ConnectableObservable<T>
) => Observable<T>;

export function shareWith<T>(
  subject: Subject<T>,
  refCount?: RefCountFunction<T>
): OperatorFunction<T, T>;

export function shareWith<T>(
  subjectFactory: (
    kind: "C" | "E" | undefined,
    previousSubject: Subject<T> | undefined
  ) => Subject<T>,
  refCount?: RefCountFunction<T>
): OperatorFunction<T, T>;

export function shareWith<T>(
  arg:
    | Subject<T>
    | ((
        kind: "C" | "E" | undefined,
        previousSubject: Subject<T> | undefined
      ) => Subject<T>),
  refCount = defaultRefCount<T>() as RefCountFunction<T>
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
