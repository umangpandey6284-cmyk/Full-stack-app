import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  User, 
  Settings, 
  Home, 
  Search, 
  ShoppingCart, 
  LogOut, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Package, 
  Truck, 
  CheckCircle2, 
  X,
  Menu,
  ArrowLeft,
  Image as ImageIcon,
  Filter,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface CartItem extends Product {
  quantity: number;
}

interface Order {
  id: number;
  user_id: number;
  user_name?: string;
  total: number;
  status: string;
  payment_method: string;
  address: string;
  created_at: string;
}

// --- Components ---

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 5000); // 5 seconds loading
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-200">
          <ShoppingBag className="w-12 h-12 text-white" />
        </div>
      </motion.div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">BharatShop</h1>
      <p className="text-gray-500 mb-8">Preparing your personalized shopping experience...</p>
      <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: "linear" }}
          className="h-full bg-emerald-600"
        />
      </div>
      <p className="mt-4 text-xs font-medium text-emerald-600 uppercase tracking-widest">Namaste India</p>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart }: { product: Product, onAddToCart: (p: Product) => void, key?: any }) => (
  <motion.div 
    whileTap={{ scale: 0.98 }}
    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group"
  >
    <div className="relative aspect-[3/4] overflow-hidden">
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        referrerPolicy="no-referrer"
      />
      <div className="absolute top-3 left-3">
        <span className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-700 shadow-sm">
          {product.category}
        </span>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
      <p className="text-xs text-gray-500 line-clamp-1 mb-2">{product.description}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
        <button 
          onClick={() => onAddToCart(product)}
          className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  </motion.div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'cart' | 'orders' | 'admin' | 'auth' | 'loading' | 'admin_products' | 'admin_users' | 'admin_reports' | 'order_tracking' | 'gallery' | 'admin_gallery'>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [products, setProducts] = useState<Product[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminReports, setAdminReports] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', price: 0, description: '', category: 'Clothing', stock: 10, image: 'https://picsum.photos/400/600' });

  // Auth Form State
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const [newGalleryItem, setNewGalleryItem] = useState({ image_url: '', caption: '' });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (editingProduct) {
          setEditingProduct({ ...editingProduct, image: base64String });
        } else {
          setNewProduct({ ...newProduct, image: base64String });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewGalleryItem({ ...newGalleryItem, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchGallery();
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      if (u.role === 'admin') setView('admin');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders();
      if (user.role === 'admin') fetchAdminOrders();
    }
  }, [user]);

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const fetchOrders = async () => {
    if (!user) return;
    const res = await fetch(`/api/orders/${user.id}`);
    const data = await res.json();
    setOrders(data);
  };

  const fetchAdminOrders = async () => {
    const res = await fetch('/api/admin/orders');
    const data = await res.json();
    setAdminOrders(data);
  };

  const fetchAdminUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setAdminUsers(data);
  };

  const fetchAdminReports = async () => {
    const res = await fetch('/api/admin/reports');
    const data = await res.json();
    setAdminReports(data);
  };

  const trackOrder = async (orderId: number) => {
    const res = await fetch(`/api/orders/details/${orderId}`);
    const data = await res.json();
    setSelectedOrder(data);
    setView('order_tracking');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProduct ? 'PATCH' : 'POST';
    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingProduct || newProduct)
    });
    if (res.ok) {
      fetchProducts();
      setEditingProduct(null);
      setView('admin_products');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) fetchProducts();
  };

  const fetchGallery = async () => {
    const res = await fetch('/api/gallery');
    const data = await res.json();
    setGalleryImages(data);
  };

  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryItem.image_url) return alert('Please select an image first');
    const res = await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGalleryItem)
    });
    if (res.ok) {
      fetchGallery();
      setNewGalleryItem({ image_url: '', caption: '' });
      alert('Photo posted to public gallery!');
    }
  };

  const deleteGalleryItem = async (id: number) => {
    if (!confirm('Delete this photo?')) return;
    const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
    if (res.ok) fetchGallery();
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      if (authMode === 'register') {
        setView('loading');
        // The LoadingScreen component handles the 5s delay
        const completeRegistration = () => {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
          setView('home');
        };
        // We'll pass this to LoadingScreen
        (window as any)._onLoadingComplete = completeRegistration;
      } else {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        setView(data.role === 'admin' ? 'admin' : 'home');
      }
    } else {
      alert(data.error);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  const placeOrder = async () => {
    if (!user) {
      setAuthMode('login');
      setView('auth');
      return;
    }
    if (!address.street || !address.city || !address.pincode) {
      alert("Please fill full address");
      return;
    }

    const fullAddress = `${address.street}, ${address.landmark ? address.landmark + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}`;
    
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        total: cartTotal,
        address: fullAddress,
        items: cart
      })
    });

    if (res.ok) {
      alert("Order Placed Successfully! Cash on Delivery confirmed.");
      setCart([]);
      fetchOrders();
      setView('orders');
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) fetchAdminOrders();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setView('home');
    setCart([]);
  };

  if (view === 'loading') {
    return <LoadingScreen onComplete={(window as any)._onLoadingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-bottom border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <ShoppingBag size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">BharatShop</h1>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 hidden sm:block">Hi, {user.name}</span>
              <button onClick={() => setView(user.role === 'admin' ? 'admin' : 'orders')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                {user.role === 'admin' ? <Settings size={20} /> : <User size={20} />}
              </button>
            </div>
          ) : (
            <button onClick={() => { setAuthMode('login'); setView('auth'); }} className="text-sm font-bold text-emerald-600">Login</button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Search Bar */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search products, brands..." 
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Categories */}
              <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
                {['All', 'Clothing', 'Home', 'Grocery', 'Decor'].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-5 py-2 rounded-full border text-sm font-medium transition-colors shadow-sm ${
                      selectedCategory === cat 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : 'bg-white border-gray-200 hover:border-emerald-500 hover:text-emerald-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                ))}
              </div>
            </motion.div>
          )}

          {view === 'gallery' && (
            <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setView('home')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft size={20}/></button>
                <h2 className="text-2xl font-bold">Public Gallery</h2>
              </div>

              {/* Public Upload Form */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-sm">Share your style with everyone!</h3>
                <form onSubmit={handleAddGalleryItem} className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
                        {newGalleryItem.image_url ? (
                          <img src={newGalleryItem.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="text-gray-300" size={20} />
                        )}
                      </div>
                      <label className="flex-1 bg-emerald-50 text-emerald-600 py-3 rounded-xl border border-emerald-100 flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-100 transition-colors">
                        <Camera size={18} />
                        <span className="text-sm font-bold">Select / Take Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleGalleryImageUpload} 
                        />
                      </label>
                    </div>
                  </div>
                  <input 
                    placeholder="Write a caption..." 
                    className="w-full bg-gray-50 p-3 rounded-xl text-sm" 
                    value={newGalleryItem.caption} 
                    onChange={e => setNewGalleryItem({...newGalleryItem, caption: e.target.value})} 
                  />
                  <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">Post to Gallery</button>
                </form>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {galleryImages.map(img => (
                  <div key={img.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative">
                    <img src={img.image_url} className="w-full aspect-video object-cover" referrerPolicy="no-referrer" />
                    {img.caption && <div className="p-4"><p className="text-sm font-medium text-gray-700">{img.caption}</p></div>}
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => deleteGalleryItem(img.id)}
                        className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-sm text-white p-2 rounded-full shadow-lg"
                      >
                        <Trash2 size={16}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100"
            >
              <h2 className="text-2xl font-bold mb-2">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <p className="text-gray-500 mb-8 text-sm">Join BharatShop for the best Indian products.</p>
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Password</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Register Now')}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-gray-500">
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="ml-1 text-emerald-600 font-bold"
                >
                  {authMode === 'login' ? 'Register' : 'Login'}
                </button>
              </p>
            </motion.div>
          )}

          {view === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setView('home')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft size={20}/></button>
                <h2 className="text-2xl font-bold">Your Cart</h2>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <ShoppingCart className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500 font-medium">Your cart is empty</p>
                  <button onClick={() => setView('home')} className="mt-4 text-emerald-600 font-bold">Start Shopping</button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="bg-white p-4 rounded-2xl flex gap-4 shadow-sm border border-gray-100">
                        <img src={item.image} className="w-20 h-20 object-cover rounded-xl" referrerPolicy="no-referrer" />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{item.name}</h4>
                          <p className="text-emerald-600 font-bold">₹{item.price}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                            <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-1"><Trash2 size={16}/></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-bold text-lg">Delivery Address</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="House/Street" className="col-span-2 bg-gray-50 p-3 rounded-xl text-sm" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} />
                      <input placeholder="Landmark" className="col-span-2 bg-gray-50 p-3 rounded-xl text-sm" value={address.landmark} onChange={e => setAddress({...address, landmark: e.target.value})} />
                      <input placeholder="City" className="bg-gray-50 p-3 rounded-xl text-sm" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} />
                      <input placeholder="State" className="bg-gray-50 p-3 rounded-xl text-sm" value={address.state} onChange={e => setAddress({...address, state: e.target.value})} />
                      <input placeholder="Pincode" className="col-span-2 bg-gray-50 p-3 rounded-xl text-sm" value={address.pincode} onChange={e => setAddress({...address, pincode: e.target.value})} />
                    </div>
                  </div>

                  <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <p className="text-emerald-300 text-xs uppercase font-bold tracking-widest">Total Amount</p>
                        <p className="text-3xl font-bold">₹{cartTotal}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-300 text-xs uppercase font-bold tracking-widest">Payment</p>
                        <p className="font-bold">Cash on Delivery</p>
                      </div>
                    </div>
                    <button 
                      onClick={placeOrder}
                      className="w-full bg-white text-emerald-900 font-bold py-4 rounded-xl hover:bg-emerald-50 transition-colors"
                    >
                      Place Order (COD)
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {view === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Orders</h2>
                <button onClick={logout} className="text-red-500 flex items-center gap-1 text-sm font-bold"><LogOut size={16}/> Logout</button>
              </div>

              {orders.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No orders yet.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase">Order #{order.id}</p>
                          <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 
                          order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Delivery to:</p>
                          <p className="text-xs font-medium text-gray-600 line-clamp-1 max-w-[150px]">{order.address}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-lg font-bold">₹{order.total}</p>
                          <button 
                            onClick={() => trackOrder(order.id)}
                            className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider border border-emerald-200 px-2 py-1 rounded-lg"
                          >
                            Track Order
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'order_tracking' && selectedOrder && (
            <motion.div
              key="order_tracking"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <button onClick={() => setView('orders')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft size={20}/></button>
                <h2 className="text-2xl font-bold">Track Order #{selectedOrder.id}</h2>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                  <div className={`relative ${['pending', 'shipped', 'delivered'].includes(selectedOrder.status) ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <div className={`absolute -left-[27px] w-4 h-4 rounded-full border-4 border-white shadow-sm ${['pending', 'shipped', 'delivered'].includes(selectedOrder.status) ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                    <p className="font-bold text-sm">Order Placed</p>
                    <p className="text-[10px] opacity-70">We have received your order</p>
                  </div>
                  <div className={`relative ${['shipped', 'delivered'].includes(selectedOrder.status) ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <div className={`absolute -left-[27px] w-4 h-4 rounded-full border-4 border-white shadow-sm ${['shipped', 'delivered'].includes(selectedOrder.status) ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                    <p className="font-bold text-sm">Shipped</p>
                    <p className="text-[10px] opacity-70">Your order is on the way</p>
                  </div>
                  <div className={`relative ${selectedOrder.status === 'delivered' ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <div className={`absolute -left-[27px] w-4 h-4 rounded-full border-4 border-white shadow-sm ${selectedOrder.status === 'delivered' ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                    <p className="font-bold text-sm">Delivered</p>
                    <p className="text-[10px] opacity-70">Order has been delivered</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img src={item.image} className="w-10 h-10 object-cover rounded-lg" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'admin_gallery' && (
            <motion.div key="admin_gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setView('admin')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft size={20}/></button>
                <h2 className="text-2xl font-bold">Gallery Management</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {galleryImages.map(img => (
                  <div key={img.id} className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <img src={img.image_url} className="w-full aspect-square object-cover" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => deleteGalleryItem(img.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'admin_products' && (
            <motion.div key="admin_products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setView('admin')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft size={20}/></button>
                  <h2 className="text-2xl font-bold">Products</h2>
                </div>
                <button onClick={() => { setEditingProduct(null); setView('admin_products'); /* Toggle form? No, let's use a modal-like view */ }} className="bg-emerald-600 text-white p-2 rounded-xl"><Plus size={20}/></button>
              </div>

              <div className="space-y-4">
                {products.map(p => (
                  <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                    <img src={p.image} className="w-16 h-16 object-cover rounded-xl" referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <h4 className="font-bold">{p.name}</h4>
                      <p className="text-xs text-gray-500">Stock: {p.stock} | ₹{p.price}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => { setEditingProduct(p); }} className="text-blue-500"><Settings size={18}/></button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-500"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>

              {(editingProduct || view === 'admin_products') && (
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 space-y-4">
                  <h3 className="font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                  <form onSubmit={handleSaveProduct} className="space-y-3">
                    <input 
                      placeholder="Name" 
                      className="w-full bg-gray-50 p-3 rounded-xl text-sm" 
                      value={editingProduct ? editingProduct.name : newProduct.name} 
                      onChange={e => editingProduct ? setEditingProduct({...editingProduct, name: e.target.value}) : setNewProduct({...newProduct, name: e.target.value})} 
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="number" 
                        placeholder="Price" 
                        className="bg-gray-50 p-3 rounded-xl text-sm" 
                        value={editingProduct ? editingProduct.price : newProduct.price} 
                        onChange={e => editingProduct ? setEditingProduct({...editingProduct, price: Number(e.target.value)}) : setNewProduct({...newProduct, price: Number(e.target.value)})} 
                      />
                      <input 
                        type="number" 
                        placeholder="Stock" 
                        className="bg-gray-50 p-3 rounded-xl text-sm" 
                        value={editingProduct ? editingProduct.stock : newProduct.stock} 
                        onChange={e => editingProduct ? setEditingProduct({...editingProduct, stock: Number(e.target.value)}) : setNewProduct({...newProduct, stock: Number(e.target.value)})} 
                      />
                      <select 
                        className="col-span-2 bg-gray-50 p-3 rounded-xl text-sm"
                        value={editingProduct ? editingProduct.category : newProduct.category}
                        onChange={e => editingProduct ? setEditingProduct({...editingProduct, category: e.target.value}) : setNewProduct({...newProduct, category: e.target.value})}
                      >
                        {['Clothing', 'Home', 'Grocery', 'Decor'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <textarea 
                      placeholder="Description" 
                      className="w-full bg-gray-50 p-3 rounded-xl text-sm" 
                      value={editingProduct ? editingProduct.description : newProduct.description} 
                      onChange={e => editingProduct ? setEditingProduct({...editingProduct, description: e.target.value}) : setNewProduct({...newProduct, description: e.target.value})} 
                    />
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase ml-1">Product Image</label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
                          {(editingProduct?.image || newProduct.image) ? (
                            <img 
                              src={editingProduct ? editingProduct.image : newProduct.image} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <ImageIcon className="text-gray-300" size={24} />
                          )}
                        </div>
                        <label className="flex-1 bg-emerald-50 text-emerald-600 py-3 rounded-xl border border-emerald-100 flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-100 transition-colors">
                          <Camera size={18} />
                          <span className="text-sm font-bold">Upload / Capture</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            className="hidden" 
                            onChange={handleImageUpload} 
                          />
                        </label>
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl">Save Product</button>
                    {editingProduct && <button type="button" onClick={() => setEditingProduct(null)} className="w-full text-gray-400 text-sm">Cancel</button>}
                  </form>
                </div>
              )}
            </motion.div>
          )}

          {view === 'admin_users' && (
            <motion.div key="admin_users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setView('admin')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft size={20}/></button>
                <h2 className="text-2xl font-bold">Customers</h2>
              </div>
              <div className="space-y-3">
                {adminUsers.map(u => (
                  <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="font-bold">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'admin_reports' && adminReports && (
            <motion.div key="admin_reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setView('admin')} className="p-2 bg-white rounded-full shadow-sm"><ArrowLeft size={20}/></button>
                <h2 className="text-2xl font-bold">Sales Reports</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600">₹{adminReports.totalRevenue}</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
                  <p className="text-2xl font-bold">{adminReports.totalOrders}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold mb-4">Top Selling Products</h3>
                <div className="space-y-4">
                  {adminReports.topProducts.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{p.name}</span>
                      <span className="font-bold">{p.sold} sold</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          {view === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                <button onClick={logout} className="text-red-500 flex items-center gap-1 text-sm font-bold"><LogOut size={16}/> Logout</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { fetchAdminReports(); setView('admin_reports'); }} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><ChevronRight size={20}/></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Reports</span>
                </button>
                <button onClick={() => setView('admin_products')} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Package size={20}/></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Products</span>
                </button>
                <button onClick={() => { fetchAdminUsers(); setView('admin_users'); }} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><User size={20}/></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Users</span>
                </button>
                <button onClick={() => setView('admin_gallery')} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center"><ImageIcon size={20}/></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Gallery</span>
                </button>
                <button onClick={() => setView('admin')} className="bg-emerald-600 p-6 rounded-3xl shadow-sm border border-emerald-500 flex flex-col items-center gap-2 text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Truck size={20}/></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Orders</span>
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2"><Truck size={20}/> Recent Orders</h3>
                {adminOrders.map(order => (
                  <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">#{order.id} by {order.user_name}</span>
                      <span className="font-bold text-emerald-600">₹{order.total}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">{order.address}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                        className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold"
                      >
                        Mark Shipped
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-lg text-xs font-bold"
                      >
                        Mark Delivered
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-6 py-4 z-40">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <button 
            onClick={() => setView('home')}
            className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <Home size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </button>
          <button 
            onClick={() => setView('gallery')}
            className={`flex flex-col items-center gap-1 ${view === 'gallery' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <ImageIcon size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Gallery</span>
          </button>
          <button 
            onClick={() => setView('cart')}
            className={`flex flex-col items-center gap-1 relative ${view === 'cart' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <ShoppingCart size={24} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider">Cart</span>
          </button>
          <button 
            onClick={() => {
              if (!user) { setAuthMode('login'); setView('auth'); }
              else setView(user.role === 'admin' ? 'admin' : 'orders');
            }}
            className={`flex flex-col items-center gap-1 ${['orders', 'admin', 'auth'].includes(view) ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            {user?.role === 'admin' ? <Settings size={24} /> : <User size={24} />}
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {user?.role === 'admin' ? 'Admin' : 'Profile'}
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
