import { ChevronRight } from "lucide-react";

export default function BlogSection() {
  const filters = [
    { name: "View all", active: true },
    { name: "Tech Updates", active: false },
    { name: "Marketing Insights", active: false },
    { name: "Patient Engagement", active: false },
    { name: "Digital Strategies", active: false }
  ];

  const blogPosts = [
    {
      tag: "Tech",
      title: "Harnessing AI for Patient Outreach",
      description: "Explore the latest trends in healthcare marketing.",
      readTime: "5 min read",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/6d9880c9897896ea4036ab551c09b27cb71a704d?width=500"
    },
    {
      tag: "Trends",
      title: "The Future of Healthcare Marketing", 
      description: "Insights on leveraging technology for patient engagement.",
      readTime: "5 min read",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/889c24632947535c652dca9b2bb002b63a86c679?width=500"
    },
    {
      tag: "Engagement",
      title: "Innovative Strategies for Patient Retention",
      description: "Discover strategies to enhance your marketing efforts.",
      readTime: "5 min read", 
      image: "https://api.builder.io/api/v1/image/assets/TEMP/35ad9ea122a399ba9b740159b4aaeca9a8491736?width=500"
    },
    {
      tag: "Category",
      title: "Blog title heading will go here",
      description: "Stay informed on the latest healthcare marketing strategies.",
      readTime: "5 min read",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/f7d5c9e6682b33654efac68b5bb94ddd1d5b360f?width=500"
    }
  ];

  return (
    <section 
      className="w-full px-16 py-28 relative overflow-hidden"
      style={{
        background: 'linear-gradient(60deg, #F1C40F 0%, #F39C12 15%, #3498DB 30%, #2980B9 45%, #F1C40F 60%, #F39C12 75%, #3498DB 90%, #2980B9 100%)'
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

      <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-20 relative z-10">
        {/* Section Header with Character */}
        <div className="flex flex-col lg:flex-row items-center gap-16 w-full">
          {/* Character Image - Left Side */}
          <div className="flex-shrink-0 lg:w-1/3 flex justify-center lg:justify-start">
            <div className="relative">
              <img
                src="/client/agents/Icons/Agent_E5.png"
                alt="AI Blog Character"
                className="w-80 h-80 lg:w-96 lg:h-96 object-contain"
              />
              {/* Floating Blog Elements around the character */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-theme-yellow-primary/80 rounded-full flex items-center justify-center text-2xl animate-bounce">
                📝
              </div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-theme-blue-primary/80 rounded-full flex items-center justify-center text-2xl animate-bounce delay-1000">
                💡
              </div>
              <div className="absolute top-1/2 -right-6 w-6 h-6 bg-theme-yellow-primary/60 rounded-full flex items-center justify-center text-lg animate-bounce delay-2000">
                ✨
              </div>
              <div className="absolute top-1/3 -left-6 w-6 h-6 bg-theme-blue-primary/60 rounded-full flex items-center justify-center text-lg animate-bounce delay-3000">
                📚
              </div>
            </div>
          </div>

          {/* Header Content - Right Side */}
          <div className="flex flex-col items-center lg:items-start gap-4 w-full lg:w-2/3">
            <div className="flex items-center w-full">
              <span className="text-white text-center font-lato text-base font-semibold leading-[150%] bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm w-full">
                Blog
              </span>
            </div>
            <div className="flex flex-col items-center lg:items-start gap-6 w-full">
              <h2 className="text-white text-center lg:text-left font-alata text-[72px] font-normal leading-[120%] tracking-[-0.72px] w-full drop-shadow-lg">
                Latest Tech Innovations
              </h2>
              <p className="text-white text-center lg:text-left font-lato text-lg font-normal leading-[150%] w-full drop-shadow-md">
                Stay ahead with the newest healthcare marketing technologies.
              </p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex flex-col items-center gap-16 w-full">
          {/* Filters */}
          <div className="flex items-center">
            {filters.map((filter, index) => (
              <button
                key={index}
                className={`flex px-4 py-2.5 justify-center items-center gap-2 rounded-full transition-all duration-300 ${
                  filter.active 
                    ? 'border border-white/30 bg-white/20 text-white font-medium backdrop-blur-sm' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="font-lato text-base leading-[150%]">
                  {filter.name}
                </span>
              </button>
            ))}
          </div>
          
          {/* Blog Posts Grid */}
          <div className="flex flex-col items-center gap-16 w-full">
            <div className="flex items-start gap-12 w-full">
              {blogPosts.slice(0, 2).map((post, index) => (
                <BlogCard key={index} post={post} />
              ))}
            </div>
            <div className="flex items-start gap-12 w-full">
              {blogPosts.slice(2, 4).map((post, index) => (
                <BlogCard key={index} post={post} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const BlogCard = ({ post }: { post: any }) => (
  <div className="flex items-center gap-6 flex-1 w-full bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
    <img 
      src={post.image} 
      alt={post.title}
      className="w-[250px] h-[250px] aspect-square object-cover rounded-xl"
    />
    <div className="flex flex-col items-start gap-6 flex-1">
      <div className="flex flex-col items-start gap-4 w-full">
        <div className="flex items-center gap-4">
          <span className="flex px-2.5 py-1 items-start border border-theme-blue-primary/20 bg-theme-blue-primary/10 text-theme-blue-primary font-lato text-sm font-semibold leading-[150%] rounded-full">
            {post.tag}
          </span>
          <span className="text-theme-dark-blue font-lato text-sm font-semibold leading-[150%]">
            {post.readTime}
          </span>
        </div>
        <div className="flex flex-col items-start gap-2 w-full">
          <h3 className="text-theme-dark-blue font-alata text-[28px] font-normal leading-[140%] tracking-[-0.28px] w-full">
            {post.title}
          </h3>
          <p className="text-theme-dark-blue/80 font-lato text-base font-normal leading-[150%] w-full">
            {post.description}
          </p>
        </div>
      </div>
      <button className="flex justify-center items-center gap-2 bg-theme-blue-primary/10 hover:bg-theme-blue-primary/20 px-6 py-3 rounded-full border border-theme-blue-primary/20 transition-all duration-300">
        <span className="text-theme-blue-primary font-lato text-base font-medium leading-[150%]">Read more</span>
        <ChevronRight className="w-6 h-6 text-theme-blue-primary" />
      </button>
    </div>
  </div>
);
