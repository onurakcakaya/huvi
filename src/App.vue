<script setup>
import { onMounted, watch } from 'vue'
import { useAuthStore } from './stores/auth' // Auth Store'u çağırıyoruz
import { supabase } from './supabase'

const authStore = useAuthStore()

// ---------------------------------------------------------
// BİLDİRİM KAYIT FONKSİYONU 🔔
// Kullanıcının Cihaz Kimliğini (OneSignal ID) alıp veritabanına yazar.
// ---------------------------------------------------------
const saveOneSignalId = async () => {
  // Eğer kullanıcı giriş yapmamışsa işlem yapma
  if (!authStore.user) return 

  try {
    // OneSignal kütüphanesinin yüklenmesini bekle
    window.OneSignalDeferred = window.OneSignalDeferred || []
    
    window.OneSignalDeferred.push(async function(OneSignal) {
      // 1. Kullanıcının Bildirim ID'sini al (Subscription ID)
      const id = await OneSignal.User.PushSubscription.id
      
      // 2. İzin durumu kontrolü (Kullanıcı "İzin Ver" demiş mi?)
      const isOptedIn = await OneSignal.User.PushSubscription.optedIn

      // ID varsa ve izin verilmişse veritabanına kaydet
      if (id && isOptedIn) {
        console.log('Bildirim Kimliği Algılandı:', id)
        
        const { error } = await supabase
          .from('profiles')
          .update({ onesignal_id: id }) // profiles tablosundaki sütuna yaz
          .eq('id', authStore.user.id)
        
        if (error) console.error('ID Veritabanına yazılamadı:', error)
      }
    })
  } catch (error) {
    console.error('OneSignal Entegrasyon Hatası:', error)
  }
}

// ---------------------------------------------------------
// YAŞAM DÖNGÜSÜ (LIFECYCLE)
// ---------------------------------------------------------
onMounted(() => {
  // 1. Uygulama açılınca oturumu kontrol et
  authStore.initialize()
  
  // 2. Bildirim kaydını dene (3 saniye gecikmeli ki site tam yüklensin)
  setTimeout(() => {
    saveOneSignalId()
  }, 3000)
})

// 3. Kullanıcı sonradan giriş yaparsa (Login sayfasından gelirse) tekrar dene
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    setTimeout(() => {
      saveOneSignalId()
    }, 2000)
  }
})
</script>

<template>
  <!-- RouterView ile sayfalar arasında yumuşak geçiş efekti -->
  <RouterView v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </RouterView>
</template>

<style>
/* SAYFA GEÇİŞ ANİMASYONLARI */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Genel Scrollbar Düzenlemesi (İsteğe Bağlı - Şık görünüm için) */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1; 
}
::-webkit-scrollbar-thumb {
  background: #d65063; 
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #b93c4e; 
}
</style>