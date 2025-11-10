import React, { useEffect, useState, useCallback, useMemo, Suspense, useRef } from 'react';
// ...otros imports

// ...dentro del componente App()
// Enviar email de confirmación al detectar ?success=true y usuario logueado con orderId
// (Coloca este useEffect después de la declaración de App y los estados)
// useEffect(() => {
//     const searchParams = new URLSearchParams(window.location.search);
//     if (searchParams.get("success") === "true") {
//         const email = user?.email;
//         const orderId = lastOrder?.id;
//         if (email && orderId) {
//             fetch("/api/send-order-email", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ email, orderId }),
//             });
//         }
//     }
// }, [user, lastOrder]);
import PurchaseSuccess from './components/PurchaseSuccess';
import Cart from './components/Cart';
import Wishlist from './components/Wishlist';
import ProductCard from './components/ProductCard';
import Header from './components/Header';
/* eslint-disable no-unused-vars */
import {
    ShoppingCart,
    Heart,
    Search,
    Sun,
    Moon,
    User,
    X,
    ArrowLeft,
    ArrowRight,
    Link as LinkIcon,
    Instagram,
    AlertTriangle,
    Menu,
} from 'lucide-react'
import EnhancedAuth from './components/EnhancedAuth'
import RecommendedProducts from './components/RecommendedProducts'
import ProductReviews from './components/ProductReviews'
import LuckyWheel from './components/LuckyWheel'
import ProgressAndMissions from './components/ProgressAndMissions'
import SubscribeBar from './components/SubscribeBar'
// Load UserDashboard lazily to avoid runtime reference issues
const LazyUserDashboard = React.lazy(() => import('./components/UserDashboard'))
import {
    trackProductView,
    trackSearch,
    trackCartAction,
    trackCategoryView,
    trackGenderView,
    trackStyleView,
} from './utils/tracking'
import { classifyProductGender } from './utils/genderClassifier'
import { classifyProductStyle } from './utils/styleClassifier'
import './styles.css'
// Admin styles removed
import LiveChatWidget from './components/LiveChatWidget'
import SimpleAdminPanel from './SimpleAdminPanel';

// =========================================================
// 1. DATA AND CONFIGURATION
// =========================================================

const BASE_COLORS = {
    LIGHT: {
        bgApp: '#f8fafc',
        bgSurface: '#ffffff',
        bgHover: '#f1f5f9',
        textPrimary: '#1e293b',
        textSecondary: '#64748b',
        textMuted: '#94a3b8',
        acentoRojo: '#e11d48',
        acentoVerde: '#059669',
        acentoAzul: '#0ea5e9',
        socialInstagram: '#e11d48',
        btnPrimaryBG: '#1e293b',
        btnPrimaryHover: '#334155',
        btnSecondaryBG: '#f1f5f9',
        btnSecondaryHover: '#e2e8f0',
        border: '#e2e8f0',
        borderHover: '#cbd5e1',
        shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        shadowLg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        glass: 'rgba(255, 255, 255, 0.8)',
        glassBorder: 'rgba(255, 255, 255, 0.2)',
    },
    DARK: {
        bgApp: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 40%, #16213e  100%)',
        bgSurface: 'rgba(30, 30, 60, 0.85)',
        bgHover: 'rgba(60, 60, 100, 0.6)',
        textPrimary: '#f1f5f9',
        textSecondary: '#cbd5e1',
        textMuted: '#94a3b8',
        acentoRojo: '#f43f5e',
        acentoVerde: '#10b981',
        acentoAzul: '#0ea5e9',
        socialInstagram: '#f43f5e',
        btnPrimaryBG: '#f43f5e',
        btnPrimaryHover: '#e11d48',
        btnSecondaryBG: 'rgba(60, 60, 100, 0.4)',
        btnSecondaryHover: 'rgba(80, 80, 120, 0.6)',
        border: 'rgba(100, 100, 150, 0.3)',
        borderHover: '#64748b',
        shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
        shadowLg: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
        glass: 'rgba(40, 50, 90, 0.7)',
        glassBorder: 'rgba(200, 200, 255, 0.2)',
    },
}

const PRODUCT_CAROUSEL_COLORS = ['#000000', '#e91e63', '#1976D2', '#FFC107', '#9C27B0', '#00FFFF']
const TITLE_TEXT = 'BBMIA'

// Categories configuration (storefront)
const CATEGORY_LABELS = [
    { key: 'all', label: 'Todos' },
    { key: 'ropa', label: 'Ropa' },
    { key: 'joyeria', label: 'Joyería' },
    { key: 'gorros', label: 'Gorros' },
    { key: 'electronica', label: 'Electrónica' },
    { key: 'hogar', label: 'Hogar' },
    { key: 'belleza', label: 'Belleza' },
    { key: 'deportes', label: 'Deportes' },
    { key: 'ninos', label: 'Niños' },
    { key: 'accesorios', label: 'Accesorios' },
    { key: 'corses', label: 'Corsés' },
    { key: 'lenceria', label: 'Lencería' },
    { key: 'calcetines', label: 'Calcetines' },
    { key: 'brasieres', label: 'Brasieres' },
    { key: 'ofertas', label: 'Ofertas' },
]

// Normalize strings for category comparison (lowercase, strip accents)
const normalize = str =>
    (str || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

// Stripe server base URL
// Priority:
// 1) If running on Netlify (production), use site-relative Netlify Function "/api/create-checkout-session"
// 2) Else use VITE_STRIPE_SERVER_URL
// 3) Usar siempre las APIs de Vercel
const STRIPE_ENDPOINT = '/api/create-checkout-session'

// =========================================================
// 2. COMPONENTS
// =========================================================

const Button = ({
    children,
    variant = 'primary',
    onClick,
    disabled = false,
    className = '',
    ...rest
}) => {
    const theme = localStorage.getItem('bbmia-theme') || 'light'
    const colors = BASE_COLORS[(theme || 'light').toUpperCase()] || BASE_COLORS.LIGHT

    const variants = {
        primary: {
            backgroundColor: disabled ? colors.textMuted : colors.btnPrimaryBG,
            color: colors.bgSurface,
            border: 'none',
            hover: colors.btnPrimaryHover,
        },
        secondary: {
            backgroundColor: disabled ? colors.textMuted : colors.btnSecondaryBG,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            hover: colors.btnSecondaryHover,
        },
        outline: {
            backgroundColor: 'transparent',
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            hover: colors.bgHover,
        },
        danger: {
            backgroundColor: disabled ? colors.textMuted : colors.acentoRojo,
            color: '#ffffff',
            border: 'none',
            hover: colors.acentoRojo + 'dd',
        },
    }

    const style = variants[variant] || variants.primary

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`btn px-4 py-2 rounded-md font-medium transition-all ${className}`}
            style={{
                backgroundColor: style.backgroundColor,
                color: style.color,
                border: style.border,
            }}
        >
            {children}
        </button>
    )
}

// =========================================================
// 3. MAIN APP COMPONENT
// =========================================================

function App() {
    // ...otros hooks
    const detailImgRef = useRef(null);
    // Estado para la talla seleccionada en el modal de producto
    const [selectedSize, setSelectedSize] = useState('');
    // Detectar si es mobile (ancho de pantalla <= 768px)
    const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
    // Estado para el índice de imagen seleccionada en el modal de producto
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    // Estado para el producto seleccionado (modal, detalles, etc.)
    const [selectedProduct, setSelectedProduct] = useState(null);
    // Estado para mostrar/ocultar el menú lateral
    const [showMenu, setShowMenu] = useState(false);
    // Estado para notificaciones
    const [notification, setNotification] = useState(null);
    // Estado de usuario autenticado y perfil
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    // Estado para la búsqueda
    const [searchQuery, setSearchQuery] = useState('');
    // Estado para tab activo en barra inferior mobile
    const [activeTab, setActiveTab] = React.useState('home');
    // Estado para categoría seleccionada
    const [selectedCategory, setSelectedCategory] = useState('all');
    // Estado para género seleccionado
    const [selectedGender, setSelectedGender] = useState('all');
    // Estado para estilos seleccionados (arreglo de strings)
    const [selectedStyles, setSelectedStyles] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('bbmia-styles')) || [];
        } catch {
            return [];
        }
    });
    // Opciones de envío
    const SHIPPING_OPTIONS = [
        { key: 'express', label: 'UPS Express (1-2 días)', price: 39.99 },
        { key: 'usps', label: 'USPS (2-5 días hábiles)', price: 6.99 },
        { key: 'doordash', label: 'DoorDash Express (2-4 horas)', price: 12.99 },
    ];
    const [shippingOption, setShippingOption] = useState(SHIPPING_OPTIONS[0].key);
    // Estado para pantalla de éxito de compra
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastOrder, setLastOrder] = useState(null);
    // Theme
    const [theme, setTheme] = useState(() => localStorage.getItem('bbmia-theme') || 'light')
    const colors = BASE_COLORS[theme.toUpperCase()] || BASE_COLORS.LIGHT
    const logoSrc = '/bbmia-logo.png'

    // Lucky Wheel state
    const [showLuckyWheelModal, setShowLuckyWheelModal] = useState(false)

    // Products from Supabase (with fallback to localStorage)
    const [products, setProducts] = useState([])
    const [loadingProducts, setLoadingProducts] = useState(true)

    // Shopping state
    const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('bbmia-cart') || '[]'))
    const [buying, setBuying] = useState(false)
    const [wishlist, setWishlist] = useState(() =>
        JSON.parse(localStorage.getItem('bbmia-wishlist') || '[]')
    )
    // Mostrar producto compartido si la URL contiene ?product=ID
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('product');
        if (productId && products.length > 0) {
            // Aquí puedes manejar la lógica para mostrar el producto compartido
            // por ejemplo, abrir el modal del producto encontrado
            const found = products.find(p => String(p.id) === String(productId));
            if (found) {
                setSelectedProduct(found);
                setSelectedImageIndex(0);
                setSelectedSize('');
            }
        }
    }, [products]);
    const [showAuthModal, setShowAuthModal] = useState(false)

    // Hidden admin access removed

    // =========================================================
    // EFFECTS
    // =========================================================

    useEffect(() => {
        localStorage.setItem('bbmia-theme', theme)
        document.body.style.background =
            theme === 'dark' ? BASE_COLORS.DARK.bgApp : BASE_COLORS.LIGHT.bgApp
    }, [theme])

    useEffect(() => {
        localStorage.setItem('bbmia-cart', JSON.stringify(cart))
    }, [cart])

    useEffect(() => {
        localStorage.setItem('bbmia-wishlist', JSON.stringify(wishlist))
    }, [wishlist])

    useEffect(() => {
        localStorage.setItem('bbmia-category', selectedCategory)
        // Track category view when user switches categories
        if (selectedCategory && selectedCategory !== 'all') {
            const categoryProducts = products.filter(p => p.category === selectedCategory)
            trackCategoryView(selectedCategory, categoryProducts.length)
        }
    }, [selectedCategory, products])

    // Track gender views when filter changes
    useEffect(() => {
        localStorage.setItem('bbmia-gender', selectedGender)
        const count = products.filter(p => {
            const g = classifyProductGender(p)
            if (selectedGender === 'all') return true
            if (selectedGender === 'men') return g === 'men' || g === 'unisex'
            if (selectedGender === 'women') return g === 'women' || g === 'unisex'
            if (selectedGender === 'unisex') return g === 'unisex'
            return true
        }).length
        trackGenderView(selectedGender, count)
    }, [selectedGender, products])

    // Track style views when filter changes
    useEffect(() => {
        localStorage.setItem('bbmia-styles', JSON.stringify(selectedStyles))
        const count = products.filter(p => {
            const s = classifyProductStyle(p)
            if (!Array.isArray(s)) return false
            if (selectedStyles.length === 0) return true
            return s.some(style => selectedStyles.includes(style))
        }).length
        trackStyleView(selectedStyles, count)
    }, [selectedStyles, products])

    // Track search queries with debounce
    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length === 0) return

        const timer = setTimeout(() => {
            // Calculate filtered count for tracking
            let count = 0
            const q = searchQuery.trim().toLowerCase()
            count = products.filter(p => {
                const matchesSearch =
                    p.name.toLowerCase().includes(q) ||
                    (p.description && p.description.toLowerCase().includes(q))
                const matchesCategory =
                    selectedCategory === 'all' || p.category === selectedCategory
                return matchesSearch && matchesCategory
            }).length

            trackSearch(searchQuery, count)
        }, 1000) // Wait 1 second after user stops typing

        return () => clearTimeout(timer)
    }, [searchQuery, products, selectedCategory])

    // Load products from Supabase directly
    useEffect(() => {
        setLoadingProducts(true);
        const loadProducts = async () => {
            try {
                const { fetchProducts } = await import('./supabase');
                const data = await fetchProducts();
                setProducts(data || []);
            } catch (error) {
                console.error('Error loading products:', error);
                setNotification({ message: 'Error cargando productos', color: colors.acentoRojo });
            } finally {
                setLoadingProducts(false);
            }
        };
        loadProducts();
    }, []);

    // Auth wiring removed (admin removed)
    // Render admin panel at /admin route (simple example)
    if (window.location.pathname === '/admin') {
        return <SimpleAdminPanel />;
    }

    // Carrito y wishlist modales
    const [showCart, setShowCart] = useState(false)
    const [showWishlist, setShowWishlist] = useState(false)
    // Shipping requirement
    const [showShippingModal, setShowShippingModal] = useState(false)
    const [pendingCheckout, setPendingCheckout] = useState(false)
    const [shippingForm, setShippingForm] = useState({
        full_name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'MX',
    })

    // =========================================================
    // HANDLERS
    // =========================================================

    // Notificaciones personalizadas
    const showNotification = useCallback(
        (message, color = colors.acentoVerde) => {
            setNotification({ message, color })
            setTimeout(() => setNotification(null), 3500)
        },
        [colors]
    )

    // Mensaje: puntos reclamados
    const notifyPointsClaimed = () => {
        showNotification('🎉 ¡Reclamaste tus puntos hoy, felicidades! Sigue participando para más recompensas.');
    };
    // Mensaje: reseña publicada
    const notifyReviewPublished = () => {
        showNotification('⭐ ¡Gracias por tu reseña! Ayudas a otros clientes a elegir mejor.');
    };
    // Mensaje: sugerencia de productos similares
    const notifySuggestSimilar = (style) => {
        showNotification(`¿Te interesan otros productos de estilo "${style}"? ¡Descúbrelos en la tienda!`, colors.acentoAzul);
    };
    // Mensaje: producto agregado al carrito
    const notifyAddToCart = (product) => {
        showNotification(`✅ "${product.name}" agregado al carrito. ¡No olvides revisar productos recomendados!`);
    };
    // Mensaje: producto agregado a favoritos
    const notifyAddToWishlist = (product) => {
        showNotification(`💖 "${product.name}" agregado a favoritos. ¡Te avisaremos si baja de precio!`);
    };
    // Mensaje: compra exitosa
    const notifyPurchaseSuccess = () => {
        showNotification('🎊 ¡Compra realizada con éxito! Revisa tu correo para el resumen y sigue explorando BBMIA.', colors.acentoVerde);
    };

    const handleAddToCart = useCallback(
        product => {
            const size = product.size || product.selectedSize || null
            setCart(prev => {
                const existing = prev.find(
                    item => item.id === product.id && (item.size || null) === (size || null)
                )
                if (existing) {
                    trackCartAction('add', product, 1)
                    return prev.map(item =>
                        item.id === product.id && (item.size || null) === (size || null)
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    )
                }
                trackCartAction('add', product, 1)
                return [...prev, { ...product, size, quantity: 1 }]
            })
            notifyAddToCart(product)
        },
        []
    )

    const handleAddToWishlist = useCallback(
        product => {
            setWishlist(prev => {
                const exists = prev.find(item => item.id === product.id)
                if (exists) {
                    showNotification(`"${product.name}" ya está en tu lista de deseos`)
                    return prev
                }
                notifyAddToWishlist(product)
                return [...prev, product]
            })
        },
        []
    )

    const handleRemoveFromCart = useCallback(
        (productId, size = null) => {
            const product = cart.find(
                item => item.id === productId && (item.size || null) === (size || null)
            )
            if (product) {
                trackCartAction('remove', product, product.quantity)
            }
            setCart(prev =>
                prev.filter(item => !(item.id === productId && (item.size || null) === (size || null)))
            )
            showNotification('🗑️ Producto eliminado del carrito', colors.acentoRojo)
        },
        [cart, showNotification, colors]
    )

    const handleRemoveFromWishlist = useCallback(
        productId => {
            setWishlist(prev => prev.filter(item => item.id !== productId))
            showNotification('🗑️ Eliminado de favoritos', colors.acentoRojo)
        },
        [showNotification, colors]
    )

    const handleUpdateQuantity = useCallback((productId, delta, size = null) => {
        setCart(prev =>
            prev.map(item => {
                if (item.id === productId && (item.size || null) === (size || null)) {
                    const newQuantity = Math.max(1, item.quantity + delta)
                    return { ...item, quantity: newQuantity }
                }
                return item
            })
        )
    }, [])

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
    }

    // =========================================================
    // COMPUTED VALUES
    // =========================================================

    const filteredProducts = useMemo(() => {
        let list = products

        // Filter by category if selected
        if (selectedCategory && selectedCategory !== 'all') {
            list = list.filter(p => normalize(p.category) === selectedCategory)
        }

        // Gender filter
        if (selectedGender && selectedGender !== 'all') {
            list = list.filter(p => {
                const g = classifyProductGender(p)
                if (selectedGender === 'men') return g === 'men' || g === 'unisex'
                if (selectedGender === 'women') return g === 'women' || g === 'unisex'
                if (selectedGender === 'unisex') return g === 'unisex'
                return true
            })
        }

        // Style filter (OR over selected styles)
        if (Array.isArray(selectedStyles) && selectedStyles.length > 0) {
            list = list.filter(p => {
                const styles = classifyProductStyle(p)
                if (!styles || styles.length === 0) return false
                const set = new Set(styles)
                for (const s of selectedStyles) {
                    if (set.has(s)) return true
                }
                return false
            })
        }

        // Then apply search
        const q = searchQuery.trim().toLowerCase()
        if (!q) return list
        return list.filter(
            p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
        )
    }, [products, selectedCategory, selectedGender, selectedStyles, searchQuery])

    const cartTotal = useMemo(
        () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [cart]
    )

    const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])

    // Lucky Wheel functions
    const showLuckyWheel = useCallback(() => {
        setShowLuckyWheelModal(true)
    }, [])

    const hideLuckyWheel = useCallback(() => {
        setShowLuckyWheelModal(false)
    }, [])

    // Expose showLuckyWheel globally for Header button
    useEffect(() => {
        window.showLuckyWheel = showLuckyWheel
        return () => {
            delete window.showLuckyWheel
        }
    }, [showLuckyWheel])

    // Suprimir errores de MetaMask que no afectan la funcionalidad
    useEffect(() => {
        const originalError = console.error;
        console.error = (...args) => {
            const message = args.join(' ');
            if (
                message.includes('MetaMask') ||
                message.includes('chrome-extension://') ||
                message.includes('inpage.js') ||
                message.includes('Failed to connect to MetaMask')
            ) {
                return; // Suprimir errores de extensiones
            }
            originalError(...args);
        };

        return () => {
            console.error = originalError;
        };
    }, []);

    // Precompute starry background nodes once per theme change (avoid hooks inside conditionals)
    const starNodes = useMemo(() => {
        if (theme !== 'dark') return null
        const stars = Array.from({ length: 150 }).map(() => {
            const size = Math.random() * 2.5 + 0.5 // 0.5-3px
            const fallDuration = 10 + Math.random() * 15 // 10-25 segundos
            const twinkleDuration = 1.5 + Math.random() * 3 // 1.5-4.5 segundos
            const delay = -Math.random() * fallDuration // Delay negativo para empezar en posiciones aleatorias
            const drift = (Math.random() - 0.5) * 150 // Deriva horizontal
            const startX = Math.random() * 100
            const startY = Math.random() * 100 // Posición inicial aleatoria en Y
            return { size, fallDuration, twinkleDuration, delay, drift, startX, startY }
        })
        return stars.map((s, i) => (
            <div
                key={i}
                style={{
                    position: 'absolute',
                    width: `${s.size}px`,
                    height: `${s.size}px`,
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                    left: `${s.startX}%`,
                    top: `${s.startY}%`,
                    '--drift': `${s.drift}px`,
                    animation: `falling ${s.fallDuration}s linear ${s.delay}s infinite, twinkle ${s.twinkleDuration}s ease-in-out infinite`,
                    boxShadow: `0 0 ${s.size * 3}px rgba(255, 255, 255, 0.9), 0 0 ${s.size * 6}px rgba(255, 255, 255, 0.5)`,
                    willChange: 'transform, opacity',
                }}
            />
        ))
    }, [theme])

    // =========================================================
    // MODALS
    // =========================================================

    // Unified checkout action (Stripe redirect)
    const handleCheckout = useCallback(async () => {
        setBuying(false);
        // Validación previa (puedes agregar más si lo deseas)
        if (!cart || cart.length === 0) {
            showNotification('El carrito está vacío', colors.acentoRojo);
            return;
        }
        if (!user) {
            setShowAuthModal(true);
            showNotification('Debes iniciar sesión para comprar.', colors.acentoRojo);
            return;
        }
        try {
            // Requerir email verificado antes de crear sesión de pago
            if (user && profile && profile.email_confirmed !== true) {
                showNotification(
                    'Debes verificar tu email antes de comprar. Revisa tu bandeja o reenvía el enlace.',
                    colors.acentoRojo
                );
                setShowAuthModal(true);
                return;
            }
            // Crear sesión de Stripe
            const shipping = SHIPPING_OPTIONS.find(opt => opt.key === shippingOption);
            
            console.log('Attempting to create checkout session at:', STRIPE_ENDPOINT);
            
            const res = await fetch(STRIPE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    cart,
                    shippingLabel: shipping?.label,
                    shippingPrice: shipping?.price || 0
                }),
            });
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                showNotification(
                    'Error al iniciar pago: ' + (data.error || 'Respuesta inválida del servidor'),
                    colors.acentoRojo
                );
            }
        } catch (err) {
            showNotification('Error al conectar con Stripe: ' + err.message, colors.acentoRojo);
        }
    }, [cart, colors.acentoRojo, showNotification, user, profile, setShowAuthModal, shippingOption, SHIPPING_OPTIONS]);
    // Mostrar pantalla de éxito solo si Stripe regresa con ?success=true
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            // Recuperar el último pedido del storage temporal (o reconstruirlo si es necesario)
            const lastOrderRaw = localStorage.getItem('bbmia-last-order');
            let order = null;
            try {
                order = lastOrderRaw ? JSON.parse(lastOrderRaw) : null;
            } catch {}

            // Solo continuar si hay usuario logueado y datos válidos
            if (user && user.email && order && Array.isArray(order.products) && order.products.length > 0) {
                // Guardar el pedido en la base de datos primero
                fetch('/api/save-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: user.id,
                        email: user.email,
                        customer_name: user.user_metadata?.full_name || user.email,
                        phone: user.phone || '',
                        shipping_address: '', // Aquí puedes agregar la dirección real cuando la captures
                        cart: order.products,
                        shipping_option: order.shipping_option,
                        shipping_label: order.shipping_label,
                        shipping_price: order.shipping_price,
                        total: order.total,
                        stripe_session_id: params.get('session_id') // ID de la sesión de Stripe
                    })
                })
                .then(saveResponse => {
                    if (!saveResponse.ok) {
                        throw new Error(`Error guardando pedido: ${saveResponse.status}`);
                    }
                    return saveResponse.json();
                })
                .then(saveResult => {
                    console.log('Pedido guardado exitosamente:', saveResult.order_id);
                    // Actualizar el pedido con el ID de la base de datos
                    order.database_id = saveResult.order_id;
                })
                .catch(saveError => {
                    console.error('Error guardando pedido en DB:', saveError);
                    showNotification('⚠️ Pago exitoso, pero hubo un problema guardando el pedido. Contacta soporte.', colors.acentoRojo);
                })
                .finally(() => {

                    setLastOrder(order);
                    setShowSuccess(true);
                    setCart([]);
                    localStorage.removeItem('bbmia-cart');
                    localStorage.removeItem('bbmia-last-order');
                    notifyPurchaseSuccess && notifyPurchaseSuccess();

                    // Si es envío por DoorDash, crear la entrega
                    if (order.shipping_option === 'doordash') {
                        const doordashData = {
                            customer_name: user.user_metadata?.full_name || user.email,
                            phone: user.phone || '+1234567890',
                            shipping_address: {
                                line1: '123 Customer Street', // Aquí deberías usar la dirección real del cliente
                                city: 'Miami',
                                state: 'FL',
                                postal_code: '33101',
                                country: 'US'
                            },
                            total: order.total,
                            items: order.products
                        };

                        fetch('/api/doordash-delivery', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                action: 'create',
                                ...doordashData 
                            })
                        })
                        .then(response => response.json())
                        .then(result => {
                            if (result.success) {
                                showNotification(
                                    `🚚 ¡Entrega DoorDash creada! Tiempo estimado: ${result.estimated_dropoff_time || '2-4 horas'}`,
                                    colors.acentoVerde
                                );
                                // Guardar el ID de entrega para seguimiento
                                localStorage.setItem('bbmia-doordash-delivery', result.delivery_id);
                            } else {
                                showNotification(
                                    '⚠️ Pago exitoso, pero hubo un problema creando la entrega DoorDash. Contacta soporte.',
                                    colors.acentoRojo
                                );
                            }
                        })
                        .catch(error => {
                            console.error('Error creating DoorDash delivery:', error);
                            showNotification(
                                '⚠️ Pago exitoso, pero no se pudo crear la entrega DoorDash. Contacta soporte.',
                                colors.acentoRojo
                            );
                        });
                    }

                    // Enviar email de resumen de compra automáticamente
                    if (order.database_id) {
                        fetch('/api/send-order-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                email: user.email, 
                                orderId: order.database_id 
                            })
                        })
                        .then(res => {
                            if (!res.ok) {
                                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                            }
                            return res.json();
                        })
                        .then(data => {
                            if (!data.ok) {
                                showNotification('No se pudo enviar el email de compra: ' + (data.error || 'Error desconocido'), colors.acentoRojo);
                            } else {
                                console.log('Email de confirmación enviado exitosamente');
                            }
                        })
                        .catch((error) => {
                            console.error('Error sending email:', error);
                            showNotification('No se pudo enviar el email de compra: ' + error.message, colors.acentoRojo);
                        });
                    } else {
                        console.warn('No se pudo enviar email: pedido no guardado en DB');
                    }
                });
            }

            // Eliminar el parámetro success de la URL para evitar repeticiones
            const url = new URL(window.location.href);
            url.searchParams.delete('success');
            window.history.replaceState({}, document.title, url.pathname + url.search);
        }
        if (params.get('canceled') === 'true') {
            setShowSuccess(false);
        }
    }, [user]);

    // Guardar el último pedido antes de redirigir a Stripe
    const handleCheckoutWithOrder = useCallback(async () => {
        setBuying(false);
        if (!cart || cart.length === 0) {
            showNotification('El carrito está vacío', colors.acentoRojo);
            return;
        }
        const shipping = SHIPPING_OPTIONS.find(opt => opt.key === shippingOption);
        const order = {
            id: Date.now().toString(),
            products: cart.map(item => ({
                ...item,
                quantity: item.quantity || 1,
            })),
            shipping_option: shipping?.key,
            shipping_label: shipping?.label,
            shipping_price: shipping?.price || 0,
            total: cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) + (shipping?.price || 0),
            createdAt: new Date().toISOString(),
        };
        localStorage.setItem('bbmia-last-order', JSON.stringify(order));
        await handleCheckout();
    }, [cart, colors.acentoRojo, showNotification, user, profile, setShowAuthModal, shippingOption]);


    // Cart modal as component


    // Wishlist modal as component

    // =========================================================
    // SUB-COMPONENTS
    // =========================================================



    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div
            className={`min-h-screen ${selectedCategory === 'ropa' ? 'ropa-bg-anim' : ''} ${selectedCategory === 'joyeria' ? 'joyeria-bg-anim' : ''}`}
            style={{
                background:
                    selectedCategory === 'ropa'
                        ? `url('/ropa-armario.jpg') center top/cover no-repeat, ${theme === 'dark' ? 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 40%, #16213e 100%)' : colors.bgApp}`
                    : selectedCategory === 'joyeria'
                        ? `url('/joyeria-bg.jpg') center top/cover no-repeat, ${theme === 'dark' ? 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 40%, #16213e 100%)' : colors.bgApp}`
                    : theme === 'dark'
                        ? 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 40%, #16213e 100%)'
                        : colors.bgApp,
                position: 'relative',
                overflow: 'hidden',
                transition: 'background 0.5s',
                width: '100vw',
                maxWidth: '100vw',
                margin: 0,
                padding: 0,
                boxSizing: 'border-box',
            }}
        >
            {/* Sidebar de filtros (menú hamburguesa) */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-50 flex"
                    style={{ background: 'rgba(0,0,0,0.45)' }}
                    onClick={() => setShowMenu(false)}
                >
                    <aside
                        className="bg-white dark:bg-[#232323] w-80 max-w-full h-full p-6 shadow-2xl animate-slide-in-left relative"
                        style={{ minWidth: 260 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-4 right-4 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            style={{ border: 'none', background: 'none' }}
                            onClick={() => setShowMenu(false)}
                            title="Cerrar"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-lg font-bold mb-4">Filtros</h2>
                        {/* Aquí puedes agregar los filtros que desees mostrar en el menú lateral */}
                        <div className="mb-4">
                            <div className="font-semibold mb-2">Categoría</div>
                            {CATEGORY_LABELS.map(cat => (
                                <button
                                    key={cat.key}
                                    className={`category-btn block w-full text-left px-3 py-2 rounded mb-1 font-bold transition-all ${selectedCategory === cat.key ? 'active' : ''}`}
                                    style={{
                                        background: selectedCategory === cat.key ? 'linear-gradient(90deg,#f43f5e 0%,#6366f1 100%)' : '#f3f4f6',
                                        color: selectedCategory === cat.key ? '#fff' : '#222',
                                        border: selectedCategory === cat.key ? '2px solid #f43f5e' : '1px solid #e5e7eb',
                                        boxShadow: selectedCategory === cat.key ? '0 2px 8px #f43f5e22' : 'none',
                                        fontSize: '1.1em',
                                        letterSpacing: '0.04em',
                                    }}
                                    onClick={() => {
                                        setSelectedCategory(cat.key);
                                        setShowMenu(false);
                                    }}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                        <div className="mb-4">
                            <div className="font-semibold mb-2">Género</div>
                            {['all', 'men', 'women', 'unisex'].map(g => (
                                <button
                                    key={g}
                                    className={`block w-full text-left px-3 py-2 rounded mb-1 ${selectedGender === g ? 'bg-pink-600 text-white' : 'bg-gray-100 dark:bg-[#232323] text-gray-800 dark:text-gray-100'}`}
                                    onClick={() => {
                                        setSelectedGender(g);
                                        setShowMenu(false);
                                    }}
                                >
                                    {g === 'all' ? 'Todos' : g === 'men' ? 'Hombre' : g === 'women' ? 'Mujer' : 'Unisex'}
                                </button>
                            ))}
                        </div>
                        <div className="mb-4">
                            <div className="font-semibold mb-2">Estilos</div>
                            {['streetwear', 'elegante', 'exclusivo', 'erotico'].map(style => (
                                <button
                                    key={style}
                                    className={`block w-full text-left px-3 py-2 rounded mb-1 ${selectedStyles.includes(style) ? 'bg-pink-600 text-white' : 'bg-gray-100 dark:bg-[#232323] text-gray-800 dark:text-gray-100'}`}
                                    onClick={() => {
                                        setSelectedStyles(prev => prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]);
                                    }}
                                >
                                    {style.charAt(0).toUpperCase() + style.slice(1)}
                                </button>
                            ))}
                        </div>
                    </aside>
                </div>
            )}
            {/* Pantalla de éxito de compra */}
            {showSuccess && lastOrder && (
                <PurchaseSuccess
                    order={lastOrder}
                    onClose={() => setShowSuccess(false)}
                />
            )}
            {/* Starry Background - Solo en modo oscuro */}
            {theme === 'dark' && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 0,
                        overflow: 'hidden',
                    }}
                >
                    {starNodes}
                </div>
            )}

            {/* Notification */}
            {notification && (
                <div
                    className="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-slide-in"
                    style={{
                        backgroundColor: notification.color,
                        color: '#fff',
                    }}
                >
                    {notification.message}
                </div>
            )}

            {/* Header extraído como componente */}
            <Header
                colors={colors}
                theme={theme}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                setShowMenu={setShowMenu}
                toggleTheme={toggleTheme}
                setShowAuthModal={setShowAuthModal}
                setShowWishlist={setShowWishlist}
                setShowCart={setShowCart}
                wishlist={wishlist}
                cartCount={cartCount}
                selectedCategory={selectedCategory}
            />

            {/* Cart Modal */}
            {showCart && (
                <Cart
                    cart={cart}
                    colors={colors}
                    shippingOption={shippingOption}
                    SHIPPING_OPTIONS={SHIPPING_OPTIONS}
                    cartTotal={cartTotal}
                    buying={buying}
                    handleUpdateQuantity={handleUpdateQuantity}
                    handleRemoveFromCart={handleRemoveFromCart}
                    setShippingOption={setShippingOption}
                    handleCheckoutWithOrder={handleCheckoutWithOrder}
                    setShowCart={setShowCart}
                />
            )}
            {/* Wishlist Modal */}
            {showWishlist && (
                <Wishlist
                    wishlist={wishlist}
                    colors={colors}
                    handleRemoveFromWishlist={handleRemoveFromWishlist}
                    setShowWishlist={setShowWishlist}
                />
            )}

            {/* Product List removed from here; only rendered in <main> below. */}

            {/* Category Filter Bar */}
            <div
                className="w-full border-b"
                style={{
                    borderColor: colors.border,
                    backgroundColor: theme === 'dark' ? 'rgba(30,30,60,0.35)' : '#fff',
                }}
            >
                <div style={{width: '100%', display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: 0, boxSizing: 'border-box'}}>
                    {CATEGORY_LABELS.map(cat => {
                        const active = selectedCategory === cat.key
                        // Add category-specific button class
                        let btnClass = ''
                        if (cat.key === 'ropa' && active) btnClass = 'ropa-btn-anim'
                        if (cat.key === 'joyeria' && active) btnClass = 'joyeria-btn-anim'
                        return (
                            <button
                                key={cat.key}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${btnClass}`}
                                style={{
                                    backgroundColor: active ? colors.acentoRojo : colors.bgHover,
                                    color: active ? '#fff' : colors.textPrimary,
                                    border: `1px solid ${active ? colors.acentoRojo : colors.border}`,
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    fontStyle: 'normal',
                                    fontWeight: 500
                                }}
                                onClick={() => setSelectedCategory(cat.key)}
                            >
                                {cat.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Recommended Products - ML-based personalization */}
            {/* Recommended Products - ML-based personalization (only for authenticated users) */}
            {user && !loadingProducts && products.length > 0 && (
                <div style={{width: '100%', padding: 0, boxSizing: 'border-box'}}>
                    <RecommendedProducts
                        user={user}
                        products={products}
                        onProductClick={product => {
                            setSelectedProduct(product)
                            setSelectedImageIndex(0)
                            trackProductView(product)
                        }}
                        colors={colors}
                        genderFilter={selectedGender}
                        styleFilter={selectedStyles}
                        ProductCardProps={{
                            colors,
                            setSelectedProduct,
                            setSelectedImageIndex,
                            setSelectedSize,
                            handleAddToCart,
                            handleAddToWishlist,
                            showNotification,
                            trackProductView
                        }}
                    />
                </div>
            )}
            {/* If not authenticated, show a prompt instead of recommendations */}
            {!user && !loadingProducts && products.length > 0 && (
                <div style={{width: '100%', padding: 0, textAlign: 'center', boxSizing: 'border-box'}}>
                    <div className="py-8 text-lg font-semibold" style={{ color: colors.textSecondary }}>
                        Inicia sesión para ver recomendaciones personalizadas.
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main style={{width: '100vw', maxWidth: '100vw', padding: 0, margin: 0, boxSizing: 'border-box'}}>
                {loadingProducts ? (
                    <div className="text-center py-20">
                        <div
                            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
                            style={{
                                borderColor: colors.acentoRojo,
                                borderTopColor: 'transparent',
                            }}
                        />
                        <p className="mt-4" style={{ color: colors.textSecondary }}>
                            Cargando productos...
                        </p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <AlertTriangle
                            size={48}
                            color={colors.textMuted}
                            className="mx-auto mb-4"
                        />
                        <p className="text-xl" style={{ color: colors.textSecondary }}>
                            {searchQuery
                                ? 'No se encontraron productos'
                                : 'No hay productos disponibles'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Professional CSS animations */}
                        <style>{`
                            @keyframes fadeInUp {
                                from {
                                    opacity: 0;
                                    transform: translateY(30px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0);
                                }
                            }
                            
                            .group:hover .group-hover\\:shadow-2xl {
                                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                            }
                            
                            /* Smooth scroll behavior */
                            html {
                                scroll-behavior: smooth;
                            }
                            
                            /* Professional typography */
                            .professional-title {
                                font-variation-settings: 'wght' 300;
                                text-rendering: optimizeLegibility;
                                -webkit-font-smoothing: antialiased;
                                -moz-osx-font-smoothing: grayscale;
                            }
                        `}</style>
                        
                        <div className="main-content">
                            {(() => {
                                // Group products by category for display
                                const productsByCategory = {};
                                
                                // If a specific category is selected, show only that category
                                if (selectedCategory && selectedCategory !== 'all') {
                                    const categoryProducts = filteredProducts;
                                    if (categoryProducts.length > 0) {
                                        const categoryLabel = CATEGORY_LABELS.find(cat => cat.key === selectedCategory)?.label || selectedCategory;
                                        productsByCategory[categoryLabel] = categoryProducts;
                                    }
                                } else {
                                    // Group all products by their categories
                                    filteredProducts.forEach(product => {
                                        const categoryKey = normalize(product.category);
                                        const categoryLabel = CATEGORY_LABELS.find(cat => cat.key === categoryKey)?.label || product.category || 'Sin categoría';
                                        
                                        if (!productsByCategory[categoryLabel]) {
                                            productsByCategory[categoryLabel] = [];
                                        }
                                        productsByCategory[categoryLabel].push(product);
                                    });
                                }

                                return Object.entries(productsByCategory).map(([categoryName, categoryProducts], categoryIndex) => (
                                <section key={categoryName} className="mb-20">
                                    {/* Professional Category Header */}
                                    <div className="relative mb-12">
                                        {/* Subtle background pattern */}
                                        <div 
                                            className="absolute inset-0 opacity-5"
                                            style={{
                                                backgroundImage: `
                                                    radial-gradient(circle at 25% 25%, ${colors.acentoAzul}20 0%, transparent 50%),
                                                    radial-gradient(circle at 75% 75%, ${colors.acentoRojo}20 0%, transparent 50%)
                                                `
                                            }}
                                        ></div>
                                        
                                        <div className="relative py-8">
                                            {/* Category title with sophisticated styling */}
                                            <div className="text-center mb-4">
                                                <h2 
                                                    className="text-3xl md:text-5xl font-light tracking-wider relative inline-block"
                                                    style={{ 
                                                        color: colors.textPrimary,
                                                        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.2em'
                                                    }}
                                                >
                                                    {categoryName}
                                                    {/* Underline accent */}
                                                    <div 
                                                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 w-16 mt-2"
                                                        style={{
                                                            background: `linear-gradient(90deg, ${colors.acentoRojo}, ${colors.acentoAzul})`
                                                        }}
                                                    ></div>
                                                </h2>
                                            </div>
                                            
                                            {/* Professional product count and description */}
                                            <div className="text-center space-y-2">
                                                <p 
                                                    className="text-sm font-medium tracking-wide"
                                                    style={{ 
                                                        color: colors.textSecondary,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.1em'
                                                    }}
                                                >
                                                    Colección de {categoryProducts.length} producto{categoryProducts.length !== 1 ? 's' : ''}
                                                </p>
                                                <div 
                                                    className="w-24 h-px mx-auto opacity-40"
                                                    style={{ backgroundColor: colors.textMuted }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Professional Products Grid */}
                                    <div className="products-grid">
                                        {categoryProducts.map((product, productIndex) => (
                                            <div
                                                key={product.id}
                                                className={`group transform transition-all duration-500 ease-out hover:scale-[1.02] ${
                                                    selectedCategory === 'ropa'
                                                        ? 'ropa-card-anim'
                                                        : selectedCategory === 'joyeria'
                                                            ? 'joyeria-card-anim'
                                                            : ''
                                                }`}
                                                style={{
                                                    animationDelay: `${productIndex * 0.08}s`,
                                                    opacity: 0,
                                                    animation: `fadeInUp 0.6s ease-out forwards ${productIndex * 0.08}s`
                                                }}
                                            >
                                                <div
                                                    className="rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
                                                    style={{
                                                        backgroundColor: colors.bgSurface,
                                                        border: `1px solid ${colors.border}`,
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)'
                                                    }}
                                                >
                                                    <ProductCard
                                                        product={product}
                                                        colors={colors}
                                                        setSelectedProduct={setSelectedProduct}
                                                        setSelectedImageIndex={setSelectedImageIndex}
                                                        setSelectedSize={setSelectedSize}
                                                        handleAddToCart={handleAddToCart}
                                                        handleAddToWishlist={handleAddToWishlist}
                                                        showNotification={showNotification}
                                                        trackProductView={trackProductView}
                                                        cartCount={cart.find(item => item.id === product.id)?.quantity || 0}
                                                        wishlist={wishlist}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Enhanced Category Separator with Leaderboard */}
                                    {categoryIndex < Object.keys(productsByCategory).length - 1 && (
                                        <div className="mt-20 mb-16 relative">
                                            {/* Main separator with sophisticated gradient */}
                                            <div className="relative flex items-center justify-center">
                                                <div 
                                                    className="absolute inset-0 h-px"
                                                    style={{ 
                                                        background: `linear-gradient(
                                                            90deg, 
                                                            transparent 0%, 
                                                            ${colors.border}40 20%, 
                                                            ${colors.textMuted}60 50%, 
                                                            ${colors.border}40 80%, 
                                                            transparent 100%
                                                        )`
                                                    }}
                                                ></div>
                                                
                                                {/* Central sophisticated element */}
                                                <div 
                                                    className="relative bg-white rounded-full p-3 shadow-lg"
                                                    style={{ 
                                                        backgroundColor: colors.bgSurface,
                                                        border: `2px solid ${colors.border}`,
                                                        boxShadow: `
                                                            0 4px 12px rgba(0,0,0,0.08),
                                                            0 2px 4px rgba(0,0,0,0.06),
                                                            inset 0 1px 0 rgba(255,255,255,0.1)
                                                        `
                                                    }}
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <div 
                                                            className="w-1.5 h-1.5 rounded-full"
                                                            style={{ 
                                                                background: `linear-gradient(135deg, ${colors.acentoRojo}, ${colors.acentoRojo}dd)`
                                                            }}
                                                        ></div>
                                                        <div 
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ 
                                                                background: `linear-gradient(135deg, ${colors.acentoAzul}, ${colors.acentoAzul}dd)`
                                                            }}
                                                        ></div>
                                                        <div 
                                                            className="w-1.5 h-1.5 rounded-full"
                                                            style={{ 
                                                                background: `linear-gradient(135deg, ${colors.acentoRojo}, ${colors.acentoRojo}dd)`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Leaderboard Section - 728 x 90 px */}
                                            <div className="mt-12 flex justify-center">
                                                <div 
                                                    className="relative overflow-hidden rounded-lg shadow-lg"
                                                    style={{
                                                        width: '728px',
                                                        height: '90px',
                                                        maxWidth: '100%',
                                                        background: `linear-gradient(135deg, ${colors.bgSurface}, ${colors.bgHover})`,
                                                        border: `2px solid ${colors.border}`,
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)'
                                                    }}
                                                >
                                                    {/* Video Container with exact aspect ratio */}
                                                    <div 
                                                        className="absolute inset-0"
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            background: '#000'
                                                        }}
                                                    >
                                                        <video
                                                            autoPlay
                                                            muted
                                                            loop
                                                            playsInline
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                objectPosition: 'center',
                                                                display: 'block'
                                                            }}
                                                            onError={(e) => {
                                                                // Fallback si el video no carga
                                                                e.target.style.display = 'none';
                                                                e.target.nextElementSibling.style.display = 'flex';
                                                            }}
                                                        >
                                                            <source src="/leaderboard-video.mp4" type="video/mp4" />
                                                            <source src="/leaderboard-video.webm" type="video/webm" />
                                                            <source src="/leaderboard-video.mov" type="video/quicktime" />
                                                            Tu navegador no soporta videos HTML5.
                                                        </video>

                                                        {/* Fallback content si el video no carga */}
                                                        <div 
                                                            className="absolute inset-0 flex items-center justify-center"
                                                            style={{ 
                                                                display: 'none',
                                                                background: `radial-gradient(ellipse at center, ${colors.acentoAzul}10, transparent 70%)`
                                                            }}
                                                        >
                                                            {/* Leaderboard Header */}
                                                            <div className="absolute top-2 left-4 flex items-center space-x-2">
                                                                <div 
                                                                    className="w-2 h-2 rounded-full"
                                                                    style={{ backgroundColor: colors.acentoRojo }}
                                                                ></div>
                                                                <span 
                                                                    className="text-xs font-bold tracking-wide"
                                                                    style={{ 
                                                                        color: colors.textPrimary,
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.1em'
                                                                    }}
                                                                >
                                                                    Leaderboard
                                                                </span>
                                                            </div>

                                                            {/* Placeholder content */}
                                                            <div className="text-center px-4">
                                                                <div 
                                                                    className="text-lg font-bold mb-1"
                                                                    style={{ 
                                                                        color: colors.textPrimary,
                                                                        background: `linear-gradient(135deg, ${colors.acentoRojo}, ${colors.acentoAzul})`,
                                                                        WebkitBackgroundClip: 'text',
                                                                        WebkitTextFillColor: 'transparent',
                                                                        backgroundClip: 'text'
                                                                    }}
                                                                >
                                                                    🏆 Top Compradores del Mes
                                                                </div>
                                                                <div 
                                                                    className="text-xs opacity-75"
                                                                    style={{ color: colors.textSecondary }}
                                                                >
                                                                    Carga tu video de leaderboard aquí • Resolución óptima: 728x90px
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Video overlay controls (opcional) */}
                                                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 hover:opacity-100 transition-opacity duration-300">
                                                        <button
                                                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                                            style={{
                                                                backgroundColor: 'rgba(0,0,0,0.7)',
                                                                color: '#fff',
                                                                border: 'none',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={(e) => {
                                                                const video = e.target.closest('.relative').querySelector('video');
                                                                if (video.paused) {
                                                                    video.play();
                                                                    e.target.textContent = '⏸';
                                                                } else {
                                                                    video.pause();
                                                                    e.target.textContent = '▶';
                                                                }
                                                            }}
                                                            title="Reproducir/Pausar"
                                                        >
                                                            ⏸
                                                        </button>
                                                        <button
                                                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                                            style={{
                                                                backgroundColor: 'rgba(0,0,0,0.7)',
                                                                color: '#fff',
                                                                border: 'none',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={(e) => {
                                                                const video = e.target.closest('.relative').querySelector('video');
                                                                video.muted = !video.muted;
                                                                e.target.textContent = video.muted ? '🔇' : '🔊';
                                                            }}
                                                            title="Silenciar/Activar sonido"
                                                        >
                                                            🔇
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Bottom accent line */}
                                                    <div 
                                                        className="absolute bottom-0 left-0 right-0 h-0.5"
                                                        style={{
                                                            background: `linear-gradient(90deg, ${colors.acentoRojo}, ${colors.acentoAzul}, ${colors.acentoRojo})`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                            
                                            {/* Subtle secondary separator */}
                                            <div className="absolute left-1/4 right-1/4 top-8">
                                                <div 
                                                    className="h-px opacity-20"
                                                    style={{ 
                                                        background: `linear-gradient(90deg, transparent, ${colors.textMuted}, transparent)`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            ));
                        })()}
                        </div>
                    </>
                )}
            </main>
            {/* Personalized offers section */}
            {/* Personalized offers section (only for authenticated users) */}
            {user && Array.isArray(profile?.interests) && profile.interests.length > 0 && (
                <section className="container mx-auto px-4 pb-10">
                    <h3 className="text-xl font-bold mb-4 luxury-cursive luxury-shimmer luxury-underline" style={{ color: colors.textPrimary }}>
                        🎯 Ofertas para ti
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products
                            .filter(p => profile.interests.includes(normalize(p.category)))
                            .slice(0, 6)
                            .map(p => (
                                <ProductCard
                                    key={p.id}
                                    product={p}
                                    colors={colors}
                                    setSelectedProduct={setSelectedProduct}
                                    setSelectedImageIndex={setSelectedImageIndex}
                                    setSelectedSize={setSelectedSize}
                                    handleAddToCart={handleAddToCart}
                                    handleAddToWishlist={handleAddToWishlist}
                                    showNotification={showNotification}
                                    trackProductView={trackProductView}
                                />
                            ))}
                    </div>
                </section>
            )}
            {/* If not authenticated, show a prompt instead of personalized offers */}
            {!user && (
                <section className="container mx-auto px-4 pb-10 text-center">
                    <div className="py-8 text-lg font-semibold" style={{ color: colors.textSecondary }}>
                        Inicia sesión para ver ofertas personalizadas.
                    </div>
                </section>
            )}
            {/* Modales de carrito, wishlist y usuario */}
            {/* CartModal removed, now using <Cart /> above */}
            {showShippingModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                    onClick={() => setShowShippingModal(false)}
                >
                    <div
                        className="max-w-lg w-full rounded-lg p-6 shadow-lg"
                        style={{ backgroundColor: colors.bgSurface, color: colors.textPrimary }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Dirección de envío</h3>
                            <button
                                className="p-2 rounded"
                                style={{
                                    backgroundColor: colors.bgHover,
                                    border: `1px solid ${colors.border}`,
                                }}
                                onClick={() => setShowShippingModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <input
                                className="border rounded p-2"
                                style={{
                                    borderColor: colors.border,
                                    backgroundColor: colors.bgSurface,
                                    color: colors.textPrimary,
                                }}
                                placeholder="Nombre completo"
                                value={shippingForm.full_name}
                                onChange={e =>
                                    setShippingForm({ ...shippingForm, full_name: e.target.value })
                                }
                            />
                            <input
                                className="border rounded p-2"
                                style={{
                                    borderColor: colors.border,
                                    backgroundColor: colors.bgSurface,
                                    color: colors.textPrimary,
                                }}
                                placeholder="Teléfono"
                                value={shippingForm.phone}
                                onChange={e =>
                                    setShippingForm({ ...shippingForm, phone: e.target.value })
                                }
                            />
                            <input
                                className="border rounded p-2"
                                style={{
                                    borderColor: colors.border,
                                    backgroundColor: colors.bgSurface,
                                    color: colors.textPrimary,
                                }}
                                placeholder="Dirección"
                                value={shippingForm.address}
                                onChange={e =>
                                    setShippingForm({ ...shippingForm, address: e.target.value })
                                }
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    className="border rounded p-2"
                                    style={{
                                        borderColor: colors.border,
                                        backgroundColor: colors.bgSurface,
                                        color: colors.textPrimary,
                                    }}
                                    placeholder="Ciudad"
                                    value={shippingForm.city}
                                    onChange={e =>
                                        setShippingForm({ ...shippingForm, city: e.target.value })
                                    }
                                />
                                <input
                                    className="border rounded p-2"
                                    style={{
                                        borderColor: colors.border,
                                        backgroundColor: colors.bgSurface,
                                        color: colors.textPrimary,
                                    }}
                                    placeholder="Estado"
                                    value={shippingForm.state}
                                    onChange={e =>
                                        setShippingForm({ ...shippingForm, state: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    className="border rounded p-2"
                                    style={{
                                        borderColor: colors.border,
                                        backgroundColor: colors.bgSurface,
                                        color: colors.textPrimary,
                                    }}
                                    placeholder="Código postal"
                                    value={shippingForm.postal_code}
                                    onChange={e =>
                                        setShippingForm({
                                            ...shippingForm,
                                            postal_code: e.target.value,
                                        })
                                    }
                                />
                                <input
                                    className="border rounded p-2"
                                    style={{
                                        borderColor: colors.border,
                                        backgroundColor: colors.bgSurface,
                                        color: colors.textPrimary,
                                    }}
                                    placeholder="País"
                                    value={shippingForm.country}
                                    onChange={e =>
                                        setShippingForm({
                                            ...shippingForm,
                                            country: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <button
                            className="w-full mt-4 px-4 py-3 rounded-md font-bold transition-all"
                            style={{ backgroundColor: colors.acentoVerde, color: '#fff' }}
                            onClick={async () => {
                                // Validación mínima
                                // Validación mínima
                                const req = [
                                    'full_name',
                                    'phone',
                                    'address',
                                    'city',
                                    'state',
                                    'postal_code',
                                ]
                                for (const k of req) {
                                    if (!String(shippingForm[k] || '').trim()) {
                                        showNotification(
                                            'Completa todos los campos requeridos',
                                            colors.acentoRojo
                                        )
                                        return
                                    }
                                }
                                try {
                                    // Save shipping address via Supabase instead of API
                                    const { upsertProfile } = await import('./admin/supabase');
                                    const updatedProfile = {
                                        ...profile,
                                        shipping_address: shippingForm
                                    };
                                    await upsertProfile(user.id, updatedProfile);
                                    
                                    // Update local profile state
                                    setProfile(updatedProfile);
                                    setShowShippingModal(false)
                                    if (pendingCheckout) {
                                        await handleCheckout()
                                        setPendingCheckout(false)
                                    }
                                } catch (err) {
                                    showNotification(
                                        'Error guardando dirección: ' + err.message,
                                        colors.acentoRojo
                                    )
                                }
                            }}
                        >
                            Guardar y continuar
                        </button>
                    </div>
                </div>
            )}
            {showWishlist && <Wishlist 
                wishlist={wishlist}
                colors={colors}
                handleRemoveFromWishlist={handleRemoveFromWishlist}
                setShowWishlist={setShowWishlist}
            />}
            {showAuthModal &&
                (user ? (
                    <Suspense fallback={<div className="p-6 text-center">Cargando perfil…</div>}>
                        <LazyUserDashboard
                            user={user}
                            profile={profile}
                            setProfile={setProfile}
                            colors={colors}
                            showNotification={showNotification}
                            onClose={() => setShowAuthModal(false)}
                            CATEGORY_LABELS={CATEGORY_LABELS}
                            normalize={normalize}
                        />
                    </Suspense>
                ) : (
                    <EnhancedAuth
                        colors={colors}
                        onClose={() => setShowAuthModal(false)}
                        showNotification={showNotification}
                        onLoginSuccess={async () => {
                            // Refresh user data after login using Supabase directly
                            try {
                                const { supabase, fetchProfile } = await import('./supabase');
                                if (!supabase) {
                                    console.warn('Supabase not initialized');
                                    return;
                                }
                                
                                // Get current user directly from Supabase
                                const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
                                if (userError) throw userError;
                                
                                if (currentUser && currentUser.id) {
                                    setUser(currentUser);
                                    
                                    // Get profile directly from Supabase
                                    const userProfile = await fetchProfile(currentUser.id);
                                    setProfile(userProfile);
                                }
                            } catch (err) {
                                console.error('Error refreshing user data:', err);
                            }
                        }}
                    />
                ))}

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
                    onClick={() => setSelectedProduct(null)}
                >
                    <div
                        className="max-w-4xl w-full rounded-lg p-6 max-h-[90vh] overflow-y-auto"
                        style={{
                            backgroundColor: colors.bgSurface,
                            width: '100%',
                            maxWidth: '100%',
                            borderRadius: window.innerWidth <= 600 ? 0 : 16,
                            padding: window.innerWidth <= 600 ? 12 : 24,
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-4 gap-2">
                            <div className="flex-1 min-w-0">
                                <h2
                                    className="text-2xl font-bold truncate"
                                    style={{ color: colors.textPrimary }}
                                >
                                    {selectedProduct.name}
                                </h2>
                            </div>
                            <button
                                className="p-3 md:p-2 rounded-lg hover:bg-opacity-80 active:scale-95 transition-transform"
                                style={{ backgroundColor: colors.bgHover, minWidth: 44, minHeight: 44 }}
                                onClick={() => setSelectedProduct(null)}
                                title="Cerrar"
                            >
                                <X size={28} color={theme === 'dark' ? '#fff' : '#111'} />
                            </button>
                            <button
                                className="p-3 md:p-2 rounded-lg hover:bg-opacity-80 active:scale-95 transition-transform"
                                style={{ backgroundColor: colors.bgHover, minWidth: 44, minHeight: 44 }}
                                onClick={async () => {
                                    const url = `${window.location.origin}?product=${selectedProduct.id}`
                                    if (navigator.share) {
                                        try {
                                            await navigator.share({
                                                title: selectedProduct.name,
                                                text: `¡Mira este producto en BBMIA!`,
                                                url,
                                            })
                                        } catch {}
                                    } else if (navigator.clipboard) {
                                        try {
                                            await navigator.clipboard.writeText(url)
                                            showNotification('¡Enlace copiado al portapapeles!', colors.acentoVerde)
                                        } catch {
                                            showNotification('No se pudo copiar el enlace', colors.acentoRojo)
                                        }
                                    } else {
                                        window.prompt('Copia este enlace:', url)
                                    }
                                }}
                                title="Compartir producto"
                            >
                                <LinkIcon size={26} color={theme === 'dark' ? '#fff' : '#111'} />
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <div className="relative h-96 rounded-lg overflow-hidden mb-4">
                                    {/* Ref para imagen principal */}
                                    {(() => {
                                        // Prioridad: images array válido > imageUrl > color placeholder
                                        let images = Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0
                                            ? selectedProduct.images.filter(Boolean)
                                            : [];
                                        if (images.length === 0 && selectedProduct.imageUrl) {
                                            images = [selectedProduct.imageUrl];
                                        }
                                        if (images.length === 0) {
                                            images = [PRODUCT_CAROUSEL_COLORS[0]];
                                        }
                                        const mainImg = images[selectedImageIndex] || images[0];
                                        const isUrl = str => {
                                            try {
                                                new URL(str);
                                                return true;
                                            } catch {
                                                return false;
                                            }
                                        };
                                        return (
                                            isUrl(mainImg) ? (
                                                <img
                                                    ref={detailImgRef}
                                                    src={mainImg}
                                                    alt={selectedProduct.name}
                                                    className="w-full h-auto object-cover rounded-lg"
                                                    style={{
                                                        maxHeight: isMobile ? '40vh' : '24rem',
                                                        minHeight: 180,
                                                        width: '100%',
                                                        height: isMobile ? '40vw' : '24rem',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    className="w-full h-auto rounded-lg"
                                                    style={{
                                                        backgroundColor: mainImg,
                                                        maxHeight: isMobile ? '40vh' : '24rem',
                                                        minHeight: 180,
                                                        width: '100%',
                                                        height: isMobile ? '40vw' : '24rem',
                                                    }}
                                                />
                                            )
                                        );
                                    })()}
                                    <button
                                        className="p-3 md:p-2 rounded hover:bg-opacity-80 active:scale-95 transition-transform"
                                        style={{ backgroundColor: colors.bgHover, color: colors.textPrimary, minWidth: 44, minHeight: 44 }}
                                        title="Compartir producto"
                                        onClick={async e => {
                                            e.stopPropagation();
                                            const url = `${window.location.origin}?product=${product.id}`;
                                            if (navigator.share) {
                                                try {
                                                    await navigator.share({
                                                        title: product.name,
                                                        text: `¡Mira este producto en BBMIA!`,
                                                        url,
                                                    });
                                                } catch {}
                                            } else if (navigator.clipboard) {
                                                try {
                                                    await navigator.clipboard.writeText(url);
                                                    showNotification('¡Enlace copiado al portapapeles!', colors.acentoVerde);
                                                } catch {
                                                    showNotification('No se pudo copiar el enlace', colors.acentoRojo);
                                                }
                                            } else {
                                                window.prompt('Copia este enlace:', url);
                                            }
                                        }}
                                    >
                                        <LinkIcon size={22} color={theme === 'dark' ? '#fff' : '#111'} />
                                    </button>

                                    {(() => {
                                        // Prioridad: images array válido > imageUrl > color placeholder
                                        let images = Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0
                                            ? selectedProduct.images.filter(Boolean)
                                            : [];
                                        if (images.length === 0 && selectedProduct.imageUrl) {
                                            images = [selectedProduct.imageUrl];
                                        }
                                        if (images.length === 0) {
                                            images = [PRODUCT_CAROUSEL_COLORS[0]];
                                        }

                                        // Imagen principal
                                        const mainImg = images[selectedImageIndex] || images[0];
                                        const isUrl = str => {
                                            try {
                                                new URL(str);
                                                return true;
                                            } catch {
                                                return false;
                                            }
                                        };

                                        return (
                                            <>
                                                {/* Imagen principal */}
                                                {isUrl(mainImg) ? (
                                                    <img
                                                        src={mainImg}
                                                        alt={selectedProduct.name}
                                                        className="w-full h-auto object-cover rounded-lg"
                                                        style={{
                                                            maxHeight: isMobile ? '40vh' : '24rem',
                                                            minHeight: 180,
                                                            width: '100%',
                                                            height: isMobile ? '40vw' : '24rem',
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-full h-auto rounded-lg"
                                                        style={{
                                                            backgroundColor: mainImg,
                                                            maxHeight: isMobile ? '40vh' : '24rem',
                                                            minHeight: 180,
                                                            width: '100%',
                                                            height: isMobile ? '40vw' : '24rem',
                                                        }}
                                                    />
                                                )}

                                                {/* Flechas solo si hay más de una imagen */}
                                                {images.length > 1 && (
                                                    <>
                                                        <button
                                                            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full"
                                                            style={{ backgroundColor: colors.glass }}
                                                            onClick={() =>
                                                                setSelectedImageIndex(prev =>
                                                                    prev === 0
                                                                        ? images.length - 1
                                                                        : prev - 1
                                                                )
                                                            }
                                                        >
                                                            <ArrowLeft size={20} />
                                                        </button>
                                                        <button
                                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full"
                                                            style={{ backgroundColor: colors.glass }}
                                                            onClick={() =>
                                                                setSelectedImageIndex(
                                                                    prev => (prev + 1) % images.length
                                                                )
                                                            }
                                                        >
                                                            <ArrowRight size={20} />
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>

                                {(() => {
                                    const images =
                                        selectedProduct.images ||
                                        (selectedProduct.imageUrl
                                            ? [selectedProduct.imageUrl]
                                            : [PRODUCT_CAROUSEL_COLORS[0]])
                                    return (
                                        images.length > 1 && (
                                            <div className="flex gap-2 overflow-x-auto">
                                                {images.map((img, idx) => {
                                                    const isUrl = str => {
                                                        try {
                                                            new URL(str)
                                                            return true
                                                        } catch {
                                                            return false
                                                        }
                                                    }

                                                    return (
                                                        <button
                                                            key={idx}
                                                            className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2"
                                                            style={{
                                                                borderColor:
                                                                    idx === selectedImageIndex
                                                                        ? colors.acentoRojo
                                                                        : colors.border,
                                                            }}
                                                            onClick={() =>
                                                                setSelectedImageIndex(idx)
                                                            }
                                                        >
                                                            {isUrl(img) ? (
                                                                <img
                                                                    src={img}
                                                                    alt={`${selectedProduct.name} ${idx + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="w-full h-full"
                                                                    style={{ backgroundColor: img }}
                                                                />
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )
                                    )
                                })()}
                            </div>

                            <div>
                                <div className="mb-6">
                                    <span
                                        className="text-4xl font-bold"
                                        style={{ color: colors.acentoRojo }}
                                    >
                                        ${selectedProduct.price?.toFixed(2)}
                                    </span>
                                    {selectedProduct.stock && (
                                        <p className="mt-2" style={{ color: colors.textMuted }}>
                                            Stock disponible: {selectedProduct.stock}
                                        </p>
                                    )}
                                </div>

                                {selectedProduct.description && (
                                    <div className="mb-6">
                                        <h3
                                            className="font-semibold mb-2"
                                            style={{ color: colors.textPrimary }}
                                        >
                                            Descripción
                                        </h3>
                                        <p style={{ color: colors.textSecondary }}>
                                            {selectedProduct.description}
                                        </p>
                                    </div>
                                )}

                                {selectedProduct.category && (
                                    <div className="mb-6">
                                        <span
                                            className="inline-block px-3 py-1 rounded-full text-sm"
                                            style={{
                                                backgroundColor: colors.bgHover,
                                                color: colors.textPrimary,
                                            }}
                                        >
                                            {selectedProduct.category}
                                        </span>
                                    </div>
                                )}

                                {/* Size selection if available */}
                                {Array.isArray(selectedProduct.sizes) && selectedProduct.sizes.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
                                            Talla
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProduct.sizes.map(sz => (
                                                <button
                                                    key={String(sz)}
                                                    className="px-3 py-2 rounded border text-sm"
                                                    style={{
                                                        borderColor: (selectedSize === sz) ? colors.acentoRojo : colors.border,
                                                        backgroundColor: (selectedSize === sz) ? colors.acentoRojo : 'transparent',
                                                        color: (selectedSize === sz) ? '#fff' : colors.textPrimary,
                                                    }}
                                                    onClick={() => setSelectedSize(sz)}
                                                >
                                                    {sz}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                                            Selecciona una talla antes de añadir al carrito.
                                        </p>
                                    </div>
                                )}
                                <div className="flex gap-2 mt-6">
                                    <button
                                        className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                                        style={{ backgroundColor: colors.btnPrimaryBG, color: colors.bgSurface }}
                                        onClick={() => {
                                            if (!user) {
                                                setShowAuthModal(true);
                                                showNotification('Debes iniciar sesión para comprar.', colors.acentoRojo);
                                                return;
                                            }
                                            // Animación fly-to-cart usando detailImgRef
                                            const cartBtn = document.querySelector('button[title="Carrito"], .cart-btn, [data-cart-icon]');
                                            const imgEl = detailImgRef?.current;
                                            if (imgEl && cartBtn) {
                                                const imgRect = imgEl.getBoundingClientRect();
                                                const cartRect = cartBtn.getBoundingClientRect();
                                                const clone = imgEl.cloneNode(true);
                                                clone.style.position = 'fixed';
                                                clone.style.left = imgRect.left + 'px';
                                                clone.style.top = imgRect.top + 'px';
                                                clone.style.width = imgRect.width + 'px';
                                                clone.style.height = imgRect.height + 'px';
                                                clone.style.pointerEvents = 'none';
                                                clone.classList.add('fly-to-cart-anim');
                                                // Calcular traslación
                                                const x = cartRect.left + cartRect.width / 2 - (imgRect.left + imgRect.width / 2);
                                                const y = cartRect.top + cartRect.height / 2 - (imgRect.top + imgRect.height / 2);
                                                clone.style.setProperty('--fly-x', `${x}px`);
                                                clone.style.setProperty('--fly-y', `${y}px`);
                                                document.body.appendChild(clone);
                                                clone.addEventListener('animationend', () => {
                                                    clone.remove();
                                                });
                                            }
                                            const productWithSize = selectedSize
                                                ? { ...selectedProduct, selectedSize }
                                                : selectedProduct
                                            handleAddToCart(productWithSize)
                                            setSelectedProduct(null)
                                        }}
                                    >
                                        <ShoppingCart size={20} className="inline mr-2" />
                                        Agregar al carrito
                                    </button>
                                    <button
                                        className="btn btn-outline flex-1 flex items-center justify-center gap-2"
                                        style={{ backgroundColor: 'transparent', color: colors.textPrimary, border: `1px solid ${colors.textPrimary}` }}
                                        onClick={() => {
                                            handleAddToWishlist(selectedProduct)
                                        }}
                                    >
                                        <Heart size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-10">
                            <ProductReviews productId={selectedProduct.id} user={user} />
                        </div>
                    </div>
                </div>
            )}

            {/* Lucky Wheel Modal - Triggered by header button */}
            {showLuckyWheelModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.75)' }}
                    onClick={hideLuckyWheel}
                >
                    <div 
                        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4"
                        style={{ backgroundColor: colors.bgSurface }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100"
                            style={{ 
                                background: colors.bgHover,
                                border: 'none',
                                color: colors.textPrimary
                            }}
                            onClick={hideLuckyWheel}
                        >
                            <X size={20} />
                        </button>
                        
                        {/* Lucky Wheel Component */}
                        <div className="p-6">
                            <LuckyWheel 
                                profile={profile} 
                                setProfile={setProfile} 
                                colors={colors} 
                                showNotification={showNotification} 
                                intervalDays={3}
                                isModal={true}
                                onClose={hideLuckyWheel}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Lucky Wheel Floating Button - Original */}
            <LuckyWheel 
                profile={profile} 
                setProfile={setProfile} 
                colors={colors} 
                showNotification={showNotification} 
                intervalDays={3}
            />
            
            {/* Chatbot flotante */}
            <div style={{ position: 'fixed', right: -9, top: '65%', zIndex: 60, transform: 'translateY(-50%)' }}>
                <LiveChatWidget />
            </div>

            {/* Barra inferior de acciones rápidas solo en mobile */}
            {typeof window !== 'undefined' && window.innerWidth <= 600 && (
                <nav
                    className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-white dark:bg-[#181828] border-t border-gray-200 dark:border-gray-700 py-2 shadow-lg md:hidden"
                    style={{
                        minHeight: 56,
                        boxShadow: '0 -2px 8px 0 rgba(0,0,0,0.08)',
                    }}
                >
                    <button
                        className="flex flex-col items-center text-gray-700 dark:text-gray-200 focus:outline-none"
                        style={{ minWidth: 44 }}
                        onClick={() => {
                            setShowCart(true);
                            setShowAuthModal(false);
                        }}
                        title="Carrito"
                    >
                        <ShoppingCart size={28} />
                        <span className="text-xs mt-1">Carrito</span>
                    </button>
                    <button
                        className="flex flex-col items-center text-gray-700 dark:text-gray-200 focus:outline-none"
                        style={{ minWidth: 44 }}
                        onClick={() => {
                            setShowCart(false);
                            setShowAuthModal(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        title="Inicio"
                    >
                        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9"/><path d="M9 21V9h6v12"/></svg>
                        <span className="text-xs mt-1">Inicio</span>
                    </button>
                    <button
                        className="flex flex-col items-center text-gray-700 dark:text-gray-200 focus:outline-none"
                        style={{ minWidth: 44 }}
                        onClick={() => {
                            setShowAuthModal(true);
                            setShowCart(false);
                        }}
                        title="Perfil"
                    >
                        <User size={28} />
                        <span className="text-xs mt-1">Perfil</span>
                    </button>
                </nav>
            )}

            {/* Barra de suscripción a newsletter */}
            <SubscribeBar colors={colors} showNotification={showNotification} />

            {/* Piso de logo con barras de colores */}
            <div 
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '6px',
                    zIndex: 9999,
                    display: 'flex',
                    background: 'linear-gradient(90deg, #ffffff 0%, #ffffff 12.5%, #fbbf24 12.5%, #fbbf24 25%, #1e3a8a 25%, #1e3a8a 37.5%, #16a34a 37.5%, #16a34a 50%, #ec4899 50%, #ec4899 62.5%, #8b5cf6 62.5%, #8b5cf6 75%, #ef4444 75%, #ef4444 87.5%, #3b82f6 87.5%, #3b82f6 100%)',
                    boxShadow: '0 -1px 3px rgba(0,0,0,0.1)'
                }}
            />
        </div>
    )
}

export default App;

