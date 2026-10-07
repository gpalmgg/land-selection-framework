// Boot only. Everything else lives in src/ui/*, src/map/*, src/refresh.js or src/state.js; this file wires them
// together in a fixed order. The order below is the order the old single-file boot ran in.

import { state } from './state.js';
import { refreshAll, initRefresh } from './refresh.js';
import { applyURLState, initUrlSync } from './ui/url-sync.js';
import { renderRegionGrid } from './ui/region-grid.js';
import { renderCriteriaGrid } from './ui/criteria.js';
import { initCriteriaSources } from './ui/criteria-sources.js';
import { renderSummaryTable } from './ui/summary-table.js';
import { renderSourcesList } from './ui/sources-list.js';
import { initPresets, renderPresetChips } from './ui/presets.js';
import { renderQualFilters } from './ui/qual-filters.js';
import { renderGuidedEntry } from './ui/guided.js';
import { initContinentSwitcher } from './ui/continent-switcher.js';
import { initDrawer } from './ui/drawer/index.js';
import { initCompare } from './ui/compare.js';
import { initNextStep } from './ui/next-step.js';
import { initShortlist } from './ui/shortlist.js';
import { initReset } from './ui/reset.js';
import { initShareButton } from './ui/share.js';
import { initSignupForm, initSignupModal } from './ui/signup.js';
import { initPassOn } from './ui/passon.js';
import { initMobileNote } from './ui/mobile-note.js';
import { extensions } from './map/extensions.js';
import { registerExtensions } from './map/layers.js';
import { initMap } from './map/map.js';
import { initMarkers } from './map/markers.js';
import { initContinent } from './map/continent.js';
import { renderMapToggles } from './map/toggles.js';
import { renderMapLegend } from './map/legend.js';
import { showMapFallback } from './map/fallback.js';

// Module-level calls that used to run on import (the share button, the reset button) are explicit init calls here.

// Subscriptions and hooks first: every later step may emit. The map half of a continent switch subscribes before
// the sources count in initCriteriaSources, as it did when it was a module-level listener.
initContinent();
initRefresh();
initUrlSync();
initPresets();
initCriteriaSources();
initMarkers();
initReset();
initShareButton();
initPassOn();
initMobileNote();

// CRITICAL: apply URL thresholds BEFORE any render so sliders/bars init
// at the shared state, not at defaults that snap on first paint.
applyURLState();

// Scope the page to the active continent before any render so the CSS
// show/hide rule is live from the first paint.
document.body.dataset.continent = state.continent;

registerExtensions(extensions);
renderRegionGrid();
renderMapToggles();
renderMapLegend();
renderCriteriaGrid();
renderSummaryTable();
renderSourcesList();
renderPresetChips();
renderQualFilters();
renderGuidedEntry();
initContinentSwitcher();
initDrawer();
initCompare();
initNextStep();
initShortlist();        // reflect any ?pin= regions restored from the URL
refreshAll();
try { initMap(); } catch (err) { console.error('Map init failed:', err); showMapFallback(); }
initSignupForm();
initSignupModal();
