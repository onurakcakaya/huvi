// supabase/functions/send-push/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// OneSignal Ayarları (Birazdan Environment Variable olarak gireceğiz ama kodda yapıyı kuralım)
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')!
const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  try {
    // 1. Webhook'tan gelen veriyi al
    const payload = await req.json()
    
    // Sadece INSERT (Yeni Takip) işleminde çalışsın
    if (payload.type !== 'INSERT' || payload.table !== 'follows') {
      return new Response('Not a follow event', { status: 200 })
    }

    const { follower_id, following_id } = payload.record

    // 2. Takip Edenin ismini bul (Bildirimde yazacak: "Ahmet seni takip etti")
    const { data: followerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', follower_id)
      .single()

    // 3. Takip Edilenin OneSignal ID'sini bul (Kime göndereceğiz?)
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('onesignal_id')
      .eq('id', following_id)
      .single()

    // Eğer hedef kullanıcının bildirim izni yoksa dur
    if (!targetProfile?.onesignal_id) {
      return new Response('User has no notification ID', { status: 200 })
    }

    // 4. OneSignal'e İsteği Gönder
    const message = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: [targetProfile.onesignal_id],
      headings: { en: "Yeni Takipçi! 🎉" },
      contents: { en: `${followerProfile?.full_name || 'Biri'} seni takip etmeye başladı.` },
      url: "https://huvi.vercel.app/dashboard" // Tıklayınca nereye gitsin?
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${ONESIGNAL_API_KEY}`
      },
      body: JSON.stringify(message)
    })

    const result = await response.json()
    console.log("Bildirim Sonucu:", result)

    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})