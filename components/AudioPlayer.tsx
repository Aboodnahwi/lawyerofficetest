import * as React from "react";
import { PlayIcon, PauseIcon, SpeakerWaveIcon, TrashIcon } from "./icons";

interface AudioPlayerProps {
  src: string;
  onDelete?: () => void;
  className?: string;
  compact?: boolean;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "00:00";
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
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setLoadError(false);
    const audio = audioRef.current;
    if (audio) {
      audio.load();
    }
  }, [src]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
      if ((!isFinite(duration) || duration === 0) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
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
      setLoadError(false);
    };

    const handleError = () => {
      setLoadError(true);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("error", handleError);
    };
  }, [duration, src]);

  const togglePlay = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.playbackRate = playbackRate;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("Audio playback notice:", err);
            setIsPlaying(false);
          });
      }
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

  const toggleRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const stopProp = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const maxSeek = isFinite(duration) && duration > 0 ? duration : (currentTime > 0 ? Math.max(currentTime + 1, 10) : 100);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 ${className}`}
        onClick={stopProp}
        onMouseDown={stopProp}
        onTouchStart={stopProp}
      >
        <audio ref={audioRef} src={src} preload="auto" playsInline />
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
          {isFinite(duration) && duration > 0 && <span className="text-gray-400">/ {formatTime(duration)}</span>}
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
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
      className={`flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl shadow-xs transition-colors select-none ${className}`}
      onClick={stopProp}
      onMouseDown={stopProp}
      onTouchStart={stopProp}
      onTouchEnd={stopProp}
      dir="ltr"
    >
      <audio ref={audioRef} src={src} preload="auto" playsInline />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full transition-transform active:scale-95 shadow-xs cursor-pointer"
        title={isPlaying ? "إيقاف مؤقت" : "تشغيل الملاحظة الصوتية"}
      >
        {isPlaying ? (
          <PauseIcon className="w-5 h-5" />
        ) : (
          <PlayIcon className="w-5 h-5 ml-0.5" />
        )}
      </button>

      {/* Track & Time */}
      <div className="flex-grow flex flex-col justify-center gap-1 min-w-0">
        <div className="flex items-center justify-between text-xs font-mono text-slate-600 px-0.5">
          <span className="font-semibold text-blue-700">{formatTime(currentTime)}</span>
          <span>{isFinite(duration) && duration > 0 ? formatTime(duration) : (isPlaying ? "--:--" : "تسجيل صوتي")}</span>
        </div>
        <input
          type="range"
          min={0}
          max={maxSeek}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
        />
      </div>

      {/* Speed Rate Button */}
      <button
        type="button"
        onClick={toggleRate}
        className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors flex-shrink-0"
        title="تغيير سرعة التشغيل"
      >
        {playbackRate}x
      </button>

      {/* Speaker Icon & optional Delete */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="p-1 text-slate-400">
          <SpeakerWaveIcon className={`w-4 h-4 ${isPlaying ? "text-blue-600 animate-pulse" : ""}`} />
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
            title="حذف الملاحظة الصوتية"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {loadError && (
        <span className="text-[10px] text-red-500 font-medium">تعذر تحميل الصوت</span>
      )}
    </div>
  );
};

export default AudioPlayer;
