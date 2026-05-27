export interface Faq {
  q: string;
  a: string;
}

// Answers are deliberately conservative. Where evidence is weak or contested,
// it's said plainly. The main source for effect-size claims is Garcia-Argibay
// et al. (2019, meta-analysis); for carrier-frequency claims, Oster (1973);
// for monaural-vs-binaural distinction, Heinrich Wilhelm Dove's 1839 paper
// and modern reviews.

export const FAQS: Faq[] = [
  {
    q: 'Does this actually work?',
    a: 'The evidence is mixed. The most consistently replicated finding is modest anxiety reduction with alpha-band (8–13 Hz) binaural beats — Padmanabhan et al. 2005 and the 2019 Garcia-Argibay meta-analysis both report small-to-moderate effects (g ≈ 0.45 overall, somewhat larger for anxiety). Claims about lucid dreaming, peak cognition, weight loss, or specific spiritual states are mostly anecdotal or rest on single studies that have not been replicated. The honest framing is: a low-cost, low-risk experiment that may produce a small effect for you on some outcomes, not a treatment.',
  },
  {
    q: 'What is the “carrier frequency” and what range works best?',
    a: 'The carrier is the base pitch — the average of the two ear frequencies — which is what you actually perceive as a tone. The “beat” is the difference between the two ears. Heinrich Dove described the effect in 1839; Gerald Oster characterized the perceptual properties in 1973. Carrier frequencies in the 200–500 Hz range produce the strongest, clearest binaural beat illusion. Below ~90 Hz the brain struggles to localize a sound to a single ear, weakening the effect. Above ~1000 Hz binaural fusion drops off sharply. Most research uses carriers between 200 and 400 Hz.',
  },
  {
    q: 'What is the human hearing range, and why does it matter here?',
    a: 'Roughly 20 Hz to 20,000 Hz in young adults, narrowing with age — most adults lose sensitivity above ~15 kHz by their 40s. For binaural beats, only the *carrier* needs to be audible; the *beat* frequency is typically 1–40 Hz, well below the lower threshold of hearing. You don’t hear a 10 Hz beat as a 10 Hz tone — you perceive it as a periodic pulsing of the carrier. This is why an inaudible 5 Hz pure tone alone is silent, but a 200 Hz / 205 Hz pair audibly “throbs” at 5 Hz.',
  },
  {
    q: 'What does “monaural” mean and why does it matter?',
    a: 'Monaural beats are produced when two frequencies are mixed into a single audio channel — they physically interfere in the air and produce a real, measurable beat as a sound wave that anyone in the room can hear, even from a phone speaker. Binaural beats are perceptual: each ear receives one frequency in isolation, and your brainstem (the superior olivary complex) constructs the beat. The two phenomena likely involve different neural mechanisms; older research often conflated them. A simple test: with true binaural beats, the throbbing vanishes the moment you take off the headphones. With monaural, it persists.',
  },
  {
    q: 'Why does this page exist if there’s already binaural content everywhere?',
    a: 'Two reasons. First, much of what is sold or streamed as “binaural beats” is actually monaural — both tones are mixed into a stereo file that plays the same combined waveform out of each ear, so you’re hearing acoustic interference rather than the binaural illusion. Second, even when content is correctly produced, you have no control over the parameters that matter (carrier, beat, waveform, ambient layer). This tool lets you set every parameter precisely, verify the binaural setup with the headphones-off test, and form your own opinion about whether the effect is real for you.',
  },
  {
    q: 'What headphones do I need?',
    a: 'Almost any stereo headphones — even cheap earbuds — work, as long as left and right channels are separated. Bluetooth, wired, in-ear, over-ear all fine. Bone-conduction headphones may not produce the effect because they share signal across the skull. Speakers in a room don’t work: both ears hear both channels. If you hear the beat without headphones on, you’re hearing monaural interference, not binaural beats.',
  },
  {
    q: 'What do the brainwave bands actually mean?',
    a: 'They refer to dominant frequency ranges observable in EEG recordings: Delta (0.5–4 Hz) dominates deep sleep; Theta (4–8 Hz) appears in drowsiness, meditation, REM; Alpha (8–13 Hz) in relaxed wakefulness with eyes closed; Beta (13–30 Hz) in active thinking; Gamma (30+ Hz) in high-level cognitive integration. Binaural beats are *hypothesized* to entrain brain rhythms toward the beat frequency (“brainwave entrainment”), but EEG studies show inconsistent results — some show entrainment, others show none. The behavioral effects (when present) may or may not depend on actual EEG entrainment.',
  },
  {
    q: 'What waveform should I use?',
    a: 'Sine waves are what nearly all binaural-beat research uses. A sine wave contains only its fundamental frequency with no harmonics, producing the cleanest binaural beat. Square, triangle, and sawtooth waves add harmonics (overtones at integer multiples of the base frequency), which can create additional, secondary beats and complicate the perception. Use sine unless you’re deliberately experimenting with timbre.',
  },
  {
    q: 'Is it safe?',
    a: 'No direct harm has been documented at normal listening volumes. The usual hearing-safety caveat applies — keep volume below ~85 dB for long sessions. Avoid using delta/theta presets while driving or operating equipment, since the only consistent behavioral effect is mild drowsiness. People with epilepsy should consult their doctor before any rhythmic auditory stimulation, though no causal link to seizures has been established for binaural beats specifically.',
  },
  {
    q: 'Why do most presets use a 200–250 Hz carrier?',
    a: 'It hits the sweet spot for the illusion. Carriers in this range are audible to almost everyone, well above the floor where binaural fusion breaks down (~90 Hz), well below the ceiling where it weakens (~1000 Hz), and not so high that the tone becomes fatiguing. Research consistently uses carriers in the 200–500 Hz range; some studies suggest the lower end of that range (around 240 Hz, near middle B) produces the cleanest perceived beat.',
  },
  {
    q: 'Why does the beat “disappear” when I move my head?',
    a: 'It usually doesn’t — but headphones can shift, and a sudden change in seal or position can momentarily reduce channel isolation. The bigger source of confusion is bone conduction at high volumes: at loud levels, some vibration carries through your skull from one ear cup to the other, partially merging the channels and weakening the illusion. Lowering the volume usually restores it.',
  },
];
