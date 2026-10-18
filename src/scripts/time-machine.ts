/**
 * 时光机：根据出生年份，在浏览器端生成一张「年代记忆卡」。
 * 数据由页面通过 <script type="application/json" data-tm-data> 注入。
 */

interface TmEvent {
  y: number;
  s: 'china' | 'global';
  c: string;
  t: string;
  d: string;
}
interface TmSong {
  y: number;
  t: string;
  a: string;
  r: string;
  l?: string;
  d: string;
}
interface TmMovie {
  y: number;
  t: string;
  ty: string;
  r: string;
  q?: string;
  d: string;
}
interface TmToy {
  y: number;
  e?: number;
  n: string;
  c: string;
  d: string;
  m?: string;
}
interface TmEra {
  id: string;
  label: string;
  years: string;
  name: string;
  mood: string;
}

interface TmData {
  minYear: number;
  maxYear: number;
  events: TmEvent[];
  songs: TmSong[];
  movies: TmMovie[];
  toys: TmToy[];
  eras: TmEra[];
}

const $ = <T extends HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<T>(selector);

const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function nearest<T extends { y: number }>(items: T[], year: number, tolerance = 3): T[] {
  return items
    .filter((item) => Math.abs(item.y - year) <= tolerance)
    .sort((a, b) => Math.abs(a.y - year) - Math.abs(b.y - year));
}

function nearestAfter<T extends { y: number }>(items: T[], year: number, tolerance = 3): T[] {
  return items
    .filter((item) => Math.abs(item.y - year) <= tolerance)
    .sort((a, b) => {
      const aAfter = a.y >= year ? 0 : 1;
      const bAfter = b.y >= year ? 0 : 1;
      return aAfter - bAfter || Math.abs(a.y - year) - Math.abs(b.y - year);
    });
}

function yearSpan(birth: number, fromAge: number, toAge: number, min: number, max: number) {
  const start = clamp(birth + fromAge, min, max);
  const end = clamp(birth + toAge, min, max);
  return start <= end ? `${start}—${end}` : `${end}`;
}

function init() {
  const dataEl = $<HTMLScriptElement>('[data-tm-data]');
  const form = $<HTMLFormElement>('[data-tm-form]');
  const input = $<HTMLInputElement>('[data-tm-input]');
  const results = $<HTMLElement>('[data-tm-results]');
  const placeholder = $<HTMLElement>('[data-tm-placeholder]');
  if (!dataEl || !form || !input || !results) return;

  let data: TmData;
  try {
    data = JSON.parse(dataEl.textContent ?? '{}') as TmData;
  } catch {
    return;
  }
  if (!data.events?.length) return;

  const currentYear = new Date().getFullYear();
  const MIN = data.minYear;
  const MAX = data.maxYear;

  const summaryEl = $<HTMLElement>('[data-tm-summary]');
  const milestonesEl = $<HTMLElement>('[data-tm-milestones]');
  const songsEl = $<HTMLElement>('[data-tm-songs]');
  const moviesEl = $<HTMLElement>('[data-tm-movies]');
  const toysEl = $<HTMLElement>('[data-tm-toys]');
  const eventsEl = $<HTMLElement>('[data-tm-events]');
  const noteEl = $<HTMLElement>('[data-tm-note]');
  const copyButton = $<HTMLButtonElement>('[data-tm-copy]');
  const copyStatus = $<HTMLElement>('[data-tm-copy-status]');

  let latestYear = 1990;

  function render(year: number, isDemo: boolean) {
    if (!results) return;
    latestYear = year;
    const age = currentYear - year;
    const era = data.eras.find((item) => {
      const start = Number(item.years.slice(0, 4));
      const end = Number(item.years.slice(5));
      return year >= start && year <= end;
    });

    /* ---------------- 记忆卡 ---------------- */
    const birthEvents = data.events.filter((event) => event.y === year);
    const birthEvent =
      birthEvents.find((event) => event.s === 'china') ?? birthEvents[0] ?? nearest(data.events, year, 4)[0];
    const childhoodSongs = data.songs
      .filter((song) => song.y >= year + 6 && song.y <= year + 16)
      .sort((a, b) => a.y - b.y);
    const teenSongs = data.songs
      .filter((song) => song.y >= year + 12 && song.y <= year + 22)
      .sort((a, b) => a.y - b.y);
    const eraToys = data.toys.filter((toy) => toy.y <= year + 13 && (toy.e ?? toy.y + 18) >= year + 2);

    const summary = `
      <div class="relative overflow-hidden border-[1.5px] border-ink bg-cream p-6 shadow-print sm:p-9">
        <div class="pointer-events-none absolute -right-6 -top-10 select-none font-display text-[10rem] leading-none text-ink/[0.04]">${year}</div>
        <div class="pointer-events-none absolute inset-0 dot-grid opacity-20"></div>
        <div class="relative">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span class="label-mono text-vermilion">Memory Card · 记忆卡</span>
            <span class="stamp text-jade">${esc(era?.label ?? 'CUSTOM')}</span>
          </div>
          <div class="mt-6 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <p class="font-mono text-[10px] tracking-[0.24em] text-ink-faint">出生年份</p>
              <p class="mt-1 font-display text-6xl leading-none text-ink sm:text-7xl">${year}</p>
            </div>
            <div class="pb-1">
              <p class="font-mono text-[10px] tracking-[0.24em] text-ink-faint">今年</p>
              <p class="mt-1 font-display text-3xl leading-none text-vermilion">${age} 岁</p>
            </div>
            <div class="pb-1">
              <p class="font-mono text-[10px] tracking-[0.24em] text-ink-faint">童年</p>
              <p class="mt-1 font-display text-3xl leading-none text-ink">${yearSpan(year, 5, 12, MIN, MAX)}</p>
            </div>
            <div class="pb-1">
              <p class="font-mono text-[10px] tracking-[0.24em] text-ink-faint">青春期</p>
              <p class="mt-1 font-display text-3xl leading-none text-ink">${yearSpan(year, 13, 18, MIN, MAX)}</p>
            </div>
          </div>

          <p class="mt-6 max-w-2xl text-[15px] leading-8 text-ink-soft">${
            era
              ? `你出生在「${esc(era.name)}」的年代。${esc(era.mood)}`
              : '你的出生年份不在 1980—2009 之间，但记忆没有边界。'
          }</p>

          <div class="mt-6 grid gap-2 border-t border-ink/15 pt-5 sm:grid-cols-2">
            <p class="text-sm leading-7 text-ink-soft">
              <span class="font-mono text-[10px] tracking-[0.18em] text-ink-faint">那一年 · </span>
              ${birthEvent ? esc(birthEvent.t) : '资料暂缺'}
            </p>
            <p class="text-sm leading-7 text-ink-soft">
              <span class="font-mono text-[10px] tracking-[0.18em] text-ink-faint">童年 BGM · </span>
              ${childhoodSongs[0] ? `《${esc(childhoodSongs[0].t)}》— ${esc(childhoodSongs[0].a)}` : '资料暂缺'}
            </p>
          </div>

          <div class="mt-6 flex flex-wrap gap-2">
            ${Array.from(new Set(eraToys.slice(0, 5).map((toy) => toy.c)))
              .map((category) => `<span class="border border-ink/20 bg-paper px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-ink-soft">${esc(category)}</span>`)
              .join('')}
            <span class="border border-ink/20 bg-paper px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-ink-soft">${esc(era?.years ?? '')}</span>
          </div>
        </div>
        <div class="relative mt-6 flex items-center justify-between border-t border-ink/15 pt-4">
          <span class="font-mono text-[9px] tracking-[0.24em] text-ink-faint">GY · TIME MACHINE / Nº ${String(year).slice(-2)}${String(age).padStart(2, '0')}</span>
          <span class="flex h-6 items-end gap-[3px]" aria-hidden="true">
            ${Array.from({ length: 26 })
              .map((_, index) => `<i class="w-[2px] bg-ink/60" style="height:${4 + ((index * 7 + year) % 20)}px"></i>`)
              .join('')}
          </span>
        </div>
      </div>
    `;
    if (summaryEl) summaryEl.innerHTML = summary;

    /* ---------------- 关键年份 ---------------- */
    const milestones = [
      { age: 0, label: '你出生那年' },
      { age: 7, label: '你上小学那年' },
      { age: 13, label: '你上初中那年' },
      { age: 18, label: '你 18 岁那年' },
    ];

    const milestoneHtml = milestones
      .map(({ age: milestoneAge, label }) => {
        const targetYear = year + milestoneAge;
        if (targetYear > MAX) return '';
        const rowEvents = data.events.filter((event) => event.y === targetYear);
        const event =
          rowEvents.find((item) => item.s === 'china') ?? rowEvents[0] ?? nearest(data.events, targetYear, 2)[0];
        const song = nearestAfter(data.songs, targetYear, 3)[0];
        const movie = nearestAfter(data.movies, targetYear, 3)[0];
        const toyCandidates = data.toys
          .filter((item) => item.y <= targetYear && (item.e ?? item.y + 18) >= targetYear)
          .sort((a, b) => Math.abs(a.y - targetYear) - Math.abs(b.y - targetYear));
        const toy = toyCandidates[Math.min(toyCandidates.length - 1, Math.floor(milestoneAge / 5))] ?? nearest(data.toys, targetYear, 6)[0];
        if (!event && !song && !movie) return '';
        return `
          <article class="relative border-l-[2px] border-ink/20 pl-6 sm:pl-8">
            <span class="absolute -left-[7px] top-1.5 h-3 w-3 rotate-45 border-[1.5px] border-ink bg-vermilion"></span>
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span class="font-display text-4xl leading-none text-ink">${targetYear}</span>
              <span class="font-mono text-[10px] tracking-[0.2em] text-ink-faint">${milestoneAge === 0 ? '0 岁' : `${milestoneAge} 岁`} · ${label}</span>
            </div>
            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              ${
                event
                  ? `<div class="border border-ink/15 bg-cream/70 p-3">
                      <p class="font-mono text-[9px] tracking-[0.2em] ${event.s === 'china' ? 'text-vermilion' : 'text-sky'}">${event.s === 'china' ? '中国' : '世界'} · ${esc(event.c)}</p>
                      <p class="mt-1.5 font-display text-base leading-snug text-ink">${esc(event.t)}</p>
                      <p class="mt-1.5 line-clamp-3 text-[12px] leading-6 text-ink-soft">${esc(event.d)}</p>
                    </div>`
                  : ''
              }
              ${
                song
                  ? `<div class="border border-ink/15 bg-cream/70 p-3">
                      <p class="font-mono text-[9px] tracking-[0.2em] text-jade">那年的歌</p>
                      <p class="mt-1.5 font-display text-base leading-snug text-ink">《${esc(song.t)}》</p>
                      <p class="mt-1 text-[12px] leading-6 text-ink-soft">${esc(song.a)} · ${song.y}</p>
                      ${song.l ? `<p class="mt-1 line-clamp-2 text-[12px] leading-6 text-ink-faint">「${esc(song.l)}」</p>` : ''}
                    </div>`
                  : ''
              }
              ${
                movie
                  ? `<div class="border border-ink/15 bg-cream/70 p-3">
                      <p class="font-mono text-[9px] tracking-[0.2em] text-mustard">那年看的</p>
                      <p class="mt-1.5 font-display text-base leading-snug text-ink">《${esc(movie.t)}》</p>
                      <p class="mt-1 text-[12px] leading-6 text-ink-soft">${esc(movie.ty)} · ${movie.y}</p>
                      ${movie.q ? `<p class="mt-1 line-clamp-2 text-[12px] leading-6 text-ink-faint">「${esc(movie.q)}」</p>` : ''}
                    </div>`
                  : ''
              }
            </div>
            ${
              toy
                ? `<p class="mt-3 text-[12px] leading-6 text-ink-faint">那时候在玩：<span class="text-ink-soft">${esc(toy.n)}</span>（${esc(toy.c)}）${toy.m ? ` · 「${esc(toy.m)}」` : ''}</p>`
                : ''
            }
          </article>
        `;
      })
      .filter(Boolean)
      .join('');

    if (milestonesEl) {
      milestonesEl.innerHTML =
        milestoneHtml ||
        `<p class="border border-dashed border-ink/30 p-6 text-sm text-ink-faint">收录范围是 ${MIN}—${MAX} 年，再往后就是另一段人生了。</p>`;
    }

    /* ---------------- 歌单 ---------------- */
    const songList = [...teenSongs, ...childhoodSongs].slice(0, 8);
    if (songsEl) {
      songsEl.innerHTML = songList.length
        ? songList
            .map(
              (song) => `
              <li class="flex items-center gap-3 border-b border-ink/10 py-3 last:border-0">
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink/25 bg-ink text-cream">
                  <span class="h-4 w-4 rounded-full bg-vermilion"></span>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-baseline justify-between gap-2">
                    <span class="truncate font-display text-base text-ink">《${esc(song.t)}》</span>
                    <span class="shrink-0 font-mono text-[10px] text-ink-faint">${song.y}</span>
                  </span>
                  <span class="mt-0.5 block truncate text-[12px] text-ink-soft">${esc(song.a)} · ${esc(song.r)}</span>
                  ${song.l ? `<span class="mt-0.5 block truncate text-[11px] text-ink-faint">「${esc(song.l)}」</span>` : ''}
                </span>
              </li>`,
            )
            .join('')
        : `<li class="text-sm text-ink-faint">资料暂缺。</li>`;
    }

    /* ---------------- 影视 ---------------- */
    const movieList = data.movies
      .filter((movie) => movie.y >= year && movie.y <= year + 20)
      .sort((a, b) => a.y - b.y)
      .slice(0, 6);
    if (moviesEl) {
      moviesEl.innerHTML = movieList.length
        ? movieList
            .map(
              (movie) => `
              <li class="flex items-baseline justify-between gap-3 border-b border-ink/10 py-2.5 last:border-0">
                <span class="min-w-0">
                  <span class="block truncate font-display text-base text-ink">《${esc(movie.t)}》</span>
                  <span class="mt-0.5 block font-mono text-[10px] tracking-[0.12em] text-ink-faint">${movie.y} · ${esc(movie.ty)} · ${esc(movie.r)}</span>
                </span>
                ${movie.q ? `<span class="hidden max-w-[16rem] shrink-0 text-right text-[11px] leading-5 text-ink-faint sm:block">「${esc(movie.q)}」</span>` : ''}
              </li>`,
            )
            .join('')
        : `<li class="text-sm text-ink-faint">资料暂缺。</li>`;
    }

    /* ---------------- 玩具 ---------------- */
    const toyList = eraToys.slice(0, 8);
    if (toysEl) {
      toysEl.innerHTML = toyList.length
        ? toyList
            .map(
              (toy) => `
              <li class="border border-ink/15 bg-cream/70 p-3">
                <span class="flex items-center justify-between gap-2">
                  <span class="font-display text-base text-ink">${esc(toy.n)}</span>
                  <span class="font-mono text-[9px] tracking-[0.16em] text-ink-faint">${esc(toy.c)}</span>
                </span>
                <span class="mt-1 block text-[12px] leading-6 text-ink-soft">${esc(toy.d)}</span>
                ${toy.m ? `<span class="mt-1 block text-[11px] leading-5 text-ink-faint">「${esc(toy.m)}」</span>` : ''}
              </li>`,
            )
            .join('')
        : `<li class="text-sm text-ink-faint">资料暂缺。</li>`;
    }

    /* ---------------- 大事 ---------------- */
    const eventList = data.events
      .filter((event) => event.y >= year && event.y <= year + 15)
      .sort((a, b) => a.y - b.y)
      .slice(0, 10);
    if (eventsEl) {
      eventsEl.innerHTML = eventList
        .map(
          (event) => `
          <li class="flex gap-4 border-b border-ink/10 py-3 last:border-0">
            <span class="w-12 shrink-0 font-mono text-[11px] tracking-[0.1em] text-ink-faint">${event.y}</span>
            <span class="min-w-0">
              <span class="block font-display text-base leading-snug text-ink">${esc(event.t)}</span>
              <span class="mt-0.5 block text-[12px] leading-6 text-ink-soft">${esc(event.d)}</span>
              <span class="mt-1 inline-block font-mono text-[9px] tracking-[0.18em] ${event.s === 'china' ? 'text-vermilion' : 'text-sky'}">${event.s === 'china' ? '中国' : '世界'} · ${esc(event.c)}</span>
            </span>
          </li>`,
        )
        .join('');
    }

    if (noteEl) {
      noteEl.textContent = isDemo
        ? `当前展示的是示例：${year} 年出生。输入你的出生年份，重新生成。`
        : `已为你生成 ${year} 年出生的记忆卡。`;
    }

    results.hidden = false;
    if (placeholder) placeholder.hidden = true;
    results.classList.remove('tm-card');
    void results.offsetWidth;
    results.classList.add('tm-card');
    if (input) input.value = String(year);
    if (copyButton) copyButton.dataset.year = String(year);
  }

  function readYear(): number {
    const fromUrl = Number(new URLSearchParams(window.location.search).get('birth'));
    if (fromUrl >= MIN && fromUrl <= MAX) return fromUrl;
    return 1990;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const raw = Number(input.value.replace(/[^\d]/g, ''));
    const normalized = raw > 0 && raw < 100 ? 1900 + raw : raw;
    const year = clamp(normalized || 1990, MIN, MAX);
    const url = new URL(window.location.href);
    url.searchParams.set('birth', String(year));
    window.history.replaceState(null, '', url);
    render(year, false);
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  copyButton?.addEventListener('click', async () => {
    const year = Number(copyButton.dataset.year ?? latestYear);
    const age = currentYear - year;
    const event = data.events.find((item) => item.y === year);
    const song = data.songs.find((item) => item.y >= year + 6 && item.y <= year + 16);
    const toy = data.toys.find((item) => item.y <= year + 13 && (item.e ?? item.y + 18) >= year + 2);
    const text = [
      '我的流金岁月 · 时光机记忆卡',
      `出生：${year} 年｜今年 ${age} 岁`,
      event ? `那一年：${event.t}` : '',
      song ? `童年 BGM：《${song.t}》— ${song.a}` : '',
      toy ? `玩过：${toy.n}` : '',
      '你的呢？#流金岁月时光机',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      if (copyStatus) copyStatus.textContent = '已复制，去发给同年代的人吧。';
    } catch {
      if (copyStatus) copyStatus.textContent = '复制失败，可以手动选中文字。';
    }
    if (copyStatus) {
      window.setTimeout(() => {
        copyStatus.textContent = '';
      }, 3200);
    }
  });

  const initial = readYear();
  render(initial, !new URLSearchParams(window.location.search).get('birth'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

export {};
