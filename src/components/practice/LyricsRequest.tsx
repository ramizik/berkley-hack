import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface LyricsRequestProps {
  onLyricsGenerated?: (lyrics: string) => void;
}

const LyricsRequest: React.FC<LyricsRequestProps> = ({ onLyricsGenerated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState<string>('');
  const [copied, setCopied] = useState(false);
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
    'Folk', 'Blues', 'Electronic', 'Hip Hop', 'Musical Theater'
  ];

  const moods = [
    'Happy', 'Melancholic', 'Energetic', 'Calm', 'Passionate', 
    'Nostalgic', 'Uplifting', 'Mysterious', 'Romantic', 'Empowering'
  ];

  const themes = [
    'Love', 'Friendship', 'Nature', 'Adventure', 'Self-discovery',
    'Overcoming challenges', 'Celebration', 'Reflection', 'Hope', 'Freedom'
  ];

  const difficulties = [
    { value: 'beginner', label: 'Beginner', description: 'Simple melodies, basic rhythms' },
    { value: 'intermediate', label: 'Intermediate', description: 'Moderate complexity, some range' },
    { value: 'advanced', label: 'Advanced', description: 'Complex melodies, wide range' }
  ];

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
        setGeneratedLyrics(result.data.lyrics);
        onLyricsGenerated?.(result.data.lyrics);
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
    
    // Generate 15-second lyrics based on the parameters
    const lyricsTemplates = {
      pop: {
        happy: `[Verse - 15 seconds]
In the morning light, I feel so alive
Every step I take, I'm ready to thrive
With a heart so full and dreams so bright
I'm reaching for the stars tonight`,
        
        melancholic: `[Verse - 15 seconds]
In the quiet hours of the night
I think about the things that might
Have been different, have been true
If I'd only known what to do`
      },
      rock: {
        energetic: `[Verse - 15 seconds]
I can feel the fire burning deep inside
Breaking through the walls, I'm ready to ride
No more holding back, no more fear
I'm breaking free, the time is here`
      }
    };

    const template = lyricsTemplates.pop?.[mood.toLowerCase() as keyof typeof lyricsTemplates.pop] || 
      lyricsTemplates.pop.happy;
    
    return template;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLyrics);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy lyrics:', error);
    }
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
              <h3 className="font-semibold text-white">Request Practice Lyrics</h3>
              <p className="text-sm text-gray-300">Get 15-second lyrics for your practice session</p>
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
              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/30 rounded-lg p-3"
                >
                  <p className="text-red-400 text-sm">
                    {error} (Using fallback lyrics)
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
                <h4 className="text-lg font-semibold text-white">Generated Lyrics (15 seconds)</h4>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyToClipboard}
                  className="px-3 py-1 bg-purple-accent/20 text-purple-accent rounded-lg hover:bg-purple-accent/30 transition-colors flex items-center space-x-2"
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </motion.button>
              </div>
              
              <div className="bg-dark border border-dark-accent rounded-lg p-4">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {generatedLyrics}
                </pre>
              </div>
              
              <div className="flex justify-between">
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
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-purple-accent text-white rounded-lg hover:bg-purple-light transition-colors"
                >
                  Use These Lyrics
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