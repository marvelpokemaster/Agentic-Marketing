"use client";

import React from "react";
import { VolumetricSculptureCanvas } from "./sculpture/VolumetricSculptureCanvas";
import type { CampaignStageColor } from "./BackgroundCanvas";

export function AICore3D({ stage }: { stage?: CampaignStageColor }) {
  return (
    <div className="w-full relative flex flex-col items-center justify-center">
      <VolumetricSculptureCanvas instanceCount={50000} />
    </div>
  );
}
