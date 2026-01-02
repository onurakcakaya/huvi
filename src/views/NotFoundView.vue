<script setup>
    import { RouterLink } from 'vue-router'
    </script>
    
    <template>
      <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        
        <!-- Büyük Sayı -->
        <h1 class="text-9xl font-bold text-primary-200">404</h1>
        
        <!-- Mesaj -->
        <h2 class="text-3xl font-bold text-gray-800 mt-4">Ops! Kaybolmuş gibisin.</h2>
        <p class="text-gray-500 mt-2 max-w-md">
          Aradığın sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
        </p>
    
        <!-- Buton -->
        <RouterLink 
          to="/" 
          class="mt-8 px-8 py-3 bg-primary-600 text-white rounded-full font-bold shadow-lg hover:bg-primary-700 transition transform hover:-translate-y-1"
        >
          🏠 Anasayfaya Dön
        </RouterLink>
    
      </div>
    </template>