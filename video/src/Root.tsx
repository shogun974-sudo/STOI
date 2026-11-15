import { Composition } from 'remotion';
import { Stoi, FPS, DURATION } from './Stoi';
import { Orbite } from './Orbite';
import { Effets, EFFETS_TOTAL } from './Effets';
import { Effets2, EFFETS2_TOTAL } from './Effets2';
import { ZeklairPub, Z_TOTAL, Z_FPS } from './Zeklair';

export const Root = () => (
  <>
    <Composition
      id="Stoi"
      component={Stoi}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1350}
      defaultProps={{ withVoice: false }}
    />
    <Composition id="Effets" component={Effets} durationInFrames={EFFETS_TOTAL} fps={FPS} width={1080} height={1350} />
    <Composition id="Effets2" component={Effets2} durationInFrames={EFFETS2_TOTAL} fps={FPS} width={1080} height={1350} />
    <Composition id="Zeklair1-4x5" component={ZeklairPub} durationInFrames={Z_TOTAL} fps={Z_FPS} width={1080} height={1350} defaultProps={{ video: 1 as const, format: '4x5' as const }} />
    <Composition id="Zeklair2-4x5" component={ZeklairPub} durationInFrames={Z_TOTAL} fps={Z_FPS} width={1080} height={1350} defaultProps={{ video: 2 as const, format: '4x5' as const }} />
    <Composition id="Zeklair1-16x9" component={ZeklairPub} durationInFrames={Z_TOTAL} fps={Z_FPS} width={1920} height={1080} defaultProps={{ video: 1 as const, format: '16x9' as const }} />
    <Composition id="Zeklair2-16x9" component={ZeklairPub} durationInFrames={Z_TOTAL} fps={Z_FPS} width={1920} height={1080} defaultProps={{ video: 2 as const, format: '16x9' as const }} />
    <Composition id="Orbite" component={Orbite} durationInFrames={6 * FPS} fps={FPS} width={1080} height={1350} />
  </>
);
