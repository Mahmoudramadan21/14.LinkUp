// app/messages/components/VoiceRecorder.tsx
'use client';

import {
  useState,
  useRef,
  useEffect,
  memo,
  useCallback,
} from 'react';
import { Mic, Square, Trash2, Send, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { addOptimisticMessage, markMessageAsFailed, replaceOptimisticMessage, sendMessageThunk } from '@/store/messageSlice';
import { v4 as uuidv4 } from 'uuid';

/**
 * VoiceRecorder
 * Full-featured voice message recorder with live waveform visualization.
 *
 * Features:
 * - Real-time animated waveform (canvas + analyzer)
 * - Record / Pause / Resume / Stop
 * - Visual feedback (pulse, color changes)
 * - Auto-generated playback preview
 * - Upload as .webm (Opus) or fallback to mp4
 * - Memory-safe cleanup (streams, URLs, animations)
 * - Accessible with proper ARIA labels
 * - Beautiful dark modal UI
 */
const VoiceRecorder = memo(
  ({ conversationId, onClose }: { conversationId: string; onClose: () => void }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [waveform, setWaveform] = useState<number[]>([]);

    const dispatch = useDispatch<AppDispatch>();

    const currentUser = useSelector((state: RootState) => state.auth.user);

    // Live refs (avoid stale closures)
    const isRecordingRef = useRef(false);
    const isPausedRef = useRef(false);
    const startTimeRef = useRef<number>(0);
    const animationRef = useRef<number | null>(null);

    // Core refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    /* -------------------------------------------------------------------------- */
    /*                               Utility Functions                            */
    /* -------------------------------------------------------------------------- */

    const formatDuration = (seconds: number): string => {
      const mins = Math.floor(seconds / 60)
        .toString()
        .padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
    };

    const updateTimer = useCallback(() => {
      if (isRecordingRef.current && !isPausedRef.current && startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }
      animationRef.current = requestAnimationFrame(updateTimer);
    }, []);

    /* -------------------------------------------------------------------------- */
    /*                               Recording Controls                           */
    /* -------------------------------------------------------------------------- */

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/mp4';

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          if (audioChunksRef.current.length === 0) return;
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        };

        mediaRecorder.start();
        setIsRecording(true);
        isRecordingRef.current = true;
        isPausedRef.current = false;
        startTimeRef.current = Date.now() - (duration * 1000);

        animationRef.current = requestAnimationFrame(updateTimer);
        drawWaveform();
      } catch {
        alert('Please allow microphone access to record voice messages.');
      }
    };

    const stopRecording = useCallback(() => {
      if (!mediaRecorderRef.current || !isRecordingRef.current) return;

      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());

      setIsRecording(false);
      isRecordingRef.current = false;

      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }, []);

    const togglePause = useCallback(() => {
      if (!mediaRecorderRef.current || !isRecordingRef.current) return;

      if (isPausedRef.current) {
        mediaRecorderRef.current.resume();
        startTimeRef.current = Date.now() - duration * 1000;
        isPausedRef.current = false;
        animationRef.current = requestAnimationFrame(updateTimer);
      } else {
        mediaRecorderRef.current.pause();
        isPausedRef.current = true;
        if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      }
      setIsPaused((p) => !p);
    }, [duration, updateTimer]);

    // const deleteRecording = useCallback(() => {
    //   if (audioUrl) URL.revokeObjectURL(audioUrl);
    //   setAudioUrl(null);
    //   setDuration(0);
    //   setWaveform([]);
    //   audioChunksRef.current = [];
    // }, [audioUrl]);

    /* -------------------------------------------------------------------------- */
    /*                                 Send Voice Message                         */
    /* -------------------------------------------------------------------------- */

    const sendVoice = async () => {
      if (!audioUrl) return;

      const localId = uuidv4();
      const now = new Date().toISOString();

      try {
        const blob = await fetch(audioUrl).then((r) => r.blob());
        const voiceFile = new File([blob], `voice-${Date.now()}.webm`, {
          type: blob.type || 'audio/webm',
        });

        const tempMessage: any = {
          Id: localId,
          LocalId: localId,
          ConversationId: conversationId,
          Content: null,
          Sender: {
            UserID: currentUser!.userId,
            Username: currentUser!.username || 'You',
            ProfilePicture: currentUser!.profilePicture,
          },
          CreatedAt: now,
          UpdatedAt: now,
          Status: 'SENDING',
          Attachments: [
            {
              Id: localId + "-voice",
              MessageId: localId, 
              Url: audioUrl,
              Type: "VOICE",

              FileName: voiceFile.name,
              FileSize: voiceFile.size,
              Duration: duration || null,
              Thumbnail: null,
              Metadata: null,
            },
          ],
        };

        dispatch(
          addOptimisticMessage({
            conversationId,
            message: tempMessage,
          })
        );

        onClose();

        const result = await dispatch(
          sendMessageThunk({
            conversationId,
            data: {}, 
            attachment: voiceFile,
          })
        ).unwrap();

        dispatch(
          replaceOptimisticMessage({
            conversationId,
            localId,
            realMessage: result,
          })
        );
      } catch {
        dispatch(
          markMessageAsFailed({
            conversationId,
            localId,
          })
        );

      }
    };

    /* -------------------------------------------------------------------------- */
    /*                               Live Waveform Drawing                        */
    /* -------------------------------------------------------------------------- */

    const drawWaveform = useCallback(() => {
      if (!canvasRef.current || !streamRef.current || !isRecordingRef.current || isPausedRef.current)
        return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(streamRef.current);
      source.connect(analyser);
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!isRecordingRef.current || isPausedRef.current) return;
        requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.6;
          ctx.fillStyle = `rgb(${139 + barHeight}, 92, 246)`;
          ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);
          x += barWidth + 1;
        }

        // Update static waveform preview
        setWaveform((prev) => {
          const newData = Array.from(dataArray.slice(0, 8)).map((v) => v / 255);
          return [...prev, ...newData].slice(-50);
        });
      };

      draw();
    }, []);

    /* -------------------------------------------------------------------------- */
    /*                                   Cleanup                                  */
    /* -------------------------------------------------------------------------- */

    useEffect(() => {
      return () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
        streamRef.current?.getTracks().forEach((track) => track.stop());
      };
    }, [audioUrl]);

    /* -------------------------------------------------------------------------- */
    /*                               Focus Management                             */
    /* -------------------------------------------------------------------------- */
    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }, []);

    /* -------------------------------------------------------------------------- */
    /*                                     Render                                 */
    /* -------------------------------------------------------------------------- */

    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-recorder-title"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <h2 id="voice-recorder-title" className="sr-only">
          Record Voice Message
        </h2>

        <div
          className="w-full max-w-md rounded-2xl bg-[var(--card-bg)] p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Record Voice Message
            </h3>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Close recorder"
            >
              <X size={20} />
            </button>
          </div>

          {/* Waveform Canvas */}
          <div className="relative mb-6 h-32 bg-slate-800 rounded-xl overflow-hidden">
            <canvas
              ref={canvasRef}
              width={400}
              height={128}
              className="absolute inset-0 w-full h-full"
              aria-hidden="true"
            />

            {/* Static waveform after recording */}
            {audioUrl && waveform.length > 0 && (
              <div className="flex h-full items-center justify-center p-4">
                <div className="flex gap-1 h-full items-end">
                  {waveform.map((value, i) => (
                    <div
                      key={i}
                      className="w-1 bg-[var(--linkup-purple)] rounded-full transition-all duration-100"
                      style={{ height: `${Math.max(value * 100, 5)}%` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            {audioUrl ? (
              <>
                {/* Delete */}
                <button
                  // onClick={deleteRecording}
                  className="p-3 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                  aria-label="Delete recording"
                >
                  <Trash2 size={20} />
                </button>

                {/* Duration */}
                <div className="flex-1 text-center">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    {formatDuration(duration)}
                  </p>
                </div>

                {/* Send */}
                <button
                  onClick={sendVoice}
                  className="p-3 rounded-full bg-[var(--linkup-purple)] text-white hover:bg-[var(--linkup-purple-light)] disabled:opacity-50 transition-all"
                  aria-label="Send voice message"
                >
                  <Send size={20} />
                </button>
              </>
            ) : (
              <>
                {/* Record / Pause Button */}
                <button
                  onClick={isRecording ? togglePause : startRecording}
                  className={`p-4 rounded-full transition-all ${
                    isRecording
                      ? isPaused
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-red-500/20 text-red-500 animate-pulse'
                      : 'bg-[var(--linkup-purple)] text-white hover:bg-[var(--linkup-purple-light)]'
                  }`}
                  aria-label={isRecording ? (isPaused ? 'Resume recording' : 'Pause recording') : 'Start recording'}
                >
                  {isRecording ? (isPaused ? <Mic size={28} /> : <Square size={28} />) : <Mic size={28} />}
                </button>

                {/* Timer + Status */}
                {isRecording && (
                  <>
                    <div className="flex-1 text-center">
                      <p className="text-lg font-mono text-[var(--linkup-purple)]">
                        {formatDuration(duration)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {isPaused ? 'Paused' : 'Recording...'}
                      </p>
                    </div>

                    {/* Stop Button */}
                    <button
                      onClick={stopRecording}
                      className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                      aria-label="Stop recording"
                    >
                      <Square size={20} />
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Hint */}
          {!isRecording && !audioUrl && (
            <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
              Tap the microphone to start recording
            </p>
          )}
        </div>
      </div>
    );
  }
);

VoiceRecorder.displayName = 'VoiceRecorder';

export default VoiceRecorder;