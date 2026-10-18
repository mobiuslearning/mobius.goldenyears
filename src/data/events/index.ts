import type { TimeEvent } from '../../types';
import { events1980s } from './1980s';
import { events1990s } from './1990s';
import { events2000s } from './2000s';

export { events1980s, events1990s, events2000s };

export const allEvents: TimeEvent[] = [...events1980s, ...events1990s, ...events2000s].sort(
  (a, b) => a.year - b.year || (a.scope === 'china' ? -1 : 1),
);

/** 按年份分组的时光轴数据 */
export const eventsByYear: Map<number, TimeEvent[]> = (() => {
  const map = new Map<number, TimeEvent[]>();
  for (const event of allEvents) {
    const list = map.get(event.year) ?? [];
    list.push(event);
    map.set(event.year, list);
  }
  return map;
})();

export const eventYearList: number[] = [...eventsByYear.keys()].sort((a, b) => a - b);

export function eventsForYear(year: number): TimeEvent[] {
  return eventsByYear.get(year) ?? [];
}

export const eventStats = {
  total: allEvents.length,
  years: eventYearList.length,
  china: allEvents.filter((event) => event.scope === 'china').length,
  global: allEvents.filter((event) => event.scope === 'global').length,
};
