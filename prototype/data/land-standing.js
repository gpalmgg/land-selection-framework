// Per-region "land standing / reciprocity" dimension.
// QUALITATIVE ONLY — never scored, ranked, or composited. Describes whose land
// each region is and what arriving in good faith asks of a settler.
// NORTH AMERICA: names the Indigenous nation(s) + treaty/cession status, with a
// territorySource / territorySourceUrl that names the page the territory wording rests on.
// EUROPE: names the rooted rural community / commons / land tradition — NO
// Indigenous framing imposed.
//
// Assembled from opened public sources and checked on 2026-10-05. No nation or
// community named here has reviewed any entry. Where a source is one nation's or one
// council's own page, an archived copy, a secondary summary or a state agency that
// speaks for none of them, its label says so.
//
// Schema per region id: { territory, tenure, entry, obligation, source, sourceUrl }
// Optional (registered in tests/schema.mjs): territorySource, territorySourceUrl,
// sources: [{ claim, label, url }].
// Wording kept on purpose: the word "unceded" where 6bce1a3 had it (option c); where no
// opened source supports it the entry says "not verified" in the same sentence.

export const landStanding = {
  // ===================== Europe =====================
  alentejo: {
    territory: "Alentejano montado agro-pastoral landscape — large herdade estates and sparse, ageing villages",
    tenure: "Freehold under Portuguese land law; RAN-classified parcels transact freely but rarely permit residential construction",
    entry: "Verify RAN/REN protected-zone status before any purchase and root into a sparse village rather than fencing off a herdade",
    obligation: "Meet the statutory fire-fuel management duty around buildings and respect the water allocation (Alqueva contract or ARH borehole authorisation) that govern a montado property",
    source: "Decreto-Lei 73/2009 (RAN) and Decreto-Lei 166/2008 (REN), Diario da Republica",
    sourceUrl: "https://diariodarepublica.pt/dr/detalhe/decreto-lei/73-2009-603209",
  },
  galicia: {
    territory: "Galego rural commons — comunidades de montes veciñais en man común",
    tenure: "Freehold parcels amid minifundio fragmentation; the montes commons are indivisible and inalienable, owned collectively by the vecinos with an open household and habitual residence in the settlement, and can be leased but not bought",
    entry: "Partner with an existing comunidade de montes rather than buying freehold around the villagers who remain",
    obligation: "Earn standing in a depopulating Galego-speaking parish and respect that montes membership is held by the residents of the settlement and admitted under each comunidade's own statutes",
    source: "Lei 13/1989, do 10 de outubro, de montes veciñais en man común",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOE-A-1990-3358",
  },
  transylvania: {
    territory: "Transylvania's village commons (composesorat forest and pasture) and the communities that hold them: Romanian majority, Hungarian (Székely) and Roma communities, and the Saxon-heritage villages",
    tenure: "EU citizens and Romanian-seated companies may own land, but farmland outside built-up areas (extravilan) sells only through Law 17/2014: a seven-rank pre-emption queue, then buyer tests (individuals: 5 years' Romanian residence, farming and tax registration; companies: 5 years' farming and 75% farm income), plus an 80% tax on gains from resale within 8 years. Other foreign citizens may acquire land only on the conditions that follow from EU accession and other treaties, on reciprocity and under organic law, or by legal inheritance (Constitution art. 44(2))",
    entry: "Plan for a 45-working-day public pre-emption notice at the village hall (primarie), where relatives and co-owners, lessees, neighbours, young farmers and residents of the commune hold first claim, then the buyer tests in art. 4^1; and enter through the village",
    obligation: "Respect the composesorat commons and the still-living traditional agroecology rather than displacing it",
    source: "Legea 17/2014 (sale of agricultural land outside city limits)",
    sourceUrl: "https://legislatie.just.ro/Public/DetaliiDocument/156290",
  },
  connemara: {
    territory: "Rooted rural parishes of West Cork and, in Connemara, the Galway Gaeltacht, an Irish-speaking community; hill commonage and the meitheal cooperative-labour tradition are described here as local custom and are not verified against an opened source. West Cork's mainland lies outside the Gaeltacht",
    tenure: "Freehold, with lawful residence gated by one-off rural-housing planning under both county plans",
    entry: "Win County Council planning (Cork or Galway): both plans tie one-off rural houses to demonstrated rural links or need; in the Galway Gaeltacht the plan also favours Irish speakers who can prove competence, and schemes of two or more homes face a linguistic impact statement and a 15-year language enurement clause on 20-80% of the homes",
    obligation: "Show real local need and, in the Galway Gaeltacht, take the Irish-language commitments seriously: contribute to a community protective of its language",
    source: "Cork County Development Plan 2022-2028 and Galway County Development Plan 2022-2028",
    sourceUrl: "https://www.corkcoco.ie/en/resident/planning-and-development/cork-county-development-plan-2022-2028",
    sources: [
      {
        claim: "One-off rural housing tied to rural links or need in West Cork; Cork Gaeltacht limited to the Cléire and Múscraí language planning areas",
        label: "Cork County Development Plan 2022-2028 (Cork County Council)",
        url: "https://www.corkcoco.ie/en/resident/planning-and-development/cork-county-development-plan-2022-2028",
      },
      {
        claim: "Galway Gaeltacht rural housing zone, competence in Irish, linguistic impact statement and 15-year language enurement clause",
        label: "Galway County Development Plan 2022-2028 (Galway County Council)",
        url: "https://www.galway.ie/en/planning-building/plans-and-strategies/galway-county-development-plan-2022-2028",
      },
    ],
  },
  pembrokeshire: {
    territory: "Rural Pembrokeshire — Welsh-speaking in the north and the Preseli hills, largely English-speaking south of the Landsker line, with a smallholding tradition and the One Planet low-impact movement",
    tenure: "Freehold, but a new home in open countryside is permitted only through narrow routes, chiefly the One Planet Development policy (Planning Policy Wales 12 paras 4.2.39-4.2.40, TAN 6) or a justified rural enterprise dwelling",
    entry: "Win OPD planning with a binding management plan showing the household's minimum food and income needs (at least 65% of food) can be met from the land within five years, not just a purchase",
    obligation: "Commit to genuine land-based subsistence and the low-impact ethic the OPD community is legally held to",
    source: "Welsh Government, Planning Policy Wales Edition 12 (paras 4.2.39-4.2.40) and One Planet Development practice guidance (TAN 6)",
    sourceUrl: "https://www.gov.wales/planning-permission-one-planet-developments-open-countryside",
  },
  cevennes: {
    territory: "Cévenol upland smallholder culture — chestnut-terrace farms and a deep, 50-year intentional-community tradition",
    tenure: "Freehold, but SAFER holds 2-month pre-emption on nearly every agricultural sale and can step in as buyer in place of the original purchaser",
    entry: "Engage the SAFER départemental office early with a credible installation project before you buy",
    obligation: "Arrive in French with real farming intent and earn trust in a networked but somewhat tribal regen scene",
    source: "Groupe Safer, Le droit de préemption (Code rural L143-1 et suivants)",
    sourceUrl: "https://www.safer.fr/les-safer/le-droit-de-preemption/",
  },
  "south-tirol": {
    territory: "South Tirolean Höfe farm-family culture",
    tenure: "Maso Chiuso closed-farm law (LP 17/2001) keeps designated farms indivisible, so any detachment needs commission authorisation, succession passes to a single designated heir, and since 2025 buying one needs commission approval and proof of farming training or practice",
    entry: "Lease, partner with, or work into a long-established Hof rather than starting your own farm; buying a designated closed farm needs commission approval and a farming qualification",
    obligation: "Fit into a registered farm system and verify with neighbours the Wasserrechte (water rights) attached to any parcel",
    source: "LP 17/2001, Legge provinciale sui masi chiusi / Höfegesetz",
    sourceUrl: "https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17/legge_provinciale_28_novembre_2001_n_17.aspx",
  },
  asturias: {
    territory: "Asturian aldea culture — casería smallholdings and montes comunales commons",
    tenure: "Freehold, but abandoned aldeas can carry tangled title; the usual local explanation, descendants of pre-1970 emigrants who still hold registered shares, is not verified",
    entry: "Take on a whole aldea only after long, expensive notarial title clean-up, and earn your place in a strongly independent local culture",
    obligation: "Win standing among independent villagers and respect the montes comunales tradition and Biosphere-Reserve constraints",
    source: "Decreto Legislativo 1/2004 (urbanismo Asturias; whether a later Asturian law has replaced it is not verified)",
    sourceUrl: "https://noticias.juridicas.com/base_datos/CCAA/as-dleg1-2004.html",
  },
  "saxony-anhalt": {
    territory: "East-German rural Dorf community — post-GDR agricultural Genossenschaft cooperative tradition",
    tenure: "Freehold with no nationality bar, but under the GrdstVG the farmland authority may refuse a sale that would unhealthily concentrate farmland away from active farmers, and the Landgesellschaft holds a statutory pre-emption right on farmland of 2 ha and up (Reichssiedlungsgesetz §4)",
    entry: "Typically buy through a German agricultural Genossenschaft or GmbH with a farmer-shareholder and a written Nutzungskonzept (practitioner practice, not a statutory requirement)",
    obligation: "Prove farming intent and invest years of German-language local relationship-building in a region depopulating since 1990",
    source: "Grundstücksverkehrsgesetz (GrdstVG) §9 and Reichssiedlungsgesetz §4",
    sourceUrl: "https://www.gesetze-im-internet.de/grdstvg/",
  },
  "estonia-rural": {
    territory: "Estonian talu (farmstead) culture — and the Seto people's living tradition in Setomaa",
    tenure: "Citizens of EEA and OECD countries may buy freely. Citizens of other (third) countries need authorisation from the local-government council for agricultural or forest land, after 6 months' residence or a year as a sole-proprietor farmer or forester. An Estonian OÜ can buy under 10 ha freely; 10 ha or more needs three years of farming or forestry, or council authorisation with a five-year activity plan",
    entry: "EEA and OECD citizens can buy in their own name; for anyone else an Estonian OÜ is the usual vehicle, which is free only under 10 ha (larger holdings need a three-year farming or forestry record or council authorisation). e-Residency grants no privilege to purchase agricultural or forest land. In the areas listed in §10 of the Act (the sea islands other than Saaremaa, Hiiumaa, Muhu and Vormsi, and among others the former Mikitamäe, Orava, Räpina, Värska, Meremäe, Misso and Vastseliina parishes, within their boundaries at 31 December 1999), anyone who is not a citizen of an EEA state or the United Kingdom may not acquire real estate unless the Government grants an exception",
    obligation: "Learn Estonian for real integration into a small organic-farming network, and in Setomaa ask the Seto community what it expects of newcomers; the network's size and depth and any Seto-language expectation are not verified against an opened source",
    source: "Restrictions on Acquisition of Immovables Act / KAOKS (consolidated)",
    sourceUrl: "https://www.riigiteataja.ee/en/akt/527122023007",
  },
  millevaches: {
    territory: "Montagne limousine villages and hamlets: farming and forestry families, returning natives, and five decades of newcomers who helped build the associations, cooperatives and municipal welcome that slowed the decline; hamlet commons (sections de commune) still exist",
    tenure: "Freehold, but rural sales are notified to the Safer (Nouvelle-Aquitaine, with offices for Corrèze, Creuse and Haute-Vienne), which can pre-empt farmland and re-allocate it to another buyer; woods under 4 ha carry neighbour and commune rights of first refusal; hamlet-common land is owned by the section de commune and managed by the municipal council",
    entry: "Arrive with a project a local structure can hold: bring the idea to the mairie (Faux-la-Montagne, for one, publicly invites newcomers to present a project and connects them to local associations), take a farm lease through Terre de Liens and Objectif Terres or the installation support of ADEAR Limousin, or become a member of L'Arban, the plateau's housing and planning cooperative. Not there for a lone buyer of an isolated parcel with no local structure behind them",
    obligation: "Work in French, take part in municipal and associative life, and accept the documented friction rather than argue it away: research records returning natives and environment-minded newcomers pulling in different directions, sharply so in the 2014 municipal elections, and the forest has been contested for more than forty years",
    source: "Safer, Le droit de préemption (Code rural art. L143-1 et seq.; Safer Nouvelle-Aquitaine decree of 24 June 2019)",
    sourceUrl: "https://www.safer.fr/les-safer/le-droit-de-preemption/",
  },
  "north-karelia-kainuu": {
    territory: "Finnish village communities and private forest owners; in the east the ground carries Karelian evacuee and Orthodox history (New Valamo moved to Heinävesi from Valaam in 1940), and in Kuhmo Kalevala-rooted culture. Not the Sámi homeland or the reindeer herding area.",
    tenure: "Freehold. Private owners hold about 53% of North Karelia's forest land and 40% of Kainuu's, the state about 20% and 43% (whole counties, 2020-2024). Buyers from outside the EU and EEA need a Ministry of Defence permit, which can be refused to Russian and Belarusian nationals since 15 July 2025. Everyman's rights give access, not occupation, and inside the border zone (up to 3 km from Russia) staying needs a Border Guard permit, open-ended for residents and landowners.",
    entry: "No national arrival programme was found. The routes are local and host-side: a village association (Kuhmo alone has 25 village associations or committees), the Leader group for your municipality, or a municipal moving service such as Joensuu's moving agent. Tohmajärvi's 1,000-euro moving incentive was fully allocated for 2026 and its future is undecided.",
    obligation: "Learn Finnish, join the village association, and stay through the dark winter rather than visiting it. Accept the working forest next door as the local economy. Most of this footprint is losing people (15 of 18 municipalities have shrunk since 1990; only Joensuu, Kontiolahti and Liperi are growing), so staying and sharing the work of keeping a village alive is the real ask. In Lapland, where reindeer herding is lawful irrespective of land ownership, and in Suomussalmi, Hyrynsalmi and part of Puolanka, the honest answer is not there.",
    source: "Finnish Ministry of Defence, Authorisation to non-EU and non-EEA buyers to buy real estate (Act on Permit Requirements for Certain Real Estate Acquisitions)",
    sourceUrl: "https://defmin.fi/en/licences-and-services/authorisation-to-non-eu-and-non-eea-buyers-to-buy-real-estate",
    sources: [
      {
        claim: "Territory: the Sámi homeland is Enontekiö, Inari, Utsjoki and the Lapland reindeer owners' association area in Sodankylä; none of the footprint is in it",
        label: "Act on the Sámi Parliament 974/1995 s.4, Finlex (English translation to 2003 amendments; current consolidated Finnish/Swedish text, consolidated 2025-06-27, carries the same wording)",
        url: "https://www.finlex.fi/en/legislation/translations/1995/eng/974",
      },
      {
        claim: "Territory: reindeer herding area comprises Lapland (excl. Kemi, Tornio, Keminmaa) and in Kainuu Suomussalmi, Hyrynsalmi and part of Puolanka (north of the Hyrynsalmi-Puolanka road); herding may be practised there irrespective of land ownership (s.3). Kajaani, Sotkamo, Kuhmo, Paltamo, Ristijärvi and all 13 North Karelia municipalities are not listed",
        label: "Reindeer Husbandry Act 848/1990 ss.2-3, Finlex current consolidated Finnish text (consolidated 2025-06-27); English translation to 2000 amendments",
        url: "https://www.finlex.fi/fi/lainsaadanto/1990/848",
      },
      {
        claim: "Territory: New Valamo monks left Valaam in 1940 and settled at Papinniemi, Heinävesi that autumn; Petsamo and Konevitsa monks later joined",
        label: "New Valamo Monastery, Echoes of history",
        url: "https://valamo.fi/en/monastery/echoes-of-history",
      },
      {
        claim: "Territory: Kuhmo states its cultural roots and traditions extend to the world of the Kalevala",
        label: "Visit Kuhmo (Kuhmo town)",
        url: "https://visitkuhmo.fi/en/visit-kuhmo/",
      },
      {
        claim: "Tenure: forest land by owner group, NFI 13/14 (2020-2024), 1000 ha. North Karelia total 1564 (private 836, companies 344, state 306, others 78); Kainuu total 1619 (private 650, companies 209, state 693, others 66). Whole counties, not the footprint",
        label: "Luke statistics database, table 1.07 Ownership of forest land",
        url: "https://statdb.luke.fi/PxWeb/pxweb/en/LUKE/LUKE__met__zzz_lak__06%20Metsavarat/1.07_Metsamaa_omistajaryhmittain.px/",
      },
      {
        claim: "Tenure: non-EU/EEA buyers need a Ministry of Defence permit; Russian and Belarusian acquisitions can be prevented under the amendment adopted 11 April 2025, in force 15 July 2025; permanent residence permits and other no-permit circumstances are taken into account",
        label: "Finnish Ministry of Defence",
        url: "https://defmin.fi/en/licences-and-services/authorisation-to-non-eu-and-non-eea-buyers-to-buy-real-estate",
      },
      {
        claim: "Tenure: everyman's rights (jokaisenoikeudet) allow movement and temporary stay in nature irrespective of ownership but forbid disturbing the landowner's land use, disturbing home peace (camping too close to dwellings), felling trees, fires on another's land",
        label: "Ministry of the Environment, Jokaisenoikeudet",
        url: "https://ym.fi/jokaisenoikeudet",
      },
      {
        claim: "Tenure: border zone up to 3 km on land (s.49); staying in it needs a permit (s.52); resident or property-holder gets an open-ended permit (s.53)",
        label: "Border Guard Act 578/2005 ss.49-53, Finlex consolidated (consolidated 2025-04-25)",
        url: "https://www.finlex.fi/fi/lainsaadanto/2005/578",
      },
      {
        claim: "Entry: Leader groups covering the footprint: Vaara-Karjalan Leader (Ilomantsi, Juuka, Lieksa, Nurmes, Valtimo), Joensuun Seudun Leader (Heinävesi, Joensuu, Kontiolahti, Liperi, Outokumpu, Polvijärvi), Keski-Karjalan Jetina (Kitee, Rääkkylä, Tohmajärvi), Elävä Kainuu Leader (incl. Kuhmo, Ristijärvi, Sotkamo), Oulujärvi Leader (incl. Kajaani, Paltamo)",
        label: "Leader Suomi, official list of Leader groups",
        url: "https://leadersuomi.fi/leader-ryhmat",
      },
      {
        claim: "Entry: Kuhmo has 25 village associations or village committees; several villages own former schools as community centres",
        label: "Kuhmo town, Villages",
        url: "https://www.kuhmo.fi/en/housing-and-environment/our-living-environment/villages/",
      },
      {
        claim: "Entry: Joensuu offers a Moving Agent and International House Joensuu",
        label: "City of Joensuu, Move to Joensuu",
        url: "https://www.joensuu.fi/en/city-and-development/our-joensuu/move-to-joensuu/",
      },
      {
        claim: "Entry: Tohmajärvi 1,000-euro moving incentive; five applications met the conditions and the 2026 allocation is used; continuation to be decided in the 2027 budget",
        label: "Tohmajärvi municipality news, August 2026",
        url: "https://www.tohmajarvi.fi/2026/08/uuden-asukkaan-muuttokannustimen-maararaha-kaytetty-vuodelta-2026/",
      },
      {
        claim: "Obligation: population 31 Dec 1990 vs 2025 on the 2026 municipal division (Nurmes includes former Valtimo): the 18 footprint municipalities 253,464 to 219,348 (-13%); the 14 outside Joensuu, Kajaani, Kontiolahti and Liperi 124,574 to 76,809 (-38%); Joensuu 67,363 to 79,129; Kontiolahti 10,450 to 15,060; Liperi 11,500 to 11,980; 15 of 18 municipalities shrank. Whole counties for reference: North Karelia -11%, Kainuu -25%",
        label: "Statistics Finland, table 11ra Key figures on population by region",
        url: "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/vaerak/11ra.px",
      },
    ],
  },
  "scottish-highlands": {
    territory: "Highland crofting townships and the community-owned estates beside them (Knoydart, Eigg, Assynt), on ground where people were cleared in the nineteenth century (Strathnaver in Sutherland, Grulin on Eigg), in a Scotland where 408 landowners hold half of the privately owned rural land; the strength of Gaelic here is not measured at footprint level (8.1% of people aged 3 and over in the Highland council area reported some Gaelic skills in 2022)",
    tenure: "Crofts are regulated: a tenant or owner-occupier crofter must live on or within 32 km of the croft and use it, and a croft tenancy cannot be assigned without the Crofting Commission's consent. Community estates (Eigg 1997, Knoydart 1999, Assynt 2005) are owned by community bodies: Eigg and Knoydart as partnerships with Highland Council and a conservation charity, and Community Land Scotland states that community landowners must have open membership for people living in a defined area. Applecross, by contrast, is a charitable-trust estate, not a community one",
    entry: "Become a resident, not a buyer. Housing comes through the community bodies (rented homes on Knoydart and Eigg, the Assynt and Coigach housing projects) and the Highland Housing Register, open to anyone 16 or over and allocated on a points system that gives priority to housing need; a croft passes by tenancy assignation with the Crofting Commission's consent, or by the purchase of an owner-occupied croft (notified to the Commission), and the residence and use duties come with it. The bodies opened here publish housing projects, not allocation rules for incomers, so ask them first and never outbid them",
    obligation: "Live there, use what you take on, and take part in the community's own governance, such as a community body's open membership; meet Gaelic where it is spoken with respect, not as a curiosity. Where arriving would take a home from a local household, a croft from a township or an estate parcel from a community's reach (Skye, the tourist-core settlements, private estates), the honest answer is not there",
    source: "Crofting Commission, Crofter's duties",
    sourceUrl: "https://www.crofting.scotland.gov.uk/crofters-duties-2/",
  },
  "teruel-uplands": {
    territory: "Small Aragonese upland villages and the commons that bind some of them. In the Sierra de Albarracín the historic Comunidad de Albarracín still exists, a recognised local entity whose 2007 statutes list 23 municipalities, whose mayors meet in a plega, and which holds forest montes in common with the city of Albarracín; the Comunidad de Aldeas de Teruel did not survive the 1830s abolition",
    tenure: "Freehold beside municipal, communal and Comunidad-held monte. On non-urban land one house needs a parcel of at least 10,000 square metres in a place where no cluster of homes forms (by default, two or more homes within 150 metres), so a new multi-household settlement is effectively closed; rehabilitating buildings in aldeas or deserted villages, even into several dwellings, can be authorised. Relatives hold a 30-day first claim on rustic land and buildings kept in the family for two generations (derecho de abolorio)",
    entry: "Through a municipality or a working farmer, not a seller: town halls publish their own offers (Griegos posted free family housing and EUR 100 a month per school-age child in April 2025; its present status is for the town hall to confirm), and conditions are set programme by programme. The LEADER-funded Pueblos Vivos Aragón service advises only EU nationals and people with Spanish work and residence permits. Rent first",
    obligation: "Learn the commons and permit rules before using a village's montes or pasture, and read each offer's own conditions, which differ from place to place. Not there: arriving with no invitation from a municipality or a working farmer, building a new multi-household settlement on non-urban land, or taking a scarce house that someone from the village is looking for",
    source: "Decreto Legislativo 1/2014, Ley de Urbanismo de Aragón, arts. 34-35; Estatutos de la Comunidad de Albarracín, BOA no. 31, 14 March 2007; Código del Derecho Foral de Aragón, arts. 588-598",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOA-d-2014-90410",
    sources: [
      {
        claim: "Building limits on suelo no urbanizable genérico (10,000 m2 parcel, one dwelling, 300 m2, 150 m / two-or-more-homes nucleus test); rehabilitation in aldeas, barrios or deshabitados villages, division into several dwellings, traditional outer form (art. 34.2, art. 35.1.c, art. 242.2)",
        label: "Decreto Legislativo 1/2014, texto refundido de la Ley de Urbanismo de Aragón (BOE consolidated text, updated 2025-02-12)",
        url: "https://www.boe.es/buscar/act.php?id=BOA-d-2014-90410",
      },
      {
        claim: "Derecho de abolorio: relatives to the fourth degree, rustic land and buildings held two generations, 30 natural days tanteo, 90 days retracto, expires two years after sale (arts. 588-598); ademprios and mancomunidad de pastos y leñas (arts. 584-587)",
        label: "Decreto Legislativo 1/2011, Código del Derecho Foral de Aragón (BOE consolidated text)",
        url: "https://www.boe.es/buscar/act.php?id=BOA-d-2011-90007",
      },
      {
        claim: "Comunidad de Albarracín is a Comunidad de villa y tierra, an Aragonese local entity named in art. 95 and listed in art. 2.2.e",
        label: "Ley 7/1999 de Administración Local de Aragón (BOE consolidated text)",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-1999-10151",
      },
      {
        claim: "23 member municipalities, four sexmas, plega of mayors, patrimony of montes held in condominium with the city of Albarracín plus Dehesilla de las Monjas; only surviving comunidad of the four medieval ones (arts. 1, 2, 10, 35, preamble)",
        label: "Estatutos modificados de la Comunidad de Albarracín, Orden of 22 February 2007, BOA no. 31, 14 March 2007 (PDF hosted by the Comunidad)",
        url: "https://www.comunidaddealbarracin.org/old/Estatutos%20Comunidad%20de%20Albarracin.pdf",
      },
      {
        claim: "Comunidad de Aldeas de Teruel: 80 aldeas, six sesmas, dissolved 1833 (secondary source; the Albarracín statutes' preamble dates the royal orders suppressing the comunidades' organs to 1836-37)",
        label: "Wikipedia (es), Comunidad de aldeas de Teruel (secondary source, read alone)",
        url: "https://es.wikipedia.org/wiki/Comunidad_de_aldeas_de_Teruel",
      },
      {
        claim: "Montes de utilidad pública catalogue; montes comunales and vecinales en mano comun (arts. 13-15, 22, 28)",
        label: "Decreto Legislativo 1/2017, texto refundido de la Ley de Montes de Aragón (the former Ley 15/2006)",
        url: "https://www.boe.es/buscar/act.php?id=BOA-d-2017-90392",
      },
      {
        claim: "Farm lease minimum duration five years (art. 12 of the BOE consolidated text)",
        label: "Ley 49/2003 de Arrendamientos Rústicos (BOE consolidated text)",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-2003-21616",
      },
      {
        claim: "Griegos offer (April 2025): free housing for families, EUR 100 a month per school-age child, guaranteed jobs adapted to new residents. Posted offer only; status not confirmed.",
        label: "A.D. Serranía Celtibérica, Bolsa de Repoblación, Ultimas Ofertas",
        url: "https://www.celtiberica.es/bolsaderepoblacion/index.html",
      },
      {
        claim: "Pueblos Vivos Aragon: LEADER-funded, covers Jiloca y Campo de Daroca, Gúdar-Javalambre and Sierra de Albarracín in Teruel; serves EU nationals and people with Spanish work and residence permits only; no financial aid; no foreigner-procedure support",
        label: "Pueblos Vivos Aragón, Cómo te podemos ayudar",
        url: "https://pueblosvivosaragon.com/como-te-podemos-ayudar/",
      },
      {
        claim: "Workshop announcement (Pueblos Vivos Aragon, hosted at ASIADER, Tramacastilla, 7 October 2026): rural housing shortage holds back newcomers and young locals; houses of unknown ownership; tension between tourism and housing. Rural Aragon in general, not footprint-specific",
        label: "Eco de Teruel, 30 September 2026",
        url: "https://ecodeteruel.tv/tramacastilla-acogera-una-jornada-sobre-herramientas-para-que-entidades-locales-puedan-afrontar-la-falta-de-vivienda-rural/",
      },
    ],
  },
  "valle-maira": {
    territory: "Occitan-minority mountain communes of the Cuneo Alps, a historic linguistic minority named in Law 482/1999 — all 13 Unione comuni deliberated their own belonging, and the eight high communes are very small, between 42 and 175 residents each on 1 January 2025",
    tenure: "Private parcels beside collective land (beni collettivi, the demanio civico): under Law 168/2017 it is inalienable, indivisible and permanently agro-silvo-pastoral, administered by the collectivity's own bodies or else by the comune; which land is collective differs comune by comune and must be asked of each",
    entry: "Into a borgata within a comune, living and working there year-round; the inner-areas strategy for Valli Maira e Grana funds services, local production and borgata community spaces to counter decline and names the aim of attracting new firms and workers to the mountain belt, but it is a rural-development programme: no page found invites anyone to take up a particular borgata, so arrival is by relationship, not by offer",
    obligation: "Live and work in the valley rather than keep a holiday house, take up the Occitan and alpeggio culture, and help carry the fragile school, shop and internet minimum; not there for a second home, or for any borgata whose heirs or comune have not asked anyone to reuse it",
    source: "Legge 15 dicembre 1999, n. 482, art. 2 (Normattiva); Regione Piemonte, Elenco dei comuni che hanno applicato la Legge 482/1999 (Occitan, Province of Cuneo; the PDF is not linked because it did not answer from the sandbox on 2026-10-05); Legge 168/2017 arts. 2-3 (beni collettivi); Unione Montana Valle Maira, Strategia Nazionale Aree Interne page; ISTAT, popolazione residente 1 January 2025",
    sourceUrl: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1999-12-15;482~art2",
  },

  // ===================== North America =====================
  cascadia: {
    territory: "Kalapuya territory (Willamette Valley), shared by bands the treaty also names, including Molalla (Cascade foothills) and Chinookan peoples (Clackamas, Multnomah, Cascades; Portland and Willamette Falls) — ceded under the 1855 Treaty with the Kalapuya etc. (Willamette Valley Treaty, signed 22 Jan 1855, ratified 3 Mar 1855); descendant peoples now chiefly of the Confederated Tribes of Grand Ronde, and also the Confederated Tribes of Siletz Indians",
    tenure: "Fee-simple; where land is zoned Exclusive Farm Use under ORS 215, non-agricultural dwellings are limited (the share of rural land so zoned is not verified)",
    entry: "Hire an ORS 215 land-use attorney and plan via a community land trust and Conditional Use Permit before purchasing, not after",
    obligation: "Acknowledge whose land this is and engage one of the continent's most mature regen networks, which expects real participation",
    source: "Oregon Revised Statutes Chapter 215, County Planning; Zoning; Farm Land",
    sourceUrl: "https://www.oregonlegislature.gov/bills_laws/ors/ors215.html",
    territorySource: "Confederated Tribes of Grand Ronde, Treaties (the Tribes' own page: the Willamette Valley Treaty, signed 22 January 1855 and ratified 3 March 1855, with the bands it names)",
    territorySourceUrl: "https://www.grandronde.org/culture-history/treaties/",
    sources: [
      {
        claim: "Kalapuya, Molalla and other peoples counted among the Tribes of Grand Ronde; reservation in Yamhill County",
        label: "Confederated Tribes of Grand Ronde, Culture and History (the Tribes' own page)",
        url: "https://www.grandronde.org/culture-history/",
      },
      {
        claim: "Kalapuya and Molala among the peoples of the Confederated Tribes of Siletz Indians",
        label: "Confederated Tribes of Siletz Indians, home page (the Tribes' own page; names peoples, does not discuss the treaty)",
        url: "https://www.ctsi.nsn.us/",
      },
    ],
  },
  vermont: {
    territory: "N'dakinna — Western Abenaki (Wabanaki) homeland, largely unceded by treaty (the W8banaki Nation's own website writes this territory as Ndakina and names Odanak and Wôlinak as its communities; \"largely unceded by treaty\" is not verified there)",
    tenure: "Fee-simple; Current Use enrolment taxes farm and forest land at a use value rather than market value in return for a use commitment, and Act 250 review can apply to larger communities",
    entry: "Commit the land to productive use (leaving Current Use later triggers a Land Use Change Tax of 10% of full fair market value); whether a multi-household build needs an Act 250 permit depends on the project type, the number of units and the town's zoning and subdivision bylaws, so ask the district coordinator for a jurisdictional opinion early",
    obligation: "Recognise unceded Abenaki homeland and meet the social expectation of doing it right in a 50-year-deep back-to-the-land scene",
    source: "Act 250 Program and History, Vermont Land Use Review Board",
    sourceUrl: "https://act250.vermont.gov/act250-program",
    territorySource: "W8banaki Nation (Grand Conseil de la Nation Waban-Aki), own website: writes the territory as Ndakina and names Odanak and Wôlinak as its communities (one Nation's page; no Vermont-side source is cited here)",
    territorySourceUrl: "https://gcnwa.com/en/",
    sources: [
      {
        claim: "Ndakina as the territory name; Odanak and Wôlinak as the Nation's communities",
        label: "W8banaki Nation (Grand Conseil de la Nation Waban-Aki), own website: one Nation's page, read alone",
        url: "https://gcnwa.com/en/",
      },
      {
        claim: "Current Use taxes farm and forest land on its use value; 2026 use values set on 12 February 2026",
        label: "Vermont Department of Taxes, Current Use",
        url: "https://tax.vermont.gov/property/current-use",
      },
      {
        claim: "Land Use Change Tax of 10% of full fair market value on development or withdrawal from Current Use",
        label: "Vermont Department of Taxes, Land Use Change Tax",
        url: "https://tax.vermont.gov/luct",
      },
      {
        claim: "The 10-acre Act 250 threshold applies in towns with robust zoning and subdivision bylaws; a lower threshold applies elsewhere",
        label: "Act 250, 1-Acre and 10-Acre Municipalities (Vermont Land Use Review Board)",
        url: "https://act250.vermont.gov/1-acre-and-10-acre-municipalities",
      },
    ],
  },
  "southern-appalachians": {
    territory: "Cherokee homeland (ᎠᏂᏴᏫᏯ Aniyvwiya) — the Asheville and French Broad country was taken through a run of treaty cessions ending with the 1819 Treaty of Washington; the 1835 Treaty of New Echota, signed by a minority against Principal Chief John Ross's petition, took what remained and led to the 1838–39 Trail of Tears; the Eastern Band of Cherokee Indians remains at the Qualla Boundary",
    tenure: "Fee-simple; the Present-Use Value deferral cuts tax sharply, but only for qualifying land: an individual buyer of land not already enrolled must live on it or have owned it four years, while land already enrolled stays in only if the new owner applies within 60 days of transfer (AV-4)",
    entry: "Hold the land in freehold; if it is already enrolled in Present-Use Value, file the AV-4 within 60 days to keep it; and read the watershed honestly after Helene's 2024 flash-flooding",
    obligation: "Honour Cherokee homeland and the dense Earthaven/Celo regen network whose demand is capitalised into the land",
    source: "NC General Statutes §§105-277.2 to 105-277.7, Present-Use Value Programme",
    sourceUrl: "https://www.ncleg.gov/EnactedLegislation/Statutes/PDF/ByChapter/Chapter_105.pdf",
    territorySource: "Kappler, Indian Affairs: Laws and Treaties, Treaty with the Cherokee, 1819, Art. 1 (cession of lands north and east of a line along the Blue Ridge), Oklahoma State University",
    territorySourceUrl: "https://treaties.okstate.edu/treaties/treaty-with-the-cherokee-1819-0177",
    sources: [
      {
        claim: "Treaty of New Echota: cession of all remaining lands east of the Mississippi",
        label: "Kappler, Treaty with the Cherokee, 1835, Oklahoma State University",
        url: "https://treaties.okstate.edu/treaties/treaty-with-the-cherokee-1835-0439",
      },
      {
        claim: "Treaty Party of about 100, John Ross petition of more than 15,000 signatures, Senate approval by one vote, removal and the Qualla Boundary (a state library summary, not a Cherokee source)",
        label: "NCpedia, Cherokee People in North Carolina",
        url: "https://www.ncpedia.org/cherokee/trailoftears",
      },
    ],
  },
  driftless: {
    territory: "Ho-Chunk (Hoocąk) homeland — Ho-Chunk oral tradition holds “we have always been here”; the lands were ceded under the 1829, 1832 and 1837 treaties and the people were removed more than once, yet the Ho-Chunk Nation of Wisconsin remains here, with scattered land in many Wisconsin counties and no contiguous reservation; historic Sauk & Meskwaki presence",
    tenure: "Fee-simple; foreign persons may hold at most 640 acres under Wis. Stat. §710.02, and a 2025–26 bill (AB 218) proposed cutting that to 50 acres",
    entry: "Hold land through a US cooperative or community land trust and test wells across multiple seasons before buying",
    obligation: "Acknowledge Ho-Chunk homeland and treat every land-use choice as a shared water-quality choice in fractured karst",
    source: "Wisconsin Statute §710.02, Foreign Ownership of Land",
    sourceUrl: "https://docs.legis.wisconsin.gov/statutes/statutes/710/02",
    territorySource: "Ho-Chunk Nation, About (the Nation's own page: \"we have always been here\"; traditional lands in Wisconsin, Minnesota, Iowa, Missouri and Illinois)",
    territorySourceUrl: "https://ho-chunknation.com/about/",
    sources: [
      {
        claim: "Cession of lands south of the Wisconsin River, 1829 (Prairie du Chien)",
        label: "Kappler, Treaty with the Winnebago, 1829, Oklahoma State University",
        url: "https://treaties.okstate.edu/treaties/treaty-with-the-winnebago-1829-0300",
      },
      {
        claim: "Cession of lands south and east of the Wisconsin and Fox rivers, 1832 (Fort Armstrong)",
        label: "Kappler, Treaty with the Winnebago, 1832, Oklahoma State University",
        url: "https://treaties.okstate.edu/treaties/treaty-with-the-winnebago-1832-0345",
      },
      {
        claim: "Cession of all land east of the Mississippi, 1837 (Washington)",
        label: "Kappler, Treaty with the Winnebago, 1837, Oklahoma State University",
        url: "https://treaties.okstate.edu/treaties/treaty-with-the-winnebago-1837-0498",
      },
      {
        claim: "Sauk and Fox boundary running up the Wisconsin river from its mouth",
        label: "Kappler, Treaty with the Sauk and Foxes, 1804, Oklahoma State University",
        url: "https://treaties.okstate.edu/treaties/treaty-with-the-sauk-and-foxes-1804-0074",
      },
      {
        claim: "Foreign persons may not hold more than 640 acres; Assembly Substitute Amendment 1 to AB 218 (August 2025) proposed 50 acres",
        label: "Wisconsin Lawyer (State Bar of Wisconsin), Corporate & Foreign Ownership of Agricultural Land",
        url: "https://www.wisbar.org/NewsPublications/WisconsinLawyer/Pages/Article.aspx?Volume=98&Issue=9&ArticleID=31246",
      },
      {
        claim: "Repeated forced removals, scattered land holdings and no contiguous reservation (a secondary source; the Nation's own pages opened do not state this)",
        label: "Wikipedia, Ho-Chunk (secondary source, read alone)",
        url: "https://en.wikipedia.org/wiki/Ho-Chunk",
      },
    ],
  },
  ozarks: {
    territory: "Osage homeland — Ozark hunting grounds ceded in the 1808 Treaty of Fort Clark; Quapaw territory to the south, and Western Cherokee held a reservation between the Arkansas and White Rivers 1817–1828",
    tenure: "Fee-simple; permissive by omission, with title, mineral-rights split, and road-access easement traps; Arkansas Act 636 of 2023 bars 'prohibited foreign parties' (nationals and entities of ITAR 22 CFR 126.1 countries) from acquiring any interest in agricultural or timber land",
    entry: "Commission a full title search and confirm road-access easements before buying largely unregulated agricultural land",
    obligation: "Acknowledge Osage homeland and build relationships from scratch where formal regen institutions are thin",
    source: "Kappler, Indian Affairs: Laws and Treaties, Treaty with the Osage 1808 (Fort Clark), Art. 6",
    sourceUrl: "https://treaties.okstate.edu/treaties/treaty-with-the-osage-1808-0095",
    territorySource: "Kappler, Indian Affairs: Laws and Treaties, Treaty with the Osage, 1808 (Fort Clark), Art. 6, Oklahoma State University",
    territorySourceUrl: "https://treaties.okstate.edu/treaties/treaty-with-the-osage-1808-0095",
    sources: [
      {
        claim: "Osage ancestral geography across Missouri",
        label: "Osage Nation, Osage Cultural History (the Nation's own page, an excerpt from its historic preservation office)",
        url: "https://osagenation-nsn.gov/who-we-are/historic-preservation/osage-cultural-history",
      },
      {
        claim: "Quapaw cession of land south of the Arkansas River and reserved tract, 1818",
        label: "Kappler, Treaty with the Quapaw, 1818, Oklahoma State University",
        url: "https://treaties.okstate.edu/treaties/treaty-with-the-quapaw-1818-0160",
      },
      {
        claim: "Cherokee tract on the Arkansas, 1817",
        label: "Kappler, Treaty with the Cherokee, 1817, Oklahoma State University",
        url: "https://treaties.okstate.edu/treaties/treaty-with-the-cherokee-1817-0140",
      },
      {
        claim: "Western Cherokee surrender of the Arkansas lands, 1828",
        label: "Kappler, Treaty with the Western Cherokee, 1828, Oklahoma State University",
        url: "https://treaties.okstate.edu/treaties/treaty-with-the-western-cherokee-1828-0288",
      },
    ],
  },
  "northern-new-mexico": {
    territory: "Taos Pueblo (Northern Tiwa) land, with neighbouring Picuris Pueblo (Tiwa), the Tewa pueblos to the south, and rooted Hispano land-grant acequia communities",
    tenure: "Fee-simple, but acequia-served land carries binding ditch-association governance and prior-appropriation water rights",
    entry: "Join the acequia as a parciante (a holder of water rights in the ditch): vote in ditch elections and on contracts, and contribute fatigue labour (or its assessed cash equivalent) to the annual limpia",
    obligation: "Take on the commons duty of the ditch and respect both Pueblo presence and generations-old acequia culture",
    source: "New Mexico Statutes §73-2-21 (2025), Commissioners' powers and duties; mayordomo's duties",
    sourceUrl: "https://law.justia.com/codes/new-mexico/chapter-73/article-2/section-73-2-21/",
    territorySource: "Taos Pueblo, Our History (the Pueblo's own page)",
    territorySourceUrl: "https://taospueblo.com/history/",
    sources: [
      {
        claim: "Picuris Pueblo in Taos County, New Mexico",
        label: "Picuris Pueblo, home page (the Pueblo's own page)",
        url: "https://picurispueblo.org/",
      },
      {
        claim: "Taos and Picuris as Northern Tiwa speakers; Tewa as a separate branch (a secondary source, read alone)",
        label: "Wikipedia, Northern Tiwa language (secondary source)",
        url: "https://en.wikipedia.org/wiki/Northern_Tiwa_language",
      },
    ],
  },
  "nova-scotia": {
    territory: "Unceded Mi'kma'ki — Mi'kmaq territory held under the Peace and Friendship Treaties, never ceded by land surrender",
    tenure: "Fee-simple over unceded land; a 10% Non-Resident Deed Transfer Tax applies to residential property including vacant residential land, unless the land is genuinely non-residential (e.g. agricultural, not intended for residential use) or the buyer moves to Nova Scotia within 6 months",
    entry: "Settle one or two members first through an immigration pathway open to them (the provincial nominee programme is one; its current allocation is not verified), then buy together",
    obligation: "Recognise unceded Mi'kma'ki and the Peace and Friendship Treaties, and join a thin regen scene in relationship rather than colonising it",
    source: "Nova Scotia Finance, Non-Resident Provincial Deed Transfer Tax guidelines",
    sourceUrl: "https://novascotia.ca/finance/en/home/taxation/tax101/docs/Nova-Scotia-Provincial-Non-resident-Deed-Transfer-Tax-Guidelines.pdf",
    territorySource: "Crown-Indigenous Relations and Northern Affairs Canada, Peace and Friendship Treaties (the federal government's page: the treaties did not involve surrendering rights to the land)",
    territorySourceUrl: "https://www.rcaanc-cirnac.gc.ca/eng/1100100028589/1539608999656",
    sources: [
      {
        claim: "Mi'kmaw Assembly and Kwilmu'kw Maw-klusuaqn writing from Mi'kma'ki",
        label: "Kwilmu'kw Maw-klusuaqn (Mi'kmaw Rights Initiative), home page (the Mi'kmaw organisation's own page)",
        url: "https://mikmaqrights.com/",
      },
    ],
  },
  kootenays: {
    territory: "Unceded Sinixt, Ktunaxa & Syilx territory: the Syilx Okanagan Nation Alliance, which counts Sinixt among Syilx people, says reserves were set out without a treaty, and the Ktunaxa Nation names about 70,000 square kilometres of the Kootenay region as its traditional territory; \"unceded\" is not verified against a treaty text for Ktunaxa land",
    tenure: "Fee-simple, much within the Agricultural Land Reserve (as of right: one principal residence up to 500 m2 total floor area, one secondary suite in it, and one additional residence of up to 90 m2 on parcels of 40 ha or less, or up to 186 m2 above 40 ha; anything further needs Agricultural Land Commission permission); Crown duty to consult applies",
    entry: "Work with the Agricultural Land Commission and the water-licence system; plans for more than the residences allowed as of right need Commission permission, and how long that takes is not verified",
    obligation: "Honour the Crown duty to consult on unceded territory and engage knowledgeable, skeptical neighbours who expect real engagement",
    source: "ALR Use Regulation, BC Reg 30/2019",
    sourceUrl: "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/30_2019",
    territorySource: "Syilx Okanagan Nation Alliance, History (the Alliance's own account, which counts Sinixt among Syilx people and records reserves set out without a negotiated treaty)",
    territorySourceUrl: "https://syilx.org/about/history/",
    sources: [
      {
        claim: "ʔamakʔis Ktunaxa, the Ktunaxa traditional territory, about 70,000 square kilometres in the Kootenay region",
        label: "Ktunaxa Nation, ʔamakʔis Ktunaxa (the Nation's own page; it names no treaty status)",
        url: "https://ktunaxa.org/about/map/",
      },
    ],
  },
  "quebec-eastern-townships": {
    territory: "Unceded W8banaki (Western Abenaki) territory, Ndakina — Odanak & Wôlinak first nations; the Nation's own history page records the 1792 township grants south of the seigneuries without naming a cession treaty, but \"unceded\" itself is not verified on it",
    tenure: "Civil-law freehold with notarial deeds; the CPTAQ Green Zone controls farmland purchases: non-residents need authorization above 4 ha, and since Bill 86 (2025) so do investment funds, buyers above a regulated holding cap, and buyers who will not register a farm operation on land within 1 km of an urbanization perimeter in designated regions",
    entry: "Lead with a credible agricultural mission (a registered farm operation), secure CPTAQ authorization where it applies (the acquisition triggers above, and any non-agricultural use or additional dwelling in the Green Zone), and do it in French",
    obligation: "Integrate in French into a francophone-dominant regen network and recognise unceded Abenaki territory",
    source: "Publications du Québec, SQ 2025, c. 5 (Bill 86, assented 25 March 2025), official English text",
    sourceUrl: "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF",
    territorySource: "W8banaki Nation (Grand Conseil de la Nation Waban-Aki), History of the Nation (the Nation's own page: Ndakina, Odanak and Wôlinak, the 1792 township grants)",
    territorySourceUrl: "https://gcnwa.com/en/history-of-the-nation/",
  },
  oaxaca: {
    territory: "Zapotec, Mixtec, Mixe (Ayuuk), Chinantec, Chatino and other Indigenous peoples' comunal and ejido lands",
    tenure: "Ejido and comunal land governed by the Ley Agraria and each community's own norms (usos y costumbres): foreigners cannot own it (ejidatarios must be Mexican; comunal land is inalienable), and can only hold a parcel after an ejido assembly allows dominio pleno and the owner takes it out of the Registro Agrario Nacional, or use land by agreement (leases up to 30 years, comunal assembly use rights)",
    entry: "Negotiate entry with the comunal or ejido assembly, not a seller, with competent Mexican agrarian counsel — never a prestanombre front-owner",
    obligation: "Make the legal and relational the same dimension: 418 of 570 municipalities elect their authorities through traditional assemblies (usos y costumbres), on ejido and comunal land the agrarian assembly decides who may use it, and the deepest knowledge here is Indigenous",
    source: "Ley Agraria (1992, reformed), Artículos 76-82 and 98-107",
    sourceUrl: "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf",
    territorySource: "SIPAZ, Facts about Oaxaca I (an international peace-service NGO's summary of INEGI and CDI figures, not a community's own page: peoples, language counts, 418 of 570 municipalities elected by traditional assemblies)",
    territorySourceUrl: "https://www.sipaz.org/facts-about-oaxaca-i/?lang=en",
  },
  "bas-saint-laurent": {
    territory: "Wolastokuk, Gespe'gewa'gi and Nionwentsïo meet here, and no claim is settled. West of the Métis watershed lies Wolastokuk, the ancestral territory of the Wolastoqiyik (Maliseet) Wahsipekuk First Nation, whose small reserve is at Cacouna and which filed a comprehensive land claim with Canada and Québec in 2006. East and south are the Mi'gmaq of Gespe'gewa'gi (Listuguj, Gesgapegiag, Gespeg), who call their territory ancestral and unceded and whose own river-systems page names the Matapédia among the rivers of Gespe'gewa'gi. The Huron-Wendat Nation claims a territory, Nionwentsïo, that reaches east to beyond Rivière-du-Loup and takes in the Côte-du-Sud, Kamouraska and part of Témiscouata, on the strength of the 1760 treaty, and overlaps Wolastokuk. The Peace and Friendship Treaties the Wolastoqiyik and Mi'gmaq signed involved no surrender of land, and Canada's 2022 consultation map (illustrative, not definitive) shows their asserted territory running the whole south shore",
    tenure: "Québec civil-law freehold with notarial deeds, under a farmland regime that decides most of what a buyer may do. In the CPTAQ agricultural zone, non-farm use, subdivision or a partial sale needs the Commission's authorisation, and a house is allowed only in listed cases (a vacant holding of 100 ha or more, a qualifying producer, a recognised acquired right or sector). Under Bill 86 (2025), buying 4 ha or more of farmland needs authorisation if the buyer is an investment fund, or if the land lies within 1,000 m of an urbanisation perimeter in an MRC the Act's interim list covers and the buyer is not a registered farm; of the region's eight MRCs, only Rimouski-Neigette and Rivière-du-Loup are on that interim list, and a government decree may extend it. Anyone who is not a Canadian citizen or permanent resident, or has not lived in Québec 1,095 of the last 48 months, is a non-resident and needs authorisation for 4 ha or more of farmland, granted to a person who intends to settle on condition of living in Québec 1,095 days in the next 48 months and being a citizen or permanent resident by the end of it. Public forest is the other tenure, and it is where the nations' claims and agreements are live",
    entry: "Arrive as a resident, not a buyer. The regional collective runs a free welcome service, with a team in each of the eight MRCs, and Place aux jeunes serves ages 18 to 35, immigrant workers with a valid permit included; the same page lists resources for people 36 and over. Onto working farms open ARTERRE (matching aspiring farmers with owners, two agents covering all eight MRCs), the Germoir farm incubator and the farm-transfer help of the regional food table. In its first year (2018-19) ARTERRE recorded 150 sign-ups and one transfer, a rental, and about half the would-be buyers came from outside the region. Place aux jeunes is a youth programme and the pages opened publish no route for a group, so a family or group arrival is a fit limit to ask about, not assume",
    obligation: "Learn French before you land: it is the official language of Québec and the normal language of work. Go to the nations before you go to the land: ask the Wolastoqiyik Wahsipekuk about Wolastokuk and the Mi'gmawei Mawiomi about Gespe'gewa'gi, and keep to farm succession and service roles inside villages. Where arriving would mean a claim on Crown land, including the public land where Parke is closed to non-Indigenous hunters, the honest answer is not there. Not there either for arriving without French, or for treating Gaspésie, a separate region with its own communities, as part of this one",
    source: "Loi sur l'acquisition de terres agricoles par des non-résidents (RLRQ c. A-4.1), art. 2, 8 and 15.2; Québec, SQ 2025, c. 5 (Bill 86), s. 79.0.6, s. 105.5 and Schedule B",
    sourceUrl: "https://www.legisquebec.gouv.qc.ca/en/document/cs/a-4.1",
    territorySource: "Première Nation Wolastoqiyik Wahsipekuk, Wolastokuk (territoire ancestral) (the First Nation's own page)",
    territorySourceUrl: "https://wolastoqiyikwahsipekuk.ca/fr/territoire",
  },
  "downeast-maine": {
    territory: "Wabanakik, the Dawnland: homeland of the four Wabanaki Nations of Maine (Passamaquoddy, Penobscot, Maliseet, Mi'kmaq). In Washington County the Passamaquoddy Tribe calls the St. Croix (Schoodic) watershed the heart of its ancestral homeland, and its communities at Sipayik (Pleasant Point) and Motahkomikuk (Indian Township) lie inside the county. In law, a 1794 treaty with Massachusetts assigned the Passamaquoddy lands in this county in return for relinquishing claims elsewhere, and the 1980 Maine Indian Claims Settlement Act (Pub. L. 96-420, s.4) then ratified earlier land transfers and extinguished aboriginal title and related claims. First Light, working with the Wabanaki Commission, still says plainly that Maine is first a Wabanaki place.",
    tenure: "Private fee-simple under Maine law, much of it large commercial forest and blueberry land. Passamaquoddy reservation and trust land inside the county is tribal territory, never a market: under the Maine Implementing Act the right to reside there is an internal tribal matter. Land is also coming back, among it Kuwesuwi Monihq (Pine Island, 140 acres in Big Lake, returned in 2021). Unorganised townships are zoned by the Land Use Planning Commission, which under a January 2026 law must include a member of a federally recognised Nation in Maine, on the Nations' joint recommendation.",
    entry: "Not at the front door. Begin with the Wabanaki-led learning that First Light points to (its courses and resources, and the Wabanaki REACH trainings it lists for organizations), then use a documented, non-extractive route: Maine Farmland Trust's Maine FarmLink and Buy/Protect/Sell programme for land that stays in farming, and the county's own housing and economic bodies. Maine Farmland Trust announced in July 2026 that some programmes will be scaled back, so confirm what still runs. Never go after a parcel that a tribal government, the Wabanaki Commission or a Tributary conservation partner has in play for return.",
    obligation: "Not there for any parcel earmarked for return or under negotiation, and, on this map's reading, not there at all before a relationship exists. First Light's published process puts land requests from Chiefs and Tribal councils first and the general public last, and asks that Wabanaki voices come at the start of any decision, not the end. Where a community can, it supports return and the unrestricted Wolankeyutomone kisi apaciyewik Fund, and arrives aware that an estimated 59 percent of county households already cannot afford to buy a home (Sunrise County Economic Council, June 2026).",
    source: "Wabanaki Commission on Land and Stewardship and First Light, Return (land recovery priorities); Maine Implementing Act, 30 M.R.S. ch. 601",
    sourceUrl: "https://dawnlandreturn.org/first-light/lets-work-together/return",
    territorySource: "Passamaquoddy Tribe at Sipayik, St. Croix River (the Tribe's own page: the St. Croix watershed as the heart of the Passamaquoddy ancestral homeland)",
    territorySourceUrl: "https://wabanaki.com/st_croix_river-2/",
    sources: [
      {
        claim: "The 1794 treaty with Massachusetts: lands assigned to the Passamaquoddy in Washington County in return for relinquishing claims elsewhere in the Commonwealth",
        label: "Passamaquoddy Tribe at Indian Township, Treaty of 1794 (the Tribe's own page, treaty text)",
        url: "https://www.passamaquoddy.com/?page_id=1422",
      },
      {
        claim: "Maine is first a Wabanaki place; land recovery priorities from Chiefs and Tribal councils first and the general public last; the Wolankeyutomone kisi apaciyewik Fund",
        label: "Dawnland Return (First Light), Return",
        url: "https://dawnlandreturn.org/first-light/lets-work-together/return",
      },
      {
        claim: "The four Wabanaki Nations of Maine named as the Wabanaki Commission's representatives",
        label: "Wabanaki Commission on Land and Stewardship (Dawnland Return)",
        url: "https://dawnlandreturn.org/wabanaki-commission",
      },
      {
        claim: "Nothing about us without us; Wabanaki perspectives from the beginning of a process",
        label: "Dawnland Return (First Light), Recenter",
        url: "https://dawnlandreturn.org/first-light/lets-work-together/recenter",
      },
      {
        claim: "Kuwesuwi Monihq (Pine Island), 140 acres in Big Lake, returned in 2021",
        label: "Wabanaki Commission, Kuwesuwi Monihq project page",
        url: "https://dawnlandreturn.org/wabanaki-commission/projects/kuwesuwi-monihq-pine-island",
      },
      {
        claim: "Maine Implementing Act: the right to reside within the Indian territories is an internal tribal matter",
        label: "Maine Revised Statutes, 30 M.R.S. section 6206",
        url: "https://legislature.maine.gov/statutes/30/title30sec6206.html",
      },
      {
        claim: "Land Use Planning Commission membership, as amended by Public Law 2025 chapter 534 (January 2026)",
        label: "Maine Revised Statutes, 12 M.R.S. section 681-682",
        url: "https://legislature.maine.gov/statutes/12/title12sec681.html",
      },
      {
        claim: "Access to farmland programmes: Maine FarmLink and Buy/Protect/Sell",
        label: "Maine Farmland Trust, Access Farmland",
        url: "https://www.mainefarmlandtrust.org/farmland/access-farmland",
      },
      {
        claim: "Some programmes to be scaled back (July 2026 organisational update)",
        label: "Maine Farmland Trust, July 2026 Organizational Update",
        url: "https://www.mainefarmlandtrust.org/blogs/july-2026-organizational-update",
      },
      {
        claim: "An estimated 59% of Washington County households cannot afford to purchase a home (June 2026)",
        label: "Sunrise County Economic Council, New Tools to Understand Washington County's Housing Crisis",
        url: "https://sunrisecounty.org/2026/06/new-tools-to-understand-washington-countys-housing-crisis/",
      },
    ],
  },
  "finger-lakes": {
    territory: "Cayuga homeland: the account on the Cayuga Nation Council's own website names the Cayuga ('The People of the Great Swamp', one of the five original Haudenosaunee nations) and places their ancestral homeland around Cayuga Lake, between the Onondaga Nation to the east and the Seneca Nation to the west. Not simply unceded: New York bought the land by treaty in 1789, in 1795 and again in the early 1800s, and that account calls the 1795 and 1805 sales illegal and says they left the Cayuga landless for over 200 years. A federal trial court held the 1795 and 1807 conveyances invalid because the federal government never ratified them, yet in 2005 the Second Circuit barred the 64,015-acre claim by laches. That account also says the Cayuga have bought parcels back at market prices since 2003",
    tenure: "New York fee simple under town zoning, with farmland that may sit inside a state agricultural district. Article II of the 1794 Treaty of Canandaigua acknowledged the Cayuga reservation as the Cayuga's property 'until they choose to sell the same to the people of the United States'; the court record places it on both shores of the northern end of Cayuga Lake. Land a Native nation buys back stays under state and local law unless the Interior Department takes it into trust (City of Sherrill v. Oneida Indian Nation, 2005, which the Second Circuit applied to the Cayuga claim); the timeline on that website records a 113-acre trust application and no outcome. Non-citizens hold New York land on the same terms as citizens",
    entry: "Not through the market. The account on the Cayuga Nation Council's own website offers no invitation to newcomers, and the northern end of Cayuga Lake, where the 1794 treaty and the court record place the Cayuga reservation, is not there for a market bid. Arriving through the Ithaca housing market is not there either. The routes that exist are small and consent-based: EcoVillage at Ithaca (about 100 homes) admits renters and buyers only after a membership process (a 3 to 5 day visit, an official tour), and Groundswell's incubator farm gives quarter-acre plots to beginning farmers and prioritises people facing barriers to land, so a settler group should not ask it for a seat. Begin by listening to what the Cayuga, Onondaga and Seneca nations say in their own words",
    obligation: "Acknowledge the land as Cayuga homeland in the terms of the account on the Cayuga Nation Council's own website, and take the 1794 treaty as that account does, as still in force and repeatedly violated. Where arriving would put you in the Ithaca market, at the northern end of Cayuga Lake, or in a seat meant for a farmer facing barriers, the honest answer is not there. Take part through the bodies that already exist, such as the Finger Lakes Land Trust's conservation easements and EcoVillage's work teams",
    source: "Cayuga Nation Council's own website, History & Culture (one council's account), read with Article II of the 1794 Treaty of Canandaigua (Kappler, Indian Affairs: Laws and Treaties, vol. 2) and Cayuga Indian Nation of New York v. Pataki, 413 F.3d 266 (2d Cir. 2005)",
    sourceUrl: "https://cayuganation-nsn.gov/history-culture/",
    territorySource: "Cayuga Nation Council's own website, History & Culture (one council's account of the Cayuga homeland; no other Cayuga source was opened)",
    territorySourceUrl: "https://cayuganation-nsn.gov/history-culture/",
    sources: [
      {
        claim: "The Cayuga as the People of the Great Swamp; homeland between the Onondaga and the Seneca; 1795 and 1805 sales called illegal; landless for over 200 years; 64,015-acre claim; market-price repurchases since 2003; 113-acre trust application; the 1794 treaty described as still in force",
        label: "Cayuga Nation Council's own website, History & Culture (one council's account; no other Cayuga source was opened)",
        url: "https://cayuganation-nsn.gov/history-culture/",
      },
      {
        claim: "Article II acknowledges the Cayuga reservation \"until they choose to sell the same to the people of the United States\"",
        label: "Treaty with the Six Nations, 1794, Art. II (Kappler, Indian Affairs: Laws and Treaties, vol. 2; Oklahoma State University)",
        url: "https://treaties.okstate.edu/treaties/treaty-with-the-six-nations-1794-0034",
      },
      {
        claim: "1789 treaty with New York; 1795 and 1807 conveyances never ratified federally and held invalid by the district court; 2005 laches ruling; the Original Reservation on the shores of the northern end of Cayuga Lake",
        label: "Cayuga Indian Nation of New York v. Pataki, 413 F.3d 266 (2d Cir. 2005), Harvard Caselaw Access Project copy",
        url: "https://static.case.law/f3d/413/html/0266-01.html",
      },
      {
        claim: "Open-market purchase does not revive sovereignty; the trust process is the route",
        label: "City of Sherrill v. Oneida Indian Nation of New York, 544 U.S. 197 (2005)",
        url: "https://www.law.cornell.edu/supremecourt/text/03-855",
      },
      {
        claim: "Onondaga historic territory in the Onondaga Nation's own words (the page does not mention the Cayuga)",
        label: "Onondaga Nation, Land Rights (the Nation's own page)",
        url: "https://www.onondaganation.org/land-rights/",
      },
      {
        claim: "The Cayuga named as one of five member nations",
        label: "Haudenosaunee Confederacy, Who We Are (the Confederacy's own page)",
        url: "https://www.haudenosauneeconfederacy.com/who-we-are/",
      },
      {
        claim: "Non-citizens may take, hold, transmit and dispose of real property as native-born citizens",
        label: "New York Real Property Law section 10 (opened in a fetch tool; scripted requests get 403)",
        url: "https://www.nysenate.gov/legislation/laws/RPP/10",
      },
      {
        claim: "Sound agricultural practice is not a private nuisance",
        label: "New York Agriculture and Markets Law section 308 (opened in a fetch tool; scripted requests get 403)",
        url: "https://www.nysenate.gov/legislation/laws/AGM/308",
      },
      {
        claim: "Membership process, 3 to 5 day visit, official tour, about 100 homes; 50 acres under a conservation easement held by the Finger Lakes Land Trust",
        label: "EcoVillage at Ithaca, Living Here and About",
        url: "https://ecovillageithaca.org/about/living-here/",
      },
      {
        claim: "Incubator farm on leased land, quarter-acre plots, admission priority for people facing barriers",
        label: "Groundswell Center, The Incubator Farm",
        url: "https://groundswellcenter.org/the-incubator-farm/",
      },
    ],
  },
  "ne-missouri-se-iowa": {
    territory: "Sauk (Sac), Meskwaki (Fox) and Ioway land, taken by treaty cession and removal, not unceded in law. In 1824 the Sauk and Foxes and the Ioway each quit-claimed their claims in Missouri between the Mississippi and Missouri rivers, which takes in Schuyler, Scotland and Clark. After the Black Hawk War the 1832 treaty took the Iowa land reaching 50 miles west from the Mississippi along the Missouri line (Lee, Van Buren and part of Davis), and in 1842 the Sauk and Meskwaki ceded every remaining claim west of the Mississippi and were removed. Dancing Rabbit's own acknowledgement also names the Osage, Otoe-Missouria and Illini as original peoples of northeast Missouri. The Meskwaki came back and bought land with their own money in 1857, at Tama, a county far from here. The living nations include the Meskwaki Nation (the Sac & Fox Tribe of the Mississippi in Iowa), the Sac and Fox Nation in Oklahoma, the Sac & Fox Nation of Missouri in Kansas and Nebraska, whose own history says its people were removed to northeast Missouri, and the Iowa Tribe of Kansas and Nebraska and the Iowa Tribe of Oklahoma",
    tenure: "Fee simple under two state regimes that must not be blurred. Missouri bars aliens and foreign businesses from agricultural land once aggregate foreign ownership passes one percent of the state's farm acreage (RSMo 442.571) and restricts corporate farming, with an exemption for educational, religious or charitable nonprofits (RSMo 350.015). Iowa bars nonresident aliens, foreign businesses and foreign governments from agricultural land with listed exceptions (Iowa Code 9I.3), and restricts corporate, LLC and trust holders under chapter 9H, with an exception for nonprofit corporations (9H.4). The communities here hold land in common through nonprofit land trusts: Dancing Rabbit's 280 acres, bought in 1997, are leased to members as warrens, not sold; Red Earth Farms is a 76-acre community land trust; Sandhill is a 168-acre nonprofit land project",
    entry: "Not as a lone buyer arriving on price. The community's own history lists affordable land with no zoning and no building codes among its land-search criteria, and arriving on price repeats that founding move: not there. The ways in that could be verified are slow and run through people, and all three are in Scotland County, Missouri. Dancing Rabbit asks for a visit first, usually at least a week, then a letter of intent, a community survey and an interview, then six months as a resident before a membership application, and members lease land from the land trust. Sandhill's process is a visitor form, a call, group consensus, 14 days on the farm and a year of residency, generally 18 to 24 months in all, and it is looking for families with children and people who want to farm. Red Earth Farms takes scheduled visitors only, from May to October, and makes your letter available to everyone in the community before you come. No Nation's page opened for this entry offers settlers a route in; any relationship with them is theirs to open, not the arriving community's to claim",
    obligation: "Hold the removal in the same sentence as the arrival, and do not repeat the founding move named above. Where arriving would mean buying around neighbours in a farming country with an ageing population, or landing as a lone buyer chasing low prices rather than joining a community that already holds land in common, the honest answer is not there. What it asks is to join existing covenants and work rotations, to keep the removals named, as Dancing Rabbit's acknowledgement does for the peoples it lists, and to say plainly, as Dancing Rabbit's acknowledgement does, that the name and the land carry a history still being worked out",
    source: "Treaty with the Sauk and Foxes, 1824 (7 Stat. 229), read with the 1832 (7 Stat. 374) and 1842 (7 Stat. 596) Sauk and Fox treaties and the 1824 Treaty with the Iowa (7 Stat. 231), Kappler, Indian Affairs: Laws and Treaties, Oklahoma State University; tenure from RSMo 442.571 and 350.015, Iowa Code chapters 9I and 9H, and Dancing Rabbit's own FAQ and history",
    sourceUrl: "https://treaties.okstate.edu/treaties/treaty-with-the-sauk-and-foxes-1824-0207",
    territorySource: "Kappler, Indian Affairs: Laws and Treaties, Treaty with the Sauk and Foxes, 1824 (7 Stat. 229), Oklahoma State University (treaty text; the nations' own pages are listed as further sources, two of them through Wayback copies)",
    territorySourceUrl: "https://treaties.okstate.edu/treaties/treaty-with-the-sauk-and-foxes-1824-0207",
    sources: [
      {
        claim: "Sauk and Foxes cede claims in Missouri between the Mississippi and Missouri rivers, Aug 4 1824, 7 Stat. 229 (quit-claim)",
        label: "Treaty with the Sauk and Foxes, 1824 (Kappler, OSU)",
        url: "https://treaties.okstate.edu/treaties/treaty-with-the-sauk-and-foxes-1824-0207",
      },
      {
        claim: "Ioway cede claims within Missouri, same bounds, Aug 4 1824, 7 Stat. 231",
        label: "Treaty with the Iowa, 1824 (Kappler, OSU)",
        url: "https://treaties.okstate.edu/treaties/treaty-with-the-iowa-1824-0208",
      },
      {
        claim: "Black Hawk Purchase: cession bounded by the Missouri northern line 50 miles from the Mississippi; removal by June 1 1833; Keokuk reserve",
        label: "Treaty with the Sauk and Foxes, 1832 (Kappler, OSU)",
        url: "https://treaties.okstate.edu/treaties/treaty-with-the-sauk-and-foxes-1832-0349",
      },
      {
        claim: "1842: cede all lands west of the Mississippi to which they have any claim; removal west of the Red Rocks line, then to the Missouri river waters",
        label: "Treaty with the Sauk and Foxes, 1842 (Kappler, OSU)",
        url: "https://treaties.okstate.edu/treaties/treaty-with-the-sauk-and-foxes-1842-0546",
      },
      {
        claim: "1804 treaty falsely unified Sauk and Meskwaki; 1804 51m acres; 1832 7.25m acres; 1842 removal; 1856 permission to remain; 1857 80 acres at Tama bought with $1,000 of the Nation's own money; over 8,000 acres now; Meskwaki means People of the Red Earth",
        label: "Iowa PBS, Meskwaki Nation's Story: Survival, Land and Sovereignty in Iowa (the Meskwaki account in Iowa PBS's words): a public broadcaster's account of the Meskwaki story, not the Nation's own page",
        url: "https://www.iowapbs.org/home/special/13969/meskwaki-nations-story-survival-land-and-sovereignty-iowa",
      },
      {
        claim: "Ioway: moved villages into northern Missouri; Iowa Tribe of Kansas and Nebraska reservation after 1854; Iowa River and State of Iowa named after the people",
        label: "Iowa Tribe of Kansas and Nebraska, About Us (the Nation's own site)",
        url: "https://iowatribeofkansasandnebraska.com/about-us/",
      },
      {
        claim: "Lists nine Iowa treaties 1815-1861 including 1824, 1825, 1830, 1836, 1837, 1838",
        label: "Iowa Tribe of Kansas and Nebraska, Treaties (the Nation's own site; page lists treaties, PDFs not opened)",
        url: "https://iowatribeofkansasandnebraska.com/members/government/treaties/",
      },
      {
        claim: "Sac and Fox Nation of Missouri's own account: ancestors in Canada, Michigan, Wisconsin, Illinois, Iowa, Missouri, Kansas, Nebraska; the 1815 treaty removed them to northeast Missouri; 1837 removal to Great Nemaha, Kansas",
        label: "Sac and Fox Nation of Missouri in Kansas and Nebraska, Tribe History (the Nation's own site)",
        url: "https://sacandfoxks.com/history/tribe",
      },
      {
        claim: "Dancing Rabbit's acknowledgement: Osage, Otoe-Missouria, Illini and Ioway as original tribes and owners of northeast Missouri; Meskwaki and Sac and Fox among others whose land was taken; no federally recognized tribes in Missouri; donated to the American Indian College Fund; the name carries a history of broken treaty (Dancing Rabbit Creek) and is kept in order to educate",
        label: "Dancing Rabbit Ecovillage, Official Land Acknowledgement Statement (the community's own words)",
        url: "https://www.dancingrabbit.org/land-acknowledgement/",
      },
      {
        claim: "Missouri one percent aggregate foreign-ownership cap; Department of Agriculture review; history line ends A.L. 2015 S.B. 12",
        label: "RSMo 442.571 (Missouri Revisor)",
        url: "https://revisor.mo.gov/main/OneSection.aspx?section=442.571",
      },
      {
        claim: "Missouri corporate farming ban; exemption (7) for educational, religious or charitable not-for-profit corporations; effective 28 Aug 2012 on the page",
        label: "RSMo 350.015 (Missouri Revisor)",
        url: "https://revisor.mo.gov/main/OneSection.aspx?section=350.015",
      },
      {
        claim: "Iowa nonresident alien, foreign business and foreign government may not acquire agricultural land (9I.3), 'Iowa Code 2026' edition printed Dec 9 2025",
        label: "Iowa Code chapter 9I (Iowa Legislature PDF; text read by saving the PDF and extracting it)",
        url: "https://www.legis.iowa.gov/docs/code/9I.pdf",
      },
      {
        claim: "Iowa corporate, LLC and trust restrictions; 9H.4(1)(c) exception for nonprofit corporations",
        label: "Iowa Code chapter 9H (Iowa Legislature PDF; text read by extracting it)",
        url: "https://www.legis.iowa.gov/docs/code/9H.pdf",
      },
      {
        claim: "280 acres bought by the land trust on Oct 1 1997 for $190,000 'slightly above market rates at the time'; land search criteria (no zoning, no building codes, affordable land, near an existing community); settled near Sandhill",
        label: "Dancing Rabbit Ecovillage, History",
        url: "https://www.dancingrabbit.org/about-dancing-rabbit-ecovillage/history/",
      },
      {
        claim: "Members do not buy land, they lease a warren from the Dancing Rabbit Land Trust; membership after 6 months of residency",
        label: "Dancing Rabbit Ecovillage, FAQ",
        url: "https://www.dancingrabbit.org/faq/",
      },
      {
        claim: "Visit recommended at least a week; letter of intent to MARC; community survey; interview; residency agreement; six-month residency; membership agreement; residents cannot build or hold leases",
        label: "Dancing Rabbit Ecovillage, Residency and Membership",
        url: "https://www.dancingrabbit.org/ecovillage-life/residency-membership/",
      },
      {
        claim: "Surrounding area primarily agricultural, small farms with an aging populace, Mennonite neighbours since the mid-seventies; Scotland County about 5,000 people; Sandhill's public relations since 1974",
        label: "Dancing Rabbit Ecovillage, Our Land (the community's own description of its neighbourhood)",
        url: "https://www.dancingrabbit.org/ecovillage-life/our-land/",
      },
      {
        claim: "Sandhill: non-profit land project, 168 acres, 4 adults and 2 youth; restructured from income-sharing in 2019; seeking farmers",
        label: "Sandhill Farm, About",
        url: "https://sandhillfarm.org/about/",
      },
      {
        claim: "Sandhill: membership process 18-24 months; visitor form, interview, group consensus, 14 days on farm, 1 year residency (10 of 12 months), membership by consensus",
        label: "Sandhill Farm, Become a Member",
        url: "https://sandhillfarm.org/internships-visiting/",
      },
      {
        claim: "Meskwaki Nation's own history (Wayback copy of the Nation's page; the live site returns 403 to bots): the Sac & Fox Tribe of the Mississippi in Iowa, known as the Meskwaki Nation, only federally recognized tribe in Iowa, 1857 purchase",
        label: "Meskwaki Nation, History: cited through a Wayback copy of the Nation's own page because the live site was not reachable from the sandbox",
        url: "https://web.archive.org/web/2025/https://www.meskwaki.org/history/",
      },
      {
        claim: "Sac and Fox Nation (Oklahoma) exists as a tribal government (Wayback copy; the live site refused connections 2026-10-04)",
        label: "Sac and Fox Nation, home: cited through a Wayback copy of the Nation's own page because the live site was not reachable from the sandbox",
        url: "https://web.archive.org/web/2025/https://sacandfoxnation-nsn.gov/",
      },
      {
        claim: "Iowa Tribe of Oklahoma, Perkins OK, calls itself Baxoje; sovereign nation",
        label: "Iowa Tribe of Oklahoma, home (the Nation's own site)",
        url: "https://iowanation.org/",
      },
    ],
  },
  "virginia-piedmont": {
    territory: "Monacan homeland, with their Mannahoac allies on the Rappahannock side. Rassawek, the Monacan ancestral capital, lies at the James and Rivanna confluence in Fluvanna. The Nation, federally recognized in 2018 and seated at Bear Mountain in Amherst County, has under the 2018 Act no trust land or federal service area here. Whether these counties were ever ceded is not documented in the sources consulted, so neither ceded nor unceded is claimed",
    tenure: "Virginia fee simple, with use-value assessment where a county has adopted it (Code of Virginia 58.1-3230), conservation easements, and Green Springs, a Louisa landmark district where 1977 easements cover nearly half of its 14,004 acres. Acorn holds its land in common through one Virginia corporation. Heirs' property, jointly inherited family land, is estimated at over a third of Southern Black-owned land; any co-owner can compel partition, though Virginia's 2020 reform adds appraisal, a buy-out chance and open-market sale first",
    entry: "Visit and join what exists: Twin Oaks asks for a Letter of Introduction and a pre-arranged three-week visit, never a drop-in; Living Energy Farm runs monthly tours and two-week to three-month volunteering. Not there: arriving as a lone buyer of a rural parcel, bidding on heirs' property, or buying family land in Black and Freedmen-descended neighbourhoods",
    obligation: "Acknowledge Monacan and Mannahoac land as Twin Oaks does in its own words, build nothing at or beside Rassawek (the Nation spent four years defending it from a pump station), accept the income-sharing norms of any community you join, and live as a neighbour to the county rather than above it",
    source: "Monacan Indian Nation, Our History (the Nation's own account); Thomasina E. Jordan Indian Tribes of Virginia Federal Recognition Act, Public Law 115-121 (2018); Encyclopedia Virginia, Monacan Indian Nation; Code of Virginia 8.01-81, 8.01-81.1",
    sourceUrl: "https://www.monacannation.gov/our-history.html",
    territorySource: "Monacan Indian Nation, Our History (the Nation's own account)",
    territorySourceUrl: "https://www.monacannation.gov/our-history.html",
    sources: [
      {
        claim: "Monacan and Mannahoac territory between the Fall Line and the Blue Ridge; Bear Mountain home for more than 10,000 years; federally recognized",
        label: "Monacan Indian Nation, About Us and Our History",
        url: "https://www.monacannation.gov/about-us.html",
      },
      {
        claim: "Original territory 'almost all of the Piedmont region'; affiliated with the Mannahoac of the northern Piedmont; Rassaweck the principal Monacan town; state recognition 14 Feb 1989; federal recognition 29 Jan 2018",
        label: "Encyclopedia Virginia (Virginia Humanities), Monacan Indian Nation",
        url: "https://encyclopediavirginia.org/entries/monacan-indian-nation/",
      },
      {
        claim: "Monacan signed the 1677 Treaty of Middle Plantation (finding 501(1)) and Monacan tribes are named in the 1722 Treaty of Albany negotiations (501(2)); service area is land within 25 miles of the centre of Amherst (sec 503(b)(2)); trust land limited to Amherst County and two named Rockbridge parcels (sec 506); this footprint lies about 34 miles (Fluvanna) to 56 miles (Orange) from Amherst centre, computed from TIGER county geometry",
        label: "Public Law 115-121, Title V",
        url: "https://www.govinfo.gov/content/pkg/PLAW-115publ121/html/PLAW-115publ121.htm",
      },
      {
        claim: "Rassawek is the ancestral capital at the James and Rivanna confluence; 2018 to 2022 fight over a James River Water Authority pump station; March 2022 the Authority agreed to an alternate route",
        label: "Cultural Heritage Partners, Save Rassawek",
        url: "https://culturalheritagepartners.com/save-rassawek/",
      },
      {
        claim: "Rassawek is an archaeological site in Fluvanna County near Columbia (Point of Fork); also stated in Wikipedia, Fluvanna County. The Nation's own page confirms 'Rassawek has been saved!'",
        label: "Wikipedia, Rassawek (pointer only) (secondary source, read alone)",
        url: "https://en.wikipedia.org/wiki/Rassawek",
      },
      {
        claim: "Twin Oaks is on the traditional territory of the Monacan and Mannahoac peoples (now merged as the Monacan Indian Nation); acknowledges its position as settlers on stolen land; do not drop in; Letter of Introduction; three-week visit",
        label: "Twin Oaks Community homepage (opened 2026-10-04)",
        url: "https://www.twinoaks.org/",
      },
      {
        claim: "Visitor program, three-week visit before provisional membership",
        label: "Twin Oaks, Join Twin Oaks",
        url: "https://www.twinoaks.org/twinoaks-visits-60/join-twin-oaks",
      },
      {
        claim: "Monthly tours; residential volunteers 2 weeks to 3 months; seeking partners for cooperative housing; located in Louisa, Virginia",
        label: "Living Energy Farm: Tours, Living and working with us, Who we are",
        url: "https://livingenergyfarm.org/living-and-working-with-us-at-living-energy-farm/",
      },
      {
        claim: "Use-value assessment classifications; adoption is by local ordinance (Louisa and Fluvanna county pages confirm adoption, minimums 5 acres agricultural and 20 acres forest at Louisa; Orange adoption not confirmed here)",
        label: "Code of Virginia 58.1-3230 and 58.1-3233",
        url: "https://law.lis.virginia.gov/vacode/58.1-3230/",
      },
      {
        claim: "Conservation easement definition (10.1-1009); perpetual in duration unless the instrument says otherwise (10.1-1010)",
        label: "Virginia Conservation Easement Act, 10.1-1009 and 10.1-1010",
        url: "https://law.lis.virginia.gov/vacode/10.1-1009/",
      },
      {
        claim: "Any tenant in common may compel partition (8.01-81); 2020 partition reform: court-ordered appraisal, allotment to a willing co-owner at appraised value, open-market sale before sealed bids or auction, ancestral attachment as a factor",
        label: "Code of Virginia 8.01-81, 8.01-81.1, 8.01-83, 8.01-83.1 (Acts 2020 cc. 115, 193; 2023 c. 333)",
        url: "https://law.lis.virginia.gov/vacode/8.01-81.1/",
      },
      {
        claim: "Heirs' property definition; absence of clear title can 'force partition sales by third parties'",
        label: "USDA farmers.gov, Heirs' Property",
        url: "https://www.farmers.gov/working-with-us/heirs-property-eligibility",
      },
      {
        claim: "Heirs' property is estimated to make up more than a third of Southern Black-owned land (3.5 million acres); partition sales and Black land loss (regional, not specific to Virginia)",
        label: "ProPublica, Black land loss in the South",
        url: "https://features.propublica.org/black-land-loss/heirs-property-rights-why-black-families-lose-land-south/",
      },
      {
        claim: "Green Springs National Historic Landmark District, Louisa County; landmark 1974; on 12 Dec 1977 Interior accepted preservation easements for nearly half of the district's 14,004 acres (secondary source)",
        label: "Wikipedia, Green Springs Historic District (secondary source, read alone)",
        url: "https://en.wikipedia.org/wiki/Green_Springs_Historic_District",
      },
      {
        claim: "2011 Virginia earthquake (Mw 5.8, 23 Aug 2011) centred in Louisa County, five miles south-southwest of Mineral; Lake Anna and the North Anna nuclear station built by Virginia Power in the 1970s; Lake Anna lies in Louisa and Spotsylvania counties and partly in Orange",
        label: "Wikipedia, Louisa County and Lake Anna (secondary pointers) (secondary source, read alone)",
        url: "https://en.wikipedia.org/wiki/Lake_Anna",
      },
    ],
  },
};
