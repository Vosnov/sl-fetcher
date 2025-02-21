import { SLFetcherError } from './sl-fetcher-error';

export const isSLFetcherError = <T>(
  value: unknown,
): value is SLFetcherError<T> => {
  return value instanceof SLFetcherError;
};
