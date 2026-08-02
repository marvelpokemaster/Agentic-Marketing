"use client";

let registered = false;
let gsapInstance: any = null;
let scrollTriggerInstance: any = null;
let useGSAPInstance: any = null;

export async function loadGsap() {
  if (typeof window === "undefined") return null;
  if (!gsapInstance) {
    const { gsap } = await import("gsap");
    const { ScrollTrigger } = await import("gsap/ScrollTrigger");
    const { useGSAP } = await import("@gsap/react");
    gsapInstance = gsap;
    scrollTriggerInstance = ScrollTrigger;
    useGSAPInstance = useGSAP;
    if (!registered) {
      gsapInstance.registerPlugin(scrollTriggerInstance, useGSAPInstance);
      registered = true;
    }
  }
  return {
    gsap: gsapInstance,
    ScrollTrigger: scrollTriggerInstance,
    useGSAP: useGSAPInstance,
  };
}
