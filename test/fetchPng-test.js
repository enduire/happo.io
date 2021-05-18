import request from 'request';

import fetchPng from '../src/fetchPng';

jest.mock('request');
const realRequest = jest.requireActual('request');

let subject;
let url;

beforeEach(() => {
  request.mockReset();
  request.mockImplementation((...args) => realRequest(...args));
  url = 'https://happo.io/static/github-logo.png';
  subject = () =>
    fetchPng(url, {
      apiKey: 'foo',
      apiSecret: 'bar',
      endpoint: 'https://happo.io',
    });
});

it('resolves with a bitmap', async () => {
  const bitmap = await subject();
  expect(bitmap.width).toBe(64);
  expect(bitmap.height).toBe(64);
  expect(bitmap.data.length).toBe(16384);
});

it('does not send credentials for external urls', async () => {
  url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/272px-Google_2015_logo.svg.png';
  await subject();
  expect(request.mock.calls[0][0].auth).toBe(undefined);
});

it('sends credentials for happo urls', async () => {
  url = 'https://happo.io/a/120/img/happo-io/5ed1580f2dc7243b92c9ff648bbd1824';
  await subject();
  expect(request.mock.calls[0][0].auth).not.toBe(undefined);
  expect(request.mock.calls[0][0].auth.bearer).not.toBe(undefined);
});

describe('with an invalid url', () => {
  beforeEach(() => {
    url = 'asdfasdf';
  });

  it('rejects', async () => {
    expect.assertions = 1;
    try {
      await subject();
    } catch (e) {
      expect(e.message).toMatch('Invalid URI');
    }
  });
});

describe('with a url that is not an image', () => {
  beforeEach(() => {
    url = 'https://google.se/';
  });

  it('rejects', async () => {
    expect.assertions = 1;
    try {
      await subject();
    } catch (e) {
      expect(e.message).toMatch('Invalid file signature');
    }
  });
});
