// STAGED, NOT shipped. Excluded from deploy via .vercelignore.
//
// "What living here asks of you" practitioner summaries for the 17 non-case-study
// regions, synthesized from the existing research dossiers
// (data/research-dossier/<id>/{legal,regen,climate,water,stability}.md).
//
// HUMAN VERIFICATION GATE (Gustaf): every `asks` paragraph must be checked
// against its dossier before this is promoted into the live region-depth.js.
// Each entry carries a `_dossierBasis` note naming the exact facts used so the
// check is fast. Zero fabrication, if a claim is not in the dossier, cut it.
//
// To ship after verifying: move verified entries into data/region-depth.js
// (keyed by region id, shape { asks, source, sourceUrl }), bump the ?v= cache
// string on the module graph, and redeploy. The 3 case-study regions
// (alentejo, connemara, transylvania) stay as { caseStudy: '#anchor' } deep-links.

export const regionDepthStaging = {
  galicia: {
    asks: "Galicia asks you to untangle the minifundio. Headline prices are low, but assembling a viable 10 to 20 ha parcel can mean negotiating with 30-plus scattered heirs and budgeting 12 to 24 months for clean title. It rains 1,100 to 1,800 mm a year, almost all between October and April, so your water resilience hinges on storage that bridges a 3 to 4 month dry summer, not on scarcity. The living substrate is the montes vecinales commons and a Galego-speaking neorrural revival, where the most accessible route runs through partnering with an existing comunidade de montes rather than buying freehold.",
    source: "Lei 13/1989 das Comunidades de Montes Veciñais en Man Común",
    sourceUrl: "https://www.xunta.gal/dog/Publicados/1989/19891103/Anuncio154EA_es.html",
    _dossierBasis: "galicia/legal.md + regen.md: minifundio fragmentation and 30+ heirs, 12-24mo title assembly, montes vecinales commons and neorrurales; climate.md + water.md: 1100-1800mm Oct-Apr, 3-4mo dry summer storage"
  },
  pembrokeshire: {
    asks: "Pembrokeshire asks you to win planning, not just buy land. Ownership is fully open to non-UK buyers, but living on agricultural land means clearing the One Planet Development route under TAN 6, with a detailed management plan, ecological footprint accounting, and a binding commitment to 65 percent household subsistence within 5 years. Water is abundant to a fault, so the real constraints are surface flooding, intensifying rainfall, and septic performance on heavy clay-shale soils, with OPD legally requiring you to engineer your own water and wastewater. Note too that buying land never grants residency, the National Park boundary tightens scrutiny sharply, and practitioners often target parcels just outside it.",
    source: "Welsh Government, TAN 6 One Planet Development",
    sourceUrl: "https://www.gov.wales/planning-permission-one-planet-developments-open-countryside",
    _dossierBasis: "pembrokeshire/legal.md + regen.md: open ownership but visa needed, OPD/TAN6 management plan and 65% subsistence in 5yr, National Park scrutiny; climate.md + water.md: abundant water, flooding and septic on clay-shale, OPD on-site water requirement"
  },
  cevennes: {
    asks: "The Cevennes ask you to make peace with SAFER. France lets anyone own farmland, but SAFER holds pre-emption rights on nearly every agricultural sale above 0.7 ha and can substitute itself to reassign land, so engaging the departemental office early with a credible installation project is the real work. Siting elevation governs everything: a parcel at 200 m and one at 1,000 m are two different climate regimes within 20 km, and the autumn cevenol storms can drop 300 to 600 mm in 24 hours, making flash-flood resilience and mid-slope siting a primary design constraint. The regen scene is deep and networked but somewhat tribal after 50 years of intentional-community life, and CAP access typically means incorporating a French association or GAEC and working in French.",
    source: "SAFER Occitanie, Le prix des terres 2024",
    sourceUrl: "https://www.safer-occitanie.com/fr/page/le-prix-des-terres.php",
    _dossierBasis: "cevennes/legal.md + regen.md: SAFER pre-emption above 0.7ha, engage early with installation project, tribal 50yr community scene needing French entity; climate.md + water.md: 200m vs 1000m regimes, cevenol storms 300-600mm/24h, mid-slope siting"
  },
  "south-tirol": {
    asks: "South Tirol asks you to fit into an existing Hof rather than start your own. The Maso Chiuso closed-farm law forbids partitioning designated farms, so small parcels rarely come to market and prices on what does transact are among Europe's highest. The pragmatic regen path is to tenant, partner, or convert within a long-established farm, since there is essentially no intentional-community scene and the generous funding stack rewards registered South Tirolean farmers, not newcomers. Water is abundant for now, but the centuries-old Waale gravity channels depend on shrinking glacier and meltwater baseflow, so verify the Wasserrechte attached to any parcel and weigh altitudinal siting, where 1,000 m trades summer heat for a 4 to 5 month heating season and snow load.",
    source: "LP 17/2001, Legge provinciale sui masi chiusi / Höfegesetz",
    sourceUrl: "https://lexbrowser.provinz.bz.it/",
    _dossierBasis: "south-tirol/legal.md + regen.md: Maso Chiuso bars partition, highest prices, tenant/partner within existing Hof, funding for registered farmers; climate.md + water.md: shrinking glacier/Waale baseflow, verify Wasserrechte, 1000m heating season and snow load"
  },
  asturias: {
    asks: "Asturias asks you to be patient with paper before you are patient with land. Non-EU buyers face no purchase restriction, but the realistic prize here is a whole abandoned aldea, and many carry tangled title from descendants of pre-1970 emigrants to Buenos Aires, Mexico, or Cuba who still hold registered shares. The wet Atlantic climate is buffered and water-abundant, so your real design constraints are winter storms, isolation above 700m, and due-diligence on legacy mining contamination in the central valleys. You will also need to earn your place inside a strongly independent local culture and accept the planning friction of living among six Biosphere Reserves.",
    source: "MAPA, Encuesta de Precios de la Tierra 2024, Asturias breakdown",
    sourceUrl: "https://www.mapa.gob.es/es/estadistica/temas/estadisticas-agrarias/economia/precios-tierra/",
    _dossierBasis: "asturias/legal.md + regen.md: no nationality restriction, abandoned-aldea title clean-up with diaspora heirs, six Biosphere Reserves and planning friction; climate.md + water.md: buffered wet Atlantic climate, winter storms and >700m isolation, legacy-mining water due diligence"
  },
  "saxony-anhalt": {
    asks: "Saxony-Anhalt asks you to prove you intend to farm before it will sell you land. Germany sets no nationality bar, but the Grundstücksverkehrsgesetz and the Landgesellschaft give active farmers pre-emption priority, so community projects without an agricultural Nutzungskonzept routinely get blocked at the Landwirtschaftsbehörde, and the standard route is a German agricultural Genossenschaft or GmbH with a farmer-shareholder. Physically, this is one of Germany's driest regions, the Mitteldeutsches Trockengebiet, where you must design for 6 to 9 month dry-summer bridges and real winter frost at once. The hardest part is social: rural Saxony-Anhalt has lost population continuously since 1990, AfD strength shapes local dynamics, and you will need German-language capacity and years of local-economic relationship-building before newcomers are trusted.",
    source: "Grundstücksverkehrsgesetz (GrdstVG)",
    sourceUrl: "https://www.gesetze-im-internet.de/grdstvg/",
    _dossierBasis: "saxony-anhalt/legal.md + regen.md: active-farmer pre-emption, Genossenschaft/GmbH workaround, post-1990 depopulation and AfD dynamics requiring German-language local trust-building; climate.md + water.md: Mitteldeutsches Trockengebiet, 6-9 month dry-summer rainwater sizing plus winter frost"
  },
  "estonia-rural": {
    asks: "Estonia asks non-EU settlers not to mistake its digital welcome for the right to buy a farm. E-Residency lets you incorporate in days but grants no residency and no privilege to purchase agricultural or forest land, which otherwise needs county-governor authorisation after six months' residence, so the well-trodden route is to have an Estonian OU own the land. Mainland southeast Estonia offers near-textbook freshwater resilience, but Saaremaa's limestone karst means variable boreholes and coastal salinity, pushing you toward rainwater cisterns. The regen network is small enough to email directly, the organic-farming tradition is deep, but Estonian, and in Setomaa the Seto register, is essential for real integration.",
    source: "Restrictions on Acquisition of Immovables Act / KAOKS (consolidated)",
    sourceUrl: "https://www.riigiteataja.ee/en/eli/ee/501032023002/consolide",
    _dossierBasis: "estonia-rural/legal.md + regen.md: e-Residency does not confer land-purchase right, county-governor authorisation / six-month residence, OU-ownership workaround, small reachable regen network, organic tradition, Estonian/Seto language needed; climate.md + water.md: mainland freshwater resilience vs Saaremaa karst boreholes, salinity and rainwater-cistern reliance"
  },
  cascadia: {
    asks: "Cascadia asks you to accept that the hard part is not buying land but being allowed to use it. Oregon's statewide Senate Bill 100 planning zones most rural parcels as Exclusive Farm Use, so a multi-household community will likely need a Conditional Use Permit and multi-year county planning engagement, and you should hire an ORS 215 land-use attorney before purchasing, not after. Land is costly here, 3 to 5 times the Alentejo baseline even in the Cascade foothills, which is why most new projects depend on a community land trust rather than outright purchase. In return you join one of the densest and most institutionally mature regen networks in North America, with mild wet winters and abundant water, tempered by a real and worsening late-summer wildfire-smoke season.",
    source: "USDA NASS, Land Values 2024 Summary",
    sourceUrl: "https://www.nass.usda.gov/Publications/Todays_Reports/reports/land0824.pdf",
    _dossierBasis: "cascadia/legal.md + regen.md + climate.md + water.md: EFU/SB100 zoning and CUP requirement, 3-5x land cost vs Alentejo, CLT necessity, dense mature FIC network, wildfire smoke trend"
  },
  vermont: {
    asks: "Vermont asks you to commit the land to productive use and lock it in. Enrolling in the Current Use program on purchase cuts property tax by 80 to 90 percent, but the 10 percent withdrawal penalty is a deliberate commitment device, and any multi-household community on more than 10 acres typically triggers an Act 250 permit costing real time and money. Water is genuinely abundant, so the discipline is the reverse of scarcity: site on ridges or well-drained margins away from flood-prone bottomland, and build for cold snowy winters with passive solar, super-insulation, and wood-heat backup as non-optional. The 50-year-deep regen network is a resource and an accountability, since doing it right here carries social expectation and rewards real engagement over arriving with a finished outside vision.",
    source: "Vermont Department of Taxes, Current Use Program",
    sourceUrl: "https://tax.vermont.gov/property/current-use",
    _dossierBasis: "vermont/legal.md + regen.md + climate.md + water.md: Current Use tax cut and 10% withdrawal penalty, Act 250 trigger over 10 acres, flood/bottomland siting, cold-winter design, 50-year network with social accountability"
  },
  "southern-appalachians": {
    asks: "The Southern Appalachians ask you to use the tax and easement tools well and to read the land's drainage honestly. Open ownership plus the Present-Use Value deferral can cut property tax up to 90 percent for qualifying forestry or agriculture, but you must file the AV-4 within 60 days of purchase or face three years of back taxes plus interest. Water is structurally abundant in the French Broad basin, so the real risk is siting: Tropical Storm Helene in 2024 showed these highland watersheds can flash-flood catastrophically, making below-ridge placement and serious drainage analysis non-negotiable, alongside roughly 45 extreme-heat days a year projected by 2050. You arrive into one of the densest regen networks in North America, anchored by Earthaven and Celo, but that same demand is capitalised into land prices, so expect to pay a premium over comparable rural land elsewhere.",
    source: "NC General Statutes §§105-277.2–105-277.7, Present-Use Value Programme",
    sourceUrl: "https://www.ncleg.gov/EnactedLegislation/Statutes/PDF/ByChapter/Chapter_105.pdf",
    _dossierBasis: "southern-appalachians/legal.md + regen.md + climate.md + water.md: PUV up to 90% tax cut and AV-4 60-day trap, Helene flood/siting risk, ~45 extreme-heat days by 2050, dense network with land premium"
  },
  driftless: {
    asks: "The Driftless asks you to farm the land actively and to treat every land-use choice as a water-quality choice. Use-value assessment can put property tax near 30 to 80 dollars per acre instead of 500 to 900, and a US-registered cooperative or community land trust is the pragmatic land-holding entity given a live 2025 bill (AB 218) that may tighten foreign individual ownership. Water is abundant, but the fractured karst geology means nitrate from manure, fertilizer, or septic reaches private wells directly, with 15 to 20 percent of wells in some counties already over the EPA limit, so multi-season well testing before purchase is non-negotiable. You land in an exceptionally mature organic and CSA network anchored by Organic Valley and Marbleseed, though that reputation has pushed up prices in the Viroqua-La Farge-Cashton triangle, and cold winters remain a genuine design constraint.",
    source: "Wisconsin Statute §70.32(2), Use-Value Agricultural Assessment",
    sourceUrl: "https://www.revenue.wi.gov/Pages/FAQS/slf-useassmt.aspx",
    _dossierBasis: "driftless/legal.md + regen.md + climate.md + water.md: use-value tax cut, AB 218 foreign-ownership threat and CLT/coop workaround, karst nitrate contamination and well testing, Organic Valley/Marbleseed network with price pressure, cold winters"
  },
  ozarks: {
    asks: "The Ozarks ask you to be a pioneer rather than a joiner. Land is the cheapest in this slate, and several counties (Sharp, Izard, Fulton, Newton) require no building permit on agricultural land while composting toilets, rainwater harvesting, and off-grid solar are all legal and lightly regulated, but the freedom is permissive by omission, not supportive by design, so commission a full title search for mineral-rights complications and confirm road-access easements before buying. Water is abundant from the karst aquifer, yet that same porous limestone lets upstream farming or CAFO contamination reach a spring within years, so you must map the spring's contributing watershed, not just your property line. The formal regen layer is thin, with only a handful of established communities nearby, meaning you build relationships from scratch through homestead networks and Permies.com rather than tapping an existing support scene.",
    source: "USDA NASS, Land Values 2024 Summary",
    sourceUrl: "https://www.nass.usda.gov/Publications/Todays_Reports/reports/land0824.pdf",
    _dossierBasis: "ozarks/legal.md + regen.md + climate.md + water.md: cheapest land and permit-free off-grid legality, title/mineral and road-access traps, karst spring contamination and watershed mapping, pre-institutional regen scene built from scratch"
  },
  "northern-new-mexico": {
    asks: "Northern New Mexico asks you to join a commons before you own a thing. Acequia-served land comes with a governance obligation, not just a water allocation: you attend parciante meetings, contribute labor to the annual ditch limpia, and vote on distribution, including in drought years when water is scarce and tensions run high. Water is the single most load-bearing constraint here, the Upper Rio Grande is fully appropriated and in structural deficit, so off-acequia sites need permitted wells or aggressive rainwater harvesting and closed-loop reuse. You inherit one of the fastest-warming states in the continental US and a real wildfire threat in the montane belt, set against a deep, generations-old earthship and intentional-community network that already holds the desert-appropriate knowledge.",
    source: "New Mexico Statutes §73-2-28 (2025), Acequia and community ditch associations",
    sourceUrl: "https://law.justia.com/codes/new-mexico/chapter-73/article-2/section-73-2-28/",
    _dossierBasis: "northern-new-mexico/legal.md + water.md: acequia commons governance obligation, fully-appropriated Rio Grande / prior appropriation, rainwater + closed-loop necessity for off-acequia sites; climate.md/regen.md: fastest-warming state, wildfire belt, earthship network"
  },
  "nova-scotia": {
    asks: "Nova Scotia asks for patience with an immigration pathway more than with the land itself. Rural and Cape Breton parcels sit outside the federal foreign-buyer ban and dodge the 10% non-resident deed transfer tax if held as vacant or agricultural land, but the 2025 federal cut of roughly 50% to the provincial nominee quota means international co-founders realistically settle one or two members first on work permits, then buy together. The water is genuinely abundant at ~1,300 mm a year, so the real design questions are wastewater on thin fractured-bedrock soils and the new reality of episodic late-summer drought. The regen scene is thin but real, a handful of cohousing and permaculture projects plus an active organic-farming network, which means a new project here is more likely to be a defining node than a follower.",
    source: "Farm Credit Canada, 2024 FCC Farmland Values Report (published March 2025)",
    sourceUrl: "https://www.fcc-fac.ca/en/reports/2024-farmland-values-report",
    _dossierBasis: "nova-scotia/legal.md + water.md: rural CMA exemption, 10% deed transfer tax + ag exemption, 50% PNP quota cut and stage-the-members pathway, ~1,300mm precipitation, septic on fractured bedrock, 2024 drought; regen.md: thin scene, defining-node framing"
  },
  kootenays: {
    asks: "The Kootenays ask you to work with the Agricultural Land Reserve and the water-licence system rather than around them. ALR land is affordable but permits only one principal residence as of right, so a multi-household community must either prove farm-worker housing need, pursue a slow 6 to 18 month Agricultural Land Commission application, or pay materially more for non-ALR land. Water is a siting and timing problem, not scarcity today: prior-appropriation licences mean late-priority holders get shut off in drought, glacial baseflow is already past peak, and summer storage matters by mid-century. Most of the region is unceded Sinixt, Ktunaxa, and Syilx territory with a Crown duty to consult, and you arrive into one of North America's densest intentional-community legacies, neighbours who are knowledgeable, skeptical, and expect engagement rather than a ready-made model.",
    source: "Farm Credit Canada, 2024 FCC Farmland Values Report (BC and Kootenay region)",
    sourceUrl: "https://www.fcc-fac.ca/en/knowledge/economics/farmland-values-report",
    _dossierBasis: "kootenays/legal.md: ALR one-residence limit + ALC application timeline, foreign-ownership openness, water-licence prior appropriation, DRIPA duty to consult on unceded Sinixt/Ktunaxa/Syilx territory; water.md: glacier peak-water, summer storage; regen.md: dense skeptical community legacy"
  },
  "quebec-eastern-townships": {
    asks: "Québec's Eastern Townships ask you to lead with a real agricultural mission and to do it in French. The CPTAQ Green Zone protects farmland from speculation but constrains buyers: under Bill 86 (2025) most non-farmer purchasers now need prior CPTAQ authorization, applications are public, contested, and run 12 to 36 months, and you must demonstrate credible agricultural intent through a farm plan or MAPAQ registration, not a lifestyle or retreat framing. The land regime runs on civil law with mandatory notarial deeds, and French is the sole official language for permits, CPTAQ filings, and the francophone-dominant regen network, a genuine integration burden for anglophone founders. Water is abundant year-round, so the constraints are qualitative: agricultural-runoff lake quality, spring flood and freeze-thaw loads, and building for -25°C winters.",
    source: "CanLII, SQ 2025, c 5 (Bill 86, assented March 25, 2025)",
    sourceUrl: "https://www.canlii.org/en/qc/laws/astat/sq-2025-c-5/latest/sq-2025-c-5.html",
    _dossierBasis: "quebec-eastern-townships/legal.md: CPTAQ Green Zone + Bill 86 prior-authorization, 12-36 month process, agricultural-intent test, civil-law notarial deeds, French-only requirement; regen.md: francophone insularity; climate.md/water.md: -25C winters, abundant water, runoff lake-quality issues"
  },
  oaxaca: {
    asks: "Oaxaca asks you to make the legal dimension and the relational dimension the same dimension. Over half the state is held as ejido or comunidad agraria that foreigners cannot directly buy, and 418 of 570 municipalities run on usos y costumbres customary law with the legal right to admit or exclude newcomers, so entry must be negotiated with an assembly, not just a seller, and competent Mexican agrarian counsel is non-negotiable, never a prestanombre front-owner. It is not a zero-violence region: organised criminal violence tripled in the state between 2022 and 2023 and it ranks second-highest in Mexico for violence against political figures, with risk concentrated along the Isthmus and Pacific corridors while the Sierra Norte highland interior is meaningfully, though not absolutely, safer. The highland water reality is a hard dry-season storage gap from day one, gravity-fed spring systems with roughly 90-day reservoir capacity are baseline, and the deepest regenerative knowledge here is indigenous Zapotec, Mixtec, and Chatino, so the relational work with neighbours is not optional.",
    source: "Ley Agraria (1992, reformed), Artículos 76-82 and 98-107",
    sourceUrl: "https://mexico.justia.com/federales/leyes/ley-agraria/titulo-tercero/capitulo-ii/seccion-sexta/",
    _dossierBasis: "oaxaca/legal.md: ejido/comunal tenure foreigners can't buy, usos y costumbres assembly entry rights, counsel non-negotiable, prestanombre illegal; stability.md: violence tripled 2022-23, 2nd-highest political-figure targeting, Isthmus/coast vs safer Sierra Norte; water.md: 90-day dry-season storage; regen.md: indigenous knowledge primacy"
  },
};
