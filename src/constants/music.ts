/** Local looping background tracks (project /music folder). */
export type MusicTrackId = 'none' | 'piano1' | 'piano2' | 'piano3';

export type MusicTrack = {
  id: MusicTrackId;
  labelZh: string;
  labelEn: string;
  /** Metro-bundled mp3; omitted when id is `none`. */
  source?: number;
};

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: 'none', labelZh: '關閉', labelEn: 'Off' },
  {
    id: 'piano1',
    labelZh: '鋼琴 1',
    labelEn: 'Piano 1',
    source: require('../../music/piano1.mp3'),
  },
  {
    id: 'piano2',
    labelZh: '鋼琴 2',
    labelEn: 'Piano 2',
    source: require('../../music/piano2.mp3'),
  },
  {
    id: 'piano3',
    labelZh: '鋼琴 3',
    labelEn: 'Piano 3',
    source: require('../../music/piano3.mp3'),
  },
];

export function getMusicTrack(id: MusicTrackId): MusicTrack | undefined {
  return MUSIC_TRACKS.find((t) => t.id === id);
}
