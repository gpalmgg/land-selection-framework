// Region depth content for the detail drawer.
//
// Shape per region id:
//   { caseStudy: '#anchor' }       -> drawer shows a deep-link to deeper.html#anchor
//   { asks, source, sourceUrl }    -> drawer shows the prose summary + source line
//   (absent)                       -> drawer shows values + per-cell sources, no "asks" section
//   caseLinks: [{ title, url, note }] (optional) -> public organisations and bodies named for this region; every URL was opened
//                                  and renders the page it describes. The ten regions added in 2026-10 carry them.
//
// The three case-study regions deep-link to their full write-ups in deeper.html.
// The other "what living here asks of you" summaries are synthesized from each
// region's research dossier (data/research-dossier/<id>/{legal,regen,climate,water,
// stability}.md, a private audit trail that is never served); statements the
// re-verification could not support were rewritten, removed or marked in the text.
// Provenance notes and the staging copy live in data/region-depth.staging.js (not deployed).

export const regionDepth = {
  // --- Case studies (full write-ups in deeper.html) ---
  // These three carry BOTH keys: the drawer prefers caseStudy (deep-link),
  // while the region card uses the first sentence of asks as its teaser.
  alentejo: {
    caseStudy: '#alentejo',
    asks: "Alentejo asks you to design from the rainwater equation backward: 500 to 650 mm a year, nearly all falling between October and April, means cisterns sized for six dry months and shade treated as infrastructure, not scenery. Rules under the Reserva Agrícola Nacional (Decreto-Lei 73/2009) let RAN-classified agricultural parcels change hands freely while often forbidding residential construction outright, so verify RAN and REN status and any water rights before buying, not after. The living context is the cork-oak montado with its shared water and fire discipline, thirty years of Tamera nearby, and sparse ageing villages where rooting in matters more than fencing off a herdade.",
    source: "Decreto-Lei 73/2009, Reserva Agrícola Nacional (RAN), arts. 21-22",
    sourceUrl: "https://diariodarepublica.pt/dr/detalhe/decreto-lei/73-2009-603209",
  },
  connemara: {
    caseStudy: '#connemara',
    asks: "Connemara asks you to treat blanket bog as a body of stored carbon rather than a foundation: buildings that float rather than press, drainage that works with the watershed, and designs that never open century-deep peat. Lawful residence is gated by restrictive one-off rural-housing planning, and in the Gaeltacht core the planning system adds Irish-language and community-commitment criteria, so the learning is done in Irish. Water is the opposite of scarce at 1,200 to 2,400 mm a year; the real design constraints are Atlantic storm exposure, wet winters, and an energy strategy that leans on coastal wind rather than solar.",
    source: "Galway County Development Plan 2022–2028 (rural housing and Gaeltacht policies)",
    sourceUrl: "https://consult.galway.ie/en/consultation/adopted-galway-county-development-plan-2022-2028",
  },
  transylvania: {
    caseStudy: '#transylvania',
    asks: "Transylvania asks for continuation rather than invention: the hay-meadow biodiversity holds because someone mows, and the project that thrives is one the village can recognise as adjacent to its own. EU citizens may own, but farmland outside built-up areas sells through Law 17/2014: a 45-working-day public notice in which relatives and co-owners, lessees, neighbours, young farmers and local residents hold first claim, then buyer tests of five years' residence, farming and tax registration (companies: five years of farming and 75% farm income). Citizens of other states can acquire farmland only under international treaties on a reciprocity basis, and a Romanian company faces the company tests above. Springs, wells and soils are generous by EU standards, though Aqueduct basin-level stress is medium-high to high across much of the plateau, so the physical work is continental: winters that bottom at minus 10 to minus 15 Celsius, firewood as the practical winter backbone, and the composesorat commons setting the relational terms of entry.",
    source: "Legea 17/2014 (sale of agricultural land outside city limits)",
    sourceUrl: "https://legislatie.just.ro/Public/DetaliiDocument/156290",
  },

  // --- Europe ---
  galicia: {
    asks: "Galicia asks you to untangle the minifundio. Headline prices are low, but assembling a viable holding can mean negotiating with many scattered co-owners of many small plots and waiting through a slow title process (not verified here). It rains 1,100 to 1,800 mm a year, almost all between October and April, so your water resilience hinges on storage that bridges a 3 to 4 month dry summer, not on scarcity. The living substrate is the montes vecinales commons and a Galego-speaking neorrural revival, where the most accessible route runs through partnering with an existing comunidade de montes rather than buying freehold.",
    source: "Lei 13/1989, de montes veciñais en man común (texto consolidado, BOE)",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOE-A-1990-3358",
  },
  pembrokeshire: {
    asks: "Pembrokeshire asks you to win planning, not just buy land. Living on agricultural land means clearing the One Planet Development route under TAN 6, with a detailed management plan, ecological footprint accounting, and a binding commitment to meet your household's minimum food and income needs from the land within 5 years, with at least 65 percent of food produced on site. Water is abundant to a fault, so the real constraints are surface flooding, intensifying rainfall, and septic performance on heavy clay-shale soils, with OPD guidance expecting most water needs to be met and all waste assimilated on site. The community you join is rural Pembrokeshire, Welsh-speaking in the north and the Preseli hills and largely English-speaking in the south, alongside a small, visible One Planet movement that reports against its own management plans, so goodwill toward Cymraeg and honest annual accounting are part of the deal. The National Park boundary tightens scrutiny, and practitioners often target parcels just outside it.",
    source: "Welsh Government, TAN 6 One Planet Development",
    sourceUrl: "https://www.gov.wales/planning-permission-one-planet-developments-open-countryside",
  },
  cevennes: {
    asks: "The Cevennes ask you to make peace with SAFER. SAFER holds pre-emption rights on nearly every agricultural sale and can step in as buyer to reassign land, so engaging the departemental office early with a credible installation project is the real work. Elevation governs everything: a parcel at 200 m and one at 1,000 m are two different climate regimes within 20 km, and the autumn cevenol storms can drop 300 to 600 mm in 24 hours, making flash-flood resilience and mid-slope placement a primary design constraint. The regen scene is deep and networked but somewhat tribal after 50 years of intentional-community life, and CAP access typically means incorporating a French association or GAEC and working in French.",
    source: "Groupe Safer, Le droit de préemption",
    sourceUrl: "https://www.safer.fr/les-safer/le-droit-de-preemption/",
  },
  "south-tirol": {
    asks: "South Tirol asks you to fit into an existing Hof rather than start your own. The Maso Chiuso closed-farm law keeps designated farms indivisible, and since 2025 a buyer of one must also win commission approval by showing farming training or practice, so small parcels rarely come to market and prices on what does transact are among Europe's highest. The pragmatic regen path is to tenant, partner, or convert within a long-established farm, since there is essentially no intentional-community scene and the generous funding stack rewards registered South Tirolean farmers, not newcomers. Water is abundant for now, but the centuries-old Waale gravity channels depend on shrinking glacier and meltwater baseflow, so verify the Wasserrechte attached to any parcel and weigh altitude honestly, since 1,000 m trades summer heat for a 4 to 5 month heating season and snow load.",
    source: "LP 17/2001, Legge provinciale sui masi chiusi / Höfegesetz",
    sourceUrl: "https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17/legge_provinciale_28_novembre_2001_n_17.aspx",
  },
  asturias: {
    asks: "Asturias asks you to be patient with paper before you are patient with land. The realistic prize here is a whole abandoned aldea, and many carry tangled title from descendants of pre-1970 emigrants to Buenos Aires, Mexico, or Cuba who still hold registered shares. The wet Atlantic climate is buffered and water-abundant, so your real design constraints are winter storms, isolation above 700 m, and due diligence on legacy mining contamination in the central valleys. You will also need to earn your place inside a strongly independent local culture and accept the planning friction of living among seven Biosphere Reserves.",
    source: "MAPA, Precios medios anuales de las tierras de uso agrario, resultados 2024",
    sourceUrl: "https://www.mapa.gob.es/dam/mapa/contenido/estadisticas/temas/estadisticas-agrarias/1.economicas/precios-medios-anuales-de-las-tierras-de-uso-agrario/precios-medios-anuales-definitivos-de-las-tierras-de-uso-agrario--resultados-2024.pdf",
  },
  "saxony-anhalt": {
    asks: "Saxony-Anhalt asks you to prove you intend to farm before it will sell you land. Germany sets no nationality bar, but the Grundstücksverkehrsgesetz lets the farmland authority refuse sales that would shut out a farmer who wants the land, and the Landgesellschaft holds a statutory pre-emption right on farmland of 2 ha and up, so community projects without an agricultural Nutzungskonzept routinely get blocked at the Landwirtschaftsbehörde, and the standard route is a German agricultural Genossenschaft or GmbH with a farmer-shareholder. Physically, this is one of Germany's driest regions, the Mitteldeutsches Trockengebiet, where you must design for long dry summers and real winter frost at once. The difficult part is social: rural Saxony-Anhalt has lost population continuously since 1990, and you will need German-language capacity and years of local-economic relationship-building before newcomers are trusted.",
    source: "Grundstücksverkehrsgesetz (GrdstVG)",
    sourceUrl: "https://www.gesetze-im-internet.de/grdstvg/",
  },
  "estonia-rural": {
    asks: "Estonia asks settlers not to mistake its digital welcome for the right to buy a farm. E-Residency lets you incorporate in days but grants no residency and no privilege to purchase agricultural or forest land. Citizens of EEA and OECD countries can buy in their own name; for citizens of other countries the land needs authorisation from the local council after six months' residence, so the usual route is an Estonian OU, which buys freely under 10 ha but needs a three-year farming or forestry record, or council authorisation, for more. In the Setomaa border parishes, people who are not EEA or UK citizens cannot buy real estate at all. Mainland southeast Estonia offers near-textbook freshwater resilience, but borehole quality on Saaremaa's limestone and coast may vary (not verified here), so test before you rely on it. The regen network is small enough to email directly, the organic-farming tradition is deep, but Estonian, and in Setomaa the Seto register, is essential for real integration.",
    source: "Restrictions on Acquisition of Immovables Act / KAOKS (consolidated)",
    sourceUrl: "https://www.riigiteataja.ee/en/akt/527122023007",
  },

  "scottish-highlands": {
    asks: "The Highlands ask you to arrive as a resident, not a buyer. Around 563,000 acres of Scotland is community-owned, mostly bought by negotiation, so the way in runs through the housing community bodies offer: rented homes and a rural housing burden scheme on Knoydart (65 residents grew to 145), ten rentals on Eigg, ten planned homes at Lochinver. Housing is the binding constraint: Assynt's 2019 survey, citing the 2011 Census, found 27 percent of the parish's homes were second or holiday homes, and 38 respondents knew of kin or friends who left for want of a home. A croft is no shortcut: its crofter must live on or within 32 km of it and use it, and a tenancy cannot be assigned without the Crofting Commission's consent. Clearances emptied glens here in the nineteenth century, as at Strathnaver, and 408 landowners still hold half of Scotland's privately owned rural land; the community estates answer that, and a second wave of owners is not a way to join them.",
    source: "Community Land Scotland, Community land ownership FAQs",
    sourceUrl: "https://www.communitylandscotland.org.uk/our-work/faqs/",
    caseLinks: [
      { title: "Community Land Scotland", url: "https://www.communitylandscotland.org.uk/", note: "Member body of Scotland's community landowners; its member pages describe each community estate's own housing and membership routes." },
      { title: "Knoydart Foundation", url: "https://knoydart.org/about-us/", note: "Community estate bought in 1999 (about 7,000 ha), a partnership of local residents, Highland Council and the John Muir Trust." },
      { title: "Isle of Eigg Heritage Trust", url: "https://isleofeigg.org/ieht/", note: "Community ownership of Eigg since 1997: a partnership of the residents' association, Highland Council and Scottish Wildlife Trust. Eigg is in the Small Isles, masked from the map's raster statistics." },
      { title: "Assynt Foundation", url: "https://www.assyntfoundation.scot/", note: "Community estate of Glencanisp and Drumrunie (44,400 acres), bought in 2005." },
      { title: "Assynt Development Trust, Glebe Development", url: "https://assyntdevelopmenttrust.org/glebe-development/", note: "Community housing at Lochinver, first phase of ten homes." },
      { title: "Coigach Community Development Company, housing", url: "https://coigachcommunity.com/coigach-community-projects/coigach-community-housing/", note: "Community-led affordable housing: schoolhouse flats and the Achagarry site." },
      { title: "Applecross Community Company (Community Land Scotland member page)", url: "https://www.communitylandscotland.org.uk/members/applecross-community-company/", note: "A community company running a filling station, broadband, three affordable houses and a community woodland. Its own site was unavailable to scripted checks, so the member page is linked." },
      { title: "Coigach and Assynt Living Landscape", url: "https://scottishwildlifetrust.org.uk/our-work/our-projects/living-landscapes/coigach-assynt-living-landscape/", note: "Scottish Wildlife Trust partnership of community, charitable and private landowners for landscape-scale restoration (Lottery-funded scheme, 2016 to 2021)." },
      { title: "Crofting Commission", url: "https://www.crofting.scotland.gov.uk/", note: "The public regulator of crofting, whose consent a tenancy assignation needs." },
      { title: "Findhorn Foundation and Ecovillage", url: "https://www.findhorn.org/", note: "Ecovillage at Forres in Moray: outside the footprint, inside the 100 km radius used for the regen-network count." },
      { title: "Trees for Life", url: "https://treesforlife.org.uk/", note: "Caledonian forest restoration charity; its Dundreggan estate is in Glenmoriston, outside the footprint." },
    ],
  },
  "north-karelia-kainuu": {
    asks: "North Karelia and Kainuu ask you to arrive as a neighbour in a place that is emptying, not as its rescuer. The footprint holds about 219,000 people on 29,800 square kilometres, 7.4 per square kilometre and 4.1 outside Joensuu and Kajaani, after losing 13 percent of its people since 1990, and 38 percent leaving out Joensuu, Kajaani, Kontiolahti and Liperi. The ground is forest, lake and bog, with peatland on 32 percent of North Karelia's forestry land and 45 percent of Kainuu's (county-wide figures), so build light and read municipal plans first: Ilomantsi is preparing a partial master plan to enable gold mining along its gold-bearing belt. Snow lies deepest in mid-March, usually 50 to 70 centimetres in North Karelia and more on the uplands. No national arrival programme was found; the doors are village associations, Leader groups and municipal moving services, and Finnish is what opens them. For the Sámi homeland and the reindeer herding municipalities of northern Kainuu, the answer is not there.",
    source: "Statistics Finland, Key figures on population by region (table 11ra, 1990-2025); Luke, forestry land by principal site class (NFI 13/14, 2020-2024)",
    sourceUrl: "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/vaerak/11ra.px",
    caseLinks: [
      { title: "Snowchange Cooperative (Selkie, Kontiolahti)", url: "https://www.snowchange.org/re-wilding-actions-in-finland-snowchange-hq-in-selkie/", note: "Village-rooted rewilding and traditional-knowledge cooperative; restored the 110-hectare Linnunsuo wetland with Selkie hunters. A body to learn from, not an arrival programme." },
      { title: "Kainuun kylät ry", url: "https://www.kainuunkylat.fi/", note: "Network of village associations in Kajaani, Kuhmo, Paltamo, Sotkamo and Ristijärvi; it also covers northern Kainuu outside this region." },
      { title: "Vaara-Karjalan Leader", url: "https://vaarakarjalanleader.fi/", note: "Local action group financing community, village and enterprise projects in Ilomantsi, Juuka, Lieksa and Nurmes, 2023 to 2027." },
      { title: "Joensuun Seudun Leader", url: "https://www.joensuunseudunleader.fi", note: "Leader group for Heinävesi, rural Joensuu, Kontiolahti, Liperi, Outokumpu and Polvijärvi." },
      { title: "Elävä Kainuu Leader", url: "https://www.kainuuleader.fi", note: "Leader group for Kuhmo, Sotkamo, Ristijärvi and others; runs a Kainuu village action line." },
      { title: "Oulujärvi Leader", url: "https://www.oulujarvileader.fi", note: "Leader group for Kajaani and Paltamo." },
      { title: "New Valamo Monastery, Heinävesi", url: "https://valamo.fi/en", note: "Orthodox monastery moved from Valaam in 1940: a living centre with a folk high school, guest accommodation and Karelian evacuee heritage." },
      { title: "Kuhmo village associations", url: "https://www.kuhmo.fi/en/housing-and-environment/our-living-environment/villages/", note: "The municipality's page on 25 village associations and village-owned former schools used as community centres." },
      { title: "Move to Joensuu", url: "https://www.joensuu.fi/en/city-and-development/our-joensuu/move-to-joensuu/", note: "The one municipal moving service found with an ongoing role for newcomers; Joensuu is the growth centre, not a village." },
    ],
  },
  millevaches: {
    asks: "Millevaches asks you to arrive through a structure, not a parcel. The plateau is thinly peopled, about 12 inhabitants per km2 across the Parc, and was held together from the 1970s by village associations and mayors who made newcomers welcome; in the Parc's own count, migration only just offsets natural decline. Land here is not simply an open market: the Safer can pre-empt rural sales, communes and neighbours hold first refusal on small woods, and farmland in hamlet commons goes first to farmers who already live and work there. The ground is wet moorland, peat and forest between 300 and 1,000 m with hard winters, roughly half the Parc wooded, much of it twentieth-century conifer planting that people have protested for over forty years. Researchers have named the arrival of better-resourced, environment-seeking newcomers rural gentrification and recorded sharp newcomer-versus-native polarisation in the 2014 municipal elections. French, and a seat in municipal or associative life, are the price of standing.",
    source: "Parc naturel régional de Millevaches en Limousin, Le projet forestier (Charte forestière de territoire)",
    sourceUrl: "https://www.pnr-millevaches.fr/actions-du-parc/charteforestieredeterritoire/",
    caseLinks: [
      { title: "Terre de Liens Limousin: Le Masmoutard farm", url: "https://fermes.terredeliens.org/limousin/fermes-de-la-r%C3%A9gion-limousin/le-masmoutard/", note: "Farm at Soubrebost, Creuse, inside the Parc: land bought by the Foncière Terre de Liens in 2011 after local mobilisation and leased to a farming GAEC; the page is frank about precarious rented land." },
      { title: "L'Arban, cooperative for building and planning differently", url: "https://arban.fr/qui-sommes-nous/", note: "Cooperative (SCIC) founded in 2010 by residents and elected officials of the plateau to answer the shortage of decent housing; 193 members at the end of 2022, per its own page." },
      { title: "Faux-la-Montagne: welcome page for newcomers", url: "https://fauxlamontagne.fr/nouveaux-arrivants/", note: "A commune's own public statement of how newcomers are received and connected to associations." },
      { title: "Télé Millevaches", url: "https://telemillevaches.net/", note: "Association-run rural media started in 1986 by residents of Faux-la-Montagne, Peyrelevade and Gentioux." },
      { title: "IPNS, journal of the Millevaches plateau", url: "https://www.journal-ipns.org/", note: "Quarterly published by an association, where newcomer, forestry and land debates of the plateau are argued in public." },
      { title: "Objectif Terres (Terre de Liens)", url: "https://www.objectif-terres.org/", note: "Farm listings and support for people looking for land to farm; Terre de Liens Limousin holds 8 farms region-wide, only one verified inside the Parc." },
    ],
  },
  "teruel-uplands": {
    asks: "The Teruel uplands ask you to arrive by invitation, not by purchase. On non-urban land one house needs a parcel of at least 10,000 square metres in a place where no cluster of homes forms, so the way in is a municipality's own housing or work offer, rent first, or the rehabilitation of an old village house or deserted aldea, which the law lets you divide if its traditional shape is kept. Pueblos Vivos Aragón helps, but serves only EU nationals and people already holding Spanish work and residence permits, and gives no money. Rural housing is scarce enough, a network workshop says, to hold back local young people too. These are headwaters: the Tagus rises near Frías de Albarracín, and a Cuencas Mineras mayor wrote in September 2026 of a summer of fire and violent storm. Wind and solar projects are contested. Some forest montes of the Sierra de Albarracín belong to the Comunidad de Albarracín, a neighbour with its own rules.",
    source: "Decreto Legislativo 1/2014, Ley de Urbanismo de Aragón, arts. 34-35 (texto refundido, BOE consolidated)",
    sourceUrl: "https://www.boe.es/buscar/act.php?id=BOA-d-2014-90410",
    caseLinks: [
      { title: "ASIADER, Sierra de Albarracín", url: "https://www.asiader.org/", note: "The LEADER rural-development association of the Sierra de Albarracín, based in Tramacastilla." },
      { title: "Pueblos Vivos Aragón", url: "https://pueblosvivosaragon.com/", note: "LEADER-funded orientation for people moving to a village in Jiloca, Gúdar-Javalambre and the Sierra de Albarracín; EU nationals and permit holders only, no financial aid." },
      { title: "Despedir, llegar, acoger", url: "https://pueblosvivosaragon.com/pistas-para-una-buena-integracion/", note: "A guide to how newcomers and villagers can meet each other, built from 17 workshops with 309 people in Aragón, with the help of Fundación Entretantos." },
      { title: "Bolsa de Repoblación, A.D. Serranía Celtibérica", url: "https://www.celtiberica.es/bolsaderepoblacion/index.html", note: "A dated board of municipal offers and individual requests across the Serranía Celtibérica; most entries sit outside Teruel and each offer carries its own conditions." },
      { title: "Ayuntamiento de Griegos", url: "https://www.griegos.es/", note: "The town hall of a village at 1,604 metres in the Montes Universales, with a rural school of six pupils and one teacher." },
    ],
  },
  "valle-maira": {
    asks: "Valle Maira asks you to arrive as a year-round neighbour, not a visitor with a key. The high communes are small: Macra fell from 861 residents in 1931 to 52 in 2011 and Canosio from 399 to 82, while Dronero at the valley mouth holds 7,205, so what a hamlet can still do rests on a school, a shop and an internet line within reach, the minimum the newcomers interviewed by Pettenati named. They settled sunny-slope borgate away from the main road and built organic and multifunctional farming, hospitality and a little telework, inside communes that chose to be recognised as Occitan under Law 482/1999. The valley's inner-areas strategy funds services and borgata community spaces and names the aim of attracting new firms and workers, but it is a rural-development programme, not an invitation to any borgata, so the work is relationship first. A second home, or a borgata whose heirs and comune have not asked anyone to reuse it, is a place not to go.",
    source: "Pettenati, G. (2013), La Val Maira (Piemonte): laboratorio territoriale di un nuovo popolamento montano, Revue de géographie alpine",
    sourceUrl: "https://journals.openedition.org/rga/2201",
    caseLinks: [
      { title: "Espaci Occitan, Dronero", url: "https://www.espaci-occitan.org/", note: "The Occitan cultural association at the valley mouth: Occitan museum, library and the Grande Dizionario della Lingua d'Oc Alpina." },
      { title: "Consorzio Turistico Valle Maira", url: "https://www.vallemaira.org/il-consorzio/", note: "Non-profit consortium founded in 2013 by valley entrepreneurs, 120-plus members, a slow-tourism model with no ski lifts." },
      { title: "Unione Montana Valle Maira, Strategia Nazionale Aree Interne", url: "https://www.unionemontanavallemaira.it/Menu?IDVoceMenu=332295", note: "The thirteen comuni's own page on the Valli Maira e Grana inner-areas strategy: services, local production and borgata community spaces." },
      { title: "Associazione Dislivelli", url: "https://www.dislivelli.eu/chi-siamo/", note: "Turin research and communication association on the Alps and their old and new montanari; the author of the Valle Maira newcomer study sits on its board." },
      { title: "Borgata Paraloup, Rittana (neighbouring Valle Stura, not Valle Maira)", url: "https://paraloup.it/", note: "A borgata owned by the Fondazione Nuto Revelli and run by a community agricultural cooperative as a cultural, social and tourist centre; context from the next valley." },
    ],
  },

  // --- North America ---
  cascadia: {
    asks: "Cascadia asks you to accept that the hard part is not buying land but being allowed to use it. Oregon's statewide Senate Bill 100 planning zones most rural parcels as Exclusive Farm Use, so a multi-household community will likely need a Conditional Use Permit and multi-year county planning engagement, and you should hire an ORS 215 land-use attorney before purchasing, not after. Land is costly here, which is why most new projects depend on a community land trust rather than outright purchase. In return you join a long-established, institutionally mature regen network, in a climate of mild wet winters and abundant water whose one worsening liability is the late-summer wildfire-smoke season.",
    source: "USDA NASS, Land Values 2024 Summary",
    sourceUrl: "https://www.nass.usda.gov/Publications/Todays_Reports/reports/land0824.pdf",
  },
  vermont: {
    asks: "Vermont asks you to commit the land to productive use and lock it in. Enrolling in the Current Use program on purchase cuts property tax by 80 to 90 percent, but the Land Use Change Tax (10 percent of full fair market value on development or withdrawal) is a deliberate commitment device, and any multi-household community may trigger an Act 250 permit, depending on unit count, subdivision and the town's bylaws (the threshold is 1 acre or 10 acres), costing real time and money. Water is genuinely abundant, so the discipline is the reverse of scarcity: keep dwellings to ridges and well-drained margins away from flood-prone bottomland, and build for cold snowy winters with passive solar, super-insulation, and wood-heat backup as non-optional. The 50-year-deep regen network is a resource and an accountability: doing it right here carries social expectation, and steady engagement counts for more than arriving with a finished outside vision.",
    source: "Vermont Department of Taxes, Current Use Program",
    sourceUrl: "https://tax.vermont.gov/property/current-use",
  },
  "southern-appalachians": {
    asks: "The Southern Appalachians ask you to use the tax and easement tools well and to read the land's drainage honestly. The Present-Use Value deferral can cut property tax up to 90 percent for qualifying forestry or agriculture (10 acres of farm production, or 20 of managed forest), but individual buyers of land that is not already enrolled must live on it or own it four years first, and if you buy enrolled land you must apply within 60 days of transfer or face three years of deferred taxes plus interest. Water is structurally abundant in the French Broad basin, so the real risk is where you build: Tropical Storm Helene in 2024 showed these highland watersheds can flash-flood catastrophically, making below-ridge placement and drainage analysis non-negotiable, alongside roughly 45 extreme-heat days a year projected by 2050. You arrive into a long-established regen network anchored by Earthaven and Celo, but that same demand is capitalised into land prices, so expect to pay a premium over comparable rural land elsewhere.",
    source: "NC General Statutes §§105-277.2–105-277.7, Present-Use Value Programme",
    sourceUrl: "https://www.ncleg.gov/EnactedLegislation/Statutes/PDF/ByChapter/Chapter_105.pdf",
  },
  driftless: {
    asks: "The Driftless asks you to farm the land actively and to treat every land-use choice as a water-quality choice. Use-value assessment values actively farmed land at roughly 100 to 400 dollars an acre (Wisconsin DOR 2024, Vernon County) instead of the thousands it would fetch at market value, which cuts property tax on that land to a small fraction, and a cooperative or community land trust is one way to hold land together. Water is abundant, but the fractured karst geology means nitrate from manure, fertilizer, or septic reaches private wells directly, with 15 to 20 percent of wells in some counties already over the EPA limit, so multi-season well testing before purchase is non-negotiable. You land in an exceptionally mature organic and CSA network anchored by Organic Valley and Marbleseed, though that reputation has pushed up prices in the Viroqua-La Farge-Cashton triangle, and cold winters remain a genuine design constraint.",
    source: "Wisconsin Statute §70.32(2), Use-Value Agricultural Assessment",
    sourceUrl: "https://www.revenue.wi.gov/Pages/FAQS/slf-useassmt.aspx",
  },
  ozarks: {
    asks: "The Ozarks ask you to be a pioneer rather than a joiner. Land comes cheap and lightly governed here, and reports describe Sharp, Izard and Fulton counties as requiring no building permit for small structures on agricultural land (confirm with the county), while off-grid solar and rainwater harvesting are lightly regulated and composting toilets need Arkansas Department of Health approval, but the freedom is permissive by omission, not supportive by design, so commission a full title search for mineral-rights complications and confirm road-access easements before buying. Water is abundant from the karst aquifer, yet that same porous limestone lets upstream farming or CAFO contamination reach a spring within years, so you must map the spring's contributing watershed, not just your property line. The formal regen layer is thin, with only a handful of established communities nearby, meaning you build relationships from scratch through homestead networks and Permies.com rather than tapping an existing support scene.",
    source: "USDA NASS, Land Values 2024 Summary",
    sourceUrl: "https://www.nass.usda.gov/Publications/Todays_Reports/reports/land0824.pdf",
  },
  "northern-new-mexico": {
    asks: "Northern New Mexico asks you to join a commons before you own a thing. Acequia-served land comes with a governance obligation, not just a water allocation: you attend ditch meetings, contribute labor (or pay the assessed substitute) to the annual ditch limpia, and vote in ditch elections and on contracts, with the mayordomo allocating water under the commissioners, including in drought years when water is scarce and tensions run high. Water is the single most load-bearing constraint here, the Upper Rio Grande is fully appropriated and in structural deficit, so off-acequia sites need permitted wells or aggressive rainwater harvesting and closed-loop reuse. You inherit one of the fastest-warming states in the continental US and a real wildfire threat in the montane belt, set against a deep, generations-old earthship and intentional-community network that already holds the desert-appropriate knowledge.",
    source: "New Mexico Statutes §73-2-21 (2025), Commissioners' powers and duties; mayordomo's duties",
    sourceUrl: "https://law.justia.com/codes/new-mexico/chapter-73/article-2/section-73-2-21/",
  },
  "nova-scotia": {
    asks: "Nova Scotia asks for patience with an immigration pathway more than with the land itself. Rural and Cape Breton parcels sit outside the federal foreign-buyer ban, but the 10% non-resident deed transfer tax applies to residential property of up to three dwelling units, vacant land intended for housing included, on the non-resident share of ownership; it is avoided if each non-resident buyer becomes a Nova Scotia resident within six months, or if the land is genuinely non-residential. The 2025 federal cut of roughly 50% to the provincial nominee quota means international co-founders realistically settle one or two members first on work permits, then buy together. Water is generally plentiful (rainfall and well figures not verified here), so the real design questions are wastewater on thin fractured-bedrock soils and episodic late-summer drought. The regen scene is thin but real, with a few cohousing and permaculture projects and an active organic-farming network, so a new project here is more likely to be a defining node than a follower.",
    source: "Farm Credit Canada, 2024 FCC Farmland Values Report (published March 2025)",
    sourceUrl: "https://www.fcc-fac.ca/en/reports/2024-farmland-values-report",
  },
  kootenays: {
    asks: "The Kootenays ask you to work with the Agricultural Land Reserve and the water-licence system rather than around them. ALR land is affordable but, as of right, allows one principal residence (up to 500 m2), one secondary suite and one small additional residence (90 m2 on parcels of 40 ha or less), so a multi-household community of more than two or three dwellings must either prove farm-worker housing need, pursue an Agricultural Land Commission application, or pay materially more for non-ALR land. Water is a placement and timing problem, not scarcity today: prior-appropriation licences mean late-priority holders get shut off in drought, glacial baseflow is already past peak, and summer storage matters by mid-century. Most of the region is unceded Sinixt, Ktunaxa, and Syilx territory with a Crown duty to consult, and you arrive into a long intentional-community legacy, neighbours who are knowledgeable, skeptical, and expect engagement rather than a ready-made model.",
    source: "ALR Use Regulation, BC Reg 30/2019",
    sourceUrl: "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/30_2019",
  },
  "quebec-eastern-townships": {
    asks: "Québec's Eastern Townships ask you to lead with a real agricultural mission and to do it in French. The CPTAQ Green Zone protects farmland from speculation but constrains buyers: non-residents already need CPTAQ authorization above 4 ha, and Bill 86 (2025) adds it for investment funds, large cumulative holdings, and buyers who will not register a farm operation on land near an urban perimeter in designated regions; a declaration that the land will be a MAPAQ-registered farm operation within a year is the clear path, so lead with an agricultural plan, not a lifestyle or retreat framing; CPTAQ applications are public and slow. The land regime runs on civil law with mandatory notarial deeds, and French is the sole official language for permits, CPTAQ filings, and the francophone-dominant regen network, a genuine integration burden for anglophone founders. Water is abundant year-round, so the constraints are qualitative: agricultural-runoff lake quality, spring flood and freeze-thaw loads, and building for -25°C winters.",
    source: "Publications du Québec, SQ 2025, c 5 (Bill 86, assented March 25, 2025)",
    sourceUrl: "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF",
  },
  oaxaca: {
    asks: "Oaxaca asks you to make the legal dimension and the relational dimension the same dimension. About 81% of the state is held as ejido or comunidad agraria, collectively governed land, and 418 of 570 municipalities run on usos y costumbres customary law with the legal right to admit or exclude newcomers, so entry must be negotiated with an assembly, not just a seller, and competent Mexican agrarian counsel is non-negotiable, never a prestanombre front-owner. It is not a zero-violence region: ACLED (2018-2024) records violence targeting political figures here at a level among the highest of any Mexican state, mostly tied to land, infrastructure and electoral disputes and concentrated in the Isthmus and the Costa, with ACLED counting 20 such events in 2018, 15 in 2021 and 5 in January-April 2024. Highland water is a question to ask each community (which spring, who holds the rights, how it is stored through the dry season), and the deepest regenerative knowledge here is indigenous Zapotec, Mixtec, and Chatino, so the relational work with neighbours is not optional.",
    source: "Ley Agraria (1992, reformed), Artículos 76-82 and 98-107",
    sourceUrl: "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf",
  },
  "finger-lakes": {
    asks: "The Finger Lakes ask you to learn whose land this is before you ask what it costs. It is Cayuga homeland: the Cayuga Nation Council's website says illegal sales left the Nation landless for over 200 years and lists about 1,500 acres bought back at market prices since 2003, and in 2005 the Second Circuit barred the 64,015-acre claim by laches. Tompkins County's median residential sale was $370,000 in 2025, and New York farm real estate averages $4,500 an acre. The doors that exist are narrow and consent-based. EcoVillage at Ithaca, about 100 homes, admits renters and buyers only after a membership process; Groundswell's incubator farm gives quarter-acre plots on EcoVillage land and prioritises farmers facing barriers, so a settler group should not ask for a seat. Towns decide the rest: the community-financed Black Oak Wind Farm was cancelled in 2017, its backers blaming Enfield's moratorium. The lakes need care: toxic algae blooms have struck all eleven.",
    source: "Cayuga Nation Council website, History & Culture (its own account of the land and repurchases); Cayuga Indian Nation v. Pataki, 413 F.3d 266 (2d Cir. 2005); NYS Department of Taxation and Finance, residential median sale prices (April 2026); USDA NASS Land Values 2026 Summary",
    sourceUrl: "https://cayuganation-nsn.gov/history-culture/",
    caseLinks: [
      { title: "EcoVillage at Ithaca", url: "https://ecovillageithaca.org/", note: "Cohousing ecovillage in three neighbourhoods (1997, 2006, 2013-15), about 100 homes; 50 of its 170 acres are under a conservation easement held by the Finger Lakes Land Trust." },
      { title: "EcoVillage at Ithaca, becoming a resident", url: "https://ecovillageithaca.org/about/living-here/", note: "The published way in: a membership process, a 3 to 5 day visit and an official tour." },
      { title: "Thrive EcoVillage Education Center", url: "https://www.thriveithaca.org/", note: "The education arm of EcoVillage: tours, workshops and programmes." },
      { title: "Groundswell Center, Incubator Farm", url: "https://groundswellcenter.org/the-incubator-farm/", note: "Beginning-farmer incubator on land leased from EcoVillage; admission prioritises people facing barriers to land." },
      { title: "Finger Lakes Land Trust", url: "https://www.fllt.org/", note: "Land trust founded in 1989; over 35,000 acres conserved and over 45 public preserves across the Finger Lakes region." },
      { title: "Cayuga Lake Watershed Network", url: "https://www.cayugalake.org/", note: "Membership nonprofit protecting the Cayuga Lake watershed; runs the Lake Friendly Living programme." },
      { title: "Cornell Cooperative Extension of Tompkins County, Find Farmland", url: "https://ccetompkins.org/agriculture/find-farmland", note: "Regional navigator for Farmland for a New Generation New York, aimed at farmers and landowners keeping land in farming, not a listing for arriving communities." },
    ],
  },
  "virginia-piedmont": {
    asks: "The Virginia Piedmont asks you to arrive as a visitor and a neighbour before you arrive as anything else. This is Monacan homeland, with the Mannahoac on the Rappahannock side, and the Monacan Nation spent four years defending its ancestral capital Rassawek, at the James and Rivanna confluence in Fluvanna, from a water-withdrawal pump station. The way in is through what already exists: Twin Oaks, Acorn and Living Energy Farm are all in Louisa County, Twin Oaks asks for a Letter of Introduction and a three-week visit with no drop-ins, and Living Energy Farm hosts tours and seeks partners for cooperative housing, so a lone parcel purchase is the wrong door. Heirs' property, family land held jointly without clear title, is estimated at over a third of Southern Black-owned land and a documented route to forced sale, so buying rural parcels here can be extractive. The ground carries risks too: a magnitude 5.8 earthquake centred near Mineral in 2011, and the North Anna nuclear station on Lake Anna.",
    source: "Monacan Indian Nation, Our History (the Nation's own account of its homeland); Twin Oaks Community, Join Twin Oaks (three-week visit before membership)",
    sourceUrl: "https://www.monacannation.gov/our-history.html",
    caseLinks: [
      { title: "Monacan Ancestral Museum, Monacan Indian Nation", url: "https://www.monacannation.gov/plan-your-visit.html", note: "The Nation's own museum at Bear Mountain, Amherst: how to visit and learn the history from the people it belongs to." },
      { title: "Twin Oaks Community", url: "https://www.twinoaks.org/", note: "Income-sharing community in Louisa, founded 1967; a structured three-week visit comes before membership." },
      { title: "Acorn Community Farm (directory entry)", url: "https://www.ic.org/directory/community/acorn-community-farm/", note: "Egalitarian, income-sharing community in Louisa County, founded 1993, listed by the Foundation for Intentional Community; visitors send a questionnaire first. Its own site is not served over https." },
      { title: "Living Energy Farm", url: "https://livingenergyfarm.org/", note: "Off-grid farm and appropriate-technology centre in Louisa with monthly tours and residential volunteers; seeking partners for cooperative housing." },
      { title: "Southern Exposure Seed Exchange", url: "https://www.southernexposure.com/", note: "Cooperatively owned heirloom seed company at Mineral, a business of Acorn Community Farm." },
      { title: "Virginia Outdoors Foundation", url: "https://www.vof.org/", note: "State land-conservation foundation holding perpetual conservation easements on farm and forest." },
      { title: "Piedmont Environmental Council", url: "https://www.pecva.org/", note: "Land and water conservation organisation across the Virginia Piedmont; covers conservation easements, data centres and transmission growth." },
    ],
  },
  "bas-saint-laurent": {
    asks: "Bas-Saint-Laurent asks you to arrive in French, through a farm or a village that is already here. The free welcome teams in all eight MRCs are the first door; Place aux jeunes serves ages 18 to 35, so a family or a group should ask first. Land is the slow door: no current regional price could be verified (Québec farmland values rose 4.8 percent in 2025), and financing a transfer was named a persistent difficulty when ARTERRE launched. A non-resident who means to settle can be authorised to buy 4 ha or more of farmland on condition of living in Québec 1,095 days within four years and being a citizen or permanent resident by the end of it. Under it all is ground that three nations still hold open, the Wolastoqiyik Wahsipekuk, the Mi'gmaq of Gespe'gewa'gi and the Huron-Wendat, and a forest under spruce budworm pressure: the affected area grew from 844,004 to 1,065,561 ha in 2025, though defoliation is not the same as tree death.",
    source: "Collectif régional de développement du Bas-Saint-Laurent, Accueil et intégration; Loi sur l'acquisition de terres agricoles par des non-résidents (RLRQ c. A-4.1), arts. 2 and 15.2",
    sourceUrl: "https://www.bas-saint-laurent.org/fr/setablir/accueil-integration.html",
    caseLinks: [
      { title: "Place aux jeunes en région", url: "https://placeauxjeunes.qc.ca/", note: "Provincial network for ages 18 to 35 with an agent in each MRC; a youth programme, not a family route." },
      { title: "L'ARTERRE, Bas-Saint-Laurent", url: "https://www.arterre.ca/RegionsParticipantes/01", note: "Farm-transfer matching of aspiring farmers and owners across the eight MRCs." },
      { title: "Le Germoir, farm incubator", url: "https://tcbbsl.org/le-germoir-parcours-dincubation/", note: "A 2.5-year accompaniment for people who have just started a farm business, run by the regional agri-food table." },
      { title: "Co-éco, Collectivités écologiques Bas-Saint-Laurent", url: "https://co-eco.org/", note: "Regional ecological-communities organisation: ecocentres, brown-bin composting and sustainable-development advice." },
      { title: "Pôle d'économie sociale du Bas-Saint-Laurent", url: "https://economiesocialebsl.com/", note: "Collective-enterprise network with a directory by MRC." },
      { title: "Agriclimat, Bas-Saint-Laurent", url: "https://agriclimat.ca/regions/bas-saint-laurent", note: "Regional climate-adaptation fact sheets for farms and forests." },
      { title: "Première Nation Wolastoqiyik Wahsipekuk", url: "https://wolastoqiyikwahsipekuk.ca/fr/territoire", note: "The nation whose ancestral territory, Wolastokuk, covers the west of the region; its own site, in French." },
      { title: "Mi'gmawei Mawiomi Secretariat", url: "https://www.migmawei.ca/", note: "Tribal council of Gesgapegiag, Gespeg and Listuguj for Gespe'gewa'gi; the three communities sit in Gaspésie, outside the region." },
    ],
  },
  "ne-missouri-se-iowa": {
    asks: "Northeast Missouri and Southeast Iowa ask you to learn the removal history before you look at any listing. The Sauk, Meskwaki and Ioway quit-claimed the Missouri side in 1824, lost the Iowa land within about 50 miles of the Mississippi in 1832 and every remaining Iowa claim in 1842. Dancing Rabbit's own history says its founders searched for land with no zoning, no building codes and a low price, and its land acknowledgement now names that legacy; for a lone buyer arriving on price, the honest answer here is not there. The doors that exist are slow: Sandhill's process runs 18 to 24 months, Dancing Rabbit asks for a visit, then six months of residency, and members lease from a land trust rather than buy. Two states mean two foreign-ownership regimes: Iowa bars nonresident aliens from buying agricultural land, and Missouri caps foreign ownership of agricultural land at one percent of the state's total, with review by its department of agriculture.",
    source: "Dancing Rabbit Ecovillage, History (the community's own account of how it chose this land); Iowa Code §9I.3; Revised Statutes of Missouri §442.571",
    sourceUrl: "https://www.dancingrabbit.org/about-dancing-rabbit-ecovillage/history/",
    caseLinks: [
      { title: "Dancing Rabbit Ecovillage", url: "https://www.dancingrabbit.org/", note: "Ecovillage founded in 1997 near Rutledge, Scotland County; the land is held by a nonprofit land trust and members lease it." },
      { title: "Dancing Rabbit, residency and membership", url: "https://www.dancingrabbit.org/ecovillage-life/residency-membership/", note: "The published way in: a visit, letter of intent, survey, interview, residency, then membership." },
      { title: "Dancing Rabbit, land acknowledgement", url: "https://www.dancingrabbit.org/land-acknowledgement/", note: "The community's own statement of the removal it sits within, and its pledge." },
      { title: "Sandhill Farm, become a member", url: "https://sandhillfarm.org/internships-visiting/", note: "Non-profit land project founded in 1974; its membership process is intentionally slow, 18 to 24 months." },
      { title: "Red Earth Farms (directory entry)", url: "https://www.ic.org/directory/community/red-earth-farms/", note: "Community land trust of homesteads since 2005, listed by the Foundation for Intentional Community; its own site lists scheduled visits only, May to October, and is not served over https." },
      { title: "Shimek State Forest, Iowa DNR", url: "https://www.iowadnr.gov/places-to-go/state-forests/shimek-state-forest", note: "Public forest of 9,448 acres in Lee and Van Buren counties; public land, not a settlement." },
    ],
  },
  "downeast-maine": {
    asks: "Downeast Maine asks you to arrive as a guest in Wabanaki homeland, not as a buyer of it. The Passamaquoddy reservations at Sipayik and Motahkomikuk lie inside the county, and under the Maine Implementing Act the right to reside there is an internal tribal matter, so that land is not a market. Beyond it, First Light's published process, which centres the Wabanaki Commission, puts land requests from Chiefs and Tribal councils first and the general public last, which means waiting beside returns already under way rather than bidding against them. Housing is the pressure to be honest about: the Sunrise County Economic Council estimates that 59 percent of county households cannot afford to buy a home. The land itself asks for a working relationship with berries and forest, a coast where the tide at Eastport ranges about 18 feet, and private wells that Maine leaves to the owner to test.",
    source: "Wabanaki Commission on Land and Stewardship and First Light, Return (land recovery priorities)",
    sourceUrl: "https://dawnlandreturn.org/first-light/lets-work-together/return",
    caseLinks: [
      { title: "Dawnland Return", url: "https://dawnlandreturn.org", note: "The reciprocity institution itself: Tributary Land Returns (11 projects, over 50,000 acres, five Wabanaki communities, statewide). No county breakdown is published, so no acreage is attributed to Washington County." },
      { title: "Kuwesuwi Monihq (Pine Island) return", url: "https://dawnlandreturn.org/wabanaki-commission/projects/kuwesuwi-monihq-pine-island", note: "The one return documented on the Commission's pages inside the county: 140 acres in Big Lake, returned to the Passamaquoddy in 2021." },
      { title: "Downeast Lakes Land Trust", url: "https://downeastlakes.org/who-we-are/our-history/", note: "Community land trust formed by residents around Grand Lake Stream after a late-1990s sale of 446,000 acres. A locally led, non-Native model; its history page records the Treaty of 1794 and the 1980 settlement." },
      { title: "Maine Farmland Trust, Access Farmland", url: "https://www.mainefarmlandtrust.org/farmland/access-farmland", note: "The documented current farm-access route (FarmLink, easements at sale). Statewide; no Washington County programme appears on its current pages." },
      { title: "Cobscook Institute, Indigenous Teaching and Learning", url: "https://cobscookinstitute.org/indigenous-teaching-and-learning", note: "Community learning centre on Cobscook Bay; says Passamaquoddy people have guided it since its founding." },
      { title: "Wabanaki REACH", url: "https://www.wabanakireach.org", note: "Supports Wabanaki self-determination through education, truth-telling and restorative practices." },
      { title: "Sunrise County Economic Council, Washington County housing", url: "https://sunrisecounty.org/2026/06/new-tools-to-understand-washington-countys-housing-crisis/", note: "The county's regional development body; housing dashboards and snapshots (June 2026)." },
      { title: "Maine Coast Heritage Trust", url: "https://www.mcht.org", note: "Coastal land trust with a Downeast office; a Tributary partner named by the Commission and First Light." },
    ],
  },
};
