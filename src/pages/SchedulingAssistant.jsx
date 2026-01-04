import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Send, 
  Loader2,
  Sparkles,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import MessageBubble from '../components/agents/MessageBubble';
import PageHeader from '../components/ui/PageHeader';

export default function SchedulingAssistant() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // Initialize or restore conversation on mount
  useEffect(() => {
    if (user) {
      initializeConversation();
    }
  }, [user]);

  const initializeConversation = async () => {
    setIsLoading(true);
    try {
      // Check if we have a stored conversation ID
      const storedConvId = localStorage.getItem('scheduling_conversation_id');
      
      let conv;
      if (storedConvId) {
        try {
          // Try to load existing conversation
          conv = await base44.agents.getConversation(storedConvId);
          setMessages(conv.messages || []);
        } catch (error) {
          // If conversation not found, create new one
          console.log('Stored conversation not found, creating new one');
          conv = null;
        }
      }
      
      if (!conv) {
        // Create new conversation
        conv = await base44.agents.createConversation({
          agent_name: "schedule_coordinator",
          metadata: {
            name: "Scheduling Session",
            description: "AI-assisted appointment scheduling",
          }
        });
        localStorage.setItem('scheduling_conversation_id', conv.id);
        
        // Send initial message to trigger proactive analysis
        await base44.agents.addMessage(conv, {
          role: "user",
          content: "Hi! Please review my schedule and suggest any optimizations.",
        });
      }
      
      setConversation(conv);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      setIsLoading(false);
    }
  };

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setIsSending(false);
    });

    return () => unsubscribe();
  }, [conversation?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !conversation || isSending) return;

    setIsSending(true);
    const userMessage = message;
    setMessage('');

    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: userMessage,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <PageHeader 
        title="AI Scheduling Assistant"
        subtitle="Get help optimizing your appointments"
      />

      {/* Messages Area */}
      <div className="flex-1 bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-stone-800 mb-2">
                AI Scheduling Assistant
              </h3>
              <p className="text-stone-500 max-w-md mb-6">
                I can help you optimize your schedule, find the best appointment times, 
                and suggest efficient routes between yards.
              </p>
              <div className="space-y-2 w-full max-w-md">
                <button
                  onClick={() => setMessage("What appointments do I have this week?")}
                  className="w-full p-3 bg-stone-50 hover:bg-stone-100 rounded-xl text-left text-sm text-stone-700 transition-colors"
                >
                  <Calendar className="w-4 h-4 inline mr-2 text-emerald-600" />
                  What appointments do I have this week?
                </button>
                <button
                  onClick={() => setMessage("Suggest the best time for a new appointment")}
                  className="w-full p-3 bg-stone-50 hover:bg-stone-100 rounded-xl text-left text-sm text-stone-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4 inline mr-2 text-emerald-600" />
                  Suggest the best time for a new appointment
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-stone-200 p-4">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about scheduling, availability, or route optimization..."
              className="rounded-xl resize-none"
              rows={2}
              disabled={isSending}
            />
            <Button 
              onClick={handleSend}
              disabled={!message.trim() || isSending}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-auto px-4"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}