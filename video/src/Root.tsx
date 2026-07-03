import "./index.css";
import React from "react";
import { Composition, Folder } from "remotion";
import { RecarGaragePromo } from "./RecarGaragePromo";
import { format, scenes, TRANSITION_FRAMES } from "./theme";
import { reelDuration, ReelScene } from "./components/Reel";
import { ProDashboardReel, proDashboardScenes } from "./reels/ProDashboardReel";
import { CrmReel, crmScenes } from "./reels/CrmReel";
import { LeadsReel, leadsScenes } from "./reels/LeadsReel";
import { VerifiedSellerReel, verifiedSellerScenes } from "./reels/VerifiedSellerReel";
import { AiListingReel, aiListingScenes } from "./reels/AiListingReel";
import { PricingReel, pricingScenes } from "./reels/PricingReel";
import { WorkshopReel, workshopScenes } from "./reels/WorkshopReel";
import { ChatReel, chatScenes } from "./reels/ChatReel";
import { PartsReel, partsScenes } from "./reels/PartsReel";
import { EcosystemReel, ecosystemScenes } from "./reels/EcosystemReel";
import { Spin360Reel, spin360Scenes } from "./reels/Spin360Reel";
import { PartsFinderReel, partsFinderScenes } from "./reels/PartsFinderReel";
import { RepairFlipReel, repairFlipScenes } from "./reels/RepairFlipReel";

// Six cross-fades join the seven scenes; the length is derived from `theme.ts`.
const sceneFrames = Object.values(scenes).reduce((a, b) => a + b, 0);
const TRANSITIONS = Object.keys(scenes).length - 1;
const DURATION = sceneFrames - TRANSITIONS * TRANSITION_FRAMES;

/**
 * The same promo component is rendered at three aspect ratios. Scenes adapt via
 * `useFormat()`, so one component covers Reels/Shorts (9:16), feed (1:1) and
 * YouTube/Google Ads (16:9) — no duplicated scene code.
 */
const FORMATS = [
  { id: "RecarGaragePromo", width: 1080, height: 1920 }, // 9:16 vertical
  { id: "RecarGaragePromoSquare", width: 1080, height: 1080 }, // 1:1 square
  { id: "RecarGaragePromoWide", width: 1920, height: 1080 }, // 16:9 landscape
] as const;

/**
 * The Instagram reel series for professionals (workshops & dealerships).
 * All 9:16 Reels; each file in `src/reels/` declares its scenes and the
 * duration is derived here — see `reelDuration`.
 */
const REELS: ReadonlyArray<{
  id: string;
  component: React.FC;
  scenes: ReelScene[];
}> = [
  { id: "ReelProDashboard", component: ProDashboardReel, scenes: proDashboardScenes },
  { id: "ReelCrm", component: CrmReel, scenes: crmScenes },
  { id: "ReelLeads", component: LeadsReel, scenes: leadsScenes },
  { id: "ReelVerifiedSeller", component: VerifiedSellerReel, scenes: verifiedSellerScenes },
  { id: "ReelAiListing", component: AiListingReel, scenes: aiListingScenes },
  { id: "ReelPricing", component: PricingReel, scenes: pricingScenes },
  { id: "ReelWorkshop", component: WorkshopReel, scenes: workshopScenes },
  { id: "ReelChat", component: ChatReel, scenes: chatScenes },
  { id: "ReelParts", component: PartsReel, scenes: partsScenes },
  { id: "ReelEcosystem", component: EcosystemReel, scenes: ecosystemScenes },
  { id: "ReelSpin360", component: Spin360Reel, scenes: spin360Scenes },
  { id: "ReelPartsFinder", component: PartsFinderReel, scenes: partsFinderScenes },
  { id: "ReelRepairFlip", component: RepairFlipReel, scenes: repairFlipScenes },
];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {FORMATS.map((f) => (
        <Composition
          key={f.id}
          id={f.id}
          component={RecarGaragePromo}
          durationInFrames={DURATION}
          fps={format.fps}
          width={f.width}
          height={f.height}
        />
      ))}
      <Folder name="Instagram-Reels">
        {REELS.map((reel) => (
          <Composition
            key={reel.id}
            id={reel.id}
            component={reel.component}
            durationInFrames={reelDuration(reel.scenes)}
            fps={format.fps}
            width={1080}
            height={1920}
          />
        ))}
      </Folder>
    </>
  );
};
