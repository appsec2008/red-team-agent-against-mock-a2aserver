
// src/app/api/mock-a2a/[...slug]/route.ts
import { type NextRequest, NextResponse } from 'next/server';

// In-memory store for config for demonstration purposes
const mockConfigStore: Record<string, string> = {};

async function handlePostRequest(req: NextRequest, path: string) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    body = {}; // Gracefully handle empty or non-JSON body
  }

  console.log(`[Mock A2A Server] POST ${path} with body:`, body);

  if (path === '/api/v1/tasks/run') {
    const { task_name, parameters } = body;
    if (!task_name) {
      return NextResponse.json({ error: "task_name is required" }, { status: 400 });
    }
    if (task_name === "cleanup_temp_files") {
      return NextResponse.json({ 
        status: "SUCCESS", 
        message: `Task '${task_name}' executed. Temporary files cleaned.`,
        details: { parameters_received: parameters }
      });
    } else if (task_name === "send_generic_notification") {
      return NextResponse.json({ 
        status: "SUCCESS", 
        message: `Task '${task_name}' executed. Notification sent.`,
        details: { parameters_received: parameters }
      });
    } else {
      return NextResponse.json({ 
        status: "NOT_FOUND", 
        message: `Task '${task_name}' is not a recognized task.`,
        details: { parameters_received: parameters }
      }, { status: 404 });
    }
  } else if (path === '/api/v1/config/update') {
    const { config_key, config_value } = body;
    if (config_key === undefined || config_value === undefined) {
      return NextResponse.json({ error: "config_key and config_value are required" }, { status: 400 });
    }
    mockConfigStore[config_key] = config_value;
    console.log(`[Mock A2A Server] Config updated: ${config_key} = ${config_value}. Current store:`, mockConfigStore);
    return NextResponse.json({
      status: "SUCCESS",
      message: `Configuration key '${config_key}' updated.`,
      new_value_preview: config_value
    });
  } else if (path === '/api/v1/auth/unlock') {
    const { user_id, override_approval } = body;
     console.log(`[Mock A2A Server - Auth API] Unlock request for user_id: ${user_id}, override_approval: ${override_approval}`);
    if (override_approval === true || override_approval === "true") {
        return NextResponse.json({ message: `User ${user_id} unlocked via override.`, status: "UNLOCKED_BY_OVERRIDE" }, { status: 200 });
    } else {
        return NextResponse.json({ message: `Override approval required to unlock user ${user_id}.`, status: "UNLOCK_FAILED_NEEDS_OVERRIDE" }, { status: 403 });
    }
  }

  return NextResponse.json({ error: 'Mock A2A: Not Found' }, { status: 404 });
}

async function handleGetRequest(req: NextRequest, path: string) {
  console.log(`[Mock A2A Server] GET ${path}`);
  if (path === '/api/v1/system/status') {
    return NextResponse.json({
      status: "OPERATIONAL",
      version: "0.1-internal", // Mark as internal version
      timestamp: new Date().toISOString(),
      config_snapshot: { ...mockConfigStore } // Optionally return current config
    });
  }
  return NextResponse.json({ error: 'Mock A2A: Not Found' }, { status: 404 });
}

async function handler(req: NextRequest, { params }: { params: { slug: string[] }}) {
  const path = `/${params.slug.join('/')}`;

  if (req.method === 'POST') {
    return handlePostRequest(req, path);
  } else if (req.method === 'GET') {
    return handleGetRequest(req, path);
  }
  // Add other methods (PUT, DELETE, etc.) as needed

  return NextResponse.json({ error: `Mock A2A: Method ${req.method} Not Allowed for ${path}` }, { status: 405 });
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH, handler as OPTIONS, handler as HEAD };
