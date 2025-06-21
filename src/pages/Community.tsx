import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Star, MessageCircle, ThumbsUp, Calendar, Music, Share2, TrendingUp, User } from 'lucide-react';
import { useVocalProfile } from '../context/VocalProfileContext';

const Community: React.FC = () => {
  const { profile } = useVocalProfile();
  const [activeTab, setActiveTab] = useState<string>('community');
  
  const tabs = [
    { id: 'community', name: 'Community', icon: <Users size={18} /> },
    { id: 'leaderboard', name: 'Leaderboard', icon: <Star size={18} /> },
  ];
  
  const communityPosts = [
    {
      id: 1,
      user: {
        name: 'Maria S.',
        level: 'Advanced',
        range: 'Soprano'
      },
      content: 'Just completed a voice analysis session! My vibrato rate improved from 5.2 Hz to 6.1 Hz. The jitter measurements are also getting more stable.',
      likes: 24,
      comments: 5,
      timeAgo: '2 hours ago',
      audioClip: true
    },
    {
      id: 2,
      user: {
        name: 'David L.',
        level: 'Intermediate',
        range: 'Baritone'
      },
      content: "Does anyone have tips for improving shimmer values? My voice analysis shows higher shimmer than I'd like.",
      likes: 8,
      comments: 12,
      timeAgo: '5 hours ago',
      audioClip: false
    },
    {
      id: 3,
      user: {
        name: 'Sarah K.',
        level: 'Beginner',
        range: 'Alto'
      },
      content: 'Just completed my first voice analysis with VocalAI! Mean pitch: 220 Hz, voice type: Alto. Excited to track my progress!',
      likes: 35,
      comments: 7,
      timeAgo: '1 day ago',
      audioClip: true,
      achievement: 'First Analysis Complete'
    },
  ];
  
  const leaderboardData = [
    { rank: 1, name: 'Maria S.', level: 'Advanced', score: 2450, range: 'Soprano' },
    { rank: 2, name: 'James R.', level: 'Advanced', score: 2340, range: 'Tenor' },
    { rank: 3, name: 'Sarah K.', level: 'Intermediate', score: 1980, range: 'Alto' },
    { rank: 4, name: 'David L.', level: 'Intermediate', score: 1875, range: 'Baritone' },
    { rank: 5, name: 'Emma W.', level: 'Advanced', score: 1760, range: 'Mezzo-soprano' },
    { user: true, rank: 24, name: 'You', level: 'Beginner', score: 750, range: profile?.voice_type || 'Unknown' },
  ];
  
  const upcomingEvents = [
    { id: 1, name: 'Live Masterclass: Voice Analysis Techniques', date: 'Sep 15, 2025', time: '2:00 PM', participants: 86 },
    { id: 2, name: 'Community Singing Session', date: 'Sep 22, 2025', time: '6:30 PM', participants: 42 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-transition max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Community</h2>
          <p className="text-gray-300">Connect with other singers and track your rank</p>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        <div className="border-b border-dark-accent">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-light border-b-2 border-purple-accent bg-purple-accent/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-lighter'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'community' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-dark-lighter rounded-lg p-4 border border-dark-accent">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-purple-accent/20 flex items-center justify-center">
                      <User size={20} className="text-purple-accent" />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Share your voice analysis progress or ask for advice..."
                        className="w-full px-4 py-2 bg-dark rounded-lg border border-dark-accent text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-accent focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-3">
                      <button className="flex items-center text-sm text-gray-400 hover:text-gray-200">
                        <Music size={16} className="mr-1" />
                        <span>Record Audio</span>
                      </button>
                      <button className="flex items-center text-sm text-gray-400 hover:text-gray-200">
                        <Calendar size={16} className="mr-1" />
                        <span>Progress Update</span>
                      </button>
                    </div>
                    <button className="px-3 py-1.5 bg-purple-accent text-white text-sm font-medium rounded-lg hover:bg-purple-light transition-colors">
                      Post
                    </button>
                  </div>
                </div>
                
                {communityPosts.map((post, index) => (
                  <motion.div 
                    key={post.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-dark-lighter rounded-lg p-4 border border-dark-accent"
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-purple-accent/20 flex items-center justify-center">
                        <User size={20} className="text-purple-accent" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h4 className="font-medium text-white">{post.user.name}</h4>
                          {post.achievement && (
                            <div className="ml-2 bg-yellow-400/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full flex items-center">
                              <Star size={10} className="mr-1" />
                              {post.achievement}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-400 mt-0.5">
                          <span className="mr-2">{post.timeAgo}</span>
                          <span className="mr-2">•</span>
                          <span className="mr-2">{post.user.level}</span>
                          <span className="mr-2">•</span>
                          <span>{post.user.range}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-200 mb-3">{post.content}</p>
                    
                    {post.audioClip && (
                      <div className="bg-dark rounded-lg p-3 mb-3 border border-dark-accent">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-200">
                            <Music size={16} className="mr-2 text-purple-accent" />
                            <span>Audio clip</span>
                          </div>
                          <button className="text-purple-accent hover:text-purple-light">
                            <Play size={18} />
                          </button>
                        </div>
                        <div className="mt-2 h-8 w-full bg-dark-accent rounded-md relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-between px-1">
                            {[...Array(20)].map((_, i) => (
                              <div
                                key={i}
                                className="w-1 bg-purple-accent rounded-full"
                                style={{ height: `${Math.random() * 20 + 5}px` }}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between border-t border-dark-accent pt-3 mt-3">
                      <div className="flex space-x-4">
                        <button className="flex items-center text-sm text-gray-400 hover:text-gray-200">
                          <ThumbsUp size={16} className="mr-1" />
                          <span>{post.likes}</span>
                        </button>
                        <button className="flex items-center text-sm text-gray-400 hover:text-gray-200">
                          <MessageCircle size={16} className="mr-1" />
                          <span>{post.comments}</span>
                        </button>
                      </div>
                      <button className="flex items-center text-sm text-gray-400 hover:text-gray-200">
                        <Share2 size={16} className="mr-1" />
                        <span>Share</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="space-y-6">
                <div className="bg-dark-lighter rounded-lg p-4 border border-dark-accent">
                  <h3 className="font-semibold text-white mb-4">Upcoming Events</h3>
                  
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="mb-4 last:mb-0">
                      <div className="bg-purple-accent/10 rounded-lg p-3 border border-purple-accent/30">
                        <h4 className="font-medium text-white">{event.name}</h4>
                        <div className="flex items-center text-xs text-gray-300 mt-1">
                          <Calendar size={12} className="mr-1" />
                          <span>{event.date} at {event.time}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-300 mt-1">
                          <Users size={12} className="mr-1" />
                          <span>{event.participants} attending</span>
                        </div>
                        <button className="mt-2 text-xs font-medium text-purple-accent hover:text-purple-light transition-colors">
                          Learn More
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button className="w-full mt-2 text-sm text-purple-accent font-medium hover:text-purple-light transition-colors">
                    View All Events
                  </button>
                </div>
                
                <div className="bg-dark-lighter rounded-lg p-4 border border-dark-accent">
                  <h3 className="font-semibold text-white mb-4">Community Stats</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-300">Active Members</div>
                      <div className="font-medium text-white">1,245</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-300">Practice Sessions Today</div>
                      <div className="font-medium text-white">342</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-300">Voice Analyses Completed</div>
                      <div className="font-medium text-white">5,897</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-dark-lighter rounded-lg p-4 border border-dark-accent">
                  <h3 className="font-semibold text-white mb-4">Top Performers</h3>
                  
                  <div className="space-y-3">
                    {leaderboardData.slice(0, 3).map((user) => (
                      <div key={user.rank} className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-medium ${
                          user.rank === 1 
                            ? 'bg-yellow-400/20 text-yellow-400' 
                            : user.rank === 2
                              ? 'bg-gray-400/20 text-gray-400'
                              : 'bg-yellow-400/10 text-yellow-400/70'
                        }`}>
                          {user.rank}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-purple-accent/20 flex items-center justify-center mr-2">
                          <User size={16} className="text-purple-accent" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.range}</div>
                        </div>
                        <div className="ml-auto text-sm font-medium text-white">
                          {user.score}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button className="w-full mt-3 text-sm text-purple-accent font-medium hover:text-purple-light transition-colors">
                    View Full Leaderboard
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'leaderboard' && (
            <div>
              <div className="bg-dark-lighter rounded-lg border border-dark-accent overflow-hidden mb-6">
                <div className="p-4 border-b border-dark-accent">
                  <h3 className="font-semibold text-white">Leaderboard</h3>
                  <p className="text-sm text-gray-300">Based on practice consistency, improvement, and voice analysis completions</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-dark">
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Singer</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Voice Type</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Level</th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-accent">
                      {leaderboardData.map((user, index) => (
                        <tr 
                          key={index} 
                          className={`${
                            user.user ? 'bg-purple-accent/10' : index % 2 === 0 ? 'bg-dark-lighter' : 'bg-dark'
                          } ${user.user ? 'font-medium' : ''}`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className={`flex items-center ${
                              user.rank <= 3 ? 'text-yellow-400 font-bold' : 'text-white'
                            }`}>
                              {user.rank <= 3 ? (
                                <Star size={14} className="mr-1" />
                              ) : null}
                              {user.rank}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-purple-accent/20 flex items-center justify-center mr-2">
                                <User size={16} className="text-purple-accent" />
                              </div>
                              <span className="text-white">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-gray-300">
                            {user.range}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className={`inline-flex text-xs px-2 py-1 rounded-full ${
                              user.level === 'Beginner' 
                                ? 'bg-green-500/20 text-green-400' 
                                : user.level === 'Intermediate'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-accent/20 text-red-light'
                            }`}>
                              {user.level}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right font-medium text-white">
                            {user.score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-dark-lighter rounded-lg p-4 border border-dark-accent">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-purple-accent/20 flex items-center justify-center mr-3">
                      <Star size={24} className="text-purple-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Your Position</h3>
                      <div className="text-3xl font-bold mt-1 text-white">24th</div>
                      <p className="text-sm text-gray-400 mt-1">Top 10% of all users</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-dark-lighter rounded-lg p-4 border border-dark-accent">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-blue-accent/20 flex items-center justify-center mr-3">
                      <Star size={24} className="text-blue-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Your Score</h3>
                      <div className="text-3xl font-bold mt-1 text-white">750</div>
                      <p className="text-sm text-gray-400 mt-1">+125 points this month</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-dark-lighter rounded-lg p-4 border border-dark-accent">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-red-accent/20 flex items-center justify-center mr-3">
                      <TrendingUp size={24} className="text-red-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Next Rank</h3>
                      <div className="text-3xl font-bold mt-1 text-white">23rd</div>
                      <p className="text-sm text-gray-400 mt-1">Need 65 more points</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const Play = ({ size = 24, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

export default Community;