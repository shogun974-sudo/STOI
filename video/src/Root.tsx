import { Composition } from 'remotion';
import { Stoi, FPS, DURATION } from './Stoi';

export const Root = () => (
  <Composition
    id="Stoi"
    component={Stoi}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1350}
    defaultProps={{ withVoice: false }}
  />
);
