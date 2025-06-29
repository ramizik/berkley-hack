import { useAuth } from '../context/AuthContext';

interface LettaMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface LettaConversationContext {
  conversation_id: string;
  user_id: string;
  context_type: 'lessons' | 'progress' | 'practice' | 'general';
  current_date?: string;
  fetch_ai_report?: any;
  lesson_context?: any;
  practice_context?: any;
}

class LettaService {
  private static instance: LettaService;
  private baseUrl: string;
  private currentConversation: LettaConversationContext | null = null;

  private constructor() {
    this.baseUrl = (import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080').replace(/\/$/, '');
  }

  public static getInstance(): LettaService {
    if (!LettaService.instance) {
      LettaService.instance = new LettaService();
    }
    return LettaService.instance;
  }

  async startConversation(
    userId: string,
    contextType: 'lessons' | 'progress' | 'practice' | 'general',
    additionalContext?: {
      date?: string;
      fetchAiReport?: any;
      lessonContext?: any;
      practiceContext?: any;
    }
  ): Promise<{ conversation_id: string; starter_message: string }> {
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('conversation_type', this.mapContextToType(contextType));
      
      if (additionalContext?.date) {
        formData.append('date', additionalContext.date);
      }

      const response = await fetch(`${this.baseUrl}/api/letta/conversation/start`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to start conversation: ${response.status}`);
      }

      const data = await response.json();
      
      this.currentConversation = {
        conversation_id: data.data.conversation_id,
        user_id: userId,
        context_type: contextType,
        current_date: additionalContext?.date,
        fetch_ai_report: additionalContext?.fetchAiReport,
        lesson_context: additionalContext?.lessonContext,
        practice_context: additionalContext?.practiceContext,
      };

      return {
        conversation_id: data.data.conversation_id,
        starter_message: this.getContextualStarterMessage(contextType, additionalContext)
      };
    } catch (error) {
      console.error('Error starting Letta conversation:', error);
      throw error;
    }
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    message: string
  ): Promise<{ message: string; suggestions?: string[]; follow_up_questions?: string[] }> {
    try {
      const formData = new FormData();
      formData.append('conversation_id', conversationId);
      formData.append('user_id', userId);
      formData.append('message', message);

      const response = await fetch(`${this.baseUrl}/api/letta/conversation/chat`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();
      return data.data.response;
    } catch (error) {
      console.error('Error sending message to Letta:', error);
      throw error;
    }
  }

  private mapContextToType(contextType: string): string {
    const mapping = {
      'lessons': 'exercise_guidance',
      'progress': 'progress_review',
      'practice': 'exercise_guidance',
      'general': 'daily_feedback'
    };
    return mapping[contextType as keyof typeof mapping] || 'daily_feedback';
  }

  private getContextualStarterMessage(
    contextType: string,
    additionalContext?: any
  ): string {
    switch (contextType) {
      case 'lessons':
        return "Hello! I'm your AI Lesson Advisor. I can help you choose the right lessons, understand vocal techniques, and create a personalized learning path. What would you like to work on today?";
      
      case 'progress':
        const date = additionalContext?.date || 'today';
        return `Hi! I'm your personal vocal coach. I've analyzed your progress data for ${date}. I can discuss your vocal metrics, explain trends in your development, suggest targeted exercises, and help you understand what your voice data means. What would you like to explore about your vocal journey?`;
      
      case 'practice':
        return "Hey there! I'm here to guide your practice session. I can suggest exercises based on your current skill level, help you work through specific techniques, and provide real-time coaching advice. Ready to practice?";
      
      default:
        return "Hello! I'm your AI vocal coach. I'm here to help with any questions about singing, vocal technique, or your progress. How can I assist you today?";
    }
  }

  getCurrentConversation(): LettaConversationContext | null {
    return this.currentConversation;
  }

  clearCurrentConversation(): void {
    this.currentConversation = null;
  }
}

export default LettaService;
export type { LettaMessage, LettaConversationContext };