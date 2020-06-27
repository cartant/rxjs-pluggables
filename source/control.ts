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
import { QueuedNotifications } from "./queued-notifications";

export type ControlElement<T, M> = {
  markers: ObservableInput<M>;
  values: ObservableInput<T>;
};
export type ControlFactory<T, M> = (
  marker: M | undefined,
  index: number
) => Observable<ControlElement<T, M>>;

export function control<T, M>(options: {
  concurrency?: number;
  factory: ControlFactory<T, M>;
  notifier: Observable<any>;
}): Observable<T>;

export function control<T, M, R>(options: {
  concurrency?: number;
  factory: ControlFactory<T, M>;
  operator: OperatorFunction<T, R>;
}): Observable<R>;

export function control<T, M>(options: {
  concurrency?: number;
  factory: ControlFactory<T, M>;
}): Observable<T>;

export function control<T, M, R>({
  concurrency = 1,
  factory,
  operator = identity,
  notifier,
}: {
  concurrency?: number;
  factory: ControlFactory<T, M>;
  operator?: OperatorFunction<T, T | R>;
  notifier?: Observable<any>;
}): Observable<T | R> {
  return new Observable<T | R>((observer) => {
    let notifications: QueuedNotifications;
    let queueOperator: MonoTypeOperatorFunction<M | undefined>;

    if (notifier) {
      notifications = new QueuedNotifications(notifier);
      queueOperator = identity;
    } else {
      const subject = new Subject<any>();
      notifications = new QueuedNotifications(subject);
      queueOperator = (markers) => {
        subject.next();
        return markers;
      };
    }

    const destination = new Subject<T | R>();
    const subscription = destination.subscribe(observer);
    subscription.add(notifications.connect());
    subscription.add(
      of(undefined)
        .pipe(
          expand(
            (marker: M | undefined) =>
              notifications.queue.pipe(
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
