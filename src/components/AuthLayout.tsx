import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Illustration */}
      <div className="flex-1 bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center p-8">
        <div className="max-w-md">
          {/* Books Stack */}
          <div className="relative mb-8">
            {/* Light bulb */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <div className="w-16 h-16 bg-yellow-400 rounded-full relative">
                <div className="absolute inset-2 bg-yellow-300 rounded-full">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-8 border-2 border-yellow-600 rounded-t-full"></div>
                </div>
                {/* Light rays */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 h-4 bg-yellow-300"
                    style={{
                      top: '-20px',
                      left: '50%',
                      transformOrigin: '50% 52px',
                      transform: `translateX(-50%) rotate(${i * 45}deg)`
                    }}
                  />
                ))}
              </div>
              <div className="w-8 h-6 bg-gray-600 mx-auto rounded-b"></div>
            </div>
            
            {/* Books */}
            <div className="space-y-1">
              <div className="w-48 h-8 bg-blue-400 rounded-sm transform rotate-1"></div>
              <div className="w-48 h-8 bg-blue-500 rounded-sm"></div>
              <div className="w-48 h-8 bg-brown-600 rounded-sm transform -rotate-1"></div>
              <div className="w-48 h-8 bg-green-500 rounded-sm"></div>
              <div className="w-48 h-8 bg-yellow-500 rounded-sm transform rotate-1"></div>
            </div>
            
            {/* Pencils */}
            <div className="absolute right-0 top-4">
              <div className="w-1 h-16 bg-yellow-400 transform rotate-12"></div>
              <div className="w-1 h-16 bg-yellow-400 transform rotate-25 absolute left-2 top-0"></div>
            </div>
            
            {/* Person figure */}
            <div className="absolute right-2 top-8">
              <div className="w-3 h-6 bg-blue-600 rounded-full"></div>
            </div>
          </div>
          
          {/* Clouds */}
          <div className="absolute top-8 right-8 w-12 h-6 bg-white rounded-full opacity-80"></div>
          <div className="absolute top-16 left-8 w-8 h-4 bg-white rounded-full opacity-60"></div>
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;