/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { ConnectableObservable, Observable } from "rxjs";

export function asConnectable<T>(
  source: Observable<T>
): ConnectableObservable<T> {
  if (isConnectable(source)) {
    return source;
  }
  throw new Error("Expected a ConnectableObservable.");
}

function isConnectable(value: any): value is ConnectableObservable<any> {
  return value && value.connect && typeof value._refCount === "number";
}
