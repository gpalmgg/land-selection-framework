"""Selectors for the home page (`/`). One dict per component; the WP that changes the markup owns its own selectors/<component>.py
(this file starts from recon/tools/browser_audit.py's SEL). Loaded by file path through lib/sel.py: this directory has no
__init__.py on purpose, so it can never shadow the standard-library `selectors` module."""

SEL = {
    "continent_tab": ".continent-tab",
    "map": "#map",
    "layer_buttons": "#map-toggles button.map-toggle",
    "layers_toggle": "#layers-toggle",
    "legend": "#map-legend",
    "region_card": ".region-card",
    "region_star": ".region-star",
    "slider": ".criteria input[type=range]",
    "match_count": "#match-count",
    "match_total": "#match-total",
    "match_detail": "#match-detail",
    "match_bar": ".match-bar",
    "drawer": "#region-drawer",
    "drawer_body": "#drawer-body",
    "drawer_close": "#drawer-close",
    "shortlist_btn": "#shortlist-btn",
    "compare": "#compare-overlay",
    "compare_body": "#compare-body",
    "compare_close": "#compare-close",
    "modal": "#signup-modal",
    "modal_close": "#modal-close-btn",
    "modal_form": "#modal-form",
    "modal_status": "#modal-status",
    "hero_form": "#signup-form",
    "hero_status": "#form-status",
    "preset_chip": "#preset-chips .preset-chip",
    "guided_chip": "#guided-chips .guided-chip",
    "reset_btn": "#reset-btn",
    "share_btn": "#share-btn",
    "next_share": "#ns-share",
    "qual_filters": "#qual-filters",
    "skip_link": ".skip-link",
    "rail": "nav",
}

# Preset used by the equivalence states, and the three regions of the compare state.
PRESET_LABEL = "Cool & water-secure"
DRAWER_REGION = "alentejo"
COMPARE_PINS = ["alentejo", "galicia", "transylvania"]
FILTERED_LINK = "/?t.water_stress=0.3&t.solar_pv=1400&pin=galicia"

# Sampled selectors for the computed-style fingerprint (name -> css selector; first match; null when absent in a state).
FINGERPRINT = {
    "body": "body", "nav": "nav", "skip-link": ".skip-link", "prototype-banner": ".prototype-banner",
    "hero": "header, .hero", "hero-h1": "h1", "hero-form": "#signup-form", "hero-input": "#signup-email",
    "hero-button": "#signup-form button", "guided": ".guided, #guided-title", "guided-title": "#guided-title",
    "guided-chip": "#guided-chips .guided-chip", "guided-chip-neutral": "#guided-chips .guided-chip.neutral",
    "regions-intro": ".regions-intro", "regions-intro-h2": ".regions-intro h2", "continent-switcher": "#continent-switcher",
    "continent-tab": ".continent-tab", "continent-tab-active": ".continent-tab.active", "map-wrap": ".map-wrap", "map": "#map",
    "map-legend": "#map-legend", "map-controls": ".map-controls", "layers-toggle": "#layers-toggle", "map-toggles": "#map-toggles",
    "map-toggle": "#map-toggles button.map-toggle", "map-toggle-on": "#map-toggles button.map-toggle[aria-pressed=true]",
    "region-grid": "#region-grid", "region-card": ".region-card", "region-card-visible": ".region-card:not(.fail)",
    "region-card-fail": ".region-card.fail", "region-card-starred": ".region-card.starred", "region-name": ".region-card .name",
    "region-country": ".region-card .country", "region-blurb": ".region-card .blurb", "region-asks": ".region-card .card-asks",
    "region-status": ".region-card .status", "region-star": ".region-star", "region-star-on": ".region-star.on",
    "criteria": ".criteria", "criteria-h2": ".criteria h2", "criteria-desc": ".criteria .desc", "onboarding": ".onboarding",
    "preset-chip": ".preset-chip", "qual-filters": ".qual-filters", "match-bar": ".match-bar", "match-count": "#match-count",
    "match-detail": "#match-detail", "match-regions": "#match-regions", "shortlist-btn": "#shortlist-btn", "share-btn": "#share-btn",
    "reset-btn": "#reset-btn", "crit-card": ".crit-card", "crit-head": ".crit-card .head", "crit-slider": ".crit-card input[type=range]",
    "bar-row": ".bar-row", "bar-row-fail": ".bar-row.fail", "summary-table": "table", "summary-cell": "table td",
    "next-step": "#next-step", "next-step-button": "#next-step button", "sources": "#sources-list, .sources",
    "drawer-backdrop": "#region-drawer", "drawer-panel": ".drawer-panel", "drawer-head": ".drawer-head", "drawer-name": ".drawer-name",
    "drawer-blurb": ".drawer-blurb", "drawer-star": ".drawer-star", "drawer-land-standing": ".drawer-land-standing",
    "drawer-land-standing-h4": ".drawer-land-standing h4", "drawer-close": "#drawer-close", "drawer-body": "#drawer-body",
    "compare-backdrop": "#compare-overlay", "compare-panel": "#compare-overlay > div", "compare-body": "#compare-body",
    "compare-close": "#compare-close", "modal-backdrop": "#signup-modal", "modal-card": "#signup-modal .modal-card",
    "modal-title": "#modal-title", "modal-input": "#modal-email", "modal-status": "#modal-status", "form-status": "#form-status",
    "contact": "#contact, .contact", "footer": "footer", "footer-a": "footer a", "suite-note": ".suite-note", "mobile-note": ".mobile-note",
}
FINGERPRINT_PROPS = ["color", "backgroundColor", "fontFamily", "fontSize", "fontWeight", "lineHeight", "margin", "padding", "border",
                     "display", "position", "width", "height", "opacity", "zIndex", "boxShadow", "transform", "gridTemplateColumns", "borderRadius", "letterSpacing"]
