import { test, expect, vi } from 'vitest';
import fetchMock from 'fetch-mock';
import { SLFetcher } from '../src/sl-fetcher';
import { isSLFetcherError } from '../src/utils/is-sl-fetcher-error';

const POST_DATA = {
  userId: 1,
};

const ERROR_DATA = {
  message: 'ERROR',
};

const BASE_URL = 'http://example.com';

fetchMock.mockGlobal().get(`${BASE_URL}/empty`, 200);
fetchMock.mockGlobal().get(`${BASE_URL}/error-empty`, 400);
fetchMock.mockGlobal().get(`${BASE_URL}/error`, {
  status: 400,
  body: JSON.stringify(ERROR_DATA),
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
  },
});

fetchMock
  .get(`${BASE_URL}/posts`, JSON.stringify(POST_DATA))
  .post(`${BASE_URL}/posts`, JSON.stringify(POST_DATA))
  .put(`${BASE_URL}/posts`, JSON.stringify(POST_DATA))
  .patch(`${BASE_URL}/posts`, JSON.stringify(POST_DATA))
  .delete(`${BASE_URL}/posts`, JSON.stringify(POST_DATA));
fetchMock
  .get(`${BASE_URL}/posts-error`, 400)
  .post(`${BASE_URL}/posts-error`, 400)
  .put(`${BASE_URL}/posts-error`, 400)
  .patch(`${BASE_URL}/posts-error`, 400)
  .delete(`${BASE_URL}/posts-error`, 400);

fetchMock
  .mockGlobal()
  .get(`${BASE_URL}/authorization`, (v) =>
    v.options.headers?.['authorization'] ? 200 : 403
  )
  .post(`${BASE_URL}/authorization`, (v) =>
    v.options.headers?.['authorization'] ? 200 : 403
  );

fetchMock.mockGlobal().post(`${BASE_URL}/form`, (v) => {
  const body = v.options.body;

  if (body instanceof FormData) {
    return body.has('test') ? 200 : 400;
  }

  return 400;
});

const slFetcher = new SLFetcher({
  baseURL: BASE_URL,
});

test('GET success with data', async () => {
  const data = await slFetcher.get('posts');
  expect(data).toEqual(POST_DATA);
});

test('GET success without data', async () => {
  const data = await slFetcher.get('empty');
  expect(data).toBe(undefined);
});

test('GET error without data', async () => {
  try {
    await slFetcher.get('error-empty');
  } catch (e) {
    expect(isSLFetcherError(e)).toBe(true);

    if (isSLFetcherError(e)) {
      expect(e.status).toBe(400);
      expect(e.name).toBe('SLFetcherError');
      expect(e.message).toBe('Bad Request');
      expect(e.data).toBe(undefined);

      return;
    }

    throw e;
  }
});

test('GET error with data', async () => {
  try {
    await slFetcher.get('error');
  } catch (e) {
    expect(isSLFetcherError(e)).toBe(true);

    if (isSLFetcherError(e)) {
      expect(e.status).toBe(400);
      expect(e.name).toBe('SLFetcherError');
      expect(e.message).toBe('Bad Request');
      expect(e.data).toEqual(ERROR_DATA);

      return;
    }

    throw e;
  }
});

test('POST success', async () => {
  const data = await slFetcher.post('posts', POST_DATA);

  expect(data).toEqual(POST_DATA);
});

test('POST error', async () => {
  try {
    await slFetcher.post('posts-error', POST_DATA);
  } catch (e) {
    expect(isSLFetcherError(e)).toBe(true);

    if (isSLFetcherError(e)) {
      expect(e.status).toBe(400);
      expect(e.name).toBe('SLFetcherError');
      expect(e.message).toBe('Bad Request');
    }
  }
});

test('PUT success', async () => {
  const data = await slFetcher.put('posts', POST_DATA);

  expect(data).toEqual(POST_DATA);
});

test('PUT error', async () => {
  try {
    await slFetcher.put('posts-error', POST_DATA);
  } catch (e) {
    expect(isSLFetcherError(e)).toBe(true);

    if (isSLFetcherError(e)) {
      expect(e.status).toBe(400);
      expect(e.name).toBe('SLFetcherError');
      expect(e.message).toBe('Bad Request');
    }
  }
});

test('PATCH success', async () => {
  const data = await slFetcher.patch('posts', POST_DATA);

  expect(data).toEqual(POST_DATA);
});

test('PATCH error', async () => {
  try {
    await slFetcher.patch('posts-error', POST_DATA);
  } catch (e) {
    expect(isSLFetcherError(e)).toBe(true);

    if (isSLFetcherError(e)) {
      expect(e.status).toBe(400);
      expect(e.name).toBe('SLFetcherError');
      expect(e.message).toBe('Bad Request');
    }
  }
});

test('DELETE success', async () => {
  const data = await slFetcher.delete('posts');

  expect(data).toEqual(POST_DATA);
});

test('DELETE error', async () => {
  try {
    await slFetcher.delete('posts-error');
  } catch (e) {
    expect(isSLFetcherError(e)).toBe(true);

    if (isSLFetcherError(e)) {
      expect(e.status).toBe(400);
      expect(e.name).toBe('SLFetcherError');
      expect(e.message).toBe('Bad Request');
    }
  }
});

test('GET authorization error', async () => {
  try {
    await slFetcher.get('authorization');
  } catch (e) {
    expect(isSLFetcherError(e)).toBe(true);

    if (isSLFetcherError(e)) {
      expect(e.status).toBe(403);
    }
  }
});

test('GET authorization success (interceptor used)', async () => {
  slFetcher.addRequestInterceptor(async () => {
    return {
      headers: { Authorization: 'test' },
    };
  });

  const get = vi.fn(slFetcher.get.bind(slFetcher));
  await get('authorization');
  expect(get).toHaveResolved();

  slFetcher.requestInterceptors = [];
});

test('POST authorization error', async () => {
  try {
    await slFetcher.post('authorization', POST_DATA);
  } catch (e) {
    expect(isSLFetcherError(e)).toBe(true);

    if (isSLFetcherError(e)) {
      expect(e.status).toBe(403);
    }
  }
});

test('POST authorization success (interceptor used)', async () => {
  slFetcher.addRequestInterceptor(async () => {
    return {
      headers: { Authorization: 'test' },
    };
  });

  const get = vi.fn(slFetcher.post.bind(slFetcher));
  await get('authorization');
  expect(get).toHaveResolved();

  slFetcher.requestInterceptors = [];
});

test('GET responce interceptor call', async () => {
  let callCount = 0;

  slFetcher.addResponceInterceptor(() => {
    callCount += 1;
  });

  await slFetcher.get('posts');
  expect(callCount).toBe(1);

  await slFetcher.get('posts');
  expect(callCount).toBe(2);
});

test('GET with / in url', async () => {
  const data = await slFetcher.get('/posts');
  expect(data).toEqual(POST_DATA);
});

test('POST form', async () => {
  const formData = new FormData();
  formData.append('test', '123');
  const post = vi.fn(slFetcher.post.bind(slFetcher));
  await post('form', formData);
  expect(post).toHaveResolved();
});
