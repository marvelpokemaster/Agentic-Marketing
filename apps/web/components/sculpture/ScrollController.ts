import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Custom hook connecting window scroll progression to the 3D sculpture morphing target (0.0 to 2.0)
 */
export function useSculptureScrollMorph(): number {
  const [morphProgress, setMorphProgress] = useState<number>(0);

  useEffect(() => {
    // Animate morph object value based on window scroll progress
    const morphTarget = { value: 0 };

    const trigger = ScrollTrigger.create({
      trigger: typeof window !== "undefined" ? document.body : null,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.8,
      onUpdate: (self) => {
        // Map 0 -> 1 scroll to 0 -> 2 morph progress
        const targetVal = self.progress * 2.0;
        gsap.to(morphTarget, {
          value: targetVal,
          duration: 0.4,
          ease: "power2.out",
          onUpdate: () => {
            setMorphProgress(morphTarget.value);
          },
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return morphProgress;
}
