import * as React from "react";
import { PlayIcon, PauseIcon, SpeakerWaveIcon, TrashIcon } from "./icons";

interface AudioPlayerProps {
  src: string;
  onDelete?: () => void;
  className?: string;
  compact?: boolean;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  onDelete,
  className = "",
  compact = false,
}) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
    };
  }, [src]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error("Audio playback error:", err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Number(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <audio ref={audioRef} src={src} preload="metadata" />
        <button
          type="button"
          onClick={togglePlay}
          className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-xs"
          title={isPlaying ? "إيقاف مؤقت" : "تشغيل الملاحظة الصوتية"}
        >
          {isPlaying ? (
            <PauseIcon className="w-3.5 h-3.5" />
          ) : (
            <PlayIcon className="w-3.5 h-3.5" />
          )}
        </button>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <SpeakerWaveIcon className={`w-3.5 h-3.5 text-blue-600 ${isPlaying ? "animate-pulse" : ""}`} />
          <span>{formatTime(currentTime)}</span>
          {duration > 0 && <span className="text-gray-400">/ {formatTime(duration)}</span>}
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
            title="حذف الصوت"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-xs ${className}`}
      onClick={(e) => e.stopPropagation()}
      dir="ltr"
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-transform active:scale-95 shadow-sm"
        title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
      >
        {isPlaying ? (
          <PauseIcon className="w-5 h-5" />
        ) : (
          <PlayIcon className="w-5 h-5 ml-0.5" />
        )}
      </button>

      {/* Track & Time */}
      <div className="flex-grow flex flex-col justify-center gap-1">
        <div className="flex items-center justify-between text-xs font-mono text-slate-600">
          <span className="font-semibold text-blue-700">{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
        </div>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Speaker Icon & optional Delete */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="p-1.5 text-slate-400">
          <SpeakerWaveIcon className={`w-4 h-4 ${isPlaying ? "text-blue-600 animate-pulse" : ""}`} />
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
            title="حذف الملاحظة الصوتية"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;
