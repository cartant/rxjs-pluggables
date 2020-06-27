/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { OperatorFunction, Observable } from "rxjs";
import { asConnectable } from "./as-connectable";

export function refCountForever<T>(): OperatorFunction<T, T> {
  return (source) => {
    const connectable = asConnectable(source);
    return new Observable<T>((observer) => {
      /* eslint-disable-next-line rxjs/no-ignored-subscription */
      connectable.subscribe(observer);
      connectable.connect();
    });
  };
}
