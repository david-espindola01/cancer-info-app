/** Cache API in memory, for the tests of offline reading (jsdom does not have it). */
class FakeCache {
  readonly entries = new Map<string, Response>();

  constructor(private readonly fetcher: () => typeof fetch) {}

  private key(request: RequestInfo | URL) {
    const url = typeof request === "string" || request instanceof URL ? request.toString() : request.url;
    return new URL(url, "http://localhost").toString();
  }

  async match(request: RequestInfo | URL) {
    return this.entries.get(this.key(request))?.clone();
  }

  async put(request: RequestInfo | URL, response: Response) {
    this.entries.set(this.key(request), response);
  }

  async add(request: RequestInfo | URL) {
    const response = await this.fetcher()(request);
    if (!response.ok) throw new TypeError("Bad response");
    await this.put(request, response);
  }

  async delete(request: RequestInfo | URL) {
    return this.entries.delete(this.key(request));
  }

  async keys() {
    return [...this.entries.keys()].map((url) => new Request(url));
  }
}

export class FakeCacheStorage {
  readonly caches = new Map<string, FakeCache>();

  constructor(private readonly fetcher: () => typeof fetch = () => globalThis.fetch) {}

  async open(name: string) {
    let cache = this.caches.get(name);
    if (!cache) {
      cache = new FakeCache(this.fetcher);
      this.caches.set(name, cache);
    }
    return cache;
  }

  async keys() {
    return [...this.caches.keys()];
  }

  async delete(name: string) {
    return this.caches.delete(name);
  }

  /** The addresses kept in a cache, without the origin. */
  paths(name: string) {
    return [...(this.caches.get(name)?.entries.keys() ?? [])].map((url) => new URL(url).pathname);
  }
}
