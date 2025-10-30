import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Building, Phone, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SignupRequest } from '@shared/api';

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupRequest>({
    email: '',
    password: '',
    companyName: '',
    position: '',
    phoneNumber: '',
    bio: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signup(formData);
      
      if (result.success) {
        navigate('/welcome');
      } else {
        setError(result.message || 'Signup failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const nextStep = () => {
    if (step === 1 && formData.email && formData.password) {
      setStep(2);
    }
  };

  const prevStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const isStep1Valid = formData.email && formData.password && formData.password.length >= 8;
  const isStep2Valid = formData.companyName && formData.position && formData.phoneNumber;

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #F1C40F 0%, #F39C12 50%, #3498DB 50%, #2980B9 100%)'
      }}
    >
      {/* Floating Elements Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-6 h-6 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-4 h-4 bg-white/15 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-5 h-5 bg-white/25 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-40 w-3 h-3 bg-white/20 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-white/30 rounded-full animate-pulse delay-1500"></div>
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-white/15 rounded-full animate-pulse delay-3000"></div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Character Image */}
          <div className="hidden lg:flex flex-col items-center justify-center">
            <div className="relative mb-8">
              <img
                src="/client/agents/Icons/Agent_MG.png"
                alt="Marketing Genius Agent"
                className="w-80 h-80 object-contain"
              />
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-theme-yellow-primary rounded-full animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-theme-pink rounded-full animate-pulse delay-150"></div>
              <div className="absolute top-1/2 -right-2 w-5 h-5 bg-theme-purple rounded-full animate-pulse delay-300"></div>
            </div>
            <h1 className="text-4xl font-alata text-white text-center mb-4 drop-shadow-lg">
              Join Our Community!
            </h1>
            <p className="text-white/90 text-center text-lg drop-shadow-md">
              Create your account and start your AI-powered journey
            </p>
          </div>

          {/* Right Side - Signup Form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-alata text-theme-dark-blue">
                  Create Account
                </CardTitle>
                <CardDescription className="text-theme-dark-blue/70">
                  {step === 1 ? 'Step 1: Basic Information' : 'Step 2: Professional Details'}
                </CardDescription>
                
                {/* Progress Indicator */}
                <div className="flex justify-center mt-4">
                  <div className="flex space-x-2">
                    <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-theme-blue-primary' : 'bg-theme-light-blue'}`}></div>
                    <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-theme-blue-primary' : 'bg-theme-light-blue'}`}></div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {step === 1 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-theme-dark-blue font-medium">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-dark-blue/50 w-4 h-4" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className="pl-10 bg-white/80 border-theme-light-blue focus:border-theme-blue-primary"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-theme-dark-blue font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-dark-blue/50 w-4 h-4" />
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password (min 8 characters)"
                            className="pl-10 pr-10 bg-white/80 border-theme-light-blue focus:border-theme-blue-primary"
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-dark-blue/50 hover:text-theme-dark-blue"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-theme-dark-blue/60">
                          Password must be at least 8 characters long
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={nextStep}
                        disabled={!isStep1Valid}
                        className="w-full bg-theme-blue-primary hover:bg-theme-blue-secondary text-white font-lato font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next Step
                      </Button>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-theme-dark-blue font-medium">
                          Company Name
                        </Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-dark-blue/50 w-4 h-4" />
                          <Input
                            id="companyName"
                            name="companyName"
                            type="text"
                            value={formData.companyName}
                            onChange={handleChange}
                            placeholder="Enter your company name"
                            className="pl-10 bg-white/80 border-theme-light-blue focus:border-theme-blue-primary"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="position" className="text-theme-dark-blue font-medium">
                          Position
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-dark-blue/50 w-4 h-4" />
                          <Input
                            id="position"
                            name="position"
                            type="text"
                            value={formData.position}
                            onChange={handleChange}
                            placeholder="Enter your position"
                            className="pl-10 bg-white/80 border-theme-light-blue focus:border-theme-blue-primary"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-theme-dark-blue font-medium">
                          Phone Number
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-dark-blue/50 w-4 h-4" />
                          <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="Enter your phone number"
                            className="pl-10 bg-white/80 border-theme-light-blue focus:border-theme-blue-primary"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-theme-dark-blue font-medium">
                          Bio (Optional)
                        </Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 text-theme-dark-blue/50 w-4 h-4" />
                          <Textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell us about yourself..."
                            className="pl-10 bg-white/80 border-theme-light-blue focus:border-theme-blue-primary min-h-[80px]"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          type="button"
                          onClick={prevStep}
                          variant="outline"
                          className="flex-1 border-theme-light-blue text-theme-dark-blue hover:bg-theme-light-blue/20"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading || !isStep2Valid}
                          className="flex-1 bg-theme-blue-primary hover:bg-theme-blue-secondary text-white font-lato font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                      </div>
                    </>
                  )}

                  <div className="text-center">
                    <p className="text-theme-dark-blue/70 text-sm">
                      Already have an account?{' '}
                      <Link 
                        to="/login" 
                        className="text-theme-blue-primary hover:text-theme-blue-secondary font-semibold transition-colors"
                      >
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
