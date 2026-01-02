<script setup>
  import { onMounted, ref } from 'vue'
  import { supabase } from './supabase'
  
  const message = ref('')
  
  onMounted(async () => {
    // Supabase bağlantısını test ediyoruz
    console.log('Supabase istemcisi:', supabase)
    
    if (supabase) {
      message.value = 'Supabase ile bağlantı başarılı! 🚀'
    } else {
      message.value = 'Bir sorun var...'
    }
  })
  </script>
  
  <template>
    <!-- RouterView'i Transition ile sarmalıyoruz -->
    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>
  </template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
