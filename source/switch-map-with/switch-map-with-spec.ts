/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/rxjs-pluggables
 */

import { marbles } from "rxjs-marbles";
import { auditTime, debounceTime, delay, sampleTime } from "rxjs/operators";
import { switchMapWith } from "./switch-map-with";

describe("switchMapWith", () => {
  it(
    "should play nice with auditTime",
    marbles((m) => {
      const source = m.cold("   ss-s-------");
      const sourceSub1 = "      ^----------";
      const duration = m.time(" --|        ");
      const inner = m.cold("    --i|       ");
      //                        --|
      //                          --i|
      const innerSub1 = "       --^!-------";
      //                           --|
      //                             --i|
      const innerSub2 = "       -----^--!--";
      const expected = "        -------i---";

      const result = source.pipe(
        switchMapWith(auditTime(duration), () => inner)
      );
      m.expect(result).toBeObservable(expected);
      m.expect(source).toHaveSubscriptions([sourceSub1]);
      m.expect(inner).toHaveSubscriptions([innerSub1, innerSub2]);
    })
  );

  it(
    "should play nice with debounceTime",
    marbles((m) => {
      const source = m.cold("   ss--s------");
      const sourceSub1 = "      ^----------";
      const duration = m.time(" --|        ");
      const inner = m.cold("    --i|       ");
      //                         --|
      //                           --i|
      const innerSub1 = "       ---^!------";
      //                            --|
      //                              --i|
      const innerSub2 = "       ------^--!-";
      const expected = "        --------i--";

      const result = source.pipe(
        switchMapWith(debounceTime(duration), () => inner)
      );
      m.expect(result).toBeObservable(expected);
      m.expect(source).toHaveSubscriptions([sourceSub1]);
      m.expect(inner).toHaveSubscriptions([innerSub1, innerSub2]);
    })
  );

  it(
    "should play nice with delay",
    marbles((m) => {
      const source = m.cold("   s--s-------");
      const sourceSub1 = "      ^----------";
      const duration = m.time(" --|        ");
      const inner = m.cold("    --i|       ");
      //                        --|
      //                          --i|
      const innerSub1 = "       --^!-------";
      //                           --|
      //                             --i|
      const innerSub2 = "       -----^--!--";
      const expected = "        -------i---";

      const result = source.pipe(switchMapWith(delay(duration), () => inner));
      m.expect(result).toBeObservable(expected);
      m.expect(source).toHaveSubscriptions([sourceSub1]);
      m.expect(inner).toHaveSubscriptions([innerSub1, innerSub2]);
    })
  );

  it(
    "should play nice with sampleTime",
    marbles((m) => {
      const source = m.cold("   ss-s------|");
      const sourceSub1 = "      ^---------!";
      const duration = m.time(" --|        ");
      const inner = m.cold("    --i|       ");
      //                        --|
      //                          --i|
      const innerSub1 = "       --^!-------";
      //                          --|
      //                            --i|
      const innerSub2 = "       ----^--!---";
      const expected = "        ------i---|";

      const result = source.pipe(
        switchMapWith(sampleTime(duration), () => inner)
      );
      m.expect(result).toBeObservable(expected);
      m.expect(source).toHaveSubscriptions([sourceSub1]);
      m.expect(inner).toHaveSubscriptions([innerSub1, innerSub2]);
    })
  );
});
