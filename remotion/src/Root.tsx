import { Composition } from "remotion";
import { CustomerVideo } from "./CustomerVideo";
import { BusinessVideo } from "./BusinessVideo";

export const RemotionRoot = () => (
  <>
    <Composition
      id="customer"
      component={CustomerVideo}
      durationInFrames={776}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="business"
      component={BusinessVideo}
      durationInFrames={1002}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);