/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-pluggables
 */
/* eslint rxjs/no-connectable: "off" */

import {
  ConnectableObservable,
  Observable,
  Subject,
  Subscription,
  zip,
} from "rxjs";

import { first, map, publish } from "rxjs/operators";

export class QueuedNotifications {
  private _count = 0;
  private _indices: Subject<number>;
  private _notifications: ConnectableObservable<number>;
  private _queue: Observable<number>;

  constructor(notifier: Observable<any>) {
    this._indices = new Subject<number>();
    this._notifications = zip(notifier, this._indices).pipe(
      map(([, index]) => index),
      publish()
    ) as ConnectableObservable<number>;
    this._queue = new Observable<number>((observer) => {
      const index = this._count++;
      const subscription = this._notifications
        .pipe(first((value) => value === index))
        .subscribe(observer);
      this._indices.next(index);
      return subscription;
    });
  }

  connect(): Subscription {
    return this._notifications.connect();
  }

  get queue(): Observable<number> {
    return this._queue;
  }
}
