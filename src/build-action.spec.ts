import { buildAction, getType, ActionsUnion } from './';

// const noPayload = buildAction('NO_PAYLOAD').withType<void>(); // noPayload()
// const createUser = buildAction('CREATE_USER').withType<PayloadType>();
// const createUser = buildAction('CREATE_USER').withTypes<PayloadType, MetaType>();
// const notify = buildAction('NOTIFY').withMappers<InputArgumentType>( // output types are inferred
//   ({ username, message }) => `${username}: ${message || ''}`, // payload mapper
//   ({ timestamp }) => ({ timestamp }) // meta mapper
// );

describe('buildAction', () => {
  // TODO: #3
  // should error when missing argument
  // should error when passed invalid arguments
  // check object, empty array, primitives

  it('no payload', () => {
    const increment = buildAction('INCREMENT').empty();
    const action: { type: 'INCREMENT' } = increment();
    expect(action).toEqual({ type: 'INCREMENT' });
    const type: 'INCREMENT' = getType(increment);
    expect(type).toBe('INCREMENT');
  });

  it('no payload alternative', () => {
    const increment = buildAction('INCREMENT').payload<void>();
    const action: { type: 'INCREMENT' } = increment();
    expect(action).toEqual({ type: 'INCREMENT' });
    const type: 'INCREMENT' = getType(increment);
    expect(type).toBe('INCREMENT');
  });

  it('with payload', () => {
    const add = buildAction('ADD').payload<number>();
    const action: { type: 'ADD'; payload: number } = add(10);
    expect(action).toEqual({ type: 'ADD', payload: 10 });
    const type: 'ADD' = getType(add);
    expect(type).toBe('ADD');
  });

  it('with boolean payload', () => {
    const set = buildAction('SET').payload<boolean>();
    const action: { type: 'SET'; payload: boolean } = set(true);
    expect(action).toEqual({ type: 'SET', payload: true });
    const type: 'SET' = getType(set);
    expect(type).toBe('SET');
  });

  it('with string literal type payload', () => {
    type NetStatus = 'up' | 'down' | 'unknown';
    const set = buildAction('SET').payload<NetStatus>();
    const action: { type: 'SET'; payload: NetStatus } = set('up');
    expect(action).toEqual({ type: 'SET', payload: 'up' });
    const type: 'SET' = getType(set);
    expect(type).toBe('SET');
  });

  it('with union payload', () => {
    const union = buildAction('UNION').payload<string | null | number>();
    const action: { type: 'UNION'; payload: string | null | number } = union('foo');
    expect(action).toEqual({ type: 'UNION', payload: 'foo' });
    const action2: { type: 'UNION'; payload: string | null | number } = union(null);
    expect(action2).toEqual({ type: 'UNION', payload: null });
    const action3: { type: 'UNION'; payload: string | null | number } = union(3);
    expect(action3).toEqual({ type: 'UNION', payload: 3 });
    const type: 'UNION' = getType(union);
    expect(type).toBe('UNION');
  });

  it('with payload and no params', () => {
    const showNotification = buildAction('SHOW_NOTIFICATION').fsa(() => 'hardcoded message');
    const action: { type: 'SHOW_NOTIFICATION'; payload: string } = showNotification();
    expect(action).toEqual({
      type: 'SHOW_NOTIFICATION',
      payload: 'hardcoded message',
    });
    const type: 'SHOW_NOTIFICATION' = getType(showNotification);
    expect(type).toBe('SHOW_NOTIFICATION');
  });

  it('with payload and param', () => {
    const showNotification = buildAction('SHOW_NOTIFICATION').fsa((message: string) => message);
    const action: { type: 'SHOW_NOTIFICATION'; payload: string } = showNotification('info message');
    expect(action).toEqual({
      type: 'SHOW_NOTIFICATION',
      payload: 'info message',
    });
    const type: 'SHOW_NOTIFICATION' = getType(showNotification);
    expect(type).toBe('SHOW_NOTIFICATION');
  });

  it('with payload and union param', () => {
    const showNotification = buildAction('SHOW_NOTIFICATION').fsa(
      (message: string | null | number) => message
    );
    const action: { type: 'SHOW_NOTIFICATION'; payload: string | null | number } = showNotification(
      'info message'
    );
    expect(action).toEqual({
      type: 'SHOW_NOTIFICATION',
      payload: 'info message',
    });
    const action2: {
      type: 'SHOW_NOTIFICATION';
      payload: string | null | number;
    } = showNotification(null);
    expect(action2).toEqual({
      type: 'SHOW_NOTIFICATION',
      payload: null,
    });
    const action3: {
      type: 'SHOW_NOTIFICATION';
      payload: string | null | number;
    } = showNotification(3);
    expect(action3).toEqual({
      type: 'SHOW_NOTIFICATION',
      payload: 3,
    });
    const type: 'SHOW_NOTIFICATION' = getType(showNotification);
    expect(type).toBe('SHOW_NOTIFICATION');
  });

  it('with payload and meta', () => {
    type Notification = { username: string; message?: string };
    const notify = buildAction('NOTIFY').fsa(
      ({ username, message }: Notification) => `${username}: ${message || ''}`,
      ({ username, message }) => ({ username, message })
    );
    const action: {
      type: 'NOTIFY';
      payload: string;
      meta: Notification;
    } = notify({ username: 'Piotr', message: 'Hello!' });
    expect(action).toEqual({
      type: 'NOTIFY',
      payload: 'Piotr: Hello!',
      meta: { username: 'Piotr', message: 'Hello!' },
    });
    const type: 'NOTIFY' = getType(notify);
    expect(type).toBe('NOTIFY');
  });

  it('with payload and meta and no params', () => {
    const showError = buildAction('SHOW_ERROR').fsa(
      () => 'hardcoded error',
      () => ({ severity: 'error' })
    );
    const action: { type: 'SHOW_ERROR'; payload: string; meta: { severity: string } } = showError();
    expect(action).toEqual({
      type: 'SHOW_ERROR',
      payload: 'hardcoded error',
      meta: { severity: 'error' },
    });
    const type: 'SHOW_ERROR' = getType(showError);
    expect(type).toBe('SHOW_ERROR');
  });

  it('with payload and meta and param', () => {
    const showError = buildAction('SHOW_ERROR').fsa(
      (message: string) => message,
      () => ({ severity: 'error' })
    );
    const action: { type: 'SHOW_ERROR'; payload: string; meta: { severity: string } } = showError(
      'error message'
    );
    expect(action).toEqual({
      type: 'SHOW_ERROR',
      payload: 'error message',
      meta: { severity: 'error' },
    });
    const type: 'SHOW_ERROR' = getType(showError);
    expect(type).toBe('SHOW_ERROR');
  });

  // Async
  it('should create working async action', () => {
    type User = { name: string };
    // NOTE: with `void` type you can make explicit no arguments needed for this action creator
    const fetchUsers = buildAction('LIST_USERS').async<void, User[], string>();
    const requestAction: { type: 'LIST_USERS' & 'REQUEST' } = fetchUsers.request();
    expect(requestAction).toEqual({
      type: 'LIST_USERS_REQUEST',
    });
    const successAction: { type: 'LIST_USERS' & 'SUCCESS'; payload: User[] } = fetchUsers.success([
      { name: 'Piotr' },
    ]);
    expect(successAction).toEqual({
      type: 'LIST_USERS_SUCCESS',
      payload: [{ name: 'Piotr' }],
    });
    const failureAction: { type: 'LIST_USERS' & 'FAILURE'; payload: string } = fetchUsers.failure(
      'error message'
    );
    expect(failureAction).toEqual({
      type: 'LIST_USERS_FAILURE',
      payload: 'error message',
    });
    const type1: 'LIST_USERS' & 'REQUEST' = getType(fetchUsers.request);
    expect(type1).toBe('LIST_USERS_REQUEST');
    const type2: 'LIST_USERS' & 'SUCCESS' = getType(fetchUsers.success);
    expect(type2).toBe('LIST_USERS_SUCCESS');
    const type3: 'LIST_USERS' & 'FAILURE' = getType(fetchUsers.failure);
    expect(type3).toBe('LIST_USERS_FAILURE');
  });

  it('should work at runtime with symbol as action type', () => {
    enum Increment {}
    const INCREMENT = (Symbol(1) as any) as Increment & string;
    const a: string = INCREMENT; // Ok
    // const b: typeof INCREMENT = 'INCREMENT'; // Error
    const increment = buildAction(INCREMENT).empty();
    const decrement = buildAction((Symbol(2) as any) as 'DECREMENT').empty();
    const action: { type: typeof INCREMENT } = increment();
    expect(action).toEqual({ type: INCREMENT });
    expect(action).not.toEqual({ type: 'INCREMENT' });
    const type: typeof INCREMENT = getType(increment);
    expect(type).toBe(INCREMENT);
    expect(type).not.toBe('INCREMENT');
  });

  it('should work correctly in reducer switch case', () => {
    const actions = {
      very: { deep: { empty: buildAction('INCREMENT').empty() } },
      payload: buildAction('ADD').payload<number>(),
      // async: buildAction('GET_USER').async<number, { name: string }, string>(),
    };
    type RootAction = ActionsUnion<typeof actions>;
    // tslint:disable-next-line:max-line-length

    function reducer(action: RootAction): RootAction {
      switch (action.type) {
        case getType(actions.very.deep.empty): {
          const a: { type: 'INCREMENT' } = action;
          return a;
        }
        case getType(actions.payload): {
          const a: { type: 'ADD'; payload: number } = action;
          return a;
        }
      }
    }
  });
});
