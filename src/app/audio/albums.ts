export interface AlbumTrack {
  title: string;
  url: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  description: string;
  license: string;
  source: string;
  tracks: AlbumTrack[];
}

// All tracks streamed from the Internet Archive (Access-Control-Allow-Origin: *).
// Licenses verified against each album's archive.org metadata.
// To swap to local files later, change each `url` to `/music/<file>.mp3` and
// drop the files into `public/music/`.

const ZAB_CC = 'CC BY 4.0';
const LEE_CC = 'CC BY 3.0';

const CYL = 'https://archive.org/download/Cylinders-15736';
const DTV = 'https://archive.org/download/ChrisZabriskieDirectToVideo';
const MFP1 = 'https://archive.org/download/LeeRosevere_MusicForPodcasts';
const MFP2 = 'https://archive.org/download/MusicForPodcasts02';

export const ALBUMS: Album[] = [
  {
    id: 'zabriskie-cylinders',
    title: 'Cylinders',
    artist: 'Chris Zabriskie',
    description: 'Minimal ambient piano',
    license: ZAB_CC,
    source: 'https://archive.org/details/Cylinders-15736',
    tracks: [
      { title: 'Cylinder One', url: `${CYL}/Chris_Zabriskie_-_01_-_Cylinder_One.mp3` },
      { title: 'Cylinder Two', url: `${CYL}/Chris_Zabriskie_-_02_-_Cylinder_Two.mp3` },
      { title: 'Cylinder Three', url: `${CYL}/Chris_Zabriskie_-_03_-_Cylinder_Three.mp3` },
      { title: 'Cylinder Four', url: `${CYL}/Chris_Zabriskie_-_04_-_Cylinder_Four.mp3` },
      { title: 'Cylinder Five', url: `${CYL}/Chris_Zabriskie_-_05_-_Cylinder_Five.mp3` },
      { title: 'Cylinder Six', url: `${CYL}/Chris_Zabriskie_-_06_-_Cylinder_Six.mp3` },
      { title: 'Cylinder Seven', url: `${CYL}/Chris_Zabriskie_-_07_-_Cylinder_Seven.mp3` },
      { title: 'Cylinder Eight', url: `${CYL}/Chris_Zabriskie_-_08_-_Cylinder_Eight.mp3` },
      { title: 'Cylinder Nine', url: `${CYL}/Chris_Zabriskie_-_09_-_Cylinder_Nine.mp3` },
    ],
  },
  {
    id: 'zabriskie-direct-to-video',
    title: 'Direct to Video',
    artist: 'Chris Zabriskie',
    description: 'Cinematic synth, ambient piano',
    license: ZAB_CC,
    source: 'https://archive.org/details/ChrisZabriskieDirectToVideo',
    tracks: [
      { title: 'Direct to Video', url: `${DTV}/Chris%20Zabriskie%20-%20Direct%20to%20Video%20-%2001%20Direct%20to%20Video.mp3` },
      { title: 'What Does Anybody Know About Anything', url: `${DTV}/Chris%20Zabriskie%20-%20Direct%20to%20Video%20-%2002%20What%20Does%20Anybody%20Know%20About%20Anything.mp3` },
      { title: 'I Don\'t See the Branches, I See the Leaves', url: `${DTV}/Chris%20Zabriskie%20-%20Direct%20to%20Video%20-%2003%20I%20Don%27t%20See%20the%20Branches%2C%20I%20See%20the%20Leaves.mp3` },
      { title: 'I Want to Fall in Love on Snapchat', url: `${DTV}/Chris%20Zabriskie%20-%20Direct%20to%20Video%20-%2004%20I%20Want%20to%20Fall%20in%20Love%20on%20Snapchat.mp3` },
      { title: 'But Enough About Me, Bill Paxton', url: `${DTV}/Chris%20Zabriskie%20-%20Direct%20to%20Video%20-%2005%20But%20Enough%20About%20Me%2C%20Bill%20Paxton.mp3` },
      { title: 'God Be With You Till We Meet Again', url: `${DTV}/Chris%20Zabriskie%20-%20Direct%20to%20Video%20-%2006%20God%20Be%20With%20You%20Till%20We%20Meet%20Again.mp3` },
      { title: 'It\'s Always Too Late to Start Over', url: `${DTV}/Chris%20Zabriskie%20-%20Direct%20to%20Video%20-%2007%20It%27s%20Always%20Too%20Late%20to%20Start%20Over.mp3` },
    ],
  },
  {
    id: 'rosevere-mfp1',
    title: 'Music For Podcasts',
    artist: 'Lee Rosevere',
    description: 'Chill electronic, light beats',
    license: LEE_CC,
    source: 'https://archive.org/details/LeeRosevere_MusicForPodcasts',
    tracks: [
      { title: 'Let\'s Start at the Beginning', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2001%20Let%27s%20Start%20at%20the%20Beginning.mp3` },
      { title: 'Late Night Tales', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2002%20Late%20Night%20Tales.mp3` },
      { title: 'Curiousity', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2003%20Curiousity.mp3` },
      { title: 'Looking Back', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2004%20Looking%20Back.mp3` },
      { title: 'Tech Toys', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2005%20Tech%20Toys.mp3` },
      { title: 'Quizitive', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2006%20Quizitive.mp3` },
      { title: 'Universe Calling', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2007%20Universe%20Calling.mp3` },
      { title: 'Max Flashback', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2008%20Max%20Flashback.mp3` },
      { title: 'Biking in the Park', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2009%20Biking%20in%20the%20Park.mp3` },
      { title: 'Musical Mathematics', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2010%20Musical%20Mathematics.mp3` },
      { title: 'Glass Android', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2011%20Glass%20Android.mp3` },
      { title: 'Content', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2012%20Content.mp3` },
      { title: 'Credit Roll', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2013%20Credit%20Roll.mp3` },
      { title: 'Going Home', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2014%20Going%20Home.mp3` },
      { title: 'Featherlight', url: `${MFP1}/Lee%20Rosevere%20-%20Music%20For%20Podcasts%20-%2015%20Featherlight.mp3` },
    ],
  },
  {
    id: 'rosevere-mfp2',
    title: 'Music For Podcasts 2',
    artist: 'Lee Rosevere',
    description: 'Mellow electronic, ambient grooves',
    license: LEE_CC,
    source: 'https://archive.org/details/MusicForPodcasts02',
    tracks: [
      { title: 'Places Unseen', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2001%20Places%20Unseen.mp3` },
      { title: 'In A Moment', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2002%20In%20A%20Moment.mp3` },
      { title: 'Heat Haze', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2003%20Heat%20Haze.mp3` },
      { title: 'Gone', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2004%20Gone.mp3` },
      { title: 'Under Suspicion', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2005%20Under%20Suspicion.mp3` },
      { title: 'Keep Trying', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2006%20Keep%20Trying.mp3` },
      { title: 'Evening Glow', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2007%20Evening%20Glow.mp3` },
      { title: 'It\'s A Mystery', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2008%20It%27s%20A%20Mystery.mp3` },
      { title: 'Thoughtful', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2009%20Thoughtful.mp3` },
      { title: 'Puzzle Pieces', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2010%20Puzzle%20Pieces.mp3` },
      { title: 'Reflections', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2011%20Reflections.mp3` },
      { title: 'The Long Journey', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2012%20The%20Long%20Journey.mp3` },
      { title: 'Wandering', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2013%20Wandering.mp3` },
      { title: 'Try Anything Once', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2014%20Try%20Anything%20Once.mp3` },
      { title: 'Snakes', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2015%20Snakes.mp3` },
      { title: 'Last Call', url: `${MFP2}/Lee%20Rosevere%20-%20Music%20for%20Podcasts%202%20-%2016%20Last%20Call.mp3` },
    ],
  },
];
