import { NextResponse } from 'next/server';import { hashIp, requestIp } from '@/lib/analytics/hash-ip';
export async function POST(request:Request){const body=await request.json().catch(()=>({}));const ip_hash=await hashIp(requestIp(request));return NextResponse.json({ok:true,event:{...body,ip_hash,created_at:new Date().toISOString()}})}
