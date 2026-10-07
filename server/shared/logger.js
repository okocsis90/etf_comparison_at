import { AsyncLocalStorage } from 'node:async_hooks';

const requestContext = new AsyncLocalStorage();

const write = (level, message, fields = {}) => {
  const entry = {
    ...requestContext.getStore(),
    ...fields,
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  const output = JSON.stringify(entry);

  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
};

const Logger = {
  withContext: (context, callback) => requestContext.run(context, callback),
  info: (message, fields) => write('info', message, fields),
  warn: (message, fields) => write('warn', message, fields),
  error: (message, fields) => write('error', message, fields),
};

export default Logger;
