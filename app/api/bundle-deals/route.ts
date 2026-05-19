import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// 輔助函式：取得所有活動
async function getAllDeals() {
  const { data, error } = await supabase
    .from('announcements')
    .select('content')
    .eq('title', '[SYSTEM_BUNDLE_DEALS]')
    .maybeSingle();
    
  if (error) throw error;
  
  if (data && data.content) {
    return JSON.parse(data.content);
  }
  return [];
}

// 輔助函式：儲存所有活動
async function saveDeals(deals: any[]) {
  const { data, error } = await supabase
    .from('announcements')
    .select('id')
    .eq('title', '[SYSTEM_BUNDLE_DEALS]')
    .maybeSingle();
    
  if (error) throw error;
  
  if (data) {
    const { error: updateError } = await supabase
      .from('announcements')
      .update({ content: JSON.stringify(deals) })
      .eq('title', '[SYSTEM_BUNDLE_DEALS]');
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase
      .from('announcements')
      .insert({
        title: '[SYSTEM_BUNDLE_DEALS]',
        tag: 'SYSTEM',
        content: JSON.stringify(deals),
        color: 'bg-indigo-900'
      });
    if (insertError) throw insertError;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('isAdmin') === 'true';

    let deals = await getAllDeals();
    
    if (!isAdmin) {
      const now = new Date();
      deals = deals.filter((deal: any) => {
        return deal.is_active && 
               new Date(deal.start_time) <= now && 
               new Date(deal.end_time) >= now;
      });
    }

    return NextResponse.json({ success: true, data: deals });
  } catch (error: any) {
    console.error('Fetch bundle deals error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const deals = await getAllDeals();
    
    const newDeal = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...body
    };
    
    deals.push(newDeal);
    await saveDeals(deals);
    
    return NextResponse.json({ success: true, data: newDeal });
  } catch (error: any) {
    console.error('Create bundle deal error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...payload } = body;
    
    const deals = await getAllDeals();
    const index = deals.findIndex((d: any) => d.id === id);
    
    if (index === -1) {
      return NextResponse.json({ success: false, error: '找不到該活動' }, { status: 404 });
    }
    
    deals[index] = { ...deals[index], ...payload };
    await saveDeals(deals);
    
    return NextResponse.json({ success: true, data: deals[index] });
  } catch (error: any) {
    console.error('Update bundle deal error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    
    const deals = await getAllDeals();
    const updatedDeals = deals.filter((d: any) => d.id !== id);
    
    await saveDeals(updatedDeals);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete bundle deal error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
