import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
// useAuthStore'u burada import etmiyoruz, çünkü pinia daha yüklenmedi hatası alabiliriz.
// Fonksiyonun içinde çağıracağız.

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      // BU SAYFAYA ÖZEL GÜVENLİK KURALI:
      meta: { requiresAuth: true, requiresRole: true } 
    },
    {
        path: '/account',
        name: 'account',
        component: () => import('../views/AccountView.vue'),
        meta: { requiresAuth: true } // Sadece giriş yapanlar girebilir
      },
      {
        path: '/create-post',
        name: 'create-post',
        component: () => import('../views/CreatePostView.vue'),
        meta: { requiresAuth: true, requiresRole: true } // Sadece yayıncılar
      },
      {
        path: '/post/:id', // :id kısmı değişkendir (1, 2, 55 vb.)
        name: 'post-detail',
        component: () => import('../views/PostDetailView.vue')
      },
      {
        path: '/dashboard/settings', // Alt sayfa mantığı
        name: 'publisher-settings',
        component: () => import('../views/PublisherSettingsView.vue'),
        meta: { requiresAuth: true, requiresRole: true }
      },
      {
        path: '/profile/:id', // Dinamik ID alacak
        name: 'profile',
        component: () => import('../views/ProfileView.vue')
      },
      {
        path: '/saved',
        name: 'saved-posts',
        component: () => import('../views/SavedPostsView.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/liked',
        name: 'liked-posts',
        component: () => import('../views/LikedPostsView.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/dashboard/posts',
        name: 'my-posts',
        component: () => import('../views/MyPostsView.vue'),
        meta: { requiresAuth: true, requiresRole: true } // Sadece Yayıncılar
      },
      {
        path: '/edit-post/:id', // Dinamik ID
        name: 'edit-post',
        component: () => import('../views/EditPostView.vue'),
        meta: { requiresAuth: true, requiresRole: true }
      },
      {
        path: '/search',
        name: 'search',
        component: () => import('../views/SearchView.vue')
      },
      // Şifremi Unuttum
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue')
    },
    // Şifre Yenileme (Linkten gelinen yer)
    {
      path: '/update-password',
      name: 'update-password',
      component: () => import('../views/UpdatePasswordView.vue')
    },
    // 404 Sayfası (EN SONA EKLENMELİ - Önemli!)
    // :pathMatch(.*)* demek "Yukarıdakilerin hiçbiri değilse buraya gel" demektir.
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

// GLOBAL KONTROL MEKANİZMASI
router.beforeEach(async (to, from, next) => {
  // Pinia Store'a erişmek için import işlemini burada yapıyoruz (Best Practice)
  const { useAuthStore } = await import('../stores/auth')
  const authStore = useAuthStore()

  // Sayfa yenilendiğinde kullanıcı bilgisi henüz gelmemiş olabilir, bekle:
  if (authStore.loading) {
     await authStore.initialize()
  }

  const user = authStore.user
  const role = authStore.profile?.role

  // 1. Giriş yapılması gereken bir sayfa mı?
  if (to.meta.requiresAuth && !user) {
    next('/login') // Giriş yapmamışsa şutla
    return
  }

  // 2. Rol kontrolü gereken bir sayfa mı? (Dashboard gibi)
  if (to.meta.requiresRole) {
    if (['publisher', 'admin'].includes(role)) {
      next() // Yetkisi var, geçsin
    } else {
      next('/') // Yetkisi yok (User), anasayfaya at
    }
    return
  }

  next() // Sorun yoksa devam et
})

export default router