import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Logo = () => (
  <div className="flex items-center justify-center w-[84px] h-9 px-2">
    <svg 
      width="70" 
      height="36" 
      viewBox="0 0 71 36" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="w-[70px] h-9 flex-shrink-0"
    >
      <g clipPath="url(#clip0_9206_9)">
        <path d="M67.9112 17.0816L67.8741 17.1188C68.1343 16.4126 68.6546 16.1524 69.1006 16.1524C69.7325 16.1524 70.29 16.6356 70.29 17.3418C70.29 17.4905 70.29 17.6763 70.2157 17.8993C68.9148 21.2445 66.1643 22.9542 63.4882 23.2144C62.2617 25.2958 60.2546 26.8197 57.3926 26.8197C53.3041 26.8197 51.4829 23.5861 51.4829 20.0551C51.4829 15.7064 54.2334 10.8745 58.8422 10.8745C59.8457 10.8745 60.7006 11.0976 61.4068 11.3949C63.4882 12.1754 64.8263 14.8887 64.8263 17.7878C64.8263 18.717 64.7519 19.6462 64.5289 20.5383C65.9042 20.0551 67.205 18.94 67.9112 17.0816ZM60.1431 13.9223V13.8852C59.3254 13.8852 58.8422 14.963 58.8422 16.2639C58.8422 18.1595 59.8829 19.9064 61.5183 20.5383C61.7785 19.7206 61.89 18.7914 61.89 17.7135C61.89 15.6321 61.2581 13.9223 60.1431 13.9223ZM57.4298 24.1064C58.4705 24.1064 59.5112 23.6604 60.3289 22.7312C57.913 21.6533 56.3891 19.1259 56.3891 16.7099C56.3891 15.8922 56.5378 15.0374 56.7608 14.294C55.2741 15.5206 54.4192 17.9365 54.4192 20.0551C54.4192 22.8055 55.7201 24.1064 57.4298 24.1064Z" fill="white"/>
        <path d="M52.0568 17.0813L52.0196 17.1185C52.2798 16.4123 52.7258 16.115 53.1718 16.115C53.8037 16.115 54.4355 16.6725 54.4355 17.3787C54.4355 17.5645 54.3984 17.7132 54.324 17.899C52.8745 21.43 50.7187 25.5557 47.2621 27.9716L47.1878 28.715C46.7789 33.1752 44.5117 35.9999 41.6497 35.9999C39.4939 35.9999 38.2302 34.5132 38.2302 32.7663C38.2302 29.607 41.4638 28.4548 44.4745 26.5221C44.5488 25.7415 44.586 24.8495 44.6231 23.8459C43.1364 25.4813 41.5382 26.1504 40.1258 26.1504C37.301 26.1504 34.9966 23.8459 34.9966 20.315C34.9966 14.8884 38.5647 11.3203 42.5417 11.3203H42.5789C45.2922 11.3203 48.1913 12.7698 48.1913 15.3716C48.1913 16.2265 47.8196 20.8725 47.5223 24.4778C49.5293 22.5822 51.2019 19.4973 52.0568 17.0813ZM40.5346 23.4743C41.9099 23.4743 43.7683 22.6194 44.9205 18.4194C45.1063 17.4902 45.2178 16.6725 45.1807 15.7061C44.9577 14.7026 44.1028 14.1079 42.8762 14.1079C40.3488 14.1079 37.9329 16.5238 37.9329 20.2035C37.9329 22.4336 38.9736 23.4743 40.5346 23.4743ZM41.947 33.2867H41.9842C42.7647 33.2867 43.6196 32.7663 44.1771 29.4212C42.5417 30.3875 41.0178 31.3539 41.0178 32.5061C41.0178 32.9893 41.3895 33.2867 41.947 33.2867Z" fill="white"/>
        <path d="M35.6485 17.0816L35.6114 17.1188C35.8715 16.4126 36.3919 16.1524 36.8379 16.1524C37.4698 16.1524 38.0273 16.6356 38.0273 17.3418C38.0273 17.4905 38.0273 17.6763 37.953 17.8993C36.6521 21.2445 33.9016 22.9542 31.2255 23.2144C29.999 25.2958 27.9919 26.8197 25.1299 26.8197C21.0414 26.8197 19.2202 23.5861 19.2202 20.0551C19.2202 15.7064 21.9706 10.8745 26.5795 10.8745C27.583 10.8745 28.4379 11.0976 29.1441 11.3949C31.2255 12.1754 32.5636 14.8887 32.5636 17.7878C32.5636 18.717 32.4892 19.6462 32.2662 20.5383C33.6415 20.0551 34.9423 18.94 35.6485 17.0816ZM27.8804 13.9223V13.8852C27.0627 13.8852 26.5795 14.963 26.5795 16.2639C26.5795 18.1595 27.6202 19.9064 29.2556 20.5383C29.5158 19.7206 29.6273 18.7914 29.6273 17.7135C29.6273 15.6321 28.9954 13.9223 27.8804 13.9223ZM25.1671 24.1064C26.2078 24.1064 27.2485 23.6604 28.0662 22.7312C25.6503 21.6533 24.1264 19.1259 24.1264 16.7099C24.1264 15.8922 24.2751 15.0374 24.4981 14.294C23.0114 15.5206 22.1565 17.9365 22.1565 20.0551C22.1565 22.8055 23.4574 24.1064 25.1671 24.1064Z" fill="white"/>
        <path d="M21.1094 15.9085C20.589 15.9085 20.143 16.1687 19.8456 16.8749C18.8793 19.328 16.8721 23.4909 14.8278 23.4909C13.5406 23.4909 12.5445 23.1998 11.5379 22.9056C10.51 22.6052 9.47117 22.3015 8.10028 22.3015C7.61708 22.3015 6.94804 22.3759 6.31617 22.4874C8.21975 19.8916 8.93089 16.7479 9.61997 10.8056C8.32251 10.723 7.2671 10.4833 6.49782 10.2412C5.67617 17.7777 4.74311 20.6513 1.33554 23.4909C0.889514 23.8626 0.666504 24.383 0.666504 24.9034C0.666504 25.7211 1.37272 26.4273 2.26477 26.4273C2.56212 26.4273 2.89663 26.3158 3.23115 26.1671C5.12677 25.3122 6.279 25.0892 7.69142 25.0892C8.58959 25.0892 9.66433 25.3461 10.815 25.621C12.1404 25.9378 13.5665 26.2786 14.9394 26.2786C17.95 26.2786 19.92 23.3423 22.1129 17.6554C22.2245 17.4696 22.2616 17.2466 22.2616 17.0607C22.2616 16.3545 21.7041 15.9085 21.1094 15.9085Z" fill="white"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M6.68617 8.70287C7.35926 8.93784 8.41008 9.2114 9.77251 9.29233L9.99552 9.29222C14.1956 9.29222 16.9461 6.6904 16.9461 3.56821C16.9461 1.56109 15.385 0 13.192 0C10.2557 0 8.21142 2.00712 7.17069 5.98419C5.86978 5.27798 4.97773 4.01424 4.5317 2.41598C4.30868 1.63543 3.82549 1.15223 3.15644 1.15223C2.33873 1.15223 1.81836 1.78411 1.81836 2.63899C1.81836 5.16648 3.78832 7.58245 6.68749 8.69752L6.68617 8.70287ZM10.2185 6.57889C10.776 4.01424 11.6681 2.78767 12.8575 2.78767C13.4894 2.78767 13.8982 3.15936 13.8982 3.8284C13.8982 5.05497 12.5973 6.50455 10.2185 6.57889Z" fill="white"/>
      </g>
      <defs>
        <clipPath id="clip0_9206_9">
          <rect width="70" height="36" fill="white" transform="translate(0.666504)"/>
        </clipPath>
      </defs>
    </svg>
  </div>
);

const MegaMenu = ({ isOpen }: { isOpen: boolean }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute left-0 right-0 top-full bg-white/95 backdrop-blur-sm border-b border-white/20 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-6">
        <div className="flex gap-8">
          {/* Blog Categories */}
          <div className="w-[200px]">
            <h3 className="text-theme-dark-blue font-lato text-sm font-semibold mb-4">Blog categories</h3>
            <div className="space-y-4">
              {['Healthcare', 'Marketing', 'Digital trends', 'Case studies', 'Industry insights'].map((category) => (
                <a key={category} href="#" className="block w-[200px] text-theme-dark-blue font-lato text-base hover:text-theme-blue-primary transition-colors duration-300">
                  {category}
                </a>
              ))}
            </div>
          </div>
          
          {/* Blog Posts Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-8">
              {/* Column 1 */}
              <div className="space-y-2">
                {[
                  {
                    title: "Navigating HIPAA compliance",
                    excerpt: "Discover the latest strategies for healthcare marketing success",
                    image: "https://api.builder.io/api/v1/image/assets/TEMP/4efc5a3352a4a22c46522384a92d651b05faead0?width=320"
                  },
                  {
                    title: "Digital marketing innovations", 
                    excerpt: "Explore cutting-edge techniques for healthcare brands",
                    image: "https://api.builder.io/api/v1/image/assets/TEMP/086b4ea244ea037e8a5a77fd4f98e21d64bddaef?width=320"
                  },
                  {
                    title: "Patient-centric approaches",
                    excerpt: "Learn how to transform your healthcare marketing strategy", 
                    image: "https://api.builder.io/api/v1/image/assets/TEMP/4c5e778b4d996255e2ddb428b0a2b353ecb6cf30?width=320"
                  }
                ].map((post, idx) => (
                  <div key={idx} className="flex gap-6 py-2">
                    <img src={post.image} alt="" className="w-40 h-[107px] object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="text-theme-dark-blue font-lato text-base font-semibold mb-1">{post.title}</h4>
                      <p className="text-theme-dark-blue/80 font-lato text-sm mb-2">{post.excerpt}</p>
                      <a href="#" className="text-theme-blue-primary font-lato text-sm underline hover:text-theme-blue-secondary transition-colors duration-300">Read more</a>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Column 2 */}
              <div className="space-y-2">
                {[
                  {
                    title: "Growth strategies",
                    excerpt: "Unlock new opportunities in healthcare digital marketing",
                    image: "https://api.builder.io/api/v1/image/assets/TEMP/995c868e2d2b431cc6524b6f38f6e98f57fc9a3e?width=320"
                  },
                  {
                    title: "Regulatory insights",
                    excerpt: "Navigate complex healthcare marketing regulations effectively",
                    image: "https://api.builder.io/api/v1/image/assets/TEMP/2afa2994f792fcfd67e0dca9266ef1e1781d3a22?width=320"
                  },
                  {
                    title: "Data-driven marketing",
                    excerpt: "Leverage analytics to improve healthcare brand performance",
                    image: "https://api.builder.io/api/v1/image/assets/TEMP/6b3157aa206ae6aace309ba65b2b9ef9f64a6ab2?width=320"
                  }
                ].map((post, idx) => (
                  <div key={idx} className="flex gap-6 py-2">
                    <img src={post.image} alt="" className="w-40 h-[107px] object-cover rounded-lg" />
                    <div className="flex-1">
                      <h4 className="text-theme-dark-blue font-lato text-base font-semibold mb-1">{post.title}</h4>
                      <p className="text-theme-dark-blue/80 font-lato text-sm mb-2">{post.excerpt}</p>
                      <a href="#" className="text-theme-blue-primary font-lato text-sm underline hover:text-theme-blue-secondary transition-colors duration-300">Read more</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Header() {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  };

  return (
    <header 
      className="w-full relative"
      style={{
        background: 'linear-gradient(90deg, #F1C40F 0%, #F39C12 25%, #3498DB 50%, #2980B9 75%, #F1C40F 100%)'
      }}
    >
      <div className="flex h-[72px] px-4 md:px-8 lg:px-16 justify-between items-center">
        <div className="flex justify-between items-center flex-1">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link to="/">
              <Logo />
            </Link>
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <a href="#" className="text-white font-lato text-sm lg:text-base hover:text-white/80 drop-shadow-md">Services</a>
              <a href="#" className="text-white font-lato text-sm lg:text-base hover:text-white/80 drop-shadow-md">About</a>
              <a href="#" className="text-white font-lato text-sm lg:text-base hover:text-white/80 drop-shadow-md">Team</a>
              <div
                className="relative"
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                onMouseLeave={() => setIsMegaMenuOpen(false)}
              >
                <button className="flex items-center gap-1 text-white font-lato text-sm lg:text-base hover:text-white/80 drop-shadow-md">
                  Blog
                  <ChevronDown className="w-5 h-5 lg:w-6 lg:h-6" />
                </button>
              </div>
            </nav>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 lg:gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full transition-all duration-300"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:block text-sm lg:text-base">{user.companyName}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <Link
                        to="/welcome"
                        className="block px-4 py-2 text-theme-dark-blue hover:bg-theme-light-blue/20 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-theme-dark-blue hover:bg-theme-light-blue/20 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <Link
                        to="/watchlist"
                        className="block px-4 py-2 text-theme-dark-blue hover:bg-theme-light-blue/20 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Watchlist
                      </Link>
                      <Link
                        to="/prospects"
                        className="block px-4 py-2 text-theme-dark-blue hover:bg-theme-light-blue/20 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Prospects
                      </Link>
                      <hr className="my-2 border-theme-light-blue" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-3 lg:px-5 py-2 border-white/30 text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 text-sm lg:text-base rounded-full"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    size="sm"
                    className="px-3 lg:px-5 py-2 bg-white text-theme-blue-primary border border-white hover:bg-theme-light-blue text-sm lg:text-base rounded-full shadow-lg"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mega Menu */}
      <div 
        onMouseEnter={() => setIsMegaMenuOpen(true)}
        onMouseLeave={() => setIsMegaMenuOpen(false)}
      >
        <MegaMenu isOpen={isMegaMenuOpen} />
      </div>
    </header>
  );
}
