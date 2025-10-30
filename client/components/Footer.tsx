import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <g clipPath="url(#clip0_9206_101)">
        <path d="M67.9112 17.0811L67.8741 17.1183C68.1343 16.4121 68.6546 16.1519 69.1006 16.1519C69.7325 16.1519 70.29 16.6351 70.29 17.3413C70.29 17.49 70.29 17.6758 70.2157 17.8988C68.9148 21.244 66.1643 22.9537 63.4882 23.2139C62.2617 25.2953 60.2546 26.8192 57.3926 26.8192C53.3041 26.8192 51.4829 23.5856 51.4829 20.0546C51.4829 15.7059 54.2334 10.874 58.8422 10.874C59.8457 10.874 60.7006 11.0971 61.4068 11.3944C63.4882 12.1749 64.8263 14.8882 64.8263 17.7873C64.8263 18.7165 64.7519 19.6457 64.5289 20.5378C65.9042 20.0546 67.205 18.9395 67.9112 17.0811ZM60.1431 13.9218V13.8847C59.3254 13.8847 58.8422 14.9625 58.8422 16.2634C58.8422 18.159 59.8829 19.9059 61.5183 20.5378C61.7785 19.7201 61.89 18.7909 61.89 17.713C61.89 15.6316 61.2581 13.9218 60.1431 13.9218ZM57.4298 24.1059C58.4705 24.1059 59.5112 23.6599 60.3289 22.7307C57.913 21.6528 56.3891 19.1254 56.3891 16.7094C56.3891 15.8917 56.5378 15.0369 56.7608 14.2935C55.2741 15.5201 54.4192 17.936 54.4192 20.0546C54.4192 22.805 55.7201 24.1059 57.4298 24.1059Z" fill="#020104"/>
        <path d="M52.0568 17.0813L52.0196 17.1185C52.2798 16.4123 52.7258 16.115 53.1718 16.115C53.8037 16.115 54.4355 16.6725 54.4355 17.3787C54.4355 17.5645 54.3984 17.7132 54.324 17.899C52.8745 21.43 50.7187 25.5557 47.2621 27.9716L47.1878 28.715C46.7789 33.1752 44.5117 35.9999 41.6497 35.9999C39.4939 35.9999 38.2302 34.5132 38.2302 32.7663C38.2302 29.607 41.4638 28.4548 44.4745 26.5221C44.5488 25.7415 44.586 24.8495 44.6231 23.8459C43.1364 25.4813 41.5382 26.1504 40.1258 26.1504C37.301 26.1504 34.9966 23.8459 34.9966 20.315C34.9966 14.8884 38.5647 11.3203 42.5417 11.3203H42.5789C45.2922 11.3203 48.1913 12.7698 48.1913 15.3716C48.1913 16.2265 47.8196 20.8725 47.5223 24.4778C49.5293 22.5822 51.2019 19.4973 52.0568 17.0813ZM40.5346 23.4743C41.9099 23.4743 43.7683 22.6194 44.9205 18.4194C45.1063 17.4902 45.2178 16.6725 45.1807 15.7061C44.9577 14.7026 44.1028 14.1079 42.8762 14.1079C40.3488 14.1079 37.9329 16.5238 37.9329 20.2035C37.9329 22.4336 38.9736 23.4743 40.5346 23.4743ZM41.947 33.2867H41.9842C42.7647 33.2867 43.6196 32.7663 44.1771 29.4212C42.5417 30.3875 41.0178 31.3539 41.0178 32.5061C41.0178 32.9893 41.3895 33.2867 41.947 33.2867Z" fill="#020104"/>
        <path d="M35.6485 17.0811L35.6114 17.1183C35.8715 16.4121 36.3919 16.1519 36.8379 16.1519C37.4698 16.1519 38.0273 16.6351 38.0273 17.3413C38.0273 17.49 38.0273 17.6758 37.953 17.8988C36.6521 21.244 33.9016 22.9537 31.2255 23.2139C29.999 25.2953 27.9919 26.8192 25.1299 26.8192C21.0414 26.8192 19.2202 23.5856 19.2202 20.0546C19.2202 15.7059 21.9706 10.874 26.5795 10.874C27.583 10.874 28.4379 11.0971 29.1441 11.3944C31.2255 12.1749 32.5636 14.8882 32.5636 17.7873C32.5636 18.7165 32.4892 19.6457 32.2662 20.5378C33.6415 20.0546 34.9423 18.9395 35.6485 17.0811ZM27.8804 13.9218V13.8847C27.0627 13.8847 26.5795 14.9625 26.5795 16.2634C26.5795 18.159 27.6202 19.9059 29.2556 20.5378C29.5158 19.7201 29.6273 18.7909 29.6273 17.713C29.6273 15.6316 28.9954 13.9218 27.8804 13.9218ZM25.1671 24.1059C26.2078 24.1059 27.2485 23.6599 28.0662 22.7307C25.6503 21.6528 24.1264 19.1254 24.1264 16.7094C24.1264 15.8917 24.2751 15.0369 24.4981 14.2935C23.0114 15.5201 22.1565 17.936 22.1565 20.0546C22.1565 22.805 23.4574 24.1059 25.1671 24.1059Z" fill="#020104"/>
        <path d="M21.1094 15.9085C20.589 15.9085 20.143 16.1687 19.8456 16.8749C18.8793 19.328 16.8721 23.4909 14.8278 23.4909C13.5406 23.4909 12.5445 23.1998 11.5379 22.9056C10.51 22.6052 9.47117 22.3015 8.10028 22.3015C7.61708 22.3015 6.94804 22.3759 6.31617 22.4874C8.21975 19.8916 8.93089 16.7479 9.61997 10.8056C8.32251 10.723 7.2671 10.4833 6.49782 10.2412C5.67617 17.7777 4.74311 20.6513 1.33554 23.4909C0.889514 23.8626 0.666504 24.383 0.666504 24.9034C0.666504 25.7211 1.37272 26.4273 2.26477 26.4273C2.56212 26.4273 2.89663 26.3158 3.23115 26.1671C5.12677 25.3122 6.279 25.0892 7.69142 25.0892C8.58959 25.0892 9.66433 25.3461 10.815 25.621C12.1404 25.9378 13.5665 26.2786 14.9394 26.2786C17.95 26.2786 19.92 23.3423 22.1129 17.6554C22.2245 17.4696 22.2616 17.2466 22.2616 17.0607C22.2616 16.3545 21.7041 15.9085 21.1094 15.9085Z" fill="#020104"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M6.68617 8.70287C7.35926 8.93784 8.41008 9.2114 9.77251 9.29233L9.99552 9.29222C14.1956 9.29222 16.9461 6.6904 16.9461 3.56821C16.9461 1.56109 15.385 0 13.192 0C10.2557 0 8.21142 2.00712 7.17069 5.98419C5.86978 5.27798 4.97773 4.01424 4.5317 2.41598C4.30868 1.63543 3.82549 1.15223 3.15644 1.15223C2.33873 1.15223 1.81836 1.78411 1.81836 2.63899C1.81836 5.16648 3.78832 7.58245 6.68749 8.69752L6.68617 8.70287ZM10.2185 6.57889C10.776 4.01424 11.6681 2.78767 12.8575 2.78767C13.4894 2.78767 13.8982 3.15936 13.8982 3.8284C13.8982 5.05497 12.5973 6.50455 10.2185 6.57889Z" fill="#020104"/>
      </g>
      <defs>
        <clipPath id="clip0_9206_101">
          <rect width="70" height="36" fill="white" transform="translate(0.666504)"/>
        </clipPath>
      </defs>
    </svg>
  </div>
);

const SocialIcon = ({ name, children }: { name: string; children: React.ReactNode }) => (
  <div className="flex py-2 items-center gap-3 w-full">
    {children}
    <span className="text-white font-lato text-sm font-normal leading-[150%]">{name}</span>
  </div>
);

export default function Footer() {
  return (
    <footer 
      className="w-full px-16 py-20 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top left, #F1C40F 0%, #F39C12 30%, #3498DB 60%, #2980B9 100%)'
      }}
    >
      {/* Floating Elements Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-white/15 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-10 h-10 bg-white/25 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-40 w-4 h-4 bg-white/20 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/4 w-6 h-6 bg-white/30 rounded-full animate-pulse delay-1500"></div>
        <div className="absolute top-1/3 right-1/3 w-8 h-8 bg-white/15 rounded-full animate-pulse delay-3000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-white/25 rounded-full animate-pulse delay-2500"></div>
      </div>

      <div className="max-w-[1280px] mx-auto flex flex-col items-start gap-20 relative z-10">
        {/* Main Footer Content */}
        <div className="flex items-start gap-16 w-full h-[248px]">
          {/* Newsletter Section */}
          <div className="w-[400px] flex flex-col items-start gap-6">
            <Logo />
            <p className="text-white font-lato text-base font-normal leading-[150%] w-full drop-shadow-md">
              Stay updated with the latest healthcare marketing insights and strategies
            </p>
            <div className="flex flex-col items-start gap-3 w-full">
              <div className="flex items-start gap-4 w-full">
                <Input 
                  placeholder="Email address"
                  className="flex-1 px-3 py-2 border border-white/30 bg-white/20 backdrop-blur-sm text-white font-lato text-base placeholder:text-white/60 rounded-full"
                />
                <Button 
                  variant="outline"
                  className="px-6 py-2.5 border-white/30 text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 font-lato text-base font-medium rounded-full"
                >
                  Subscribe
                </Button>
              </div>
              <p className="text-white font-lato text-xs font-normal leading-[150%] w-full drop-shadow-md">
                By subscribing, you agree to our privacy policy and consent to receive updates from Ensemble Digital Labs.
              </p>
            </div>
          </div>
          
          {/* Links Sections */}
          <div className="flex items-start gap-8 flex-1 relative">
            {/* Company */}
            <div className="flex flex-col items-start gap-4 flex-1">
              <h3 className="text-white font-lato text-base font-semibold leading-[150%] w-full drop-shadow-lg">Company</h3>
              <div className="flex flex-col items-start w-full">
                {['About us', 'Services', 'Team', 'Careers', 'Contact'].map((link) => (
                  <a key={link} href="#" className="flex py-2 items-start w-full hover:text-white/80 transition-colors duration-300">
                    <span className="flex-1 text-white font-lato text-sm font-normal leading-[150%] drop-shadow-md">{link}</span>
                  </a>
                ))}
              </div>
            </div>
            
            {/* Resources */}
            <div className="flex flex-col items-start gap-4 flex-1">
              <h3 className="text-white font-lato text-base font-semibold leading-[150%] w-full drop-shadow-lg">Resources</h3>
              <div className="flex flex-col items-start w-full">
                {['Blog', 'Case studies', 'Guides', 'Webinars', 'White papers'].map((link) => (
                  <a key={link} href="#" className="flex py-2 items-start w-full hover:text-white/80 transition-colors duration-300">
                    <span className="flex-1 text-white font-lato text-sm font-normal leading-[150%] drop-shadow-md">{link}</span>
                  </a>
                ))}
              </div>
            </div>
            
            {/* Follow us */}
            <div className="flex flex-col items-start gap-4 flex-1">
              <h3 className="text-white font-lato text-base font-semibold leading-[150%] w-full drop-shadow-lg">Follow us</h3>
              <div className="flex flex-col items-start w-full">
                <SocialIcon name="Facebook">
                  <svg width="24" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.3335 12.3033C22.3335 6.7467 17.8564 2.24219 12.3335 2.24219C6.81065 2.24219 2.3335 6.7467 2.3335 12.3033C2.3335 17.325 5.99034 21.4874 10.771 22.2422V15.2116H8.23194V12.3033H10.771V10.0867C10.771 7.56515 12.264 6.17231 14.5481 6.17231C15.6423 6.17231 16.7866 6.36882 16.7866 6.36882V8.8448H15.5257C14.2835 8.8448 13.896 9.62041 13.896 10.4161V12.3033H16.6694L16.2261 15.2116H13.896V22.2422C18.6767 21.4874 22.3335 17.3252 22.3335 12.3033Z" fill="white"/>
                  </svg>
                </SocialIcon>
                
                <SocialIcon name="Instagram">
                  <svg width="24" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M16.3335 3.24219H8.3335C5.57208 3.24219 3.3335 5.48077 3.3335 8.24219V16.2422C3.3335 19.0036 5.57208 21.2422 8.3335 21.2422H16.3335C19.0949 21.2422 21.3335 19.0036 21.3335 16.2422V8.24219C21.3335 5.48077 19.0949 3.24219 16.3335 3.24219ZM19.5835 16.2422C19.578 18.0348 18.1261 19.4867 16.3335 19.4922H8.3335C6.54085 19.4867 5.08899 18.0348 5.0835 16.2422V8.24219C5.08899 6.44954 6.54085 4.99768 8.3335 4.99219H16.3335C18.1261 4.99768 19.578 6.44954 19.5835 8.24219V16.2422ZM17.0835 8.49219C17.6358 8.49219 18.0835 8.04447 18.0835 7.49219C18.0835 6.93991 17.6358 6.49219 17.0835 6.49219C16.5312 6.49219 16.0835 6.93991 16.0835 7.49219C16.0835 8.04447 16.5312 8.49219 17.0835 8.49219ZM12.3335 7.74219C9.84822 7.74219 7.8335 9.75691 7.8335 12.2422C7.8335 14.7275 9.84822 16.7422 12.3335 16.7422C14.8188 16.7422 16.8335 14.7275 16.8335 12.2422C16.8362 11.0479 16.3629 9.90176 15.5184 9.05727C14.6739 8.21278 13.5278 7.73953 12.3335 7.74219ZM9.5835 12.2422C9.5835 13.761 10.8147 14.9922 12.3335 14.9922C13.8523 14.9922 15.0835 13.761 15.0835 12.2422C15.0835 10.7234 13.8523 9.49219 12.3335 9.49219C10.8147 9.49219 9.5835 10.7234 9.5835 12.2422Z" fill="white"/>
                  </svg>
                </SocialIcon>
                
                <SocialIcon name="Twitter">
                  <svg width="24" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.5096 4.24219H20.2697L14.2396 11.0196L21.3335 20.2422H15.7791L11.4286 14.6488L6.45073 20.2422H3.68894L10.1387 12.993L3.3335 4.24219H9.02895L12.9614 9.35481L17.5096 4.24219ZM16.5408 18.6176H18.0703L8.19791 5.78147H6.5567L16.5408 18.6176Z" fill="white"/>
                  </svg>
                </SocialIcon>
                
                <SocialIcon name="LinkedIn">
                  <svg width="24" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M4.8335 3.24219C4.00507 3.24219 3.3335 3.91376 3.3335 4.74219V19.7422C3.3335 20.5706 4.00507 21.2422 4.8335 21.2422H19.8335C20.6619 21.2422 21.3335 20.5706 21.3335 19.7422V4.74219C21.3335 3.91376 20.6619 3.24219 19.8335 3.24219H4.8335ZM8.85426 7.24491C8.85989 8.20116 8.14411 8.79038 7.29473 8.78616C6.49457 8.78194 5.79707 8.14491 5.80129 7.24632C5.80551 6.40116 6.47348 5.72194 7.34114 5.74163C8.22145 5.76132 8.85989 6.40679 8.85426 7.24491ZM12.6132 10.0039H10.0932H10.0918V18.5638H12.7552V18.3641C12.7552 17.9842 12.7549 17.6042 12.7546 17.2241C12.7538 16.2103 12.7529 15.1954 12.7581 14.1819C12.7595 13.9358 12.7707 13.6799 12.834 13.445C13.0716 12.5675 13.8606 12.0008 14.7409 12.1401C15.3062 12.2286 15.6802 12.5563 15.8377 13.0893C15.9348 13.4225 15.9784 13.7811 15.9826 14.1285C15.994 15.1761 15.9924 16.2237 15.9908 17.2714C15.9902 17.6412 15.9896 18.0112 15.9896 18.381V18.5624H18.6615V18.3571C18.6615 17.9051 18.6613 17.4532 18.661 17.0013C18.6605 15.8718 18.6599 14.7423 18.6629 13.6124C18.6643 13.1019 18.6095 12.5985 18.4843 12.1049C18.2973 11.3708 17.9106 10.7633 17.282 10.3246C16.8362 10.0124 16.3468 9.81129 15.7998 9.78879C15.7375 9.7862 15.6747 9.78281 15.6116 9.7794C15.3319 9.76428 15.0476 9.74892 14.7802 9.80285C14.0152 9.95613 13.3431 10.3063 12.8354 10.9236C12.7764 10.9944 12.7187 11.0663 12.6326 11.1736L12.6132 11.1979V10.0039ZM6.01514 18.5666H8.66592V10.0095H6.01514V18.5666Z" fill="white"/>
                  </svg>
                </SocialIcon>
                
                <SocialIcon name="YouTube">
                  <svg width="24" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.9263 7.20301C21.8124 6.78041 21.5898 6.39501 21.2807 6.08518C20.9716 5.77534 20.5867 5.55187 20.1643 5.43701C18.5983 5.00701 12.3333 5.00001 12.3333 5.00001C12.3333 5.00001 6.06934 4.99301 4.50234 5.40401C4.08026 5.52415 3.69616 5.75078 3.3869 6.06214C3.07765 6.3735 2.85362 6.75913 2.73634 7.18201C2.32334 8.74801 2.31934 11.996 2.31934 11.996C2.31934 11.996 2.31534 15.26 2.72534 16.81C2.95534 17.667 3.63034 18.344 4.48834 18.575C6.07034 19.005 12.3183 19.012 12.3183 19.012C12.3183 19.012 18.5833 19.019 20.1493 18.609C20.5718 18.4943 20.9571 18.2714 21.267 17.9622C21.5769 17.653 21.8007 17.2682 21.9163 16.846C22.3303 15.281 22.3333 12.034 22.3333 12.034C22.3333 12.034 22.3533 8.76901 21.9263 7.20301ZM10.3293 15.005L10.3343 9.00501L15.5413 12.01L10.3293 15.005Z" fill="white"/>
                  </svg>
                </SocialIcon>
              </div>
            </div>
            
            {/* Big Agent_E4 Character - Far Right */}
            <div className="absolute -right-8 top-0 flex items-center justify-center">
              <div className="relative">
                <img
                  src="/client/agents/Icons/Agent_E4.png"
                  alt="AI Footer Character"
                  className="w-64 h-64 object-contain drop-shadow-2xl"
                />
                {/* Floating Details Elements around the character */}
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-theme-yellow-primary/80 rounded-full flex items-center justify-center text-xl animate-bounce">
                  📋
                </div>
                <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-theme-blue-primary/80 rounded-full flex items-center justify-center text-xl animate-bounce delay-1000">
                  📊
                </div>
                <div className="absolute top-1/2 -right-8 w-8 h-8 bg-theme-yellow-primary/60 rounded-full flex items-center justify-center text-base animate-bounce delay-2000">
                  ✨
                </div>
                <div className="absolute top-1/3 -left-8 w-8 h-8 bg-theme-blue-primary/60 rounded-full flex items-center justify-center text-base animate-bounce delay-3000">
                  🔗
                </div>
                {/* Pointing Arrow to Details */}
                <div className="absolute -left-12 top-1/2 transform -translate-y-1/2">
                  <div className="flex items-center gap-3">
                    <div className="w-0 h-0 border-t-6 border-b-6 border-r-12 border-transparent border-r-theme-yellow-primary animate-pulse"></div>
                    <span className="text-theme-yellow-primary font-lato text-base font-bold drop-shadow-lg">
                      Details
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="flex flex-col items-start gap-8 w-full">
          <div className="w-full h-px bg-white/20"></div>
          <div className="flex justify-between items-start w-full">
            <span className="text-white font-lato text-sm font-normal leading-[150%] drop-shadow-md">
              © 2024 Ensemble Digital Labs. All rights reserved.
            </span>
            <div className="flex items-start gap-6">
              {['Privacy policy', 'Terms of service', 'Cookie settings'].map((link) => (
                <a key={link} href="#" className="text-white font-lato text-sm font-normal leading-[150%] underline hover:text-white/80 transition-colors duration-300 drop-shadow-md">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
