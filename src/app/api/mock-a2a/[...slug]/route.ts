
// src/app/api/mock-a2a/[...slug]/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer'; // For Basic Auth, if ever needed, though not in this spec

// --- In-memory store for contacts (simulating SQLite DB) ---
let contactsStore: Array<{ id: number; name: string; phone: string }> = [];
let nextId = 1;

function resetInMemoryDb() {
  contactsStore = [
    { id: 1, name: 'Alice', phone: '555-0101' },
    { id: 2, name: 'Bob', phone: '555-0202' },
    { id: 3, name: 'Charlie', phone: '555-0303' },
  ];
  nextId = 4;
  console.log('[Mock A2A Server] In-memory DB reset. Contacts:', contactsStore);
}

// Initialize DB on server start/reload
resetInMemoryDb();

// --- Route Handlers ---

async function handleAgentCard() {
  const card = {
    name: "VulnerableA2AAgent (Next.js Embedded)",
    description: "A vulnerable A2A agent for SQLi-like and data exposure demos, embedded in Next.js.",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002", // Use app's URL
    version: "3.0-nextjs",
    capabilities: {
      sql_insert: true,
      sql_delete: true,
      sql_drop: true,
      sql_show: true,
      env_exposure: true,
      reset_db: true
    }
  };
  return NextResponse.json(card);
}

async function handleDebugReset() {
  resetInMemoryDb();
  return NextResponse.json({ status: "reset", records: contactsStore });
}

async function handleTasksSend(req: NextRequest) {
  let data;
  try {
    data = await req.json();
  } catch (e) {
    console.error('[Mock A2A Server /tasks/send] Error parsing JSON body:', e);
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const taskId = data.id;
  let userMessage = "";

  try {
    if (data.message && data.message.parts && data.message.parts[0] && typeof data.message.parts[0].text === 'string') {
      userMessage = data.message.parts[0].text;
    } else {
      throw new Error("Missing or invalid message.parts[0].text");
    }
  } catch (e: any) {
    console.error('[Mock A2A Server /tasks/send] Invalid request format:', e.message, 'Received data:', JSON.stringify(data));
    return NextResponse.json({ error: `Invalid request format: ${e.message}. Expected {"id": "...", "message": {"parts": [{"text": "command"}]}}` }, { status: 400 });
  }

  console.log(`[Mock A2A Server /tasks/send] Received user_message='${userMessage}' (Task ID: ${taskId || 'N/A'})`);

  const lowerUserMessage = userMessage.toLowerCase();

  // Secure SQL Insert simulation
  if (lowerUserMessage.startsWith("insert")) {
    try {
      const values = userMessage.substring("insert".length).trim();
      const match = values.match(/'([^']+)',\s*'([^']+)'/);
      if (!match) {
        return NextResponse.json({ error: "Invalid insert format. Use: insert 'Name', 'Phone'" }, { status: 400 });
      }
      const [, name, phone] = match;
      contactsStore.push({ id: nextId++, name, phone });
      console.log('[Mock A2A Server] Inserted:', { name, phone }, 'Current contacts:', contactsStore);
      return NextResponse.json({ status: "inserted", records: [...contactsStore] });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
  // Secure SQL Delete simulation
  else if (lowerUserMessage.startsWith("delete")) {
    try {
      const where = userMessage.substring("delete".length).trim();
      let deleted = false;
      const nameMatch = where.match(/name='([^']+)'/);
      const phoneMatch = where.match(/phone='([^']+)'/);

      if (nameMatch) {
        const name = nameMatch[1];
        const initialLength = contactsStore.length;
        contactsStore = contactsStore.filter(c => c.name !== name);
        deleted = contactsStore.length < initialLength;
      } else if (phoneMatch) {
        const phone = phoneMatch[1];
        const initialLength = contactsStore.length;
        contactsStore = contactsStore.filter(c => c.phone !== phone);
        deleted = contactsStore.length < initialLength;
      } else {
        return NextResponse.json({ error: "Invalid delete format. Use: delete name='Name' or delete phone='Phone'" }, { status: 400 });
      }
      console.log('[Mock A2A Server] After delete attempt for:', where, 'Deleted:', deleted, 'Current contacts:', contactsStore);
      return NextResponse.json({ status: "deleted", records: [...contactsStore], operation_successful: deleted });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
  // Vulnerable SQL Drop simulation
  else if (lowerUserMessage.startsWith("drop")) {
    // Simulating DROP TABLE contacts
    console.log('[Mock A2A Server] Dropping contactsStore (simulated)');
    contactsStore = []; 
    nextId = 1; // Reset ID counter if desired
    return NextResponse.json({ status: "dropped contacts (simulated)" });
  }
  // Show all records simulation
  else if (lowerUserMessage.startsWith("show")) {
    console.log('[Mock A2A Server] Showing contacts:', contactsStore);
    return NextResponse.json({ status: "ok", records: [...contactsStore] });
  }
  // Env var exposure simulation
  else if (lowerUserMessage.startsWith("attack env")) {
    // Simulate exposing some environment variables. Be careful in real apps!
    // For a Next.js app, server-side env vars are typically not exposed to client directly.
    // NEXT_PUBLIC_ vars are available on client.
    // This simulates finding some sensitive-looking vars if they were exposed.
    const exposedEnvs: Record<string, string> = {};
    for (const key in process.env) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes("key") || lowerKey.includes("secret") || lowerKey.includes("pass") || lowerKey.includes("token")) {
        // In a real scenario, you might only pick NEXT_PUBLIC_ ones if this was client-accessible
        // but for a mock backend server, we can imagine it has access to more.
        exposedEnvs[key] = process.env[key]?.substring(0, 20) + '... (mocked)'; // Mocked and truncated
      }
    }
     const reply = `Simulated Env exposure: ${Object.keys(exposedEnvs).length > 0 ? JSON.stringify(exposedEnvs) : '[no sensitive-like env vars found or configured for exposure in mock]'}`;
    console.log('[Mock A2A Server] Env exposure attempt. Replying with:', reply);
    return NextResponse.json({
      id: taskId,
      status: { state: "completed" },
      messages: [
        data.message, // Echo the original message part
        { role: "agent", parts: [{ text: reply }] }
      ]
    });
  }
  // Default response
  else {
    const reply = `Unknown or unsupported command: "${userMessage.substring(0,50)}...". Supported: 'insert', 'delete', 'drop', 'show', 'attack env'.`;
    console.log('[Mock A2A Server] Unknown command. Replying with:', reply);
    return NextResponse.json({
      id: taskId,
      status: { state: "completed" },
      messages: [
        data.message,
        { role: "agent", parts: [{ text: reply }] }
      ]
    });
  }
}

async function handleDebugSqli() {
  // This simulates the effect of the SQLi from the Python example
  // which was "('attacker', 'hacked'); DROP TABLE users;--"
  // Since we don't have a 'users' table or direct SQL execution,
  // we'll simulate a catastrophic effect on our 'contacts' store.
  const originalContactsCount = contactsStore.length;
  resetInMemoryDb(); // Or contactsStore = []; to simulate drop
  const dropped = originalContactsCount > 0 && contactsStore.length === 0;

  console.log('[Mock A2A Server /debug/sqli] Simulated SQLi. DB reset.');
  return NextResponse.json({
    status: "simulated_sqli_executed",
    message: "Simulated a SQL injection that reset/dropped the contacts data.",
    contacts_dropped_or_reset: dropped,
    current_contacts_after_simulated_sqli: [...contactsStore]
  });
}


// --- Main Handler ---
async function handler(req: NextRequest, { params }: { params: { slug: string[] }}) {
  const path = `/${params.slug.join('/')}`;
  console.log(`[Mock A2A Server] Request: ${req.method} ${path}`);

  if (req.method === 'GET') {
    if (path === '/.well-known/agent.json') {
      return handleAgentCard();
    }
    if (path === '/debug/sqli') {
      return handleDebugSqli();
    }
  } else if (req.method === 'POST') {
    if (path === '/debug/reset') {
      return handleDebugReset();
    }
    if (path === '/tasks/send') {
      return handleTasksSend(req);
    }
  }

  console.warn(`[Mock A2A Server] Path not found or method not allowed: ${req.method} ${path}`);
  return NextResponse.json({ error: `Mock A2A: Path not found or method ${req.method} not allowed for ${path}` }, { status: 404 });
}

export { handler as GET, handler as POST };
