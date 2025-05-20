import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Music, AlertTriangle } from 'lucide-react';

interface LocationState {
  match_result?: {
    song_name?: string;
  };
  error?: string;
}
const Result: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as LocationState;

  let songName: string | undefined;

  if (typeof state.song === 'string') {
    songName = state.song;
  } else if (typeof state.song === 'object' && state.song !== null) {
    // handle different possible keys for song title/name
    songName = state.song.title || state.song.name || undefined;
  }

  const { error } = state;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Background decorative elements */}
      <div className="absolute w-64 h-64 bg-purple-300/20 rounded-full blur-3xl -top-20 -right-20"></div>
      <div className="absolute w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl -bottom-32 -left-32"></div>
      
      <Card className="w-full max-w-md shadow-lg overflow-hidden border-white/20 backdrop-filter backdrop-blur-sm bg-white/70">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 z-0"></div>
        
        <CardContent className="pt-6 relative z-10">
          {songName ? (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-song-purple to-song-deep-purple rounded-full flex items-center justify-center shadow-lg shadow-purple-300/30">
                <Music className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-song-purple to-song-deep-purple">Found a match!</h2>
              <div className="py-6 px-6 bg-purple-50/80 rounded-xl mb-4 mt-4 border border-purple-100">
                <p className="text-xl font-semibold text-song-deep-purple">{songName}</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-300/30">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-orange-600">No Match Found</h2>
              <div className="py-6 px-6 bg-orange-50/80 rounded-xl mb-4 mt-4 border border-orange-100">
                <p className="text-lg">{error || "We couldn't identify that song. Please try again with a clearer recording."}</p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center gap-4 pb-6 relative z-10">
          <Button 
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-song-purple to-song-deep-purple hover:opacity-90 transition-opacity shadow-md shadow-purple-300/20"
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Result;
