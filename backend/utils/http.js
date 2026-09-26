// Response helpers so every endpoint answers in the shape docs/api.md describes:
// { success: true, data }  or  { success: false, message, fields? }

export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function fail(res, status, message, fields) {
  const body = { success: false, message };
  if (fields && Object.keys(fields).length) body.fields = fields;
  return res.status(status).json(body);
}

/**
 * Throw this from a controller or service (also inside a transaction, which then rolls back)
 * to answer with that status. `fields` names the bad inputs for the form.
 */
export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

/** 400 with the collected field messages, if there are any. */
export function throwIfInvalid(fields, message = 'Please fix the highlighted fields.') {
  if (Object.keys(fields).length) throw new HttpError(400, message, fields);
}

// MySQL errors that mean "this request clashes with the data", not "the server broke".
// Most are caught earlier with a friendlier message; these are the safety net.
const MYSQL_CONFLICTS = {
  ER_DUP_ENTRY: 'That value is already used. Choose a different one.',
  ER_CHECK_CONSTRAINT_VIOLATED: 'That change would break a stock rule (for example stock below zero), so nothing was saved.',
  ER_NO_REFERENCED_ROW_2: 'Something this change points to no longer exists. Refresh the page, or log in again if the database was reset.',
  ER_ROW_IS_REFERENCED_2: 'This record is still used by other data, so it cannot be removed.',
  // Two stock changes on the same shelves at the same moment: MySQL undid one of them
  ER_LOCK_DEADLOCK: 'Someone else changed the same stock at the same moment. Nothing was saved. Please try again.',
  ER_LOCK_WAIT_TIMEOUT: 'Someone else changed the same stock at the same moment. Nothing was saved. Please try again.',
};

const DB_UNREACHABLE = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'];

/**
 * Wrap an async route handler: Express 4 does not catch rejected promises,
 * so without this a failed query would leave the request hanging.
 */
export function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      if (error instanceof HttpError) return fail(res, error.status, error.message, error.fields);
      if (MYSQL_CONFLICTS[error.code]) return fail(res, 409, MYSQL_CONFLICTS[error.code]);

      console.error(`❌ ${req.method} ${req.originalUrl} failed:`, error);
      const message = DB_UNREACHABLE.includes(error.code)
        ? 'The server could not reach the database. Check that MySQL is running and backend/.env is correct.'
        : 'Something went wrong on the server. Please try again.';
      return fail(res, 500, message);
    }
  };
}
