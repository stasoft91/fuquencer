export type RecursivePartial<T> = {
    [P in keyof T]?:
    T[P] extends Array<infer U> ? Array<RecursivePartial<U>> :
      T[P] extends object ? RecursivePartial<T[P]> :
        T[P];
};


export type Dictionary<T = any> = { [key: string]: T }
