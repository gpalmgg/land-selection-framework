// Legal pathway per region (the way in): non-resident ownership, residency link, zoning route, collective forms, first claims,
// ordered steps, what is ruled out, direction of travel, and explicit gaps. Orientation from public sources, not legal advice.
// Generated 2026-10-05 by EV-INT-LEGAL from the 2026-10 legal staging files (one per region id) (EV-LEGAL-EU / -NA / -NEW). Each entry passed
// scripts/evidence/validate_legal.mjs (schema, opened-URL ledger) and agrees with data/processed/legal-ownership.json.
// Qualitative only: never scored, ranked, filtered on or counted; the only number is a step's `n` (its position in the sequence).
// Keys are alphabetical by id (display order is never a ranking). Loaded lazily by src/data.js loadDrawerData(), never on first paint.
export const legalPathway = {
  "alentejo": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "The Civil Code treats foreigners as equal to nationals in civil rights unless a law says otherwise (with a reciprocity clause for states that deny Portuguese citizens the same right); the sources opened found no nationality bar on owning rural land. A non-resident foreigner who wants a Portuguese tax number (NIF) can appoint a fiscal representative, a person or company with tax residence or seat in Portugal.",
      "source": "Código Civil art. 14 (consolidated, Diário da República); gov.pt service page 'Nomear representante fiscal' (updated 15.10.2025)",
      "sourceUrl": "https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/1966-34509075"
    },
    "residency": {
      "link": "separate_route",
      "summary": "Buying rural land does not carry a residence permit in the sources opened. Lei 56/2023 (Mais Habitação), art. 42, stopped accepting new applications for investment-based residence permits under the provisions of Lei 23/2007 that it names, the real-estate-linked investment routes; permits already granted can still be renewed. Which other residence routes suit a land-based household was not opened here.",
      "source": "Lei 56/2023, de 6 de outubro, art. 42 (Diário da República)",
      "sourceUrl": "https://diariodarepublica.pt/dr/detalhe/lei/56-2023-222477692"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "A dwelling on rural land is decided parcel by parcel by the câmara municipal. In the Reserva Agrícola Nacional (RAN) new construction is prohibited except for listed uses, among them a permanent home for a farmer on the holding or for owners in proven economic need, and only one such non-agricultural use is allowed; in the Reserva Ecológica Nacional (REN) building and subdivision are prohibited unless compatible with the protection aims. Both protections can sit on land that can still be bought freely.",
      "source": "Decreto-Lei 73/2009 (RAN) arts. 21-22; Decreto-Lei 166/2008 (REN) art. 20",
      "sourceUrl": "https://diariodarepublica.pt/dr/detalhe/decreto-lei/73-2009-603209"
    },
    "collectiveForms": [
      {
        "kind": "cooperative",
        "name": "Cooperativa agrícola",
        "summary": "Agricultural co-operatives have their own legal regime (Decreto-Lei 335/99), alongside the general Cooperative Code (Lei 119/2015).",
        "source": "Decreto-Lei 335/99, de 20 de agosto",
        "sourceUrl": "https://diariodarepublica.pt/dr/detalhe/decreto-lei/335-1999-434001"
      },
      {
        "kind": "association",
        "name": "Associação",
        "summary": "Civil Code chapter on legal persons applies to associations without an economic aim for their members (art. 157 ff.).",
        "source": "Código Civil art. 157 (consolidated, Diário da República)",
        "sourceUrl": "https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/1966-34509075"
      }
    ],
    "firstClaim": [
      "Owners of adjoining rural parcels smaller than the local unidade de cultura hold a reciprocal right of first refusal when a neighbouring parcel is sold to someone who is not an adjoining owner (Civil Code art. 1380); it does not apply where the land is part of an urban property or is not used for cultivation, or where the sale covers a family-type farm made of dispersed parcels (art. 1381)."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Find out before any offer whether the parcel lies in the RAN or the REN, because both limit new construction.",
        "who": "Câmara municipal (planning department) of the municipality",
        "source": "Decreto-Lei 73/2009 arts. 21-22 and Decreto-Lei 166/2008 art. 20",
        "sourceUrl": "https://diariodarepublica.pt/dr/detalhe/decreto-lei/73-2009-603209"
      },
      {
        "n": 2,
        "what": "Ask the câmara in writing for prior information (pedido de informação prévia) on whether the intended operation is viable and which legal restrictions apply to the parcel.",
        "who": "Câmara municipal",
        "source": "Decreto-Lei 555/99 (RJUE) art. 14",
        "sourceUrl": "https://diariodarepublica.pt/dr/detalhe/decreto-lei/555-1999-655682"
      },
      {
        "n": 3,
        "what": "If the parcel is in the RAN, a non-agricultural use needs the binding prior opinion of the regional RAN entity, and a home is allowed only as a farmer's permanent residence on the holding or for owners in proven economic need, one use only.",
        "who": "Regional RAN entity, requested directly or through the câmara",
        "source": "Decreto-Lei 73/2009 arts. 22-23",
        "sourceUrl": "https://diariodarepublica.pt/dr/detalhe/decreto-lei/73-2009-603209",
        "duration": {
          "text": "The regional RAN entity issues its opinion within 25 days, and the period is suspended while it asks for further documents",
          "source": "Decreto-Lei 73/2009 art. 23(1) and (3)",
          "sourceUrl": "https://diariodarepublica.pt/dr/detalhe/decreto-lei/73-2009-603209"
        }
      },
      {
        "n": 4,
        "what": "Check whether owners of adjoining parcels hold a right of first refusal on the sale before signing.",
        "who": "Owners of adjoining rural parcels",
        "source": "Código Civil arts. 1380-1381 (consolidated)",
        "sourceUrl": "https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/1966-34509075"
      },
      {
        "n": 5,
        "what": "A foreign buyer who does not live in Portugal and needs a NIF appoints a fiscal representative and requests the number.",
        "who": "Autoridade Tributária e Aduaneira (Finanças), through a fiscal representative resident or seated in Portugal",
        "source": "gov.pt, 'Nomear representante fiscal' (updated 15.10.2025)",
        "sourceUrl": "https://www.gov.pt/servicos/nomear-representante-fiscal"
      },
      {
        "n": 6,
        "what": "Choose the holding body for the group, for example an agricultural co-operative or a non-profit association, before the purchase deed.",
        "who": "The founding group",
        "source": "Decreto-Lei 335/99 and Código Civil art. 157",
        "sourceUrl": "https://diariodarepublica.pt/dr/detalhe/decreto-lei/335-1999-434001"
      }
    ],
    "ruledOut": [
      "Buying rural land does not by itself carry a right to build: in the RAN and the REN construction is prohibited except for the listed uses.",
      "Subdividing or building in the REN is prohibited unless compatible with the protection aims set out in Decreto-Lei 166/2008 art. 20."
    ],
    "direction": "tightening",
    "directionNote": "Lei 56/2023 (October 2023) ended new applications for the real-estate-linked investment residence routes it names; the land-ownership rules themselves were not found to have changed.",
    "gaps": [
      "Water: whether Alqueva-scheme allocations transfer with a parcel, and the licence needed for a borehole outside the scheme, were not covered by an opened primary source.",
      "Processing times for residence permits (the dossier cites 12-18 months as of 2024) were not found in an opened source and are left out.",
      "Municipal master plans (PDM) differ by câmara and were not read for Odemira, Beja, Évora or Mértola.",
      "Other residence routes (D7, D8, D2) were not opened and are not described.",
      "The statutory fire fuel-management duty around buildings (Decreto-Lei 82/2021) was opened but its distances were not extracted."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "asturias": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "Spanish civil law gives foreigners the same civil rights as Spaniards except where special laws or treaties say otherwise (Civil Code art. 27); no nationality bar on rural land was found in the sources opened. Ley 8/1975 creates defence zones in which foreign-held property is capped and access restricted, so a parcel near coast or frontier needs checking.",
      "source": "Código Civil art. 27 (BOE consolidated); Ley 8/1975 de zonas e instalaciones de interés para la Defensa Nacional, chapter III (BOE)",
      "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763"
    },
    "residency": {
      "link": "separate_route",
      "summary": "Buying land does not carry a residence permit in the sources opened. Ley Orgánica 1/2025 emptied articles 63-67 of Ley 14/2013, the investor-visa route for acquiring real estate; applications filed earlier are still processed and existing visas keep their validity. Other residence routes were not opened here.",
      "source": "Ley Orgánica 1/2025, de 2 de enero, disposición final vigesimoprimera (BOE)",
      "sourceUrl": "https://www.boe.es/eli/es/lo/2025/01/02/1"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "Outside the núcleos rurales (traditional villages) a new dwelling is not permitted, except in zones of non-developable land of interest where the municipal plan allows isolated single-family houses to keep the Asturian settlement pattern; homes integrated in a working farm may be maintained or exceptionally extended, and a new house may be authorised within fifteen metres of existing ones in a traditional quintana. Inside núcleos rurales the municipal plan sets what can be parcelled and built.",
      "source": "Decreto Legislativo 1/2004 (Asturias urbanism, consolidated), arts. 121-125",
      "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-2004-10070"
    },
    "collectiveForms": [
      {
        "kind": "cooperative",
        "name": "Cooperativa",
        "summary": "Co-operatives in Asturias fall under the regional co-operatives law.",
        "source": "Ley 4/2010, de 29 de junio, de Cooperativas (Principado de Asturias; BOE consolidated)",
        "sourceUrl": "https://www.boe.es/eli/es-as/l/2010/06/29/4"
      }
    ],
    "firstClaim": [
      "Owners of adjoining rustic parcels hold a legal right of retraction (retracto de colindantes) when a rustic parcel of up to one hectare is sold, unless the parcels are separated by streams, ditches, tracks or similar (Civil Code art. 1523); it must be exercised within nine days of registration (art. 1524)."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Find out whether the parcel lies inside a núcleo rural or in non-developable land (and which category), because the right to build a home differs between them.",
        "who": "Ayuntamiento (concejo) planning office",
        "source": "Decreto Legislativo 1/2004 arts. 121-124",
        "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-2004-10070"
      },
      {
        "n": 2,
        "what": "Where a use is authorisable rather than simply permitted, obtain the prior authorisation, which is separate from and earlier than the municipal licence; requests for uses the plan does not expressly list go to fifteen days of public information.",
        "who": "Ayuntamiento, or the Comisión de Urbanismo y Ordenación del Territorio del Principado de Asturias when the town hall lacks the power",
        "source": "Decreto Legislativo 1/2004 arts. 123 and 132",
        "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-2004-10070",
        "duration": {
          "text": "Fifteen days of public information in the Boletín Oficial del Principado de Asturias for requests the plan does not expressly list",
          "source": "Decreto Legislativo 1/2004 art. 132(b)",
          "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-2004-10070"
        }
      },
      {
        "n": 3,
        "what": "Confirm that road access, sanitation, drinking water and electricity are resolved, since no building is authorised in non-developable land without them.",
        "who": "Ayuntamiento",
        "source": "Decreto Legislativo 1/2004 art. 126",
        "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-2004-10070"
      },
      {
        "n": 4,
        "what": "Check the registered title of the parcel and whether neighbouring owners hold a retracto right on a parcel of one hectare or less; if a parcel is split, the notary and registrar record that the split gives no building rights.",
        "who": "Registro de la Propiedad; notary; owners of adjoining parcels",
        "source": "Código Civil arts. 1523-1524; Decreto Legislativo 1/2004 art. 125",
        "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763",
        "duration": {
          "text": "The retracto must be exercised within nine days of registration of the sale",
          "source": "Código Civil art. 1524",
          "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763"
        }
      },
      {
        "n": 5,
        "what": "Choose the holding body for the group, for example a co-operative under the Asturian co-operatives law, before the purchase deed.",
        "who": "The founding group",
        "source": "Ley 4/2010 de Cooperativas (Principado de Asturias)",
        "sourceUrl": "https://www.boe.es/eli/es-as/l/2010/06/29/4"
      }
    ],
    "ruledOut": [
      "Outside núcleos rurales, urban-style parcelling of non-developable land is prohibited, and a split of a farm for non-building purposes carries no building rights (Decreto Legislativo 1/2004 art. 125).",
      "A new isolated dwelling in non-developable land is not allowed unless the municipal plan expressly allows it in the zones of interest (art. 124)."
    ],
    "direction": "stable",
    "directionNote": "The ownership rules are unchanged; the regional urbanism framework dates from 2004, and a draft (anteproyecto) of a new Asturian territorial planning law was presented in February 2026 that would recognise the núcleo rural as its own class of land. It is a draft only, not in force.",
    "gaps": [
      "The draft territorial law presented in February 2026 is only a press-reported anteproyecto; its text and timetable were not opened and no rule is taken from it.",
      "Title problems in abandoned hamlets (heirs abroad, scattered registered shares) appear in the dossier without a source and are not stated as fact here.",
      "Whether any Asturian municipality lies in a Ley 8/1975 defence zone with restricted foreign acquisition was not checked.",
      "The municipal plan (Plan General) of the specific concejo was not read; núcleo rural boundaries differ concejo by concejo.",
      "Rules for protected natural spaces and Biosphere Reserves, which add layers to permitting, were not opened.",
      "Residence routes other than the removed investor visa were not opened."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "bas-saint-laurent": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "restricted",
      "summary": "A person who does not reside in Québec needs the authorization of the Commission de protection du territoire agricole du Québec (CPTAQ) to acquire farm land of four hectares or more; the Government may lower that threshold by regulation. Bill 86 (2025, chapter 5) widened the net: it covers acquiring shares in a corporation one of whose assets is farm land, not only one whose principal asset is farm land, and it sets separate authorization grounds for investment funds, for buyers who will not register a farm operation within 1,000 metres of an urbanization perimeter, and for holdings above a cap to be set by regulation.",
      "source": "Bill 86, SQ 2025, c. 5, An Act to ensure the long-term preservation and vitality of agricultural land, ss. 1, 63 (new s. 79.0.6) and explanatory notes (Publications du Québec)",
      "sourceUrl": "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF"
    },
    "residency": {
      "link": "residency_required",
      "summary": "Whether you reside in Québec decides whether the non-resident authorization applies to farm land of four hectares or more. The full definition of non-resident in section 1 of the Act respecting the acquisition of farm land by non-residents was not opened (the official consolidation site refused scripted requests), so the exact test is not stated here. A separate ground for buyers who are not a registered agricultural operation applies near urbanization perimeters whether or not the buyer lives in Québec.",
      "source": "Bill 86, SQ 2025, c. 5, explanatory notes and s. 63 (new s. 79.0.6)",
      "sourceUrl": "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "In the agricultural zone, a use other than agriculture is for the CPTAQ to authorise, and the Act refers to applications of collective scope that a regional county municipality (MRC) may submit to the commission to decide in which cases and under which conditions new residential uses may be introduced in an agricultural zone. The MRC land-use plan and the municipal permit also apply; neither was opened.",
      "source": "Bill 86, SQ 2025, c. 5, explanatory notes",
      "sourceUrl": "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF"
    },
    "collectiveForms": [],
    "firstClaim": [
      "The CPTAQ must authorise before the following acquisitions of farm land: by a non-resident of four hectares or more; by an investment fund (in force from 5 December 2024); by a buyer that is not a registered agricultural operation where the land is within 1,000 metres of an urbanization perimeter in a metropolitan community or an MRC in the groups set by decree (from 5 December 2024); and, once a regulation sets it, by a buyer whose total holdings would exceed the regulated area (Bill 86, new s. 79.0.6 and s. 114).",
      "Until the first decree under s. 79.0.5, the 1,000-metre ground applies to the municipalities in groups A to D of Schedule B (s. 105.5). In this region Rimouski-Neigette and Rivière-du-Loup are in group D; La Mitis, Kamouraska, Témiscouata, Les Basques, La Matanie and La Matapédia are in group F, which that interim rule does not cover."
    ],
    "steps": [
      {
        "what": "Start with the region's welcome network, not a parcel. The regional welcome page names a Place aux jeunes agent in each of the 8 MRCs for people aged 18 to 35 (immigrants with a valid work permit included), resources for people aged 36 and over, and personalised support for immigrants, with an organisation named for each MRC. It does not mention families, groups or farm succession, and Place aux jeunes' own site says its service is for the 18-35s, while its exploratory stays can be taken as a family or alone.",
        "who": "The organisation for the MRC concerned (Place aux jeunes, the 36-and-over service, the immigrant welcome service)",
        "source": "Bas-Saint-Laurent, Accueil et intégration; Place aux jeunes en région",
        "sourceUrl": "https://www.bas-saint-laurent.org/fr/setablir/accueil-integration.html",
        "n": 1
      },
      {
        "what": "If farming is the aim, register with ARTERRE, the matching service that accompanies and pairs aspiring farmers with landowners who wish to transfer or lease a farm; the Bas-Saint-Laurent is a participating region.",
        "who": "ARTERRE agent for the MRC",
        "source": "ARTERRE, Régions participantes: Bas-Saint-Laurent",
        "sourceUrl": "https://www.arterre.ca/RegionsParticipantes/01",
        "n": 2
      },
      {
        "what": "Before buying farm land, work out which CPTAQ ground could apply: non-residency and four hectares or more; investment fund; or, in Rimouski-Neigette and Rivière-du-Loup, a buyer who will not register a farm operation within 1,000 metres of an urbanization perimeter. A buyer who declares that the land will be part of an agricultural operation registered in their name within the year after registration in the land register is granted authorization under the second ground.",
        "who": "CPTAQ; the notary",
        "source": "Bill 86, new ss. 79.0.6 and 79.0.12; s. 105.5 and Schedule B",
        "sourceUrl": "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF",
        "duration": {
          "text": "The farm land must be part of a registered agricultural operation in the buyer's name in the year following registration of the acquisition in the land register",
          "source": "Bill 86, new s. 79.0.12",
          "sourceUrl": "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF"
        },
        "n": 3
      },
      {
        "what": "Learn whose land it is and meet the Nations before acting. The Wolastoqiyik Wahsipekuk First Nation, the only Wolastoqey nation in Québec, names Wolastokuk as its ancestral territory and records the loss of the Viger reserve lands in 1869; Listuguj states that Gespe'gewa'gi has been Mi'gmaq traditional territory since time immemorial, and the Mi'gmawei Mawiomi Secretariat says Mi'gma'gi remains unceded.",
        "who": "The Nations' own governments (Wolastoqiyik Wahsipekuk First Nation; Listuguj, Gesgapegiag and Gespeg through the Mi'gmawei Mawiomi Secretariat)",
        "source": "Wolastoqiyik Wahsipekuk First Nation; Listuguj, About; Mi'gmawei Mawiomi Secretariat, 4 June 2026",
        "sourceUrl": "https://wolastoqiyikwahsipekuk.ca/",
        "n": 4
      }
    ],
    "ruledOut": [
      "An investment fund cannot acquire farm land in Québec without the CPTAQ's authorization, directly or indirectly (Bill 86, new s. 79.0.6).",
      "A non-resident cannot acquire farm land of four hectares or more without CPTAQ authorization, and an acquisition made in contravention of s. 79.0.6 is covered by the Act's nullity and penalty rules (Bill 86 explanatory notes and s. 79.0.6 amendments)."
    ],
    "direction": "tightening",
    "directionNote": "Bill 86 was assented to on 25 March 2025 and, for its first two authorization grounds and the interim Schedule B rule, takes effect as of 5 December 2024. The third ground and the holding cap come into force only with the first regulation under it, and no decree under s. 79.0.5 or cap regulation was found, so the interim group lists are the rule in the text opened.",
    "gaps": [
      "The decree under s. 79.0.5 and the holding-cap regulation were not found; whether a decree has replaced the interim Schedule B groups since March 2025 is unknown.",
      "The full definition of non-resident in section 1 of the Act respecting the acquisition of farm land by non-residents was not opened (the official consolidation site refused scripted requests); only Bill 86's amendments and explanatory notes were read.",
      "The federal prohibition on the purchase of residential property by non-Canadians, and the Civil Code collective vehicles (co-operative, association, trust, emphyteusis), were not verified and are not stated.",
      "The MRC land-use plans, the municipal permit rules and the CPTAQ's own pages were not opened, so what a home or a group of homes needs on a given parcel is unknown.",
      "No regional farmland price from an official current source was found; the only regional figure (2019) is stale and is not used.",
      "Place aux jeunes serves ages 18 to 35, so a family or group arrival is a stated fit limit of that service; no source was opened for a group arrival route or for ARTERRE's results in the region.",
      "No Mi'gmaq source opened names the Matapédia valley (La Matapédia MRC), and no Wolastoqiyik page opened states the territory is unceded; the project's convention of treating the territory as unceded is not asserted as a legal finding here.",
      "The outcomes of the New Brunswick Wolastoqey and Mi'gmaq title cases are not transferred to Québec."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "cascadia": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "No Oregon statute restricting foreign or non-resident purchase of private land was found: the National Agricultural Law Center (updated June 2026) lists about 29 states with such laws and Oregon is not among them for private land (its only restriction concerns purchases of state-owned land, which requires US citizenship or a declared intention to become a citizen). Foreign persons who acquire a significant interest in US agricultural land must still file a federal AFIDA disclosure.",
      "source": "National Agricultural Law Center, Foreign Ownership FAQ (updated 26 June 2026); ORS 273.255; USDA FSA AFIDA page",
      "sourceUrl": "https://nationalaglawcenter.org/foreign-investments-in-ag/"
    },
    "residency": {
      "link": "no_link",
      "summary": "The sources opened show no residency or citizenship test for buying private land in Oregon; the only citizenship clause found (ORS 273.255) applies to applying to purchase state-owned land. Whether land purchase carries any immigration consequence was not covered by a source and is left to a local professional.",
      "source": "ORS 273.255 (Oregon Public Law mirror of the Oregon Revised Statutes)",
      "sourceUrl": "https://oregon.public.law/statutes/ors_273.255"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "Most rural land sits in exclusive farm use (EFU) zones. ORS 215.283(1) lists what may be established in any EFU zone, including a dwelling for a relative of the farm operator who is needed on the farm and dwellings customarily provided with farm use (subject to the farm income standard). A single-family dwelling not tied to farm use needs county approval on findings, including that the land is generally unsuitable for farm crops, livestock or trees (ORS 215.284). A multi-household community is therefore decided parcel by parcel at county level.",
      "source": "ORS 215.283, 215.284 and 215.279",
      "sourceUrl": "https://oregon.public.law/statutes/ors_215.283"
    },
    "collectiveForms": [
      {
        "kind": "cooperative",
        "name": "Cooperative corporation (ORS chapter 62)",
        "summary": "Oregon has a cooperatives chapter in the Revised Statutes; its fit for a land-holding community depends on the cooperative's purpose and should be checked locally.",
        "source": "ORS 62.015 (definitions, chapter 62 Cooperatives)",
        "sourceUrl": "https://oregon.public.law/statutes/ors_62.015"
      },
      {
        "kind": "association",
        "name": "Nonprofit corporation (ORS chapter 65)",
        "summary": "Oregon's nonprofit corporation chapter provides the legal body for an association or charitable land-holding organisation.",
        "source": "ORS 65.001 (definitions, chapter 65 Nonprofit Corporations)",
        "sourceUrl": "https://oregon.public.law/statutes/ors_65.001"
      },
      {
        "kind": "company",
        "name": "Limited liability company (ORS chapter 63)",
        "summary": "A statutory company form that several households can use to hold title together under an operating agreement.",
        "source": "ORS 63.001 (definitions, chapter 63 Limited Liability Companies)",
        "sourceUrl": "https://oregon.public.law/statutes/ors_63.001"
      },
      {
        "kind": "land_trust",
        "name": "Community land trust (for example Proud Ground)",
        "summary": "Community land trusts operate in Oregon; Proud Ground describes itself as a community land trust serving six counties in Oregon and Southwest Washington, with homeowners holding a voice in governance.",
        "source": "Proud Ground (community land trust), home page",
        "sourceUrl": "https://www.proudground.org/"
      }
    ],
    "firstClaim": [
      "No statutory pre-emption or first-refusal holder over private rural land was identified in the sources opened. County planning departments and, for land divisions and non-farm dwellings, the county governing body decide what may be built."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Ask the county planning department which zone the parcel is in (exclusive farm use, forest, or another zone) before any offer, and what the zone permits as of right.",
        "who": "County planning department of the county where the parcel lies",
        "source": "ORS 215.283(1) lists uses allowed in any exclusive farm use zone",
        "sourceUrl": "https://oregon.public.law/statutes/ors_215.283"
      },
      {
        "n": 2,
        "what": "Check whether a farm-related dwelling is available: a dwelling for a relative whose help the farm operator needs, or dwellings customarily provided with farm use, which are tested against the farm income standard that rule-makers must let an operator meet over several years.",
        "who": "County planning department",
        "source": "ORS 215.279 (farm income standard) and OAR 660-033-0135 (dwellings in conjunction with farm use)",
        "sourceUrl": "https://oregon.public.law/statutes/ors_215.279"
      },
      {
        "n": 3,
        "what": "For housing or uses beyond what the zone allows as of right, apply for a county land-use decision. Dwellings not provided in conjunction with farm use are approved only on findings about effects on nearby farm practices and the suitability of the land for farming.",
        "who": "County governing body or its designee (hearings officer or planning commission, depending on the county)",
        "source": "ORS 215.416 (permit application, notice, hearing) and ORS 215.284(2) (non-farm dwelling findings)",
        "sourceUrl": "https://oregon.public.law/statutes/ors_215.416",
        "duration": {
          "text": "The county must take final action within 150 days after the application is deemed complete (a statutory ceiling with listed exceptions; appeals add further time).",
          "source": "ORS 215.427 (final action on permit within 150 days)",
          "sourceUrl": "https://oregon.public.law/statutes/ors_215.427"
        }
      },
      {
        "n": 4,
        "what": "Expect neighbours or the state to be able to appeal the county decision; a notice of intent to appeal goes to the Land Use Board of Appeals.",
        "who": "Land Use Board of Appeals (state body)",
        "source": "ORS 197.830 (review of land use decisions by the Land Use Board of Appeals)",
        "sourceUrl": "https://oregon.public.law/statutes/ors_197.830",
        "duration": {
          "text": "A notice of intent to appeal is due within 21 days of actual notice of the decision (or of when the person knew or should have known).",
          "source": "ORS 197.830 (appeal deadline)",
          "sourceUrl": "https://oregon.public.law/statutes/ors_197.830"
        }
      },
      {
        "n": 5,
        "what": "Where a use is not permitted in the farm or forest zone at all, the route is a statewide-goal exception adopted through the county plan process rather than a permit.",
        "who": "County governing body, with review by the state land-conservation agency",
        "source": "ORS 197.732 (goal exceptions; criteria)",
        "sourceUrl": "https://oregon.public.law/statutes/ors_197.732"
      }
    ],
    "ruledOut": [
      "Buying a parcel does not by itself carry a right to build dwellings: in an exclusive farm use zone only the uses listed in ORS 215.283(1) are established without a county decision, and a dwelling not tied to farm use needs county approval on the findings in ORS 215.284.",
      "Farm-related dwellings are not open-ended: dwellings customarily provided with farm use are made subject to the farm income standard, and relatives' dwellings require that the operator needs the relative's help to manage the farm."
    ],
    "direction": "stable",
    "directionNote": "No new Oregon private-land foreign-ownership law appears in the National Agricultural Law Center's June 2026 list of states and 2025 enactments. Whether any Oregon bill of 2025 touched dwelling rules in ORS 215 was not confirmed, so this reading is held with limited confidence.",
    "gaps": [
      "The official Oregon Legislature and DLCD sites do not resolve from this sandbox; ORS text was read from the Oregon Public Law mirror, which labels itself as of 2025. Check the current ORS before relying on it.",
      "Oregon bills of 2025 flagged in the 2026-07 research (foreign ownership and any change to ORS chapter 215 dwelling rules): enactment status was not verified from a primary source.",
      "The dollar amount of the farm income standard (OAR 660-033-0135) and county-by-county practice on multi-household communities were not summarised from a primary source.",
      "Washington-side rules for the Cascadia region (county zoning under the state Growth Management Act) were not covered; this entry describes Oregon.",
      "Whether a long-established intentional community's permits are grandfathered, and how the permit climate compares for newer projects, rested on practitioner reports and was not sourced."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "cevennes": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "No nationality restriction on buying rural land was found in the provisions opened; the control that applies to every buyer, French or foreign, is the Safer pre-emption right on sales of agricultural land and farm buildings. The Safer is informed of rural sales by notaries and may buy in place of the original buyer; the decree for each Safer fixes the zones and minimum parcel size where the right applies.",
      "source": "Code rural et de la pêche maritime, arts. L143-1 and L143-7 (consolidated, in force; Safer page 'Le droit de préemption')",
      "sourceUrl": "https://www.safer.fr/les-safer/le-droit-de-preemption/"
    },
    "residency": {
      "link": "unknown",
      "summary": "Whether buying land carries any residence right was not covered by a source opened for this entry; nothing opened makes residence a condition of buying rural land.",
      "source": "Safer, 'Le droit de préemption' (scope: pre-emption only)",
      "sourceUrl": "https://www.safer.fr/les-safer/le-droit-de-preemption/"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "In the agricultural (A) and natural and forest (N) zones of a municipal plan (PLU) only buildings needed for farming or forestry can be authorised, plus the extensions, annexes and changes of use that the plan expressly allows; a change of use of a designated building needs the conforming opinion of a departmental commission. Inside the Parc national des Cévennes, the core (cœur) has its own regulation set by decree 2009-1677, while the adhesion area has no specific environmental regulation but its communes commit to keep their planning documents compatible with the park charter.",
      "source": "Code de l'urbanisme, arts. R151-22, R151-23 and L151-11 (consolidated); Parc national des Cévennes, 'La réglementation du cœur' and 'La charte'",
      "sourceUrl": "https://www.cevennes-parcnational.fr/fr/le-parc-national-des-cevennes/la-reglementation-du-coeur"
    },
    "collectiveForms": [
      {
        "kind": "company",
        "name": "Groupement foncier agricole (GFA)",
        "summary": "A civil company formed between natural persons to hold agricultural land (Code rural arts. L322-1 ff.); it continues despite the death or bankruptcy of a member.",
        "source": "Code rural et de la pêche maritime, art. L322-1 (consolidated)",
        "sourceUrl": "https://codes.droit.org/payloads/Code%20rural%20et%20de%20la%20p%C3%AAche%20maritime.xml"
      },
      {
        "kind": "land_trust",
        "name": "Terre de Liens (La Foncière)",
        "summary": "The Terre de Liens movement is organised as a federation, a foncière (land-holding company), a foundation and regional associations.",
        "source": "Terre de Liens, home page 'L'organisation de notre mouvement'",
        "sourceUrl": "https://terredeliens.org/"
      }
    ],
    "firstClaim": [
      "The Safer of the region (Safer Occitanie for the Cévennes departments) holds a pre-emption right on sales of farm buildings and agricultural land in the zones set by its decree, and may offer a revised price; the right is used for objectives such as installing farmers, keeping family farms, fighting land speculation and protecting the environment, and is exercised only after the State's agreement (two government commissioners).",
      "Sales to relatives and in-laws to the fourth degree, between co-heirs and certain farm workers, family helpers and partners are outside the Safer right (Code rural art. L143-4)."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Check the parcel against the commune's PLU zoning (A or N) and whether it lies in the park's core (cœur) or adhesion area before any offer.",
        "who": "Mairie (urban planning office); Parc national des Cévennes",
        "source": "Code de l'urbanisme R151-22, R151-23; Parc national des Cévennes 'La réglementation du cœur'",
        "sourceUrl": "https://www.cevennes-parcnational.fr/fr/le-parc-national-des-cevennes/la-reglementation-du-coeur"
      },
      {
        "n": 2,
        "what": "Expect the notary to inform the Safer of the sale and plan the project so that it answers the Safer's statutory objectives (installing or keeping farmers, a viable family farm, protecting the environment).",
        "who": "Notaire; the regional Safer",
        "source": "Code rural arts. L143-2 and L143-3; Safer 'Le droit de préemption'",
        "sourceUrl": "https://www.safer.fr/les-safer/le-droit-de-preemption/"
      },
      {
        "n": 3,
        "what": "If the Safer pre-empts and judges the price or conditions excessive, it sends the seller's notary a purchase offer on its own terms; the seller may accept, withdraw the property from sale or ask the court to review the price.",
        "who": "Safer, the seller and the competent civil court",
        "source": "Code rural art. L143-10",
        "sourceUrl": "https://codes.droit.org/payloads/Code%20rural%20et%20de%20la%20p%C3%AAche%20maritime.xml",
        "duration": {
          "text": "The seller who neither accepts, withdraws nor goes to court within six months of notification of the Safer's offer is deemed to have accepted it",
          "source": "Code rural art. L143-10",
          "sourceUrl": "https://codes.droit.org/payloads/Code%20rural%20et%20de%20la%20p%C3%AAche%20maritime.xml"
        }
      },
      {
        "n": 4,
        "what": "If the plan is to take control of a company that holds farmland rather than land directly, check whether the prior authorisation of the prefect applies once the significant-enlargement threshold is crossed.",
        "who": "Préfet du département",
        "source": "Code rural art. L333-1 (law 2021-1756)",
        "sourceUrl": "https://codes.droit.org/payloads/Code%20rural%20et%20de%20la%20p%C3%AAche%20maritime.xml"
      },
      {
        "n": 5,
        "what": "Choose the holding body, for example a GFA among natural persons or a partnership with a Terre de Liens foncière, before the deed.",
        "who": "The founding group; Terre de Liens",
        "source": "Code rural art. L322-1; Terre de Liens",
        "sourceUrl": "https://terredeliens.org/"
      }
    ],
    "ruledOut": [
      "Buying agricultural land does not guarantee the sale goes through to the buyer: the Safer can substitute itself as buyer, and sale price and conditions can be revised on its offer (Code rural arts. L143-1 and L143-10).",
      "Inside the park's core, the core regulation applies to every user, whether owner, professional or visitor (decree 2009-1677, as described by the park)."
    ],
    "direction": "unknown",
    "directionNote": "The consolidated Code rural shows Safer provisions amended by laws dated 26 May 2026 (art. L141-1) and 18 August 2026 (arts. L143-1 and L143-8); what those amendments changed was not compared, so no direction is asserted.",
    "gaps": [
      "The content of the 2026 amendments to the Safer provisions (laws of 26 May 2026 and 18 August 2026) was not compared with the earlier text.",
      "The two-month Safer decision period and the minimum parcel size for the Occitanie decree (dossier cites about 0.7 ha) were not found in an opened source and are not stated.",
      "Residence routes and the right of a foreign buyer to live in France were not opened.",
      "The park charter text and the core regulation's rules on works and construction were not read in detail; only the park's own summary pages were opened.",
      "Association (loi 1901) and SCI forms named in the dossier were not opened.",
      "Légifrance returned a bot-check page, so the Code rural and Code de l'urbanisme were read in the consolidated open-data mirror at codes.droit.org rather than on legifrance.gouv.fr."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "connemara": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "The old statutory limit on who could acquire land outside towns (Land Act 1965 section 45, which turned on being a 'qualified person' such as an Irish citizen or long-term resident) was repealed by the Land Act 2005 according to the Irish Statute Book directory; no replacement restriction on non-resident or foreign owners was found in the sources opened. Planning, not ownership, is the binding gate.",
      "source": "Irish Statute Book legislation directory for the Land Act 1965 ('S. 45 rep. 24/2005, ss. 12(d), 13(3)')",
      "sourceUrl": "https://www.irishstatutebook.ie/eli/isbc/1965_2.html"
    },
    "residency": {
      "link": "no_link",
      "summary": "No residence condition for buying land appears in the sources opened, and none describe a residence permit that follows from a land purchase; living in Ireland is a separate immigration matter that was not opened here.",
      "source": "Irish Statute Book legislation directory for the Land Act 1965",
      "sourceUrl": "https://www.irishstatutebook.ie/eli/isbc/1965_2.html"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "A new one-off rural house is decided by the county council against a local-links test. Galway's plan facilitates open-countryside houses for applicants with demonstrable rural links or need (with enurement conditions), more permissively in 'structurally weak' areas; in the Galway Gaeltacht the plan also gives consideration to Irish speakers who prove competence and can be a long-term asset to Gaeltacht networks, with a 15-year language enurement. Cork's plan supports rural-generated housing need and is more open in structurally weaker rural areas.",
      "source": "Galway County Development Plan 2022-2028, chapter 4 (RH 1-5); Cork County Development Plan 2022-2028, Volume 1, chapter 5 (RP 5-2, RP 5-8)",
      "sourceUrl": "https://consult.galway.ie/en/consultation/adopted-galway-county-development-plan-2022-2028/chapter/chapter-4-rural-living-and-development"
    },
    "collectiveForms": [
      {
        "kind": "company",
        "name": "Company limited by guarantee (CLG)",
        "summary": "Part 18 of the Companies Act 2014 provides the CLG form, commonly used for non-profit bodies.",
        "source": "Companies Act 2014, Part 18",
        "sourceUrl": "https://www.irishstatutebook.ie/eli/2014/act/38/enacted/en/html"
      },
      {
        "kind": "other",
        "name": "Registered charity",
        "summary": "The Charities Act 2009 defines charitable purposes and set up the Charities Regulatory Authority.",
        "source": "Charities Act 2009, ss. 3 and 13",
        "sourceUrl": "https://www.irishstatutebook.ie/eli/2009/act/6/enacted/en/html"
      }
    ],
    "firstClaim": [
      "No statutory pre-emption holder on sales of rural land was identified in the sources opened."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Decide first whether the project starts from an existing dwelling or from a greenfield site, because the plans tie new one-off houses in the open countryside to rural links or need.",
        "who": "County council planning authority (Galway County Council or Cork County Council)",
        "source": "Galway County Development Plan 2022-2028, chapter 4 (RH 1, RH 2, RH 4)",
        "sourceUrl": "https://consult.galway.ie/en/consultation/adopted-galway-county-development-plan-2022-2028/chapter/chapter-4-rural-living-and-development"
      },
      {
        "n": 2,
        "what": "Find the rural housing policy area of the site on the county plan maps and check whether it is inside a Gaeltacht area: in Cork only Cléire and Múscraí are Gaeltacht Language Planning Areas, so the West Cork mainland is outside it.",
        "who": "County council planning authority",
        "source": "Cork County Development Plan 2022-2028, Volume 1, paras 5.4.9 and 16.4.12",
        "sourceUrl": "https://www.corkcoco.ie/sites/default/files/2022-06/volume-1-main-policy-material.pdf"
      },
      {
        "n": 3,
        "what": "In the Galway Gaeltacht, show Irish-language competence where the plan's consideration for Irish speakers is relied on, and expect a language enurement condition; schemes of two or more houses also need a Linguistic Impact Statement.",
        "who": "Galway County Council planning authority",
        "source": "Galway County Development Plan 2022-2028, chapter 4 (RH 5) and chapter 13 (GA 4, GA 5)",
        "sourceUrl": "https://consult.galway.ie/en/consultation/adopted-galway-county-development-plan-2022-2028/chapter/chapter-13-galway-gaeltacht-and-islands",
        "duration": {
          "text": "The language enurement clause runs for 15 years",
          "source": "Galway County Development Plan 2022-2028, chapter 13, GA 4",
          "sourceUrl": "https://consult.galway.ie/en/consultation/adopted-galway-county-development-plan-2022-2028/chapter/chapter-13-galway-gaeltacht-and-islands"
        }
      },
      {
        "n": 4,
        "what": "Choose the holding body for a group project, for example a company limited by guarantee or a registered charity, before acquiring land.",
        "who": "The founding group",
        "source": "Companies Act 2014, Part 18; Charities Act 2009",
        "sourceUrl": "https://www.irishstatutebook.ie/eli/2014/act/38/enacted/en/html"
      }
    ],
    "ruledOut": [
      "Owning land does not carry permission to build: the county plans decide new one-off rural houses against rural-links or need criteria, and Galway applies language enurement in its Gaeltacht (GA 4, RH 5)."
    ],
    "direction": "stable",
    "directionNote": "The ownership restriction was repealed in 2005 and the two county plans cover 2022-2028; a national draft on rural and Gaeltacht housing guidance was reported in 2026 but was not opened.",
    "gaps": [
      "A national draft on rural and Gaeltacht housing (reported June 2026) and Cork Variation No. 1 (reported adopted 31 July 2026) were not opened, so current planning policy may differ from the 2022-2028 texts read.",
      "The Cork plan's rural housing objectives RP 5-3 to RP 5-7 (the local-links categories) were not read in detail, and a Cork-specific route for incomers without local links was not established.",
      "Co-operative societies (Industrial and Provident Societies Acts) were not found in an opened primary source and are not listed.",
      "Immigration permission to live in Ireland was not opened.",
      "Commonage and West-coast title complexity from the dossier has no opened source.",
      "Whether Údarás na Gaeltachta has a formal planning role beyond the plan's policies was not opened."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "downeast-maine": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "Maine law puts no bar on who may buy: 'an alien may take, hold, convey and devise real estate or any interest therein' (33 MRS 451). A corporation or partnership that holds, acquires or transfers an interest in agricultural land, on its own behalf or as a fiduciary or trustee, files an annual report with the commissioner (7 MRS 33). Neither rule restricts a purchase. The statutes were read on the Maine legislature's site; 2026 session changes and any foreign-adversary land bill were not checked.",
      "source": "33 MRS 451 (Rights of aliens); 7 MRS 33 (Report required)",
      "sourceUrl": "https://legislature.maine.gov/statutes/33/title33sec451.html"
    },
    "residency": {
      "link": "no_link",
      "summary": "Nothing in the statutes opened makes residence a condition of holding land: an alien may take, hold, convey and devise real estate. Whether holding land carries any right to a residence permit was not opened.",
      "source": "33 MRS 451 (Rights of aliens)",
      "sourceUrl": "https://legislature.maine.gov/statutes/33/title33sec451.html"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "Organized towns regulate through municipal zoning and subdivision review: dividing a tract into 3 or more lots within any 5-year period, or building or placing 5 or more dwelling units on a single tract, is a subdivision. Mandatory shoreland zoning applies within 250 feet of great ponds, rivers and saltwater, 250 feet of the upland edge of coastal and certain freshwater wetlands, and 75 feet of streams. In unorganized and deorganized areas the Land Use Planning Commission is the planning and zoning authority. How each town applies these to a group's housing was not read.",
      "source": "30-A MRS 4401(4); 38 MRS 435; Maine Land Use Planning Commission, About us",
      "sourceUrl": "https://legislature.maine.gov/statutes/30-A/title30-Asec4401.html"
    },
    "collectiveForms": [
      {
        "kind": "land_trust",
        "name": "Conservation easement held by a land trust or governmental body",
        "summary": "A conservation easement may be held by a governmental body or by a nonprofit corporation or charitable trust whose purposes or powers include protecting natural, scenic or open-space values or keeping land available for agricultural, forest, recreational or open-space use. It limits development and use; it does not create shared ownership.",
        "source": "33 MRS 476 (Conservation easements, definitions)",
        "sourceUrl": "https://legislature.maine.gov/statutes/33/title33sec476.html"
      }
    ],
    "firstClaim": [
      "No statutory pre-emption right on ordinary land was found in the sources opened.",
      "Passamaquoddy Indian territory is defined in state law: the Passamaquoddy Indian Reservation and land acquired for the Tribe's benefit, including parcels in Centerville, in Albany Township, in T.19 M.D.B.P.P., and up to 100 acres in Calais (30 MRS 6205). Land held for a Nation is not a parcel to treat as on the market without asking the Nation.",
      "A process norm, not law: Dawnland Return's published order of priority for land returns puts requests from Chiefs and Tribal councils first, then the Wabanaki Commission on Land and Stewardship, then Wabanaki nonprofits, then the First Light community, then the general public, and all potential returns go to the Wabanaki Commission for their direction."
    ],
    "steps": [
      {
        "what": "Listen before looking at land. The county lies in Dawnland, the Wabanaki homeland. Dawnland Return describes how land returns are directed by the Wabanaki Commission on Land and Stewardship, with a stated order of priority that puts Chiefs and Tribal councils first; 11 projects, over 50,000 acres in all, are named statewide, and no page opened breaks the figure down by county. A parcel held for return, or under negotiation, cannot be identified from outside: ask before treating any parcel as available.",
        "who": "The Nations' governments (Passamaquoddy at Sipayik and Motahkomikuk, Penobscot Nation, Houlton Band of Maliseet Indians, Mi'kmaq Nation); the Wabanaki Commission on Land and Stewardship",
        "source": "Dawnland Return, Return (First Light)",
        "sourceUrl": "https://dawnlandreturn.org/first-light/lets-work-together/return",
        "n": 1
      },
      {
        "what": "Understand the legal frame in which the Nations stand: the Maine Indian Claims Settlement Act and the Maine Implementing Act required the Wabanaki Nations to give up their claim to dispossessed lands in exchange for a federally funded pathway to buy back 2.5 percent of the 12 million acres lost; the Wabanaki Alliance reports that they are widely regarded as a failure, and tribal-state law is being reworked now. State law applies to Indian lands except as the Act provides.",
        "who": "The Wabanaki Nations; the Maine Legislature",
        "source": "Wabanaki Alliance, Understanding Tribal Sovereignty; 30 MRS 6204",
        "sourceUrl": "https://wabanakialliance.com/sovereignty/",
        "n": 2
      },
      {
        "what": "If a group would divide land or place several dwellings, ask the town's planning board whether it is a subdivision (3 or more lots in 5 years, or 5 or more dwelling units on a tract), and whether any of the land is in a shoreland area; in unorganized townships ask the Land Use Planning Commission.",
        "who": "Town planning board and code officer; Maine Land Use Planning Commission",
        "source": "30-A MRS 4401(4); 38 MRS 435; Maine Land Use Planning Commission, About us",
        "sourceUrl": "https://legislature.maine.gov/statutes/30-A/title30-Asec4401.html",
        "n": 3
      },
      {
        "what": "If the aim is farming or woodland, ask the town assessor about current-use programmes: Farm and Open Space (at least 5 contiguous acres with a stated gross annual farm income), Tree Growth, and Working Waterfront; withdrawal penalties were not read.",
        "who": "Town assessor",
        "source": "36 MRS 1102; 36 MRS 573; 36 MRS 1132",
        "sourceUrl": "https://legislature.maine.gov/statutes/36/title36sec1102.html",
        "n": 4
      },
      {
        "what": "Consider a conservation easement held by a land trust or governmental body where the aim is to keep land in farming or open space.",
        "who": "A land trust or governmental body",
        "source": "33 MRS 476",
        "sourceUrl": "https://legislature.maine.gov/statutes/33/title33sec476.html",
        "n": 5
      }
    ],
    "ruledOut": [
      "Splitting land to sell it off is not outside review: dividing a tract into 3 or more lots within any 5-year period is a subdivision whether done by sale, lease, development, buildings or otherwise (30-A MRS 4401(4)).",
      "Shoreland areas are not freely buildable: mandatory zoning and land-use controls apply within 250 feet of great ponds, rivers and saltwater, within 250 feet of the upland edge of a coastal wetland, and within 75 feet of a stream (38 MRS 435).",
      "A purchase does not settle the question of whether the land should be sought at all: where a parcel is held for return to a Nation, or is under a Wabanaki-led return process, the honest answer is not there."
    ],
    "direction": "stable",
    "directionNote": "The purchase, subdivision and shoreland rules read are unchanged in the sources opened, but tribal-state law is in motion: in the 132nd Legislature LD 395 created a working group on extending federal beneficial laws to the Wabanaki Nations, which must report to legislators by 2 December 2026, and LD 785 was amended considerably in committee. The 133rd Legislature begins in January 2027.",
    "gaps": [
      "No Maine statute on collective ownership of land by groups (tenancy in common, nonprofit and cooperative forms) was opened, so only conservation easements are described.",
      "Municipal zoning in the towns of Washington County and the Land Use Planning Commission's district rules were not read; only the statutory definitions were.",
      "No statutory pre-emption right was identified; the Dawnland Return order of priority is a process norm of a Wabanaki-centred initiative, not law.",
      "Which parcels are held for return, or under negotiation, cannot be identified from outside, and no county breakdown of the 50,000 acres was found; the acreage is statewide.",
      "The Maine Farmland Trust land-access loan programme is documented only in a 2016 article and was not opened here; it is not described as current.",
      "Whether a 2026 Maine bill on foreign ownership of land exists was not checked; the statute pages were read as published.",
      "Current-use withdrawal penalties (Farm and Open Space, Tree Growth, Working Waterfront) were not read.",
      "Whether holding land carries any right to a residence permit was not opened."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "driftless": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open_with_conditions",
      "summary": "Wisconsin allows foreign buyers but caps holdings: under Wis. Stat. 710.02 a non-resident alien, a corporation not created under US law, or an entity or trust with more than 20 percent foreign ownership may not hold an interest in more than 640 acres of Wisconsin land (agricultural or not). Excess land must be divested within four years or it is forfeited to the state, and AFIDA filers must send a duplicate to the state agriculture department. Assembly Bill 218 (2025-26) would cut the cap to 50 acres; it is a proposal, not law, in the sources opened.",
      "source": "State Bar of Wisconsin, Wisconsin Lawyer, Oct 2025, Corporate & Foreign Ownership of Agricultural Land in Wisconsin",
      "sourceUrl": "https://www.wisbar.org/NewsPublications/WisconsinLawyer/Pages/Article.aspx?Volume=98&Issue=9&ArticleID=31246"
    },
    "residency": {
      "link": "no_link",
      "summary": "The statute caps what non-resident aliens and foreign-owned entities may hold rather than requiring residency to buy; the Wisconsin Lawyer article describes the acreage cap and its exceptions (inheritance, treaty rights, railroad and pipeline corporations) and does not describe any residency route created by buying land.",
      "source": "State Bar of Wisconsin, Wisconsin Lawyer, Oct 2025",
      "sourceUrl": "https://www.wisbar.org/NewsPublications/WisconsinLawyer/Pages/Article.aspx?Volume=98&Issue=9&ArticleID=31246"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "Zoning is local. Wisconsin's Farmland Preservation Program lets counties adopt farmland preservation plans and local governments adopt farmland preservation zoning districts, and landowners who claim the income tax credit must meet soil and water conservation standards. Whether a Driftless town or county allows several dwellings on one parcel has to be asked of that town or county.",
      "source": "Wisconsin Department of Agriculture, Trade and Consumer Protection, Farmland Preservation Program (Wis. Stat. ch. 91)",
      "sourceUrl": "https://datcp.wi.gov/Pages/Programs_Services/FarmlandPreservation.aspx"
    },
    "collectiveForms": [
      {
        "kind": "company",
        "name": "Limited liability company or other entity",
        "summary": "The state bar's article notes that Wisconsin's Corporate Farming Statute restricts corporations and trusts owning land for listed farming operations unless they have no more than 15 shareholders or beneficiaries, no more than two classes of shares and only natural persons as holders, and that whether it reaches LLCs has not been decided by Wisconsin courts. An entity with more than 20 percent foreign ownership counts as foreign for the acreage cap.",
        "source": "State Bar of Wisconsin, Wisconsin Lawyer, Oct 2025 (Corporate Farming Statute; Foreign Ownership Statute)",
        "sourceUrl": "https://www.wisbar.org/NewsPublications/WisconsinLawyer/Pages/Article.aspx?Volume=98&Issue=9&ArticleID=31246"
      }
    ],
    "firstClaim": [
      "No statutory pre-emption or first-refusal holder over private rural land was identified in the sources opened. For foreign-held land, the state attorney general enforces the acreage cap and the state agriculture department receives duplicate AFIDA reports."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Work out who will hold title and how much of the holder is foreign: the 640-acre cap applies to non-resident aliens, non-US corporations, and entities or trusts with more than 20 percent foreign ownership or benefit, counted across all Wisconsin land they hold.",
        "who": "Wisconsin real estate attorney (professional adviser); enforcement sits with the state attorney general",
        "source": "State Bar of Wisconsin, Wisconsin Lawyer, Oct 2025 (acreage limitation; enforcement and divestment)",
        "sourceUrl": "https://www.wisbar.org/NewsPublications/WisconsinLawyer/Pages/Article.aspx?Volume=98&Issue=9&ArticleID=31246"
      },
      {
        "n": 2,
        "what": "If a foreign person will hold a significant interest in agricultural land, file the federal AFIDA report and send a duplicate original to the state department of agriculture, with a statement of any exception relied on.",
        "who": "USDA Farm Service Agency (federal) and Wisconsin Department of Agriculture, Trade and Consumer Protection",
        "source": "USDA FSA AFIDA page; State Bar of Wisconsin article (reporting requirements)",
        "sourceUrl": "https://www.fsa.usda.gov/resources/economic-policy-analysis/afida"
      },
      {
        "n": 3,
        "what": "Ask the town and county what their zoning allows on the parcel and whether it sits in a farmland preservation zoning district or carries a farmland preservation agreement.",
        "who": "Town and county zoning offices",
        "source": "Wisconsin DATCP, Farmland Preservation Program (planning, zoning districts, agreements, tax credits)",
        "sourceUrl": "https://datcp.wi.gov/Pages/Programs_Services/FarmlandPreservation.aspx"
      },
      {
        "n": 4,
        "what": "If the land is wooded, ask whether it is enrolled in the Managed Forest Law: a new owner must file a Transfer of Ownership form within 30 days or risk withdrawal from the programme and a withdrawal tax and fee.",
        "who": "Wisconsin Department of Natural Resources (forestry)",
        "source": "Wisconsin DNR, Managed Forest Law (change of ownership)",
        "sourceUrl": "https://dnr.wisconsin.gov/topic/forestlandowners/mfl",
        "duration": {
          "text": "The new owner is required to complete and send the Transfer of Ownership form within 30 days of the change of ownership.",
          "source": "Wisconsin DNR, Managed Forest Law (change of ownership)",
          "sourceUrl": "https://dnr.wisconsin.gov/topic/forestlandowners/mfl"
        }
      },
      {
        "n": 5,
        "what": "If a corporation or trust will own farmland, check the Corporate Farming Statute (Wis. Stat. 182.001) before closing: it restricts corporations and trusts from owning land for listed farming operations unless they meet the small-holder tests.",
        "who": "Wisconsin real estate attorney (professional adviser)",
        "source": "State Bar of Wisconsin, Wisconsin Lawyer, Oct 2025 (Corporate Farming Statute)",
        "sourceUrl": "https://www.wisbar.org/NewsPublications/WisconsinLawyer/Pages/Article.aspx?Volume=98&Issue=9&ArticleID=31246"
      }
    ],
    "ruledOut": [
      "A foreign landowner cannot hold more than 640 acres of Wisconsin land; the excess must be divested within four years of acquisition, after which it is forfeited to the state.",
      "A corporation or trust that does not meet the small-holder tests cannot own land for the prohibited farming operations listed in Wis. Stat. 182.001, which include dairy, cattle, hogs, sheep, hay, pasture and several grain crops."
    ],
    "direction": "tightening",
    "directionNote": "Assembly Bill 218 (2025-26 session) would reduce the foreign cap from 640 to 50 acres, broaden who counts as foreign and cut the divestiture period from four years to three; the October 2025 article describes it as a proposal. Its final status was not confirmed, so the 640-acre rule is the one stated as current.",
    "gaps": [
      "The Wisconsin Legislature's site does not resolve from this sandbox, so the text of Wis. Stat. 710.02, 182.001 and chapter 91 was read through the State Bar's October 2025 article and the state agriculture department page, not from the statute itself.",
      "Whether Assembly Bill 218 passed the Senate or was signed before the 2026 session closed was not confirmed from a primary source; the National Agricultural Law Center's June 2026 FAQ lists Wisconsin among states with a foreign-ownership law but does not list it among the states that amended in 2025.",
      "The dossier states that cooperatives and nonprofit land trusts are explicit carve-outs from the Corporate Farming Statute; the article opened does not say so, so it is not carried.",
      "How each Driftless county or town zones rural land for multi-household communities was not sourced.",
      "Use-value assessment of farmland (Wis. Stat. 70.32) and Wisconsin cooperative or land-trust forms were not opened as primary text and are not listed as legal forms."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "estonia-rural": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open_with_conditions",
      "summary": "Citizens of Estonia, of any EEA state and of any OECD member state may acquire land containing agricultural or forest land without restriction. A legal person seated in one of those states may do so freely below ten hectares; for ten hectares or more it needs three years of farming (or forestry) activity before the transaction, or the authorisation of the local-government council. Citizens of other states need the council's authorisation, and persons outside the EEA and the United Kingdom are barred from certain defence areas. A transaction that breaks these restrictions is void.",
      "source": "Restrictions on Acquisition of Immovables Act (KAOKS), English consolidated text in force from 01.01.2024, §§ 3-5 and 10 (Riigi Teataja)",
      "sourceUrl": "https://www.riigiteataja.ee/en/akt/527122023007"
    },
    "residency": {
      "link": "residency_required",
      "summary": "Only for citizens of third countries (neither EEA nor OECD): they may acquire agricultural or forest land only with the council's authorisation, and only if they have lived permanently in Estonia for at least six months before applying or have worked in Estonia for a year as a sole proprietor in farming or forestry. Citizens of EEA and OECD states face no residence condition.",
      "source": "Restrictions on Acquisition of Immovables Act (KAOKS) § 5(1)-(2)",
      "sourceUrl": "https://www.riigiteataja.ee/en/akt/527122023007"
    },
    "zoning": {
      "route": "unknown",
      "summary": "The Estonian planning and building rules for dwellings on rural land (general and detailed plans of the municipality) were not opened for this entry, so no route is described. The land-acquisition act opened here governs who may buy, not whether a dwelling can be built.",
      "source": "Restrictions on Acquisition of Immovables Act (KAOKS) § 1 and § 6(4)",
      "sourceUrl": "https://www.riigiteataja.ee/en/akt/527122023007"
    },
    "collectiveForms": [],
    "firstClaim": [
      "No statutory pre-emption holder on sales of rural land was identified in the sources opened."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Check whether the immovable lies in a national-defence area where persons who are not citizens or seated companies of the EEA or the United Kingdom may not acquire immovables (the sea islands other than Saaremaa, Hiiumaa, Muhu and Vormsi, and listed municipalities in Ida-Virumaa, Tartumaa, Põlvamaa and Võrumaa, within their boundaries as at 31 December 1999).",
        "who": "Land register and the local government; the Government of the Republic can authorise exceptions by order",
        "source": "KAOKS § 10(1)-(2)",
        "sourceUrl": "https://www.riigiteataja.ee/en/akt/527122023007"
      },
      {
        "n": 2,
        "what": "Establish which category the buyer falls in: citizen of an EEA or OECD state, legal person seated there (free below ten hectares), or third-country citizen or company (council authorisation).",
        "who": "Notary or local government verifying compliance at transfer",
        "source": "KAOKS §§ 4, 5 and 9",
        "sourceUrl": "https://www.riigiteataja.ee/en/akt/527122023007"
      },
      {
        "n": 3,
        "what": "Where authorisation is needed, file the standard application and an activity plan covering at least five years, with documents showing adequate financial means, at the local government.",
        "who": "Local government (rural municipality or city) of the location of the immovable",
        "source": "KAOKS §§ 6 and 7",
        "sourceUrl": "https://www.riigiteataja.ee/en/akt/527122023007",
        "duration": {
          "text": "The council decides within 45 days after the application is submitted to the local government",
          "source": "KAOKS § 7(5)",
          "sourceUrl": "https://www.riigiteataja.ee/en/akt/527122023007"
        }
      },
      {
        "n": 4,
        "what": "At transfer, supply the proof the law requires: a certificate from the home state for a foreign legal person, or a Tax and Customs Board certificate of farming or forestry activity where the rules turn on it.",
        "who": "Notary, enforcement agent, trustee in bankruptcy or local government",
        "source": "KAOKS § 9(1)-(3)",
        "sourceUrl": "https://www.riigiteataja.ee/en/akt/527122023007"
      }
    ],
    "ruledOut": [
      "A transaction that violates the restrictions of the act is void, and the local government can ask for correction of the land register and go to court (KAOKS § 3).",
      "Natural persons who are not citizens of an EEA state or the United Kingdom, and legal persons seated outside them, are prohibited from acquiring immovables in the defence areas of § 10(1) unless the Government authorises it."
    ],
    "direction": "unknown",
    "directionNote": "The English consolidated text opened has been in force since 1 January 2024. A January 2026 draft reported in research to bar Russian and Belarusian nationals from buying property was not opened, and no enacted change was verified, so no direction is asserted.",
    "gaps": [
      "The reported January 2026 draft (Interior Ministry) on Russian and Belarusian buyers was not opened; it is treated as a draft only and no rule is taken from it.",
      "Whether the Estonian-language original has been amended after the English translation of 27 December 2023 was not checked beyond the 'currently in force' status on the page.",
      "The dossier's route through a newly formed Estonian company is not described: the act opened shows a company seated in a Contracting State is free only below ten hectares, and the claim that authorities scrutinise that route more closely since 2022 has no opened source.",
      "Legal forms for groups (OÜ, MTÜ, tulundusühistu, SA) were not opened and are not listed.",
      "Planning and building rules for dwellings, residence permits for persons from outside the EEA and e-Residency's lack of any land-purchase privilege were not opened as primary sources.",
      "Whether the area of the Setomaa parish is covered by the defence-area list was not confirmed: the act names municipalities as at 31 December 1999 (Mikitamäe, Värska, Meremäe, Misso and others), not the present parish."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "finger-lakes": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "New York places no nationality bar on holding real property: noncitizens are empowered to take, hold, transmit and dispose of real property within the state in the same manner as native-born citizens (Real Property Law 10). No 2025-26 state bill was checked.",
      "source": "New York Real Property Law section 10 (Capacity to hold real property)",
      "sourceUrl": "https://www.nysenate.gov/legislation/laws/RPP/10"
    },
    "residency": {
      "link": "no_link",
      "summary": "Nothing in Real Property Law 10 makes residence a condition of holding land. Whether holding land carries any right to a residence permit was not opened.",
      "source": "New York Real Property Law section 10",
      "sourceUrl": "https://www.nysenate.gov/legislation/laws/RPP/10"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "Zoning is local and was not surveyed town by town. Two state enabling routes were read. Cluster development (Town Law 278) works only where the town board has authorised the planning board to approve it by local law, and the number of lots or dwelling units may not exceed what standard zoning would allow; its purpose is to preserve the natural and scenic qualities of open land. Incentive zoning (Town Law 261-b) lets a town board grant bonuses on condition of community benefits such as open space or housing for low- and moderate-income people. In agricultural districts local governments shall not unreasonably restrict farm operations unless public health or safety is threatened (Agriculture and Markets Law 305-a).",
      "source": "New York Town Law 278 and 261-b; Agriculture and Markets Law 305-a",
      "sourceUrl": "https://www.nysenate.gov/legislation/laws/TWN/278"
    },
    "collectiveForms": [
      {
        "kind": "other",
        "name": "Cohousing neighbourhood (EcoVillage at Ithaca)",
        "summary": "EcoVillage at Ithaca is three cohousing neighbourhoods (FROG, SONG and TREE) built in sequence over nearly twenty years; each is described by the community as a cohousing cooperative. Anyone intending to live there for more than 30 consecutive days must complete its membership process, and all rentals and sales are arranged directly with the particular lessee or seller. The legal form of the neighbourhoods was not verified.",
        "source": "EcoVillage at Ithaca, Neighborhoods; Rentals & Sales; Becoming a Resident",
        "sourceUrl": "https://ecovillageithaca.org/about/living-here/"
      },
      {
        "kind": "land_trust",
        "name": "Conservation easement held by a land trust",
        "summary": "New York defines a conservation easement as an easement, covenant or restriction that limits development, management or use of land to preserve its scenic, open, historic, archaeological, architectural or natural condition, and names the bodies that act under it: not-for-profit conservation organisations with 501(c)(3) status and public bodies, including soil and water conservation districts. It limits what can be done with land; it does not create shared ownership. The Finger Lakes Land Trust says it has conserved more than 35,000 acres.",
        "source": "Environmental Conservation Law 49-0303; Finger Lakes Land Trust",
        "sourceUrl": "https://www.nysenate.gov/legislation/laws/ENV/49-0303"
      }
    ],
    "firstClaim": [
      "No statutory pre-emption holder on ordinary rural parcels was found in the sources opened.",
      "The Nonintercourse Act of 1790 'bars sales of tribal land without the acquiescence of the Federal Government' (quoted in Cayuga Indian Nation v. Pataki, 413 F.3d 266, citing City of Sherrill v. Oneida Indian Nation).",
      "The Cayuga Nation's land claim, filed in 1980 for 64,015 acres, failed in court: the Second Circuit, applying Sherrill, held the possessory claim barred by laches and entered judgment for the defendants in 2005. The Nation's own account is that it was landless for over 200 years and has since bought back ancestral land at market prices, with purchases listed in most years since 2003; quote that as the Nation's account, not as a legal conclusion."
    ],
    "steps": [
      {
        "what": "Start with whose land it is. The Cayuga Nation's own history page says New York's 1795 and 1805 agreements took its ancestral land in violation of the 1794 Treaty of Canandaigua and the Trade and Intercourse Act, that it filed a claim in 1980 for 64,015 acres around Cayuga Lake that the courts dismissed as time-barred, and that it continues to buy back its ancestral lands at market prices. That is one council's account and no other Cayuga source was opened; read with Land standing, the northern end of Cayuga Lake is not there for a market bid, and any approach begins by listening to what the Cayuga, Onondaga and Seneca nations say in their own words.",
        "who": "The Cayuga Nation; the Haudenosaunee Confederacy nations",
        "source": "Cayuga Nation, History and Culture (quoted as the Nation's own account)",
        "sourceUrl": "https://cayuganation-nsn.gov/history-culture/",
        "n": 1
      },
      {
        "what": "Come through a community's own membership process, not the housing market. EcoVillage at Ithaca asks anyone who intends to live there more than 30 days to complete its membership process: learn about the community, complete the prospective resident package, make a self-arranged 3 to 5 day visit with an official tour, and contact its membership committee. Completing the process does not commit anyone to live there; it makes you eligible to rent or buy there.",
        "who": "EcoVillage at Ithaca, membership committee",
        "source": "EcoVillage at Ithaca, Becoming a Resident",
        "sourceUrl": "https://ecovillageithaca.org/about/living-here/",
        "duration": {
          "text": "A self-arranged visit of 3 to 5 days is part of the membership process",
          "source": "EcoVillage at Ithaca, Becoming a Resident",
          "sourceUrl": "https://ecovillageithaca.org/about/living-here/"
        },
        "n": 2
      },
      {
        "what": "If farming is the aim, start with the farm-training and land-access programmes. Groundswell's Incubator Farm gives beginning farmers a quarter-acre plot, facilities, training and guidance on land leased from EcoVillage (applications for the 2026 programme are closed and an interest form is open for 2027); its land-access work, with American Farmland Trust's Farmland for a New Generation New York programme, helps beginning farmers and landowners connect.",
        "who": "Groundswell Center for Local Food and Farming",
        "source": "Groundswell Center, The Incubator Farm; Land Access for Farmers",
        "sourceUrl": "https://groundswellcenter.org/the-incubator-farm/",
        "n": 3
      },
      {
        "what": "Before committing to any parcel, ask the town's planning board what its zoning permits, whether the town has authorised cluster development or incentive zoning, and whether the land is in an agricultural district.",
        "who": "Town planning board; town board",
        "source": "Town Law 278 and 261-b; Agriculture and Markets Law 305-a",
        "sourceUrl": "https://www.nysenate.gov/legislation/laws/TWN/278",
        "n": 4
      }
    ],
    "ruledOut": [
      "Towns cannot use planning and zoning to unreasonably restrict farm operations within agricultural districts unless public health or safety is threatened, so a new neighbour cannot expect the town to curb ordinary farm operations (Agriculture and Markets Law 305-a).",
      "A cluster development cannot exceed the number of lots or dwelling units that standard zoning would allow on the land (Town Law 278(3)(b)).",
      "The Nonintercourse Act bars sales of tribal land without the acquiescence of the federal government (as quoted in Cayuga Indian Nation v. Pataki), so land held by a Nation is not an ordinary parcel."
    ],
    "direction": "stable",
    "directionNote": "No change was found in the statutes opened (Real Property Law 10, Town Law 278 and 261-b, Agriculture and Markets Law 25-AA). 2025-26 legislative activity was not checked.",
    "gaps": [
      "Per-town zoning in the five counties (Cayuga, Seneca, Tompkins, Yates and Schuyler) was not surveyed: whether each town has authorised cluster development or incentive zoning is a per-town question.",
      "The legal form of the EcoVillage neighbourhoods (condominium, cooperative or other) was not verified.",
      "The treaty text (Treaty of Canandaigua, 1794) could not be opened from the usual repository, so it is cited only through the Nation's account and the Second Circuit opinion.",
      "Certiorari history in Cayuga Indian Nation v. Pataki was not verified, and the Nation's page and the court opinion differ on dates (the Nation says 1805 and a 2001 dismissal; the Second Circuit opinion refers to the 1795 and 1807 treaties and a 2005 judgment); they are quoted separately and not reconciled.",
      "The Nation's internal governance is not described; the entry cites the Nation's own pages and takes no side.",
      "Groundswell's programme dates and openings change each season and were read on 2026-10-05 only.",
      "Whether holding land carries any right to a residence permit was not opened."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "galicia": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "Foreigners enjoy the same civil rights as Spaniards except where special laws or treaties say otherwise (Civil Code art. 27); no nationality bar on rural land was found in the sources opened. One special law, Ley 8/1975, creates defence zones in which foreign-held property is capped (at 15% of a zone's surface) and access is restricted, so a parcel near coast or frontier needs checking.",
      "source": "Código Civil art. 27 (BOE consolidated); Ley 8/1975 de zonas e instalaciones de interés para la Defensa Nacional, chapter III (BOE consolidated)",
      "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763"
    },
    "residency": {
      "link": "separate_route",
      "summary": "Buying land does not carry a residence permit in the sources opened. Ley Orgánica 1/2025 emptied articles 63-67 of Ley 14/2013, which provided the investor visa for acquiring real estate; applications filed before the change are still processed under the old rules and existing visas keep their validity. Which other residence routes suit a land-based household was not opened here.",
      "source": "Ley Orgánica 1/2025, de 2 de enero, disposición final vigesimoprimera (BOE)",
      "sourceUrl": "https://www.boe.es/eli/es/lo/2025/01/02/1"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "In Galician rural land (suelo rústico) the list of admissible uses is closed, and residential use is admitted only when tied to an agricultural or livestock holding; such constructions need authorisation from the regional urbanism body before the municipal licence. Land classed as rustic land of special protection (agricultural or forestal, including montes vecinales en mano común) also needs the favourable report of the sector authority.",
      "source": "Ley 2/2016, de 10 de febrero, del suelo de Galicia, arts. 34-36 and 38 (BOE consolidated)",
      "sourceUrl": "https://www.boe.es/eli/es-ga/l/2016/02/10/2"
    },
    "collectiveForms": [
      {
        "kind": "commons",
        "name": "Comunidade de montes vecinales en man común",
        "summary": "Commons owned collectively by the households that keep an open house and habitual residence in the settlements the monte has traditionally served; the land is indivisible and inalienable, so it cannot be bought, and each comunidade's statutes set the admission of new members. It can be leased or temporarily ceded.",
        "source": "Ley 13/1989 de montes vecinales en mano común, arts. 2, 3, 5 and 16 (BOE consolidated)",
        "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-1990-3358"
      },
      {
        "kind": "cooperative",
        "name": "Cooperativa",
        "summary": "Galician co-operatives have their own regional statute.",
        "source": "Ley 5/1998 de Cooperativas de Galicia (BOE consolidated)",
        "sourceUrl": "https://www.boe.es/eli/es-ga/l/1998/12/18/5"
      }
    ],
    "firstClaim": [
      "Owners of adjoining rustic parcels hold a legal right of retraction (retracto de colindantes) when a rustic parcel of up to one hectare is sold, unless the parcels are separated by streams, ditches, tracks or similar (Civil Code art. 1523); it must be exercised within nine days of registration (art. 1524)."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Establish who holds title and whether the target land is a monte vecinal en man común, which is inalienable and cannot be bought.",
        "who": "Land registry and the comunidade de montes concerned",
        "source": "Ley 13/1989 arts. 2 and 3",
        "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-1990-3358"
      },
      {
        "n": 2,
        "what": "Where the land is a monte vecinal, approach the comunidade about a lease or temporary cession and about admission under its own statutes.",
        "who": "Comunidade de montes (its general assembly); Banco de Terras de Galicia for leases",
        "source": "Ley 13/1989 arts. 5 and 16",
        "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-1990-3358",
        "duration": {
          "text": "Leases of a monte vecinal are limited to eleven years, and to thirty years when made through the Banco de Terras de Galicia",
          "source": "Ley 13/1989 art. 5(2)",
          "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-1990-3358"
        }
      },
      {
        "n": 3,
        "what": "For agricultural or forest land that has lost its users, use the Banco de Terras de Galicia, the public intermediary between land owners and people who want to farm the land, for leases, cessions, exchanges or sales.",
        "who": "Banco de Terras de Galicia (Agencia Gallega de Desarrollo Rural)",
        "source": "Ley 11/2021 de recuperación de la tierra agraria de Galicia, art. 14",
        "sourceUrl": "https://www.boe.es/eli/es-ga/l/2021/05/14/11"
      },
      {
        "n": 4,
        "what": "For a private parcel, check the registered title and whether neighbouring owners hold a retracto right if the parcel is one hectare or less.",
        "who": "Registro de la Propiedad; owners of adjoining parcels",
        "source": "Código Civil arts. 1523-1524",
        "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763",
        "duration": {
          "text": "The retracto must be exercised within nine days of registration of the sale",
          "source": "Código Civil art. 1524",
          "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763"
        }
      },
      {
        "n": 5,
        "what": "Check the municipal plan's classification of the parcel and apply for the licence; a residence tied to a holding in rustic land needs regional authorisation after a public-information period at the town hall.",
        "who": "Concello (ayuntamiento) and the regional urbanism body of the Xunta",
        "source": "Ley 2/2016 arts. 35, 36 and 38",
        "sourceUrl": "https://www.boe.es/eli/es-ga/l/2016/02/10/2",
        "duration": {
          "text": "The town hall holds the file open to public information for one month; if it has not forwarded the file within two months, the applicant can ask the regional body to take over",
          "source": "Ley 2/2016 art. 38(b) and (d)",
          "sourceUrl": "https://www.boe.es/eli/es-ga/l/2016/02/10/2"
        }
      }
    ],
    "ruledOut": [
      "Land of a monte vecinal en man común cannot be sold: it is inalienable and indivisible (Ley 13/1989 art. 2).",
      "In rustic land any use not on the admissible list is prohibited, so ownership of a rustic parcel does not carry a right to build a house (Ley 2/2016 art. 35(2))."
    ],
    "direction": "stable",
    "directionNote": "No change to the ownership or commons rules was found; Ley 11/2021 (2021) added the Banco de Terras and land-mobilisation tools, and the investor visa for real-estate purchase was removed by Ley Orgánica 1/2025.",
    "gaps": [
      "Repopulation or aldea-reactivation schemes of the Xunta were not opened and are not described.",
      "Which defence zones under Ley 8/1975 (and their regulation) cover parcels in A Coruña, Lugo, Ourense or Pontevedra was not checked parcel by parcel.",
      "Municipal plans (PXOM) were not read, so the rural-core (núcleo rural) rules that can allow houses in existing villages are not described.",
      "Residence routes other than the removed investor visa (non-lucrative, digital-nomad) were not opened.",
      "The dossier's 12-24 months for clean-title assembly is a practitioner estimate without an opened source and is left out."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "kootenays": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "A February 2024 analysis by a Canadian law firm reports no provincial restriction on foreign ownership of agricultural land in British Columbia (unlike Alberta, Saskatchewan and Manitoba, which cap non-resident holdings). The federal ban on non-Canadians buying residential property reaches only property inside census metropolitan areas and census agglomerations; a property outside them is a prescribed exclusion in the federal regulations.",
      "source": "Blakes, Securing Canada's Harvest (14 Feb 2024); Prohibition on the Purchase of Residential Property by Non-Canadians Regulations (SOR/2022-250), s. 3",
      "sourceUrl": "https://www.blakes.com/insights/securing-canada-s-harvest-regulations-on-foreign-ownership-of-agricultural-land/"
    },
    "residency": {
      "link": "no_link",
      "summary": "The sources opened show no residency requirement for buying land in British Columbia. Land purchase does not by itself carry an immigration status, which is outside these sources.",
      "source": "Blakes, Securing Canada's Harvest (14 Feb 2024)",
      "sourceUrl": "https://www.blakes.com/insights/securing-canada-s-harvest-regulations-on-foreign-ownership-of-agricultural-land/"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "Much rural land is in the Agricultural Land Reserve (ALR). On ALR land the Agricultural Land Commission Act allows no more than one residence per parcel with a principal residence of 500 square metres or less; a secondary suite is allowed only inside the principal residence, and one additional detached residence is allowed as of right in set cases (up to 90 square metres on parcels of 40 hectares or less). More residences, or larger ones, need Commission approval, and local or First Nation zoning and laws can restrict further.",
      "source": "Agricultural Land Commission Act s. 20.1; ALR Use Regulation ss. 31 and 34.3; Commission page Housing in the ALR",
      "sourceUrl": "https://www.alc.gov.bc.ca/use-of-alr-land/housing-in-the-alr/"
    },
    "collectiveForms": [
      {
        "kind": "association",
        "name": "Society (Societies Act)",
        "summary": "British Columbia's Societies Act provides the statutory form for non-profit societies, with no share capital and restrictions on distributions to members.",
        "source": "Societies Act, SBC 2015, c. 18 (current to 22 Sep 2026)",
        "sourceUrl": "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/15018_01"
      },
      {
        "kind": "cooperative",
        "name": "Cooperative association (Cooperative Association Act)",
        "summary": "The Cooperative Association Act provides for incorporating cooperative associations on a cooperative basis, with patronage returns.",
        "source": "Cooperative Association Act, SBC 1999, c. 28 (current to 22 Sep 2026)",
        "sourceUrl": "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/99028_01"
      }
    ],
    "firstClaim": [
      "For land inside the Agricultural Land Reserve, the Agricultural Land Commission is the body whose permission is needed for non-adhering residential use, non-farm use and subdivision; local governments or First Nation governments may add their own limits."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Find out whether the parcel is inside the Agricultural Land Reserve before any offer, using the Commission's maps, and ask the regional district what its zoning allows on the parcel.",
        "who": "Agricultural Land Commission (ALR maps) and the regional district planning office",
        "source": "Agricultural Land Commission, Agricultural Land Reserve Maps",
        "sourceUrl": "https://www.alc.gov.bc.ca/alr-maps/"
      },
      {
        "n": 2,
        "what": "Count the homes you need against what ALR land allows without applying: one principal residence of up to 500 square metres, a secondary suite inside it, and in set cases one additional detached residence of up to 90 square metres on parcels of 40 hectares or less.",
        "who": "Agricultural Land Commission; local government or First Nation government for any further limits",
        "source": "Agricultural Land Commission, Housing in the ALR; ALR Use Regulation ss. 31 and 34.3",
        "sourceUrl": "https://www.alc.gov.bc.ca/use-of-alr-land/housing-in-the-alr/"
      },
      {
        "n": 3,
        "what": "For more residences than that, apply to the Commission for permission. The application is made through the Commission's portal to the local government first, which decides whether to forward it; the Commission then decides, weighing its purposes of preserving agricultural land and encouraging farming.",
        "who": "Local government (regional district) and the Agricultural Land Commission",
        "source": "Agricultural Land Commission, Application Process and What the Commission Considers",
        "sourceUrl": "https://www.alc.gov.bc.ca/application-and-notice-process/applications/application-process/",
        "duration": {
          "text": "The Commission says it will strive to acknowledge an application within 5 business days of receipt, to communicate most decisions within 60 business days of receipt and the majority within 90 business days; these targets do not count the local government stage, and the Commission has posted an advisory that staffing shortages may cause delays.",
          "source": "Agricultural Land Commission, Application Process (processing timeline targets)",
          "sourceUrl": "https://www.alc.gov.bc.ca/application-and-notice-process/applications/application-process/"
        }
      },
      {
        "n": 4,
        "what": "Check water before you commit: a person may not divert or use water from a stream or an aquifer without an authorization, with exceptions in the Act and regulations such as domestic use of unrecorded stream water and domestic groundwater use.",
        "who": "Province of British Columbia (water authorizations under the Water Sustainability Act)",
        "source": "Water Sustainability Act, SBC 2014, c. 15, s. 6",
        "sourceUrl": "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/14015"
      }
    ],
    "ruledOut": [
      "ALR land may have no more than one residence per parcel unless an additional-residence rule applies or the Commission gives permission; a detached dwelling cannot be used as a secondary suite, which must sit inside the principal residence.",
      "Local zoning does not override ALR rules: a use that local zoning allows can still need Commission approval, and a use the Commission allows can still be restricted by local zoning."
    ],
    "direction": "stable",
    "directionNote": "The additional-residence rules in the ALR Use Regulation date from 2021 and 2022 changes, and the Commission has posted a staffing-shortage advisory about application delays. The sources opened show no change in foreign-ownership rules for British Columbia.",
    "gaps": [
      "The dossier's '6 to 18 months' for an application to the Commission has no source and is not carried; the Commission's own published targets (60 and 90 business days from receipt, excluding the local government stage) are used instead and may not reflect real elapsed time.",
      "The federal foreign-buyer ban's end date (reported as 1 January 2027) was not shown on the Justice Laws pages opened; the Act's repeal is listed there as not yet in force.",
      "Which Kootenay towns fall inside a census metropolitan area or census agglomeration was not checked; a lawyer should confirm for the specific parcel.",
      "Regional district zoning for land outside the ALR and the process for subdividing ALR land were not read.",
      "Water licence priority and allocation in specific Kootenay watersheds were not covered; only the general licensing rule was read.",
      "The foreign-ownership statement rests on a 2024 law-firm article, not on a provincial statute check; it should be re-confirmed before reliance."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "millevaches": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "No nationality condition appears in the Code rural provisions opened (Safer pre-emption L143-1 and following, the agricultural land group L322-1, the farming group L323-1): pre-emption depends on the kind of land and the sale, not on the buyer's passport. No notarial statement on foreign buyers could be opened, so a notary should confirm.",
      "source": "Code rural et de la pêche maritime, L143-1, L322-1, L323-1 (consolidated text, codes.droit.org mirror of Légifrance, last update 2026-10-01)",
      "sourceUrl": "https://codes.droit.org/payloads/Code%20rural%20et%20de%20la%20p%C3%AAche%20maritime.xml"
    },
    "residency": {
      "link": "no_link",
      "summary": "Nothing in the provisions opened makes residence a condition of buying rural land. Whether buying carries any right to a residence permit was not opened.",
      "source": "Code rural et de la pêche maritime, L143-1 and following (consolidated text)",
      "sourceUrl": "https://codes.droit.org/payloads/Code%20rural%20et%20de%20la%20p%C3%AAche%20maritime.xml"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "Building is allowed under the local urbanism document. Where a commune has no local plan, no document in its place and no carte communale, constructions can be authorised only in the already urbanised parts of the commune. Local plans and equivalent documents must be compatible with the charter of the Parc naturel régional de Millevaches en Limousin, whose second charter has 124 signatory communes and runs to 2033. Which document applies is a commune-by-commune question.",
      "source": "Code de l'urbanisme L111-3; Code de l'environnement L333-1 (consolidated text, codes.droit.org); Parc de Millevaches, Le parc de Millevaches",
      "sourceUrl": "https://codes.droit.org/payloads/Code%20de%20l%27urbanisme.xml"
    },
    "collectiveForms": [
      {
        "kind": "company",
        "name": "Groupement foncier agricole (GFA)",
        "summary": "A civil company formed between natural persons to hold farmland together; the death, bankruptcy or liquidation of one partner does not end it.",
        "source": "Code rural et de la pêche maritime L322-1",
        "sourceUrl": "https://codes.droit.org/payloads/Code%20rural%20et%20de%20la%20p%C3%AAche%20maritime.xml"
      },
      {
        "kind": "company",
        "name": "Groupement agricole d'exploitation en commun (GAEC)",
        "summary": "A civil company of persons formed between adult natural persons for farming in common.",
        "source": "Code rural et de la pêche maritime L323-1",
        "sourceUrl": "https://codes.droit.org/payloads/Code%20rural%20et%20de%20la%20p%C3%AAche%20maritime.xml"
      },
      {
        "kind": "association",
        "name": "Terre de Liens (Limousin)",
        "summary": "The association buys farms with citizen savings so that farmers who do not wish to be, or cannot be, owners can settle, for organic farming projects, and says there are 8 Terre de Liens farms in Limousin. It also guides project holders and sellers through the Objectif Terres site. The figure is for the whole of Limousin, not the plateau.",
        "source": "Terre de Liens Limousin",
        "sourceUrl": "https://terredeliens.org/limousin/"
      },
      {
        "kind": "commons",
        "name": "Section de commune (hamlet commons)",
        "summary": "A part of a commune that holds property or rights of its own, as a public-law legal person; its members are the inhabitants with real and fixed domicile on its territory, the council and mayor manage it, and none can be created since the law of 27 May 2013. Its agricultural and pastoral land goes by lease or grazing agreement first to farmers domiciled and installed on the section. A newcomer joins its rules, not buys its land.",
        "source": "Code général des collectivités territoriales L2411-1, L2411-2 and L2411-10",
        "sourceUrl": "https://codes.droit.org/payloads/Code%20g%C3%A9n%C3%A9ral%20des%20collectivit%C3%A9s%20territoriales.xml"
      }
    ],
    "firstClaim": [
      "The Safer (the regional land-development and rural-establishment society) has a pre-emption right on sales of buildings for agricultural use and bare land of agricultural vocation, including, where there is no urbanism document, land in the not-yet-urbanised parts of the commune, woods and forests excluded; it buys in place of the buyer and resells to another person whose project fits local needs better (Code rural L143-1; Safer). Its conditions and minimum surface are fixed by decree for each Safer (L143-7); the Safer Nouvelle-Aquitaine serves Creuse, Corrèze and Haute-Vienne.",
      "Sales to relatives or in-laws to the fourth degree, to co-heirs, and between co-owners are exempt from Safer pre-emption (Code rural L143-4).",
      "On a sale of woodland of under 4 hectares, the owners of a contiguous wooded parcel hold a right of preference, and the commune holds a right of preference or, where it owns a contiguous parcel under a management document, a pre-emption right, with two months for the mayor to answer after notification; a sale made in breach of the owners' right is void (Code forestier L331-19 to L331-24).",
      "Farmland owned by a section de commune is let first to farmers with domicile, farm building and seat on the section, then to farmers of the commune (Code général des collectivités territoriales L2411-10)."
    ],
    "steps": [
      {
        "what": "Begin with the commune and the people already working the land, not a parcel. Faux-la-Montagne's own page says welcoming new residents is at the heart of its concerns, invites a would-be newcomer to bring an idea or project to the town hall, and promises to connect them with people, associations or bodies that can support it. Terre de Liens Limousin and the Objectif Terres platform guide project holders and sellers of farmland. The framework's own answer for a lone buyer of an isolated parcel with no local structure behind it is not there.",
        "who": "The commune (mairie); Terre de Liens Limousin; local associations",
        "source": "Faux-la-Montagne, Nouveaux arrivants; Terre de Liens Limousin",
        "sourceUrl": "https://fauxlamontagne.fr/nouveaux-arrivants/",
        "n": 1
      },
      {
        "what": "If farmland is in view, look at a lease before a purchase: Terre de Liens buys farms with citizen savings and leases them to farmers who cannot or do not wish to own, and Objectif Terres lists farms for lease and sale from Terre de Liens and its partners.",
        "who": "Terre de Liens Limousin; Objectif Terres",
        "source": "Terre de Liens Limousin",
        "sourceUrl": "https://terredeliens.org/limousin/",
        "n": 2
      },
      {
        "what": "Before an offer on farmland, buildings with agricultural use or non-urbanised land, expect the notary to inform the Safer, which can buy in place of the buyer and resell to another person; the surface above which it applies is set by decree for each Safer and was not looked up here.",
        "who": "Notary; Safer Nouvelle-Aquitaine (departmental services for Creuse, Corrèze and Haute-Vienne)",
        "source": "Safer, Le droit de préemption; Code rural L143-1, L143-4, L143-7, L143-8",
        "sourceUrl": "https://www.safer.fr/les-safer/le-droit-de-preemption/",
        "n": 3
      },
      {
        "what": "Ask the commune which urbanism document applies, since without one only the already urbanised parts of the commune are buildable, and check that a plan is compatible with the Parc charter.",
        "who": "Commune; intercommunality (for a PLUi)",
        "source": "Code de l'urbanisme L111-3; Code de l'environnement L333-1",
        "sourceUrl": "https://codes.droit.org/payloads/Code%20de%20l%27urbanisme.xml",
        "n": 4
      },
      {
        "what": "If woodland of under 4 hectares is part of the offer, expect notification to the owners of contiguous wooded parcels and to the mayor, who have two months to answer.",
        "who": "Seller, via the notary; owners of contiguous parcels; the mayor",
        "source": "Code forestier L331-19, L331-22 and L331-24",
        "sourceUrl": "https://codes.droit.org/payloads/Code%20forestier%20%28nouveau%29.xml",
        "duration": {
          "text": "The mayor has two months from notification to say whether the commune exercises its right",
          "source": "Code forestier L331-22 and L331-24",
          "sourceUrl": "https://codes.droit.org/payloads/Code%20forestier%20%28nouveau%29.xml"
        },
        "n": 5
      },
      {
        "what": "Ask the commune whether the land belongs to a section de commune: if so it is not the seller's to sell, and its farmland is let first to farmers installed there.",
        "who": "Commune (council and mayor manage sectional property)",
        "source": "Code général des collectivités territoriales L2411-1, L2411-2 and L2411-10",
        "sourceUrl": "https://codes.droit.org/payloads/Code%20g%C3%A9n%C3%A9ral%20des%20collectivit%C3%A9s%20territoriales.xml",
        "n": 6
      },
      {
        "what": "For a group that will farm together, choose the holding body before the deed: a GFA to hold land, a GAEC to farm in common, or a lease through Terre de Liens.",
        "who": "The founding group",
        "source": "Code rural L322-1 and L323-1",
        "sourceUrl": "https://codes.droit.org/payloads/Code%20rural%20et%20de%20la%20p%C3%AAche%20maritime.xml",
        "n": 7
      }
    ],
    "ruledOut": [
      "No new section de commune can be created since the law of 27 May 2013, and sectional property is held by the section, a public-law legal person, not by a private seller (Code général des collectivités territoriales L2411-1).",
      "A sale of woodland of under 4 hectares made without notifying the owners of contiguous wooded parcels is void, and an action can be brought for five years (Code forestier L331-20).",
      "A Safer can pre-empt a sale of agricultural land and resell it to another person; being the first buyer does not decide who ends up with the land (Code rural L143-1 and Safer)."
    ],
    "direction": "tightening",
    "directionNote": "Since the law of 23 December 2021 the Safer must be informed of transfers of shares in land-holding companies, and taking control of a company holding agricultural land above a regional significant-enlargement threshold needs the prefect's prior authorisation (Code rural L141-1-1, L333-2); the text of L141-1-1 was last amended on 19 August 2026.",
    "gaps": [
      "The surface threshold and conditions of Safer pre-emption for Nouvelle-Aquitaine are set by decree and were not opened; no threshold from another Safer (for example the Cévennes 0.7 hectares) is carried over.",
      "Légifrance returns HTTP 403 to every scripted request, so the consolidated codes were read through the codes.droit.org mirror (consolidated texts built from the Légifrance data; Code rural updated 2026-10-01, Code forestier 2026-08-20), not on Légifrance itself.",
      "Which of the 124 communes have a PLU, a PLUi or a carte communale was not checked in this run, so how much of the park is buildable under the national rule is unknown.",
      "Which communes still have sections de commune was not looked up; the Faux-la-Montagne sectional forest is the only case in the dossier.",
      "No notarial or official statement on foreign buyers could be opened; the open status rests on the absence of any nationality condition in the provisions read.",
      "The L'Arban housing cooperative named in the pre-selection could not be sourced and is left out.",
      "Whether buying carries any right to a residence permit was not opened."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "ne-missouri-se-iowa": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "restricted",
      "summary": "Two different regimes sit on either side of one state line. Iowa: a nonresident alien (anyone who is neither a US citizen nor a lawful permanent resident), a foreign business or a foreign government, or its agent, trustee or fiduciary, may not purchase or otherwise acquire agricultural land, with listed exceptions: devise or descent (divest within two years), security interests, debt collection (sell within two years), research, and up to 320 acres for an immediate or pending non-farming use, to be converted within five years. Missouri: no alien or foreign business may acquire agricultural land if total aggregate alien and foreign ownership of agricultural acreage in the state exceeds one percent of the state's agricultural acreage; a sale goes to the director of agriculture for review only if no completed IRS Form W-9 is signed by the purchaser. Missouri Executive Order 24-01 of 2 January 2024 adds pre-closing submission and bars buyers who are citizens, residents or entities of a foreign adversary within 10 miles of a staffed military facility.",
      "source": "Iowa Code 2026 ch. 9I, ss. 9I.1, 9I.3 and 9I.4; RSMo 442.571; Missouri Executive Order 24-01",
      "sourceUrl": "https://www.legis.iowa.gov/docs/code/9I.pdf"
    },
    "residency": {
      "link": "residency_required",
      "summary": "In Iowa, citizenship or lawful permanent residence is the line: a lawful permanent resident is not a nonresident alien under the Code and may acquire agricultural land. Missouri's rule turns on the alien or foreign-business status of the buyer and the state-wide aggregate, not on residence. Which route a given buyer is on depends on which side of the border the parcel lies.",
      "source": "Iowa Code 2026 ch. 9I, s. 9I.1(7); RSMo 442.571",
      "sourceUrl": "https://www.legis.iowa.gov/docs/code/9I.pdf"
    },
    "zoning": {
      "route": "unknown",
      "summary": "County zoning, building and septic rules were not opened for any of the seven counties, so the route is not stated. What was read is a community's own rule: at Dancing Rabbit, residents may rent land but may not build or hold warren leases, and only members may buy or build a home. Do not read the 1990s history of the community's founders as a current finding about any county.",
      "source": "Dancing Rabbit Ecovillage, How to Become a Resident / Member",
      "sourceUrl": "https://www.dancingrabbit.org/ecovillage-life/residency-membership/"
    },
    "collectiveForms": [
      {
        "kind": "other",
        "name": "Nonprofit corporation (Iowa)",
        "summary": "Iowa's corporate-farming restriction on certain corporations, limited liability companies and trusts does not apply to agricultural land, including a leasehold, acquired by a nonprofit corporation as defined in section 9H.1(20)(a), a corporation under section 504.141 that is not a foreign corporation.",
        "source": "Iowa Code 2026 ch. 9H, s. 9H.4(1)(c)",
        "sourceUrl": "https://www.legis.iowa.gov/docs/code/9H.pdf"
      },
      {
        "kind": "other",
        "name": "Not-for-profit corporation (Missouri)",
        "summary": "Missouri's corporate-farming restriction does not reach an interest acquired by an educational, religious or charitable not-for-profit or pro forma corporation or association.",
        "source": "RSMo 350.015",
        "sourceUrl": "https://revisor.mo.gov/main/OneSection.aspx?section=350.015"
      },
      {
        "kind": "land_trust",
        "name": "Dancing Rabbit Land Trust",
        "summary": "Dancing Rabbit's cost-of-living page lists the land trust (DRLT) among its co-ops and a lease fee for members leasing land, about 25 dollars a month for a 2,500 square foot leasehold: members lease from the land trust rather than own the ground.",
        "source": "Dancing Rabbit Ecovillage, Cost of living",
        "sourceUrl": "https://www.dancingrabbit.org/ecovillage-life/economy/cost-of-living/"
      }
    ],
    "firstClaim": [
      "No statutory pre-emption right on ordinary farmland was found in the sources opened.",
      "In Missouri, a sale or transfer of agricultural land goes to the director of agriculture for review only if no completed IRS Form W-9 is signed by the purchaser (RSMo 442.571(1)); proposed acquisitions are to be submitted to the department to test the one percent restriction (442.571(3))."
    ],
    "steps": [
      {
        "what": "Go through a community's own visitor and membership process, not through the land market. Dancing Rabbit asks people to come first through its Visitor Program (one- or two-week sessions, applied for in advance); only after an in-person visit of usually at least a week can you write a letter of intent to its Membership and Residency Committee, which surveys the community, interviews you, and issues a recommendation that members have two weeks to comment on. A new resident signs a residency agreement and lives as a member for six months; residents may rent land but may not build or hold warren leases, and cannot buy or build a home. Low land prices and thin county rules are the pull that brings arrivals to this part of the Midwest: the framework names that pull as a displacement vector and does not treat it as a reason to come.",
        "who": "Dancing Rabbit Ecovillage, Membership and Residency Committee",
        "source": "Dancing Rabbit Ecovillage, How to Become a Resident / Member",
        "sourceUrl": "https://www.dancingrabbit.org/ecovillage-life/residency-membership/",
        "n": 1
      },
      {
        "what": "Before thinking about any parcel, decide which side of the state line it is on, since the two foreign-buyer regimes differ: in Iowa a nonresident alien, foreign business or foreign government may not acquire agricultural land, and in Missouri foreign ownership is capped at one percent of state agricultural acreage with Department of Agriculture review.",
        "who": "The county recorder and assessor; the state's department of agriculture (Missouri) or secretary of state registration (Iowa)",
        "source": "Iowa Code 2026 ch. 9I; RSMo 442.571; Missouri Executive Order 24-01",
        "sourceUrl": "https://www.legis.iowa.gov/docs/code/9I.pdf",
        "n": 2
      },
      {
        "what": "If a group wants to hold land, work out the holding body before any deed: a nonprofit corporation is exempt from Iowa's corporate-farming restriction (9H.4(1)(c)) and a charitable or educational not-for-profit is exempt from Missouri's (RSMo 350.015); Dancing Rabbit's members lease land from its land trust.",
        "who": "The founding group; a lawyer licensed in the state concerned",
        "source": "Iowa Code 2026 ch. 9H s. 9H.4; RSMo 350.015",
        "sourceUrl": "https://www.legis.iowa.gov/docs/code/9H.pdf",
        "n": 3
      }
    ],
    "ruledOut": [
      "Iowa bars a nonresident alien, foreign business or foreign government from purchasing or otherwise acquiring agricultural land, and a person who acquires it in violation remains in violation for as long as the interest is held (Iowa Code 9I.3).",
      "In Missouri, no alien or foreign business may acquire agricultural land once total aggregate alien and foreign ownership exceeds one percent of the state's agricultural acreage, and no person may hold such land as an agent, trustee or fiduciary for an alien or foreign business in violation of the Act (RSMo 442.571).",
      "Under Missouri Executive Order 24-01 a citizen, resident or entity of a foreign adversary listed in 15 C.F.R. 7.4 may not acquire or own agricultural land within 10 miles of a staffed military facility."
    ],
    "direction": "tightening",
    "directionNote": "The Iowa Code chapter was amended by 2024 Acts chapters 1007 and 1090 (the 2026 Code shows the annual report repealed and online registration added), and Missouri added Executive Order 24-01 in January 2024; RSMo 442.571 itself shows an effective date of 28 August 2015. Whether the executive order stands under the present governor, and any 2026 session bills in either state, were not checked.",
    "gaps": [
      "County zoning, building-permit and septic rules were not opened for any of the seven counties, so the zoning route is unknown; the county recorder, assessor and planning or sanitarian office hold them.",
      "No statutory pre-emption holder was identified; nothing was opened on first-refusal rights in either state.",
      "Whether Missouri Executive Order 24-01 remains in force under the present governor, and Missouri's 2026 legislative changes, were not checked.",
      "The Missouri Department of Agriculture's rules for the review procedure were not opened.",
      "The Dancing Rabbit membership text is the community's own process, not law; Sandhill Farm's page opened carries no visitor or membership route and is not used.",
      "Dancing Rabbit's lease rate is its own published figure and may change; Bear Creek and other communities' lease terms were not opened.",
      "Jefferson County, Iowa (Fairfield) lies inside the 100 km radius used elsewhere but outside the seven-county footprint and is not covered here."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "north-karelia-kainuu": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "restricted",
      "summary": "Citizens of an EU or EEA state, and entities seated in the EU or EEA, buy land without a permit, unless a non-EU/EEA person holds at least one tenth of such an entity. Anyone else needs a Ministry of Defence permit for each property. The permit is not granted if the purchase can be assessed to threaten national security or to hinder defence, territorial surveillance, border control or security of supply. Since 15 July 2025 the Ministry can prevent acquisitions by people and entities whose state is waging a war of aggression, and it names Russia and Belarus among them.",
      "source": "Act 470/2019 on Permit Requirements for Certain Real Estate Acquisitions, ss.1, 2 and 5 (Finlex); Ministry of Defence, Authorisation to non-EU and non-EEA buyers",
      "sourceUrl": "https://defmin.fi/en/licences-and-services/authorisation-to-non-eu-and-non-eea-buyers-to-buy-real-estate"
    },
    "residency": {
      "link": "no_link",
      "summary": "The permit turns on nationality, not residence: a non-EU/EEA buyer must apply even with a permanent residence permit in Finland, though such a permit is taken into account when the application is considered. Nothing opened makes residence a condition of buying. Whether holding land gives any right to a residence permit was not opened.",
      "source": "Ministry of Defence, Authorisation to non-EU and non-EEA buyers (frequently asked questions)",
      "sourceUrl": "https://defmin.fi/en/licences-and-services/authorisation-to-non-eu-and-non-eea-buyers-to-buy-real-estate"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "A new dwelling always needs a building permit from the municipality, as does any other new building of 30 square metres or more. On a lake, river or sea shore no new building may go up without a detailed plan, or a master plan that expressly serves as a permit basis, except for buildings needed for farming, forestry or fishing, outbuildings in an existing yard, and repairs or small extensions of an existing dwelling; a municipality can also designate planning-need areas. The rules are applied parcel by parcel.",
      "source": "Building Act 751/2023 s.42 (in force 1 January 2025); Land Use Act 132/1999 ss.16 and 72 (Finlex)",
      "sourceUrl": "https://www.finlex.fi/fi/lainsaadanto/2023/751"
    },
    "collectiveForms": [
      {
        "kind": "commons",
        "name": "Yhteismetsä (jointly owned forest)",
        "summary": "Owners of properties can found a jointly owned forest by agreement. The shareholders' association is a legal person that can hold rights and make commitments, and shareholders are not personally liable for its obligations. The forest is meant for sustainable forestry for its shareholders, so it suits shared woodland rather than a settlement.",
        "source": "Act on Commonly Owned Forests 109/2003 ss.1, 4 and 5",
        "sourceUrl": "https://www.finlex.fi/fi/lainsaadanto/2003/109"
      },
      {
        "kind": "commons",
        "name": "Osakaskunta (joint-area association)",
        "summary": "A common area owned jointly by two or more properties is held by an association of the property owners, which the Joint Areas Act sets out how to run. It is for shared land and water areas, such as shores and fishing rights, attached to existing properties.",
        "source": "Joint Areas Act 758/1989 ss.2 and 3",
        "sourceUrl": "https://www.finlex.fi/fi/lainsaadanto/1989/758"
      }
    ],
    "firstClaim": [
      "The municipality holds a pre-emption right on property sales in its area, used to acquire land for community building, recreation and conservation. It does not apply to properties of 5,000 square metres or less, or where the buyer is the seller's spouse or an heir (Pre-emption Act 608/1977 ss.1 and 5).",
      "The state holds a pre-emption right where acquisition is needed for defence, border surveillance or national security, on properties in or within 1,000 metres of areas reserved for the Defence Forces or the Border Guard and of listed installations (Act 469/2019 ss.1 and 2).",
      "Staying in the border zone, which can reach up to 3 kilometres from the border on land, needs a Border Guard permit; it is granted open-ended to someone who lives in the zone or holds a dwelling or property there (Border Guard Act 578/2005 ss.49, 52 and 53)."
    ],
    "steps": [
      {
        "what": "Begin with the people already there: the village association (Kuhmo alone has 25 village associations or committees), the Leader group for the municipality, or the municipal moving service (Joensuu has a moving agent and an International House for newcomers). No national arrival programme was found, so each of these is a local door, not a scheme.",
        "who": "Village association; the municipality's Leader group (Vaara-Karjalan Leader, Joensuun Seudun Leader, Keski-Karjalan Jetina, Elävä Kainuu Leader, Oulujärvi Leader); municipal moving service",
        "source": "Leader Suomi, Leader groups; Kuhmo town, Villages; City of Joensuu, Move to Joensuu",
        "sourceUrl": "https://leadersuomi.fi/leader-ryhmat",
        "n": 1
      },
      {
        "what": "Confirm the place lies in the footprint's own ground and not in the reindeer herding area. In Kainuu, Suomussalmi, Hyrynsalmi and the part of Puolanka north of the Hyrynsalmi-Puolanka road are in that area, where reindeer herding is lawful irrespective of land ownership. The Sámi homeland (Enontekiö, Inari, Utsjoki and part of Sodankylä) is also outside. In those places the honest answer is not there.",
        "who": "The municipality; the reindeer herding cooperative (paliskunta) for the area",
        "source": "Reindeer Husbandry Act 848/1990 ss.2 and 3; Act on the Sámi Parliament 974/1995 s.4",
        "sourceUrl": "https://www.finlex.fi/fi/lainsaadanto/1990/848",
        "n": 2
      },
      {
        "what": "If the buyer is not an EU or EEA citizen (or the buyer entity is not EU/EEA, or has a non-EU/EEA holder of a tenth or more), apply for the Ministry of Defence permit through its Property surveillance e-service; a separate permit is needed for each property.",
        "who": "Ministry of Defence, real estate acquisition permits",
        "source": "Ministry of Defence, Authorisation to non-EU and non-EEA buyers",
        "sourceUrl": "https://defmin.fi/en/licences-and-services/authorisation-to-non-eu-and-non-eea-buyers-to-buy-real-estate",
        "duration": {
          "text": "Apply as early as possible, and no later than two months after the transaction; if a permit is refused, the property must be sold on within six months of the refusal becoming final",
          "source": "Ministry of Defence, Authorisation to non-EU and non-EEA buyers (frequently asked questions)",
          "sourceUrl": "https://defmin.fi/en/licences-and-services/authorisation-to-non-eu-and-non-eea-buyers-to-buy-real-estate"
        },
        "n": 3
      },
      {
        "what": "Before an offer, check the parcel against defence and Border Guard areas (state pre-emption within 1,000 metres), the border zone (a permit to stay), and the municipality's pre-emption right, which does not apply to parcels of 5,000 square metres or less.",
        "who": "Municipality; Border Guard; Ministry of Defence",
        "source": "Act 469/2019 ss.1-2; Pre-emption Act 608/1977 ss.1 and 5; Border Guard Act 578/2005 ss.49-53",
        "sourceUrl": "https://www.finlex.fi/fi/lainsaadanto/2019/469",
        "n": 4
      },
      {
        "what": "Ask the municipal building control what a home on the parcel would need: a building permit for any dwelling, and on a shore a detailed plan or a master plan that serves as a permit basis, or one of the listed exceptions.",
        "who": "Municipal building control",
        "source": "Building Act 751/2023 s.42; Land Use Act 132/1999 ss.16 and 72",
        "sourceUrl": "https://www.finlex.fi/fi/lainsaadanto/2023/751",
        "n": 5
      },
      {
        "what": "If several households will share woodland or a shore, choose the holding vehicle before the deed: a jointly owned forest (yhteismetsä) for forestry land, or a joint-area association (osakaskunta) for shared land and water areas attached to existing properties.",
        "who": "The founding group",
        "source": "Act on Commonly Owned Forests 109/2003; Joint Areas Act 758/1989",
        "sourceUrl": "https://www.finlex.fi/fi/lainsaadanto/2003/109",
        "n": 6
      }
    ],
    "ruledOut": [
      "Everyman's rights allow moving in nature and staying or overnighting only temporarily, irrespective of ownership; they exclude disturbing the landowner's use of the land, entering yards and cultivated fields, felling trees, lighting fires on another's land, and camping or making noise too close to dwellings, so they are not a way to settle (Ministry of the Environment, Jokaisenoikeudet).",
      "In the reindeer herding area reindeer herding may be practised irrespective of land ownership (Reindeer Husbandry Act 848/1990 s.3), so ownership of a parcel there carries no right to exclude it.",
      "A non-EU/EEA buyer cannot hold a property after a final refusal of the permit: it must be sold on within six months, failing which the authorities arrange the sale (Act 470/2019 s.6)."
    ],
    "direction": "tightening",
    "directionNote": "The rules have tightened since 2022: the state's pre-emption right was extended (Act 469/2019 as amended in 2022), the 2025 amendment lets the Ministry of Defence prevent acquisitions by nationals of states waging a war of aggression (in force 15 July 2025), and the Building Act 751/2023 took effect on 1 January 2025. EU and EEA buyers are not affected by the permit rules.",
    "gaps": [
      "The decree naming the states that meet the aggression criteria was not opened; the Ministry of Defence page is the source for Russia and Belarus.",
      "The Real Estate Formation Act 554/1995 and the statutes for co-operatives and housing companies, which are used locally for shared housing, were not opened.",
      "The border-zone width is set by decree, which was not opened; only the statutory maximum of three kilometres on land is stated.",
      "Municipal building orders and which shores are covered by a shore plan were not checked for any municipality in the footprint.",
      "No source states how long the Ministry of Defence takes to decide a permit.",
      "No statutory arrival programme and no group-friendly host-side offer was found; the village associations, Leader groups and Joensuu's moving agent are pages that exist, and what each offers a group was not opened.",
      "Whether holding land gives any right to a residence permit was not opened."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "northern-new-mexico": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "No New Mexico statute restricting foreign or non-resident purchase of private land was found: the National Agricultural Law Center (updated June 2026) lists about 29 states with such laws and New Mexico is not among them. Foreign persons who acquire a significant interest in US agricultural land must still file a federal AFIDA disclosure.",
      "source": "National Agricultural Law Center, Foreign Ownership FAQ (updated 26 June 2026); USDA FSA AFIDA page",
      "sourceUrl": "https://nationalaglawcenter.org/foreign-investments-in-ag/"
    },
    "residency": {
      "link": "no_link",
      "summary": "The sources opened show no residency or citizenship test for buying private land in New Mexico. Land purchase carries no immigration status, which is outside these sources.",
      "source": "National Agricultural Law Center, Foreign Ownership FAQ (state list excludes New Mexico)",
      "sourceUrl": "https://nationalaglawcenter.org/foreign-investments-in-ag/"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "Taos County's Planning Department takes applications for zoning permits (special use, administrative, subdivision) and building permits online, applies the 2021 International Building and Residential Codes and the New Mexico Administrative Code, and is rewriting its 2018 Land Use Regulations and 2005 Subdivision Regulations into a single Unified Development Code. Subdivision approval requires proof of water availability, and a domestic well cannot be the water source for an approved subdivision. What several dwellings on one parcel need is decided by the county on the application.",
      "source": "Taos County Planning Department pages (Planning; Building Permit Information; Land Use and Subdivision Regulations Updates); Taos Regional Water Plan 2016, section 4.1.1.10",
      "sourceUrl": "https://www.taoscounty.org/189/Planning"
    },
    "collectiveForms": [
      {
        "kind": "commons",
        "name": "Acequia (community ditch) and its parciantes",
        "summary": "These are the host governance bodies for irrigated land rather than a form a newcomer creates: each acequia has its own bylaws, and the state water plan reports more than 300 acequias in the Taos region, with acequias and parciantes holding authority over decisions on water transfers.",
        "source": "Taos Regional Water Plan, July 2016 (State of New Mexico, Interstate Stream Commission and Office of the State Engineer)",
        "sourceUrl": "https://www.taoscounty.org/DocumentCenter/View/80/Taos-Regional-Water-Plan-July-2016-PDF"
      },
      {
        "kind": "land_trust",
        "name": "Conservation land trust (Taos Land Trust)",
        "summary": "Taos Land Trust lists conservation easements among its programmes; a land trust is one partner for protecting land alongside a community's own holding body.",
        "source": "Taos Land Trust, home page",
        "sourceUrl": "https://taoslandtrust.org/"
      }
    ],
    "firstClaim": [
      "Acequia commissioners may deny a change of a water right from agricultural use on land served by the acequia to non-agricultural use away from it, under NMSA 73-2-21(E) as described in the state water plan; their decision is reviewed in court only for fraud, arbitrary or capricious action or non-compliance with law, and the State Engineer approves transfers of water rights."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Ask the county Planning Department which zoning and building permits the parcel and your plans need, and apply through the county's online permit system; ask where the Unified Development Code rewrite stands.",
        "who": "Taos County Planning Department",
        "source": "Taos County Planning and Building Permit Information pages (zoning and building permits applied for online; 2021 IBC and IRC; Unified Development Code in preparation)",
        "sourceUrl": "https://www.taoscounty.org/420/Building-Permit-Information"
      },
      {
        "n": 2,
        "what": "Settle the water source before the purchase: the state water plan says the Rio Grande is fully appropriated, so any new diversion of surface water or groundwater needs a transfer of a valid water right or an application for a new domestic or livestock well.",
        "who": "Office of the State Engineer (State of New Mexico)",
        "source": "Taos Regional Water Plan, July 2016, executive summary (Rio Grande fully appropriated)",
        "sourceUrl": "https://www.taoscounty.org/DocumentCenter/View/80/Taos-Regional-Water-Plan-July-2016-PDF"
      },
      {
        "n": 3,
        "what": "If the land is served by an acequia, meet the acequia before you buy: ask for its bylaws and whether it has adopted rules on moving water rights, because a transfer applicant must file an affidavit about the acequia's bylaws and the acequia's commissioners can refuse changes that take water off the ditch to non-agricultural use.",
        "who": "The acequia's commissioners; Office of the State Engineer for the transfer application",
        "source": "Taos Regional Water Plan, July 2016, section 4.1.1.3 (Storm Ditch v. D'Antonio; Pena Blanca Partnership v. San Jose Community Ditch)",
        "sourceUrl": "https://www.taoscounty.org/DocumentCenter/View/80/Taos-Regional-Water-Plan-July-2016-PDF"
      },
      {
        "n": 4,
        "what": "If the land will be divided into lots, plan for the water proof the Subdivision Act requires before final plat approval: state-issued water use permits for the subdivision or a hookup to a water provider with a State Engineer opinion, and a domestic well cannot be the source. The water requirements apply to subdivisions of ten or more lots.",
        "who": "Taos County (plat approval) and the Office of the State Engineer",
        "source": "Taos Regional Water Plan, July 2016, section 4.1.1.10 (Subdivision Act, NMSA 47-6-11.2)",
        "sourceUrl": "https://www.taoscounty.org/DocumentCenter/View/80/Taos-Regional-Water-Plan-July-2016-PDF"
      }
    ],
    "ruledOut": [
      "New water is not on offer from the river: the Rio Grande is fully appropriated, so a new diversion needs an existing right to be transferred or a new domestic or livestock well application.",
      "An acequia's water cannot simply be moved off the ditch to a non-agricultural use over the acequia's objection: the commissioners may deny it, and courts review that decision only for fraud, arbitrary or capricious action or non-compliance with law.",
      "A subdivision cannot be approved on a domestic well as its water source."
    ],
    "direction": "stable",
    "directionNote": "No New Mexico private-land foreign-ownership law appears in the National Agricultural Law Center's June 2026 list. Taos County is rewriting its land use and subdivision regulations into a Unified Development Code after a 2025 comprehensive plan (updated February 2026), so local rules are in motion.",
    "gaps": [
      "The New Mexico statutes (NMSA 73-2-21, 73-2-28, 72-5-23 and 72-5-24.1) could not be opened: the official database loads only through scripts and the commercial mirrors block this sandbox. Acequia rules are therefore taken from the 2016 state water plan's legal summary, which may pre-date amendments; the dossier's reliance on 73-2-28 for commissioner approval was not confirmed and the reverify pass found that section holds no such power.",
      "The reverify pass reports a 120-day deemed-approval rule for acequia decisions under 72-5-24.1; it was not opened here and is not carried, so no duration is stated for acequia or State Engineer processes.",
      "What parciante membership asks in practice (meetings, ditch cleaning, voting on distribution in drought) and acequia-by-acequia bylaws were not sourced.",
      "The text of Taos County's current Land Use Regulations (2018) and Subdivision Regulations (2005) was not read; only the Planning Department's pages were.",
      "The New Mexico Community Land Trust Act cited in the dossier was not found by the reverify pass and is not carried; the State Construction Industries Division's alternative-methods route for earthship-style construction was not opened.",
      "Pueblo water rights and the Taos Pueblo settlement were not covered."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "nova-scotia": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open_with_conditions",
      "summary": "Non-residents may buy, but a provincial Non-Resident Deed Transfer Tax of 10 percent (5 percent before 1 April 2025) is charged on the non-resident share of a residential property. Residential here means property used or intended to be used for residential purposes with three or fewer dwelling units, which includes vacant land intended for housing; land that is commercial or resource property and not intended for residential use is outside the definition, not exempted from it. A non-resident who becomes a Nova Scotia resident within 6 months of the transfer and proves it is not charged, assessed per buyer. The federal foreign-buyer ban applies only to residential property inside census metropolitan areas and census agglomerations, so property outside them is excluded.",
      "source": "Nova Scotia Finance, Non-Resident Provincial Deed Transfer Tax Guidelines; Prohibition on the Purchase of Residential Property by Non-Canadians Regulations (SOR/2022-250), s. 3",
      "sourceUrl": "https://novascotia.ca/finance/en/home/taxation/tax101/docs/Nova-Scotia-Provincial-Non-resident-Deed-Transfer-Tax-Guidelines.pdf"
    },
    "residency": {
      "link": "separate_route",
      "summary": "Buying land does not itself create an immigration route. Residence matters for the deed transfer tax (becoming a Nova Scotia resident within 6 months removes the tax for that buyer), and settlement by newcomers runs through separate programmes such as the provincial nomination programme (NSNP), which selects from an expression-of-interest pool by labour-market need and programme allocations.",
      "source": "Nova Scotia Finance, Non-Resident Provincial Deed Transfer Tax Guidelines; Nova Scotia Office of Immigration, Nova Scotia Nominee Program page",
      "sourceUrl": "https://liveinnovascotia.com/nova-scotia-nominee-program"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "Permits are handled by the municipality. In Annapolis County, for example, every application is reviewed for development permit approval (zoning) before building permit approval under the Nova Scotia Building Code Act, and subdivision has its own application and bylaw. What a given municipality allows for several dwellings has to be asked of its development officer.",
      "source": "Annapolis County, Building Inspection and Subdividing Land pages",
      "sourceUrl": "https://annapoliscounty.ca/planning/building-a-structure"
    },
    "collectiveForms": [
      {
        "kind": "land_trust",
        "name": "Conservation land trust (Nova Scotia Nature Trust)",
        "summary": "The Nova Scotia Nature Trust lists saving land and stewarding land among its work; a land trust is one partner for a conservation arrangement alongside a community's own holding body.",
        "source": "Nova Scotia Nature Trust, home page",
        "sourceUrl": "https://nsnt.ca/"
      }
    ],
    "firstClaim": [
      "No statutory pre-emption or first-refusal holder over private rural land was identified in the sources opened. The municipality's development officer and the provincial tax administrator are the two offices a buyer deals with on permits and the deed transfer tax."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Settle what the land is for before you sign: the provincial tax applies to property used or intended for residential use with three or fewer dwelling units, including vacant land intended for housing, and does not apply to commercial or resource property not intended for residential use.",
        "who": "Nova Scotia Department of Finance and Treasury Board (tax administrator); a Nova Scotia lawyer for the affidavit and classification",
        "source": "Nova Scotia Finance, Non-Resident Provincial Deed Transfer Tax Guidelines (residential property; commercial and resource properties)",
        "sourceUrl": "https://novascotia.ca/finance/en/home/taxation/tax101/docs/Nova-Scotia-Provincial-Non-resident-Deed-Transfer-Tax-Guidelines.pdf"
      },
      {
        "n": 2,
        "what": "For each non-resident buyer who intends to move, plan to prove Nova Scotia residency within 6 months of the transfer; the exemption is assessed per buyer, and interest at 1 percent a month and a possible penalty apply to anyone who cannot show proof.",
        "who": "Nova Scotia Department of Finance and Treasury Board (tax administrator)",
        "source": "Nova Scotia Finance, Non-Resident Provincial Deed Transfer Tax Guidelines (non-residents moving to Nova Scotia; interest and penalty)",
        "sourceUrl": "https://novascotia.ca/finance/en/home/taxation/tax101/docs/Nova-Scotia-Provincial-Non-resident-Deed-Transfer-Tax-Guidelines.pdf",
        "duration": {
          "text": "Proof of Nova Scotia residency is due within 6 months of the date the property is transferred.",
          "source": "Nova Scotia Finance, Non-Resident Provincial Deed Transfer Tax Guidelines",
          "sourceUrl": "https://novascotia.ca/finance/en/home/taxation/tax101/docs/Nova-Scotia-Provincial-Non-resident-Deed-Transfer-Tax-Guidelines.pdf"
        }
      },
      {
        "n": 3,
        "what": "Check whether the parcel lies inside a census metropolitan area or census agglomeration: the federal ban on non-Canadian purchase of residential property covers only those areas, and property outside them is a prescribed exclusion.",
        "who": "Federal Prohibition on the Purchase of Residential Property by Non-Canadians regime (Justice Laws text); a lawyer to confirm the parcel's location",
        "source": "Prohibition on the Purchase of Residential Property by Non-Canadians Regulations, s. 3 (properties outside census agglomerations and metropolitan areas)",
        "sourceUrl": "https://laws-lois.justice.gc.ca/eng/regulations/SOR-2022-250/FullText.html"
      },
      {
        "n": 4,
        "what": "Ask the municipality's development officer about the zone and what a dwelling or several dwellings need, then the building inspection division about the building permit; ask separately about subdivision if the land will be divided.",
        "who": "Municipal development officer and building inspection division (for example Annapolis County planning and inspection services)",
        "source": "Annapolis County, Building Inspection page (development permit approval precedes building permit approval)",
        "sourceUrl": "https://annapoliscounty.ca/planning/building-a-structure"
      },
      {
        "n": 5,
        "what": "If members need an immigration route, treat it as its own track: the provincial nomination programme (NSNP) uses an expression-of-interest pool with periodic selection, and the pool entry now has a limited validity period.",
        "who": "Nova Scotia Office of Immigration (provincial nomination programme, NSNP)",
        "source": "Nova Scotia Office of Immigration, Nova Scotia Nominee Program page (EOI process; 12-month validity from 1 May 2026; fees from 1 September 2026)",
        "sourceUrl": "https://liveinnovascotia.com/nova-scotia-nominee-program",
        "duration": {
          "text": "Expressions of interest have a 12-month validity period from 1 May 2026, with transition measures for entries already in the pool.",
          "source": "Nova Scotia Office of Immigration, Nova Scotia Nominee Program page (update of 27 April 2026)",
          "sourceUrl": "https://liveinnovascotia.com/nova-scotia-nominee-program"
        }
      }
    ],
    "ruledOut": [
      "The residency exemption from the deed transfer tax is not blanket: it applies per buyer, only to a buyer who moves to Nova Scotia within 6 months and can prove it, and the tax with interest and a possible penalty falls on a buyer who cannot.",
      "A non-Canadian cannot purchase residential property within a census metropolitan area or census agglomeration under the federal Act unless an exception applies; the Act makes it an offence to counsel or aid such a purchase."
    ],
    "direction": "tightening",
    "directionNote": "The provincial non-resident deed transfer tax doubled from 5 percent to 10 percent for agreements signed on or after 1 April 2025. The federal Act's repeal is shown on Justice Laws as an amendment not yet in force (current to 2026-09-21); the repeal date was not stated on the pages opened. Provincial nomination capacity is a separate, single-source report (see gaps).",
    "gaps": [
      "The federal foreign-buyer ban's end date (reported as 1 January 2027) was not shown on the Justice Laws pages opened, which list the Act's repeal as not yet in force; whether it was extended or lapses was not confirmed.",
      "Reported cuts to Nova Scotia's federal provincial-nomination allocations for 2025 to 2027 (roughly half) come from a single practitioner news source cited in the dossier that could not be opened; no allocation figure is carried.",
      "Nova Scotia statutes (Municipal Government Act, Cooperatives Act, Non-Resident Deed Transfer Tax Act) did not resolve from this sandbox; the tax rules come from the Department of Finance's guidelines, which say the legislation prevails over them.",
      "Municipal zoning was sampled from one county (Annapolis); Cape Breton and other counties were not read, and unincorporated-area land-use rules were not sourced.",
      "Cooperative and non-profit forms available for collective holding, and the federal Underused Housing Tax and non-resident withholding issues named in the dossier, were not opened and are not listed.",
      "Whether a parcel counts as residential, commercial or resource for the tax can turn on its assessment classification and intended use; a Nova Scotia lawyer should confirm."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "oaxaca": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "restricted",
      "summary": "Foreigners may acquire dominion over land in Mexico only if they agree before the Foreign Ministry to be treated as nationals for that property and obtain its permit (Constitution art. 27 I; Ley de Inversión Extranjera art. 10 A); within 100 km of the frontiers and 50 km of the coasts they cannot acquire direct dominion at all. Ejido and communal land is a further closed door: ejido parcel rights may be sold only to ejidatarios or avecindados of the same nucleus, who must be Mexicans, and communal lands are inalienable, imprescriptible and unseizable except when contributed to a company by the community's decision.",
      "source": "Constitución Política de los Estados Unidos Mexicanos, art. 27 I and VII (Orden Jurídico Nacional text, last reform 15 Nov 2024); Ley Agraria arts. 13, 15, 80, 99, 100",
      "sourceUrl": "https://www.ordenjuridico.gob.mx/Constitucion/cn16.pdf"
    },
    "residency": {
      "link": "no_link",
      "summary": "Residence does not open the door to ejido or communal land for a foreigner: an avecindado of an ejido is defined as a Mexican of age who has lived a year or more on the ejido's lands and been recognised by the assembly, and ejidatario status requires being Mexican. The agrarian statute therefore offers no residence route to community land; what a foreigner can hold is a permitted interest in a private (dominio pleno) parcel.",
      "source": "Ley Agraria arts. 13 and 15 (Orden Jurídico Nacional text, last reform 1 Apr 2024)",
      "sourceUrl": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "On ejido and communal land, what may be built or settled is decided by the community: the ejido assembly delimits settlement areas and sets use of common lands under its internal rules, and a community decides the use of its lands, may allow others temporary use and enjoyment of its goods and may form companies or partner with third parties. On private parcels, municipal building rules were not read.",
      "source": "Ley Agraria arts. 10, 23 VII and X, 100 and 101",
      "sourceUrl": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf"
    },
    "collectiveForms": [
      {
        "kind": "commons",
        "name": "Ejido and comunidad agraria (the host bodies)",
        "summary": "These are not forms a newcomer creates: each is a legal person that owns its land collectively, governed by an assembly, and the Constitution protects its ownership. A community may form civil or mercantile companies or partner with third parties, and its assembly may decide to transfer common-use areas to such a company where manifestly useful to the community.",
        "source": "Constitución art. 27 VII; Ley Agraria arts. 9, 99 and 100",
        "sourceUrl": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf"
      },
      {
        "kind": "company",
        "name": "Mexican company with the article 27 agreement",
        "summary": "A Mexican company with an exclusion-of-foreigners clause, or one that has signed the constitutional agreement, may acquire dominion over real property in the national territory. Where a company owns agricultural, livestock or forestry land, foreigners may hold no more than 49 percent of its series T shares.",
        "source": "Ley de Inversión Extranjera art. 10; Ley Agraria art. 130",
        "sourceUrl": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo14.pdf"
      },
      {
        "kind": "cooperative",
        "name": "Production cooperative with foreign participation",
        "summary": "Foreign investment may take part in cooperative production societies up to 10 percent; this caps the foreign share in that form.",
        "source": "Ley de Inversión Extranjera art. 7 I",
        "sourceUrl": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo14.pdf"
      }
    ],
    "firstClaim": [
      "On a first sale of an ejido parcel after the assembly has adopted full dominion: the seller's relatives, persons who have worked the parcel for more than a year, ejidatarios, avecindados and the ejido nucleus, in that order, each with a right of first refusal for 30 natural days from notice.",
      "On sale of ejido parcel rights: the seller's spouse or partner and children, in that order, have a 30-day right of first refusal, and the ejido commissariat must be notified.",
      "The ejido assembly (and, for common lands, the community assembly) decides on conversion to full dominion and on contributing land to a company; the Registro Agrario Nacional registers the change."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Find out what kind of tenure the parcel is: private property in the Public Registry, ejido land, or communal land. The Constitution recognises ejidos and communities as legal persons with protected ownership, so a parcel with ejido or communal history cannot be treated as an ordinary private parcel.",
        "who": "Registro Agrario Nacional and the Public Property Registry (public registries); Procuraduría Agraria (public agrarian counsel); a Mexican agrarian lawyer",
        "source": "Constitución art. 27 VII (legal personality and protected ownership of ejidos and communities)",
        "sourceUrl": "https://www.ordenjuridico.gob.mx/Constitucion/cn16.pdf"
      },
      {
        "n": 2,
        "what": "For an ejido parcel, the only road to private ownership starts with the ejido assembly: it must authorise members to adopt full dominion (a two-thirds vote of those present, with a Procuraduría Agraria representative and a notary present), then the ejidatario asks the Registro Agrario Nacional to cancel the ejido registration and issue the title, after which the land is ordinary property. Rights of first refusal run in the order set by law.",
        "who": "Ejido assembly; Registro Agrario Nacional; Procuraduría Agraria representative and a notary at the assembly",
        "source": "Ley Agraria arts. 23 IX, 27, 28, 81, 82 and 84",
        "sourceUrl": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf",
        "duration": {
          "text": "Holders of the right of first refusal have 30 natural days from notice to exercise it, after which the right lapses.",
          "source": "Ley Agraria art. 84 (right of first refusal on a first sale after adoption of full dominion)",
          "sourceUrl": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf"
        }
      },
      {
        "n": 3,
        "what": "For communal land, ownership is not on offer, since communal lands are inalienable. What the law allows is the community's own decisions: it may let others use and enjoy its goods for a time, form companies or partner with third parties, and its assembly may transfer common-use areas to a company in cases of manifest utility, with the Procuraduría Agraria's opinion on the project first. Any arrangement is therefore made with the community through its assembly.",
        "who": "Community assembly (comuneros); Procuraduría Agraria; Registro Agrario Nacional",
        "source": "Ley Agraria arts. 75, 99, 100 and 101",
        "sourceUrl": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf",
        "duration": {
          "text": "The Procuraduría Agraria must give its opinion on a proposed contribution of common-use land to a company within 30 business days, for the assembly to consider.",
          "source": "Ley Agraria art. 75 II",
          "sourceUrl": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf"
        }
      },
      {
        "n": 4,
        "what": "For a private parcel outside the 100 km frontier and 50 km coastal strip, a foreign buyer files the written article 27 agreement with the Foreign Ministry and obtains its permit before acquiring.",
        "who": "Secretaría de Relaciones Exteriores (Foreign Ministry)",
        "source": "Ley de Inversión Extranjera art. 10 A; Constitución art. 27 I",
        "sourceUrl": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo14.pdf",
        "duration": {
          "text": "For a municipality wholly outside the restricted zone the permit is deemed granted if no refusal is published within 5 business days of the application; for a municipality partly inside the zone the ministry decides within 30 business days.",
          "source": "Ley de Inversión Extranjera art. 10 A",
          "sourceUrl": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo14.pdf"
        }
      },
      {
        "n": 5,
        "what": "If several foreign members will hold land together, use a Mexican company that carries the article 27 agreement, and keep to the caps: foreigners may hold no more than 49 percent of the series T shares of a company that owns agricultural, livestock or forestry land, and such companies and their land are recorded in a special section of the Registro Agrario Nacional.",
        "who": "Mexican notary and agrarian lawyer (professional advisers); Registro Agrario Nacional",
        "source": "Ley Agraria arts. 129 to 131; Ley de Inversión Extranjera art. 10",
        "sourceUrl": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf"
      }
    ],
    "ruledOut": [
      "A foreigner cannot buy ejido land: ejido parcel rights may be sold only to ejidatarios or avecindados of the same nucleus, and both must be Mexicans, so an ejido parcel is not available until the community's own assembly process turns it into private property.",
      "Communal land cannot be sold: it is inalienable, imprescriptible and unseizable, apart from the community's own decision to contribute it to a company.",
      "Foreigners cannot acquire direct dominion over land within 100 km of the frontiers or 50 km of the coasts.",
      "A front-person (prestanombre) arrangement to give foreigners enjoyment of land in the restricted zone is a simulation of acts that the foreign investment law sanctions with a fine up to the value of the operation; it is not a lawful route to ownership."
    ],
    "direction": "stable",
    "directionNote": "The Orden Jurídico Nacional texts opened show the Constitution last reformed 15 November 2024, the Ley Agraria 1 April 2024 and the Ley de Inversión Extranjera 27 May 2024; later amendments were not checked. The reverify pass found no major federal change to the agrarian framework.",
    "gaps": [
      "The dossier's '6 to 18 months' to convert an ejido parcel to full dominion has no source: the Ley Agraria sets no timeline, and the figure is not carried.",
      "The Foreign Ministry's own permit pages and the Registro Agrario Nacional site did not resolve or load from this sandbox, so the practical procedure and fees for the article 27 permit were read only from the statute.",
      "The dossier's claim that front-person arrangements carry criminal liability was not found: the law opened sanctions simulation in the restricted zone with a fine, and nothing was found for land outside it.",
      "Municipal building and land-use rules for private parcels in the Oaxaca highlands were not read.",
      "The dossier's claim that foreign shareholders may hold 100 percent of a Mexican company owning private rural land is qualified by the 49 percent series T cap in Ley Agraria art. 130 for companies that own agricultural, livestock or forestry land; how it applies to a particular parcel needs an agrarian lawyer.",
      "Which Oaxaca highland municipalities lie wholly or partly inside the restricted zone, and the count of ejido and communal bodies in the state, were not checked.",
      "Community entry protocols in usos y costumbres municipalities and the host peoples' own authority belong to the Land standing entry, not here."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "ozarks": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open_with_conditions",
      "summary": "Arkansas allows foreign buyers in general, with a targeted bar. Act 636 of 2023 (Ark. Code 18-11-701 and following) forbids a 'prohibited foreign party' from acquiring any interest in Arkansas agricultural land: a citizen or resident of a country subject to the ITAR arms-trafficking list (22 CFR 126.1), a foreign government or entity organised there, or a US-organised entity in which such persons hold 33 percent or more (or 50 percent or more in aggregate). 'Agricultural land' means land outside a municipality used for forestry or, within the past five years, for farming, ranching or timber (land of up to 10 acres with up to 1,000 dollars of annual farm receipts is excepted). A prohibited foreign party who is a US resident alien may hold on the same terms as a citizen while resident. Buyers not tied to those countries are outside the bar.",
      "source": "Arkansas Act 636 of 2023 (SB 383), enrolled text; Arkansas Act 811 of 2025 (HB 1680)",
      "sourceUrl": "https://arkleg.state.ar.us/Home/FTPDocument?path=%2FACTS%2F2023R%2FPublic%2FACT636.pdf"
    },
    "residency": {
      "link": "no_link",
      "summary": "Arkansas law does not require residency to buy land. Residence matters only to a 'prohibited foreign party': one who is a US resident alien may acquire and hold agricultural land on the same terms as a citizen while the residence continues, and has two years to divest if residence ends.",
      "source": "Arkansas Act 636 of 2023, 18-11-704(a)-(b)",
      "sourceUrl": "https://arkleg.state.ar.us/Home/FTPDocument?path=%2FACTS%2F2023R%2FPublic%2FACT636.pdf"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "Building and zoning rules are set county by county. A practitioner guide reports that Sharp, Izard and Fulton counties skip permits for small cabins on agriculturally zoned land in unincorporated areas, and advises calling the county planning office to confirm; this is a practitioner source, not an ordinance, so treat it as a lead to check rather than a rule.",
      "source": "TinyHomeState, Off Grid Living in Arkansas (practitioner guide)",
      "sourceUrl": "https://tinyhomestate.com/lifestyle/off-grid-living-in-arkansas/"
    },
    "collectiveForms": [
      {
        "kind": "association",
        "name": "Nonprofit or charitable entity registered with the Arkansas Secretary of State",
        "summary": "The Secretary of State's Business and Commercial Services division has a section for nonprofit and charitable entities and another for new businesses; the choice of legal form for a land-holding group is made with an Arkansas attorney.",
        "source": "Arkansas Secretary of State, Business and Commercial Services",
        "sourceUrl": "https://www.sos.arkansas.gov/business-commercial-services-bcs/nonprofit-charitable-entities"
      }
    ],
    "firstClaim": [
      "No statutory pre-emption or first-refusal holder over private rural land was identified in the sources opened. The Arkansas Attorney General enforces the foreign-party law, and the state Office of Agricultural Intelligence reports suspected violations to the Attorney General."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Check whether any buyer or any person holding 33 percent or more of a buying entity is a 'prohibited foreign party' (a citizen or resident of, or entity organised in, a country on the ITAR 22 CFR 126.1 list). If not, the Arkansas agricultural-land bar does not apply to the purchase.",
        "who": "Arkansas real estate attorney (professional adviser); enforcement by the Attorney General",
        "source": "Arkansas Act 636 of 2023, 18-11-702 and 18-11-703",
        "sourceUrl": "https://arkleg.state.ar.us/Home/FTPDocument?path=%2FACTS%2F2023R%2FPublic%2FACT636.pdf"
      },
      {
        "n": 2,
        "what": "If a company or trust will hold the land, read the 2025 widening of the law: a foreign-party-controlled business may not lease land either, and a prohibited foreign party may not hold agricultural land within ten miles of listed critical infrastructure such as a military installation, utility, dam or communications facility.",
        "who": "Arkansas real estate attorney (professional adviser)",
        "source": "Arkansas Act 811 of 2025 (HB 1680), amending 18-11-110 and the agricultural-land subchapter",
        "sourceUrl": "https://arkleg.state.ar.us/Home/FTPDocument?path=%2FACTS%2F2025R%2FPublic%2FACT811.pdf"
      },
      {
        "n": 3,
        "what": "Ask the county planning office whether the parcel is zoned, whether the county has adopted a residential building code for unincorporated land, and what it requires for a dwelling or several dwellings.",
        "who": "County planning office of the county where the parcel lies",
        "source": "TinyHomeState, Off Grid Living in Arkansas (advises calling the county planning office to confirm rules on permits)",
        "sourceUrl": "https://tinyhomestate.com/lifestyle/off-grid-living-in-arkansas/"
      },
      {
        "n": 4,
        "what": "If the land is on the Missouri side of the Ozarks, note that Missouri limits aggregate alien and foreign ownership of agricultural land to one percent of the state's agricultural acreage, and sales without a signed IRS Form W-9 from the purchaser are submitted to the Department of Agriculture for review.",
        "who": "Missouri Department of Agriculture",
        "source": "Revised Statutes of Missouri, section 442.571",
        "sourceUrl": "https://revisor.mo.gov/main/OneSection.aspx?section=442.571"
      }
    ],
    "ruledOut": [
      "A prohibited foreign party may not acquire any interest in Arkansas agricultural land, including a lease of a year or longer, whether or not it intends to farm; holding such land as an agent, trustee or other fiduciary for a prohibited foreign party is also barred.",
      "Land held in breach of the Arkansas law is subject to divestment: two years for a prohibited foreign party who ceases to be a resident alien, one year for a foreign-party-controlled business after the 2025 amendment, then a court-ordered sale and possible felony charges."
    ],
    "direction": "stable",
    "directionNote": "Arkansas widened its foreign-party law in 2025 (Act 811, with technical corrections in Act 174); the change bears on parties tied to ITAR-listed countries and on leases and critical-infrastructure proximity, and the sources opened show no change for other buyers. Practitioner permit leniency in some counties is not a legal guarantee.",
    "gaps": [
      "Act 811 was read from the Arkansas Legislature's PDF, which shows the bill as engrossed under an 'Act 811' header; its effective date and any later amendment were not checked.",
      "Arkansas county building-code and zoning rules were not read from an ordinance or state code; the only source is a practitioner guide, and the dossier's claim for Newton and Searcy counties has no source and is dropped.",
      "Title and access due diligence (landlocked parcels, severed mineral rights) and the Arkansas Land Trust Act named in the dossier were not found in a primary source and are not carried.",
      "The state law is the only layer covered for Arkansas; Missouri-side zoning and building rules were not covered.",
      "Whether a foreign buyer's entity structure triggers the Act 636 percentage tests in a given case is a matter for an Arkansas attorney."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "pembrokeshire": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "No nationality restriction on individuals owning land in Wales was found in the sources opened. A non-UK company or other overseas entity must first register with Companies House, disclosing its beneficial owners, before it can buy, sell or transfer land in the UK.",
      "source": "Companies House guidance 'Register an overseas entity and its beneficial owners' (GOV.UK, updated 1 February 2026)",
      "sourceUrl": "https://www.gov.uk/guidance/register-an-overseas-entity"
    },
    "residency": {
      "link": "unknown",
      "summary": "Whether owning land in Wales carries any right to live in the UK was not covered by a source opened for this entry; permission to live in the UK is an immigration matter separate from the land rules.",
      "source": "Companies House guidance 'Register an overseas entity and its beneficial owners' (scope: ownership by overseas entities only)",
      "sourceUrl": "https://www.gov.uk/guidance/register-an-overseas-entity"
    },
    "zoning": {
      "route": "dedicated_route",
      "summary": "Welsh national policy provides One Planet Development (OPD): a low-impact dwelling or community in the open countryside that must provide for the inhabitants' minimum needs of income, food, energy and waste assimilation within no more than five years of starting work on site, shown by a management plan from a competent person. A proposal that cannot show this is considered against the policies that control development in the open countryside. Rural enterprise dwellings are a separate, narrower route.",
      "source": "Planning Policy Wales Edition 12 (July 2024), paras 4.2.37-4.2.40",
      "sourceUrl": "https://www.gov.wales/sites/default/files/publications/2024-07/planning-policy-wales-edition-12.pdf"
    },
    "collectiveForms": [
      {
        "kind": "cooperative",
        "name": "Community benefit society",
        "summary": "The Co-operative and Community Benefit Societies Act 2014 provides the registered society form for co-operatives and community benefit societies; national policy notes that OPD may take the form of co-operative communities.",
        "source": "Co-operative and Community Benefit Societies Act 2014; Planning Policy Wales Edition 12 para 4.2.39",
        "sourceUrl": "https://www.legislation.gov.uk/ukpga/2014/14/contents"
      }
    ],
    "firstClaim": [
      "No statutory pre-emption holder on sales of rural land was identified in the sources opened."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Decide which planning route a new home on the land would use: One Planet Development, or a rural enterprise dwelling with a conclusive appraisal of need.",
        "who": "Local planning authority (Pembrokeshire County Council, or the Pembrokeshire Coast National Park Authority inside the park)",
        "source": "Planning Policy Wales Edition 12, paras 4.2.37-4.2.40",
        "sourceUrl": "https://www.gov.wales/sites/default/files/publications/2024-07/planning-policy-wales-edition-12.pdf"
      },
      {
        "n": 2,
        "what": "Prepare the first management plan with an ecological footprint analysis, showing how the land will meet the residents' minimum food and income needs (at least 65% of basic food needs from the site, or at least 30% grown on site with the rest bartered or bought from site income), energy and waste assimilation.",
        "who": "The applicants with a competent person; the plan accompanies the planning application",
        "source": "Welsh Government OPD practice guidance (TAN 6), paras 2.22, 3.17, 3.24-3.25",
        "sourceUrl": "https://www.gov.wales/sites/default/files/publications/2019-06/planning-permission-one-planet-developments-in-open-countryside.pdf",
        "duration": {
          "text": "The minimum needs must be met within no more than five years of starting work on the site",
          "source": "Planning Policy Wales Edition 12 para 4.2.40",
          "sourceUrl": "https://www.gov.wales/sites/default/files/publications/2024-07/planning-policy-wales-edition-12.pdf"
        }
      },
      {
        "n": 3,
        "what": "Submit the planning application; where permission is granted, planning conditions or a section 106 legal agreement tie the management plan to the permission and the dwelling to the land.",
        "who": "Local planning authority",
        "source": "Welsh Government OPD practice guidance (TAN 6), control and monitoring of approved developments",
        "sourceUrl": "https://www.gov.wales/sites/default/files/publications/2019-06/planning-permission-one-planet-developments-in-open-countryside.pdf"
      },
      {
        "n": 4,
        "what": "Report annually and revise the management plan on the guidance's review cycle, with an exit strategy as part of the monitoring framework.",
        "who": "The occupants, monitored by the local planning authority",
        "source": "Welsh Government OPD practice guidance (TAN 6), section 5 (phasing, monitoring and exit strategy)",
        "sourceUrl": "https://www.gov.wales/sites/default/files/publications/2019-06/planning-permission-one-planet-developments-in-open-countryside.pdf",
        "duration": {
          "text": "Subsequent management plans are produced once every five years",
          "source": "Welsh Government OPD practice guidance (TAN 6), contents (subsequent management plans)",
          "sourceUrl": "https://www.gov.wales/sites/default/files/publications/2019-06/planning-permission-one-planet-developments-in-open-countryside.pdf"
        }
      }
    ],
    "ruledOut": [
      "Buying land in the open countryside does not carry a right to build a home: an OPD proposal that cannot show minimum needs is judged against the policies that control open-countryside development (Planning Policy Wales para 4.2.40).",
      "A dwelling may not be separated from the land of an OPD: the guidance uses section 106 agreements to tie them together, because separation removes the justification for the development."
    ],
    "direction": "tightening",
    "directionNote": "The OPD policy text now sits in Planning Policy Wales Edition 12 (July 2024) and no change to its tests was found; from 6 April 2026 100% inheritance-tax relief for agricultural and business property is limited to a combined GBP 2.5 million allowance (50% above it), which bears on succession planning for farm holdings.",
    "gaps": [
      "Whether individuals who are not UK nationals can own land in Wales on equal terms was not confirmed in an opened primary source beyond the absence of a restriction.",
      "Immigration permission to live in the UK, which the dossier says a non-UK buyer needs, was not opened.",
      "Pembrokeshire County Council's and the National Park's own local development plan policies were not read; only the national policy and practice guidance were.",
      "The dossier's count of approved OPD sites is not verified here, and approvals are not counted as communities.",
      "Whether the Housing and Regeneration Act 2008 community land trust form is available was not confirmed (the opened section page did not carry the term)."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "quebec-eastern-townships": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "restricted",
      "summary": "Farm land is the gate. The Act respecting the acquisition of farm land by non-residents (chapter A-4.1) covers farm land of four hectares or more, and Bill 86 (2025, c. 5, assented 25 March 2025) lets the government lower that threshold by regulation, widens the criteria the Commission applies (including whether the buyer will carry out an agricultural project and the concentration of farm land ownership), and brings in authorization where a non-resident acquires shares in a corporation one of whose assets is farm land. Separately, investment funds have been barred from acquiring farm land since 5 December 2024 until a regulation is made, and further authorization triggers in the new section 79.0.6 depend on decrees and regulations.",
      "source": "Bill 86, An Act to ensure the long-term preservation and vitality of agricultural land (SQ 2025, c. 5), official text from Publications du Québec",
      "sourceUrl": "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF"
    },
    "residency": {
      "link": "residency_required",
      "summary": "For farm land of four hectares or more, living in Québec is the line between a purchase that needs the Commission's authorization and one that does not: the Act is written around persons who do not reside in Québec. Non-residents can apply, and Bill 86 widened what the Commission weighs, so this is a conditional gate rather than a bar.",
      "source": "Bill 86 amendments to the Act respecting the acquisition of farm land by non-residents (ss. 1, 2 and 7)",
      "sourceUrl": "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "Land in the protected agricultural zone is regulated by the Commission de protection du territoire agricole (CPTAQ): authorizations exist for uses other than agriculture, subdivision, felling of maple trees, acquisition and alienation, and Bill 86 sets when such decisions lapse. Any home or community on farm land is therefore decided on its own facts, in addition to municipal zoning.",
      "source": "Bill 86 explanatory notes (Commission decisions on non-agricultural use, subdivision and acquisition)",
      "sourceUrl": "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF"
    },
    "collectiveForms": [],
    "firstClaim": [
      "The Commission de protection du territoire agricole authorizes acquisitions of farm land that fall under the non-resident Act or under section 79.0.6 of the Act respecting the preservation of agricultural land and agricultural activities; it must hear the applicant and any interested person before deciding."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Find out whether the lot is farm land in the protected agricultural zone, how large it is (four hectares or more brings in the non-resident Act), and whether it sits in a designated agricultural region or reserved area, where the section 79.0.6 prohibitions also apply.",
        "who": "Commission de protection du territoire agricole and the regional county municipality; a Québec notary or lawyer",
        "source": "Bill 86, amendments to A-4.1 s. 1 (farm land definition) and new s. 79.0.8 of the Act respecting the preservation of agricultural land",
        "sourceUrl": "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF"
      },
      {
        "n": 2,
        "what": "If a buyer does not reside in Québec, or will acquire shares in a corporation that owns farm land, plan an application for the Commission's authorization, built around a credible agricultural project; the Commission now also weighs soil capability, the possible agricultural uses of the land, and how concentrated farm land ownership is for the next generation of farmers.",
        "who": "Commission de protection du territoire agricole",
        "source": "Bill 86, amendments to A-4.1 ss. 2 and 7 (amended s. 16 criteria)",
        "sourceUrl": "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF"
      },
      {
        "n": 3,
        "what": "Check the section 79.0.6 triggers for any buyer, including a corporation or trust: investment funds, acquirers that are not a registered farm operation buying within 1,000 metres of an urbanization perimeter in areas designated by decree, and acquirers whose holdings would pass a cap set by regulation. A buyer who would be affected should plan for an application with an affidavit that it will register an agricultural operation.",
        "who": "Commission de protection du territoire agricole; a Québec lawyer",
        "source": "Bill 86, new ss. 79.0.5, 79.0.6 and 79.0.9 of the Act respecting the preservation of agricultural land",
        "sourceUrl": "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF",
        "duration": {
          "text": "Before an unfavourable decision the Commission must notify the applicant in writing and allow at least 10 days to present observations.",
          "source": "Bill 86, new s. 79.0.10 of the Act respecting the preservation of agricultural land",
          "sourceUrl": "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF"
        }
      },
      {
        "n": 4,
        "what": "Check the federal rule for any non-Canadian buyer: the federal ban on buying residential property applies only inside census metropolitan areas and census agglomerations, so a rural parcel outside them is a prescribed exclusion, but it does not displace the provincial farm land rules above.",
        "who": "Federal regime (Justice Laws text); a lawyer to confirm the parcel's location",
        "source": "Prohibition on the Purchase of Residential Property by Non-Canadians Regulations (SOR/2022-250), s. 3",
        "sourceUrl": "https://laws-lois.justice.gc.ca/eng/regulations/SOR-2022-250/FullText.html"
      }
    ],
    "ruledOut": [
      "Investment funds, as defined in the Securities Act, may not acquire farm land: the prohibition applies from 5 December 2024 until the government makes a regulation.",
      "A person who is not subject to the section 79.0.6 prohibitions may not, without the Commission's authorization, acquire farm land in the name or on behalf of a person who is subject to them."
    ],
    "direction": "tightening",
    "directionNote": "Bill 86 (2025, c. 5) came into force on 25 March 2025 except provisions that wait on the first regulations: the holding-cap trigger in s. 79.0.6, ss. 79.0.1 and 79.0.2, and the monetary penalties regime. Which regional county municipalities fall in the designated groups for the 1,000-metre trigger was not found.",
    "gaps": [
      "The Québec statute portal (LégisQuébec) returned an error from this sandbox and the CPTAQ site did not resolve, so the consolidated Acts P-41.1 and A-4.1 and any decree or regulation under Bill 86 were not read; the entry rests on the official text of Bill 86 and the National Assembly's bill page.",
      "The dossier's '12 to 36 months' for CPTAQ applications has no source and is not carried; no processing time was found.",
      "Whether Estrie regional county municipalities are in the decree groups for the 1,000-metre trigger, and the holding cap, were not found, so Bill 86 should not be read as gating most purchases.",
      "Notarial deed requirements, the Civil Code forms for collective holding (trust, emphyteusis, social-utility trust), the cooperatives act and the language-of-documents rule were not opened and are not listed.",
      "The earlier A-4.1 test that authorization is granted where the buyer declares an intent to become a Québec resident was not re-read in the current text and is not carried.",
      "Penalty amounts under Bill 86 were not confirmed: the monetary penalties section waits on a first regulation."
    ],
    "confidence": "low",
    "verifiedOn": "2026-10-05"
  },
  "saxony-anhalt": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open_with_conditions",
      "summary": "No nationality restriction on owning land was found in the federal provisions opened. The sale of an agricultural or forest plot, to anyone, needs the approval of the farmland authority, which may refuse or condition it only on specific grounds, among them an unhealthy distribution of land, an uneconomic reduction or division of holdings, or a grossly disproportionate price. The Länder may set a size below which no approval is needed; Saxony-Anhalt's threshold was not found.",
      "source": "Grundstückverkehrsgesetz (GrdstVG) §§ 1, 2 and 9 (gesetze-im-internet.de)",
      "sourceUrl": "https://www.gesetze-im-internet.de/grdstvg/__9.html"
    },
    "residency": {
      "link": "unknown",
      "summary": "Whether owning land in Saxony-Anhalt carries any residence right was not covered by a source opened for this entry; the GrdstVG approval grounds opened do not mention nationality or residence.",
      "source": "Grundstückverkehrsgesetz (GrdstVG) § 9",
      "sourceUrl": "https://www.gesetze-im-internet.de/grdstvg/__9.html"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "In open countryside (Außenbereich) a building project is permissible only if public interests do not stand against it, access is secured, and it falls in a privileged category, such as serving a farm or forestry business and taking up only a subordinate part of the holding's land, or needing the open countryside for its particular requirements. Other projects are decided case by case under the remaining paragraphs of § 35 BauGB, which were not read.",
      "source": "Baugesetzbuch (BauGB) § 35(1)",
      "sourceUrl": "https://www.gesetze-im-internet.de/bbaug/__35.html"
    },
    "collectiveForms": [
      {
        "kind": "cooperative",
        "name": "Eingetragene Genossenschaft (eG)",
        "summary": "A society of open membership that promotes its members' economic, social or cultural interests through a joint business (Genossenschaftsgesetz § 1).",
        "source": "Genossenschaftsgesetz (GenG) § 1",
        "sourceUrl": "https://www.gesetze-im-internet.de/geng/__1.html"
      },
      {
        "kind": "association",
        "name": "Eingetragener Verein (e.V.)",
        "summary": "An association whose purpose is not an economic business acquires legal capacity by entry in the register of associations (BGB § 21).",
        "source": "Bürgerliches Gesetzbuch (BGB) § 21",
        "sourceUrl": "https://www.gesetze-im-internet.de/bgb/__21.html"
      }
    ],
    "firstClaim": [
      "The non-profit settlement company of the district holds a right of first refusal on a sale of agricultural land of two hectares or more when the sale needs approval under the GrdstVG and the farmland authority would have to refuse it under § 9; no such right applies to sales to public bodies, spouses, relatives to the third degree in the side line or in-laws to the second degree. A Land may raise the minimum size above two hectares (Reichssiedlungsgesetz § 4)."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Establish whether the plot is agricultural or forest land, or moor or waste land that could be brought into cultivation, because only then does the GrdstVG approval regime apply.",
        "who": "Land register and the farmland authority (Genehmigungsbehörde)",
        "source": "Grundstückverkehrsgesetz § 1",
        "sourceUrl": "https://www.gesetze-im-internet.de/grdstvg/__1.html"
      },
      {
        "n": 2,
        "what": "Have the sale contract approved: the authority may refuse or condition approval only on the grounds listed in § 9, so a buyer's land-use concept should address distribution of land, viability of holdings and price.",
        "who": "Farmland authority (Genehmigungsbehörde)",
        "source": "Grundstückverkehrsgesetz §§ 2 and 9",
        "sourceUrl": "https://www.gesetze-im-internet.de/grdstvg/__9.html",
        "duration": {
          "text": "The decision is due within one month of the application and the contract; an interim notice extends this to two months, or three where the pre-emption declaration must be obtained, and approval is deemed given if no decision is served in time",
          "source": "Grundstückverkehrsgesetz § 6(1) and (2)",
          "sourceUrl": "https://www.gesetze-im-internet.de/grdstvg/__6.html"
        }
      },
      {
        "n": 3,
        "what": "For plots of two hectares or more, expect the settlement company's right of first refusal to be checked where approval would otherwise be refused.",
        "who": "Gemeinnütziges Siedlungsunternehmen of the district",
        "source": "Reichssiedlungsgesetz § 4(1)",
        "sourceUrl": "https://www.gesetze-im-internet.de/rsiedlg/__4.html"
      },
      {
        "n": 4,
        "what": "Before buying for a dwelling in open countryside, check whether any privileged use under § 35(1) BauGB can carry the project, since other building there is the exception.",
        "who": "Municipality and local building authority",
        "source": "Baugesetzbuch § 35(1)",
        "sourceUrl": "https://www.gesetze-im-internet.de/bbaug/__35.html"
      },
      {
        "n": 5,
        "what": "Choose the holding body for the group, such as a co-operative or a registered association, before the contract.",
        "who": "The founding group",
        "source": "Genossenschaftsgesetz § 1; BGB § 21",
        "sourceUrl": "https://www.gesetze-im-internet.de/geng/__1.html"
      }
    ],
    "ruledOut": [
      "The farmland authority's power to refuse is limited to the grounds in § 9 GrdstVG; where the plot is sold for non-agricultural purposes the price ground may not be used (§ 9(4)).",
      "A sale of agricultural land can be blocked or conditioned where it would mean an unhealthy distribution of land, so approval is not automatic for a buyer with no farming role (GrdstVG § 9(1) and (2))."
    ],
    "direction": "stable",
    "directionNote": "No change to the federal approval and pre-emption rules was found in the provisions opened; a Saxony-Anhalt agrarian-structure law was reported as pending and its status was not verified.",
    "gaps": [
      "A Saxony-Anhalt Agrarstrukturgesetz was reported in 2026 research as pending; its enactment status was not verified and no rule is taken from it.",
      "The Saxony-Anhalt size threshold below which no GrdstVG approval is needed (GrdstVG § 2(3)) was not found, and the dossier's 'about 1 ha' is not repeated.",
      "Which body is the designated settlement company for Saxony-Anhalt under the Reichssiedlungsgesetz was not confirmed; the Landgesellschaft Sachsen-Anhalt describes itself as acting for the Land on rural structure but its page does not name the pre-emption right.",
      "The BVVG wind-down date from the dossier (sales 2024-2030) could not be confirmed and is not stated.",
      "Residence routes and the right of a foreign buyer to live in Germany were not opened.",
      "The remaining paragraphs of § 35 BauGB (non-privileged projects) and Saxony-Anhalt's building code were not read."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "scottish-highlands": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "No nationality or residency bar on owning land was found in the Land Reform (Scotland) Act 2025: Parts 1 and 2, which hold its land-holding and leasing rules, were searched for 'nationality', 'foreign' and 'overseas' and none appears. The residence duty that does exist belongs to crofts, not to land in general: a crofter, tenant or owner-occupier, must be ordinarily resident on or within 32 kilometres of the croft and must cultivate and maintain it.",
      "source": "Land Reform (Scotland) Act 2025 (asp 15), Parts 1 and 2 (legislation.gov.uk); Crofting Commission, Crofters' duties",
      "sourceUrl": "https://www.legislation.gov.uk/asp/2025/15/part/1"
    },
    "residency": {
      "link": "residency_required",
      "summary": "For a croft, the land asks you to live there: the crofter's duties are residence on or within 32 kilometres of the croft and active use of it, whether the crofter is a tenant or an owner-occupier. For other land, nothing opened ties ownership to residence. Whether any UK immigration route follows from holding land was not opened.",
      "source": "Crofting Commission, Crofters' duties",
      "sourceUrl": "https://www.crofting.scotland.gov.uk/crofters-duties-2/"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "A new rural home needs planning permission from the council and is judged under National Planning Framework 4 Policy 17: supported on sites allocated for housing in the local development plan, on reused brownfield land or buildings, where a viable rural business or croft needs a worker to live there, and, in remote rural areas, where the home supports an existing fragile community and identified local housing outcomes. Plans are asked to provide for small-scale housing such as crofts and woodland crofts and the resettlement of previously inhabited areas.",
      "source": "Scottish Government, National Planning Framework 4, Policy 17 Rural homes",
      "sourceUrl": "https://www.gov.scot/binaries/content/documents/govscot/publications/strategy-plan/2023/02/national-planning-framework-4/documents/national-planning-framework-4-revised-draft/national-planning-framework-4-revised-draft/govscot%3Adocument/national-planning-framework-4.pdf"
    },
    "collectiveForms": [
      {
        "kind": "company",
        "name": "Community body (company limited by guarantee or SCIO)",
        "summary": "The body that can use the community right to buy: its articles define the community it serves, it has at least ten members, at least three quarters of its members come from the community, community members control it, and surplus funds and assets go to community benefit. It holds land for a place and its residents, not for a newcomer group.",
        "source": "Land Reform (Scotland) Act 2003 s.34 (Community bodies)",
        "sourceUrl": "https://www.legislation.gov.uk/asp/2003/2/section/34"
      },
      {
        "kind": "other",
        "name": "Rural housing body and rural housing burden",
        "summary": "A rural housing body can hold a pre-emption right over rural land through a real burden, which is how a community landowner can keep a plot or house available for local residents; the Knoydart Foundation names its Rural Housing Burden scheme and rental homes among what it does.",
        "source": "Title Conditions (Scotland) Act 2003 s.43; Knoydart Foundation, About us",
        "sourceUrl": "https://www.legislation.gov.uk/asp/2003/9/section/43"
      }
    ],
    "firstClaim": [
      "A registered community body holds the first right of refusal once the landowner decides to sell land over which it has registered an interest (Land Reform (Scotland) Act 2003 Part 2).",
      "Crofting communities hold a compulsory right to buy the croft land where they live and work, exercisable at any time (Part 3); communities can also apply to buy abandoned, neglected or detrimental land (Part 3A) and land to further sustainable development (Part 5 of the 2016 Act); these are compulsory purchases.",
      "A rural housing body can hold a pre-emption right over rural land under a rural housing burden (Title Conditions (Scotland) Act 2003 s.43).",
      "A croft tenancy cannot be assigned without the consent of the Crofting Commission (Crofters (Scotland) Act 1993 s.8)."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Start with the community that already owns or holds the land, not with the land: ask the community landowner what housing, croft or plot policy it publishes and whether it is taking anyone on. Knoydart Foundation says it offers rental homes and a Rural Housing Burden scheme; the others named in the dossier publish housing projects, not allocation rules for incomers.",
        "who": "The community body that owns the estate (for example the Knoydart Foundation)",
        "source": "Knoydart Foundation, About us",
        "sourceUrl": "https://knoydart.org/about-us/"
      },
      {
        "n": 2,
        "what": "Apply for rented housing through the council register. Anyone aged 16 or over can apply; the council gives priority to people who are homeless or at risk, in unsuitable housing or with a medical or support need, and allocates by a points system.",
        "who": "Highland Council housing service",
        "source": "Highland Council, Apply for a house",
        "sourceUrl": "https://www.highland.gov.uk/council-social-housing/apply-house"
      },
      {
        "n": 3,
        "what": "If a croft is in view, ask the Crofting Commission what the tenancy involves: an assignation of a croft tenancy needs its consent, and the residence and use duties come with the croft. Common grazings are shared areas used by several crofters and others with a right to graze, managed through grazings committees, so they are shared use rather than a parcel on offer.",
        "who": "Crofting Commission",
        "source": "Crofters (Scotland) Act 1993 s.8; Crofting Commission, Crofters' duties",
        "sourceUrl": "https://www.legislation.gov.uk/ukpga/1993/44/section/8"
      },
      {
        "n": 4,
        "what": "Before any offer on a house or plot, check whether a community right to buy is registered over it; applications under Part 2 are on the Register of Community Interests in Land, held by Registers of Scotland, and Part 3 applications are held by the Crofting Commission.",
        "who": "Registers of Scotland (Register of Community Interests in Land); Crofting Commission",
        "source": "Scottish Government, Community rights to buy: overview",
        "sourceUrl": "https://www.gov.scot/publications/community-rights-to-buy-overview/"
      },
      {
        "n": 5,
        "what": "Ask the council planning authority whether a home on the site is supportable under the local development plan and Policy 17 before committing money; a home needs a reason the policy recognises, such as a croft or rural business need, reuse of a building, an allocated site, or a remote rural area where it supports a fragile community.",
        "who": "Highland Council planning authority",
        "source": "National Planning Framework 4, Policy 17 Rural homes",
        "sourceUrl": "https://www.gov.scot/binaries/content/documents/govscot/publications/strategy-plan/2023/02/national-planning-framework-4/documents/national-planning-framework-4-revised-draft/national-planning-framework-4-revised-draft/govscot%3Adocument/national-planning-framework-4.pdf"
      }
    ],
    "ruledOut": [
      "Statutory community rights to buy belong to communities, not to newcomers or groups arriving from elsewhere: the rights are for a defined community body, and the crofting right to buy is for crofting communities (Land Reform (Scotland) Act 2003 Parts 2 and 3).",
      "A croft tenancy cannot be handed on without the Crofting Commission's consent, and the residence and use duties stay with the croft (Crofters (Scotland) Act 1993 s.8).",
      "A new home in the countryside is not permitted as of right: it must meet one of the Policy 17 supports."
    ],
    "direction": "tightening",
    "directionNote": "The Land Reform (Scotland) Act 2025 (asp 15) received Royal Assent on 16 December 2025 and adds duties on large land holdings (community-engagement obligations, a registration of community interest in a large holding, lotting) and model leases; its section 47 brings Part 3 and section 11 into force the next day and leaves the other provisions to regulations. Commencement of the Part 1 duties was not checked provision by provision, so none of them is relied on here.",
    "gaps": [
      "Which community landowners in the footprint accept incomers, and on what terms, was not found in any opened source: Knoydart's page names rental homes and a Rural Housing Burden scheme but not an allocation rule for newcomers; Community Land Scotland's FAQ (open membership, defined area, national acreage and asset counts) returned HTTP 429 to every request and was not opened, so those figures are left out.",
      "Whether any UK immigration route follows from holding land or a croft was not opened.",
      "The Registers of Scotland pages (Register of Community Interests in Land, Crofting Register) block scripted requests and were not opened.",
      "The local development plan for the three Highland wards was not read, so which sites are allocated for housing or crofting resettlement is unknown.",
      "The commencement status of the Part 1 duties of the 2025 Act was not checked.",
      "No land-price source for a croft or house plot was opened; the dossier's land series is for estates and farmland, not the housing that is the real gate."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "south-tirol": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open_with_conditions",
      "summary": "The provincial closed-farm law (LP 17/2001) sets no nationality bar, but since 2025 any purchase of a designated closed farm (maso chiuso) by a transaction between living persons needs authorisation from the local closed-farm commission. The buyer must be a full-time farmer, work professionally in agriculture or show earlier agricultural work experience, and hold a training title, diploma or young-farmer course certificate (equivalent titles from other EU or non-EU states count); gifts, sales between spouses or relatives to the third degree and a few other cases are exempt. Land that is not part of a closed farm is outside this rule. The general Italian reciprocity rule for foreign buyers was not opened.",
      "source": "Legge provinciale 28 novembre 2001, n. 17 (Legge sui masi chiusi), art. 6-bis, inserted by LP 17 June 2025, n. 6",
      "sourceUrl": "https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17%c2%a750%c2%a790/legge_provinciale_28_novembre_2001_n_17/capo_2_limitazioni_della_facolt%C3%A0_di_disporre_del_proprietario_o_della_proprietaria_del_maso_chiuso/art_6_bis_autorizzazione_all_acquisto_di_un_maso_chiuso.aspx"
    },
    "residency": {
      "link": "unknown",
      "summary": "Whether owning land in South Tirol carries any residence right was not covered by a source opened for this entry. The farm-purchase test in art. 6-bis asks about farming practice and training, not about residence.",
      "source": "Legge provinciale 28 novembre 2001, n. 17, art. 6-bis",
      "sourceUrl": "https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17%c2%a750%c2%a790/legge_provinciale_28_novembre_2001_n_17/capo_2_limitazioni_della_facolt%C3%A0_di_disporre_del_proprietario_o_della_proprietaria_del_maso_chiuso/art_6_bis_autorizzazione_all_acquisto_di_un_maso_chiuso.aspx"
    },
    "zoning": {
      "route": "unknown",
      "summary": "The provincial planning rules for dwellings on rural land (Landesgesetz Raum und Landschaft, LP 9/2018) were not opened, so no building route is described. What the closed-farm law opened here adds: any change to the extent of a closed farm needs commission authorisation, none may be given if it prejudices the running of the farm, and a lease or right of superficies longer than 15 years also needs authorisation.",
      "source": "Legge provinciale 28 novembre 2001, n. 17, art. 4",
      "sourceUrl": "https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17%c2%a750%c2%a760/legge_provinciale_28_novembre_2001_n_17/capo_2_limitazioni_della_facolt%C3%A0_di_disporre_del_proprietario_o_della_proprietaria_del_maso_chiuso/span_art_4_modificazioni_della_consistenza_di_un_maso_chiuso_span.aspx"
    },
    "collectiveForms": [],
    "firstClaim": [
      "On the sale of a closed farm, a tenant farmer (coltivatore diretto), even of only part of the farm, holds a right of pre-emption; working family members who live on the farm hold one when it is sold to people related beyond the second degree; and for farmland adjoining a closed farm the owner-farmer of the closed farm holds the pre-emption right of Law 817/1971 (LP 17/2001 art. 10)."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Find out whether the land belongs to a designated closed farm (maso chiuso); if it does, the closed-farm regime governs any purchase, detachment and long lease.",
        "who": "Local closed-farm commission (commissione locale per i masi chiusi) and the land register",
        "source": "Legge provinciale 17/2001 arts. 4 and 6-bis",
        "sourceUrl": "https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17%c2%a750%c2%a790/legge_provinciale_28_novembre_2001_n_17/capo_2_limitazioni_della_facolt%C3%A0_di_disporre_del_proprietario_o_della_proprietaria_del_maso_chiuso/art_6_bis_autorizzazione_all_acquisto_di_un_maso_chiuso.aspx"
      },
      {
        "n": 2,
        "what": "To buy a closed farm, apply for the commission's authorisation with proof of farming status or professional experience and of an agricultural training title or course certificate.",
        "who": "Local closed-farm commission",
        "source": "Legge provinciale 17/2001 art. 6-bis(1)-(3)",
        "sourceUrl": "https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17%c2%a750%c2%a790/legge_provinciale_28_novembre_2001_n_17/capo_2_limitazioni_della_facolt%C3%A0_di_disporre_del_proprietario_o_della_proprietaria_del_maso_chiuso/art_6_bis_autorizzazione_all_acquisto_di_un_maso_chiuso.aspx"
      },
      {
        "n": 3,
        "what": "Expect the pre-emption holders of art. 10 (tenant farmers, working family members, neighbouring closed-farm owners) to be notified of the sale proposal first.",
        "who": "Seller, tenant farmers, working family members and neighbouring closed-farm owners",
        "source": "Legge provinciale 17/2001 art. 10",
        "sourceUrl": "https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17%c2%a7130%c2%a7140/legge_provinciale_28_novembre_2001_n_17/capo_3_diritto_di_prelazione_sul_maso_chiuso/span_art_10_diritto_di_prelazione_a_favore_di_affittuari_o_di_affittuarie_span.aspx"
      },
      {
        "n": 4,
        "what": "For a long-term arrangement on a closed farm instead of a purchase, a lease or right of superficies longer than 15 years needs the commission's authorisation; changes to the extent of the farm need it as well.",
        "who": "Local closed-farm commission",
        "source": "Legge provinciale 17/2001 art. 4(1)",
        "sourceUrl": "https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17%c2%a750%c2%a760/legge_provinciale_28_novembre_2001_n_17/capo_2_limitazioni_della_facolt%C3%A0_di_disporre_del_proprietario_o_della_proprietaria_del_maso_chiuso/span_art_4_modificazioni_della_consistenza_di_un_maso_chiuso_span.aspx",
        "duration": {
          "text": "Leases and rights of superficies longer than 15 years need the commission's authorisation",
          "source": "Legge provinciale 17/2001 art. 4(1)",
          "sourceUrl": "https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17%c2%a750%c2%a760/legge_provinciale_28_novembre_2001_n_17/capo_2_limitazioni_della_facolt%C3%A0_di_disporre_del_proprietario_o_della_proprietaria_del_maso_chiuso/span_art_4_modificazioni_della_consistenza_di_un_maso_chiuso_span.aspx"
        }
      }
    ],
    "ruledOut": [
      "A closed farm cannot simply be divided: no authorisation to change its extent may be given where it would prejudice the running of the farm or leave too few buildings for normal operation (LP 17/2001 art. 4(1-bis)).",
      "A buyer without farming status or experience and without the training title cannot obtain the commission's authorisation to buy a closed farm (art. 6-bis(2))."
    ],
    "direction": "unknown",
    "directionNote": "Buyers of a closed farm have needed commission authorisation and a farming qualification since 2025 (art. 6-bis, inserted by LP 6/2025), which tightens the earlier rules; no other change was assessed, so the direction is not summarised as a single word here.",
    "gaps": [
      "The provincial planning law for dwellings on rural land (LP 9/2018) was not opened, so the zoning route is unknown.",
      "The general Italian reciprocity rule for foreign buyers (disposizioni sulla legge in generale, art. 16) cited in the dossier was not opened.",
      "Whether owning land carries a residence right was not covered, and the dossier's 'conventioned housing' residence-occupancy rules were not opened.",
      "Collective ownership forms (cooperatives, associations, companies) and the commons forms of the dossier were not found in an opened primary source and are not listed.",
      "The implementing regulation of 11 September 2025 (DPP 25/2025) was not read, so the exact documents for the training proof are unknown.",
      "Art. 8 of the 1965 law on the pre-emption procedure and notice periods was not opened."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "southern-appalachians": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "No North Carolina statute restricting foreign or non-resident purchase of private land was found: the National Agricultural Law Center (updated June 2026) lists about 29 states with such laws and North Carolina is not among them. Foreign persons who acquire a significant interest in US agricultural land must still file a federal AFIDA disclosure.",
      "source": "National Agricultural Law Center, Foreign Ownership FAQ (updated 26 June 2026); USDA FSA AFIDA page",
      "sourceUrl": "https://nationalaglawcenter.org/foreign-investments-in-ag/"
    },
    "residency": {
      "link": "no_link",
      "summary": "The sources opened show no residency or citizenship test for buying private land in North Carolina. One tax route does turn on residence: for an individual, land generally qualifies for present-use-value tax treatment only if it is the owner's residence or was acquired by the owner or a relative a full four years before 1 January of the enrolment year.",
      "source": "North Carolina Cooperative Extension, Agricultural and Environmental Law: Present Use Value basics",
      "sourceUrl": "https://farmlaw.ces.ncsu.edu/land-use-and-zoning/present-use-value-the-basics-of-agricultural-and-forest-use-property-tax/"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "Land use is handled county by county rather than by one state code. For example, Madison County lists Development Services with building inspections and planning and zoning. What a given county requires for several dwellings on one parcel has to be asked of that county before purchase.",
      "source": "Madison County, North Carolina, departments page",
      "sourceUrl": "https://www.madisoncountync.gov/departments.html"
    },
    "collectiveForms": [
      {
        "kind": "land_trust",
        "name": "Conservation land trust partner (Conserving Carolina)",
        "summary": "Conserving Carolina describes itself as a land trust serving Western North Carolina and the South Carolina Upstate; a land trust can hold or monitor a conservation arrangement on land a community owns.",
        "source": "Conserving Carolina, home page",
        "sourceUrl": "https://conservingcarolina.org/"
      },
      {
        "kind": "land_trust",
        "name": "Conservation easements through the Southern Appalachian Highlands Conservancy",
        "summary": "The Conservancy's site has a Protect Your Land section and a Farmland Program for landowners who want land protected.",
        "source": "Southern Appalachian Highlands Conservancy, home page",
        "sourceUrl": "https://appalachian.org/"
      }
    ],
    "firstClaim": [
      "No statutory pre-emption or first-refusal holder over private rural land was identified in the sources opened. The county tax office decides whether land qualifies for present-use-value treatment."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Ask the county's planning and zoning and building inspection offices whether the parcel is zoned, what a dwelling or several dwellings need, and whether a subdivision or access rule applies, before making an offer.",
        "who": "County planning and zoning office and building inspections office (for example Madison County Development Services)",
        "source": "Madison County, North Carolina, departments page (Development Services: building inspections, planning and zoning)",
        "sourceUrl": "https://www.madisoncountync.gov/departments.html"
      },
      {
        "n": 2,
        "what": "Before contracting, find out whether the land is enrolled in present-use-value tax treatment and whether it would still qualify in your hands; land that does not qualify cannot be carried forward by a continued-use application, and deferred taxes can come due.",
        "who": "County tax office (assessor)",
        "source": "North Carolina Cooperative Extension, Present Use Value basics (qualified owner, sound management, requisite size; deferred taxes limited to three years)",
        "sourceUrl": "https://farmlaw.ces.ncsu.edu/land-use-and-zoning/present-use-value-the-basics-of-agricultural-and-forest-use-property-tax/"
      },
      {
        "n": 3,
        "what": "If the land is enrolled and will continue to qualify, file the continued-use application (form AV-4) with the county tax office; counties can apply their own enrolment deadlines and good-cause rules, so ask the county for its dates.",
        "who": "County tax office",
        "source": "North Carolina Cooperative Extension, Present Use Value basics (continued use application AV-4; county deadlines differ)",
        "sourceUrl": "https://farmlaw.ces.ncsu.edu/land-use-and-zoning/present-use-value-the-basics-of-agricultural-and-forest-use-property-tax/"
      },
      {
        "n": 4,
        "what": "If the community wants the land protected over the long term, talk with a regional land trust about a conservation easement or farmland programme before the purchase closes.",
        "who": "Regional land trust (for example Conserving Carolina or the Southern Appalachian Highlands Conservancy)",
        "source": "Southern Appalachian Highlands Conservancy, Protect Your Land and Farmland Program pages",
        "sourceUrl": "https://appalachian.org/"
      }
    ],
    "ruledOut": [
      "Present-use-value treatment does not extend to buildings: improvements are valued at their true value, and a building used for residential purposes disqualifies that portion of the tract, which counties usually carve out with the structure.",
      "Present-use-value status does not come with the sale automatically: it can be lost if the new owner or the land does not meet the programme's tests, and the county then collects the deferred taxes for up to three years."
    ],
    "direction": "stable",
    "directionNote": "No North Carolina private-land foreign-ownership law appears in the National Agricultural Law Center's June 2026 list. A foreign-adversary land bill (HB 463) flagged in the 2026-07 research was not confirmed either way from a primary source.",
    "gaps": [
      "The North Carolina General Assembly site returns an access block from this sandbox, so statute text (Chapter 105 present-use-value sections, county zoning and subdivision enabling law) was not read; present-use-value rules come from the NC State Extension law specialist's explainer.",
      "Which Western North Carolina counties zone rural land, and how each treats multi-household communities, was not sourced; only an example county office listing was opened. The dossier statement that several mountain counties have little or no zoning outside floodplains is not carried.",
      "The dossier's 60-day filing deadline for the continued-use form (AV-4) was not confirmed; the Extension explainer says counties can set their own enrolment deadlines.",
      "The status of HB 463 (foreign-adversary land bill) was not confirmed from a primary source.",
      "Collective-ownership forms under North Carolina statute (LLC, limited partnership, cooperative, housing cooperative) were not opened; only land-trust organisations are listed.",
      "Conservation easement tax treatment (federal charitable deduction) was not opened and is not claimed."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "teruel-uplands": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "Foreigners enjoy the same civil rights as Spaniards in Spain except where special laws or treaties say otherwise (Civil Code art. 27). The special regime is a set of restricted-access zones for foreign buyers: islands, Cartagena, the Strait of Gibraltar, the bay of Cadiz, the Portuguese and French frontier zones, Galicia and the Spanish territories in North Africa, with percentage caps. Annex II of the regulation, which delimits the peninsular zones, names no place in Teruel province. Proposals on non-EU buyers made in 2025-26 were not tracked.",
      "source": "Real Decreto 689/1978 art. 32 and Annex II (BOE consolidated); Ley 8/1975 art. 4; Código Civil art. 27",
      "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-1978-9612"
    },
    "residency": {
      "link": "separate_route",
      "summary": "Buying land does not carry a residence permit in the sources opened. Ley Orgánica 1/2025 emptied articles 63 to 67 of Ley 14/2013, the investor route for acquiring real estate; applications filed earlier can still receive the visa and existing visas keep their validity. Other residence routes were not opened here.",
      "source": "Ley Orgánica 1/2025, de 2 de enero, disposición final vigesimoprimera (BOE)",
      "sourceUrl": "https://www.boe.es/eli/es/lo/2025/01/02/1"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "On generic non-urban land a municipality may allow an isolated single-family house only where its general plan does not forbid it and where no population nucleus can form: by default, two or more residential buildings within a 150 metre radius of the planned building is a nucleus. Then the default conditions are one building per parcel, at most 300 square metres built, and a parcel of at least 10,000 square metres tied to the building and kept in agrarian or natural use. By special authorisation, rehabilitation of buildings in aldeas, barrios or deserted villages, and of bordas, torres and other traditional rural buildings, is allowed with traditional outer form kept, and may change use or divide the building into several dwellings if its size allows. The municipal plan can be stricter.",
      "source": "Decreto Legislativo 1/2014, Ley de Urbanismo de Aragón, arts. 34.2 and 35.1.c (BOE consolidated, last update 31/12/2024)",
      "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOA-d-2014-90410"
    },
    "collectiveForms": [
      {
        "kind": "cooperative",
        "name": "Sociedad cooperativa (Aragón)",
        "summary": "The Aragonese co-operatives law regulates and promotes co-operatives formed and operating in Aragón: societies that associate people for economic and social activities of common interest. It is the sourced collective vehicle here; other forms such as a SAT or an association were not opened.",
        "source": "Decreto Legislativo 2/2014, texto refundido de la Ley de Cooperativas de Aragón, arts. 1 and 2 (BOE)",
        "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOA-d-2014-90375"
      }
    ],
    "firstClaim": [
      "Derecho de abolorio: relatives to the fourth degree by the line the property came down, with the descendants of the seller who hold property of the same origin, may take rustic land and buildings that have stayed in the family for two generations before the seller's, by tanteo (30 natural days from a notified intention to sell) and failing that by retracto after a sale. It outranks every other pre-emption right except that of co-owners and public bodies (Decreto Legislativo 1/2011 arts. 588-590, 594 and 598).",
      "Vacant immovables in Aragón belong by law to the Autonomous Community (Decreto Legislativo 1/2011 art. 598 bis, added by Ley 6/2021)."
    ],
    "steps": [
      {
        "what": "Start with a municipality's own offer and the territorial services, not with a parcel. Pueblos Vivos Aragón gives guidance and accompaniment on housing, work and settling in 11 Aragonese rural comarcas, among them Montañas de Teruel and Sierra de Albarracín, but no financial aid, and it can serve only EU nationals and people with a Spanish work and residence permit. The Serranía Celtibérica repopulation board lists offers: in April 2025 Griegos (Teruel) listed free housing for families that move there and 100 euros a month per school-age child; whether it still stands is for the town hall to confirm.",
        "who": "Pueblos Vivos Aragón; A.D. Serranía Celtibérica (Bolsa de Repoblación); the town hall (ayuntamiento)",
        "source": "Pueblos Vivos Aragón, Cómo te podemos ayudar; A.D. Serranía Celtibérica, Bolsa de Repoblación",
        "sourceUrl": "https://pueblosvivosaragon.com/como-te-podemos-ayudar/",
        "n": 1
      },
      {
        "what": "Before any offer on rustic land or a building, ask whether the property has stayed in one family for two generations: if so a relative of the seller within the fourth degree can take it by tanteo within 30 natural days or by retracto after a sale, and has priority over other pre-emption holders except co-owners and public bodies.",
        "who": "The seller's notary; the registry; the family of the seller",
        "source": "Decreto Legislativo 1/2011, Código del Derecho Foral de Aragón, arts. 588-598",
        "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOA-d-2011-90007",
        "duration": {
          "text": "Tanteo: 30 natural days from the notification; the notification lapses if the sale does not take place within a year",
          "source": "Decreto Legislativo 1/2011 art. 594",
          "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOA-d-2011-90007"
        },
        "n": 2
      },
      {
        "what": "Ask the town hall how the parcel or building is classified and what the municipal plan allows: whether it is generic non-urban land, a núcleo or aldea, or a deserted village, whether a house is possible at all under the 150 metre nucleus test, and whether rehabilitating an old building by special authorisation is open.",
        "who": "Ayuntamiento (urban planning office)",
        "source": "Decreto Legislativo 1/2014 arts. 34.2 and 35.1.c",
        "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOA-d-2014-90410",
        "n": 3
      },
      {
        "what": "For farmland, consider a lease before a purchase: an Aragonese farm lease under the national rural-leases law has a minimum duration of five years, and any shorter term in the contract is void.",
        "who": "The landowner",
        "source": "Ley 49/2003 de Arrendamientos Rústicos, art. 12",
        "sourceUrl": "https://www.boe.es/eli/es/l/2003/11/26/49/con",
        "duration": {
          "text": "Minimum duration five years; a shorter stipulated term is void",
          "source": "Ley 49/2003 art. 12(1)",
          "sourceUrl": "https://www.boe.es/eli/es/l/2003/11/26/49/con"
        },
        "n": 4
      },
      {
        "what": "If the land is a monte, a pasture or part of a historic community (the Comunidad de Albarracín, mancomunidades forestales, comunidades de tierras, pastos y aguas), find out which statutes govern it: such bodies continue under their own statutes, pacts and customary rules, and montes comunales and montes vecinales en mano común are a separate category in the forestry law.",
        "who": "The community or mancomunidad; the town hall; the Gobierno de Aragón forestry service",
        "source": "Ley 7/1999 de Administración Local de Aragón art. 95; Decreto Legislativo 1/2017, Ley de Montes de Aragón",
        "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOE-A-1999-10151",
        "n": 5
      },
      {
        "what": "Choose the holding body for a group before the purchase deed, for example a co-operative under the Aragonese co-operatives law.",
        "who": "The founding group",
        "source": "Decreto Legislativo 2/2014, Ley de Cooperativas de Aragón",
        "sourceUrl": "https://www.boe.es/buscar/act.php?id=BOA-d-2014-90375",
        "n": 6
      }
    ],
    "ruledOut": [
      "A new isolated house is not allowed where a population nucleus can form (two or more residential buildings within a 150 metre radius, by default), and where one is allowed the default limit is one building per parcel of at most 300 square metres built on at least 10,000 square metres tied to it, so a new multi-household settlement on generic non-urban land is not a route (Decreto Legislativo 1/2014 art. 34.2).",
      "Pueblos Vivos Aragón does not give financial aid and has no staff or information for immigration paperwork or arrival from abroad (its own page).",
      "Historic communities and mancomunidades are run under their own statutes and customary rules (Ley 7/1999 art. 95), so a pasture or monte in their area is not simply a parcel on an open market."
    ],
    "direction": "stable",
    "directionNote": "No pending amendment to the Aragonese urban planning law was found in the sources opened: the consolidated text of Decreto Legislativo 1/2014 was last updated on 31 December 2024. Separately, national law removed the investor visa for real-estate purchase in January 2025. Spanish proposals on non-EU buyers made in 2025-26 were not tracked.",
    "gaps": [
      "No municipal plan was read: which of the municipalities in the footprint allow an isolated house, and how each defines núcleo and aldea, is unknown.",
      "Whether a Teruel municipality still offers what the Bolsa de Repoblación page listed (Griegos, April 2025) was not checked; the page also carries private messages with personal contact details, none of which is used, and it lists offers outside Teruel province.",
      "Rural-tenure sources for the footprint stop at the regional statutes (family pre-emption, montes, local-entity law): the commons rules of the Comunidad de Albarracín and of individual montes were not read.",
      "National farm-neighbour and tenant pre-emption (Ley 19/1995 and Ley 49/2003) was not checked; the Aragonese code opened contains no neighbour pre-emption.",
      "The Tramacastilla rental-home figures and the Diputación funding reported in the pre-selection brief were not opened and are not used.",
      "Spanish 2025-26 proposals on non-EU buyers and any later change to Real Decreto 689/1978 were not tracked beyond the BOE consolidated page."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "transylvania": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "restricted",
      "summary": "Citizens of other states and stateless persons living in a third state, and legal persons of a third state, may acquire farmland outside built-up areas (extravilan) only as international treaties provide, on a reciprocity basis; the Constitution sets the same condition for foreign citizens' private ownership of land. Law 17/2014 applies to Romanian, EU, EEA and Swiss citizens and to legal persons of those nationalities, and for them it adds a pre-emption queue and buyer tests for extravilan farmland. Land inside built-up areas (intravilan) is outside Law 17/2014.",
      "source": "Legea nr. 17/2014 art. 2(1)-(3), consolidated form of 03.05.2024 (legislatie.just.ro); Constituția României art. 44(2)",
      "sourceUrl": "https://legislatie.just.ro/Public/DetaliiDocument/156290"
    },
    "residency": {
      "link": "residency_required",
      "summary": "For farmland outside built-up areas, a natural-person buyer who is not a pre-emption holder must have had domicile or residence in Romania, farming activity and Romanian tax registration for at least five years before the sale offer is registered; a company needs a five-year seat, five years of farming and at least 75% of its last five fiscal years' income from agriculture. The conditions apply only when the pre-emption holders do not buy.",
      "source": "Legea nr. 17/2014 art. 4^1(1)-(2)",
      "sourceUrl": "https://legislatie.just.ro/Public/DetaliiDocument/156290"
    },
    "zoning": {
      "route": "unknown",
      "summary": "The building-permit rules for houses on village and rural land were not opened in a primary source for this entry, so no route is described.",
      "source": "Legea nr. 17/2014, art. 2(1) (built-up land sits outside its scope)",
      "sourceUrl": "https://legislatie.just.ro/Public/DetaliiDocument/156290"
    },
    "collectiveForms": [
      {
        "kind": "commons",
        "name": "Composesorat (and comparable forest and pasture commons)",
        "summary": "Law 1/2000 and Law 247/2005 name composesorate among the forms of association (with obști, forest and pasture commons and cooperatives) to which forest and pasture land is restored.",
        "source": "Legea nr. 1/2000, as consolidated on legislatie.just.ro",
        "sourceUrl": "https://legislatie.just.ro/Public/DetaliiDocument/20557"
      }
    ],
    "firstClaim": [
      "Rank I: co-owners, spouses and relatives or in-laws up to the third degree; rank II: owners of orchard, vineyard, hop or private irrigation investments on the land, and lessees; rank III: owners and lessees of neighbouring farmland; rank IV: young farmers; rank V: agricultural research and teaching bodies; rank VI: natural persons domiciled in the commune or neighbouring communes; rank VII: the Romanian State through the Agenția Domeniilor Statului (Law 17/2014 art. 4(1)).",
      "Archaeological sites and zones need the opinion of the Ministry of Culture before a sale (art. 3(4))."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Establish whether the parcel is inside the built-up area (intravilan), which Law 17/2014 does not cover, or farmland outside it (extravilan), which it does.",
        "who": "Primăria (town hall) and the land register",
        "source": "Legea nr. 17/2014 art. 2(1)",
        "sourceUrl": "https://legislatie.just.ro/Public/DetaliiDocument/156290"
      },
      {
        "n": 2,
        "what": "For extravilan farmland the seller registers the sale offer at the primărie, which displays it so that pre-emption holders can accept; a buyer waits through this display before any non-pre-emptor can proceed.",
        "who": "Primăria of the commune where the land lies",
        "source": "Legea nr. 17/2014 arts. 6-7",
        "sourceUrl": "https://legislatie.just.ro/Public/DetaliiDocument/156290",
        "duration": {
          "text": "The primărie displays the offer for 45 working days, starting within 5 working days of the request",
          "source": "Legea nr. 17/2014 art. 6(2)",
          "sourceUrl": "https://legislatie.just.ro/Public/DetaliiDocument/156290"
        }
      },
      {
        "n": 3,
        "what": "If no pre-emption holder accepts, a prospective buyer files a dossier at the primărie proving the conditions of art. 4^1; if none of the pre-emption holders meets them, the sale may be made to any natural or legal person under the law.",
        "who": "Primăria; prospective buyer",
        "source": "Legea nr. 17/2014 art. 4^1(3) and (5)",
        "sourceUrl": "https://legislatie.just.ro/Public/DetaliiDocument/156290",
        "duration": {
          "text": "The dossier is filed within 30 days after the 45-working-day display ends",
          "source": "Legea nr. 17/2014 art. 4^1(3)",
          "sourceUrl": "https://legislatie.just.ro/Public/DetaliiDocument/156290"
        }
      },
      {
        "n": 4,
        "what": "If the land lies within 30 km of the state border or Black Sea coast, or within 2,400 m of special objectives, obtain the specific opinion of the Ministry of National Defence before the sale.",
        "who": "Ministerul Apărării Naționale",
        "source": "Legea nr. 17/2014 art. 3(1) and (3)",
        "sourceUrl": "https://legislatie.just.ro/Public/DetaliiDocument/156290",
        "duration": {
          "text": "The opinion is to be communicated within 20 working days of the seller's request",
          "source": "Legea nr. 17/2014 art. 3(3)",
          "sourceUrl": "https://legislatie.just.ro/Public/DetaliiDocument/156290"
        }
      },
      {
        "n": 5,
        "what": "Obtain the final opinion needed before the notarial sale deed: from the county agriculture directorate for parcels up to 30 ha, from the Ministry of Agriculture and Rural Development above 30 ha.",
        "who": "Direcția pentru agricultură județeană (up to 30 ha) or Ministerul Agriculturii și Dezvoltării Rurale (over 30 ha)",
        "source": "Legea nr. 17/2014 arts. 9-10",
        "sourceUrl": "https://legislatie.just.ro/Public/DetaliiDocument/156290",
        "duration": {
          "text": "Conditions are checked within 10 working days after the display period and the opinion issued within 5 working days after that; the opinion is valid for 6 months",
          "source": "Legea nr. 17/2014 arts. 10(1) and 9(3)",
          "sourceUrl": "https://legislatie.just.ro/Public/DetaliiDocument/156290"
        }
      }
    ],
    "ruledOut": [
      "A third-country citizen or company cannot hold extravilan farmland in its own name outside the conditions of an international treaty with reciprocity (Law 17/2014 art. 2(3); Constitution art. 44(2)).",
      "Farmland outside built-up areas resold within 8 years of purchase carries an 80% tax on the positive difference between sale and purchase value (art. 4^2(1))."
    ],
    "direction": "stable",
    "directionNote": "Law 17/2014 has been amended repeatedly (Law 175/2020, urgent ordinance 104/2022, Law 116/2024, which changed art. 2(1) from 3 May 2024); the consolidated text on the portal runs to 03.05.2024 and later changes were not checked.",
    "gaps": [
      "Building-permit and zoning rules for dwellings (urbanism law, local plans) were not opened, so the zoning route is unknown.",
      "Whether a Romanian company with non-EU shareholders counts as a legal person of Romanian nationality for Law 17/2014, and what other routes the law provides for third-country citizens, was not found in an opened primary source; Law 312/2005 was not opened.",
      "Law 116/2024 changed art. 2(1) from 3 May 2024; its other changes were not read and any amendment after that date is unchecked.",
      "Rights of membership and entry for outsiders in composesorate were not found in an opened source.",
      "The right of superficies, association and agricultural-cooperative forms (Law 26/2000, Law 566/2004) named in the dossier were not opened.",
      "Title clarity in Saxon-heritage villages (scattered heirs) is a dossier observation without an opened source."
    ],
    "confidence": "low",
    "verifiedOn": "2026-10-05"
  },
  "valle-maira": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open_with_conditions",
      "summary": "Italian law admits a foreigner to the civil rights of a citizen on condition of reciprocity, subject to special laws (Preleggi art. 16, read on a secondary site because the Normattiva article page does not render). A foreigner regularly resident in Italy enjoys the civil rights of an Italian citizen, with reciprocity kept where the Testo Unico or a convention provides it (D.Lgs. 286/1998 art. 2). No Piedmont-specific rule on foreign buyers was found, and the frontier-zone rules were not checked.",
      "source": "Disposizioni sulla legge in generale (Preleggi) art. 16 (Brocardi, secondary); D.Lgs. 286/1998 art. 2 (Normattiva)",
      "sourceUrl": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1998-07-25;286~art2"
    },
    "residency": {
      "link": "unknown",
      "summary": "Whether buying land in Italy carries any right to a residence permit, or requires one beyond the regular residence that the Testo Unico art. 2 mentions for foreigners' civil rights, was not opened.",
      "source": "D.Lgs. 286/1998 art. 2 (Normattiva)",
      "sourceUrl": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1998-07-25;286~art2"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "New construction, certain restructurings that change the building, and certain changes of use need a permesso di costruire from the commune. What a borgata building may become is set by each commune's own plan (PRGC), which was not read here. Collective land is a separate case: it keeps a permanent agro-silvo-pastoral destination.",
      "source": "DPR 380/2001 art. 10 (Normattiva); Law 168/2017 art. 3",
      "sourceUrl": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:2001-06-06;380~art10"
    },
    "collectiveForms": [
      {
        "kind": "commons",
        "name": "Beni collettivi (usi civici, demanio civico)",
        "summary": "Collective property of the inhabitants of a comune or frazione, including land with civic uses not yet liquidated and water bodies on which residents exercise civic uses. It stays inalienable, indivisible, not subject to usucapion and permanently agro-silvo-pastoral. It is a commons whose rules a newcomer joins, not a route to ownership.",
        "source": "Law 168/2017 art. 3 (norms on collective domains)",
        "sourceUrl": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2017-11-20;168~art3"
      }
    ],
    "firstClaim": [
      "A tenant farmer, sharecropper or colono who has cultivated the let plot for the statutory period holds a right of pre-emption when it is sold; the period is two years, cut from four by Law 817/1971 art. 7. The owner must notify by registered letter with the preliminary contract, the farmer has 30 days, and if the owner skips the notice the right-holder can redeem the plot within a year of the sale's transcription. The right does not apply where the plan zones the land for building, industrial or tourist use (Law 590/1965 art. 8).",
      "A coltivatore diretto, or a professional agricultural entrepreneur, who owns adjoining land holds the same right on a plot offered for sale, provided no tenant, sharecropper or similar farmer works that plot (Law 817/1971 art. 7)."
    ],
    "steps": [
      {
        "what": "Start with the commune and the borgata, not a parcel. The Unione Montana's inner-areas page shows a strategy for the Valli Maira e Grana area aimed at countering marginalisation and population decline, with 2.44 million euros of regional rural-development funds under operation 16.7.1; it contains no invitation to settle in any particular borgata, so the invitation has to come from the commune or the people of the borgata.",
        "who": "The commune (comune) and the people of the borgata; Unione Montana Valle Maira",
        "source": "Unione Montana Valle Maira, Strategia Nazionale Aree Interne",
        "sourceUrl": "https://www.unionemontanavallemaira.it/Menu?IDVoceMenu=332295",
        "n": 1
      },
      {
        "what": "Ask the commune which land in the borgata is collective, whether usi civici are still registered on it, and who administers it; collective land cannot be bought and stays agro-silvo-pastoral, and which parcels are collective differs from commune to commune.",
        "who": "The commune; the body administering the collective land (frazione or collective association) where one exists",
        "source": "Law 168/2017 art. 3",
        "sourceUrl": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2017-11-20;168~art3",
        "n": 2
      },
      {
        "what": "Before an offer on farmland, find out whether a tenant farmer or a farming neighbour holds a pre-emption right on the plot.",
        "who": "The seller; the notary; the tenant or neighbouring farmers",
        "source": "Law 590/1965 art. 8; Law 817/1971 art. 7",
        "sourceUrl": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1965-05-26;590~art8",
        "duration": {
          "text": "The tenant farmer has 30 days from the notified proposal to exercise the right; a redemption right runs for one year from the transcription of a sale made without notice",
          "source": "Law 590/1965 art. 8",
          "sourceUrl": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1965-05-26;590~art8"
        },
        "n": 3
      },
      {
        "what": "Ask the commune's technical office what a building may become under the plan (PRGC) and whether the intervention needs a permesso di costruire, before any money is committed to a borgata building.",
        "who": "The commune's technical office",
        "source": "DPR 380/2001 art. 10",
        "sourceUrl": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:2001-06-06;380~art10",
        "n": 4
      },
      {
        "what": "Learn what the Occitan language and culture mean in the commune you would join: the Republic protects the Occitan language and culture, and the Piedmont list of communes that applied Law 482/1999 names all 13 communes of the Unione under the Occitan minority of the Province of Cuneo.",
        "who": "The commune; local Occitan cultural associations",
        "source": "Law 482/1999 art. 2; Regione Piemonte, list of communes that applied Law 482/1999",
        "sourceUrl": "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1999-12-15;482~art2",
        "n": 5
      }
    ],
    "ruledOut": [
      "Collective land (beni collettivi) is inalienable, indivisible, not subject to usucapion and permanently agro-silvo-pastoral, so a parcel of it cannot be bought and cannot be converted to another use (Law 168/2017 art. 3).",
      "A tenant farmer's or farming neighbour's pre-emption can pull a farmland sale away from the first buyer; where the owner skipped the notice the right-holder can redeem within a year (Law 590/1965 art. 8; Law 817/1971 art. 7)."
    ],
    "direction": "stable",
    "directionNote": "No change was flagged in the sources opened: the collective-domain law (2017) and the minority-language law (1999) are long-standing, and article 3 of the 2017 law is in force in its text of 22 June 2023 and the 1999 law's page was last updated in 2019. The Piedmont law on recovering rustici (LR 9/2003) was replaced in 2018, so regional building rules did move and were not opened.",
    "gaps": [
      "Preleggi art. 16 was read on Brocardi, a secondary site, because the Normattiva article page does not render; the exemption of EU/EEA citizens from the reciprocity condition was not verified against a primary text, so it is not asserted.",
      "Whether buying land carries any right to a residence permit, and the frontier-zone rules for foreign buyers, were not opened.",
      "No commune's PRGC was read, and the current Piedmont regional building law (LR 56/1977, LR 16/2018) was not opened, so what a borgata building may become is unknown.",
      "Which parcels in each of the 13 communes are collective, and which collective bodies administer them, was not looked up.",
      "Inheritance fragmentation of borgata property among many heirs, reported in the pre-selection, was not sourced.",
      "No commune or community in the Unione was found to publish an invitation to settle; the inner-areas page names a strategy against depopulation, not an arrival offer, and the entry points are therefore a relationship, not a scheme.",
      "Standard Italian collective vehicles (associazione, cooperativa, società) were not opened and are not described."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "vermont": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open",
      "summary": "No Vermont statute restricting foreign or non-resident purchase of private land was found: the National Agricultural Law Center (updated June 2026) lists about 29 states with such laws and Vermont is not among them. Foreign persons who acquire a significant interest in US agricultural land must still file a federal AFIDA disclosure.",
      "source": "National Agricultural Law Center, Foreign Ownership FAQ (updated 26 June 2026); USDA FSA AFIDA page",
      "sourceUrl": "https://nationalaglawcenter.org/foreign-investments-in-ag/"
    },
    "residency": {
      "link": "no_link",
      "summary": "The sources opened show no residency or citizenship test for buying private land in Vermont. Buying land is a separate matter from any immigration status, which these sources do not cover.",
      "source": "National Agricultural Law Center, Foreign Ownership FAQ (state list excludes Vermont)",
      "sourceUrl": "https://nationalaglawcenter.org/foreign-investments-in-ag/"
    },
    "zoning": {
      "route": "case_by_case",
      "summary": "Two layers apply. Towns adopt their own zoning and subdivision bylaws, and the state's Act 250 adds a permit for larger developments. Act 250 jurisdiction includes construction of 10 or more housing units within 5 miles in any 5-year period, subdivision into 10 or more lots (6 or more in a town without both zoning and subdivision bylaws), commercial or industrial construction (nonprofits included) on more than 1 acre in such a town or more than 10 acres elsewhere, and residential construction at or above 2,500 feet.",
      "source": "Vermont Land Use Review Board, Act 250 Jurisdiction Categories handout (July 2026)",
      "sourceUrl": "https://act250.vermont.gov/sites/acttwofifty/files/documents/Act%20250%20Jurisdiction%20Categories%20Handout.pdf"
    },
    "collectiveForms": [
      {
        "kind": "land_trust",
        "name": "Conservation land trust (for example Vermont Land Trust)",
        "summary": "Vermont Land Trust describes its work as helping farmers and landowners protect and care for land; a land trust partner is one route for a conserved-land arrangement alongside a community's own holding body.",
        "source": "Vermont Land Trust, home page",
        "sourceUrl": "https://www.vlt.org/"
      },
      {
        "kind": "other",
        "name": "Conservation funding through the Vermont Housing and Conservation Board",
        "summary": "The state board runs conservation programmes for farmland and forestland alongside housing programmes; it is a funding and programme body rather than a legal form for holding land.",
        "source": "Vermont Housing and Conservation Board, conservation programmes",
        "sourceUrl": "https://www.vhcb.org/conservation"
      }
    ],
    "firstClaim": [
      "No statutory pre-emption or first-refusal holder over private rural land was identified in the sources opened. For larger projects the district coordinator and district commission of the Act 250 programme decide whether a permit is required and whether to grant it."
    ],
    "steps": [
      {
        "n": 1,
        "what": "Ask the town whether it has adopted both permanent zoning and subdivision bylaws, and what its bylaws allow on the parcel. This decides which Act 250 thresholds apply (1 acre or 10 acres for commercial or industrial construction, 6 or 10 lots for subdivision).",
        "who": "Town zoning administrator and the Act 250 district coordinator for the town",
        "source": "Act 250 Jurisdiction Categories handout (jurisdiction depends on whether the municipality has both permanent zoning and subdivision bylaws)",
        "sourceUrl": "https://act250.vermont.gov/sites/acttwofifty/files/documents/Act%20250%20Jurisdiction%20Categories%20Handout.pdf"
      },
      {
        "n": 2,
        "what": "Before committing to a purchase, ask the Act 250 district coordinator for a discussion and, if useful, a written jurisdictional opinion on whether the planned housing or subdivision needs an Act 250 permit.",
        "who": "Act 250 district coordinator (Land Use Review Board)",
        "source": "Act 250, Do I Need a Permit? (district coordinator and jurisdictional opinion)",
        "sourceUrl": "https://act250.vermont.gov/act250-permit/need-a-permit"
      },
      {
        "n": 3,
        "what": "If a permit is required, apply to the district commission. Most applications are reviewed through the minor process with public notice and no hearing unless an interested party or agency asks for one; the rest get a public hearing. Neighbours and agencies can take part either way.",
        "who": "District environmental commission for the town",
        "source": "Act 250, Do I Need a Permit? and The Act 250 Permit Application Process",
        "sourceUrl": "https://act250.vermont.gov/act250-permit/about-process",
        "duration": {
          "text": "Two-thirds of Act 250 permits are issued in less than 90 days; more complex projects can take longer.",
          "source": "Act 250, Do I Need a Permit? (how long does it take)",
          "sourceUrl": "https://act250.vermont.gov/act250-permit/need-a-permit"
        }
      },
      {
        "n": 4,
        "what": "Decide whether to enrol agricultural or forest land in the Current Use programme, which taxes eligible land at use value. Eligibility is at least 25 contiguous acres of active agricultural land (or smaller parcels meeting an income test) or at least 25 contiguous acres of forest land under an approved forest management plan; developing an enrolled portion later carries a land use change tax of 10 percent of its fair market value.",
        "who": "Vermont Department of Taxes, Current Use programme",
        "source": "Vermont Department of Taxes, Current Use property types and Land Use Change Tax",
        "sourceUrl": "https://tax.vermont.gov/property/current-use/property-types"
      },
      {
        "n": 5,
        "what": "Check where Act 250 reform stands when you apply: a new criterion on forest blocks and habitat connectors applies to applications filed on or after 1 January 2028, and temporary interim housing exemptions run through mid-2028.",
        "who": "Land Use Review Board (Act 250 programme)",
        "source": "Act 250, Criterion 8(C) page and Modernizing Land Use Review page",
        "sourceUrl": "https://act250.vermont.gov/modernizing-land-use-review/criterion-8c-forest-blocks-and-habitat-connectors"
      }
    ],
    "ruledOut": [
      "Enrolment in Current Use is not a permit: the programme sets tax treatment and carries a land use change tax on developed or withdrawn land, and it does not replace town zoning or an Act 250 permit where jurisdiction applies.",
      "Splitting a project into small phases does not reset Act 250 jurisdiction: the housing-unit and lot thresholds count over a continuous 5-year period within a 5-mile radius."
    ],
    "direction": "tightening",
    "directionNote": "Mixed in composition: Act 181 of 2024 and Act 152 of 2026 reshaped Act 250 around location-based jurisdiction with temporary housing exemptions through mid-2028, while a new forest-block and habitat-connector criterion begins applying to applications filed from 1 January 2028. Held as tightening to match the region's legal-ownership layer record.",
    "gaps": [
      "The Vermont Legislature site does not resolve from this sandbox, so statute text (10 V.S.A. chapter 151, 32 V.S.A. chapter 124, 11 V.S.A. chapter 15) was not read directly; thresholds come from the Land Use Review Board's handout, which says it is not comprehensive and does not supersede the Act 250 Rules.",
      "The 2026 House vote to partially repeal parts of Act 181 reported in the 2026-07 research was not confirmed as enacted from a primary source; the official Act 250 page now names Act 152 of 2026 as having changed Act 181, and the details of that act were not read.",
      "Collective-ownership forms under Vermont statute (limited-equity or cooperative housing, community land trust enabling law) were not opened and are not listed as legal forms here.",
      "Current Use acreage rules were read from the Department of Taxes summary page, not from 32 V.S.A. chapter 124; the 80 to 90 percent tax relief and consultant cost ranges in the dossier have no opened source and are omitted.",
      "Whether a purchase triggers any residency or immigration consequence, and federal tax rules on sale by a non-US owner, were not covered by an opened source."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  },
  "virginia-piedmont": {
    "asOf": "2026-10-05",
    "nonResidentOwnership": {
      "status": "open_with_conditions",
      "summary": "Virginia has no general bar on foreign buyers in the sections opened. One narrow bar applies: since 1 July 2023 no 'foreign adversary' (a government or non-government person determined by the US Secretary of Commerce) may acquire any interest in agricultural land in the Commonwealth; an acquisition in violation is void and title vests in the Commonwealth without payment.",
      "source": "Code of Virginia 55.1-507 (definitions) and 55.1-508 (Foreign adversary acquisition of agricultural land prohibited)",
      "sourceUrl": "https://law.lis.virginia.gov/vacode/title55.1/chapter5.1/section55.1-508/"
    },
    "residency": {
      "link": "no_link",
      "summary": "Nothing in the sections opened makes residence a condition of buying land, and nothing there ties buying to a residence permit. Whether holding land carries any immigration status was not opened.",
      "source": "Code of Virginia 55.1-508",
      "sourceUrl": "https://law.lis.virginia.gov/vacode/title55.1/chapter5.1/section55.1-508/"
    },
    "zoning": {
      "route": "unknown",
      "summary": "County zoning for multi-household or communal residence in Louisa, Fluvanna and Orange was not opened, so the route is not stated. One building-side rule was read: Louisa County requires a land-disturbance permit when 10,000 square feet or more is disturbed, and a state stormwater construction permit is required from one acre, though most individual home construction can avoid the stormwater requirement.",
      "source": "Louisa County, Land Disturbance",
      "sourceUrl": "https://www.louisacounty.gov/204/Land-Disturbance"
    },
    "collectiveForms": [
      {
        "kind": "land_trust",
        "name": "Conservation easement holder",
        "summary": "A conservation easement under the Virginia Conservation Easement Act is held by a charitable corporation, association or trust with 501(c)(3) status whose primary purposes include protecting natural or open-space values or keeping land available for agricultural, forestal or recreational use (public bodies are defined separately in the Act). An easement limits development and use; it does not create shared ownership.",
        "source": "Code of Virginia 10.1-1009 (definitions)",
        "sourceUrl": "https://law.lis.virginia.gov/vacode/title10.1/chapter10.1/section10.1-1009/"
      }
    ],
    "firstClaim": [
      "No statutory pre-emption holder for ordinary rural parcels was found in the sources opened.",
      "Family land held as undivided shares can be forced into partition: any tenant in common, joint tenant or coparcener may compel it (Code of Virginia 8.01-81). The court must order an appraisal first (8.01-81.1), considers allotment of the whole to any party who will accept it at the appraised value before any sale (8.01-83), and sells on the open market unless sealed bids or auction would be better for the parties as a group (8.01-83.1)."
    ],
    "steps": [
      {
        "what": "Visit before anything else. Twin Oaks runs a three-week visitor program for accepted visitors, asks for a letter of introduction, and describes income-sharing in which each member works 38.5 hours a week in the community's businesses and domestic work; its own home page says it stands on the traditional territory of the Monacan and Mannahoac peoples, now merged as the Monacan Indian Nation.",
        "who": "Twin Oaks Community (visitor program)",
        "source": "Twin Oaks Community",
        "sourceUrl": "https://www.twinoaks.org/twinoaks-visits-60/visit-tour",
        "n": 1
      },
      {
        "what": "Or ask a community that is itself looking for partners: Living Energy Farm says it is looking for partners to build affordable, energy independent cooperative housing and offers tours.",
        "who": "Living Energy Farm",
        "source": "Living Energy Farm",
        "sourceUrl": "https://livingenergyfarm.org/",
        "n": 2
      },
      {
        "what": "Before any land purchase, ask the county commissioner of the revenue how land-use assessment works on the parcel: it is a tax deferral, not a discount, and a change of use brings roll-back taxes for the five most recent complete tax years plus simple interest where there is no sliding-scale ordinance. Louisa County asks for 5 open acres for agricultural use or 20 acres of timberland for forest use, excluding a 1-acre home site, with applications by 1 November.",
        "who": "County commissioner of the revenue (Louisa, Fluvanna, Orange)",
        "source": "Code of Virginia 58.1-3237; Louisa County, Land Use",
        "sourceUrl": "https://www.louisacounty.gov/170/Land-Use",
        "duration": {
          "text": "Roll-back taxes cover the five most recent complete tax years plus simple interest where there is no sliding-scale ordinance",
          "source": "Code of Virginia 58.1-3237",
          "sourceUrl": "https://law.lis.virginia.gov/vacode/title58.1/chapter32/section58.1-3237/"
        },
        "n": 3
      },
      {
        "what": "Check whether the land is held as undivided shares among heirs; if so, do not bid, since any co-owner can compel a partition and sale.",
        "who": "The seller; the county land records; a Virginia attorney",
        "source": "Code of Virginia 8.01-81, 8.01-81.1, 8.01-83",
        "sourceUrl": "https://law.lis.virginia.gov/vacode/title8.01/chapter3/section8.01-81.1/",
        "n": 4
      },
      {
        "what": "Ask the county planning and building office what zoning, permits and septic rules apply to more than one household on the parcel, including a land-disturbance permit at 10,000 square feet in Louisa.",
        "who": "County planning, zoning and building office",
        "source": "Louisa County, Land Disturbance",
        "sourceUrl": "https://www.louisacounty.gov/204/Land-Disturbance",
        "n": 5
      }
    ],
    "ruledOut": [
      "A foreign adversary cannot acquire any interest in agricultural land: the acquisition is void and title vests in the Commonwealth (Code of Virginia 55.1-508).",
      "Land-use value assessment is not a discount: a change of use makes the deferred tax payable for the five most recent complete tax years plus simple interest where there is no sliding-scale ordinance (Code of Virginia 58.1-3237; Louisa County).",
      "A buyer of an undivided interest in family land does not hold a settled parcel: any co-owner can compel partition, which the court resolves by division in kind, allotment or sale (Code of Virginia 8.01-81 and 8.01-83)."
    ],
    "direction": "tightening",
    "directionNote": "The foreign-adversary bar on agricultural land took effect on 1 July 2023. Partition law moved in a co-owner-protective direction in 2020 and 2023 (appraisal first, allotment to a co-owner who will pay before any sale). Bills from 2024 and 2025 were not reviewed.",
    "gaps": [
      "County zoning ordinances for multi-household or communal residence in Louisa, Fluvanna and Orange were not opened, so the zoning route is unknown.",
      "Which of the three counties have a sliding-scale roll-back ordinance, and Orange County's land-use program details, were not read.",
      "The Monacan Nation's service area under Public Law 115-121 is all land within 25 miles of the centre of Amherst, and the footprint's three counties appear to lie outside it; the entry therefore rests on the Nation's own account of its homeland and does not call the land ceded or unceded.",
      "Documented loss of land among Black and Freedmen families in these counties was not sourced and is not asserted; the partition rules are stated as law only.",
      "Whether Virginia has formally adopted the Uniform Partition of Heirs Property Act was not verified.",
      "Whether holding land carries any right to a residence permit was not opened.",
      "Acorn Community's own Legal Status page (http only, no https version) says it is a Virginia corporation that owns all the community's property, with 501(d) tax status; it is not cited because every source in an entry must be an https page. No statutory vehicle for community-held land (cooperative, community land trust, LLC) was sourced.",
      "Twin Oaks lost its hammock business to a fire in January 2026 per the pre-selection; its businesses are not described here."
    ],
    "confidence": "medium",
    "verifiedOn": "2026-10-05"
  }
};
