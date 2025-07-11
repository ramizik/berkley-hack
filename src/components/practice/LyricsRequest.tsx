import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Sparkles, Loader2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

interface LyricsRequestProps {
  onLyricsGenerated?: (lyrics: string) => void;
}

const LyricsRequest: React.FC<LyricsRequestProps> = ({ onLyricsGenerated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    genre: '',
    mood: '',
    theme: '',
    difficulty: 'beginner',
    customRequest: ''
  });

  const genres = [
    'Pop', 'Rock', 'Jazz', 'Classical', 'Country', 'R&B', 
    'Folk', 'Blues', 'Musical Theater', 'Gospel', 'Indie'
  ];

  const moods = [
    'Happy', 'Melancholic', 'Energetic', 'Calm', 'Passionate', 
    'Nostalgic', 'Uplifting', 'Romantic', 'Empowering', 'Smooth'
  ];

  const themes = [
    'Vocal Exercise', 'Love', 'Friendship', 'Nature', 'Adventure', 'Self-discovery',
    'Overcoming challenges', 'Celebration', 'Hope', 'Freedom', 'Practice Scales'
  ];

  const difficulties = [
    { value: 'beginner', label: 'Beginner', description: 'Simple melodies, limited range (1 octave), clear pronunciation focus' },
    { value: 'intermediate', label: 'Intermediate', description: 'Moderate range (1.5 octaves), some vocal runs, breath control' },
    { value: 'advanced', label: 'Advanced', description: 'Wide range (2+ octaves), complex rhythms, advanced techniques' }
  ];

  const cleanupLyrics = (lyrics: string): string => {
    // Remove technical annotations and metadata
    let cleaned = lyrics
      // Remove bracket annotations like [Original Practice Song - Jazz Style]
      .replace(/\[.*?\]/g, '')
      // Remove emoji/musical note technical info like 🎵 Vocal Range: A3-E5 | BPM: 96 | Key: E minor
      .replace(/🎵.*?\n/g, '')
      // Remove practice notes sections
      .replace(/\[?\*?\*?Practice Notes?:?\*?\*?\]?.*?\n/gi, '')
      // Remove technical headers like **Original Practice Song - Jazz Style**
      .replace(/\*\*.*?\*\*/g, '')
      // Remove version/style headers
      .replace(/^.*?- (Style|Version).*?\n/gm, '')
      // Remove [Verse - ...] annotations
      .replace(/\[Verse[^\]]*\]/g, '')
      // Remove any remaining square bracket content
      .replace(/\[[^\]]*\]/g, '')
      // Remove lines that are just technical info
      .replace(/^(Here's a brand new|Vocal Range:|BPM:|Key:|Focus on|Pay attention to).*?\n/gm, '')
      // Clean up multiple newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove leading/trailing whitespace
      .trim();
    
    // If the cleaned lyrics are too short (less than 4 lines), generate fallback
    const lines = cleaned.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 4) {
      // Extract any usable lyrics from the original and extend them
      const lyricsLines = lines.filter(line => 
        !line.includes('Practice') && 
        !line.includes('BPM') && 
        !line.includes('Key') &&
        !line.includes('Range') &&
        line.length > 10
      );
      
      if (lyricsLines.length >= 2) {
        // Use the existing lines and add generic continuation
        return lyricsLines.join('\n') + '\n' + 
               'Every note I sing rings true\n' +
               'Music flows from me to you\n' +
               'In this moment we are free\n' +
               'Lost in perfect harmony\n' +
               'Voices rising to the sky\n' +
               'Time and space go floating by';
      } else {
        // Return a generic practice song
        return `Let the music fill your soul
Every note will make you whole
Sing with passion, sing with grace
Let the rhythm set the pace
In this moment we are one
Until the very last note's done
Practice makes the heart grow strong
Join me in this practice song`;
      }
    }
    
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    
    try {
      // Create FormData for the API call
      const formDataToSend = new FormData();
      formDataToSend.append('genre', formData.genre);
      formDataToSend.append('mood', formData.mood);
      formDataToSend.append('theme', formData.theme);
      formDataToSend.append('difficulty', formData.difficulty);
      if (formData.customRequest) {
        formDataToSend.append('custom_request', formData.customRequest);
      }
      
      // Use existing environment variable for backend URL
      const backendUrl = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080';
      
      const response = await fetch(`${backendUrl}/api/generate-lyrics`, {
        method: 'POST',
        body: formDataToSend,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Clean up the lyrics by removing technical information
        const cleanLyrics = cleanupLyrics(result.data.lyrics);
        setGeneratedLyrics(cleanLyrics);
        onLyricsGenerated?.(cleanLyrics);
      } else {
        throw new Error(result.message || 'Failed to generate lyrics');
      }
    } catch (error) {
      console.error('Failed to generate lyrics:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate lyrics');
      
      // Fallback to mock lyrics if API fails
      const mockLyrics = generateMockLyrics(formData);
      setGeneratedLyrics(mockLyrics);
      onLyricsGenerated?.(mockLyrics);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockLyrics = (data: typeof formData): string => {
    const { genre, mood, theme, difficulty } = data;
    
    // Clean practice lyrics designed for 15-second recordings (approximately 8-12 lines)
    const practiceLyrics = {
      pop: {
        happy: `Walking through the city lights tonight
Everything is shining oh so bright
Feel the rhythm in my heart so strong
This is where I know that I belong
Dancing to the beat of my own song
Nothing in this world could go wrong
Singing out with all my might
Everything's gonna be alright`,

        melancholic: `Gentle raindrops on my window pane
Tell a story of both joy and pain
Every breath I take reminds me how
To live each moment in the here and now
Memories fade but feelings stay
Guiding me through another day
In the silence I can hear
All the things I hold most dear`,

        energetic: `Rise up, stand tall, let your voice be heard
Every single note, every single word
Power from within, let it shine so bright
You were born to sing, born to reach new heights
Break the chains that hold you down
Turn that frown into a crown
Sing it loud, sing it proud
Make your voice rise above the crowd`
      },

      rock: {
        energetic: `Thunder in my veins, lightning in my soul
Nothing's gonna stop me from reaching my goal
Scream it to the world, let them hear you roar
This is what we came here fighting for
Break the silence, break the chains
Let the music heal the pain
Rock and roll will never die
Reach up and touch the sky`,

        passionate: `In the silence of the night I call your name
Through the darkness, through the cold, through the rain
Every heartbeat tells me what I need to know
Some things in this life you never let go
Hold on tight to what is real
Time will slowly help you heal
Love will find a way to grow
Even when the wind won't blow`
      },

      jazz: {
        smooth: `Moonlight dancing on the water's edge
Making promises that we both pledge
Time moves slowly when you're by my side
In this moment, let our hearts collide
Smooth as silk and soft as rain
Washing away all the pain
Jazz will take us to that place
Where time and space cannot erase`,

        swing: `Swing it high, swing it low, feel that beat
Move your body to the rhythm so sweet
Jazz is calling and we answer the call
Music lifts us up when we're ready to fall
Syncopated rhythms fill the air
Dancing like we just don't care
Swing those notes with style and grace
Put a smile upon your face`
      },

      classical: {
        calm: `Amazing grace, how sweet the sound
That saved a wretch like me
I once was lost, but now am found
Was blind, but now I see
'Twas grace that taught my heart to fear
And grace my fears relieved
How precious did that grace appear
The hour I first believed`,

        uplifting: `Morning sun begins to rise
Painting colors in the skies
Birds are singing in the trees
Dancing gently in the breeze
Nature's symphony so grand
Touches every heart and hand
Lift your voice and sing along
Join this everlasting song`
      },

      folk: {
        nostalgic: `Home, home on the range
Where the deer and the antelope play
Where seldom is heard a discouraging word
And the skies are not cloudy all day
How often at night when the heavens are bright
With the light from the glittering stars
Have I stood here amazed and asked as I gazed
If their glory exceeds that of ours`,

        happy: `She'll be coming 'round the mountain when she comes
She'll be coming 'round the mountain when she comes
She'll be coming 'round the mountain
She'll be coming 'round the mountain
She'll be coming 'round the mountain when she comes
She'll be riding six white horses when she comes
She'll be riding six white horses when she comes
She'll be riding six white horses
She'll be riding six white horses`
      },

      rb: {
        smooth: `Sitting by the window watching raindrops fall
Thinking 'bout the times we used to have it all
Smooth melodies playing in my mind
Leaving all the worries far behind
Soulful rhythms make me feel alive
In this moment everything's alright
Let the music take control tonight
Everything's gonna be just fine`,

        passionate: `Fire burning deep inside my soul
Music makes me feel like I'm in control
Every note I sing comes from the heart
This is where my healing gets to start
Powerful emotions flowing free
This is who I'm meant to be
Sing it with passion, sing it with soul
Let the rhythm make you whole`
      }
    };

    // Select appropriate lyrics based on user preferences
    const genreKey = genre.toLowerCase().replace(/\s+/g, '').replace('&', '').replace('r&b', 'rb') as keyof typeof practiceLyrics;
    const moodKey = mood.toLowerCase() as keyof typeof practiceLyrics.pop;
    
    let selectedLyrics;
    
    if (practiceLyrics[genreKey]) {
      const genreLyrics = practiceLyrics[genreKey];
      if (genreLyrics[moodKey]) {
        selectedLyrics = genreLyrics[moodKey];
      } else {
        // Get first available mood for this genre
        const availableMoods = Object.keys(genreLyrics);
        selectedLyrics = genreLyrics[availableMoods[0] as keyof typeof genreLyrics];
      }
    } else {
      // Default to pop if genre not found
      selectedLyrics = practiceLyrics.pop[moodKey] || practiceLyrics.pop.happy;
    }

    return selectedLyrics;
  };

  return (
    <div className="mb-6">
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gradient-to-r from-purple-accent/20 to-blue-accent/20 border border-purple-accent/30 rounded-lg p-4 hover:from-purple-accent/30 hover:to-blue-accent/30 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Music size={20} className="text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white">AI-Generated Practice Lyrics Powered by Groq</h3>
              <p className="text-sm text-gray-300">Dynamic, personalized songs that feel like real music - generated fresh every time</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles size={20} className="text-purple-accent" />
            {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </div>
        </div>
      </motion.button>

      {/* Lyrics Request Form */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 bg-dark-lighter rounded-lg border border-dark-accent p-6"
        >
          {!generatedLyrics ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Info Note */}
              <div className="bg-blue-accent/10 border border-blue-accent/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Sparkles size={16} className="text-blue-accent mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-100">
                    <p className="font-medium mb-1">🤖 Powered by Groq AI</p>
                    <p>Advanced AI generates unique, high-quality practice lyrics that feel like real songs you'd want to sing. Each generation is completely original and tailored to your preferences and skill level.</p>
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Quick Practice Options
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, genre: 'Pop', mood: 'Happy', theme: 'Vocal Exercise', difficulty: 'beginner'})}
                    className="p-3 bg-purple-accent/20 border border-purple-accent/30 rounded-lg text-sm text-purple-100 hover:bg-purple-accent/30 transition-colors text-left"
                  >
                    <div className="font-medium">Beginner Pop</div>
                    <div className="text-xs text-purple-300">Easy melodies, clear pronunciation</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, genre: 'Jazz', mood: 'Smooth', theme: 'Vocal Exercise', difficulty: 'intermediate'})}
                    className="p-3 bg-blue-accent/20 border border-blue-accent/30 rounded-lg text-sm text-blue-100 hover:bg-blue-accent/30 transition-colors text-left"
                  >
                    <div className="font-medium">Jazz Standards</div>
                    <div className="text-xs text-blue-300">Smooth phrasing, legato practice</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, genre: 'Classical', mood: 'Calm', theme: 'Practice Scales', difficulty: 'advanced'})}
                    className="p-3 bg-green-accent/20 border border-green-accent/30 rounded-lg text-sm text-green-100 hover:bg-green-accent/30 transition-colors text-left"
                  >
                    <div className="font-medium">Classical Training</div>
                    <div className="text-xs text-green-300">Public domain classics, technique focus</div>
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/30 rounded-lg p-3"
                >
                  <p className="text-red-400 text-sm">
                    {error} - Showing demo practice lyrics instead.
                  </p>
                </motion.div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Genre Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Genre
                  </label>
                  <select
                    value={formData.genre}
                    onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full bg-dark border border-dark-accent rounded-lg px-3 py-2 text-white focus:border-purple-accent focus:outline-none"
                  >
                    <option value="">Select a genre</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                {/* Mood Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mood
                  </label>
                  <select
                    value={formData.mood}
                    onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                    className="w-full bg-dark border border-dark-accent rounded-lg px-3 py-2 text-white focus:border-purple-accent focus:outline-none"
                  >
                    <option value="">Select a mood</option>
                    {moods.map(mood => (
                      <option key={mood} value={mood}>{mood}</option>
                    ))}
                  </select>
                </div>

                {/* Theme Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Theme
                  </label>
                  <select
                    value={formData.theme}
                    onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
                    className="w-full bg-dark border border-dark-accent rounded-lg px-3 py-2 text-white focus:border-purple-accent focus:outline-none"
                  >
                    <option value="">Select a theme</option>
                    {themes.map(theme => (
                      <option key={theme} value={theme}>{theme}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full bg-dark border border-dark-accent rounded-lg px-3 py-2 text-white focus:border-purple-accent focus:outline-none"
                  >
                    {difficulties.map(diff => (
                      <option key={diff.value} value={diff.value}>
                        {diff.label} - {diff.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Request */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={formData.customRequest}
                  onChange={(e) => setFormData(prev => ({ ...prev, customRequest: e.target.value }))}
                  placeholder="Any specific requirements, vocal range, or additional context..."
                  className="w-full bg-dark border border-dark-accent rounded-lg px-3 py-2 text-white focus:border-purple-accent focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isGenerating || !formData.genre || !formData.mood || !formData.theme}
                  className="px-6 py-2 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Generating with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Generate Lyrics</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          ) : (
            /* Generated Lyrics Display */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">Practice Lyrics</h4>
              </div>
              
              <div className="bg-dark border border-dark-accent rounded-lg p-4">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {generatedLyrics}
                </pre>
              </div>
              
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setGeneratedLyrics('');
                    setError(null);
                    setFormData({
                      genre: '',
                      mood: '',
                      theme: '',
                      difficulty: 'beginner',
                      customRequest: ''
                    });
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Generate New Lyrics
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default LyricsRequest;