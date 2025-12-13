'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, FileText, Clock, User, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface PatientHealthSummaryProps {
  patientId: string;
  organizationId: string;
  organizationSlug: string;
}

interface Analysis {
  id: string;
  analysis_content: string;
  summary: string;
  health_status: string;
  risk_factors: string[];
  recommendations: string[];
  requested_by: string;
  requester_name: string;
  created_at: string;
  version: number;
}

export default function PatientHealthSummary({ 
  patientId, 
  organizationId,
  organizationSlug 
}: PatientHealthSummaryProps) {
  const supabase = createClient();
  
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  // Fetch existing analysis on load
  useEffect(() => {
    fetchLatestAnalysis();
  }, [patientId, organizationId]);

  const fetchLatestAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('patient_ai_analysis')
        .select('*')
        .eq('patient_id', patientId)
        .eq('org_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        throw fetchError;
      }

      setAnalysis(data);
    } catch (err: any) {
      console.error('Error fetching analysis:', err);
      // Don't show error for "no analysis found"
      if (err.code !== 'PGRST116') {
        setError('Failed to load health summary');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAnalysis = async () => {
    try {
      setGenerating(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const webhookUrl = process.env.NEXT_PUBLIC_N8N_ANALYSIS_WEBHOOK_URL ||
        'https://n8n.nhcare.in/webhook/patient-comprehensive-analysis';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          org_id: organizationId,
          requested_by: 'patient',
          requester_id: user?.id || patientId,
          requester_name: user?.email || 'Patient',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate analysis');
      }

      const result = await response.json();

      if (result.success) {
        // Refresh to get the new analysis
        await fetchLatestAnalysis();
      } else {
        throw new Error(result.error || 'Analysis generation failed');
      }
    } catch (err: any) {
      console.error('Error generating analysis:', err);
      setError(err.message || 'Failed to generate health summary');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getHealthStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'good':
      case 'stable':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'moderate':
      case 'attention needed':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'critical':
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="ml-2 text-gray-400">Loading health summary...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">My Health Summary</h2>
            <p className="text-xs text-gray-400">AI-powered comprehensive analysis</p>
          </div>
        </div>

        <button
          onClick={handleGenerateAnalysis}
          disabled={generating}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            generating
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30'
          }`}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {analysis ? 'Refresh Analysis' : 'Generate Analysis'}
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* No Analysis Yet */}
      {!analysis && !error && (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No health summary available yet</p>
          <p className="text-gray-500 text-sm">
            Click "Generate Analysis" to create your personalized health summary based on your prescription history.
          </p>
        </div>
      )}

      {/* Analysis Content */}
      {analysis && (
        <div className="space-y-4">
          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3" />
              {formatDate(analysis.created_at)}
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <User className="w-3 h-3" />
              Requested by: {analysis.requested_by === 'patient' ? 'You' : analysis.requester_name || 'Your Doctor'}
            </div>
            {analysis.version > 1 && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                v{analysis.version}
              </span>
            )}
          </div>

          {/* Health Status */}
          {analysis.health_status && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getHealthStatusColor(analysis.health_status)}`}>
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">{analysis.health_status}</span>
            </div>
          )}

          {/* Summary */}
          {analysis.summary && (
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-cyan-400 mb-2">Summary</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {/* Risk Factors */}
          {analysis.risk_factors && analysis.risk_factors.length > 0 && (
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-400 mb-2">Risk Factors</h3>
              <ul className="space-y-1">
                {analysis.risk_factors.map((risk, index) => (
                  <li key={index} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-400 mb-2">Recommendations</h3>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Analysis Toggle */}
          {analysis.analysis_content && (
            <div>
              <button
                onClick={() => setShowFullAnalysis(!showFullAnalysis)}
                className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
              >
                {showFullAnalysis ? '▼ Hide Full Analysis' : '▶ Show Full Analysis'}
              </button>
              
              {showFullAnalysis && (
                <div className="mt-3 bg-slate-700/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                    {analysis.analysis_content}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-gray-500 text-xs">
          ⚠️ This AI-generated summary is for informational purposes only and should not replace professional medical advice. 
          Always consult your healthcare provider for medical decisions.
        </p>
      </div>
    </div>
  );
}