export interface ExplainerSection {
  heading: string;
  body: string;
}

export const WHAT_IS_BINAURAL: ExplainerSection[] = [
  {
    heading: 'Etymology',
    body: 'From Latin: *bi-* (“two”) + *auris* (“ear”). Binaural literally means “two-eared” or “involving both ears.” The “beat” refers to the rhythmic pulsing perception your brain constructs when each ear receives a slightly different pitch.',
  },
  {
    heading: 'What it is',
    body: 'Present a 200 Hz tone to your left ear and a 210 Hz tone to your right ear in isolation (headphones required). Your brain does not hear two separate pitches — instead it perceives a single tone near 205 Hz that audibly pulses or “beats” 10 times per second. That 10 Hz throb is the difference between the two frequencies, and it is an auditory illusion: it does not exist as a real sound wave in the air, only as a perceptual construct generated in the brainstem (the superior olivary complex). The phenomenon was first described by Heinrich Wilhelm Dove in 1839; Gerald Oster revisited it in a widely-cited 1973 Scientific American article that kicked off most modern interest.',
  },
  {
    heading: 'The monaural problem',
    body: 'Much of what is streamed as “binaural beats” on Spotify, YouTube, and similar platforms is actually monaural — both frequencies pre-mixed into a stereo file that plays the same combined waveform from each channel. In a monaural recording, the beat exists as real acoustic interference: two waves physically adding and subtracting in the air. You can hear it from a single speaker, and a microphone could record it. In a true binaural recording each ear must receive only one of the two frequencies; the beat is constructed by your nervous system. They are different perceptual phenomena, may produce different neurological responses, and most of the original research specifically tested the binaural case. A simple test: with true binaural beats, the throbbing disappears the moment you remove your headphones. With monaural, it does not.',
  },
  {
    heading: 'Why this page exists',
    body: 'To give you a clean, parametric tool for hearing the binaural effect properly — independent control of left and right frequencies, configurable carrier and beat, waveform shaping, and a verifiable setup. Most binaural content on streaming services is either monaural, fixed at one configuration, or bundled with marketing claims that outrun the science. The honest position is that the evidence supports a modest, replicated effect on anxiety in the alpha band and inconsistent results elsewhere. This tool lets you experience the illusion firsthand, decide what (if anything) it does for you, and read the actual studies attached to each preset.',
  },
];
