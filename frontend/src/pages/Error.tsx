
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';

const Error: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Background decorative elements */}
      <div className="absolute w-64 h-64 bg-red-300/10 rounded-full blur-3xl -top-20 -right-20"></div>
      <div className="absolute w-96 h-96 bg-orange-300/10 rounded-full blur-3xl -bottom-32 -left-32"></div>
      
      <div className="text-center mb-8 relative z-10 max-w-md">
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-red-300/30">
          <AlertTriangle className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold mb-6 text-red-600">Oops! Something went wrong</h1>
        <p className="text-lg mb-8 text-gray-700">
          We couldn't process your request. Please try again later.
        </p>
        <Button 
          onClick={() => navigate('/')}
          className="bg-gradient-to-r from-song-purple to-song-deep-purple hover:opacity-90 transition-opacity shadow-md px-6 py-5"
          size="lg"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default Error;
