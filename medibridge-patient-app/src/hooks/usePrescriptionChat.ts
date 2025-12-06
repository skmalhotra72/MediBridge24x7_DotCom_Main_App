'use client';

import { useState, useCallback, useRef } from 'react';
import { 
  analyzePrescription, 
  askFollowUpQuestion, 
  extractResponseText,
  WebhookResponse 
} from '@/services/webhookService';

// ===================
// TYPE DEFINITIONS
// ===================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface UsePrescriptionChatOptions {
  prescription_id: string;
  user_id: string;
  chat_session_id: string;
  file_url?: string;
  file_type?: string;
  user_name?: string;
  user_email?: string;
  organization_id?: string;
  clinic_name?: string;
}

export interface UsePrescriptionChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isAnalyzed: boolean;
  analyzeInitialPrescription: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

// ===================
// HOOK IMPLEMENTATION
// ===================

export function usePrescriptionChat(options: UsePrescriptionChatOptions): UsePrescriptionChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  
  // Prevent duplicate analysis calls
  const isAnalyzingRef = useRef(false);

  // Generate unique message ID
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Analyze the initial prescription when chat loads
   */
  const analyzeInitialPrescription = useCallback(async () => {
    // Guards
    if (!options.file_url) {
      console.log('[usePrescriptionChat] No file_url provided, skipping analysis');
      return;
    }
    if (isAnalyzed || isAnalyzingRef.current) {
      console.log('[usePrescriptionChat] Already analyzed or in progress');
      return;
    }

    isAnalyzingRef.current = true;
    setIsLoading(true);
    setError(null);

    // Add loading message
    const loadingMsg: ChatMessage = {
      id: generateId(),
      role: 'system',
      content: '🔍 Analyzing your prescription... This may take a few seconds.',
      timestamp: new Date(),
      isLoading: true
    };
    setMessages([loadingMsg]);

    try {
      console.log('[usePrescriptionChat] Starting prescription analysis...');
      
      const response = await analyzePrescription({
        prescription_id: options.prescription_id,
        file_url: options.file_url,
        file_type: options.file_type || 'image',
        user_id: options.user_id,
        user_name: options.user_name,
        user_email: options.user_email,
        organization_id: options.organization_id,
        clinic_name: options.clinic_name || 'MediBridge',
        chat_session_id: options.chat_session_id
      });

      const responseText = extractResponseText(response);

      // Replace loading message with AI response
      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };

      setMessages([aiMessage]);
      setIsAnalyzed(true);
      console.log('[usePrescriptionChat] Analysis complete');

    } catch (err) {
      console.error('[usePrescriptionChat] Analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze prescription';
      setError(errorMessage);
      
      setMessages([{
        id: generateId(),
        role: 'assistant',
        content: `❌ Sorry, I couldn't analyze your prescription.\n\n**Error:** ${errorMessage}\n\nPlease try refreshing the page or uploading again. If the problem persists, contact support.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      isAnalyzingRef.current = false;
    }
  }, [options, isAnalyzed]);

  /**
   * Send a follow-up message/question
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    // Add loading indicator
    const loadingMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);

    try {
      const response = await askFollowUpQuestion({
        prescription_id: options.prescription_id,
        question: content,
        user_id: options.user_id,
        user_name: options.user_name,
        chat_session_id: options.chat_session_id,
        clinic_name: options.clinic_name
      });

      const responseText = extractResponseText(response);

      // Replace loading message with actual response
      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev.slice(0, -1), aiMessage]);

    } catch (err) {
      console.error('[usePrescriptionChat] Send message failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);

      // Replace loading with error message
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          id: generateId(),
          role: 'assistant',
          content: `❌ Sorry, I couldn't process your question. Please try again.`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [options, isLoading]);

  /**
   * Clear all messages and reset state
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    setIsAnalyzed(false);
    setError(null);
    isAnalyzingRef.current = false;
  }, []);

  return {
    messages,
    isLoading,
    error,
    isAnalyzed,
    analyzeInitialPrescription,
    sendMessage,
    clearChat
  };
}