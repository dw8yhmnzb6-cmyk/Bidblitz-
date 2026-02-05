/**
 * Voice Debug Assistant Component
 * Hotword-activated voice debugging for admin panel
 * Uses "Hey BidBlitz" to activate
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Mic, MicOff, AlertTriangle, CheckCircle, XCircle, 
  FileText, Loader2, Volume2, Bug, Sparkles, X,
  AlertCircle, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Translations
const translations = {
  de: {
    title: 'Sprach-Debug-Assistent',
    subtitle: 'Sage "Hey BidBlitz" um einen Fehler zu melden',
    listening: 'Höre zu...',
    recording: 'Aufnahme läuft...',
    processing: 'Verarbeite...',
    analyzing: 'Analysiere Fehler...',
    hotwordDetected: 'Hey BidBlitz erkannt! Beschreibe den Fehler...',
    speakNow: 'Sprich jetzt...',
    stopRecording: 'Aufnahme stoppen',
    startListening: 'Zuhören starten',
    stopListening: 'Zuhören stoppen',
    errorReport: 'Fehler-Report',
    description: 'Beschreibung',
    severity: 'Schweregrad',
    possibleCauses: 'Mögliche Ursachen',
    affectedFiles: 'Betroffene Dateien',
    recommendations: 'Empfehlungen',
    transcription: 'Transkription',
    noMicrophone: 'Kein Mikrofon gefunden',
    microphoneError: 'Mikrofon-Fehler',
    analysisComplete: 'Analyse abgeschlossen!',
    analysisFailed: 'Analyse fehlgeschlagen',
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
    critical: 'Kritisch',
    waitingForHotword: 'Warte auf "Hey BidBlitz"...',
    newReport: 'Neuer Report',
    close: 'Schließen',
  },
  en: {
    title: 'Voice Debug Assistant',
    subtitle: 'Say "Hey BidBlitz" to report a bug',
    listening: 'Listening...',
    recording: 'Recording...',
    processing: 'Processing...',
    analyzing: 'Analyzing error...',
    hotwordDetected: 'Hey BidBlitz detected! Describe the error...',
    speakNow: 'Speak now...',
    stopRecording: 'Stop recording',
    startListening: 'Start listening',
    stopListening: 'Stop listening',
    errorReport: 'Error Report',
    description: 'Description',
    severity: 'Severity',
    possibleCauses: 'Possible Causes',
    affectedFiles: 'Affected Files',
    recommendations: 'Recommendations',
    transcription: 'Transcription',
    noMicrophone: 'No microphone found',
    microphoneError: 'Microphone error',
    analysisComplete: 'Analysis complete!',
    analysisFailed: 'Analysis failed',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
    waitingForHotword: 'Waiting for "Hey BidBlitz"...',
    newReport: 'New Report',
    close: 'Close',
  }
};

const severityColors = {
  low: 'bg-blue-100 text-blue-700 border-blue-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  critical: 'bg-red-100 text-red-700 border-red-300',
};

const severityIcons = {
  low: <Info className="w-5 h-5" />,
  medium: <AlertCircle className="w-5 h-5" />,
  high: <AlertTriangle className="w-5 h-5" />,
  critical: <XCircle className="w-5 h-5" />,
};

export const VoiceDebugAssistant = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const { language } = useLanguage();
  const t = translations[language] || translations.de;
  
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hotwordDetected, setHotwordDetected] = useState(false);
  const [report, setReport] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    causes: true,
    files: true,
    recommendations: true,
  });
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  
  // Initialize Speech Recognition for hotword detection
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech Recognition not supported');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language === 'de' ? 'de-DE' : 'en-US';
    
    recognitionRef.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript.toLowerCase())
        .join(' ');
      
      // Check for hotword
      if (transcript.includes('hey bidblitz') || 
          transcript.includes('hey bid blitz') ||
          transcript.includes('hey bitblitz')) {
        setHotwordDetected(true);
        startRecording();
      }
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error(t.microphoneError);
      }
    };
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, t.microphoneError]);
  
  // Start listening for hotword
  const startListening = useCallback(async () => {
    try {
      // Request microphone permission
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success(t.waitingForHotword);
      }
    } catch (err) {
      console.error('Microphone error:', err);
      toast.error(t.noMicrophone);
    }
  }, [t.waitingForHotword, t.noMicrophone]);
  
  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsListening(false);
    setHotwordDetected(false);
  }, []);
  
  // Start recording after hotword
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Stop speech recognition during recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await analyzeAudio(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      toast.success(t.hotwordDetected);
      
      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 30000);
      
    } catch (err) {
      console.error('Recording error:', err);
      toast.error(t.microphoneError);
    }
  }, [t.hotwordDetected, t.microphoneError]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setHotwordDetected(false);
  }, []);
  
  // Analyze audio
  const analyzeAudio = async (audioBlob) => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);
      
      const response = await axios.post(
        `${API}/api/admin/voice-debug/analyze`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success && response.data.report) {
        setReport(response.data.report);
        toast.success(t.analysisComplete);
      } else {
        toast.error(response.data.error || t.analysisFailed);
      }
      
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error(t.analysisFailed);
    } finally {
      setIsProcessing(false);
      setIsListening(false);
    }
  };
  
  // Toggle section
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Reset for new report
  const resetForNewReport = () => {
    setReport(null);
    setHotwordDetected(false);
    setIsRecording(false);
    setIsProcessing(false);
    startListening();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Bug className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t.title}</h2>
                <p className="text-white/80 text-sm">{t.subtitle}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Status Display */}
          {!report && (
            <div className="text-center py-8">
              {/* Microphone Animation */}
              <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 transition-all ${
                isRecording 
                  ? 'bg-red-100 animate-pulse' 
                  : isListening 
                    ? 'bg-green-100 animate-pulse' 
                    : isProcessing
                      ? 'bg-purple-100'
                      : 'bg-gray-100'
              }`}>
                {isProcessing ? (
                  <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
                ) : isRecording ? (
                  <Mic className="w-16 h-16 text-red-600 animate-pulse" />
                ) : isListening ? (
                  <Volume2 className="w-16 h-16 text-green-600" />
                ) : (
                  <MicOff className="w-16 h-16 text-gray-400" />
                )}
              </div>
              
              {/* Status Text */}
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                {isProcessing 
                  ? t.analyzing 
                  : isRecording 
                    ? t.recording 
                    : hotwordDetected
                      ? t.speakNow
                      : isListening 
                        ? t.waitingForHotword 
                        : t.subtitle}
              </p>
              
              {/* Hotword hint */}
              {isListening && !isRecording && !hotwordDetected && (
                <div className="flex items-center justify-center gap-2 text-purple-600 mt-4">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-mono">"Hey BidBlitz, es gibt einen Fehler..."</span>
                </div>
              )}
              
              {/* Control Buttons */}
              <div className="flex justify-center gap-4 mt-8">
                {isRecording ? (
                  <Button 
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white"
                    disabled={isProcessing}
                  >
                    <MicOff className="w-5 h-5 mr-2" />
                    {t.stopRecording}
                  </Button>
                ) : isListening ? (
                  <Button 
                    onClick={stopListening}
                    variant="outline"
                    className="border-gray-300"
                    disabled={isProcessing}
                  >
                    <MicOff className="w-5 h-5 mr-2" />
                    {t.stopListening}
                  </Button>
                ) : (
                  <Button 
                    onClick={startListening}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    disabled={isProcessing}
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    {t.startListening}
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Report Display */}
          {report && (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">{t.errorReport}</h3>
                    <p className="text-sm text-gray-500">{report.id}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${severityColors[report.severity]}`}>
                  {severityIcons[report.severity]}
                  <span className="ml-1">{t[report.severity]}</span>
                </span>
              </div>
              
              {/* Transcription */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">{t.transcription}</p>
                <p className="text-gray-800 dark:text-gray-200 italic">"{report.transcription}"</p>
              </div>
              
              {/* Description */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">{t.description}</p>
                <p className="text-gray-800 dark:text-gray-200">{report.description}</p>
              </div>
              
              {/* Possible Causes */}
              <div className="border rounded-lg dark:border-gray-700">
                <button 
                  onClick={() => toggleSection('causes')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">{t.possibleCauses}</span>
                    <span className="text-sm text-gray-500">({report.possible_causes.length})</span>
                  </div>
                  {expandedSections.causes ? <ChevronUp /> : <ChevronDown />}
                </button>
                {expandedSections.causes && (
                  <div className="px-4 pb-4">
                    <ul className="space-y-2">
                      {report.possible_causes.map((cause, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                          <span className="text-orange-500 mt-1">•</span>
                          {cause}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Affected Files */}
              <div className="border rounded-lg dark:border-gray-700">
                <button 
                  onClick={() => toggleSection('files')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">{t.affectedFiles}</span>
                    <span className="text-sm text-gray-500">({report.affected_files.length})</span>
                  </div>
                  {expandedSections.files ? <ChevronUp /> : <ChevronDown />}
                </button>
                {expandedSections.files && (
                  <div className="px-4 pb-4">
                    <ul className="space-y-2">
                      {report.affected_files.map((file, i) => (
                        <li key={i} className="font-mono text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                          {file}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Recommendations */}
              <div className="border rounded-lg dark:border-gray-700">
                <button 
                  onClick={() => toggleSection('recommendations')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">{t.recommendations}</span>
                    <span className="text-sm text-gray-500">({report.recommendations.length})</span>
                  </div>
                  {expandedSections.recommendations ? <ChevronUp /> : <ChevronDown />}
                </button>
                {expandedSections.recommendations && (
                  <div className="px-4 pb-4">
                    <ul className="space-y-2">
                      {report.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                          <span className="text-green-500 mt-1">✓</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* New Report Button */}
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={resetForNewReport}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  {t.newReport}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceDebugAssistant;
