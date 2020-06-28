/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { OperatorFunction, Observable } from "rxjs";
import { asConnectable } from "./as-connectable";
import { ShareStrategy } from "./types";

export function noRefCount(): ShareStrategy<any> {
  return (factory) => ({
    getSubject: (kind, subject) => (kind === "C" && subject) || factory(),
    operator: noRefCountOperator(),
  });
}

export function noRefCountOperator<T>(): OperatorFunction<T, T> {
  return (source) => {
    const connectable = asConnectable(source);
    return new Observable<T>((observer) => {
      const subscription = connectable.subscribe(observer);
      connectable.connect();
      return subscription;
    });
  };
}
