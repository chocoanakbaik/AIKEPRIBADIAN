(() => {
  "use strict";

  const ROTATION_MS = 15000;
  const STORAGE_KEY = "choco_site_preferences_v1";
  let timer = null;
  let activeIndex = 0;
  let started = false;
  let adsAllowed = false;
  let providers = [];

  // Keep provider settings centralized. A provider is not activated until its real
  // integration adapter and target slot exist; never use a placeholder URL.
  const PROVIDER_CONFIG = [
    { id: "adsterra", active: true, slotId: "nativeAdPlacement", load: () => {
        if (typeof window.loadChocoNativeAd === "function") window.loadChocoNativeAd();
      } },
    { id: "monetizer", active: false, slotId: "monetizerAdPlacement", load: null },
    { id: "provider-slot-3", active: false, slotId: "providerSlot3", load: null },
    { id: "provider-slot-4", active: false, slotId: "providerSlot4", load: null },
    { id: "provider-slot-5", active: false, slotId: "providerSlot5", load: null },
    { id: "provider-slot-6", active: false, slotId: "providerSlot6", load: null }
  ];

  function readConsent() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return saved?.adsAllowed === true;
    } catch {
      return false;
    }
  }

  function resolveProviders() {
    return PROVIDER_CONFIG.filter((provider) => {
      const slot = document.getElementById(provider.slotId);
      return provider.active && slot && typeof provider.load === "function";
    });
  }

  function setVisibleProvider(provider) {
    window.chocoActiveAdProvider = provider ? provider.id : "";
    for (const config of PROVIDER_CONFIG) {
      const slot = document.getElementById(config.slotId);
      if (slot) slot.hidden = !provider || config.id !== provider.id;
    }
    if (!provider) return;
    const slot = document.getElementById(provider.slotId);
    if (!slot) return;
    // Do not expose an empty slot while an ad provider is loading or unavailable.
    const ready = slot.dataset.chocoAdReady === "true";
    slot.hidden = !ready;
    if (!provider.loaded) {
      provider.loaded = true;
      try { provider.load(); } catch {
        slot.hidden = true;
        slot.dataset.chocoAdReady = "false";
      }
    }
  }

  function stopTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function scheduleNext() {
    stopTimer();
    if (!adsAllowed || document.visibilityState === "hidden" || providers.length < 2) return;
    timer = setTimeout(() => {
      if (!adsAllowed || document.visibilityState === "hidden") {
        timer = null;
        return;
      }
      activeIndex = (activeIndex + 1) % providers.length;
      setVisibleProvider(providers[activeIndex]);
      scheduleNext();
    }, ROTATION_MS);
  }

  function start() {
    if (!readConsent()) return;
    adsAllowed = true;
    providers = resolveProviders();
    if (!providers.length) {
      setVisibleProvider(null);
      return;
    }
    started = true;
    activeIndex = activeIndex % providers.length;
    setVisibleProvider(providers[activeIndex]);
    scheduleNext();
  }

  function stop() {
    adsAllowed = false;
    started = false;
    stopTimer();
    setVisibleProvider(null);
  }

  document.addEventListener("visibilitychange", () => {
    if (!adsAllowed) return;
    if (document.visibilityState === "hidden") stopTimer();
    else scheduleNext();
  });

  window.startChocoAdRotation = start;
  window.stopChocoAdRotation = stop;
  window.refreshChocoAdProviders = () => {
    providers = resolveProviders();
    if (!providers.length) setVisibleProvider(null);
    else start();
  };

  // Consent may already have been saved from an earlier visit.
  if (readConsent()) start();
})();
