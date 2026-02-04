import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { MapPin, TrendingDown, Bell } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Initialize AOS with professional SaaS-style settings
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-cubic',
      offset: 50,
      disable: false,
    });
  }, []);

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: MapPin,
      title: 'Real-time Tracking',
      description: 'Monitor your assets in real-time with precise location tracking and status updates.',
      delay: 0,
    },
    {
      icon: TrendingDown,
      title: 'Depreciation Engine',
      description: 'Automatically calculate asset depreciation with customizable methods and schedules.',
      delay: 150,
    },
    {
      icon: Bell,
      title: 'Maintainance Alerts',
      description: 'Never miss maintainance schedules with smart notifications and reminders.',
      delay: 300,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C8AAAA] via-[#574964] to-[#3a3042] text-gray-800">
      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md bg-[#574964] border-b border-stone-400/40"
        data-aos="fade-down"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#C8AAAA] to-[#574964] rounded-lg flex items-center justify-center shadow-lg shadow-stone-400/30">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-2xl font-bold text-stone-100">
              myEasyAssets
            </span>
          </div>
          <Button
            variant="outline"
            className="border-stone-300 bg-stone-200/20 text-stone-100 hover:bg-stone-200/40 hover:border-stone-200 transition-all"
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-73px)] flex items-center justify-center px-6 overflow-hidden">
        {/* Radial Gradient Background */}
        <div className="absolute inset-0 bg-gradient-radial from-[#C8AAAA] via-[#574964]/80 to-[#3a3042]" />
        {/* Purple Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C8AAAA]/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#574964]/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <h1
            className="text-5xl md:text-7xl font-bold leading-tight text-stone-800"
            data-aos="fade-up"
          >
            Smart Management for Growing Business
          </h1>
          
          <p
            className="text-xl md:text-2xl text-stone-700/90 max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="150"
          >
            The professional way to track, maintain, and depreciate your assets.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#C8AAAA] to-[#574964] hover:from-[#d4b9b9] hover:to-[#6a5a7a] text-stone-800 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-stone-400/40 hover:shadow-stone-500/50 transition-all"
              onClick={() => navigate('/login')}
              data-aos="zoom-in"
              data-aos-delay="300"
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#574964] to-[#3a3042] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(87,73,100,0.3)_0%,_transparent_50%)] opacity-50" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-gradient-to-br from-[#C8AAAA]/50 to-[#574964]/40 border border-stone-400/40 rounded-xl p-8 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-stone-400/50 hover:border-stone-500/60 hover:-translate-y-2 group cursor-pointer"
                  data-aos="fade-up"
                  data-aos-delay={feature.delay}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#C8AAAA] to-[#574964] rounded-lg flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-1">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-stone-800 transition-all duration-300 group-hover:translate-x-1">
                    {feature.title}
                  </h3>
                  <p className="text-stone-200/90 leading-relaxed transition-all duration-300 group-hover:text-stone-100 group-hover:translate-x-1">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#3a3042] to-[#574964] relative overflow-hidden">
        {/* Purple Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C8AAAA]/30 to-transparent blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl bg-[#574964]/30 rounded-full blur-3xl" />
        
        <div
          className="relative z-10 max-w-4xl mx-auto text-center space-y-8"
          data-aos="zoom-in"
        >
          <h2 className="text-4xl md:text-5xl font-bold leading-tight text-stone-800">
            Stop losing track of your assets.
          </h2>
          
          <Button
            size="lg"
            className="bg-gradient-to-r from-[#C8AAAA] to-[#574964] hover:from-[#d4b9b9] hover:to-[#6a5a7a] text-stone-800 px-12 py-7 text-xl font-semibold rounded-xl shadow-2xl shadow-stone-400/50 hover:shadow-stone-500/60 transition-all hover:scale-105"
            onClick={() => navigate('/login')}
          >
            Launch Dashboard
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-400/40 py-8 px-6 bg-[#574964]">
        <div className="max-w-7xl mx-auto text-center text-stone-200/70">
          <p>&copy; 2025 AssetFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
