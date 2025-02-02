export class SLFetcherError<T> extends Error {
  status: number;
  headers: Headers;
  data?: T;

  constructor(mess: string, res: Response, data?: T) {
    super(mess);

    this.name = 'SLFetcherError';
    this.message = mess;
    this.status = res.status;
    this.headers = res.headers;
    this.data = data;
  }
}
