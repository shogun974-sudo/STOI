import { Composition } from 'remotion';
import { Stoi, FPS, DURATION } from './Stoi';
import { Orbite } from './Orbite';
import { Effets, EFFETS_TOTAL } from './Effets';

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
    <Composition id="Orbite" component={Orbite} durationInFrames={6 * FPS} fps={FPS} width={1080} height={1350} />
  </>
);
