import { Composition } from "remotion";
import { Video } from "./Video";
import { dimensions, timing } from "./styles/theme";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Video"
        component={Video}
        durationInFrames={1350} // 45 seconds at 30fps
        fps={timing.fps}
        width={dimensions.width}
        height={dimensions.height}
      />
    </>
  );
};
