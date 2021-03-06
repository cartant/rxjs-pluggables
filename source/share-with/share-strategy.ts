/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-pluggables
 */

import { OperatorFunction, Subject, Subscription } from "rxjs";

export type ShareStrategy = {
  operator: (connect: () => Subscription) => OperatorFunction<any, any>;
  shouldReuseSubject: (state: {
    connected: boolean;
    kind: "C" | "E" | undefined;
    subject: Subject<any>;
  }) => boolean;
};
