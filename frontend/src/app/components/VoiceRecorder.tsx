import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Square, Play, Pause, Trash2, Volume2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { LanguageCode, LANGUAGES, getTranslation } from "../lib/i18n";

interface VoiceRecorderProps {
  language: LanguageCode;
  onTranscript: (text: string) => void;
  onAudioRecorded?: (audioBase64: string | null) => void;
  onStartRecording?: () => void;
}

export default function VoiceRecorder({ language, onTranscript, onAudioRecorded, onStartRecording }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const t = (key: string) => getTranslation(language, key);
  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Initialize SpeechRecognition if supported by browser
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Cleanup timers & streams on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
    };
  }, []);

  const startRecording = async () => {
    setAudioUrl(null);
    setTranscript("");
    setRecordingTime(0);
    audioChunksRef.current = [];

    if (onStartRecording) onStartRecording();

    // 1. Start MediaRecorder for audio recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert blob to base64 for persistent submission
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          if (onAudioRecorded) onAudioRecorded(base64data);
        };

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 120) { // Max 2 minutes
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // 2. Start SpeechRecognition for real-time speech-to-text
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = currentLangObj.speechLocale;

          recognition.onresult = (event: any) => {
            let accumulated = "";
            for (let i = 0; i < event.results.length; ++i) {
              accumulated += event.results[i][0].transcript;
            }
            const cleaned = accumulated.trim();
            if (cleaned) {
              setTranscript(cleaned);
              onTranscript(cleaned);
            }
          };

          recognition.onerror = (err: any) => {
            console.warn("[VoiceRecorder Speech Error]", err);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("[VoiceRecorder Speech Init Error]", e);
        }
      }
    } catch (err) {
      console.error("[VoiceRecorder Permission/Device Error]", err);
      alert("Microphone access is required to record audio. Please grant permission in your browser.");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch {}
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current || !audioUrl) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteRecording = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setTranscript("");
    if (onAudioRecorded) onAudioRecorded(null);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{
      background: "rgba(15,23,42,0.6)",
      border: "1px solid rgba(59,130,246,0.2)",
      borderRadius: 14,
      padding: "16px 20px",
      marginTop: 14,
      backdropFilter: "blur(10px)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa"
          }}>
            <Mic size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>
              {t("voice_rec_title")}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {t("voice_rec_subtitle")} ({currentLangObj.nativeName})
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {isRecording && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 20,
            background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)",
            color: "#fca5a5", fontSize: 12, fontWeight: 600
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />
            <span>{formatTimer(recordingTime)}</span>
          </div>
        )}
      </div>

      {/* Recording & Controls Panel */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 10,
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              border: "1px solid rgba(147,197,253,0.3)",
              color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
              transition: "all 0.2s ease"
            }}
          >
            <Mic size={16} />
            <span>{t("voice_start_rec")}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 10,
              background: "linear-gradient(135deg, #dc2626, #b91c1c)",
              border: "1px solid rgba(252,165,165,0.4)",
              color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: "pointer", boxShadow: "0 4px 14px rgba(220,38,38,0.3)",
              transition: "all 0.2s ease"
            }}
          >
            <Square size={16} fill="white" />
            <span>{t("voice_stop_rec")}</span>
          </button>
        )}

        {/* Live Audio Waves Animation when recording */}
        {isRecording && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, height: 24 }}>
            {[40, 70, 30, 90, 50, 80, 40, 60].map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: ["20%", `${h}%`, "20%"] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.08 }}
                style={{ width: 3, background: "#60a5fa", borderRadius: 2 }}
              />
            ))}
            <span style={{ fontSize: 12, color: "#93c5fd", marginLeft: 6, fontWeight: 500 }}>
              {t("voice_transcribing")}
            </span>
          </div>
        )}

        {/* Audio Player Preview */}
        {audioUrl && !isRecording && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "6px 14px", borderRadius: 10,
            background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.1)",
            flex: 1, minWidth: 220
          }}>
            <button
              type="button"
              onClick={togglePlayback}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)",
                color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer"
              }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#34d399", display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={12} />
                <span>{t("voice_attached")} ({formatTimer(recordingTime)})</span>
              </div>
              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                style={{ display: "none" }}
              />
            </div>
            <button
              type="button"
              onClick={deleteRecording}
              title={t("voice_delete_rec")}
              style={{
                background: "none", border: "none", color: "#ef4444",
                cursor: "pointer", padding: 4, display: "flex", alignItems: "center"
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Live Transcribed Text Output Box */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 8,
            background: "rgba(30,41,59,0.5)", border: "1px stroke rgba(59,130,246,0.2)",
            color: "#e2e8f0", fontSize: 13, lineHeight: 1.5
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: "#60a5fa", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={12} />
            <span>Speech-to-Text ({currentLangObj.name}):</span>
          </div>
          <div>"{transcript}"</div>
        </motion.div>
      )}
    </div>
  );
}
