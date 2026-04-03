import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ShoppingCart, Plus, Minus, X, Phone, MapPin, User, Send, ChevronRight, ChevronLeft, Menu as MenuIcon, Search, Globe, Heart, Facebook, Instagram, Twitter, Home, Store, Eye, CheckCircle2, Star, Sparkles, Filter, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Category } from './types';
import { fetchProductsFromSheet, MOCK_PRODUCTS } from './services/sheetService';

const HERO_SLIDES = [
  { image: 'https://res.cloudinary.com/dw1k42gow/image/upload/v1775220696/cf6b40woantu6cijokvl.jpg', title: 'طعم السعادة في كل قطعة', subtitle: 'اكتشف تشكيلتنا الفاخرة من الحلويات المصنوعة بحب' },
  { image: 'https://res.cloudinary.com/dw1k42gow/image/upload/v1775220766/r2pstaxxcadwegyokvws.jpg', title: 'حلي أوقاتك الجميلة', subtitle: 'نخبز يومياً لنضمن لك الطعم الطازج والجودة العالية' },
  { image: 'https://res.cloudinary.com/dw1k42gow/image/upload/v1774874255/oh2vav0ivbhur7ozu3eb.jpg', title: 'لمسة من الفخامة', subtitle: 'حلويات تناسب جميع مناسباتك السعيدة' },
];

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('الكل');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showMotivationalMessage, setShowMotivationalMessage] = useState(false);

  const closeCart = () => {
    setIsCartOpen(false);
    if (cart.length > 0) {
      setShowMotivationalMessage(true);
      setTimeout(() => setShowMotivationalMessage(false), 4000);
    }
  };
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(false);
  const [isCustomOrderOpen, setIsCustomOrderOpen] = useState(false);
  const [customOrderData, setCustomOrderData] = useState({ details: '', phone: '', eventDate: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [toastMessage, setToastMessage] = useState<{show: boolean, message: string, image?: string}>({show: false, message: ''});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [sortOrder, setSortOrder] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [showWhatsApp, setShowWhatsApp] = useState(true);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    setOrderHistory(history);
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // Checkout Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    deliveryTime: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    // @ts-ignore - Vite env variables
    let sheetUrl = import.meta.env.VITE_GOOGLE_SHEET_URL;
    
    // Hardcoded fallback for the user's specific sheet if env is missing or placeholder
    const isPlaceholder = !sheetUrl || sheetUrl.includes('YOUR_SHEET_ID');
    if (isPlaceholder) {
      sheetUrl = 'https://api.sheetbest.com/sheets/eb1bbdfe-9400-47e2-8eef-20beff343caa';
    }
    
    try {
      console.log('Attempting fetch from:', sheetUrl);
      const data = await fetchProductsFromSheet(sheetUrl);
      console.log('Data received from service:', data?.length, 'items');
      
      if (data && data.length > 0) {
        setProducts(data);
        console.log('Products state updated successfully with', data.length, 'items');
      } else {
        console.warn('No products found in sheet, using mock data');
        setProducts(MOCK_PRODUCTS);
        console.log('Mock products loaded:', MOCK_PRODUCTS.length, 'items');
        setError('لم نتمكن من العثور على منتجات في الجدول، تم عرض منتجات تجريبية.');
      }
    } catch (err) {
      console.error('Failed to load sheet data:', err);
      setProducts(MOCK_PRODUCTS);
      setError('حدث خطأ أثناء الاتصال بالجدول، تم عرض منتجات تجريبية.');
    } finally {
      setLoading(false);
    }
  };

  const [isScrolled, setIsScrolled] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  // Handle scroll to hide/show WhatsApp button and Navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // WhatsApp button and Navbar logic
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setShowWhatsApp(false);
        setShowNavbar(false);
      } else {
        setShowWhatsApp(true);
        setShowNavbar(true);
      }
      
      setIsScrolled(currentScrollY > 20);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadData();

    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const dynamicCategories = useMemo(() => {
    const cats = new Set<string>(['الكل']);
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const matchesCategory = selectedCategory === 'الكل' || selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    
    if (sortOrder === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    }
    
    return result;
  }, [products, selectedCategory, searchQuery, sortOrder]);

  const [cartShake, setCartShake] = useState(false);

  // Periodic shake to encourage completion
  useEffect(() => {
    if (cart.length > 0) {
      const interval = setInterval(() => {
        setCartShake(true);
        setTimeout(() => setCartShake(false), 500);
      }, 10000); // Shake every 10 seconds
      return () => clearInterval(interval);
    }
  }, [cart.length]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    
    // Trigger shake animation
    setCartShake(true);
    setTimeout(() => setCartShake(false), 500);

    // Show Toast
    setToastMessage({ show: true, message: `تم إضافة "${product.name}" إلى سلة المشتريات بنجاح! 🍰`, image: product.image });
    setTimeout(() => setToastMessage(prev => ({ ...prev, show: false })), 3000);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const orderSummary = cart.map(item => `${item.name} x${item.quantity} (${item.price * item.quantity} ج.م)`).join('\n');
    const totalText = `الإجمالي: ${cartTotal} ج.م`;
    const customerInfo = `الاسم: ${formData.name}\nالهاتف: ${formData.phone}\nالعنوان: ${formData.address}\nوقت التوصيل المفضل: ${formData.deliveryTime}`;
    
    const message = `*طلب جديد من حلي حياتك*\n\n${customerInfo}\n\n*تفاصيل الطلب:*\n${orderSummary}\n\n*${totalText}*`;
    const whatsappUrl = `https://wa.me/201098983079?text=${encodeURIComponent(message)}`; 
    
    window.open(whatsappUrl, '_blank');

    // Save to order history
    const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    const newOrder = {
      date: new Date().toISOString(),
      items: cart,
      total: cartTotal
    };
    const updatedHistory = [newOrder, ...history].slice(0, 3);
    localStorage.setItem('orderHistory', JSON.stringify(updatedHistory));
  };

  const handleCustomOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `*طلب على مزاجي 🎨*\n\n*التفاصيل:*\n${customOrderData.details}\n\n*موعد المناسبة:*\n${customOrderData.eventDate}\n\n*رقم التواصل:*\n${customOrderData.phone}`;
    const whatsappUrl = `https://wa.me/201098983079?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setIsCustomOrderOpen(false);
    setCustomOrderData({ details: '', phone: '', eventDate: '' });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-brand-gold selection:text-white">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-4 right-4 z-[100] flex items-center gap-2 bg-white/90 backdrop-blur-xl border border-brand-gold/30 px-3 py-2 rounded-xl shadow-[0_10px_40px_-10px_rgba(212,175,55,0.4)]"
          >
            {toastMessage.image && (
              <img src={toastMessage.image} alt="Product" className="w-8 h-8 rounded-lg object-cover border-2 border-white shadow-md" />
            )}
            <span className="text-brand-brown font-bold text-xs px-1 whitespace-normal text-right flex-1">{toastMessage.message}</span>
            <div className="w-6 h-6 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Smart Search Modal */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-3xl p-6 md:p-12 overflow-y-auto"
            >
              <div className="max-w-4xl mx-auto pt-10">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-serif text-brand-brown">البحث الذكي</h2>
                  <button onClick={() => setIsSearchOpen(false)} className="p-2 bg-brand-beige/50 rounded-full hover:bg-brand-kashmir hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="relative mb-10">
                  <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-kashmir" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="ابحث عن تورتة، حلوى، أو أي شيء تشتهيه..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border-2 border-brand-gold/30 rounded-full py-4 pr-16 pl-6 text-lg focus:outline-none focus:border-brand-kashmir shadow-xl transition-colors"
                  />
                </div>
                
                {/* Search Results */}
                {searchQuery && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {filteredProducts.slice(0, 6).map(product => (
                      <div key={product.id} onClick={() => { setQuickViewProduct(product); setIsSearchOpen(false); }} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-brand-gold/10 shadow-lg cursor-pointer hover:shadow-xl hover:scale-105 transition-all">
                        <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover" />
                        <div>
                          <h3 className="font-bold text-brand-brown line-clamp-1">{product.name}</h3>
                          <p className="text-brand-kashmir font-bold">{product.price} ج.م</p>
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <p className="text-center text-gray-500 col-span-full py-10">لا توجد نتائج مطابقة لبحثك.</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Header Area */}
      <motion.header 
        initial={{ y: 0 }}
        animate={{ y: showNavbar ? 0 : -120 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="sticky top-0 z-50 w-full"
      >
        {/* Top Upper Bar - Animated Marquee */}
        <div className="bg-brand-kashmir text-white py-2 text-[9px] md:text-[10px] font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase border-b border-white/10 overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee items-center gap-8 md:gap-12 w-max">
            <span>✨ خصم 10% على جميع التورتات بمناسبة الافتتاح ✨</span>
            <span className="flex items-center gap-2">
              <Phone className="w-3 h-3" />
              خدمة العملاء: 01098983079
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              كفر الشيخ، بلطيم، أمام السوق القطاعي
            </span>
            <span>🍰 أشهى الحلويات المخبوزة يومياً بحب 🍰</span>
            <span>✨ خصم 10% على جميع التورتات بمناسبة الافتتاح ✨</span>
            <span className="flex items-center gap-2">
              <Phone className="w-3 h-3" />
              خدمة العملاء: 01098983079
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              كفر الشيخ، بلطيم، أمام السوق القطاعي
            </span>
            <span>🍰 أشهى الحلويات المخبوزة يومياً بحب 🍰</span>
          </div>
        </div>

        {/* Navbar */}
        <div className={`transition-all duration-500 ${isScrolled ? 'bg-white/95 backdrop-blur-3xl shadow-[0_10px_40px_-10px_rgba(212,175,55,0.3)] py-2' : 'bg-white/90 backdrop-blur-xl border-b border-brand-gold/10 py-3 luxury-shadow'}`}>
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-dashed border-brand-gold/40 rounded-full animate-[spin_10s_linear_infinite] group-hover:border-brand-kashmir transition-colors duration-500" />
                <div className="absolute inset-1 bg-brand-gold/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <img 
                  src="https://scontent.fcai20-2.fna.fbcdn.net/v/t39.30808-6/427791635_122110701860207237_612968014316171595_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=53a332&_nc_ohc=oZgWIBB9_t4Q7kNvwHkWe_s&_nc_oc=AdovNTfGFE7vDn_KW4_qBcnulwk-PdTChcm22kjb-i5wS3-pjfw3ZyB1f_NlJ5jKyYo&_nc_zt=23&_nc_ht=scontent.fcai20-2.fna&_nc_gid=HED6rmsYTmGbZ5XPmVc1cw&_nc_ss=7a3a8&oh=00_AfyG5diyEh-rdKZ7jWekx8vKEotc0XTdznUSC8xY7Wt54g&oe=69CFBDBD" 
                  alt="Sweeten Your Life Logo" 
                  className="w-10 h-10 md:w-14 md:h-14 object-contain rounded-full shadow-lg relative z-10 transform group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="font-serif font-bold text-lg md:text-2xl leading-tight text-brand-brown tracking-wide group-hover:text-brand-gold transition-colors duration-300">حلي حياتك</h1>
                <span className="text-[7px] md:text-[10px] text-brand-gold font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase opacity-70">Sweeten Your Life</span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-6">
              <div className="hidden lg:flex items-center gap-6 xl:gap-8 ml-4 xl:ml-8 text-[10px] font-bold tracking-[0.2em] uppercase text-brand-brown/60">
                <button className="hover:text-brand-gold transition-colors">الرئيسية</button>
                <button className="hover:text-brand-gold transition-colors flex items-center gap-2">
                  من نحن
                  <span className="text-[7px] bg-brand-kashmir/20 text-brand-kashmir px-1.5 py-0.5 rounded-full border border-brand-kashmir/30">تحت التطوير</span>
                </button>
                <button className="hover:text-brand-gold transition-colors flex items-center gap-2">
                  الفروع
                  <span className="text-[7px] bg-brand-kashmir/20 text-brand-kashmir px-1.5 py-0.5 rounded-full border border-brand-kashmir/30">تحت التطوير</span>
                </button>
              </div>
              
              <div className="flex items-center gap-1 md:gap-4 bg-brand-beige/30 p-1 rounded-full border border-brand-gold/10">
                <button 
                  onClick={() => setIsCategorySidebarOpen(true)}
                  className="flex flex-col items-center justify-center px-2 md:px-3 py-1 hover:bg-white rounded-full transition-all group"
                >
                  <MenuIcon className="w-4 h-4 md:w-5 md:h-5 text-brand-gold group-hover:scale-110 transition-transform" />
                  <span className="text-[7px] md:text-[10px] font-bold text-brand-gold">الأقسام</span>
                </button>
                <button 
                  onClick={loadData}
                  disabled={loading}
                  className={`p-1.5 md:p-2 hover:bg-white rounded-full transition-all group ${loading ? 'animate-spin' : ''}`}
                  title="تحديث البيانات"
                >
                  <Globe className={`w-4 h-4 md:w-5 md:h-5 text-brand-brown group-hover:text-brand-gold transition-colors ${loading ? 'opacity-50' : ''}`} />
                </button>
                <button className="p-1.5 md:p-2 hover:bg-white rounded-full transition-all group hidden md:block">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-brand-brown group-hover:text-brand-gold transition-colors" />
                </button>
              </div>

              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 md:p-4 gold-gradient text-brand-brown rounded-full transition-all hover:shadow-2xl hover:scale-110 active:scale-95 group shadow-lg"
              >
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-12 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-pink text-brand-brown text-[9px] md:text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full border-2 border-white shadow-xl animate-bounce">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Slider */}
      <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden bg-brand-brown">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src={HERO_SLIDES[currentSlide].image}
              className="w-full h-full object-cover opacity-60"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-brown via-brand-brown/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-3xl"
            >
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-4 md:mb-6 drop-shadow-2xl leading-tight">
                {HERO_SLIDES[currentSlide].title}
              </h2>
              <p className="text-lg md:text-2xl text-brand-beige mb-8 md:mb-10 drop-shadow-md">
                {HERO_SLIDES[currentSlide].subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.button
            animate={{ scale: [1, 1.05, 1], boxShadow: ['0 0 40px rgba(212,175,55,0.4)', '0 0 60px rgba(212,175,55,0.8)', '0 0 40px rgba(212,175,55,0.4)'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCustomOrderOpen(true)}
            className="px-8 py-4 md:px-10 md:py-5 gold-gradient text-brand-brown rounded-full font-bold text-lg md:text-xl transition-all flex items-center gap-3 group"
          >
            <Sparkles className="w-6 h-6 group-hover:animate-spin" />
            اطلب على مزاجك
          </motion.button>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all duration-500 ${currentSlide === i ? 'bg-brand-gold w-8' : 'bg-white/50 w-2 hover:bg-white'}`}
            />
          ))}
        </div>
      </div>

      {/* Custom Order Modal */}
      <AnimatePresence>
        {isCustomOrderOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCustomOrderOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-brand-gold/20"
            >
              <div className="p-6 md:p-8 kashmir-gradient text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
                <h3 className="text-2xl md:text-3xl font-serif font-bold relative z-10">اطلب على مزاجك 🎨</h3>
                <p className="text-white/80 mt-2 relative z-10">وصف لنا اللي في خيالك، وإحنا ننفذه لك!</p>
                <button onClick={() => setIsCustomOrderOpen(false)} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors z-10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCustomOrder} className="p-6 md:p-8 space-y-6">
                <div>
                  <label className="block text-brand-brown font-bold mb-2">طلبك بالتفصيل</label>
                  <textarea
                    required
                    value={customOrderData.details}
                    onChange={e => setCustomOrderData({...customOrderData, details: e.target.value})}
                    placeholder="مثال: تورته دورين بالشوكولاتة وعليها اسم أحمد..."
                    className="w-full px-4 py-3 rounded-xl border border-brand-gold/30 focus:border-brand-kashmir focus:ring-2 focus:ring-brand-kashmir/20 outline-none transition-all resize-none h-32"
                  />
                </div>
                <div>
                  <label className="block text-brand-brown font-bold mb-2">رقم الواتساب للتواصل</label>
                  <input
                    type="tel"
                    required
                    value={customOrderData.phone}
                    onChange={e => setCustomOrderData({...customOrderData, phone: e.target.value})}
                    placeholder="01xxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border border-brand-gold/30 focus:border-brand-kashmir focus:ring-2 focus:ring-brand-kashmir/20 outline-none transition-all text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-brand-brown font-bold mb-2">موعد المناسبة</label>
                  <input
                    type="date"
                    required
                    value={customOrderData.eventDate}
                    onChange={e => setCustomOrderData({...customOrderData, eventDate: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-brand-gold/30 focus:border-brand-kashmir focus:ring-2 focus:ring-brand-kashmir/20 outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 gold-gradient text-brand-brown rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  إرسال الطلب
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Category Sidebar */}
      <AnimatePresence>
        {isCategorySidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategorySidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-72 bg-white z-[120] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-brand-gold/10 flex items-center justify-between kashmir-gradient text-white">
                <div className="flex items-center gap-3">
                  <MenuIcon className="w-6 h-6" />
                  <h2 className="text-xl font-serif font-bold">الأقسام الفاخرة</h2>
                </div>
                <button onClick={() => setIsCategorySidebarOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-brand-beige/10">
                {dynamicCategories.map((cat, index) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat as Category);
                      setIsCategorySidebarOpen(false);
                    }}
                    className={`w-full text-right px-6 py-4 rounded-2xl text-base font-bold transition-all duration-300 flex items-center justify-between group ${
                      selectedCategory === cat 
                      ? 'kashmir-gradient text-white shadow-lg scale-[1.02]' 
                      : 'bg-white text-brand-brown border border-brand-gold/10 hover:border-brand-kashmir hover:bg-brand-kashmir/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-brand-beige text-brand-gold group-hover:bg-brand-kashmir/20 group-hover:text-brand-kashmir'}`}>
                        {index === 0 ? <Store className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                      </div>
                      {cat === 'All' || cat === 'الكل' ? 'القائمة الكاملة' : cat}
                    </div>
                    {selectedCategory === cat && <ChevronLeft className="w-5 h-5 opacity-70" />}
                  </button>
                ))}
              </div>
              <div className="p-6 border-t border-brand-gold/10 text-center bg-white">
                <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest">Sweeten Your Life</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-16">
        {error && !loading && (
          <div className="mb-8 p-4 bg-brand-pink/10 border border-brand-pink/20 rounded-2xl text-brand-pink text-center font-bold flex flex-col items-center gap-4">
            <p>{error}</p>
            <button 
              onClick={loadData}
              className="px-6 py-2 bg-brand-pink text-white rounded-full text-sm hover:bg-brand-brown transition-colors"
            >
              تحديث البيانات
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-16 h-16 border-4 border-brand-gold border-t-brand-brown rounded-full animate-spin"></div>
            <p className="text-brand-gold font-serif text-xl italic animate-pulse">جاري تحضير أشهى الحلويات...</p>
          </div>
        ) : (
          <>
            <div className="mb-8 md:mb-12 text-center relative">
              <h2 className="font-serif text-4xl md:text-5xl text-brand-brown mb-4 drop-shadow-sm">
                {selectedCategory === 'All' || selectedCategory === 'الكل' ? 'قائمة الحلويات' : selectedCategory}
              </h2>
              <div className="w-24 h-1 gold-gradient mx-auto rounded-full shadow-sm" />
              <p className="mt-4 text-brand-gold font-bold tracking-widest uppercase text-xs md:text-sm drop-shadow-sm">Premium Bakery Selection</p>
              
              {/* Advanced Filter / Sort */}
              <div className="flex flex-wrap justify-center mt-6 gap-4">
                {/* Search Input */}
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-md border border-brand-gold/20">
                  <Search className="w-5 h-5 text-brand-kashmir" />
                  <input
                    type="text"
                    placeholder="ابحث عن منتج..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-brand-brown font-bold focus:outline-none text-sm w-40 md:w-60"
                  />
                </div>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-32 bg-white/50 rounded-[3rem] border-2 border-dashed border-brand-gold/20 luxury-shadow">
                <p className="text-brand-gold font-serif text-2xl">عذراً، لا توجد منتجات في هذا القسم حالياً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
                {filteredProducts.map((product, index) => {
                  const getCardShape = (i: number) => {
                    const shapes = [
                      'rounded-[1.5rem] md:rounded-[2.5rem]', // مستطيل بحواف دائرية
                      'rounded-t-full rounded-b-[1.5rem] md:rounded-b-[2.5rem]', // دائري (Dome)
                      'rounded-tl-[2rem] rounded-br-[2rem] md:rounded-tl-[3rem] md:rounded-br-[3rem] rounded-tr-xl rounded-bl-xl', // هندسي
                      'rounded-3xl', // مربع بحواف دائرية
                    ];
                    return shapes[i % 4];
                  };

                  const getImageShape = (i: number) => {
                    const shapes = [
                      'rounded-[1rem] md:rounded-[2rem]', 
                      'rounded-t-full rounded-b-xl md:rounded-b-2xl', 
                      'rounded-tl-[1.5rem] rounded-br-[1.5rem] md:rounded-tl-[2.5rem] md:rounded-br-[2.5rem] rounded-tr-lg rounded-bl-lg', 
                      'rounded-2xl', 
                    ];
                    return shapes[i % 4];
                  };

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{ delay: (index % 4) * 0.1, duration: 0.6 }}
                      key={product.id}
                      className="group relative"
                    >
                      {/* Card Container */}
                      <div className={`bg-white overflow-hidden border border-brand-gold/20 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-10px_rgba(212,175,55,0.3)] transition-all duration-700 flex flex-col h-full group/card relative ${getCardShape(index)}`}>
                        <div className={`absolute inset-0 ring-1 ring-inset ring-brand-gold/10 pointer-events-none z-20 ${getCardShape(index)}`} />
                        
                        {/* Image Section */}
                        <div 
                          className={`relative aspect-[4/5] overflow-hidden m-2 md:m-3 bg-brand-cream shadow-inner cursor-pointer ${getImageShape(index)}`}
                          onClick={() => setQuickViewProduct(product)}
                        >
                          <img 
                            src={product.image} 
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Status Badge */}
                          <div className="absolute top-2 right-2 md:top-6 md:right-6">
                            <div className={`px-2 py-1 md:px-5 md:py-2 rounded-full text-white text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl border border-white/20 ${index % 3 === 0 ? 'bg-brand-brown' : 'kashmir-gradient'}`}>
                              {index % 3 === 0 ? 'الأكثر مبيعاً' : 'جديد'}
                            </div>
                          </div>

                          {/* Floating Action Buttons */}
                          <div className="absolute top-2 left-2 md:top-6 md:left-6 flex flex-col gap-2 md:gap-3 translate-x-0 md:translate-x-12 opacity-100 md:opacity-0 group-hover/card:translate-x-0 group-hover/card:opacity-100 transition-all duration-500 z-30">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                              className={`w-8 h-8 md:w-10 md:h-10 rounded-full glass-card flex items-center justify-center transition-all shadow-lg ${favorites.includes(product.id) ? 'bg-brand-kashmir text-white' : 'text-brand-kashmir hover:bg-brand-kashmir hover:text-white'}`}
                            >
                              <Heart className={`w-3 h-3 md:w-4 md:h-4 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setQuickViewProduct(product); }}
                              className="w-8 h-8 md:w-10 md:h-10 rounded-full glass-card flex items-center justify-center text-brand-brown hover:bg-brand-brown hover:text-white transition-all shadow-lg hidden md:flex"
                            >
                              <Eye className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-3 md:p-8 pt-2 flex flex-col flex-1 text-center">
                          <div className="mb-2 md:mb-4">
                            <span className="text-[8px] md:text-[10px] text-brand-gold font-bold uppercase tracking-[0.3em] opacity-60">{product.category}</span>
                            <h3 className="font-serif font-bold text-sm md:text-2xl text-brand-brown mt-1 group-hover/card:text-brand-kashmir transition-colors duration-300 line-clamp-1">
                              {product.name}
                            </h3>
                            <div className="mt-1 md:mt-3 font-serif font-bold text-xs md:text-xl text-brand-brown">
                              {product.price} ج.م
                            </div>
                          </div>
                          
                          <div className="mt-auto">
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-brand-gold/10 to-transparent mb-3 md:mb-6" />
                            <button 
                              onClick={() => addToCart(product)}
                              className="w-full py-2 md:py-4 bg-brand-brown text-brand-gold rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-2 md:gap-3 hover:kashmir-gradient hover:text-white transition-all duration-500 shadow-xl group/btn overflow-hidden relative text-xs md:text-base"
                            >
                              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 relative z-10 group-hover/btn:scale-110 transition-transform" />
                              <span className="relative z-10">أضف للسلة</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Search Popup */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          >
            <motion.div 
              initial={{ y: -50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -50, scale: 0.9 }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 flex items-center gap-4">
                <Search className="w-6 h-6 text-brand-brown" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="ابحث عن ..." 
                  className="flex-1 text-xl py-2 outline-none text-brand-brown"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCart}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-brand-gold/10 flex items-center justify-between bg-brand-brown text-brand-gold">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6" />
                  <h2 className="text-xl font-serif font-bold">سلة المشتريات</h2>
                </div>
                <button onClick={closeCart} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-6">
                    <div className="w-24 h-24 bg-brand-pink/10 rounded-full flex items-center justify-center border-2 border-brand-pink/20">
                      <ShoppingCart className="w-10 h-10 text-brand-pink" />
                    </div>
                    <div>
                      <p className="text-brand-brown font-serif text-2xl mb-2">السلة فارغة حالياً</p>
                      <p className="text-brand-lotus text-sm uppercase tracking-widest">Treat yourself to something sweet!</p>
                    </div>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-5 group">
                      <div className="relative">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          loading="lazy"
                          className="w-24 h-24 rounded-2xl object-cover border border-brand-gold/10 luxury-shadow"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between mb-2">
                          <h4 className="font-serif font-bold text-brand-brown text-lg">{item.name}</h4>
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-brand-pink transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-brand-gold font-bold text-lg mb-4">{item.price} ج.م</p>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center bg-brand-beige rounded-xl p-1 border border-brand-gold/10">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1.5 hover:bg-white rounded-lg transition-colors text-brand-brown"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-10 text-center font-bold text-brand-brown">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1.5 hover:bg-white rounded-lg transition-colors text-brand-brown"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="font-bold text-brand-brown/40 text-sm">
                            {item.price * item.quantity} ج.م
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 border-t border-brand-gold/10 bg-brand-beige">
                  <div className="flex justify-between mb-8">
                    <span className="text-brand-brown/60 font-serif text-lg">إجمالي الطلب</span>
                    <span className="text-3xl font-bold text-brand-brown">{cartTotal} ج.م</span>
                  </div>
                  <button 
                    onClick={() => {
                      closeCart();
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full gold-gradient text-brand-brown font-bold py-5 rounded-2xl shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    <span>إتمام الطلب الآن</span>
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-brand-gold/20"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-3xl font-serif font-bold text-brand-brown">إتمام الطلب</h2>
                  <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-brand-beige rounded-full transition-colors">
                    <X className="w-6 h-6 text-brand-gold" />
                  </button>
                </div>

                <form onSubmit={handleCheckout} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-brand-brown/60 mr-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-brand-gold" />
                      الاسم بالكامل
                    </label>
                    <input 
                      required
                      type="text" 
                      placeholder="أدخل اسمك هنا"
                      className="w-full px-6 py-4 bg-brand-beige rounded-2xl border border-brand-gold/10 outline-none focus:border-brand-gold transition-colors text-brand-brown font-medium"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-brand-brown/60 mr-2 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-brand-gold" />
                      رقم الهاتف
                    </label>
                    <input 
                      required
                      type="tel" 
                      placeholder="01xxxxxxxxx"
                      className="w-full px-6 py-4 bg-brand-beige rounded-2xl border border-brand-gold/10 outline-none focus:border-brand-gold transition-colors text-brand-brown font-medium"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-brand-brown/60 mr-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-gold" />
                      عنوان التوصيل
                    </label>
                    <textarea 
                      required
                      placeholder="أدخل عنوانك بالتفصيل (المنطقة، الشارع، رقم المبنى)"
                      className="w-full px-6 py-4 bg-brand-beige rounded-2xl border border-brand-gold/10 outline-none focus:border-brand-gold transition-colors text-brand-brown font-medium h-32 resize-none"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-brand-brown/60 mr-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-gold" />
                      وقت التوصيل المفضل
                    </label>
                    <input 
                      required
                      type="datetime-local" 
                      className="w-full px-6 py-4 bg-brand-beige rounded-2xl border border-brand-gold/10 outline-none focus:border-brand-gold transition-colors text-brand-brown font-medium"
                      value={formData.deliveryTime}
                      onChange={(e) => setFormData({...formData, deliveryTime: e.target.value})}
                    />
                  </div>

                  <div className="pt-4">
                    <div className="bg-brand-beige/50 p-6 rounded-2xl mb-8 border border-brand-gold/10">
                      <div className="flex justify-between items-center">
                        <span className="text-brand-brown/60 font-serif text-lg">إجمالي الطلب</span>
                        <span className="text-2xl font-bold text-brand-brown">{cartTotal} ج.م</span>
                      </div>
                    </div>
                    <button 
                      type="submit"
                      className="w-full gold-gradient text-brand-brown font-bold py-5 rounded-2xl shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                      <Send className="w-5 h-5" />
                      إرسال الطلب عبر واتساب
                    </button>
                    <p className="text-center text-[10px] text-brand-gold mt-4 uppercase tracking-widest font-bold">
                      سيتم تحويلك مباشرة إلى واتساب لتأكيد الطلب
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickViewProduct(null)}
              className="absolute inset-0 bg-brand-brown/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row border border-brand-gold/20 max-h-[90vh]"
            >
              <button 
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-brand-brown hover:bg-brand-brown hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-brand-cream">
                <img 
                  src={quickViewProduct.image} 
                  alt={quickViewProduct.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-6 left-6">
                  <div className="px-5 py-2 rounded-full kashmir-gradient text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl border border-white/20">
                    جديد
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto">
                <span className="text-[10px] text-brand-gold font-bold uppercase tracking-[0.3em] opacity-60 mb-2">{quickViewProduct.category}</span>
                <h2 className="font-serif font-bold text-3xl md:text-4xl text-brand-brown mb-4">{quickViewProduct.name}</h2>
                <div className="text-3xl font-bold text-brand-kashmir mb-8">{quickViewProduct.price} ج.م</div>
                
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2 text-xs text-brand-brown/70">
                    {quickViewProduct.size && <span className="bg-brand-beige px-3 py-1 rounded-full">الحجم: {quickViewProduct.size}</span>}
                    {quickViewProduct.calories && <span className="bg-brand-beige px-3 py-1 rounded-full">السعرات: {quickViewProduct.calories}</span>}
                  </div>
                  <p className="text-brand-brown/80 leading-relaxed">{quickViewProduct.description}</p>
                  {quickViewProduct.ingredients && (
                    <div>
                      <h4 className="font-bold text-brand-brown mb-1">المكونات:</h4>
                      <p className="text-brand-brown/70 text-sm">{quickViewProduct.ingredients}</p>
                    </div>
                  )}
                  {quickViewProduct.options && (
                    <div>
                      <h4 className="font-bold text-brand-brown mb-1">خيارات إضافية:</h4>
                      <p className="text-brand-brown/70 text-sm">{quickViewProduct.options}</p>
                    </div>
                  )}
                  {orderHistory.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-brand-gold/10">
                      <h3 className="font-serif font-bold text-brand-brown text-xl mb-4">طلبات سابقة</h3>
                      {orderHistory.map((order, index) => (
                        <div key={index} className="bg-brand-beige/50 p-4 rounded-2xl mb-4">
                          <p className="text-sm text-brand-brown/60 mb-2">{new Date(order.date).toLocaleDateString('ar-EG')}</p>
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-brand-brown">{order.total} ج.م</p>
                            <button 
                              onClick={() => {
                                order.items.forEach((item: any) => addToCart(item));
                                closeCart();
                              }}
                              className="text-brand-gold font-bold hover:text-brand-brown transition-colors"
                            >
                              إعادة طلب
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {orderHistory.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-brand-gold/10">
                      <h3 className="font-serif font-bold text-brand-brown text-xl mb-4">طلبات سابقة</h3>
                      {orderHistory.map((order, index) => (
                        <div key={index} className="bg-brand-beige/50 p-4 rounded-2xl mb-4">
                          <p className="text-sm text-brand-brown/60 mb-2">{new Date(order.date).toLocaleDateString('ar-EG')}</p>
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-brand-brown">{order.total} ج.م</p>
                            <button 
                              onClick={() => {
                                order.items.forEach((item: any) => addToCart(item));
                                closeCart();
                              }}
                              className="text-brand-gold font-bold hover:text-brand-brown transition-colors"
                            >
                              إعادة طلب
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-auto pt-8 border-t border-brand-gold/10 flex gap-4">
                  <button 
                    onClick={() => {
                      addToCart(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 py-4 bg-brand-brown text-brand-gold rounded-2xl font-bold flex items-center justify-center gap-3 hover:kashmir-gradient hover:text-white transition-all duration-500 shadow-xl"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>أضف إلى السلة</span>
                  </button>
                  <button 
                    onClick={() => toggleFavorite(quickViewProduct.id)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg border border-brand-gold/20 ${favorites.includes(quickViewProduct.id) ? 'bg-brand-kashmir text-white' : 'bg-white text-brand-kashmir hover:bg-brand-kashmir hover:text-white'}`}
                  >
                    <Heart className={`w-6 h-6 ${favorites.includes(quickViewProduct.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Back to Top Button Removed */}

      {/* Footer */}
      <footer id="footer" className="bg-brand-cream text-brand-brown pt-32 pb-12 px-4 relative overflow-hidden border-t border-brand-gold/20">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-px gold-gradient opacity-30" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-kashmir/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-gold/10 rounded-full blur-[120px]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Newsletter Section */}
          <div className="mb-24 p-12 md:p-16 rounded-[4rem] bg-white/40 border border-white/40 backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="max-w-xl text-center lg:text-right relative z-10">
              <h3 className="font-serif font-bold text-4xl mb-6 text-brand-kashmir">انضم إلى عالمنا الفاخر</h3>
              <p className="text-brand-brown/70 text-lg leading-relaxed">انضم إلى مجتمعنا الحصري على فيسبوك لتصلك أحدث الإبداعات والعروض الخاصة من "حلي حياتك" قبل الجميع.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto justify-center relative z-10">
              <a 
                href="https://www.facebook.com/groups/2619165931728460" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-16 py-6 rounded-full gold-gradient text-brand-brown font-bold hover:shadow-[0_0_50px_rgba(212,175,55,0.3)] hover:scale-105 transition-all group whitespace-nowrap text-xl shadow-2xl"
              >
                <Facebook className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                <span>انضمام للمجتمع</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20">
            <div className="space-y-10">
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-dashed border-brand-gold/40 rounded-full animate-[spin_10s_linear_infinite]" />
                  <img 
                    src="https://scontent.fcai20-2.fna.fbcdn.net/v/t39.30808-6/427791635_122110701860207237_612968014316171595_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=53a332&_nc_ohc=oZgWIBB9_t4Q7kNvwHkWe_s&_nc_oc=AdovNTfGFE7vDn_KW4_qBcnulwk-PdTChcm22kjb-i5wS3-pjfw3ZyB1f_NlJ5jKyYo&_nc_zt=23&_nc_ht=scontent.fcai20-2.fna&_nc_gid=HED6rmsYTmGbZ5XPmVc1cw&_nc_ss=7a3a8&oh=00_AfyG5diyEh-rdKZ7jWekx8vKEotc0XTdznUSC8xY7Wt54g&oe=69CFBDBD" 
                    alt="Sweeten Your Life Logo" 
                    loading="lazy"
                    className="w-16 h-16 object-contain rounded-full shadow-2xl border-2 border-brand-gold/20 relative z-10"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif font-bold text-3xl tracking-wide text-brand-brown">حلي حياتك</span>
                  <span className="text-[10px] uppercase tracking-[0.4em] text-brand-kashmir font-bold opacity-80">Sweeten Your Life</span>
                </div>
              </div>
              <p className="text-brand-brown/70 text-base leading-relaxed font-serif italic">
                نصنع السعادة يدوياً بأجود المكونات الطبيعية، لنقدم لكم تجربة تذوق لا تُنسى تجمع بين الأصالة المصرية واللمسة العصرية.
              </p>
              <div className="flex gap-5">
                {[
                  { icon: <Facebook className="w-6 h-6" />, link: "https://www.facebook.com/sweeten.your.life/" },
                  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>, link: "https://www.tiktok.com/@nairaabdo128" },
                  { icon: <Instagram className="w-6 h-6" />, link: "#" }
                ].map((social, i) => (
                  <a 
                    key={i}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 rounded-2xl bg-white/40 border border-white/50 flex items-center justify-center text-brand-kashmir hover:bg-brand-kashmir hover:text-white transition-all shadow-xl hover:-translate-y-2"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-serif font-bold text-2xl mb-10 border-b border-brand-gold/20 pb-5 inline-block text-brand-kashmir">أقسامنا الفاخرة</h4>
              <ul className="space-y-5 text-base text-brand-brown/70">
                {dynamicCategories.map(cat => (
                  <li key={cat}>
                    <button onClick={() => setSelectedCategory(cat as Category)} className="hover:text-brand-kashmir transition-colors flex items-center gap-3 group">
                      <span className="w-2 h-2 rounded-full bg-brand-kashmir/20 group-hover:bg-brand-kashmir transition-all group-hover:scale-125" />
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-serif font-bold text-2xl mb-10 border-b border-brand-gold/20 pb-5 inline-block text-brand-kashmir">روابط سريعة</h4>
              <ul className="space-y-5 text-base text-brand-brown/70">
                {['قصتنا', 'الجودة والتميز', 'فروعنا', 'سياسة الخصوصية', 'الشروط والأحكام'].map(item => (
                  <li key={item}>
                    <button className="hover:text-brand-kashmir transition-colors flex items-center gap-3 group">
                      <span className="w-2 h-2 rounded-full bg-brand-kashmir/20 group-hover:bg-brand-kashmir transition-all group-hover:scale-125" />
                      {item}
                      <span className="text-[9px] bg-brand-kashmir/10 text-brand-kashmir px-2 py-0.5 rounded-full mr-2 border border-brand-kashmir/20">تحت التطوير</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-serif font-bold text-2xl mb-10 border-b border-brand-gold/20 pb-5 inline-block text-brand-kashmir">تواصل معنا</h4>
              <ul className="space-y-8 text-base text-brand-brown/70">
                <li className="flex items-center gap-5 group">
                  <div className="w-14 h-14 rounded-2xl bg-white/40 border border-white/50 flex items-center justify-center text-brand-kashmir group-hover:bg-brand-kashmir group-hover:text-white transition-all shadow-lg">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-1">الخط الساخن</span>
                    <span className="font-bold text-xl text-brand-brown tracking-wider">01098983079</span>
                  </div>
                </li>
                <li className="flex items-center gap-5 group">
                  <div className="w-14 h-14 rounded-2xl bg-white/40 border border-white/50 flex items-center justify-center text-brand-kashmir group-hover:bg-brand-kashmir group-hover:text-white transition-all shadow-lg">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-1">المقر الرئيسي</span>
                    <span className="text-brand-brown text-sm leading-relaxed">كفر الشيخ، بلطيم، أمام السوق القطاعي</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-32 pt-12 border-t border-brand-gold/10 flex flex-col md:flex-row justify-between items-center gap-12 text-[10px] text-brand-brown/50 uppercase tracking-[0.3em] font-bold relative">
            <p>© {new Date().getFullYear()} Sweeten Your Life Bakery. Crafted with Love.</p>
            
            {/* Developer Stamp in Footer */}
            <a 
              href="https://www.facebook.com/abdoo.elbass" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group order-first md:order-none"
            >
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Outer Ring */}
                <div className="absolute inset-0 border border-brand-kashmir/20 rounded-full animate-[spin_20s_linear_infinite] group-hover:border-brand-kashmir/40 transition-colors" />
                <div className="absolute inset-2 border border-dashed border-brand-kashmir/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                
                {/* Inner Content */}
                <div className="bg-white/50 backdrop-blur-md border border-brand-kashmir/20 rounded-full w-20 h-20 flex flex-col items-center justify-center text-center p-2 transform group-hover:scale-110 transition-all duration-500 shadow-xl relative z-10 animate-pulse md:animate-none group-hover:animate-none">
                  <span className="text-[6px] text-brand-kashmir/80 uppercase tracking-widest mb-0.5">Dev By</span>
                  <span className="text-xl text-brand-brown font-signature leading-tight -rotate-6 mt-1 drop-shadow-[0_0_1px_rgba(212,175,55,0.8)]">A. Elbass</span>
                </div>

                {/* Orbiting Golden Dot */}
                <div className="absolute inset-0 animate-[spin_5s_linear_infinite]">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-brand-gold rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                </div>

                {/* Decorative Dots */}
                {[0, 90, 180, 270].map(deg => (
                  <div 
                    key={deg}
                    className="absolute w-1 h-1 bg-brand-kashmir/40 rounded-full"
                    style={{ transform: `rotate(${deg}deg) translateY(-48px)` }}
                  />
                ))}
              </div>
            </a>

            <div className="flex items-center gap-12">
              <a href="#" className="hover:text-brand-kashmir transition-colors flex items-center gap-2">
                Privacy Policy
                <span className="text-[7px] bg-brand-kashmir/10 text-brand-kashmir px-1.5 py-0.5 rounded-full border border-brand-kashmir/20">Dev</span>
              </a>
              <a href="#" className="hover:text-brand-kashmir transition-colors flex items-center gap-2">
                Terms of Service
                <span className="text-[7px] bg-brand-kashmir/10 text-brand-kashmir px-1.5 py-0.5 rounded-full border border-brand-kashmir/20">Dev</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Motivational Toast */}
      <AnimatePresence>
        {showMotivationalMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-6 z-[100] bg-brand-brown text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <span className="text-lg">🍰</span>
            <p className="font-bold">اغتنم الفرصة وأكمل طلبك الآن!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <AnimatePresence>
        {!isCheckoutOpen && !isCartOpen && (
          cart.length > 0 ? (
            <motion.button
              key="cart-fab"
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 50 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={() => setIsCartOpen(true)}
              className={`fixed bottom-6 right-6 z-[90] bg-brand-pink text-brand-brown p-4 rounded-full shadow-[0_10px_40px_-10px_rgba(248,200,220,0.8)] hover:scale-110 transition-all duration-300 flex items-center justify-center group ${cartShake ? 'animate-shake' : ''}`}
              title="عرض السلة"
            >
              <ShoppingCart className="w-8 h-8" />
              <span className="absolute -top-2 -right-2 bg-brand-brown text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-xl">
                {cartCount}
              </span>
            </motion.button>
          ) : (
            showWhatsApp && (
              <motion.a
                key="whatsapp-fab"
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 50 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                href="https://wa.me/201098983079"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-[90] bg-brand-brown text-white p-4 rounded-full shadow-[0_10px_40px_-10px_rgba(101,67,33,0.4)] hover:scale-110 hover:rotate-12 transition-all duration-300 flex items-center justify-center group"
                title="تواصل معنا عبر واتساب"
              >
                <span className="absolute -top-10 right-0 bg-white text-brand-brown text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  تواصل معنا الآن!
                </span>
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.392.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-5.824 4.74-10.563 10.567-10.564 5.823 0 10.564 4.745 10.564 10.568s-4.74 10.564-10.564 10.564z"/>
                </svg>
              </motion.a>
            )
          )
        )}
      </AnimatePresence>
    </div>
  );
}
