import { Waveform } from './binaural-audio.service';

export interface Preset {
  id: string;
  name: string;
  band: 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';
  effect: string;
  carrier: number;
  beat: number;
  waveform: Waveform;
  evidence: 'strong' | 'moderate' | 'preliminary';
  citation: string;
  note: string;
}

// Notes on evidence: a 2019 meta-analysis (Garcia-Argibay, Santed, Reales) found
// small-to-moderate effects on anxiety reduction (alpha/theta range) with the
// largest effect sizes. Memory and cognition effects were weaker and more mixed.
// Sleep, focus, and gamma claims have suggestive but not yet replicated evidence.
// The carrier frequencies follow the general finding that 200-500 Hz produces the
// strongest perception of the binaural illusion (Oster 1973).

export const PRESETS: Preset[] = [
  {
    id: 'destress',
    name: 'De-stress',
    band: 'alpha',
    effect: 'Reduce anxiety, calm alertness',
    carrier: 220,
    beat: 10,
    waveform: 'sine',
    evidence: 'strong',
    citation:
      'Padmanabhan et al. 2005; Le Scouarnec et al. 2001; Garcia-Argibay et al. 2019 (meta-analysis)',
    note: 'Most consistently replicated effect. 10 Hz alpha-band beats reduced pre-operative and trait anxiety in RCTs.',
  },
  {
    id: 'meditate',
    name: 'Meditation',
    band: 'theta',
    effect: 'Relaxed, inward attention',
    carrier: 200,
    beat: 6,
    waveform: 'sine',
    evidence: 'moderate',
    citation: 'Lane et al. 1998; Reedijk et al. 2013',
    note: 'Theta beats (4–8 Hz) associated with mood shifts and meditative states. Effect sizes moderate, individual response varies.',
  },
  {
    id: 'sleep',
    name: 'Sleep',
    band: 'delta',
    effect: 'Onset of deep sleep',
    carrier: 250,
    beat: 3,
    waveform: 'sine',
    evidence: 'moderate',
    citation: 'Jirakittayakorn & Wongsawat 2018; Abeln et al. 2014',
    note: '3 Hz delta beats showed subjective sleep-quality improvements and some EEG delta-power increases.',
  },
  {
    id: 'focus',
    name: 'Focus',
    band: 'beta',
    effect: 'Sustained attention',
    carrier: 240,
    beat: 15,
    waveform: 'sine',
    evidence: 'moderate',
    citation: 'Lane et al. 1998; Kennerly 1994',
    note: 'Beta-range beats correlated with improved vigilance on attention tasks; some null results in newer studies.',
  },
  {
    id: 'cognition',
    name: 'Cognition',
    band: 'gamma',
    effect: 'Working memory, peak processing',
    carrier: 250,
    beat: 40,
    waveform: 'sine',
    evidence: 'preliminary',
    citation: 'Beauchene et al. 2017; Iaccarino et al. 2016 (animal model)',
    note: 'Suggestive evidence only. 40 Hz gamma may modulate working memory in humans; strongest data is from non-binaural 40 Hz stimulation.',
  },
];
