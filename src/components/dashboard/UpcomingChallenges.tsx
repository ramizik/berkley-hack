import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users } from 'lucide-react';

const UpcomingChallenges: React.FC = () => {
  const challenges = [
    {
      id: 1,
      title: '7-Day Vocal Warmup',
      participants: 245,
      days: 2,
      prize: 'Badge',
      type: 'community',
    },
    {
      id: 2,
      title: 'Perfect Pitch Challenge',
      participants: 128,
      days: 5,
      prize: 'Certificate',
      type: 'contest',
    },
  ];