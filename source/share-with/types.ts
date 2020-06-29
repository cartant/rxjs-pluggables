import { OperatorFunction, Subject, Subscription } from "rxjs";

export type ShareStrategy = {
  operator: (connect: () => Subscription) => OperatorFunction<any, any>;
  reuseSubject: (state: {
    kind: "C" | "E" | undefined;
    shared: boolean;
    subject: Subject<any>;
  }) => boolean;
};
