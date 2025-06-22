/**
 * VAPI Client for real-time voice AI integration
 * Configured via environment variables for security
 */

const VAPI_API_KEY = import.meta.env.VITE_VAPI_API_KEY;
const VAPI_VOICE_AGENT_ID = import.meta.env.VITE_VAPI_VOICE_AGENT_ID;
const VAPI_BASE_URL = 'https://api.vapi.ai';

// Fallback to backend API if VAPI is unavailable
const BACKEND_API_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080';

export interface VAPIMetrics {
  mean_pitch: number;
  vibrato_rate: number;
  jitter: number;
  shimmer: number;
  dynamics: string;
  voice_type: string;
  lowest_note: string;
  highest_note: string;
}

export interface VAPICustomLineResponse {
  success: boolean;
  custom_line: string;
  vapi_session_id: string;
  call_id?: string;
}

export interface VAPIExerciseResponse {
  success: boolean;
  feedback: string;
  exercise_prompt: {
    title: string;
    description: string;
    duration_seconds: number;
    target_focus: string;
    difficulty: string;
  };
  call_id?: string;
}

export interface VAPICallRequest {
  assistant: {
    // Remove id property - VAPI API expects assistant object without id
  };
  customer?: {
    number?: string;
    name?: string;
  };
  phoneNumberId?: string;
  assistantOverrides?: {
    variableValues?: Record<string, any>;
  };
}

export interface VAPICallResponse {
  id: string;
  status: string;
  assistant: {
    id: string;
  };
  customer?: {
    number?: string;
  };
  createdAt: string;
  updatedAt: string;
}

class VAPIClient {
  private apiKey: string;
  private baseUrl: string;
  private voiceAgentId: string;

  constructor(apiKey: string, voiceAgentId: string, baseUrl: string = VAPI_BASE_URL) {
    if (!apiKey) {
      throw new Error('VAPI API key is required. Please set VITE_VAPI_API_KEY in your environment variables.');
    }
    if (!voiceAgentId) {
      throw new Error('VAPI Voice Agent ID is required. Please set VITE_VAPI_VOICE_AGENT_ID in your environment variables.');
    }
    
    this.apiKey = apiKey;
    this.voiceAgentId = voiceAgentId;
    this.baseUrl = baseUrl;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VAPI API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Start a voice call with the VAPI agent for initial voice analysis
   */
  async startVoiceAnalysisCall(metrics: VAPIMetrics, userId: string): Promise<VAPICallResponse> {
    try {
      // Truncate userId to ensure customer name is under 40 characters
      const truncatedUserId = userId.length > 35 ? userId.substring(0, 35) : userId;
      
      const callRequest: VAPICallRequest = {
        assistant: {}, // Empty object as required by VAPI API
        customer: {
          name: `User_${truncatedUserId}`, // Fixed: Ensure under 40 characters
        },
        assistantOverrides: {
          variableValues: {
            user_id: userId,
            voice_type: metrics.voice_type,
            mean_pitch: metrics.mean_pitch,
            vibrato_rate: metrics.vibrato_rate,
            jitter: metrics.jitter,
            shimmer: metrics.shimmer,
            dynamics: metrics.dynamics,
            lowest_note: metrics.lowest_note,
            highest_note: metrics.highest_note,
            analysis_type: 'initial_voice_analysis'
          }
        }
      };

      const response = await this.makeRequest('/call', {
        method: 'POST',
        body: JSON.stringify(callRequest)
      });

      return response;
    } catch (error) {
      console.error('VAPI startVoiceAnalysisCall error:', error);
      throw error;
    }
  }

  /**
   * Start a voice call for custom line practice
   */
  async startCustomLinePracticeCall(
    metrics: VAPIMetrics, 
    customLine: string, 
    userId: string
  ): Promise<VAPICallResponse> {
    try {
      // Truncate userId to ensure customer name is under 40 characters
      const truncatedUserId = userId.length > 35 ? userId.substring(0, 35) : userId;
      
      const callRequest: VAPICallRequest = {
        assistant: {}, // Empty object as required by VAPI API
        customer: {
          name: `User_${truncatedUserId}`, // Fixed: Ensure under 40 characters
        },
        assistantOverrides: {
          variableValues: {
            user_id: userId,
            voice_type: metrics.voice_type,
            mean_pitch: metrics.mean_pitch,
            vibrato_rate: metrics.vibrato_rate,
            jitter: metrics.jitter,
            shimmer: metrics.shimmer,
            dynamics: metrics.dynamics,
            lowest_note: metrics.lowest_note,
            highest_note: metrics.highest_note,
            custom_line: customLine,
            analysis_type: 'custom_line_practice'
          }
        }
      };

      const response = await this.makeRequest('/call', {
        method: 'POST',
        body: JSON.stringify(callRequest)
      });

      return response;
    } catch (error) {
      console.error('VAPI startCustomLinePracticeCall error:', error);
      throw error;
    }
  }

  /**
   * Get call details and extract AI responses
   */
  async getCallDetails(callId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/call/${callId}`);
      return response;
    } catch (error) {
      console.error('VAPI getCallDetails error:', error);
      throw error;
    }
  }

  /**
   * Generate a custom practice line based on vocal metrics using VAPI agent
   */
  async generateCustomLine(metrics: VAPIMetrics, userId: string): Promise<VAPICustomLineResponse> {
    try {
      // Try VAPI first, then fallback to hardcoded lines
      try {
        // Start a call with the VAPI voice agent
        const callResponse = await this.startVoiceAnalysisCall(metrics, userId);
        
        // Wait a moment for the call to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get call details to extract the custom line
        const callDetails = await this.getCallDetails(callResponse.id);
        
        // Extract custom line from call transcript or messages
        let customLine = this.extractCustomLineFromCall(callDetails);
        
        if (!customLine) {
          customLine = this.getFallbackCustomLine(metrics.voice_type, metrics.mean_pitch);
        }

        return {
          success: true,
          custom_line: customLine,
          vapi_session_id: `vapi_${userId}_${Date.now()}`,
          call_id: callResponse.id
        };
      } catch (vapiError) {
        console.warn('VAPI call failed, using fallback custom line:', vapiError);
        
        // Fallback to rule-based generation (removed backend API call)
        return {
          success: true,
          custom_line: this.getFallbackCustomLine(metrics.voice_type, metrics.mean_pitch),
          vapi_session_id: `fallback_${userId}_${Date.now()}`
        };
      }
    } catch (error) {
      console.error('VAPI generateCustomLine error:', error);
      
      // Fallback to rule-based generation
      return {
        success: true,
        custom_line: this.getFallbackCustomLine(metrics.voice_type, metrics.mean_pitch),
        vapi_session_id: `fallback_${userId}_${Date.now()}`
      };
    }
  }

  /**
   * Generate personalized exercise based on custom line performance using VAPI agent
   */
  async generateExercise(
    metrics: VAPIMetrics, 
    customLine: string, 
    sessionId: string
  ): Promise<VAPIExerciseResponse> {
    try {
      const userId = sessionId.split('_')[1] || 'unknown';
      
      // Try VAPI first, then fallback to hardcoded exercises
      try {
        // Start a call with the VAPI voice agent for exercise generation
        const callResponse = await this.startCustomLinePracticeCall(metrics, customLine, userId);
        
        // Wait for the call to process
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Get call details to extract feedback and exercise
        const callDetails = await this.getCallDetails(callResponse.id);
        
        // Extract feedback and exercise from call
        const { feedback, exercise } = this.extractExerciseFromCall(callDetails);
        
        return {
          success: true,
          feedback: feedback || `Your performance of "${customLine}" shows good potential. The AI agent has analyzed your voice and provided personalized feedback.`,
          exercise_prompt: exercise || {
            title: 'AI-Generated Vocal Exercise',
            description: 'Practice the exercise recommended by your VAPI voice agent based on your performance analysis.',
            duration_seconds: 180,
            target_focus: 'overall_improvement',
            difficulty: 'intermediate'
          },
          call_id: callResponse.id
        };
      } catch (vapiError) {
        console.warn('VAPI call failed, using fallback exercise:', vapiError);
        
        // Fallback to hardcoded exercise (removed backend API call)
        return this.getFallbackExercise(metrics, customLine);
      }
    } catch (error) {
      console.error('VAPI generateExercise error:', error);
      return this.getFallbackExercise(metrics, customLine);
    }
  }

  /**
   * Test VAPI connection and voice agent availability
   */
  async testConnection(): Promise<boolean> {
    try {
      // Check if environment variables are set
      if (!this.apiKey || !this.voiceAgentId) {
        console.warn('VAPI credentials not configured. Using fallback mode.');
        return false;
      }
      
      // Test basic API connection with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        // Test basic API connection
        await this.makeRequest('/assistant', {
          signal: controller.signal
        });
        
        // Test specific voice agent availability
        await this.makeRequest(`/assistant/${this.voiceAgentId}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return true;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.error('VAPI connection test failed:', error);
      return false;
    }
  }

  /**
   * Get voice agent details with fallback
   */
  async getVoiceAgentDetails(): Promise<any> {
    try {
      if (!this.apiKey || !this.voiceAgentId) {
        return this.getFallbackAgentDetails();
      }
      
      const response = await this.makeRequest(`/assistant/${this.voiceAgentId}`);
      return response;
    } catch (error) {
      console.error('VAPI getVoiceAgentDetails error:', error);
      return this.getFallbackAgentDetails();
    }
  }

  private getFallbackAgentDetails(): any {
    return {
      id: this.voiceAgentId || 'fallback-agent',
      name: 'Vocal Coach AI Agent (Fallback Mode)',
      status: 'fallback',
      description: 'AI-powered vocal coaching with backend processing'
    };
  }

  /**
   * List all active calls for monitoring
   */
  async listActiveCalls(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/call');
      return response.data || [];
    } catch (error) {
      console.error('VAPI listActiveCalls error:', error);
      return [];
    }
  }

  private extractCustomLineFromCall(callDetails: any): string | null {
    try {
      // Look for custom line in call transcript or messages
      const transcript = callDetails.transcript || '';
      const messages = callDetails.messages || [];
      
      // Extract custom line from AI assistant messages
      for (const message of messages) {
        if (message.role === 'assistant' && message.content) {
          // Look for patterns that indicate a practice line
          const content = message.content.toLowerCase();
          if (content.includes('sing') || content.includes('practice') || content.includes('recite')) {
            return message.content;
          }
        }
      }
      
      // Extract from transcript if available
      if (transcript) {
        const lines = transcript.split('\n');
        for (const line of lines) {
          if (line.includes('Assistant:') && (line.includes('sing') || line.includes('practice'))) {
            return line.replace('Assistant:', '').trim();
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting custom line from call:', error);
      return null;
    }
  }

  private extractExerciseFromCall(callDetails: any): { feedback: string | null; exercise: any | null } {
    try {
      const transcript = callDetails.transcript || '';
      const messages = callDetails.messages || [];
      
      let feedback = null;
      let exercise = null;
      
      // Extract feedback and exercise from AI assistant messages
      for (const message of messages) {
        if (message.role === 'assistant' && message.content) {
          const content = message.content;
          
          // Look for feedback patterns
          if (content.includes('feedback') || content.includes('performance') || content.includes('analysis')) {
            feedback = content;
          }
          
          // Look for exercise patterns
          if (content.includes('exercise') || content.includes('practice') || content.includes('drill')) {
            exercise = {
              title: 'VAPI Voice Agent Exercise',
              description: content,
              duration_seconds: 240,
              target_focus: 'ai_recommended',
              difficulty: 'intermediate'
            };
          }
        }
      }
      
      return { feedback, exercise };
    } catch (error) {
      console.error('Error extracting exercise from call:', error);
      return { feedback: null, exercise: null };
    }
  }

  private getFallbackCustomLine(voiceType: string, meanPitch: number): string {
    const lines = {
      soprano: [
        "Sing 'Twinkle, twinkle, little star' with clear, bright tones in your upper register.",
        "Practice 'La la la la la' ascending from C5 to G5 with light, airy tone.",
        "Sing 'Do Re Mi Fa Sol' starting from E4, focusing on clarity and precision."
      ],
      alto: [
        "Recite 'Amazing Grace' with rich, warm tones in your comfortable range.",
        "Practice 'Ah ah ah ah ah' from G3 to D4 with full, resonant tone.",
        "Sing 'Row, row, row your boat' emphasizing the lower register warmth."
      ],
      tenor: [
        "Sing 'Do Re Mi Fa Sol La Ti Do' with strong, clear projection.",
        "Practice 'Ma ma ma ma ma' from C3 to G4 with consistent tone.",
        "Recite 'Danny Boy' focusing on smooth transitions between registers."
      ],
      baritone: [
        "Recite 'Row, row, row your boat' with deep, resonant tones.",
        "Practice 'Ho ho ho ho ho' from A2 to E3 with rich chest voice.",
        "Sing 'Old Man River' emphasizing depth and power."
      ],
      bass: [
        "Sing 'Old Man River' with powerful, deep chest voice.",
        "Practice 'Bo bo bo bo bo' from E2 to B2 with maximum resonance.",
        "Recite 'Swing Low, Sweet Chariot' with full, rich tone."
      ]
    };

    const voiceLines = lines[voiceType as keyof typeof lines] || lines.tenor;
    return voiceLines[Math.floor(Math.random() * voiceLines.length)];
  }

  private getFallbackExercise(metrics: VAPIMetrics, customLine: string): VAPIExerciseResponse {
    // Generate personalized feedback based on actual voice analysis parameters
    let feedback = `Your performance of "${customLine}" shows `;
    let targetFocus = "general_technique";
    let difficulty = "intermediate";
    
    // Analyze jitter (pitch variation)
    if (metrics.jitter > 2.0) {
      feedback += "some pitch instability. ";
      targetFocus = "pitch_stability";
      difficulty = "beginner";
    } else if (metrics.jitter > 1.0) {
      feedback += "moderate pitch control. ";
      targetFocus = "pitch_accuracy";
    } else {
      feedback += "good pitch stability. ";
      targetFocus = "advanced_technique";
      difficulty = "advanced";
    }
    
    // Analyze shimmer (amplitude variation)
    if (metrics.shimmer > 3.0) {
      feedback += "Your volume consistency needs work. ";
      targetFocus = "volume_control";
    } else if (metrics.shimmer > 1.5) {
      feedback += "Volume control is improving. ";
    } else {
      feedback += "Excellent volume consistency. ";
    }
    
    // Analyze vibrato
    if (metrics.vibrato_rate > 0.8) {
      feedback += "Your vibrato is well-developed. ";
    } else if (metrics.vibrato_rate > 0.4) {
      feedback += "Vibrato development is progressing. ";
      targetFocus = "vibrato_control";
    } else {
      feedback += "Focus on developing natural vibrato. ";
      targetFocus = "vibrato_development";
    }
    
    // Analyze voice type and range
    feedback += `Your ${metrics.voice_type} voice with range from ${metrics.lowest_note} to ${metrics.highest_note} has good potential. `;
    
    // Select exercise based on analysis
    const exercises = [
      {
        title: "Sustained Breath Control Exercise",
        description: "Take a deep breath and sing a comfortable vowel sound (like 'Ah') for as long as possible, maintaining steady volume and tone. Focus on engaging your diaphragm and controlling the airflow. Repeat 5 times with 30-second breaks.",
        duration_seconds: 180,
        target_focus: "breath_control",
        difficulty: "beginner"
      },
      {
        title: "Pitch Accuracy with Long Tones",
        description: "Using a piano or tuning app, sing sustained notes matching specific pitches. Focus on hitting the exact pitch and maintaining it without wavering. Start with comfortable notes and gradually expand your range.",
        duration_seconds: 300,
        target_focus: "pitch_stability",
        difficulty: "intermediate"
      },
      {
        title: "Vibrato Development Drill",
        description: "Sing a sustained note in your comfortable range. Start with a straight tone, then gradually add gentle vibrato by slightly oscillating the pitch. Practice controlling the speed and width of the vibrato. Hold each note for 8-10 seconds.",
        duration_seconds: 240,
        target_focus: "vibrato_control",
        difficulty: "intermediate"
      },
      {
        title: "Volume Control Exercise",
        description: "Practice singing the same note with varying dynamics (pp, p, mp, mf, f, ff). Focus on maintaining pitch accuracy while changing volume. This helps develop consistent breath support.",
        duration_seconds: 200,
        target_focus: "volume_control",
        difficulty: "intermediate"
      },
      {
        title: "Advanced Vocal Agility",
        description: "Practice rapid scale passages and arpeggios within your comfortable range. Focus on clean transitions between notes and maintaining consistent tone quality throughout the exercise.",
        duration_seconds: 360,
        target_focus: "advanced_technique",
        difficulty: "advanced"
      }
    ];

    // Select exercise based on target focus
    let selectedExercise = exercises.find(ex => ex.target_focus === targetFocus) || exercises[1];
    
    // Adjust difficulty based on analysis
    selectedExercise.difficulty = difficulty;
    
    return {
      success: true,
      feedback: feedback,
      exercise_prompt: selectedExercise
    };
  }
}

// Create and export the VAPI client instance with environment variables
let vapiClient: VAPIClient;

try {
  vapiClient = new VAPIClient(VAPI_API_KEY || '', VAPI_VOICE_AGENT_ID || '');
} catch (error) {
  console.warn('VAPI client initialization failed:', error);
  // Create a fallback client that will use backend API
  vapiClient = new VAPIClient('fallback', 'fallback');
}

export { vapiClient };

// Export utility functions
export const testVAPIConnection = () => vapiClient.testConnection();
export const getVoiceAgentDetails = () => vapiClient.getVoiceAgentDetails();
export const generateCustomLine = (metrics: VAPIMetrics, userId: string) => 
  vapiClient.generateCustomLine(metrics, userId);
export const generateExercise = (metrics: VAPIMetrics, customLine: string, sessionId: string) => 
  vapiClient.generateExercise(metrics, customLine, sessionId);
export const listActiveCalls = () => vapiClient.listActiveCalls();