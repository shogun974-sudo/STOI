import { Composition } from 'remotion';
import { Stoi, FPS, DURATION } from './Stoi';
import { Orbite } from './Orbite';

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
    <Composition id="Orbite" component={Orbite} durationInFrames={6 * FPS} fps={FPS} width={1080} height={1350} />
  </>
);
