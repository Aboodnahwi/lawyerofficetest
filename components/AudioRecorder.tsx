import * as React from "react";
import {
  MicrophoneIcon,
  StopIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  TrashIcon,
} from "./icons";
import AudioPlayer from "./AudioPlayer";

interface AudioRecorderProps {
  audioUrl?: string;
  onAudioChange: (audioUrl: string | undefined) => void;
  className?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  audioUrl,
  onAudioChange,
  className = "",
}) => {
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingDuration, setRecordingDuration] = React.useState(0);
  const [permissionError, setPermissionError] = React.useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<any>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getSupportedMimeType = (): string => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/wav",
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  };

  const startRecording = async () => {
    setPermissionError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError("المتصفح لا يدعم تسجيل الصوت المباشر من هذا الجهاز.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });

        // Convert to base64 Data URL for universal storage and playback
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onAudioChange(base64Audio);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(200); // chunk every 200ms
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionError("يرجى منح إذن الوصول إلى الميكروفون لتسجيل الملاحظة الصوتية.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setPermissionError("لم يتم العثور على ميكروفون متصل بالجهاز.");
      } else {
        setPermissionError("تعذر بدء التسجيل الصوتي. يرجى التحقق من إعدادات الميكروفون.");
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setPermissionError("يرجى اختيار ملف صوتي صالح.");
      return;
    }

    // Read audio file as base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onAudioChange(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeleteAudio = () => {
    onAudioChange(undefined);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* If Audio is already recorded/attached */}
      {audioUrl && !isRecording && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ملاحظة صوتية مرفقة
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startRecording}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                title="إعادة التسجيل"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
                إعادة التسجيل
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={handleDeleteAudio}
                className="text-xs font-medium text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
                title="حذف التسجيل"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                حذف
              </button>
            </div>
          </div>
          <AudioPlayer src={audioUrl} onDelete={handleDeleteAudio} />
        </div>
      )}

      {/* Active Recording View */}
      {isRecording && (
        <div className="p-4 bg-red-50/80 border-2 border-red-200 rounded-xl space-y-3 transition-all animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-red-700">جاري تسجيل الملاحظة الصوتية...</span>
                <span className="text-lg font-mono font-bold text-red-900 leading-tight">
                  {formatTimer(recordingDuration)}
                </span>
              </div>
            </div>

            {/* Audio wave animation */}
            <div className="flex items-center gap-1 h-6">
              {[40, 70, 100, 60, 90, 45, 80, 50, 95, 30].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 100}ms`,
                    animationDuration: "800ms",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action buttons during recording */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-red-100">
            <button
              type="button"
              onClick={cancelRecording}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg flex items-center gap-1 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              إلغاء
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            >
              <StopIcon className="w-4 h-4" />
              إنهاء وحفظ التسجيل
            </button>
          </div>
        </div>
      )}

      {/* Initial state: Buttons to start recording or upload */}
      {!audioUrl && !isRecording && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startRecording}
              className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-semibold text-sm transition-all active:scale-98 shadow-xs"
            >
              <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center">
                <MicrophoneIcon className="w-4 h-4" />
              </div>
              <span>تسجيل ملاحظة صوتية فوراً</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-medium transition-colors"
              title="رفع ملف صوتي مسجل من الجهاز"
            >
              <ArrowUpTrayIcon className="w-4 h-4 text-gray-500" />
              <span>رفع ملف صوتي</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {permissionError && (
        <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span>{permissionError}</span>
          <button
            type="button"
            onClick={() => setPermissionError(null)}
            className="text-red-500 hover:text-red-800"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
