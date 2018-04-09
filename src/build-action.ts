import { StringType, TypeMeta, EmptyAction, PayloadAction, PayloadMetaAction, B, U } from './';

export type EACreator<Type extends StringType> = () => EmptyAction<Type>;

export type PACreator<Type extends StringType, Payload> = (
  payload: Payload
) => PayloadAction<Type, Payload>;

export type EmptyOrPayload<Type extends StringType, Payload extends B<any>> = Payload extends B<
  void
>
  ? EACreator<Type>
  : PACreator<Type, U<Payload>>;

export type FSACreator<
  Type extends StringType,
  Payload extends B<any>,
  Meta extends B<any> = B<void>,
  Arg extends B<any> = B<void>
> = Arg extends B<void>
  ? Meta extends B<void>
    ? () => PayloadAction<Type, U<Payload>>
    : () => PayloadMetaAction<Type, U<Payload>, U<Meta>>
  : Meta extends B<void>
    ? (payload: U<Arg>) => PayloadAction<Type, U<Payload>>
    : (payload: U<Arg>) => PayloadMetaAction<Type, U<Payload>, U<Meta>>;

export type AsyncCreator<
  Type extends StringType,
  RequestPayload,
  SuccessPayload,
  FailurePayload
> = {
  request: EmptyOrPayload<Type & 'REQUEST', B<RequestPayload>>;
  success: EmptyOrPayload<Type & 'SUCCESS', B<SuccessPayload>>;
  failure: EmptyOrPayload<Type & 'FAILURE', B<FailurePayload>>;
};

/**
 * @description create an action creator of a given function that contains hidden "type" metadata
 */
export interface BuildAction<Type extends StringType> {
  empty(): EACreator<Type>;
  payload<Payload>(): EmptyOrPayload<Type, B<Payload>>;
  async<RequestPayload, SuccessPayload, FailurePayload>(): AsyncCreator<
    Type,
    RequestPayload,
    SuccessPayload,
    FailurePayload
  >;
  fsa<Payload, Meta = void>(
    payloadCreator: () => Payload,
    metaCreator?: () => Meta
  ): FSACreator<Type, B<Payload>, B<Meta>>;
  fsa<Arg, Payload, Meta = void>(
    payloadCreator: (payload: Arg) => Payload,
    metaCreator?: (payload: Arg) => Meta
  ): FSACreator<Type, B<Payload>, B<Meta>, B<Arg>>;
}

function attachGetType<T extends StringType, AC>(
  ac: AC & TypeMeta<T>,
  actionType: T
): AC & TypeMeta<T> {
  ac.getType = () => actionType;
  return ac;
}

/** implementation */
export function buildAction<T extends StringType>(actionType: T): BuildAction<T> {
  if (actionType == null) {
    throw new Error('first argument is missing');
  } else {
    if (typeof actionType !== 'string' && typeof actionType !== 'symbol') {
      throw new Error('first argument should be type of: string | symbol');
    }
  }

  function createEmpty(): EACreator<T> {
    const ac = () => ({ type: actionType });
    return attachGetType(ac, actionType);
  }

  function createPayload<P>(): EmptyOrPayload<T, B<P>> {
    const ac = (payload: P) => ({ type: actionType, payload });
    return attachGetType(ac, actionType) as EmptyOrPayload<T, B<P>>;
  }

  function createFsa<P, M, A>(
    payloadCreator: (a?: A) => P,
    metaCreator?: (a?: A) => M
  ): FSACreator<T, B<P>, B<M>> {
    const ac = (payload?: A) => ({
      type: actionType,
      ...{ payload: payloadCreator != null ? payloadCreator(payload) : undefined },
      ...{ meta: metaCreator != null ? metaCreator(payload) : undefined },
    });
    return attachGetType(ac, actionType) as FSACreator<T, B<P>, B<M>>;
  }

  function createAsync<R, S, F>(): AsyncCreator<T, R, S, F> {
    const atRequest = actionType + ('_' + 'REQUEST');
    const atSuccess = actionType + ('_' + 'SUCCESS');
    const atFailure = actionType + ('_' + 'FAILURE');

    const acRequest = (payload: R) => ({
      type: atRequest,
      ...{ payload: payload != null ? payload : undefined },
    });
    const acSuccess = (payload: S) => ({
      type: atSuccess,
      ...{ payload: payload != null ? payload : undefined },
    });
    const acFailure = (payload: F) => ({
      type: atFailure,
      ...{ payload: payload != null ? payload : undefined },
    });

    return {
      request: attachGetType(acRequest, atRequest) as EmptyOrPayload<T & 'REQUEST', B<R>>,
      success: attachGetType(acSuccess, atSuccess) as EmptyOrPayload<T & 'SUCCESS', B<S>>,
      failure: attachGetType(acFailure, atFailure) as EmptyOrPayload<T & 'FAILURE', B<F>>,
    };
  }

  const actionBuilder: BuildAction<T> = {
    empty: createEmpty,
    payload: createPayload,
    async: createAsync,
    fsa: createFsa,
  };
  return actionBuilder;
}
