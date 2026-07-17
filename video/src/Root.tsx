import "./index.css";
import React from "react";
import { Composition, Folder } from "remotion";
import { RecarGaragePromo } from "./RecarGaragePromo";
import { format, scenes, TRANSITION_FRAMES } from "./theme";
import { reelDuration, ReelScene } from "./components/Reel";
import { ProDashboardReel, ProDashboardReelBR, proDashboardScenes, proDashboardScenesBR } from "./reels/ProDashboardReel";
import { CrmReel, CrmReelBR, crmScenes, crmScenesBR } from "./reels/CrmReel";
import { LeadsReel, LeadsReelBR, leadsScenes, leadsScenesBR } from "./reels/LeadsReel";
import { VerifiedSellerReel, VerifiedSellerReelBR, verifiedSellerScenes, verifiedSellerScenesBR } from "./reels/VerifiedSellerReel";
import { AiListingReel, AiListingReelBR, aiListingScenes, aiListingScenesBR } from "./reels/AiListingReel";
import { PricingReel, PricingReelBR, pricingScenes, pricingScenesBR } from "./reels/PricingReel";
import { WorkshopReel, WorkshopReelBR, workshopScenes, workshopScenesBR } from "./reels/WorkshopReel";
import { ChatReel, ChatReelBR, chatScenes, chatScenesBR } from "./reels/ChatReel";
import { PartsReel, PartsReelBR, partsScenes, partsScenesBR } from "./reels/PartsReel";
import { EcosystemReel, EcosystemReelBR, ecosystemScenes, ecosystemScenesBR } from "./reels/EcosystemReel";
import { Spin360Reel, Spin360ReelBR, spin360Scenes, spin360ScenesBR } from "./reels/Spin360Reel";
import { PartsFinderReel, PartsFinderReelBR, partsFinderScenes, partsFinderScenesBR } from "./reels/PartsFinderReel";
import { RepairFlipReel, RepairFlipReelBR, repairFlipScenes, repairFlipScenesBR } from "./reels/RepairFlipReel";
import { AudioListingReel, AudioListingReelBR, audioListingScenes, audioListingScenesBR } from "./reels/AudioListingReel";
import { StandImportReel, standImportScenes } from "./reels/StandImportReel";
import { LaunchBrazilReel, LaunchBrazilReelBR, launchBrazilScenes, launchBrazilScenesBR } from "./reels/LaunchBrazilReel";
import { ServiceReel, ServiceReelBR, serviceScenes, serviceScenesBR } from "./reels/ServiceReel";


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
  { id: "ReelAudioListing", component: AudioListingReel, scenes: audioListingScenes },
  { id: "ReelStandImport", component: StandImportReel, scenes: standImportScenes },
  { id: "ReelLaunchBrazil", component: LaunchBrazilReel, scenes: launchBrazilScenes },
  { id: "ReelService", component: ServiceReel, scenes: serviceScenes },
];

/**
 * Brazilian Portuguese variants — same beats, localized copy (você forms,
 * BR vocabulary, R$ prices). ReelStandImport has no BR variant: the
 * Standvirtual import is a Portugal-only feature.
 */
const REELS_BR: ReadonlyArray<{
  id: string;
  component: React.FC;
  scenes: ReelScene[];
}> = [
  { id: "ReelProDashboardBR", component: ProDashboardReelBR, scenes: proDashboardScenesBR },
  { id: "ReelCrmBR", component: CrmReelBR, scenes: crmScenesBR },
  { id: "ReelLeadsBR", component: LeadsReelBR, scenes: leadsScenesBR },
  { id: "ReelVerifiedSellerBR", component: VerifiedSellerReelBR, scenes: verifiedSellerScenesBR },
  { id: "ReelAiListingBR", component: AiListingReelBR, scenes: aiListingScenesBR },
  { id: "ReelPricingBR", component: PricingReelBR, scenes: pricingScenesBR },
  { id: "ReelWorkshopBR", component: WorkshopReelBR, scenes: workshopScenesBR },
  { id: "ReelChatBR", component: ChatReelBR, scenes: chatScenesBR },
  { id: "ReelPartsBR", component: PartsReelBR, scenes: partsScenesBR },
  { id: "ReelEcosystemBR", component: EcosystemReelBR, scenes: ecosystemScenesBR },
  { id: "ReelSpin360BR", component: Spin360ReelBR, scenes: spin360ScenesBR },
  { id: "ReelPartsFinderBR", component: PartsFinderReelBR, scenes: partsFinderScenesBR },
  { id: "ReelRepairFlipBR", component: RepairFlipReelBR, scenes: repairFlipScenesBR },
  { id: "ReelAudioListingBR", component: AudioListingReelBR, scenes: audioListingScenesBR },
  { id: "ReelLaunchBrazilBR", component: LaunchBrazilReelBR, scenes: launchBrazilScenesBR },
  { id: "ReelServiceBR", component: ServiceReelBR, scenes: serviceScenesBR },
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
      <Folder name="Instagram-Reels-BR">
        {REELS_BR.map((reel) => (
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
