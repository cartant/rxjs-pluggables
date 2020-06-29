/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { Subscription } from "rxjs";

export const closedSubscription = (function () {
  const subscription = new Subscription();
  subscription.unsubscribe();
  return subscription;
})();
