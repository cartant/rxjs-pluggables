/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-strategies
 */

import { noop, SubscriptionLike } from "rxjs";

export const closedSubscription: SubscriptionLike = {
  closed: true,
  unsubscribe: noop,
};
