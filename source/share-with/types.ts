import { OperatorFunction, Subject, Subscription } from "rxjs";

export type ShareStrategy<T> = (
  factory: () => Subject<T>
) => {
  operator: (connect: () => Subscription) => OperatorFunction<T, T>;
  reuseSubject: (
    kind: "C" | "E" | undefined,
    subject: Subject<T> | undefined
  ) => Subject<T>;
};
