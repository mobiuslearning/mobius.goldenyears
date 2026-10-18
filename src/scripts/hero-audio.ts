/**
 * 首页黑胶播放器：默认曲目《样样红》，支持播放 / 暂停 / 进度拖动。
 * 浏览器禁止无交互自动播放，因此默认展示为暂停态，点击唱片或播放键开始。
 */
const player = document.querySelector<HTMLElement>('[data-hero-player]');
const audio = document.querySelector<HTMLAudioElement>('[data-hero-audio]');

if (player && audio) {
  const toggles = Array.from(player.querySelectorAll<HTMLButtonElement>('[data-audio-toggle]'));
  const progress = player.querySelector<HTMLElement>('[data-audio-progress]');
  const track = player.querySelector<HTMLElement>('[data-audio-progress-track]');
  const timeEl = player.querySelector<HTMLElement>('[data-audio-time]');
  const statusEl = player.querySelector<HTMLElement>('[data-audio-status]');
  const statusDot = player.querySelector<HTMLElement>('[data-audio-dot]');
  let failed = false;

  const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
  };

  const setIcons = (playing: boolean) => {
    toggles.forEach((toggle) => {
      toggle.setAttribute('aria-pressed', String(playing));
      toggle.setAttribute('aria-label', playing ? '暂停《样样红》' : '播放《样样红》');
      toggle.querySelector<HTMLElement>('[data-icon-play]')?.classList.toggle('hidden', playing);
      toggle.querySelector<HTMLElement>('[data-icon-pause]')?.classList.toggle('hidden', !playing);
    });
  };

  const setStatus = (text: string, tone: 'idle' | 'playing' | 'error' = 'idle') => {
    if (statusEl) statusEl.textContent = text;
    if (statusDot) {
      statusDot.classList.toggle('bg-jade', tone === 'idle');
      statusDot.classList.toggle('bg-mustard', tone === 'playing');
      statusDot.classList.toggle('bg-vermilion', tone === 'error');
    }
  };

  const update = () => {
    const duration = audio.duration;
    const current = audio.currentTime;
    const ratio = Number.isFinite(duration) && duration > 0 ? Math.min(Math.max(current / duration, 0), 1) : 0;
    if (progress) progress.style.width = `${ratio * 100}%`;
    if (timeEl) timeEl.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    if (track) {
      track.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
      track.setAttribute('aria-valuetext', `${formatTime(current)} / ${formatTime(duration)}`);
    }
  };

  const setPlaying = (playing: boolean) => {
    player.classList.toggle('is-playing', playing);
    setIcons(playing);
  };

  audio.addEventListener('play', () => {
    setPlaying(true);
    setStatus('正在播放 · 样样红 / 黄安', 'playing');
  });
  audio.addEventListener('pause', () => {
    setPlaying(false);
    if (!failed) setStatus('已暂停 · 点击唱片或播放键继续', 'idle');
  });
  audio.addEventListener('timeupdate', update);
  audio.addEventListener('loadedmetadata', update);
  audio.addEventListener('durationchange', update);
  audio.addEventListener('ended', () => {
    setPlaying(false);
    update();
    setStatus('播放结束 · 再听一遍？', 'idle');
  });
  audio.addEventListener('error', () => {
    failed = true;
    setPlaying(false);
    setStatus('音频加载失败，请检查 /audio/yangyanghong.mp3', 'error');
    toggles.forEach((toggle) => {
      toggle.disabled = true;
      toggle.classList.add('opacity-40');
    });
  });

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', async () => {
      if (failed) return;
      if (audio.paused) {
        try {
          await audio.play();
        } catch {
          setStatus('浏览器拦截了自动播放，请再点击一次播放键', 'error');
        }
      } else {
        audio.pause();
      }
    });
  });

  if (track) {
    const seek = (clientX: number) => {
      if (failed || !Number.isFinite(audio.duration)) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      audio.currentTime = audio.duration * ratio;
      update();
    };
    track.addEventListener('click', (event) => seek(event.clientX));
    track.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const delta = event.key === 'ArrowRight' ? 5 : -5;
        audio.currentTime = Math.min(Math.max(audio.currentTime + delta, 0), audio.duration || 0);
        update();
      }
    });
  }

  setIcons(false);
  update();
}

export {};
