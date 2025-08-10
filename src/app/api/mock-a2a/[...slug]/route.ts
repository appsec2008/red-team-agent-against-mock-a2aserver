
// src/app/api/mock-a2a/[...slug]/route.ts
import { type NextRequest, NextResponse } from 'next/server';

// --- In-memory stores for a multi-agent insurance claim system ---

// Mock database of insurance policies
let policiesStore: Record<string, { policyId: string; holderName: string; is_active: boolean; coverage_details: string }> = {};
// Mock database of claims and their states
let claimsStore: Record<string, { claimId: string; policyId: string; submitted_data: any; ocr_result?: any; validation_result?: any; payment_status?: string; status: 'submitted' | 'processing' | 'validated' | 'rejected' | 'paid' | 'error' }> = {};
let nextClaimId = 1001;

function resetInMemoryDb() {
  policiesStore = {
    "policy-123": { policyId: "policy-123", holderName: "Alice", is_active: true, coverage_details: "Full coverage for standard procedures." },
    "policy-456": { policyId: "policy-456", holderName: "Bob", is_active: false, coverage_details: "Expired policy." },
    "policy-789": { policyId: "policy-789", holderName: "Charlie", is_active: true, coverage_details: "Limited coverage, excludes cosmetic procedures." },
  };
  claimsStore = {};
  nextClaimId = 1001;
  console.log('[Mock Multi-Agent Server] In-memory DB reset.');
}

// Initialize DB on server start/reload
resetInMemoryDb();


// --- Agent Logic ---

// 1. OCR Agent Logic
async function handleOcrAgent(req: NextRequest) {
  const { claim_document, policy_id } = await req.json();

  if (!claim_document || !policy_id) {
    return NextResponse.json({ error: "Missing claim_document or policy_id" }, { status: 400 });
  }

  // Simulate OCR processing (MCP Tool Use simulation)
  console.log(`[OCR Agent] Received claim document for policy ${policy_id}. Simulating OCR...`);
  const ocr_result = {
    claimId: `claim-${nextClaimId}`,
    procedure_code: "P-PROC-001",
    amount: 150.75,
    date: new Date().toISOString(),
    provider: "General Hospital",
    text_content: claim_document,
  };
  nextClaimId++;
  
  // Store the initial claim
  claimsStore[ocr_result.claimId] = {
      claimId: ocr_result.claimId,
      policyId: policy_id,
      submitted_data: claim_document,
      ocr_result: ocr_result,
      status: 'processing'
  };

  // Simulate A2A call to Policy Agent
  const policyAgentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/mock-a2a/policy-agent/validate`;
  console.log(`[OCR Agent] Forwarding structured data to Policy Agent at ${policyAgentUrl}`);
  
  try {
    const a2aResponse = await fetch(policyAgentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim_data: ocr_result, policy_id: policy_id }),
    });

    const a2aResponseData = await a2aResponse.json();
    if (!a2aResponse.ok) {
        throw new Error(`Policy Agent responded with status ${a2aResponse.status}: ${JSON.stringify(a2aResponseData)}`);
    }
    
    console.log(`[OCR Agent] Received response from Policy Agent:`, a2aResponseData);
    
    // Return the final outcome to the original caller
    return NextResponse.json({
      status: "completed",
      claimId: ocr_result.claimId,
      ocr_result,
      forwarding_status: a2aResponseData,
    });

  } catch (error: any) {
    claimsStore[ocr_result.claimId].status = 'error';
    claimsStore[ocr_result.claimId].payment_status = `Error during policy check: ${error.message}`;
    return NextResponse.json({ error: "Failed to communicate with Policy Agent", details: error.message }, { status: 502 });
  }
}

// 2. Policy Agent Logic
async function handlePolicyAgent(req: NextRequest) {
  const { claim_data, policy_id } = await req.json();

  if (!claim_data || !policy_id) {
    return NextResponse.json({ error: "Missing claim_data or policy_id" }, { status: 400 });
  }
  
  console.log(`[Policy Agent] Received claim ${claim_data.claimId} for validation against policy ${policy_id}.`);
  const policy = policiesStore[policy_id];
  let validation_result: {is_valid: boolean; reason: string};

  if (!policy) {
    validation_result = { is_valid: false, reason: "Policy ID not found." };
  } else if (!policy.is_active) {
    validation_result = { is_valid: false, reason: "Policy is not active." };
  } else {
    validation_result = { is_valid: true, reason: "Claim is consistent with active policy." };
  }
  
  claimsStore[claim_data.claimId].validation_result = validation_result;
  claimsStore[claim_data.claimId].status = validation_result.is_valid ? 'validated' : 'rejected';

  // Simulate A2A call to Approval Agent
  const approvalAgentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/mock-a2a/approval-agent/process-payment`;
  console.log(`[Policy Agent] Forwarding validation status to Approval Agent at ${approvalAgentUrl}`);

  try {
     const a2aResponse = await fetch(approvalAgentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim_id: claim_data.claimId, validation_result }),
    });

    const a2aResponseData = await a2aResponse.json();
    if (!a2aResponse.ok) {
        throw new Error(`Approval Agent responded with status ${a2aResponse.status}: ${JSON.stringify(a2aResponseData)}`);
    }

    console.log(`[Policy Agent] Received response from Approval Agent:`, a2aResponseData);

    return NextResponse.json({
        status: "policy_check_complete",
        validation_result,
        forwarding_status: a2aResponseData
    });
  } catch (error: any) {
    claimsStore[claim_data.claimId].status = 'error';
    claimsStore[claim_data.claimId].payment_status = `Error during approval forwarding: ${error.message}`;
    return NextResponse.json({ error: "Failed to communicate with Approval Agent", details: error.message }, { status: 502 });
  }
}

// 3. Approval Agent Logic
async function handleApprovalAgent(req: NextRequest) {
  const { claim_id, validation_result } = await req.json();

  if (!claim_id || !validation_result) {
    return NextResponse.json({ error: "Missing claim_id or validation_result" }, { status: 400 });
  }
  
  console.log(`[Approval Agent] Received validation for claim ${claim_id}.`);
  const claim = claimsStore[claim_id];
  if (!claim) {
     return NextResponse.json({ error: "Claim not found." }, { status: 404 });
  }

  if (validation_result.is_valid) {
    // Simulate scheduling payment (MCP Tool Use simulation)
    console.log(`[Approval Agent] Claim ${claim_id} is valid. Simulating payment scheduling...`);
    claim.payment_status = `Payment of ${claim.ocr_result?.amount} scheduled. Confirmation: PMT-${Date.now()}`;
    claim.status = 'paid';
    return NextResponse.json({ status: "payment_scheduled", details: claim.payment_status });
  } else {
    console.log(`[Approval Agent] Claim ${claim_id} is invalid. Reason: ${validation_result.reason}.`);
    claim.payment_status = `Payment rejected. Reason: ${validation_result.reason}`;
    claim.status = 'rejected';
    return NextResponse.json({ status: "payment_rejected", reason: validation_result.reason });
  }
}

// --- Main Handler ---
async function handler(req: NextRequest, { params }: { params: { slug: string[] }}) {
  const path = `/${params.slug.join('/')}`;
  console.log(`[Mock Multi-Agent Server] Request: ${req.method} ${path}`);

  if (req.method === 'POST') {
    // OCR Agent Endpoint
    if (path === '/ocr-agent/submit-claim') {
      return handleOcrAgent(req);
    }
    // Policy Agent Endpoint
    if (path === '/policy-agent/validate') {
      return handlePolicyAgent(req);
    }
    // Approval Agent Endpoint
    if (path === '/approval-agent/process-payment') {
      return handleApprovalAgent(req);
    }
  }

  // Debug Endpoints
  if (path === '/debug/reset' && req.method === 'POST') {
    resetInMemoryDb();
    return NextResponse.json({ status: "reset_successful" });
  }
  if (path === '/debug/claims' && req.method === 'GET') {
    return NextResponse.json(claimsStore);
  }
  if (path === '/debug/policies' && req.method === 'GET') {
    return NextResponse.json(policiesStore);
  }


  console.warn(`[Mock Multi-Agent Server] Path not found or method not allowed: ${req.method} ${path}`);
  return NextResponse.json({ error: `Mock Multi-Agent Server: Path not found or method ${req.method} not allowed for ${path}` }, { status: 404 });
}

export { handler as GET, handler as POST };
