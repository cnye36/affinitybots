# Database Audit Report: Performance Issues and Bugs

## Summary
Found **11 critical/high-priority issues** across the codebase affecting performance, data integrity, and maintainability.

---

## CRITICAL ISSUES

### 1. **N+1 Query Pattern in Task Deletion** [HIGH PRIORITY]
**File:** `/home/user/affinitybots/app/api/workflows/[workflowId]/tasks/[taskId]/route.ts` (Lines 166-184)

**Issue:** Sequential individual UPDATE queries in a loop instead of batch operation.

```typescript
// Lines 166-184: PROBLEMATIC CODE
if (!reorderError && remainingTasks) {
  const updates = remainingTasks.map((t, index) => ({
    id: t.id,
    position: index,
  }));

  for (const update of updates) {
    await supabase
      .from("workflow_tasks")
      .update({ position: update.position })
      .eq("id", update.id);  // ❌ Individual query per task!
  }
}
```

**Impact:** If a workflow has 10+ tasks, this sends 10+ individual UPDATE queries. Performance degrades O(n).

**Fix:** Use batch upsert or batch update with OR conditions.

---

### 2. **Multiple Queries for Single Ownership Verification** [HIGH PRIORITY]
**File:** `/home/user/affinitybots/app/api/workflows/[workflowId]/runs/route.ts` (Lines 26-37)

**Issue:** Two redundant queries to verify ownership of the same workflow.

```typescript
// Lines 26-37: PROBLEMATIC CODE
// Verify workflow ownership
const { data: workflow } = await supabase
  .from("workflows")
  .select("*")  // ❌ SELECT *
  .eq("workflow_id", workflowId)
  .single();

if (!workflow || workflow.owner_id !== user.id) {
  return NextResponse.json(
    { error: "Workflow not found or access denied" },
    { status: 404 }
  );
}

// GET method also does this (Line 72-84) - DUPLICATED
```

**Issue:** Both GET and POST handlers run the exact same query. GET (line 26-30) and POST (line 73-76) both load entire workflow.

**Impact:** For every run listing/creation, fetching all columns including potentially large JSON fields (nodes, edges, snapshot).

---

### 3. **SELECT * Anti-Pattern (Multiple Instances)** [HIGH PRIORITY]
**File:** Multiple locations fetching all columns when only subset needed.

**Examples:**
- `/home/user/affinitybots/app/api/agents/[agentId]/chat/route.ts:102` - Selects `"*"` for entire assistant config
- `/home/user/affinitybots/lib/mcp/getUserMcpServers.ts:14,32` - Selects all user_mcp_servers columns including oauth_token
- `/home/user/affinitybots/app/api/admin/early-access-requests/route.ts:16-18` - `select("*")` with comment suggesting it should select all

```typescript
// Line 100-104: PROBLEMATIC CODE (agents/[agentId]/chat/route.ts)
const { data: assistantData, error: assistantError } = await supabase
  .from("assistant")
  .select("*")  // ❌ Fetching entire config object
  .eq("assistant_id", assistantId)
  .single();
```

**Impact:** Network overhead for large metadata objects. Config objects can be large with nested MCP configurations.

---

### 4. **Race Condition in Workflow Task Reordering** [CRITICAL]
**File:** `/home/user/affinitybots/app/api/workflows/[workflowId]/tasks/[taskId]/route.ts` (Lines 158-184)

**Issue:** Delete task, then update remaining tasks without transaction. Between delete and updates, another request could interfere.

```typescript
// Line 158: Delete task
const { error } = await supabase
  .from("workflow_tasks")
  .delete()
  .eq("workflow_task_id", taskId);

if (error) throw error;

// Line 166-184: No transaction - gap here!
// If another request deletes a task at same time,
// position updates could conflict
const { data: remainingTasks, error: reorderError } = await supabase
  .from("workflow_tasks")
  .select("id, position")
  .eq("workflow_id", workflowId)
  .order("position");
```

**Impact:** Concurrent deletes could result in duplicate positions or gaps in task ordering.

**Fix:** Wrap in database transaction.

---

### 5. **Missing Pagination on Unbounded Queries** [HIGH PRIORITY]
**File:** `/home/user/affinitybots/app/api/agents/route.ts` (Lines 173-180)

**Issue:** Fallback query has no pagination or limit for potentially large result set.

```typescript
// Lines 173-180: PROBLEMATIC CODE
const { data, error: queryError } = await supabase
  .from("assistant")
  .select(`
    *,
    user_assistants!inner(user_id)
  `)
  .eq("user_assistants.user_id", user.id)
  .order("created_at", { ascending: false });
  // ❌ No limit() - could return 1000s of rows if user has many assistants
```

**Impact:** If user has many assistants, database loads all into memory. Frontend may timeout.

**Fix:** Add `.limit(100)` and implement pagination.

---

### 6. **Missing Pagination in Memory/Store Queries** [MEDIUM PRIORITY]
**File:** `/home/user/affinitybots/app/api/agents/[agentId]/memories/route.ts` (Lines 44-48)

**Issue:** No pagination on memories query which could have many records.

```typescript
// Lines 44-48: PROBLEMATIC CODE
const { data: rows, error: storeError } = await supabase
  .from("store")
  .select("prefix,key,value,created_at,updated_at")
  .in("prefix", [prefixDot, prefixJson])
  .order("updated_at", { ascending: true });
  // ❌ No limit - could fetch thousands of memories
```

**Impact:** Large memory datasets load entirely into memory.

---

### 7. **Duplicate Database Queries for Access Control** [MEDIUM PRIORITY]
**File:** `/home/user/affinitybots/app/api/agents/[agentId]/chat/route.ts` (Lines 100-121)

**Issue:** Two redundant queries to verify access.

```typescript
// Lines 100-121: PROBLEMATIC CODE
// First query: get assistant
const { data: assistantData, error: assistantError } = await supabase
  .from("assistant")
  .select("*")
  .eq("assistant_id", assistantId)
  .single();

// Then separately check user_assistants
const { data: userAssistant, error: userAssistantError } = await supabase
  .from("user_assistants")
  .select("assistant_id")
  .eq("user_id", user.id)
  .eq("assistant_id", assistantId)
  .single();

// Then fallback to checking metadata
if (ownerId !== user.id) { ... }
```

**Impact:** 2-3 queries per chat message to verify access. Could use join instead.

---

### 8. **Missing Cascade Delete / Orphaned Records Risk** [HIGH PRIORITY]
**File:** `/home/user/affinitybots/app/api/agents/[agentId]/route.ts` (Lines 200-268)

**Issue:** DELETE assistant doesn't clean up user_assistants mapping or related data.

```typescript
// Lines 250-254: PROBLEMATIC CODE
const { error: deleteError } = await supabase
  .from("assistant")
  .delete()
  .eq("assistant_id", assistantId)
  .eq("metadata->>owner_id", user.id);

// ❌ No cascade delete of:
// - user_assistants (access mappings)
// - documents (knowledge base)
// - document_vectors (embeddings)
// - task_runs related to this assistant
```

**Impact:** Orphaned records accumulate: task_runs, knowledge documents, vector embeddings never cleaned up.

---

### 9. **Inefficient JOIN with Optional Fallback** [MEDIUM PRIORITY]
**File:** `/home/user/affinitybots/app/api/workflows/[workflowId]/tasks/[taskId]/execute/route.ts` (Lines 27-31)

**Issue:** Nested select with join could fail and require fallback logic.

```typescript
// Lines 27-31: PROBLEMATIC CODE
const { data: task } = await supabase
  .from("workflow_tasks")
  .select("*, workflow:workflows(owner_id), assistant_id")
  .eq("workflow_task_id", taskId)
  .single();
```

**Issue:** The `workflow:workflows(owner_id)` relation depends on foreign key. If FK missing, query fails.

**Better approach:** Use explicit LEFT JOIN or verify FK exists in schema.

---

### 10. **Concurrent Session Updates Without Locking** [MEDIUM PRIORITY]
**File:** `/home/user/affinitybots/lib/mcp/mcpSessionManager.ts` (Lines 149-163)

**Issue:** Update sessions without checking current state.

```typescript
// Lines 149-163: PROBLEMATIC CODE
private async markSessionAsExpired(userId: string, serverName: string): Promise<void> {
  const { error } = await this.getSupabase()
    .from('user_mcp_servers')
    .update({
      oauth_token: null,
      session_id: null,
      expires_at: null,
      is_enabled: false
    })
    .eq('user_id', userId)
    .eq('qualified_name', serverName);
    // ❌ No WHERE clause to check current state
    // ❌ Blindly sets is_enabled=false even if it was already enabled
}
```

**Impact:** Concurrent refresh/expire calls could cause race conditions with session state.

---

### 11. **Potential Data Integrity Issue: Document Deletion** [HIGH PRIORITY]
**File:** `/home/user/affinitybots/app/api/knowledge/route.ts` (Lines 350-365)

**Issue:** Two separate delete operations without transaction guarantees atomicity.

```typescript
// Lines 350-365: PROBLEMATIC CODE
// Delete vector embeddings
const { error: vectorDeleteError } = await serviceClient
  .from("document_vectors")
  .delete()
  .eq("metadata->>document_id", documentId);

// Then delete document
const { error: docDeleteError } = await serviceClient
  .from("documents")
  .delete()
  .eq("id", documentId);

// ❌ If second delete fails, vectors orphaned
// ❌ If first fails, document deleted with hanging vectors
```

**Impact:** Orphaned vectors remain in database, wasting storage.

---

## ADDITIONAL FINDINGS

### Loop in Loop Pattern (Inefficient Iteration)
**File:** `/home/user/affinitybots/app/api/workflows/[workflowId]/execute/route.ts` (Lines 86-87)

```typescript
// Lines 86-87: PROBLEMATIC CODE
for (const e of edges) {
  const sourceTaskId = Object.keys(idToNodeId).find((tid) => idToNodeId[tid] === e.source);
  const targetTaskId = Object.keys(idToNodeId).find((tid) => idToNodeId[tid] === e.target);
  // ❌ O(n²) complexity in edge processing
}
```

**Better:** Build reverse map once: `const nodeIdToTaskId = Object.entries(idToNodeId).reduce(...)`

---

### Missing Error Recovery
**File:** `/home/user/affinitybots/app/api/workflows/[workflowId]/execute/route.ts` (Lines 169-191)

**Issue:** Task run creation failures don't halt execution.

```typescript
// Lines 169-191: PROBLEMATIC CODE
const taskRuns = await Promise.all(
  tasks.map(async (task: Task) => {
    // ...
    if (trErr) {
      console.error("Failed to create workflow_task_run:", JSON.stringify(trErr));
      return null as any;  // ❌ Returns null but execution continues
    }
  })
);

// Later code assumes taskRun exists
for (const task of tasks) {
  const taskRun = taskRuns.find((tr) => tr?.workflow_task_id === task.workflow_task_id);
  // Could be null!
}
```

---

## SUMMARY TABLE

| ID | Issue | File | Severity | Type |
|---|---|---|---|---|
| 1 | N+1 task reordering | tasks/[taskId]/route.ts:166-184 | HIGH | Performance |
| 2 | Workflow ownership verified 2x | runs/route.ts:26-76 | HIGH | Performance |
| 3 | SELECT * patterns | Multiple (11 files) | HIGH | Performance |
| 4 | Task delete race condition | tasks/[taskId]/route.ts:158-184 | CRITICAL | Data Integrity |
| 5 | Missing pagination | agents/route.ts:173-180 | HIGH | Performance |
| 6 | Memory query no limit | memories/route.ts:44-48 | MEDIUM | Performance |
| 7 | Duplicate access queries | chat/route.ts:100-121 | MEDIUM | Performance |
| 8 | Missing cascade deletes | agents/route.ts:200-268 | HIGH | Data Integrity |
| 9 | Inefficient JOIN fallback | tasks/[taskId]/execute/route.ts:27-31 | MEDIUM | Performance |
| 10 | No session state locking | mcpSessionManager.ts:149-163 | MEDIUM | Concurrency |
| 11 | Atomicity issue: doc delete | knowledge/route.ts:350-365 | HIGH | Data Integrity |

---

## RECOMMENDATIONS

1. **Immediate (P0):** Fix race conditions (#4) and cascade deletes (#8) with transactions
2. **High Priority (P1):** Remove SELECT * queries, add pagination to unbounded queries
3. **Medium Priority (P2):** Consolidate redundant queries with joins, add query batching
4. **Best Practices:** Implement database transaction wrappers for multi-step operations

