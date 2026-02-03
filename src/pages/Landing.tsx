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
    <div className="min-h-screen bg-gradient-to-br from-[#C47BE4] via-[#7132CA] to-[#5a28a0] text-white">
      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md bg-[#7132CA]/80 border-b border-purple-300/40"
        data-aos="fade-down"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#C47BE4] to-[#7132CA] rounded-lg flex items-center justify-center shadow-lg shadow-purple-400/30">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-[#C47BE4] bg-clip-text text-transparent">
              myEasyAssets
            </span>
          </div>
          <Button
            variant="outline"
            className="border-purple-400/60 bg-purple-500/20 text-white hover:bg-purple-500/40 hover:border-purple-300 transition-all"
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-73px)] flex items-center justify-center px-6 overflow-hidden">
        {/* Radial Gradient Background */}
        <div className="absolute inset-0 bg-gradient-radial from-[#C47BE4] via-[#7132CA]/80 to-[#5a28a0]" />
        {/* Purple Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C47BE4]/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7132CA]/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <h1
            className="text-5xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-white via-purple-100 to-[#C47BE4] bg-clip-text text-transparent"
            data-aos="fade-up"
          >
            Smart Management for Growing Business
          </h1>
          
          <p
            className="text-xl md:text-2xl text-purple-100/90 max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="150"
          >
            The professional way to track, maintain, and depreciate your assets.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#C47BE4] to-[#7132CA] hover:from-[#d08cf0] hover:to-[#8a4dcc] text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/40 hover:shadow-purple-400/60 transition-all"
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
      <section className="py-24 px-6 bg-gradient-to-b from-[#7132CA] to-[#5a28a0] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(113,50,202,0.2)_0%,_transparent_50%)] opacity-40" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-gradient-to-br from-[#C47BE4]/40 to-[#7132CA]/30 border border-purple-400/30 rounded-xl p-8 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-purple-400/40 hover:border-purple-300/50 hover:-translate-y-2 group cursor-pointer"
                  data-aos="fade-up"
                  data-aos-delay={feature.delay}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#C47BE4] to-[#7132CA] rounded-lg flex items-center justify-center mb-6 transition-transform duration-300 group-hover:-translate-y-1">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white transition-all duration-300 group-hover:translate-x-1">
                    {feature.title}
                  </h3>
                  <p className="text-purple-100/80 leading-relaxed transition-all duration-300 group-hover:text-white group-hover:translate-x-1">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#5a28a0] to-[#7132CA] relative overflow-hidden">
        {/* Purple Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C47BE4]/20 to-transparent blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl bg-[#7132CA]/20 rounded-full blur-3xl" />
        
        <div
          className="relative z-10 max-w-4xl mx-auto text-center space-y-8"
          data-aos="zoom-in"
        >
          <h2 className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-white via-purple-100 to-[#C47BE4] bg-clip-text text-transparent">
            Stop losing track of your assets.
          </h2>
          
          <Button
            size="lg"
            className="bg-gradient-to-r from-[#C47BE4] to-[#7132CA] hover:from-[#d08cf0] hover:to-[#8a4dcc] text-white px-12 py-7 text-xl font-semibold rounded-xl shadow-2xl shadow-purple-500/50 hover:shadow-purple-400/70 transition-all hover:scale-105"
            onClick={() => navigate('/login')}
          >
            Launch Dashboard
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-400/40 py-8 px-6 bg-[#5a28a0]">
        <div className="max-w-7xl mx-auto text-center text-purple-200/70">
          <p>&copy; 2025 AssetFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
