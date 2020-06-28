import { OperatorFunction, Subject } from "rxjs";

export type ShareStrategy<T> = (
  factory: () => Subject<T>
) => {
  getSubject: (
    kind: "C" | "E" | undefined,
    subject: Subject<T> | undefined
  ) => Subject<T>;
  operator: OperatorFunction<T, T>;
};
