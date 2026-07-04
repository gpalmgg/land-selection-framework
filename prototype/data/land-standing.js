// Per-region "land standing / reciprocity" dimension.
// QUALITATIVE ONLY — never scored, ranked, or composited. Describes whose land
// each region is and what arriving in good faith asks of a settler.
// NORTH AMERICA: names the Indigenous nation(s) + treaty/cession status.
// EUROPE: names the rooted rural community / commons / land tradition — NO
// Indigenous framing imposed.
// Facts drawn from data/region-depth.js + data/v1-lookup.js (legal_ownership);
// North American territory names verified against public sources 2026-06-30.
//
// Schema per region id: { territory, tenure, entry, obligation, source, sourceUrl }

export const landStanding = {
  // ===================== Europe =====================
  alentejo: {
    territory: "Alentejano montado agro-pastoral culture — large herdade estates and village baldio commons",
    tenure: "Freehold under Portuguese land law; RAN-classified parcels transact freely but rarely permit residential construction",
    entry: "Buy freehold, but verify RAN/REN protected-zone status before purchase and root into a sparse village rather than fencing off a herdade",
    obligation: "Hold the cork-oak montado's shared water and fire discipline with the neighbours who manage the landscape in common",
    source: "Portuguese Land Law DL 555/99 (consolidated, 2024)",
    sourceUrl: "https://dre.pt/web/guest/legislacao-consolidada/-/lc/34465475/view",
  },
  galicia: {
    territory: "Galego rural commons — comunidades de montes veciñais en man común",
    tenure: "Freehold parcels amid minifundio fragmentation; the montes commons are hereditary by parish and not purchasable",
    entry: "Partner with an existing comunidade de montes rather than buying freehold around the villagers who remain",
    obligation: "Earn standing in a depopulating Galego-speaking parish and respect a montes membership you cannot buy your way into",
    source: "Lei 13/1989 das Comunidades de Montes Veciñais en Man Común",
    sourceUrl: "https://www.xunta.gal/dog/Publicados/1989/19891103/Anuncio154EA_es.html",
  },
  transylvania: {
    territory: "Transylvanian Saxon & Székely village culture — composesorat forest and pasture commons",
    tenure: "EU freehold; non-EU buyers must hold through a Romanian SRL, and Law 17/2014 imposes pre-emption plus an 8-year anti-speculation tax",
    entry: "Clear the 45-day pre-emption notice and enter through the village, where co-owners, lessees, neighbours and young farmers hold first claim",
    obligation: "Respect the composesorat commons and the still-living traditional agroecology rather than displacing it",
    source: "Legea 17/2014 (sale of agricultural land outside city limits)",
    sourceUrl: "https://legislatie.just.ro/Public/DetaliiDocument/156290", // 2026-07 audit: was /156631, which opens an unrelated 2014 police-promotion decree; 156290 is LEGE nr. 17/2014
  },
  connemara: {
    territory: "Gaeltacht Irish rural community — hill commonage and the meitheal cooperative-labour tradition",
    tenure: "Open freehold for any buyer, but lawful residence is gated by strict one-off rural-housing planning",
    entry: "Win County Council planning on demonstrated local need or family connection, meeting Irish-language commitments in Gaeltacht areas",
    obligation: "Show real local need and contribute to a Gaeltacht community protective of its language and shared commonage",
    source: "Cork County Development Plan 2022 to 2028",
    sourceUrl: "https://www.corkcoco.ie/en/cork-county-development-plan-2022-2028", // 2026-07 audit: prior /resident/planning/development-plan URL 404s; this one verified 200 (matches v1-lookup.js)
  },
  pembrokeshire: {
    territory: "Welsh-speaking (Cymraeg) rural community — smallholding tradition and the One Planet low-impact movement",
    tenure: "Open freehold, but lawful residence on open countryside is realistically available only via the TAN 6 One Planet Development route",
    entry: "Win OPD planning with a detailed management plan and a binding 5-year subsistence trajectory, not just a purchase",
    obligation: "Commit to genuine land-based subsistence and the low-impact ethic the OPD community is legally held to",
    source: "Welsh Government, TAN 6 One Planet Development",
    sourceUrl: "https://www.gov.wales/planning-permission-one-planet-developments-open-countryside",
  },
  cevennes: {
    territory: "Cévenol upland smallholder culture — chestnut-terrace farms and a deep, 50-year intentional-community tradition",
    tenure: "Open freehold, but SAFER holds 2-month pre-emption on nearly every agricultural sale above ~0.7 ha and can substitute itself for the buyer",
    entry: "Engage the SAFER départemental office early with a credible installation project before you buy",
    obligation: "Arrive in French with real farming intent and earn trust in a networked but somewhat tribal regen scene",
    source: "SAFER Occitanie, Le prix des terres 2024",
    sourceUrl: "https://www.safer-occitanie.com/fr/page/le-prix-des-terres.php",
  },
  "south-tirol": {
    territory: "South Tirolean Höfe farm-family culture",
    tenure: "Maso Chiuso / Höfegesetz closed-farm law forbids partition of designated farms and forces single-heir succession",
    entry: "Tenant, partner, or convert within a long-established Hof rather than starting your own farm",
    obligation: "Fit into a registered farm system and verify with neighbours the Wasserrechte (water rights) attached to any parcel",
    source: "LP 17/2001, Legge provinciale sui masi chiusi / Höfegesetz",
    sourceUrl: "https://lexbrowser.provinz.bz.it/",
  },
  asturias: {
    territory: "Asturian aldea culture — casería smallholdings and montes comunales commons",
    tenure: "Open freehold, but abandoned aldeas often carry tangled title from descendants of pre-1970 emigrants who still hold registered shares",
    entry: "Buy a whole aldea only after long, expensive notarial title clean-up, and earn your place in a strongly independent local culture",
    obligation: "Win standing among independent villagers and respect the montes comunales tradition and Biosphere-Reserve constraints",
    source: "Decreto Legislativo 1/2004 (urbanismo Asturias)",
    sourceUrl: "https://sede.asturias.es/",
  },
  "saxony-anhalt": {
    territory: "East-German rural Dorf community — post-GDR agricultural Genossenschaft cooperative tradition",
    tenure: "Freehold, but the GrdstVG gives active farmers and the Landgesellschaft pre-emption priority over non-farming buyers",
    entry: "Buy through a German agricultural Genossenschaft or GmbH with a farmer-shareholder and a written Nutzungskonzept",
    obligation: "Prove farming intent and invest years of German-language local relationship-building in a region depopulating since 1990",
    source: "Grundstücksverkehrsgesetz (GrdstVG)",
    sourceUrl: "https://www.gesetze-im-internet.de/grdstvg/",
  },
  "estonia-rural": {
    territory: "Estonian talu (farmstead) culture — and the Seto people's living tradition in Setomaa",
    tenure: "EU freehold; non-EU individuals need county-governor authorisation, so an Estonian OÜ typically owns the land",
    entry: "Have an Estonian OÜ own the land — e-Residency grants no privilege to purchase agricultural or forest land",
    obligation: "Learn Estonian (the Seto register in Setomaa) for real integration into a small, deep organic-farming network",
    source: "Restrictions on Acquisition of Immovables Act / KAOKS (consolidated)",
    sourceUrl: "https://www.riigiteataja.ee/en/eli/ee/501032023002/consolide",
  },

  // ===================== North America =====================
  cascadia: {
    territory: "Kalapuya territory (Willamette Valley) — ceded under the 1855 Treaty with the Kalapuya etc. (Willamette Valley Treaty); descendant peoples now of the Confederated Tribes of Grand Ronde & Siletz",
    tenure: "Fee-simple, but most rural land is zoned Exclusive Farm Use, limiting non-agricultural dwellings",
    entry: "Hire an ORS 215 land-use attorney and plan via a community land trust and Conditional Use Permit before purchasing, not after",
    obligation: "Acknowledge whose land this is and engage one of the continent's most mature regen networks, which expects real participation",
    source: "Oregon Revised Statutes Chapter 215, County Planning; Zoning; Farm Land",
    sourceUrl: "https://www.oregonlegislature.gov/bills_laws/ors/ors215.html",
  },
  vermont: {
    territory: "N'dakinna — Western Abenaki (Wabanaki) homeland, largely unceded by treaty",
    tenure: "Fee-simple; Current Use enrolment trades 80-90% tax relief for a use commitment, and Act 250 gates larger communities",
    entry: "Buy freehold but commit the land to productive use; multi-household builds over 10 acres typically trigger Act 250 review",
    obligation: "Recognise unceded Abenaki homeland and meet the social expectation of doing it right in a 50-year-deep back-to-the-land scene",
    source: "Act 250 Program and History, Vermont Land Use Review Board",
    sourceUrl: "https://act250.vermont.gov/act250-program",
  },
  "southern-appalachians": {
    territory: "Cherokee homeland (ᎠᏂᏴᏫᏯ Aniyvwiya) — ceded under the 1835 Treaty of New Echota and the Trail of Tears; the Eastern Band of Cherokee remains at the Qualla Boundary",
    tenure: "Fee-simple; the Present-Use Value deferral cuts tax sharply but requires filing the AV-4 within 60 days of purchase",
    entry: "Buy freehold, file PUV promptly, and read the watershed honestly after Tropical Storm Helene's flash-flooding",
    obligation: "Honour Cherokee homeland and the dense Earthaven/Celo regen network whose demand is capitalised into the land",
    source: "NC General Statutes §§105-277.2 to 105-277.7, Present-Use Value Programme",
    sourceUrl: "https://www.ncleg.gov/EnactedLegislation/Statutes/PDF/ByChapter/Chapter_105.pdf",
  },
  driftless: {
    territory: "Ho-Chunk (Hoocąk) homeland — a refuge in Ho-Chunk oral history; the Nation endured 19th-century removal and remains present though largely landless, with historic Sauk & Meskwaki presence",
    tenure: "Fee-simple, but foreign-individual holdings are capped (AB 218, 2025, may tighten to 50 acres for agricultural land)",
    entry: "Hold land through a US cooperative or community land trust and test wells across multiple seasons before buying",
    obligation: "Acknowledge Ho-Chunk homeland and treat every land-use choice as a shared water-quality choice in fractured karst",
    source: "Wisconsin Statute §710.02, Foreign Ownership of Land",
    sourceUrl: "https://docs.legis.wisconsin.gov/statutes/statutes/710/02",
  },
  ozarks: {
    territory: "Osage homeland — Ozark hunting grounds ceded in the 1808 Treaty of Fort Clark; Quapaw territory to the south, and Western Cherokee held a reservation here 1818–1828",
    tenure: "Fee-simple; permissive by omission, with title, mineral-rights split, and road-access easement traps",
    entry: "Commission a full title search and confirm road-access easements before buying largely unregulated agricultural land",
    obligation: "Acknowledge Osage homeland and build relationships from scratch where formal regen institutions are thin",
    source: "USDA NASS, Land Values 2024 Summary",
    sourceUrl: "https://www.nass.usda.gov/Publications/Todays_Reports/reports/land0824.pdf",
  },
  "northern-new-mexico": {
    territory: "Tiwa & Tewa Pueblo land (Taos Pueblo) and rooted Hispano land-grant acequia communities",
    tenure: "Fee-simple, but acequia-served land carries binding ditch-association governance and prior-appropriation water rights",
    entry: "Join the acequia as a parciante — attend parciante meetings, vote on distribution, and contribute labour to the annual limpia",
    obligation: "Take on the commons duty of the ditch and respect both Pueblo presence and generations-old acequia culture",
    source: "New Mexico Statutes §73-2-28 (2025), Acequia and community ditch associations",
    sourceUrl: "https://law.justia.com/codes/new-mexico/chapter-73/article-2/section-73-2-28/",
  },
  "nova-scotia": {
    territory: "Unceded Mi'kma'ki — Mi'kmaq territory held under the Peace and Friendship Treaties, never ceded by land surrender",
    tenure: "Fee-simple over unceded land; a 10% Non-Resident Deed Transfer Tax applies to residential property including vacant residential land, unless the land is genuinely non-residential (e.g. agricultural, not intended for residential use) or the buyer moves to Nova Scotia within 6 months", // 2026-07 audit: prior wording wrongly implied all vacant/agricultural land is exempt; NS taxes vacant residential land per its own cited guidelines PDF
    entry: "Settle one or two members first via the (now-reduced) provincial nominee immigration pathway, then buy together",
    obligation: "Recognise unceded Mi'kma'ki and the Peace and Friendship Treaties, and join a thin regen scene in relationship rather than colonising it",
    source: "Nova Scotia Finance, Non-Resident Provincial Deed Transfer Tax guidelines",
    sourceUrl: "https://novascotia.ca/finance/en/home/taxation/tax101/docs/Nova-Scotia-Provincial-Non-resident-Deed-Transfer-Tax-Guidelines.pdf",
  },
  kootenays: {
    territory: "Unceded Sinixt, Ktunaxa & Syilx territory",
    tenure: "Fee-simple, much within the Agricultural Land Reserve (one principal residence as of right); Crown duty to consult applies",
    entry: "Work with the Agricultural Land Commission and the water-licence system; expect a 6–18 month ALC process for multi-dwelling plans",
    obligation: "Honour the Crown duty to consult on unceded territory and engage knowledgeable, skeptical neighbours who expect real engagement",
    source: "ALR Use Regulation, BC Reg 30/2019",
    sourceUrl: "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/30_2019",
  },
  "quebec-eastern-townships": {
    territory: "Unceded W8banaki (Western Abenaki) territory, Ndakina — Odanak & Wôlinak first nations",
    tenure: "Civil-law freehold with mandatory notarial deeds; the CPTAQ Green Zone gates non-farmer purchases (Bill 86, 2025)",
    entry: "Lead with a credible agricultural mission and secure CPTAQ authorization, conducted in French",
    obligation: "Integrate in French into a francophone-dominant regen network and recognise unceded Abenaki territory",
    source: "CanLII, SQ 2025, c 5 (Bill 86, assented March 25, 2025)",
    sourceUrl: "https://www.canlii.org/en/qc/laws/astat/sq-2025-c-5/latest/sq-2025-c-5.html",
  },
  oaxaca: {
    territory: "Zapotec, Mixtec & Chatino comunal lands",
    tenure: "Ejido/comunal under usos y costumbres; foreigners cannot directly buy, only via 6–18 month dominio-pleno conversion or a usufruct acta de posesión",
    entry: "Negotiate entry with the comunal or ejido assembly, not a seller, with competent Mexican agrarian counsel — never a prestanombre front-owner",
    obligation: "Make the legal and relational the same dimension: 418 of 570 municipalities can admit or exclude you, and the deepest knowledge here is Indigenous",
    source: "Ley Agraria (1992, reformed), Artículos 76-82 and 98-107",
    sourceUrl: "https://mexico.justia.com/federales/leyes/ley-agraria/titulo-tercero/capitulo-ii/seccion-sexta/",
  },
};
