/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import {
  concat,
  from,
  identity,
  MonoTypeOperatorFunction,
  Observable,
  ObservableInput,
  of,
  OperatorFunction,
  Subject,
} from "rxjs";

import { expand, ignoreElements, mergeMap, tap } from "rxjs/operators";
import { NotificationQueue } from "./notification-queue";

export type ControlledElement<T, M> = {
  markers: ObservableInput<M>;
  values: ObservableInput<T>;
};
export type ControlledFactory<T, M> = (
  marker: M | undefined,
  index: number
) => Observable<ControlledElement<T, M>>;

export function controlled<T, M>(options: {
  concurrency?: number;
  factory: ControlledFactory<T, M>;
  notifier: Observable<any>;
}): Observable<T>;

export function controlled<T, M, R>(options: {
  concurrency?: number;
  factory: ControlledFactory<T, M>;
  operator: OperatorFunction<T, R>;
}): Observable<R>;

export function controlled<T, M>(options: {
  concurrency?: number;
  factory: ControlledFactory<T, M>;
}): Observable<T>;

export function controlled<T, M, R>({
  concurrency = 1,
  factory,
  operator = identity,
  notifier,
}: {
  concurrency?: number;
  factory: ControlledFactory<T, M>;
  operator?: OperatorFunction<T, T | R>;
  notifier?: Observable<any>;
}): Observable<T | R> {
  return new Observable<T | R>((observer) => {
    let queue: NotificationQueue;
    let queueOperator: MonoTypeOperatorFunction<M | undefined>;

    if (notifier) {
      queue = new NotificationQueue(notifier);
      queueOperator = identity;
    } else {
      const subject = new Subject<any>();
      queue = new NotificationQueue(subject);
      queueOperator = (markers) => {
        subject.next();
        return markers;
      };
    }

    const destination = new Subject<T | R>();
    const subscription = destination.subscribe(observer);
    subscription.add(queue.connect());
    subscription.add(
      of(undefined)
        .pipe(
          expand(
            (marker: M | undefined) =>
              queue.pipe(
                mergeMap((index) =>
                  factory(marker, index).pipe(
                    mergeMap(({ markers, values }) =>
                      concat(
                        from(values).pipe(
                          operator,
                          tap((value) => destination.next(value)),
                          ignoreElements()
                        ),
                        from(markers)
                      )
                    )
                  )
                ),
                queueOperator
              ),
            concurrency
          )
        )
        .subscribe({
          complete: () => destination.complete(),
          error: (error) => destination.error(error),
        })
    );
    return subscription;
  });
}
