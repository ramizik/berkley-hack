import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Mic, Music, Star, Trophy, Heart, Play, ArrowRight } from 'lucide-react';

const Introduction: React.FC = () => {
  const navigate = useNavigate();

  // Refs for scroll animations
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const whyChooseRef = useRef(null);
  const ctaRef = useRef(null);

  // InView hooks
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const whyChooseInView = useInView(whyChooseRef, { once: true, margin: "-100px" });
  const ctaInView = useInView(ctaRef, { once: true, margin: "-100px" });

  const features = [
    {
      icon: <Mic className="text-white" size={24} />,
      title: "Real-time Feedback",
      description: "Get instant feedback on your pitch, timing, and vocal technique with AI-powered analysis"
    },
    {
      icon: <Music className="text-white" size={24} />,
      title: "Personalized Lessons",
      description: "Customized vocal exercises tailored to your skill level and vocal range"
    },
    {
      icon: <Trophy className="text-white" size={24} />,
      title: "Progress Tracking",
      description: "Monitor your improvement with detailed analytics and achievement system"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 60, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const slideInFromLeft = {
    hidden: { x: -100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const slideInFromRight = {
    hidden: { x: 100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const fadeInUp = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Custom Bolt.new Badge Configuration */}
      <style>
        {`
          .bolt-badge {
            transition: all 0.3s ease;
          }
        `}
      </style>
      <div className="fixed bottom-4 right-4 z-50">
        <a href="https://bolt.new/?rid=q2wnel" target="_blank" rel="noopener noreferrer" 
           className="block transition-all duration-300 hover:shadow-2xl">
          <img src="https://github.com/kickiniteasy/bolt-hackathon-badge/blob/main/src/public/bolt-badge/black_circle_360x360/black_circle_360x360.png?raw=true" 
               alt="Built with Bolt.new badge" 
               className="w-20 h-20 md:w-28 md:h-28 rounded-full shadow-lg"
                />
        </a>
      </div>

      {/* Subtle Red and Blue gradient accents */}
      <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-red-500/15 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-blue-500/15 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 bg-gradient-to-r from-blue-500/10 to-red-500/10 rounded-full blur-2xl"></div>
      
      {/* Animated floating patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Additional animated elements */}
        <motion.div
          animate={{
            y: [0, -30, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-accent/20 to-red-accent/20 rounded-full blur-xl"
        />
        
        <motion.div
          animate={{
            y: [0, 40, 0],
            rotate: [360, 180, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-r from-blue-accent/20 to-purple-accent/20 rounded-full blur-xl"
        />
        
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -25, 0],
            rotate: [0, 90, 180]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
          className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-red-accent/20 to-blue-accent/20 rounded-full blur-xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div ref={heroRef} className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-32">
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={slideInFromLeft}
            className="text-left flex-1"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl hero-title mb-6"
            >
              Master Your Voice with
              <br />
              <span className="hero-title">VocalAI</span>
            </motion.h1>
            
            <motion.p
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-300 mb-8"
            >
              Your personal AI vocal coach that helps you improve your singing through
              real-time feedback, personalized lessons, and detailed progress tracking.
            </motion.p>
            
            <motion.div
              variants={fadeInUp}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 30px rgba(124, 58, 237, 0.5)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/auth')}
                className="px-8 py-4 bg-gradient-primary text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center text-lg"
              >
                <Play size={20} className="mr-2" />
                Get Started
              </motion.button>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={slideInFromRight}
            className="flex-shrink-0"
          >
            <div className="relative w-80 h-80">
              <motion.div
                animate={{
                  rotateX: [0, 360],
                  rotateY: [0, 360],
                  rotateZ: [0, 180],
                  scale: [1, 1.1, 1],
                  background: [
                    "linear-gradient(45deg, #3b82f6, #dc2626, #7c3aed)",
                    "linear-gradient(135deg, #dc2626, #7c3aed, #3b82f6)",
                    "linear-gradient(225deg, #7c3aed, #3b82f6, #dc2626)",
                    "linear-gradient(315deg, #3b82f6, #dc2626, #7c3aed)"
                  ]
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 w-full h-full rounded-full"
                style={{
                  background: "linear-gradient(45deg, #3b82f6, #dc2626, #7c3aed)",
                  transform: "perspective(1000px) rotateX(15deg) rotateY(15deg)",
                  boxShadow: "0 25px 50px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                }}
              />
              
              <motion.div
                animate={{
                  rotateX: [360, 0],
                  rotateY: [360, 0],
                  scale: [1, 0.95, 1]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute inset-4 bg-white/10 backdrop-blur-sm rounded-full"
                style={{
                  transform: "perspective(800px) rotateX(-10deg) rotateY(-10deg)",
                  boxShadow: "inset 0 2px 4px rgba(255, 255, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.3)"
                }}
              />
              
              <motion.div
                animate={{
                  rotateX: [0, 180, 360],
                  rotateZ: [0, 360],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
                className="absolute inset-8 bg-white/15 backdrop-blur-md rounded-full"
                style={{
                  transform: "perspective(600px) rotateX(20deg) rotateY(20deg)",
                  boxShadow: "inset 0 4px 8px rgba(255, 255, 255, 0.15), 0 4px 16px rgba(0, 0, 0, 0.2)"
                }}
              />
              
              <motion.div
                animate={{
                  rotateY: [0, 360],
                  rotateZ: [360, 0],
                  scale: [1, 0.9, 1]
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 3
                }}
                className="absolute inset-12 bg-white/25 backdrop-blur-lg rounded-full"
                style={{
                  transform: "perspective(400px) rotateX(-15deg) rotateY(-15deg)",
                  boxShadow: "inset 0 6px 12px rgba(255, 255, 255, 0.2), 0 2px 8px rgba(0, 0, 0, 0.15)"
                }}
              />
              
              <motion.div
                animate={{
                  rotateX: [0, 360],
                  rotateY: [0, 360],
                  rotateZ: [0, 360],
                  scale: [1, 1.2, 0.8, 1]
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-16 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl rounded-full flex items-center justify-center"
                style={{
                  transform: "perspective(300px) rotateX(25deg) rotateY(25deg)",
                  boxShadow: "inset 0 8px 16px rgba(255, 255, 255, 0.3), 0 0 32px rgba(59, 130, 246, 0.4), 0 0 64px rgba(220, 38, 38, 0.2)"
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 1, 0.6],
                    rotateZ: [0, 360]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-12 h-12 bg-gradient-to-br from-blue-400 to-red-500 rounded-full flex items-center justify-center"
                  style={{
                    boxShadow: "0 0 20px rgba(59, 130, 246, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.3)"
                  }}
                >
                  <div className="w-3 h-3  bg-white rounded-full opacity-80"></div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div
          ref={featuresRef}
          initial="hidden"
          animate={featuresInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05,
                y: -10,
                transition: { duration: 0.3 }
              }}
              className="card group"
            >
              <motion.div
                whileHover={{ 
                  rotate: 360,
                  scale: 1.2
                }}
                transition={{ duration: 0.6 }}
                className="w-16 h-16 bg-gradient-secondary rounded-xl flex items-center justify-center mb-6 group-hover:shadow-lg"
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-2xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Why Choose Section */}
        <motion.div
          ref={whyChooseRef}
          initial="hidden"
          animate={whyChooseInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="card mb-32"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              variants={slideInFromLeft}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Why Choose <span className="gradient-text">VocalAI</span>?
              </h2>
              <ul className="space-y-6">
                {[
                  "Advanced AI technology that provides accurate, real-time feedback",
                  "Personalized learning path adapted to your goals and skill level",
                  "Comprehensive progress tracking and detailed performance analytics",
                  "Join a community of singers and share your progress"
                ].map((text, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={whyChooseInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                    className="flex items-start"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.3, 1],
                        rotate: [0, 180, 360]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.5
                      }}
                      className="mt-1 mr-4"
                    >
                      <Star className="text-yellow-300" size={20} />
                    </motion.div>
                    <span className="text-gray-300 text-xl">
                      {text}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              variants={slideInFromRight}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src="https://images.pexels.com/photos/7504837/pexels-photo-7504837.jpeg"
                  alt="Singer performing"
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-accent/60 via-transparent to-red-accent/30"></div>
                
                {/* Floating music notes */}
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.5, 1, 0.5],
                    rotate: [0, 15, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-6 right-6"
                >
                  <Music className="text-white" size={28} />
                </motion.div>
                
                <motion.div
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute bottom-6 left-6"
                >
                  <Heart className="text-white" size={24} />
                </motion.div>
                
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play className="text-white ml-1" size={24} />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          ref={ctaRef}
          initial="hidden"
          animate={ctaInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="text-center"
        >
          <motion.h2
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-white mb-8"
          >
            Ready to Start Your <span className="gradient-text">Vocal Journey</span>?
          </motion.h2>
          <motion.button
            variants={fadeInUp}
            transition={{ delay: 0.4 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 40px rgba(124, 58, 237, 0.6)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/auth')}
            className="px-12 py-4 bg-gradient-primary text-white rounded-lg font-medium text-xl hover:shadow-2xl transition-all duration-300"
          >
            Begin Your Journey
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Introduction;