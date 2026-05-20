import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .neq('tag', 'SYSTEM').neq('tag', 'DELETED').neq('tag', 'DELETED')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, announcements: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, tag, content, color, image_url, action_label, action_href } = await request.json();

    if (!title || !tag) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
    }

    let finalImageUrl = image_url || null;

    if (image_url && image_url.startsWith('data:image')) {
      try {
        const mimeType = image_url.match(/data:([^;]+);base64/)?.[1] || 'image/png';
        const base64Data = image_url.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = mimeType.split('/')[1] || 'png';
        const fileName = `announcement_${Date.now()}.${ext}`;
        const filePath = `announcements/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          finalImageUrl = publicUrl;
        } else {
          console.error('Announcement Image Storage Upload Error:', uploadError);
        }
      } catch (uploadErr) {
        console.error('Failed to parse or upload announcement image:', uploadErr);
      }
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        tag,
        content,
        color: color || 'bg-emerald-900',
        image_url: finalImageUrl,
        action_label: action_label || '立即查看',
        action_href: action_href || '/'
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, announcement: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: '缺少 ID' }, { status: 400 });

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, title, tag, content, color, image_url, action_label, action_href } = await request.json();

    if (!id || !title || !tag) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 });
    }

    let finalImageUrl = image_url || null;

    if (image_url && image_url.startsWith('data:image')) {
      try {
        const mimeType = image_url.match(/data:([^;]+);base64/)?.[1] || 'image/png';
        const base64Data = image_url.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = mimeType.split('/')[1] || 'png';
        const fileName = `announcement_${Date.now()}.${ext}`;
        const filePath = `announcements/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          finalImageUrl = publicUrl;
        } else {
          console.error('Announcement Image Update Upload Error:', uploadError);
        }
      } catch (uploadErr) {
        console.error('Failed to parse or upload announcement update image:', uploadErr);
      }
    } else {
      // 如果原本就是 https:// url 則保留原樣
      finalImageUrl = image_url;
    }

    const { data, error } = await supabase
      .from('announcements')
      .update({
        title,
        tag,
        content,
        color: color || 'bg-emerald-900',
        image_url: finalImageUrl,
        action_label: action_label || '立即查看',
        action_href: action_href || '/'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, announcement: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
