/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-pluggables
 */

import { Observable, OperatorFunction } from "rxjs";
import { publish, switchMap, takeUntil } from "rxjs/operators";

export function switchMapWith<T, I, R>(
  before: OperatorFunction<T, I>,
  project: (value: I, index: number) => Observable<R>
): OperatorFunction<T, R> {
  return (source) =>
    source.pipe(
      publish((published) =>
        published.pipe(
          before,
          switchMap((value, index) =>
            project(value, index).pipe(takeUntil(published))
          )
        )
      )
    );
}
