<script setup>
    import { ref, computed } from 'vue'
    
    const props = defineProps({
      appointments: {
        type: Array,
        default: () => []
      }
    })
    
    const emit = defineEmits(['filter']) // Seçilen tarihi dışarı bildirir
    
    const currentMonth = ref(new Date())
    const selectedDate = ref(null)
    
    // A. Ayı Değiştir
    const changeMonth = (step) => {
      const newDate = new Date(currentMonth.value)
      newDate.setMonth(newDate.getMonth() + step)
      currentMonth.value = newDate
    }
    
    // B. Başlık
    const formattedMonthTitle = computed(() => {
      return currentMonth.value.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    })
    
    // C. Grid Mantığı
    const calendarGrid = computed(() => {
      const year = currentMonth.value.getFullYear()
      const month = currentMonth.value.getMonth()
      
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      
      const days = []
      
      // Boşluklar (Pazartesi başlangıçlı)
      const startDay = (firstDay.getDay() + 6) % 7 
      for (let i = 0; i < startDay; i++) {
        days.push({ empty: true })
      }
    
      // Günler
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        
        // Yoğunluk Hesapla (Sadece Pending ve Approved)
        const count = props.appointments.filter(a => 
          a.appointment_date === dateStr && 
          ['pending', 'approved'].includes(a.status)
        ).length
    
        // Renkler
        let colorClass = 'bg-gray-50 text-gray-400 hover:bg-gray-100'
        if (count > 0) colorClass = 'bg-green-100 text-green-700 font-bold hover:bg-green-200'
        if (count > 2) colorClass = 'bg-orange-100 text-orange-700 font-bold hover:bg-orange-200'
        if (count > 5) colorClass = 'bg-red-100 text-red-700 font-bold hover:bg-red-200'
    
        const isSelected = selectedDate.value === dateStr
        const isToday = dateStr === new Date().toISOString().split('T')[0]
    
        days.push({ day: d, date: dateStr, count, colorClass, isSelected, isToday })
      }
    
      return days
    })
    
    // D. Tıklama İşlemi
    const handleDateClick = (date) => {
      if (selectedDate.value === date) {
        selectedDate.value = null // Seçimi kaldır
      } else {
        selectedDate.value = date // Seç
      }
      emit('filter', selectedDate.value) // Ana sayfaya haber ver
    }
    
    // Format Yardımcısı
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const options = { weekday: 'short', month: 'long', day: 'numeric' }
      return new Date(dateString).toLocaleDateString('tr-TR', options)
    }
    </script>
    
    <template>
      <div class="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm animate-fade-in">
        
        <!-- Başlık ve Navigasyon -->
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-bold text-gray-900 text-lg flex items-center gap-2">
            <span>📊</span> Aylık Yoğunluk
          </h2>
          <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button @click="changeMonth(-1)" class="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md transition text-gray-600">‹</button>
            <span class="text-sm font-bold text-gray-900 w-32 text-center">{{ formattedMonthTitle }}</span>
            <button @click="changeMonth(1)" class="w-8 h-8 flex items-center justify-center hover:bg-white rounded-md transition text-gray-600">›</button>
          </div>
        </div>
    
        <!-- Takvim Grid -->
        <div class="grid grid-cols-7 gap-2 mb-2">
          <div v-for="day in ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']" :key="day" class="text-center text-xs font-bold text-gray-400 uppercase">
            {{ day }}
          </div>
          
          <div v-for="(item, index) in calendarGrid" :key="index">
            <div 
              v-if="!item.empty"
              @click="handleDateClick(item.date)"
              class="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition relative border-2"
              :class="[
                item.colorClass,
                item.isSelected ? 'border-primary-600 ring-2 ring-primary-100 z-10 scale-105' : 'border-transparent',
                item.isToday ? 'ring-2 ring-blue-200' : ''
              ]"
              :title="`${item.date} - ${item.count} Randevu`"
            >
              <span class="text-sm">{{ item.day }}</span>
              <div class="flex gap-0.5 mt-1" v-if="item.count > 0">
                  <div v-for="n in Math.min(item.count, 4)" :key="n" class="w-1 h-1 rounded-full bg-current opacity-50"></div>
              </div>
            </div>
            <div v-else class="aspect-square"></div>
          </div>
        </div>
        
        <!-- Filtre Bilgisi -->
        <div v-if="selectedDate" class="mt-4 flex justify-between items-center bg-primary-50 text-primary-700 px-4 py-2 rounded-lg text-sm border border-primary-100">
          <span>📅 <b>{{ formatDate(selectedDate) }}</b> randevuları listeleniyor.</span>
          <button @click="handleDateClick(selectedDate)" class="text-xs font-bold underline hover:text-primary-900">Temizle</button>
        </div>
    
      </div>
    </template>