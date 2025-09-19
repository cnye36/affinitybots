/**
 * @jest-environment node
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json(body: unknown, init?: { status?: number }) {
      return {
        status: init?.status ?? 200,
        async json() {
          return body;
        },
      } as Response;
    },
  },
}));

jest.mock("@/supabase/server", () => ({
  createClient: jest.fn(),
}));

import { GET, POST } from "@/app/api/workflows/[workflowId]/runs/route";

const { createClient } = jest.requireMock("@/supabase/server");

type TableData = Record<string, Array<Record<string, unknown>>>;

class QueryBuilder {
  private table: string;
  private state: SupabaseStub;
  private filters: Array<(row: Record<string, unknown>) => boolean> = [];
  private ordering: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private mode: "select" | "update" | "insert" = "select";
  private returning = false;
  private updatePayload: Record<string, unknown> | null = null;

  constructor(table: string, state: SupabaseStub) {
    this.table = table;
    this.state = state;
  }

  select() {
    this.returning = true;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  order(column: string, options: { ascending: boolean }) {
    this.ordering = { column, ascending: options.ascending };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.limitCount = 1;
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.mode = "update";
    this.updatePayload = payload;
    return this;
  }

  insert(payload: Record<string, unknown> | Array<Record<string, unknown>>) {
    this.mode = "insert";
    if (Array.isArray(payload)) {
      payload.forEach((row) => this.state.insertRow(this.table, row));
    } else {
      this.state.insertRow(this.table, payload);
    }
    return this;
  }

  async then(resolve: (value: { data: unknown; error: null }) => void, reject: (reason?: unknown) => void) {
    try {
      const result = await this.execute();
      resolve(result);
    } catch (err) {
      reject(err);
    }
  }

  async catch(onReject: (reason?: unknown) => void) {
    return this.then(() => {}, onReject);
  }

  private async execute() {
    const rows = [...(this.state.tables[this.table] || [])];
    const filtered = rows.filter((row) => this.filters.every((fn) => fn(row)));

    if (this.mode === "update" && this.updatePayload) {
      const updated: Record<string, unknown>[] = [];
      for (const row of filtered) {
        Object.assign(row, this.updatePayload);
        updated.push({ ...row });
      }
      if (!this.returning) {
        return { data: null, error: null };
      }
      const limited = this.limitCount ? updated.slice(0, this.limitCount) : updated;
      return { data: this.limitCount === 1 ? limited[0] || null : limited, error: null };
    }

    let result = filtered;
    if (this.ordering) {
      const { column, ascending } = this.ordering;
      result = [...result].sort((a, b) => {
        const av = a[column];
        const bv = b[column];
        if (av === bv) return 0;
        if (av === undefined || av === null) return ascending ? -1 : 1;
        if (bv === undefined || bv === null) return ascending ? 1 : -1;
        return ascending
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }

    if (typeof this.limitCount === "number") {
      result = result.slice(0, this.limitCount);
    }

    const data = this.limitCount === 1 ? result[0] || null : result;
    return { data, error: null };
  }
}

class SupabaseStub {
  public tables: TableData;
  private userId: string;

  constructor(userId: string, tables: TableData) {
    this.userId = userId;
    this.tables = tables;
  }

  auth = {
    getUser: jest.fn(async () => ({ data: { user: { id: this.userId } } })),
  };

  from(table: string) {
    return new QueryBuilder(table, this);
  }

  insertRow(table: string, payload: Record<string, unknown>) {
    if (!this.tables[table]) {
      this.tables[table] = [];
    }
    this.tables[table].push({ ...payload });
  }
}

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
  global.fetch = originalFetch;
});

describe("workflow runs API", () => {
  it("lists workflow runs with associated task runs", async () => {
    const tables: TableData = {
      workflows: [
        {
          workflow_id: "wf-1",
          owner_id: "user-1",
        },
      ],
      workflow_runs: [
        {
          run_id: "run-1",
          workflow_id: "wf-1",
          owner_id: "user-1",
          status: "completed",
          started_at: "2024-05-01T00:00:00.000Z",
          completed_at: "2024-05-01T00:05:00.000Z",
          error: null,
          result: { value: "ok" },
          metadata: { foo: "bar" },
        },
      ],
      workflow_task_runs: [
        {
          run_id: "task-1",
          workflow_run_id: "run-1",
          workflow_task_id: "task-1",
          status: "completed",
          started_at: "2024-05-01T00:00:00.000Z",
          completed_at: "2024-05-01T00:01:00.000Z",
          error: null,
          result: { ok: true },
          metadata: {},
        },
      ],
    };

    const supabase = new SupabaseStub("user-1", tables);
    createClient.mockResolvedValueOnce(supabase);

    const response = (await GET({ url: "http://localhost" } as unknown as Request, {
      params: Promise.resolve({ workflowId: "wf-1" }),
    })) as Response;

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({ run_id: "run-1" });
    expect(payload[0].taskRuns).toHaveLength(1);
  });

  it("creates a workflow run by delegating to execute endpoint", async () => {
    const tables: TableData = {
      workflows: [
        {
          workflow_id: "wf-1",
          owner_id: "user-1",
        },
      ],
      workflow_runs: [],
      workflow_task_runs: [],
    };

    const supabase = new SupabaseStub("user-1", tables);
    createClient.mockResolvedValue(supabase);

    (global.fetch as jest.Mock).mockImplementation(async () => {
      supabase.insertRow("workflow_runs", {
        run_id: "run-new",
        workflow_id: "wf-1",
        owner_id: "user-1",
        status: "running",
        started_at: new Date().toISOString(),
        completed_at: null,
        error: null,
        result: null,
        metadata: {},
      });

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.close();
        },
      });
      return new Response(stream, { status: 200 });
    });

    const response = (await POST(
      {
        url: "http://localhost/api/workflows/wf-1/runs",
        headers: {
          get: (key: string) => {
            if (key.toLowerCase() === "cookie") return null;
            if (key.toLowerCase() === "content-type") return "application/json";
            return null;
          },
        },
        async json() {
          return { input: { foo: "bar" }, config: { mode: "test" } };
        },
      } as unknown as Request,
      { params: Promise.resolve({ workflowId: "wf-1" }) }
    )) as Response;

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.run_id).toBe("run-new");
    expect(payload.metadata.request).toMatchObject({ input: { foo: "bar" }, config: { mode: "test" } });
    const [calledUrl] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(calledUrl)).toBe("http://localhost/api/workflows/wf-1/execute");
  });
});
