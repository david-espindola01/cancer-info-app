import { NextRequest } from "next/server";
import { memorySchema } from "@/application/reading/schemas";
import { emptyTables, testConnection } from "@/testing/database";
import { DELETE as removeDocument, PATCH as setActive } from "./documents/[id]/route";
import { POST as processStep } from "./documents/[id]/step/route";
import { GET as listDocuments, POST as uploadDocument } from "./documents/route";
import { DELETE as logout, POST as login } from "./session/route";
import { GET as getStatus } from "./status/route";

const PASSWORD = "test-password";
const sql = testConnection();
const articleText = "Las células se renuevan de forma ordenada en el cuerpo humano. ".repeat(20);

function request(path: string, options: { method?: string; body?: unknown; cookie?: string } = {}) {
  return new NextRequest(`http://localhost${path}`, {
    method: options.method ?? "GET",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers: options.cookie ? { cookie: options.cookie } : {},
  });
}

async function sessionCookie(): Promise<string> {
  const response = await login(request("/api/session", { method: "POST", body: { password: PASSWORD } }));
  return response.headers.get("set-cookie")!.split(";")[0]!;
}

beforeAll(() => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.ADMIN_PASSWORD = PASSWORD;
  process.env.SESSION_SECRET = "test-secret-that-is-long-enough";
  process.env.LLM_PROVIDER = "fake";
});

beforeEach(() => emptyTables(sql));

afterAll(() => sql.end());

describe("/api/session", () => {
  it("rejects a wrong password", async () => {
    const response = await login(request("/api/session", { method: "POST", body: { password: "other" } }));

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects a body that is not JSON", async () => {
    const response = await login(new NextRequest("http://localhost/api/session", { method: "POST", body: "not json" }));

    expect(response.status).toBe(401);
  });

  it("with the right password hands out an httpOnly, strict cookie", async () => {
    const response = await login(request("/api/session", { method: "POST", body: { password: PASSWORD } }));

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toMatch(/admin_session=.+HttpOnly.*SameSite=strict/i);
  });

  it("after 5 attempts in 15 minutes answers 429, even with the right password", async () => {
    const attempt = (password: string) => login(request("/api/session", { method: "POST", body: { password } }));
    for (let i = 0; i < 5; i += 1) await attempt("wrong");

    const response = await attempt(PASSWORD);

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: expect.stringContaining("Demasiados intentos") });
  });

  it("logging out deletes the cookie", async () => {
    const response = await logout();

    expect(response.headers.get("set-cookie")).toMatch(/admin_session=;.*Expires=Thu, 01 Jan 1970/i);
  });
});

describe("/api/status", () => {
  it("requires a session and returns today's usage and the ready pages", async () => {
    expect((await getStatus(request("/api/status"))).status).toBe(401);
    await sql`insert into ai_usage (reason, amount) values ('tokens:model', 1500), ('prefetch', 2)`;

    const response = await getStatus(request("/api/status", { cookie: await sessionCookie() }));

    expect(await response.json()).toEqual({ usageToday: { prefetch: 2, "tokens:model": 1500 }, readyPages: 0 });
  });
});

describe("/api/documents", () => {
  it("requires a session to list and to upload", async () => {
    expect((await listDocuments(request("/api/documents"))).status).toBe(401);
    const upload = await uploadDocument(
      request("/api/documents", {
        method: "POST",
        body: { title: "a", text: articleText },
        cookie: "admin_session=fake",
      }),
    );
    expect(upload.status).toBe(401);
  });

  it("uploads an article, lists it and rejects the duplicate", async () => {
    const cookie = await sessionCookie();
    const upload = () =>
      uploadDocument(request("/api/documents", { method: "POST", body: { title: "Estudio.pdf", text: articleText }, cookie }));

    const first = await upload();
    expect(first.status).toBe(201);
    const { document } = await first.json();
    expect(document).toEqual({
      id: expect.any(String),
      title: "Estudio.pdf",
      status: "pending",
      error: null,
      active: true,
      createdAt: expect.any(String),
    });

    expect((await upload()).status).toBe(409);
    const list = await (await listDocuments(request("/api/documents", { cookie }))).json();
    expect(list.documents).toEqual([document]);
  });

  it("reads an article step by step until it is ready", async () => {
    const cookie = await sessionCookie();
    const upload = await uploadDocument(
      request("/api/documents", { method: "POST", body: { title: "Estudio", text: articleText }, cookie }),
    );
    const { document } = await upload.json();
    const step = () =>
      processStep(request(`/api/documents/${document.id}/step`, { method: "POST", cookie }), {
        params: Promise.resolve({ id: document.id }),
      });

    expect(await (await step()).json()).toEqual({ kind: "progress", processed: 1, total: 1 });
    expect(await (await step()).json()).toEqual({ kind: "ready" });

    const list = await (await listDocuments(request("/api/documents", { cookie }))).json();
    expect(list.documents[0]).toMatchObject({ id: document.id, status: "ready" });
    const [memory] = await sql`select content from memories where document_id = ${document.id}`;
    expect(() => memorySchema.validate(memory?.content)).not.toThrow();
  });

  it.each(["not-a-uuid", "00000000-0000-0000-0000-000000000000"])(
    "answers 404 when reading the missing document %s",
    async (id) => {
      const cookie = await sessionCookie();

      const response = await processStep(request(`/api/documents/${id}/step`, { method: "POST", cookie }), {
        params: Promise.resolve({ id }),
      });

      expect(response.status).toBe(404);
    },
  );

  it("requires a session to read a document", async () => {
    const response = await processStep(request("/api/documents/x/step", { method: "POST" }), {
      params: Promise.resolve({ id: "x" }),
    });

    expect(response.status).toBe(401);
  });

  it.each([
    ["without text", { title: "a" }, 400],
    ["with a title that is not text", { title: 1, text: articleText }, 400],
    ["that is too long", { title: "a", text: "x".repeat(400_001) }, 413],
    ["without enough text (scanned PDF)", { title: "a", text: "Página 1" }, 422],
  ])("rejects a document %s", async (_, body, status) => {
    const cookie = await sessionCookie();

    const response = await uploadDocument(request("/api/documents", { method: "POST", body, cookie }));

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: expect.any(String) });
  });
});

describe("/api/documents/[id]", () => {
  async function uploaded(cookie: string) {
    const upload = await uploadDocument(
      request("/api/documents", { method: "POST", body: { title: "Estudio", text: articleText }, cookie }),
    );
    return (await upload.json()).document.id as string;
  }
  const params = (id: string) => ({ params: Promise.resolve({ id }) });

  it("turns an article off and on, and lists it that way", async () => {
    const cookie = await sessionCookie();
    const id = await uploaded(cookie);

    const off = await setActive(request(`/api/documents/${id}`, { method: "PATCH", body: { active: false }, cookie }), params(id));

    expect(off.status).toBe(200);
    expect((await off.json()).document).toMatchObject({ id, active: false });
    const list = await (await listDocuments(request("/api/documents", { cookie }))).json();
    expect(list.documents[0]).toMatchObject({ id, active: false });
  });

  it("deletes an article", async () => {
    const cookie = await sessionCookie();
    const id = await uploaded(cookie);

    const response = await removeDocument(request(`/api/documents/${id}`, { method: "DELETE", cookie }), params(id));

    expect(response.status).toBe(204);
    expect((await (await listDocuments(request("/api/documents", { cookie }))).json()).documents).toEqual([]);
  });

  it("requires a session to change or delete an article", async () => {
    const id = "00000000-0000-0000-0000-000000000000";

    expect((await setActive(request(`/api/documents/${id}`, { method: "PATCH", body: { active: false } }), params(id))).status).toBe(401);
    expect((await removeDocument(request(`/api/documents/${id}`, { method: "DELETE" }), params(id))).status).toBe(401);
  });

  it.each(["not-a-uuid", "00000000-0000-0000-0000-000000000000"])("answers 404 for the missing article %s", async (id) => {
    const cookie = await sessionCookie();

    expect((await setActive(request(`/api/documents/${id}`, { method: "PATCH", body: { active: true }, cookie }), params(id))).status).toBe(404);
    expect((await removeDocument(request(`/api/documents/${id}`, { method: "DELETE", cookie }), params(id))).status).toBe(404);
  });

  it("rejects a change that does not say whether the article stays on", async () => {
    const cookie = await sessionCookie();
    const id = await uploaded(cookie);

    const response = await setActive(request(`/api/documents/${id}`, { method: "PATCH", body: { active: "yes" }, cookie }), params(id));

    expect(response.status).toBe(400);
  });
});
