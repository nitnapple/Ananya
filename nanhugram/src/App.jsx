import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Search, 
  PlusSquare, 
  Heart, 
  User, 
  MoreHorizontal, 
  MessageCircle, 
  Send, 
  Bookmark, 
  Grid,
  Settings,
  Camera,
  Compass,
  PartyPopper,
  Gift
} from 'lucide-react';

/* --- Confetti Component --- */

const Confetti = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const colors = ['#FFC0CB', '#FF69B4', '#FFD700', '#ADFF2F', '#00BFFF', '#9370DB'];

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.size = Math.random() * 8 + 4;
        this.speedY = Math.random() * 3 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 5 - 2.5;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        
        if (this.y > canvas.height) {
          this.y = -20;
          this.x = Math.random() * canvas.width;
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
      }
    }

    // Initialize particles
    for (let i = 0; i < 150; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup after 6 seconds to save resources, or keep it running if you want constant party
    const timeoutId = setTimeout(() => {
        cancelAnimationFrame(animationFrameId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 6000);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[100]" 
    />
  );
};

/* --- Data & Constants --- */

const CURRENT_USER = {
  id: 'me',
  username: 'alex.design',
  name: 'Alex Designer',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces',
  bio: '🎂 It\'s my Birthday! \nDesigned in California.',
  posts: 143,
  followers: '12.4K',
  following: 254
};

const STORIES = [
  { id: 1, username: 'Day 1', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150?fit=crop&crop=faces', hasStory: true },
  { id: 2, username: 'Day 2', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150?fit=crop&crop=faces', hasStory: true },
  { id: 3, username: 'Day 3', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150?fit=crop&crop=faces', hasStory: true },
  { id: 4, username: 'Day 4', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150?fit=crop&crop=faces', hasStory: true },
  { id: 5, username: 'Day 5', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150?fit=crop&crop=faces', hasStory: true },
];

const WISHES = [
  "📸 Every photograph feels warmer when seen through Ananya’s lens.",
  "🌸 Calm seems to recognize itself in Ananya.",
  "💫 You can sense starlight in the quiet confidence of Ananya.",
  "🦢 Grace appears untrained, yet perfected, in Ananya.",
  "🎂 Today feels ceremonial because it belongs to Ananya.",
  "🌙 The night softens when Ananya is near.",
  "📷 Beauty behaves differently under Ananya’s gaze.",
  "📸 The world is more beautiful when seen through your lens.",
  "💖 Your chubby cheeks are national treasures, Ananya!",
  "🏊‍♀️ You don’t swim through water, you glide through stardust.",
  "🌺 Your grace puts royal gardens to shame.",
  "🎂 Happy Birthday to the empress of elegance!",
  "🌊 Waves bow in respect when you dive in.",
  "💫 Every star wishes it could shine like your eyes.",
  "👑 Born to rule hearts, Happy Birthday Queen Ananya!",
  "🧁 You're the cupcake this world needed.",
  "🎈 May your life be filled with gallery-worthy moments.",
  "📷 Ananya, even still frames breathe with you.",
  "🏊‍♀️ Ananya, flow feels loyal to you.",
  "💎 Ananya, you define subtle luxury.",
  "🎈 Ananya, lightness feels deserved with you.",
  "🌺 Ananya, blooming feels dignified near you.",
  "🧁 Ananya, sweetness feels intentional with you.",
  "✨ Ananya, you glow with composure.",
  "💎 Worth feels quieter, yet deeper, around Ananya.",
  "👑 Ananya, royalty recognizes itself the moment you arrive.",
  "🫅 Ananya, sovereignty lives naturally in your presence."
];

const POSTS = [
  {
    id: 100,
    user: { username: 'alex.design', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150?fit=crop&crop=faces' },
    image: 'https://images.unsplash.com/photo-1530103862676-de3c9da59af7?w=800&auto=format&fit=crop&q=80',
    likes: 4521,
    caption: 'Another year around the sun! ☀️🎈 Thanks for all the wishes.',
    time: 'Just now',
    location: 'Birthday Party 🎉'
  },
  {
    id: 101,
    user: { username: 'jess_art', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150?fit=crop&crop=faces' },
    image: 'https://images.unsplash.com/photo-1515405295579-ba7f9f92f413?w=800&auto=format&fit=crop&q=80',
    likes: 1240,
    caption: 'Simplicity is the ultimate sophistication. 🌿 #minimal',
    time: '2h ago',
    location: 'San Francisco, CA'
  },
  {
    id: 102,
    user: { username: 'mike_t', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150?fit=crop&crop=faces' },
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    likes: 856,
    caption: 'Weekends are for exploring. Found this gem today.',
    time: '5h ago',
    location: 'Big Sur'
  }
];

const PROFILE_IMAGES = [
  'https://images.unsplash.com/photo-1530103862676-de3c9da59af7?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600607686527-6fb886090705?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1501854140884-074cf2b2c3af?w=400&h=400&fit=crop',
];

/* --- Components --- */

const Button = ({ children, onClick, className = '', variant = 'primary' }) => {
  const baseStyle = "px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 active:scale-95";
  const variants = {
    primary: "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-pink-500/30 shadow-md",
    secondary: "bg-white/80 backdrop-blur-md text-gray-900 hover:bg-white border border-white/60",
    ghost: "bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Avatar = ({ src, size = 'md', hasRing = false, isBirthday = false }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`relative ${sizes[size]} rounded-full flex-shrink-0 cursor-pointer group`}>
      {hasRing && (
        <div className={`absolute -inset-1 rounded-full opacity-90 group-hover:opacity-100 transition-opacity p-[2px] ${isBirthday ? 'bg-gradient-to-tr from-yellow-300 via-pink-500 to-purple-500 animate-spin-slow' : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'}`}>
          <div className="w-full h-full bg-white rounded-full"></div>
        </div>
      )}
      {isBirthday && (
        <div className="absolute -top-3 -right-2 z-10 bg-white rounded-full p-1 shadow-sm border border-pink-100 rotate-12">
            <span className="text-lg">👑</span>
        </div>
      )}
      <img 
        src={src} 
        alt="Avatar" 
        className={`relative w-full h-full object-cover rounded-full border-2 border-white shadow-sm transition-transform duration-300 ${hasRing ? 'p-[2px]' : ''}`} 
      />
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-4 w-full p-3 rounded-2xl transition-all duration-300 group ${
      active 
        ? 'bg-white/90 text-pink-600 font-bold shadow-sm backdrop-blur-sm ring-1 ring-pink-100' 
        : 'text-gray-500 hover:bg-pink-50/50 hover:text-pink-900'
    }`}
  >
    <Icon 
      size={26} 
      strokeWidth={active ? 2.5 : 2} 
      className={`transition-transform duration-300 group-hover:scale-110 ${active ? 'scale-105' : ''}`}
    />
    <span className="text-base tracking-tight hidden lg:block">{label}</span>
  </button>
);

const StoryBubble = ({ username, avatar }) => (
  <div className="flex flex-col items-center space-y-2 cursor-pointer group">
    <div className="relative">
      <div className="absolute -inset-0.5 bg-gradient-to-tr from-pink-300 via-purple-300 to-indigo-400 rounded-full opacity-80 group-hover:opacity-100 transition-opacity blur-[1px]"></div>
      <img 
        src={avatar} 
        alt={username} 
        className="relative w-16 h-16 rounded-full border-[3px] border-white object-cover shadow-sm transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <span className="text-xs font-medium text-gray-600 tracking-tight">{username}</span>
  </div>
);

const Post = ({ post }) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/60 overflow-hidden mb-8 transition-all hover:shadow-lg hover:shadow-pink-500/5">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3 cursor-pointer">
          <Avatar src={post.user.avatar} size="md" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">{post.user.username}</h3>
            {post.location && (
              <p className="text-xs text-gray-500 font-medium">{post.location}</p>
            )}
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-900 transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Image */}
      <div className="relative aspect-square w-full bg-gray-100 overflow-hidden group">
        <img 
          src={post.image} 
          alt="Post" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
      </div>

      {/* Actions */}
      <div className="p-4">
        {/* Caption */}
        <div className="space-y-1">
          <p className="text-sm text-gray-800 leading-relaxed">
            <span className="font-bold mr-2">{post.user.username}</span>
            {post.caption}
          </p>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide pt-1">{post.time}</p>
        </div>
      </div>
    </div>
  );
};

const ProfileView = () => (
  <div className="max-w-4xl mx-auto pt-4 pb-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-12 mb-12">
      <div className="mb-6 md:mb-0 relative">
        <Avatar src={CURRENT_USER.avatar} size="xl" hasRing={true} isBirthday={true} />
      </div>
      
      <div className="flex-1 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center md:items-baseline gap-4 mb-4">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{CURRENT_USER.username}</h2>
          <div className="flex gap-2">
            <Button variant="secondary">Edit Profile</Button>
            <Button variant="secondary"><Settings size={18} /></Button>
          </div>
        </div>

        <div className="flex justify-center md:justify-start space-x-8 mb-4">
          <div className="text-center md:text-left">
            <span className="block font-bold text-gray-900">{CURRENT_USER.posts}</span>
            <span className="text-sm text-gray-500">posts</span>
          </div>
          <div className="text-center md:text-left">
            <span className="block font-bold text-gray-900">{CURRENT_USER.followers}</span>
            <span className="text-sm text-gray-500">followers</span>
          </div>
          <div className="text-center md:text-left">
            <span className="block font-bold text-gray-900">{CURRENT_USER.following}</span>
            <span className="text-sm text-gray-500">following</span>
          </div>
        </div>

        <div className="max-w-md mx-auto md:mx-0">
          <p className="font-semibold text-gray-900">{CURRENT_USER.name}</p>
          <p className="text-gray-600 whitespace-pre-line text-sm leading-relaxed">{CURRENT_USER.bio}</p>
        </div>
      </div>
    </div>

    {/* Profile Grid Tabs */}
    <div className="flex justify-center border-t border-gray-200 mb-6">
      <button className="flex items-center space-x-2 border-t border-black -mt-px pt-3 px-4 text-xs font-bold tracking-widest uppercase">
        <Grid size={14} /> <span>Posts</span>
      </button>
      <button className="flex items-center space-x-2 border-t border-transparent -mt-px pt-3 px-4 text-xs font-medium text-gray-500 tracking-widest uppercase hover:text-gray-900 transition-colors">
        <Bookmark size={14} /> <span>Saved</span>
      </button>
    </div>

    {/* Grid */}
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      {PROFILE_IMAGES.map((img, idx) => (
        <div key={idx} className="relative aspect-square group overflow-hidden rounded-xl bg-white cursor-pointer ring-4 ring-transparent hover:ring-pink-200 transition-all">
          <img 
            src={img} 
            alt={`Post ${idx}`} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
             <Heart className="text-white fill-white" size={24} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const HomeView = () => {
  const [currentWish, setCurrentWish] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  const handleViewWishes = () => {
    let randomWish;
    // Try to get a new wish that isn't the same as the current one
    do {
      randomWish = WISHES[Math.floor(Math.random() * WISHES.length)];
    } while (randomWish === currentWish && WISHES.length > 1);

    setCurrentWish(randomWish);
    setAnimKey(prev => prev + 1);
  };

  const customStyles = `
    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.9) translateY(5px); filter: blur(2px); }
      100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
    }
    @keyframes iconSpin {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.2); }
      100% { transform: rotate(360deg) scale(1); }
    }
    .animate-wish-text {
      animation: popIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }
    .animate-gift-icon {
      animation: iconSpin 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
  `;

  return (
    <div className="max-w-xl mx-auto pt-4 pb-20 animate-in fade-in duration-500">
      <style>{customStyles}</style>
      {/* Birthday Banner */}
      <div className="mx-4 mb-6 p-4 rounded-2xl bg-gradient-to-r from-pink-100 to-purple-100 border border-white/50 shadow-sm flex items-center justify-between gap-3 overflow-hidden relative transition-all duration-300 hover:shadow-md">
        
        {/* Animated background flash */}
        {animKey > 0 && (
           <div key={`flash-${animKey}`} className="absolute inset-0 bg-white/40 animate-out fade-out duration-700 pointer-events-none"></div>
        )}

        <div className="flex items-center space-x-3 flex-1 min-w-0 z-10">
          <div 
            key={`icon-${animKey}`}
            className={`bg-white p-2 rounded-full shadow-sm text-pink-500 flex-shrink-0 ${animKey > 0 ? 'animate-gift-icon' : ''}`}
          >
            <Gift size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm">It's your special day!</h3>
            <div className="relative min-h-[1.5em] flex items-center">
                <p 
                  key={`text-${animKey}`}
                  className="text-xs text-gray-600 break-words whitespace-normal leading-relaxed animate-wish-text"
                >
                  {currentWish || "Enjoy the confetti and cake 🎂"}
                </p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleViewWishes}
          className="text-xs font-bold bg-white text-pink-500 px-3 py-1.5 rounded-full shadow-sm active:scale-90 transition-all hover:bg-pink-50 hover:shadow-pink-200/50 flex-shrink-0 z-10"
        >
          {currentWish ? "Next Wish" : "View Wishes"}
        </button>
      </div>

      {/* Stories */}
      <div className="flex space-x-6 overflow-x-auto pb-8 pt-2 px-4 no-scrollbar mask-gradient">
        <div className="flex flex-col items-center space-y-2 cursor-pointer">
          <div className="relative">
            <img 
              src={CURRENT_USER.avatar} 
              alt="My Story" 
              className="w-16 h-16 rounded-full border-[3px] border-white shadow-sm object-cover"
            />
            <div className="absolute bottom-0 right-0 bg-pink-500 text-white rounded-full p-1 border-2 border-white shadow-sm">
              <PlusSquare size={12} strokeWidth={4} />
            </div>
          </div>
          <span className="text-xs font-medium text-gray-500">Your Story</span>
        </div>
        {STORIES.map(story => (
          <StoryBubble key={story.id} {...story} />
        ))}
      </div>

      {/* Posts */}
      <div className="px-4 md:px-0">
        {POSTS.map(post => (
          <Post key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

/* --- Main Layout --- */

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeView />;
      case 'profile': return <ProfileView />;
      default: return <div className="flex items-center justify-center h-full text-gray-400 font-medium">Coming Soon</div>;
    }
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="flex h-screen bg-[#FFF0F5] text-gray-900 font-sans antialiased overflow-hidden selection:bg-pink-200 selection:text-pink-900">
      <Confetti />
      
      {/* Global Header */}
      <div className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-md border-b border-pink-100 z-50 flex items-center justify-between px-4">
        {/* Placeholder for left balance */}
        <div className="w-12"></div>
        
        {/* Centered Title & Date */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center h-full">
           <div className="flex items-center gap-2">
             <PartyPopper size={20} className="text-pink-500"/>
             <h1 className="text-xl font-bold tracking-tight text-pink-600 leading-none">NanhuGram</h1>
           </div>
           <p className="text-[10px] font-bold text-pink-400/80 tracking-wide uppercase mt-0.5">
             {formattedDate} • {formattedTime}
           </p>
        </div>
        
        {/* Right Side Empty */}
        <div className="w-12"></div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative scroll-smooth no-scrollbar pt-24 md:px-6 md:pb-6 md:pt-28">
         {/* Background Decor */}
         <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-pink-300/30 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-multiply"></div>
         <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-yellow-200/40 rounded-full blur-[100px] pointer-events-none -z-10 mix-blend-multiply"></div>
         
         {renderContent()}
      </main>

    </div>
  );
}
