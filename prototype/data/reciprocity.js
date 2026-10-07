// Reciprocity layer, added 2026-10 beside land-standing.js (which keeps territory / tenure / entry / obligation / source).
// QUALITATIVE ONLY: never scored, ranked, weighted, summed or used as a filter. No personal contacts: every entry in
// firstConversations is a public organisation or protocol, and a link is a pointer, never an introduction.
//
// STATUS: 'verified' is only an internal data flag. It means every string below was checked against a public page
// that was opened on the date in `reviewed` (the method is in each `via`; where the page was a Wayback copy the entry
// says so). It does not mean that any nation, community or body reviewed, approved or endorsed its entry.
// Where a field is null it is deliberately empty: vermont.contested and kootenays.contested are withheld pending a
// human decision, and the other nulls are explained in the ledger (a region only gets a notThere form when an opened
// page states it). The site renders only entries whose status is 'verified'.
//
// Schema per region id:
//   territoryShort : string, <= 9 words. A short noun phrase for cards and headers ("Held by ..." is a design choice, not data).
//                    Every proper noun must also occur in landStanding[id].territory (checked by scripts/check_reciprocity.mjs).
//                    Where contested is withheld it names at least two parties and carries no authority word.
//   contested      : null | { text, sources:[{label,url}] }  honest statement where host authority is disputed or overlapping.
//   trajectory     : null | { text, sources:[...], kind:'return'|'recognition'|'revival'|'pressure' }  sourced direction of change
//                    for the people already there (land return, recognition, depopulation-and-renewal, displacement). Words only.
//   firstConversations : [{ name, kind, url, what, checked, via }]  public bodies and protocols to learn from FIRST.
//                    kind: host | regulator | access | commons | community | regional | network | language | heritage | protocol
//   notThere       : null | { forms:[string], basis:[{label,url}] }  arrival forms for which the honest answer is "not there".
//                    null means no opened page states a form, never "nothing to say".
//   claims         : [{ field, claim, label, url }]  per-claim sources for the base Land standing fields.
//   reviewed, status

export const kindLabels = {
  "host": "Host nation or community",
  "regulator": "Body that sets the rules",
  "access": "Land-access or welcome programme",
  "commons": "Commons or shared-water body",
  "community": "Community already there",
  "regional": "Regional development body",
  "network": "Network or association",
  "language": "Language and culture body",
  "heritage": "Heritage and village body",
  "protocol": "Protocol or reference"
};

export const protocols = [
  {"name":"UN Declaration on the Rights of Indigenous Peoples","url":"https://social.desa.un.org/issues/indigenous-peoples/united-nations-declaration-on-the-rights-of-indigenous-peoples","what":"The Declaration adopted by the General Assembly on 13 September 2007; free, prior and informed consent runs through it.","checked":"2026-10-05"},
  {"name":"Canada: United Nations Declaration on the Rights of Indigenous Peoples Act","url":"https://laws-lois.justice.gc.ca/eng/acts/U-2.2/","what":"Canadian federal statute affirming the Declaration as a universal international human rights instrument.","checked":"2026-10-05"},
  {"name":"Global Indigenous Data Alliance: CARE Principles","url":"https://www.gida-global.org/","what":"Collective benefit, authority to control, responsibility, ethics: principles for Indigenous control of Indigenous data.","checked":"2026-10-05"},
  {"name":"Native Land Digital: territory acknowledgement guide","url":"https://native-land.ca/resources/territory-acknowledgement/","what":"A guide from a resource to learn more about Indigenous territories, languages, lands and ways of life.","checked":"2026-10-05"}
];

export const reciprocity = {
  "alentejo": {
    "territoryShort": "Alentejo montado villages",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "ADRAL",
        "kind": "regional",
        "url": "https://www.adral.pt/",
        "what": "The Agência de Desenvolvimento Regional do Alentejo: a mixed-capital, majority-public company for regional development in the Alentejo, legally constituted in 1998.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "CCDR Alentejo",
        "kind": "regulator",
        "url": "https://www.ccdr-a.gov.pt/",
        "what": "The regional coordination and development commission for the Alentejo (Comissão de Coordenação e Desenvolvimento Regional do Alentejo).",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Rede Rural Nacional",
        "kind": "network",
        "url": "https://www.rederural.gov.pt/",
        "what": "Portugal's national rural network (Rede Rural Nacional): its site has sections on legislation, publications, LEADER and the AKIS Portugal platform.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Buying land classified RAN to build a home with no farm holding behind it: the decree makes RAN areas non aedificandi, forbids building except for the uses it lists, and lists a home only for a farmer on a holding or an owner in proven economic need."
      ],
      "basis": [
        {
          "label": "Decreto-Lei 73/2009 (RAN), arts. 20 to 22 (Diário da República)",
          "url": "https://diariodarepublica.pt/dr/detalhe/decreto-lei/73-2009-603209"
        }
      ]
    },
    "claims": [
      {
        "field": "tenure",
        "claim": "RAN areas are assigned to agriculture and are non aedificandi (art. 20); actions that reduce their agricultural potential, among them subdivision, urbanisation and construction, are forbidden except for the uses listed in art. 22.",
        "label": "Decreto-Lei 73/2009 (Diário da República)",
        "url": "https://diariodarepublica.pt/dr/detalhe/decreto-lei/73-2009-603209"
      },
      {
        "field": "entry",
        "claim": "Non-agricultural uses of RAN land are allowed only where there is no viable alternative, for listed purposes that include farm buildings and a home for a farmer on a holding (art. 22).",
        "label": "Decreto-Lei 73/2009 (Diário da República)",
        "url": "https://diariodarepublica.pt/dr/detalhe/decreto-lei/73-2009-603209"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "galicia": {
    "territoryShort": "Galego parish commons (montes veciñais)",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Xunta de Galicia, Consellería do Medio Rural",
        "kind": "regulator",
        "url": "https://mediorural.xunta.gal/gl",
        "what": "The regional rural ministry portal, with pages on forestry, rural development and the montes veciñais en man común and their mancomunidades.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Xunta de Galicia: montes veciñais en man común e as súas mancomunidades",
        "kind": "commons",
        "url": "https://mediorural.xunta.gal/gl/temas/forestal/a-estrutura-da-propiedade/montes-vecinhais-e-mancomunidades",
        "what": "The regional ministry's own page on the commons held by neighbours in common hand (montes veciñais en man común) and their associations of communities.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "AGADER (Axencia Galega de Desenvolvemento Rural)",
        "kind": "access",
        "url": "https://agader.xunta.gal/gl",
        "what": "The Galician rural development agency; its site carries sections on the land bank (banco de terras), land recovery, planning and Leader.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Buying freehold around the villagers who remain, instead of partnering with a comunidade de montes (the commons are inalienable and open only to residents of the settlement, admitted under each comunidade's statutes)."
      ],
      "basis": [
        {
          "label": "Lei 13/1989, arts. 2, 3.1, 16.1.c (BOE consolidated text)",
          "url": "https://www.boe.es/buscar/act.php?id=BOE-A-1990-3358"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "The regional rural ministry keeps a page on the montes veciñais en man común and their mancomunidades.",
        "label": "Xunta de Galicia, Medio Rural",
        "url": "https://mediorural.xunta.gal/gl/temas/forestal/a-estrutura-da-propiedade/montes-vecinhais-e-mancomunidades"
      },
      {
        "field": "tenure",
        "claim": "Montes veciñais are indivisible, inalienable, imprescriptible and unseizable (art. 2); they may be ceded or leased temporarily despite their inalienability (art. 5).",
        "label": "Lei 13/1989 (BOE consolidated text)",
        "url": "https://www.boe.es/buscar/act.php?id=BOE-A-1990-3358"
      },
      {
        "field": "entry",
        "claim": "Each comunidade's statutes must set the conditions for admitting new comuneros (art. 16.1.c).",
        "label": "Lei 13/1989 (BOE consolidated text)",
        "url": "https://www.boe.es/buscar/act.php?id=BOE-A-1990-3358"
      },
      {
        "field": "obligation",
        "claim": "The commons are held by neighbours who keep an open household and habitual residence in the settlements the monte has traditionally belonged to (art. 3.1).",
        "label": "Lei 13/1989 (BOE consolidated text)",
        "url": "https://www.boe.es/buscar/act.php?id=BOE-A-1990-3358"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "transylvania": {
    "territoryShort": "Transylvanian Saxon and Székely villages",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Mihai Eminescu Trust",
        "kind": "heritage",
        "url": "https://www.mihaieminescutrust.ro/",
        "what": "Foundation working on rural revitalisation in Transylvania and Maramureș through \"an integrated approach to sustainable development\".",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Fundația ADEPT Transilvania",
        "kind": "regional",
        "url": "https://fundatia-adept.org/",
        "what": "Biodiversity and rural-development NGO based in Saschiz, working on the farmed landscapes and farming communities of Transylvania.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Democratic Forum of Germans in Romania",
        "kind": "community",
        "url": "https://www.fdgr.ro/",
        "what": "The organisation through which communities of Romanian citizens of German descent represent themselves, including the Transylvanian Saxon villages.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Arriving to buy farmland outside built-up areas without going through the village: relatives, co-owners, lessees, neighbours, young farmers and local residents hold first claim for 45 working days under Law 17/2014."
      ],
      "basis": [
        {
          "label": "Legea 17/2014 (legislatie.just.ro)",
          "url": "https://legislatie.just.ro/Public/DetaliiDocument/156290"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "The Democratic Forum of Germans in Romania describes itself as the organisation through which communities of Romanian citizens of German descent represent themselves.",
        "label": "Demokratisches Forum der Deutschen in Rumänien",
        "url": "https://www.fdgr.ro/"
      },
      {
        "field": "tenure",
        "claim": "Farmland outside built-up areas sells through a queue of pre-emption rights in a fixed order: first co-owners, spouses and relatives, then lessees and neighbouring owners, then young farmers, and further down the queue persons resident in the commune or in neighbouring communes (art. 4).",
        "label": "Legea 17/2014",
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/156290"
      },
      {
        "field": "entry",
        "claim": "The town hall must post the sale offer at its office for 45 working days (art. 6).",
        "label": "Legea 17/2014",
        "url": "https://legislatie.just.ro/Public/DetaliiDocument/156290"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "connemara": {
    "territoryShort": "Gaeltacht communities of Connemara",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Údarás na Gaeltachta",
        "kind": "language",
        "url": "https://udaras.ie/",
        "what": "The agency for the Gaeltacht (the Irish-speaking areas); its site carries a Gaeltacht map (Cárta na Gaeltachta) and a section on the Irish language and the Gaeltacht.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Western Development Commission",
        "kind": "regional",
        "url": "https://westerndevelopment.ie/",
        "what": "The Western Development Commission, a regional development body for Ireland's western region.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Galway County Council, Planning and Building",
        "kind": "regulator",
        "url": "https://www.galway.ie/en/planning-building",
        "what": "Galway County Council, Planning and Building: the planning authority for the county, where the county development plan is published.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": null,
    "claims": [
      {
        "field": "territory",
        "claim": "Údarás na Gaeltachta presents itself as the agency for the Gaeltacht and publishes a Gaeltacht map (Cárta na Gaeltachta).",
        "label": "Údarás na Gaeltachta",
        "url": "https://udaras.ie/"
      },
      {
        "field": "entry",
        "claim": "The adopted Galway County Development Plan 2022-2028 has a chapter titled \"The Galway Gaeltacht and Islands\".",
        "label": "Adopted Galway County Development Plan 2022-2028",
        "url": "https://consult.galway.ie/en/consultation/adopted-galway-county-development-plan-2022-2028"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "pembrokeshire": {
    "territoryShort": "Pembrokeshire smallholding communities",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Lammas",
        "kind": "community",
        "url": "https://lammas.org.uk/en/welcome-to-lammas/",
        "what": "An ecovillage in the Preseli hills: a collective of smallholdings and eco-dwellings, \"broadly in line with\" Welsh Government One Planet Development policy.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Welsh Language Commissioner",
        "kind": "language",
        "url": "https://www.welshlanguagecommissioner.wales/",
        "what": "Independent body whose statutory aim is to promote and facilitate use of the Welsh language.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Pembrokeshire County Council",
        "kind": "regulator",
        "url": "https://www.pembrokeshire.gov.uk/",
        "what": "Pembrokeshire County Council's own site.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": null,
    "claims": [
      {
        "field": "territory",
        "claim": "Lammas describes itself as a collective of smallholdings and eco-dwellings in the Preseli hills, North Pembrokeshire, broadly in line with the Welsh Government One Planet Development policy.",
        "label": "Lammas",
        "url": "https://lammas.org.uk/en/welcome-to-lammas/"
      },
      {
        "field": "tenure",
        "claim": "The Welsh Government publishes the planning requirements for one planet developments in open countryside as set out in technical advice note 6.",
        "label": "Welsh Government: One Planet Developments in open countryside",
        "url": "https://www.gov.wales/planning-permission-one-planet-developments-open-countryside"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "cevennes": {
    "territoryShort": "Cévenol upland farming communities",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Parc national des Cévennes",
        "kind": "regulator",
        "url": "https://www.cevennes-parcnational.fr/fr",
        "what": "The national park authority for the Cévennes; its site covers pastoralism in the Causses and Cévennes among its subjects.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Safer: le droit de préemption",
        "kind": "regulator",
        "url": "https://www.safer.fr/les-safer/le-droit-de-preemption/",
        "what": "The rural land agency's own account of its right to buy rural sales in priority, in place of the original buyer.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Terre de Liens",
        "kind": "access",
        "url": "https://terredeliens.org/",
        "what": "Terre de Liens: an associative and citizen movement that acquires farmland and installs new farmers on organic farms; its site also lists land to rent or sell.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Buying agricultural land with no installation project a local structure can hold: Safer is told of every rural sale and can buy in place of the original purchaser."
      ],
      "basis": [
        {
          "label": "Safer: le droit de préemption",
          "url": "https://www.safer.fr/les-safer/le-droit-de-preemption/"
        }
      ]
    },
    "claims": [
      {
        "field": "tenure",
        "claim": "Safer is systematically informed of rural sale projects by notaries and can buy the property in priority in place of the original buyer.",
        "label": "Safer: le droit de préemption",
        "url": "https://www.safer.fr/les-safer/le-droit-de-preemption/"
      },
      {
        "field": "entry",
        "claim": "Safer presents an installation route for people entering farming (je m’installe en agriculture).",
        "label": "Safer: le droit de préemption",
        "url": "https://www.safer.fr/les-safer/le-droit-de-preemption/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "south-tirol": {
    "territoryShort": "South Tirolean farm families (Höfe)",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Südtiroler Bauernbund",
        "kind": "community",
        "url": "https://www.sbb.it/de/",
        "what": "The South Tyrol farmers' association (Südtiroler Bauernbund): news, services and training for farmers.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Autonome Provinz Bozen: Land- und Forstwirtschaft",
        "kind": "regulator",
        "url": "https://www.provinz.bz.it/land-forstwirtschaft/",
        "what": "The provincial administration page for agriculture and forestry, listing among others the Landeszahlstelle Landwirtschaft and the forestry service.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Landesgesetz 17/2001 über die geschlossenen Höfe (Lexbrowser)",
        "kind": "regulator",
        "url": "https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17/legge_provinciale_28_novembre_2001_n_17.aspx",
        "what": "The provincial law on closed farms (masi chiusi) in the province legal database, with chapters on limits on the owner, pre-emption on the closed farm and release from the closed-farm bond.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Buying a closed farm (maso chiuso) or detaching land from one without the authorisation that arts. 5, 6 and 6-bis of the provincial law require."
      ],
      "basis": [
        {
          "label": "LP 17/2001 (Maso chiuso), chapter 2: arts. 5, 6 and 6-bis (article titles)",
          "url": "https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17%c2%a750/legge_provinciale_28_novembre_2001_n_17/capo_2_limitazioni_della_facolt%C3%A0_di_disporre_del_proprietario_o_della_proprietaria_del_maso_chiuso.aspx"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "The Südtiroler Bauernbund is the farmers' association of South Tyrol, with a section for the Roter Hahn farm-holiday brand and services for farmers.",
        "label": "Südtiroler Bauernbund",
        "url": "https://www.sbb.it/de/"
      },
      {
        "field": "tenure",
        "claim": "The provincial law on closed farms has chapters on limits on the owner's power to dispose of the farm, a pre-emption right over the closed farm, and release of the farm from the bond; the chapter on limits includes articles on authorisation to detach rustic plots (arts. 5 and 6) and to buy a closed farm (art. 6-bis).",
        "label": "LP 17/2001 (Lexbrowser)",
        "url": "https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17%c2%a750/legge_provinciale_28_novembre_2001_n_17/capo_2_limitazioni_della_facolt%C3%A0_di_disporre_del_proprietario_o_della_proprietaria_del_maso_chiuso.aspx"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "asturias": {
    "territoryShort": "Asturian aldeas and montes comunales",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Gobierno del Principado de Asturias",
        "kind": "regulator",
        "url": "https://www.asturias.es/",
        "what": "The regional government portal of the Principado de Asturias.",
        "checked": "2026-10-05",
        "via": "Playwright"
      },
      {
        "name": "Ayuntamiento de Somiedo",
        "kind": "regulator",
        "url": "https://www.somiedo.es/",
        "what": "The council of Somiedo, whose site carries the Parque Natural de Somiedo and the Reserva de la Biosfera.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "COAG-Asturias",
        "kind": "network",
        "url": "https://www.coagasturias.es/",
        "what": "An agrarian union in Asturias, with activities and a way to join on its site.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": null,
    "claims": [
      {
        "field": "tenure",
        "claim": "Decreto Legislativo 1/2004 approves the consolidated text of the Asturian provisions on land-use planning and urbanism; the page does not say whether a later law has replaced it.",
        "label": "Decreto Legislativo 1/2004 (Asturias)",
        "url": "https://noticias.juridicas.com/base_datos/CCAA/as-dleg1-2004.html"
      },
      {
        "field": "obligation",
        "claim": "The council of Somiedo presents the Parque Natural de Somiedo and the Reserva de la Biosfera on its own site.",
        "label": "Ayuntamiento de Somiedo",
        "url": "https://www.somiedo.es/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "saxony-anhalt": {
    "territoryShort": "East German villages and cooperatives",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Ökodorf Sieben Linden",
        "kind": "community",
        "url": "https://siebenlinden.org/de/",
        "what": "The Ökodorf Sieben Linden site: an eco-village that offers seminars, events and a conference house, and a \"Werde Mitglied\" way to join.",
        "checked": "2026-10-05",
        "via": "curl"
      },
      {
        "name": "Landgesellschaft Sachsen-Anhalt",
        "kind": "regulator",
        "url": "https://www.lgsa.de/",
        "what": "The Landgesellschaft Sachsen-Anhalt: advises farmers, resolves land-use conflicts and plans rural building projects and land-use plans.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Kulturland eG",
        "kind": "access",
        "url": "https://www.kulturland.de/",
        "what": "Cooperative that buys farmland for regionally rooted farms: \"Lebendiges Land in gemeinsamer Hand\".",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Buying farmland as a non-farmer where the sale would shut a farmer out: the authority may refuse a sale that spreads farmland unhealthily (GrdstVG section 9), and for farmland of two hectares or more a non-profit settlement company then holds a pre-emption right (Reichssiedlungsgesetz section 4)."
      ],
      "basis": [
        {
          "label": "Grundstückverkehrsgesetz section 9",
          "url": "https://www.gesetze-im-internet.de/grdstvg/__9.html"
        },
        {
          "label": "Reichssiedlungsgesetz section 4",
          "url": "https://www.gesetze-im-internet.de/rsiedlg/__4.html"
        }
      ]
    },
    "claims": [
      {
        "field": "tenure",
        "claim": "The authority may refuse or condition a farmland sale where it would mean an unhealthy distribution of land (section 9).",
        "label": "Grundstückverkehrsgesetz section 9",
        "url": "https://www.gesetze-im-internet.de/grdstvg/__9.html"
      },
      {
        "field": "tenure",
        "claim": "A non-profit settlement company holds a pre-emption right on a sale of farmland of two hectares or more where the sale would need authorisation under the land transaction act and the authorisation would be refused (section 4).",
        "label": "Reichssiedlungsgesetz section 4",
        "url": "https://www.gesetze-im-internet.de/rsiedlg/__4.html"
      },
      {
        "field": "entry",
        "claim": "Kulturland eG, a cooperative, buys arable land, meadows, pasture and biotopes for regionally rooted farms; members hold shares.",
        "label": "Kulturland eG",
        "url": "https://www.kulturland.de/"
      },
      {
        "field": "obligation",
        "claim": "Ökodorf Sieben Linden publishes seminars and a way to become a member for people who want to join its life.",
        "label": "Ökodorf Sieben Linden",
        "url": "https://siebenlinden.org/de/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "estonia-rural": {
    "territoryShort": "Estonian farmsteads and the Seto of Setomaa",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Kodukant",
        "kind": "community",
        "url": "https://kodukant.ee/",
        "what": "The Estonian village movement: it joins associations that develop village communities and their living environment.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Setomaa vald",
        "kind": "community",
        "url": "https://setomaa.ee/",
        "what": "The Setomaa rural municipality's own site, with information on the municipality, its community and events.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Maainfo (AKIS)",
        "kind": "network",
        "url": "https://www.maainfo.ee/",
        "what": "Estonia's agricultural knowledge and innovation system: farming and rural-life information in one place.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Maa- ja Ruumiamet",
        "kind": "regulator",
        "url": "https://maaruum.ee/",
        "what": "The Land and Spatial Board.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Arriving to buy real estate in the Setomaa border parishes (the former Mikitamäe, Orava, Räpina, Värska, Meremäe, Misso and Vastseliina parishes) as a person who is not a citizen of an EEA state or the United Kingdom: the act bars it unless the Government grants an exception."
      ],
      "basis": [
        {
          "label": "Restrictions on Acquisition of Immovables Act, section 10 (Riigi Teataja, English)",
          "url": "https://www.riigiteataja.ee/en/akt/527122023007"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "Setomaa has its own rural municipality with its own site and a community section.",
        "label": "Setomaa Vald",
        "url": "https://setomaa.ee/"
      },
      {
        "field": "tenure",
        "claim": "Citizens of Estonia, EEA states and OECD countries may acquire immovables with agricultural or forest land without restrictions; a legal person of those states may acquire under ten hectares without restrictions and ten hectares or more under conditions (section 4).",
        "label": "Restrictions on Acquisition of Immovables Act (Riigi Teataja, English)",
        "url": "https://www.riigiteataja.ee/en/akt/527122023007"
      },
      {
        "field": "entry",
        "claim": "Section 10 restricts acquisition of real estate by anyone who is not a citizen of an EEA state or the United Kingdom in listed areas, among them the Värska, Meremäe, Misso and Vastseliina parishes, unless the Government grants an exception.",
        "label": "Restrictions on Acquisition of Immovables Act (Riigi Teataja, English)",
        "url": "https://www.riigiteataja.ee/en/akt/527122023007"
      },
      {
        "field": "obligation",
        "claim": "Kodukant presents itself as a movement that joins associations developing village communities and their living environment.",
        "label": "Kodukant",
        "url": "https://kodukant.ee/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "scottish-highlands": {
    "territoryShort": "Highland crofting townships and community estates",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Community Land Scotland",
        "kind": "network",
        "url": "https://www.communitylandscotland.org.uk/",
        "what": "The national representative body for community landowners: people taking control of land, buildings and assets to shape their own futures.",
        "checked": "2026-10-05",
        "via": "curl"
      },
      {
        "name": "Crofting Commission",
        "kind": "regulator",
        "url": "https://www.crofting.scotland.gov.uk/",
        "what": "The Crofting Commission: it regulates and promotes crofting; its site covers applications and notifications, the register of crofts, common grazings and a page on crofters' duties.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Knoydart Foundation",
        "kind": "community",
        "url": "https://knoydart.org/",
        "what": "The Knoydart Foundation: a community-led organisation dedicated to sustainable development on the Knoydart peninsula.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Isle of Eigg Heritage Trust",
        "kind": "community",
        "url": "https://isleofeigg.org/",
        "what": "The Isle of Eigg site: the island is owned by the Isle of Eigg Heritage Trust, which has managed it for the community since the community buyout of 1997.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Assynt Foundation",
        "kind": "community",
        "url": "https://www.assyntfoundation.scot/",
        "what": "The Assynt Foundation: set up for the community buy-out of the Glencanisp and Drumrunie estates, achieved in 2005.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Assynt Development Trust",
        "kind": "community",
        "url": "https://assyntdevelopmenttrust.org/",
        "what": "The Assynt Development Trust: works for all the communities of Assynt; its pages list a Glebe development project and a housing needs analysis (2019), and a way to join.",
        "checked": "2026-10-05",
        "via": "curl"
      },
      {
        "name": "Applecross Community Company",
        "kind": "community",
        "url": "https://www.applecrosscommunitycompany.org/",
        "what": "The Applecross Community Company: its stated mission is to work with the Applecross community to enable a viable population to live and work in a vibrant community.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Arriving as a buyer of a croft or an estate parcel instead of as a resident who joins the community's own bodies: crofters must live on or within 32 km of the croft and cultivate it, and the community estates of Eigg, Knoydart and Assynt are held for their own communities."
      ],
      "basis": [
        {
          "label": "Crofting Commission: crofter's duties",
          "url": "https://www.crofting.scotland.gov.uk/crofters-duties-2/"
        },
        {
          "label": "Isle of Eigg: about Eigg",
          "url": "https://isleofeigg.org/"
        },
        {
          "label": "Assynt Foundation",
          "url": "https://www.assyntfoundation.scot/"
        },
        {
          "label": "Knoydart Foundation",
          "url": "https://knoydart.org/"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "The Isle of Eigg Heritage Trust has managed the island on behalf of the community since the community buyout of 1997.",
        "label": "The Isle of Eigg",
        "url": "https://isleofeigg.org/"
      },
      {
        "field": "territory",
        "claim": "The Assynt Foundation was set up to make a community buy-out of the Glencanisp and Drumrunie estates, achieved in 2005.",
        "label": "Assynt Foundation",
        "url": "https://www.assyntfoundation.scot/"
      },
      {
        "field": "tenure",
        "claim": "Both tenant and owner-occupier crofters must be ordinarily resident on, or within 32 kilometres of, their croft and must cultivate and maintain it.",
        "label": "Crofting Commission: crofter's duties",
        "url": "https://www.crofting.scotland.gov.uk/crofters-duties-2/"
      },
      {
        "field": "entry",
        "claim": "The Assynt Development Trust lists a Glebe development project and a housing needs analysis (2019) among its projects and documents.",
        "label": "Assynt Development Trust",
        "url": "https://assyntdevelopmenttrust.org/"
      },
      {
        "field": "obligation",
        "claim": "The Applecross Community Company states its mission as working with the community to enable a viable population to live and work there.",
        "label": "Applecross Community Company",
        "url": "https://www.applecrosscommunitycompany.org/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "north-karelia-kainuu": {
    "territoryShort": "Finnish village communities (not the Sámi homeland)",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Kainuun kylät ry",
        "kind": "network",
        "url": "https://www.kainuunkylat.fi/",
        "what": "Umbrella association of Kainuu villages: \"for the vitality of villages and residential areas\".",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Pohjois-Karjalan maakuntaliitto",
        "kind": "regional",
        "url": "https://pohjois-karjala.fi/",
        "what": "The North Karelia regional council (Pohjois-Karjalan maakuntaliitto): its site carries regional news and releases.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Leader Suomi",
        "kind": "network",
        "url": "https://leadersuomi.fi/",
        "what": "National list of the Leader groups that fund village, association and enterprise projects.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Snowchange Cooperative",
        "kind": "community",
        "url": "https://www.snowchange.org/",
        "what": "The Snowchange Cooperative: its site covers cultural heritage and fisheries work, eastern Sámi work, re-wilding actions in Finland and narratives on restored water.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Arriving to buy or build in the reindeer-herding area, which takes in Lapland and, within Kainuu, Suomussalmi, Hyrynsalmi and part of Puolanka: under the Reindeer Husbandry Act herding is allowed there irrespective of who owns or holds the land."
      ],
      "basis": [
        {
          "label": "Reindeer Husbandry Act 848/1990, sections 2 and 3 (Finlex, in Finnish)",
          "url": "https://www.finlex.fi/fi/lainsaadanto/1990/848"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "The reindeer-herding area takes in Lapland (except Kemi, Tornio and Keminmaa) and, in Kainuu, Suomussalmi, Hyrynsalmi and the part of Puolanka north of the Hyrynsalmi-Puolanka road (section 2).",
        "label": "Reindeer Husbandry Act 848/1990 (Finlex)",
        "url": "https://www.finlex.fi/fi/lainsaadanto/1990/848"
      },
      {
        "field": "tenure",
        "claim": "Reindeer herding may be practised in the herding area irrespective of ownership or possession of the land, within the limits the act sets (section 3).",
        "label": "Reindeer Husbandry Act 848/1990 (Finlex)",
        "url": "https://www.finlex.fi/fi/lainsaadanto/1990/848"
      },
      {
        "field": "tenure",
        "claim": "Staying inside the border zone, up to three kilometres from the Russian border on land, needs a permit; residents and property holders receive an open-ended permit.",
        "label": "Border Guard Act 578/2005 (Finlex, in Finnish)",
        "url": "https://www.finlex.fi/fi/lainsaadanto/2005/578"
      },
      {
        "field": "entry",
        "claim": "Leader Suomi lists the 52 Leader groups in Finland, which grant funding to businesses, associations and village projects; Kuhmo lists its village associations and committees; Joensuu runs a moving agent for newcomers.",
        "label": "Leader Suomi; Kuhmo; Joensuu",
        "url": "https://leadersuomi.fi/"
      },
      {
        "field": "entry",
        "claim": "Joensuu offers a Newcomers' Moving Agent for people moving to the city.",
        "label": "City of Joensuu: Move to Joensuu",
        "url": "https://www.joensuu.fi/en/city-and-development/our-joensuu/move-to-joensuu/"
      },
      {
        "field": "obligation",
        "claim": "Kainuun kylät ry states its purpose as working for the vitality of villages and residential areas.",
        "label": "Kainuun kylät ry",
        "url": "https://www.kainuunkylat.fi/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "millevaches": {
    "territoryShort": "Montagne limousine villages and hamlets",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Parc naturel régional de Millevaches en Limousin",
        "kind": "regulator",
        "url": "https://www.pnr-millevaches.fr/",
        "what": "The Parc naturel régional de Millevaches en Limousin: the regional park, whose site presents the park charter, its governance and its territory.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Faux-la-Montagne: nouveaux arrivants",
        "kind": "community",
        "url": "https://fauxlamontagne.fr/nouveaux-arrivants/",
        "what": "A commune's own page for newcomers: \"L'accueil de nouveaux habitants est au cœur de nos préoccupations\".",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Terre de Liens Limousin",
        "kind": "access",
        "url": "https://terredeliens.org/limousin/",
        "what": "The Limousin branch of Terre de Liens, whose page carries the Objectif Terres listings of farms and land for sale or for rent.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Objectif Terres",
        "kind": "access",
        "url": "https://www.objectif-terres.org/",
        "what": "The Objectif Terres platform: it lets visitors browse and post farm and land listings and says it is for people who want to grow a farm project.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Buying an isolated parcel as a lone buyer with no local structure behind the project: rural sales are notified to the Safer, which can buy farmland in place of the buyer, and the commune of Faux-la-Montagne asks newcomers to bring their project to the town hall first."
      ],
      "basis": [
        {
          "label": "Safer: le droit de préemption",
          "url": "https://www.safer.fr/les-safer/le-droit-de-preemption/"
        },
        {
          "label": "Faux-la-Montagne: nouveaux arrivants",
          "url": "https://fauxlamontagne.fr/nouveaux-arrivants/"
        }
      ]
    },
    "claims": [
      {
        "field": "tenure",
        "claim": "Safer is systematically informed of rural sale projects by notaries and can buy the property in priority in place of the original buyer.",
        "label": "Safer: le droit de préemption",
        "url": "https://www.safer.fr/les-safer/le-droit-de-preemption/"
      },
      {
        "field": "entry",
        "claim": "Faux-la-Montagne's page for newcomers invites them to bring an idea or a project linked to their settling and says the commune will try to put them in touch with associations and bodies that can support them.",
        "label": "Faux-la-Montagne: nouveaux arrivants",
        "url": "https://fauxlamontagne.fr/nouveaux-arrivants/"
      },
      {
        "field": "entry",
        "claim": "Objectif Terres lets visitors consult and post farm and land listings, and the Terre de Liens Limousin page carries its listings of farms for sale or rent.",
        "label": "Objectif Terres",
        "url": "https://www.objectif-terres.org/"
      },
      {
        "field": "obligation",
        "claim": "The commune of Faux-la-Montagne says that welcoming new inhabitants is at the heart of its concerns and has long given the village its strength.",
        "label": "Faux-la-Montagne: nouveaux arrivants",
        "url": "https://fauxlamontagne.fr/nouveaux-arrivants/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "teruel-uplands": {
    "territoryShort": "Aragonese upland villages and their commons",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Serranía Celtibérica: Bolsa de Repoblación",
        "kind": "access",
        "url": "https://www.celtiberica.es/bolsaderepoblacion/index.html",
        "what": "The Serranía Celtibérica repopulation exchange (Bolsa de Repoblación): offers and demands that connect people and rural places in sparsely populated areas.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Pueblos Vivos Aragón",
        "kind": "access",
        "url": "https://pueblosvivosaragon.com/como-te-podemos-ayudar/",
        "what": "A service that helps people move to rural Aragón; its page says it can serve citizens of EU countries and people with a Spanish work and residence permit.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Comunidad de Albarracín",
        "kind": "commons",
        "url": "https://www.comunidaddealbarracin.org/",
        "what": "The Comunidad de Albarracín: the historic commons community of the Sierra de Albarracín, which gives its own statutes on its site.",
        "checked": "2026-10-05",
        "via": "curl"
      },
      {
        "name": "Teruel Existe",
        "kind": "network",
        "url": "https://teruelexiste.info/",
        "what": "Teruel Existe: the citizens' movement for the province of Teruel; its site has sections on depopulation, the Cortes de Aragón and the España Vaciada.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Building a new multi-household settlement on non-urban land: a single home there needs a parcel of at least 10,000 square metres where no population nucleus can form, and two or more homes within 150 metres count as one.",
        "Taking a scarce house in a village whose municipality names the lack of rural housing as its problem."
      ],
      "basis": [
        {
          "label": "Decreto Legislativo 1/2014 (Aragón), arts. 34 and 35 (BOE consolidated text)",
          "url": "https://www.boe.es/buscar/act.php?id=BOA-d-2014-90410"
        },
        {
          "label": "Eco de Teruel: Pueblos Vivos Aragón workshop on rural housing",
          "url": "https://ecodeteruel.tv/tramacastilla-acogera-una-jornada-sobre-herramientas-para-que-entidades-locales-puedan-afrontar-la-falta-de-vivienda-rural/"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "The Comunidad de Albarracín groups twenty-three municipalities, governed through a plega general and a junta de sexmeros, and holds common pastures and woods.",
        "label": "Estatutos de la Comunidad de Albarracín",
        "url": "https://www.comunidaddealbarracin.org/old/Estatutos%20Comunidad%20de%20Albarracin.pdf"
      },
      {
        "field": "tenure",
        "claim": "In ordinary non-urban land a single house needs a parcel of at least 10,000 square metres, and a population nucleus is presumed where two or more homes stand within a 150-metre radius; rehabilitation of buildings in aldeas, barrios or deserted villages is treated separately.",
        "label": "Decreto Legislativo 1/2014 (Aragón)",
        "url": "https://www.boe.es/buscar/act.php?id=BOA-d-2014-90410"
      },
      {
        "field": "tenure",
        "claim": "Aragonese civil law keeps the derecho de abolorio, a pre-emption right of relatives over family property.",
        "label": "Código del Derecho Foral de Aragón",
        "url": "https://www.boe.es/buscar/act.php?id=BOA-d-2011-90007"
      },
      {
        "field": "entry",
        "claim": "Pueblos Vivos Aragón advises people moving to rural Aragón and says it can serve citizens of EU countries and people with a Spanish work and residence permit.",
        "label": "Pueblos Vivos Aragón",
        "url": "https://pueblosvivosaragon.com/como-te-podemos-ayudar/"
      },
      {
        "field": "obligation",
        "claim": "The Aragonese forest decree distinguishes montes comunales, whose use belongs to the common of the neighbours, from other montes.",
        "label": "Decreto Legislativo 1/2017 (Aragón)",
        "url": "https://www.boe.es/buscar/act.php?id=BOA-d-2017-90392"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "valle-maira": {
    "territoryShort": "Occitan-minority mountain communes",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Unione Montana Valle Maira",
        "kind": "regulator",
        "url": "https://www.unionemontanavallemaira.it/",
        "what": "The Unione Montana Valle Maira: the union of the mountain communes of the valley; its site has sections on agriculture, forests and tourism.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Espaci Occitan",
        "kind": "community",
        "url": "https://www.espaci-occitan.org/",
        "what": "The Associazione Espaci Occitan: an Occitan culture and language association.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Associazione Dislivelli",
        "kind": "network",
        "url": "https://www.dislivelli.eu/",
        "what": "Associazione Dislivelli: research and communication on the mountains, with articles, a magazine (Terre alte) and research pages.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": null,
    "claims": [
      {
        "field": "territory",
        "claim": "The Unione Montana Valle Maira is the union of the valley's mountain communes; its site lists Agricoltura, Foreste and Turismo.",
        "label": "Unione Montana Valle Maira",
        "url": "https://www.unionemontanavallemaira.it/"
      },
      {
        "field": "entry",
        "claim": "A 2013 study of the valley (Pettenati, Revue de géographie alpine) describes the Val Maira as a territorial laboratory of a new mountain settlement (nuovo popolamento montano).",
        "label": "G. Pettenati, La Val Maira (Revue de géographie alpine, 2013)",
        "url": "https://journals.openedition.org/rga/2201"
      },
      {
        "field": "obligation",
        "claim": "Espaci Occitan presents itself as an Occitan culture and language association.",
        "label": "Associazione Espaci Occitan",
        "url": "https://www.espaci-occitan.org/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "cascadia": {
    "territoryShort": "Kalapuya homeland; Grand Ronde and Siletz peoples",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Confederated Tribes of Grand Ronde",
        "kind": "host",
        "url": "https://www.grandronde.org/",
        "what": "Tribal government; its own words: it unites the Umpqua, Molalla, Rogue River, Kalapuya and Chasta peoples, rooted in ancestral lands across western Oregon.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Confederated Tribes of Siletz Indians",
        "kind": "host",
        "url": "https://ctsi.nsn.us/",
        "what": "Tribal government; describes itself as a confederation of tribes and bands whose ancestral territory included all of western Oregon.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Oregon Agricultural Trust",
        "kind": "access",
        "url": "https://www.oregonagtrust.org/",
        "what": "Partners with farmers and ranchers to protect agricultural land.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Buying farmland zoned Exclusive Farm Use as a site for a home with no farm purpose: ORS 215 limits non-farm dwellings in exclusive farm use zones and sets the tests for them."
      ],
      "basis": [
        {
          "label": "ORS chapter 215, sections 215.236 and 215.262 (Oregon Legislature)",
          "url": "https://www.oregonlegislature.gov/bills_laws/ors/ors215.html"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "The Confederated Tribes of the Grand Ronde Community of Oregon include the Kalapuya, Molalla, Chasta, Umpqua, Rogue River, Chinook and Tillamook peoples, with a reservation of about 11,500 acres in Yamhill County.",
        "label": "Confederated Tribes of Grand Ronde: culture and history",
        "url": "https://www.grandronde.org/culture-history/"
      },
      {
        "field": "territory",
        "claim": "The Siletz say their ancestors brought connections to more than 20 million acres of ancestral territory, including all of Western Oregon from the summit of the Cascade mountains to the Pacific; Kalapuya and Molala are among the peoples listed on the Siletz site.",
        "label": "Confederated Tribes of Siletz Indians",
        "url": "https://ctsi.nsn.us/"
      },
      {
        "field": "tenure",
        "claim": "ORS chapter 215 sets the rules for exclusive farm use zones, including a section on nonfarm dwellings in those zones (215.236).",
        "label": "ORS chapter 215 (Oregon Legislature)",
        "url": "https://www.oregonlegislature.gov/bills_laws/ors/ors215.html"
      },
      {
        "field": "entry",
        "claim": "ORS chapter 215 provides for a conditional use approval process for uses in exclusive farm use zones (215.296 and 215.297).",
        "label": "ORS chapter 215 (Oregon Legislature)",
        "url": "https://www.oregonlegislature.gov/bills_laws/ors/ors215.html"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "vermont": {
    "territoryShort": "Ndakina, Wabanaki homeland",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Vermont Commission on Native American Affairs",
        "kind": "host",
        "url": "https://vcnaa.vermont.gov/",
        "what": "The official website of the Vermont Commission on Native American Affairs, with sections on the commission, its meetings, its work and recognition.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "W8banaki (Grand Conseil de la Nation Waban-Aki)",
        "kind": "host",
        "url": "https://gcnwa.com/",
        "what": "The W8banaki council (Représenter, Développer, Administrer) for the Odanak and Wôlinak communities in Québec; its site has a Bureau du Ndakina (Ndakina Office) section.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Land For Good",
        "kind": "access",
        "url": "https://landforgood.org/",
        "what": "Helps farmers access land to start, expand or transfer a farm.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Vermont Housing and Conservation Board",
        "kind": "access",
        "url": "https://vhcb.org/",
        "what": "Invests in permanently affordable housing and in conservation.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Vermont Land Trust",
        "kind": "access",
        "url": "https://vlt.org/",
        "what": "Protects farms, forests and community places.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": null,
    "claims": [
      {
        "field": "territory",
        "claim": "The W8banaki Nation's own website writes the territory as Ndakina and names Odanak and Wôlinak as its communities.",
        "label": "W8banaki (Grand Conseil de la Nation Waban-Aki)",
        "url": "https://gcnwa.com/en/"
      },
      {
        "field": "territory",
        "claim": "The State of Vermont recognised four groups: the Elnu Abenaki Tribe and the Nulhegan Abenaki Tribe on 22 April 2011, and the Abenaki Nation at Missisquoi and the Koasek Traditional Band of the Koas Abenaki Nation on 7 May 2012.",
        "label": "Vermont Commission on Native American Affairs: state recognized tribes",
        "url": "https://vcnaa.vermont.gov/recognition/recognized-tribes"
      },
      {
        "field": "tenure",
        "claim": "Current Use is a program under which agricultural, forest and conservation property is appraised at use value (Use Value Appraisal, established in 1978).",
        "label": "Vermont Department of Taxes: Current Use",
        "url": "https://tax.vermont.gov/property/current-use"
      },
      {
        "field": "tenure",
        "claim": "The Land Use Change Tax is imposed at 10% of the full fair market value of land that is developed, and is also due when land is withdrawn from the Current Use Program.",
        "label": "Vermont Department of Taxes: Land Use Change Tax",
        "url": "https://tax.vermont.gov/luct"
      },
      {
        "field": "entry",
        "claim": "In municipalities with robust zoning and subdivision bylaws the Act 250 threshold for a commercial development is a parcel or parcels of 10 acres or greater; the threshold is lower in municipalities without such bylaws.",
        "label": "Act 250: 1-Acre and 10-Acre Municipalities",
        "url": "https://act250.vermont.gov/1-acre-and-10-acre-municipalities"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "southern-appalachians": {
    "territoryShort": "Cherokee homeland",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Cherokee Nation",
        "kind": "host",
        "url": "https://www.cherokee.gov/",
        "what": "The Cherokee Nation's own site (cherokee.gov), with a Cherokee language hub, citizenship and services pages.",
        "checked": "2026-10-05",
        "via": "curl"
      },
      {
        "name": "Eastern Band of Cherokee Indians",
        "kind": "host",
        "url": "https://www.ebci.gov/",
        "what": "The official government website of the Eastern Band of Cherokee Indians in Cherokee, North Carolina, with pages on government, enrollment, services and news.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Black Family Land Trust",
        "kind": "access",
        "url": "https://www.bflt.org/",
        "what": "The Black Family Land Trust: incorporated in 2004 and based in North Carolina, a conservation land trust dedicated to preserving and protecting the assets of African-American and other historically underserved landowners.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Organic Growers School",
        "kind": "network",
        "url": "https://www.organicgrowersschool.org/",
        "what": "Organic Growers School: its site lists farmer programmes, organic growing and living courses, community events and a spring conference, and says it supports farmers affected by Hurricane Helene.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": null,
    "claims": [
      {
        "field": "territory",
        "claim": "In the Treaty of New Echota (29 December 1835) the Cherokee agreed terms for a cession of their lands east of the Mississippi river.",
        "label": "Treaty with the Cherokee, 1835 (Kappler)",
        "url": "https://treaties.okstate.edu/treaties/treaty-with-the-cherokee-1835-0439"
      },
      {
        "field": "territory",
        "claim": "The Eastern Band of Cherokee Indians publishes its own official government website at ebci.gov, from Cherokee, North Carolina.",
        "label": "Eastern Band of Cherokee Indians",
        "url": "https://www.ebci.gov/"
      },
      {
        "field": "territory",
        "claim": "NCpedia, in a state-library history, covers the Trail of Tears and the creation of the Eastern Band of Cherokees.",
        "label": "NCpedia: Cherokee People in North Carolina, part V",
        "url": "https://www.ncpedia.org/cherokee/trailoftears"
      },
      {
        "field": "obligation",
        "claim": "The Black Family Land Trust, based in North Carolina, describes itself as a conservation land trust dedicated to the preservation and protection of African-American and other historically underserved landowners' assets.",
        "label": "Black Family Land Trust",
        "url": "https://www.bflt.org/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "driftless": {
    "territoryShort": "Ho-Chunk homeland",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Ho-Chunk Nation",
        "kind": "host",
        "url": "https://ho-chunknation.com/",
        "what": "The Ho-Chunk Nation's own site; its About page says the Nation's oral tradition is that \"we have always been here\" and that its history spans back possibly three ice ages.",
        "checked": "2026-10-05",
        "via": "curl"
      },
      {
        "name": "Driftless Area Land Conservancy",
        "kind": "access",
        "url": "https://driftlessconservancy.org/",
        "what": "Conserves the Driftless Area and its ecological and community connections.",
        "checked": "2026-10-05",
        "via": "curl"
      },
      {
        "name": "Marbleseed",
        "kind": "network",
        "url": "https://marbleseed.org/",
        "what": "Supports Midwest organic and regenerative farmers (formerly MOSES).",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Land Stewardship Project",
        "kind": "network",
        "url": "https://landstewardshipproject.org/",
        "what": "Promotes an ethic of stewardship for farmland and healthy communities.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": null,
    "claims": [
      {
        "field": "territory",
        "claim": "The Ho-Chunk Nation's About page says its oral tradition is \"we have always been here\", that its history spans back possibly three ice ages, and that the Ho-Chungra have traditional lands from Wisconsin, Minnesota, Iowa, Missouri and Illinois.",
        "label": "Ho-Chunk Nation: About",
        "url": "https://ho-chunknation.com/about/"
      },
      {
        "field": "territory",
        "claim": "In the 1829 treaty the Winnebago nation ceded lands to the United States; in 1832 they ceded lands south and east of the Wisconsin and Fox rivers; in 1837 they ceded all their land east of the Mississippi.",
        "label": "Treaties with the Winnebago, 1829, 1832 and 1837 (Kappler)",
        "url": "https://treaties.okstate.edu/treaties/treaty-with-the-winnebago-1837-0498"
      },
      {
        "field": "tenure",
        "claim": "Aliens not residents of a US state, and corporations not created under US law, may not acquire an interest in more than 640 acres of land in Wisconsin (section 710.02).",
        "label": "Wisconsin Statutes 710.02",
        "url": "https://docs.legis.wisconsin.gov/statutes/statutes/710/02"
      },
      {
        "field": "obligation",
        "claim": "Marbleseed describes itself as support and resources for regenerative and organic farmers in the Midwest.",
        "label": "Marbleseed",
        "url": "https://marbleseed.org/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "ozarks": {
    "territoryShort": "Osage homeland",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Osage Nation",
        "kind": "host",
        "url": "https://www.osagenation-nsn.gov/",
        "what": "The Osage Nation's own site, with pages on culture and language, government, services and visitors.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Quapaw Nation",
        "kind": "host",
        "url": "https://www.quapawnation.com/",
        "what": "The Quapaw Nation's own site, with pages on culture, government, services and departments.",
        "checked": "2026-10-05",
        "via": "curl"
      }
    ],
    "notThere": null,
    "claims": [
      {
        "field": "territory",
        "claim": "In the 1808 treaty made at Fort Clark the Osage agreed a boundary line running south from Fort Clark to the Arkansas and down it to the Mississippi, ceding the lands east of it.",
        "label": "Treaty with the Osage, 1808 (Kappler)",
        "url": "https://treaties.okstate.edu/treaties/treaty-with-the-osage-1808-0095"
      },
      {
        "field": "territory",
        "claim": "The Osage Nation Historic Preservation Office publishes an Osage cultural history that places Osage ancestral geography across Missouri.",
        "label": "Osage Nation: Osage cultural history",
        "url": "https://osagenation-nsn.gov/who-we-are/historic-preservation/osage-cultural-history"
      },
      {
        "field": "territory",
        "claim": "The Quapaw ceded lands to the United States in an 1818 treaty.",
        "label": "Treaty with the Quapaw, 1818 (Kappler)",
        "url": "https://treaties.okstate.edu/treaties/treaty-with-the-quapaw-1818-0160"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "northern-new-mexico": {
    "territoryShort": "Taos Pueblo and Hispano acequia communities",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Taos Pueblo",
        "kind": "host",
        "url": "https://taospueblo.com/",
        "what": "The Taos Pueblo site: it says the Taos valley has been the home of the Taos Pueblo people for thousands of years, and has a visiting page and pages on water rights and Blue Lake.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Picuris Pueblo",
        "kind": "host",
        "url": "https://www.picurispueblo.org/",
        "what": "The Picuris Pueblo site: the pueblo is in Taos County, New Mexico, with tribal programmes, businesses and a visitor section.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "New Mexico Acequia Association",
        "kind": "commons",
        "url": "https://lasacequias.org/",
        "what": "Statewide acequia association: protects water and acequias and honours cultural heritage.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Taos Land Trust",
        "kind": "access",
        "url": "https://taoslandtrust.org/",
        "what": "The Taos Land Trust: its site covers conservation easements, education, community and youth programmes.",
        "checked": "2026-10-05",
        "via": "curl"
      }
    ],
    "notThere": null,
    "claims": [
      {
        "field": "territory",
        "claim": "Taos Pueblo says the Taos valley area has been the home of the Taos Pueblo people for thousands of years.",
        "label": "Taos Pueblo",
        "url": "https://taospueblo.com/"
      },
      {
        "field": "territory",
        "claim": "Picuris Pueblo is in the high desert of Taos County, New Mexico, about 20 miles southwest of Taos.",
        "label": "Picuris Pueblo",
        "url": "https://www.picurispueblo.org/"
      },
      {
        "field": "tenure",
        "claim": "The New Mexico Acequia Association describes the role of acequias as local institutions of government and works directly with acequias and parciantes.",
        "label": "New Mexico Acequia Association: Acequia Governance",
        "url": "https://lasacequias.org/acequia-governance/"
      },
      {
        "field": "entry",
        "claim": "The New Mexico Acequia Association hosts workshops for acequia elected officials and parciantes on water rights, acequia bylaws and easements; membership in the Association does not require being a parciante.",
        "label": "New Mexico Acequia Association",
        "url": "https://lasacequias.org/acequia-governance/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "nova-scotia": {
    "territoryShort": "Mi'kma'ki (unceded)",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Kwilmu'kw Maw-klusuaqn (Mi'kmaw Rights Initiative)",
        "kind": "host",
        "url": "https://mikmaqrights.com/",
        "what": "Works on behalf of the Mi'kmaq of Nova Scotia, for the Assembly of Nova Scotia Mi'kmaw Chiefs, in discussions with the Province and Canada on implementing Aboriginal and treaty rights; its site reports over 600 active consultations.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Native Council of Nova Scotia",
        "kind": "host",
        "url": "https://www.ncns.ca/",
        "what": "The Native Council of Nova Scotia, which says it is the self-governing authority for Mi'kmaq and Aboriginal peoples residing off reserve in Nova Scotia.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Peace and Friendship Treaties (CIRNAC)",
        "kind": "protocol",
        "url": "https://www.rcaanc-cirnac.gc.ca/eng/1100100028589/1539608999656",
        "what": "Federal explainer on the Peace and Friendship Treaties signed on the East Coast with the Mi'kmaq and others.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Arriving to buy land in Mi'kma'ki as though a treaty of cession had been made: Canada's own account says the Peace and Friendship Treaties did not involve First Nations surrendering rights to the lands and resources they had used and occupied."
      ],
      "basis": [
        {
          "label": "Crown-Indigenous Relations and Northern Affairs Canada: Peace and Friendship Treaties",
          "url": "https://www.rcaanc-cirnac.gc.ca/eng/1100100028589/1539608999656"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "Peace and Friendship Treaties were signed on the East Coast with the Mi'kmaq, Maliseet and Passamaquoddy before 1779, and did not involve First Nations surrendering rights to the lands and resources they had traditionally used and occupied.",
        "label": "CIRNAC: Peace and Friendship Treaties",
        "url": "https://www.rcaanc-cirnac.gc.ca/eng/1100100028589/1539608999656"
      },
      {
        "field": "tenure",
        "claim": "The non-resident provincial deed transfer tax rate is 10% on the non-resident ownership interest, with an exemption for non-residents who move to Nova Scotia within six months of the transfer.",
        "label": "Nova Scotia Finance: Non-Resident Provincial Deed Transfer Tax guidelines",
        "url": "https://novascotia.ca/finance/en/home/taxation/tax101/docs/Nova-Scotia-Provincial-Non-resident-Deed-Transfer-Tax-Guidelines.pdf"
      },
      {
        "field": "obligation",
        "claim": "Kwilmu'kw Maw-klusuaqn works for the Mi'kmaq of Nova Scotia on implementing Aboriginal and treaty rights, and reports over 600 active consultations.",
        "label": "Kwilmu'kw Maw-klusuaqn",
        "url": "https://mikmaqrights.com/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "kootenays": {
    "territoryShort": "Sinixt, Ktunaxa and Syilx land",
    "contested": null,
    "trajectory": {
      "text": "The Sinixt say that Canada declared them extinct in 1956 and that in 2021 the Supreme Court of Canada upheld their rights as an Aboriginal People of Canada in R. v. Desautel.",
      "sources": [
        {
          "label": "Sinixt: the Desautel decision (the Nation's own account)",
          "url": "https://sinixt.com/the-desautel-decision/"
        }
      ],
      "kind": "recognition"
    },
    "firstConversations": [
      {
        "name": "Sinixt",
        "kind": "host",
        "url": "https://sinixt.com/",
        "what": "The Sinixt site: it covers history, land stewardship, culture and the Desautel decision, and describes the transboundary Upper Columbia River basin.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Ktunaxa Nation Council",
        "kind": "host",
        "url": "https://ktunaxa.org/",
        "what": "The Ktunaxa Nation Council: its site names the Ktunaxa First Nations (ʔaq̓am, ʔakisq̓nuk, Yaqan Nuʔkiy and Yaq̓it ʔa·knuqⱡi’it).",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Syilx Okanagan Nation Alliance",
        "kind": "host",
        "url": "https://syilx.org/",
        "what": "The Syilx Okanagan Nation Alliance: its site speaks of Syilx sovereignty, title and rights within the Syilx territory and of inherent rights and responsibilities.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Confederated Tribes of the Colville Reservation",
        "kind": "host",
        "url": "https://www.colvilletribes.com/",
        "what": "The Confederated Tribes of the Colville Reservation, whose site lists twelve bands; the Sinixt's own Desautel page places Sinixt people on the Colville Confederated Tribes Reservation.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Agricultural Land Commission",
        "kind": "regulator",
        "url": "https://www.alc.gov.bc.ca/",
        "what": "The Provincial Agricultural Land Commission: its site covers the Agricultural Land Reserve, use of ALR land, applications and notices, and compliance.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Columbia Basin Trust",
        "kind": "regional",
        "url": "https://ourtrust.org/",
        "what": "Regional trust supporting the efforts of Columbia Basin communities.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": null,
    "claims": [
      {
        "field": "territory",
        "claim": "Ktunaxa say ʔamakʔis Ktunaxa, their traditional territory, covers about 70,000 square kilometres within the Kootenay region of southeastern British Columbia.",
        "label": "Ktunaxa Nation: territory map",
        "url": "https://ktunaxa.org/about/map/"
      },
      {
        "field": "territory",
        "claim": "The Sinixt describe a homeland across the transboundary Upper Columbia River basin, and name the Desautel decision of 23 April 2021.",
        "label": "Sinixt",
        "url": "https://sinixt.com/the-desautel-decision/"
      },
      {
        "field": "territory",
        "claim": "The Syilx Okanagan Nation Alliance speaks of Syilx sovereignty and collective title and rights within the Syilx territory.",
        "label": "Syilx Okanagan Nation Alliance",
        "url": "https://syilx.org/"
      },
      {
        "field": "tenure",
        "claim": "Under the ALR Use Regulation a parcel may carry one residence of up to 500 square metres total floor area plus an additional residence of up to 90 square metres on a parcel of 40 hectares or less (186 square metres above 40 hectares), and one secondary suite inside the principal residence.",
        "label": "ALR Use Regulation, BC Reg 30/2019",
        "url": "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/30_2019"
      },
      {
        "field": "entry",
        "claim": "The Agricultural Land Commission administers applications and decisions for the Agricultural Land Reserve; its site has sections on use of ALR land and applications and notices.",
        "label": "Provincial Agricultural Land Commission",
        "url": "https://www.alc.gov.bc.ca/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "quebec-eastern-townships": {
    "territoryShort": "Ndakina: W8banaki (Abenaki) territory",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "W8banaki (Grand Conseil de la Nation Waban-Aki)",
        "kind": "host",
        "url": "https://gcnwa.com/",
        "what": "The W8banaki council (Représenter, Développer, Administrer) for the Odanak and Wôlinak communities; its site has a Bureau du Ndakina (Ndakina Office) section and a services section.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Conseil des Abénakis d'Odanak",
        "kind": "host",
        "url": "https://caodanak.com/",
        "what": "The Conseil des Abénakis d'Odanak: the band council's own website, with member services, environment, council and administration, news and community sections.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Conseil des Abénakis de Wôlinak",
        "kind": "host",
        "url": "https://cawolinak.com/",
        "what": "The Conseil des Abénakis de Wôlinak: the band council's own website; it describes a community on the banks of the Bécancour river, established since 1704.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "ARTERRE",
        "kind": "access",
        "url": "https://arterre.ca/",
        "what": "ARTERRE: a Québec service for matching aspiring farmers with owners of farms and land; its site lists participating regions and offers.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Commission de protection du territoire agricole du Québec (CPTAQ)",
        "kind": "regulator",
        "url": "https://www.cptaq.gouv.qc.ca/",
        "what": "The Commission de protection du territoire agricole du Québec: the commission that protects farmland in the agricultural zone and decides on authorisations.",
        "checked": "2026-10-05",
        "via": "Playwright, Wayback copy of the owner page"
      }
    ],
    "notThere": null,
    "claims": [
      {
        "field": "territory",
        "claim": "The W8banaki Nation's own website writes the territory as Ndakina and names the Odanak and Wôlinak communities.",
        "label": "W8banaki (Grand Conseil de la Nation Waban-Aki)",
        "url": "https://gcnwa.com/en/"
      },
      {
        "field": "tenure",
        "claim": "Bill 86 amends the Act respecting the acquisition of farm land by non-residents so that the threshold of four hectares, above which a non-resident needs the commission's authorisation, can be lowered by regulation, and bars investment funds and some other buyers from acquiring farm land without the commission's authorisation.",
        "label": "Bill 86 (SQ 2025, c. 5), official English text",
        "url": "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF"
      },
      {
        "field": "entry",
        "claim": "ARTERRE matches aspiring farmers with owners of farms and land, and lists participating regions.",
        "label": "ARTERRE",
        "url": "https://arterre.ca/"
      },
      {
        "field": "obligation",
        "claim": "The Conseil des Abénakis de Wôlinak describes a community on the banks of the Bécancour river, established since 1704.",
        "label": "Conseil des Abénakis de Wôlinak",
        "url": "https://cawolinak.com/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "oaxaca": {
    "territoryShort": "Zapotec, Mixtec and Chatino comunal lands",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Instituto Estatal Electoral y de Participación Ciudadana de Oaxaca (IEEPCO)",
        "kind": "regulator",
        "url": "https://www.ieepco.org.mx/",
        "what": "The state electoral institute of Oaxaca; its site has a section on Sistemas Normativos Indígenas, the municipalities that elect their authorities by their own norms (usos y costumbres).",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Asamblea comunal o ejidal (no web page stands in for it)",
        "kind": "commons",
        "url": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf",
        "what": "On ejido and comunal land the first conversation is with the agrarian assembly itself; no web page stands in for it. The Ley Agraria sets what the assembly decides (art. 23) and says the community determines the use of its land (art. 100).",
        "checked": "2026-10-05",
        "via": "curl"
      }
    ],
    "notThere": {
      "forms": [
        "Arriving without the consent of the comunal or ejido assembly: the assembly alone approves contracts that give third parties the use of common-use land (art. 23), the community decides how its land is used (art. 100), and comunal land is inalienable (art. 99)."
      ],
      "basis": [
        {
          "label": "Ley Agraria, arts. 23, 99 and 100 (ordenjuridico.gob.mx)",
          "url": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "About 81.3% of Oaxacan territory is ejidal or communal land (social property, Registro Agrario Nacional, 2018); the state is divided into regions including Sierra Zapoteca, Región Mixe, Mixteca and Chinantla.",
        "label": "SIPAZ: Facts about Oaxaca (part 1)",
        "url": "https://www.sipaz.org/facts-about-oaxaca-i/?lang=en"
      },
      {
        "field": "tenure",
        "claim": "Comunal lands are inalienable, imprescriptible and unseizable (art. 99); contracts that give third parties the use of ejido land may run no longer than thirty years, extendable (art. 45).",
        "label": "Ley Agraria (ordenjuridico.gob.mx)",
        "url": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf"
      },
      {
        "field": "entry",
        "claim": "Approving contracts that give third parties the use or enjoyment of common-use land is within the exclusive competence of the ejido assembly, as are accepting and separating ejidatarios (art. 23).",
        "label": "Ley Agraria (ordenjuridico.gob.mx)",
        "url": "https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf"
      },
      {
        "field": "obligation",
        "claim": "The state has 570 municipalities, 418 of which elect their authorities through a traditional system, in assemblies; on comunal land the community determines the use of its land (Ley Agraria, art. 100).",
        "label": "SIPAZ: Facts about Oaxaca (part 1)",
        "url": "https://www.sipaz.org/facts-about-oaxaca-i/?lang=en"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "finger-lakes": {
    "territoryShort": "Cayuga homeland within Haudenosaunee territory",
    "contested": null,
    "trajectory": {
      "text": "The account on the Cayuga Nation Council's own website says the Nation, landless for over 200 years, has bought parcels back within its ancestral reservation boundaries since 2003, at market prices, and sets the purchases out year by year.",
      "sources": [
        {
          "label": "Cayuga Nation Council's own website: history and culture (quoted as that account, not as a legal conclusion)",
          "url": "https://cayuganation-nsn.gov/history-culture/"
        }
      ],
      "kind": "return"
    },
    "firstConversations": [
      {
        "name": "Cayuga Nation Council: history and culture",
        "kind": "host",
        "url": "https://cayuganation-nsn.gov/history-culture/",
        "what": "The Cayuga Nation Council's own website: its History & Culture page gives its account of the homeland, the 1795 and 1805 land agreements and the land it has bought back since 2003.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Haudenosaunee Confederacy",
        "kind": "host",
        "url": "https://www.haudenosauneeconfederacy.com/",
        "what": "The Haudenosaunee Confederacy's own site.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Onondaga Nation",
        "kind": "host",
        "url": "https://www.onondaganation.org/",
        "what": "The Onondaga Nation, \"People of the Hills\", own site.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Seneca Nation of Indians",
        "kind": "host",
        "url": "https://sni.org/",
        "what": "The official website of the Seneca Nation of Indians.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Finger Lakes Land Trust",
        "kind": "access",
        "url": "https://www.fllt.org/",
        "what": "Conserves the lands and waters of the Finger Lakes region.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Groundswell Center for Local Food and Farming",
        "kind": "access",
        "url": "https://groundswellcenter.org/",
        "what": "Groundswell Center for Local Food and Farming: its site lists an incubator farm, farmer training and land access programmes for beginning farmers near Ithaca.",
        "checked": "2026-10-05",
        "via": "curl"
      },
      {
        "name": "EcoVillage at Ithaca",
        "kind": "community",
        "url": "https://ecovillageithaca.org/about/living-here/",
        "what": "EcoVillage at Ithaca: its Living Here pages say anyone intending to live there for more than 30 days must complete its membership process before renting or buying.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Bidding on land at the northern end of Cayuga Lake, where the 1794 treaty and the court record place the Cayuga reservation: the treaty says the reservations remain theirs until they choose to sell."
      ],
      "basis": [
        {
          "label": "Treaty with the Six Nations, 1794, Article II (Kappler)",
          "url": "https://treaties.okstate.edu/treaties/treaty-with-the-six-nations-1794-0034"
        },
        {
          "label": "Cayuga Indian Nation of New York v. Pataki, 413 F.3d 266 (2d Cir. 2005)",
          "url": "https://static.case.law/f3d/413/html/0266-01.html"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "The account on the Cayuga Nation Council's own website names the Cayuga as the People of the Great Swamp, one of the five original nations of the Haudenosaunee Confederacy, and describes the 1795 and 1805 agreements with New York as illegal.",
        "label": "Cayuga Nation Council's website: history and culture",
        "url": "https://cayuganation-nsn.gov/history-culture/"
      },
      {
        "field": "territory",
        "claim": "The Haudenosaunee Confederacy page names the Cayuga among its member nations.",
        "label": "Haudenosaunee Confederacy: who we are",
        "url": "https://www.haudenosauneeconfederacy.com/who-we-are/"
      },
      {
        "field": "tenure",
        "claim": "Article II of the 1794 Treaty of Canandaigua acknowledges the lands reserved to the Oneida, Onondaga and Cayuga nations as their property, theirs until they choose to sell.",
        "label": "Treaty with the Six Nations, 1794 (Kappler)",
        "url": "https://treaties.okstate.edu/treaties/treaty-with-the-six-nations-1794-0034"
      },
      {
        "field": "tenure",
        "claim": "The Second Circuit describes the Cayuga \"Original Reservation\" as lands on the eastern and western shores of the northern end of Cayuga Lake, within the 64,015 acres of the claim.",
        "label": "Cayuga Indian Nation of New York v. Pataki, 413 F.3d 266",
        "url": "https://static.case.law/f3d/413/html/0266-01.html"
      },
      {
        "field": "entry",
        "claim": "EcoVillage at Ithaca requires anyone intending to live there for more than 30 days to complete its membership process, which makes them eligible to rent or buy.",
        "label": "EcoVillage at Ithaca: becoming a resident",
        "url": "https://ecovillageithaca.org/about/living-here/"
      },
      {
        "field": "obligation",
        "claim": "The Onondaga Nation publishes a land rights page in its own words.",
        "label": "Onondaga Nation: land rights",
        "url": "https://www.onondaganation.org/land-rights/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "virginia-piedmont": {
    "territoryShort": "Monacan and Mannahoac homeland",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Monacan Indian Nation",
        "kind": "host",
        "url": "https://www.monacannation.gov/",
        "what": "The Monacan Indian Nation's own site: its About Us page says Bear Mountain in Amherst County has been the home of the Monacan people for more than 10,000 years; it has a Land Acknowledgement page.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Twin Oaks Intentional Community",
        "kind": "community",
        "url": "https://www.twinoaks.org/",
        "what": "The community's own home page: it describes income sharing and carries pages for visiting, joining and internships.",
        "checked": "2026-10-05",
        "via": "Playwright, Wayback copy of the owner page"
      },
      {
        "name": "Living Energy Farm",
        "kind": "community",
        "url": "https://livingenergyfarm.org/",
        "what": "Intentional community; offers tours and is looking for partners for cooperative housing.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Piedmont Environmental Council",
        "kind": "network",
        "url": "https://www.pecva.org/",
        "what": "The Piedmont Environmental Council, a regional environmental non-profit with offices in Warrenton and Charlottesville.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Virginia Outdoors Foundation",
        "kind": "access",
        "url": "https://www.vof.org/",
        "what": "The Virginia Outdoors Foundation: protects open space in Virginia; its site reports 934,000 acres protected.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Buying one heir's share of heirs' property in the hope of forcing a sale: Virginia law lets any tenant in common compel partition, and the USDA notes that unclear title can force partition sales by third parties."
      ],
      "basis": [
        {
          "label": "Code of Virginia 8.01-81 (who may compel partition)",
          "url": "https://law.lis.virginia.gov/vacode/8.01-81/"
        },
        {
          "label": "USDA Farmers.gov: heirs' property landowners",
          "url": "https://www.farmers.gov/working-with-us/heirs-property-eligibility"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "The Monacan Indian Nation, federally recognized with over 3,200 citizens, says Bear Mountain in Amherst County has been the home of the Monacan people for more than 10,000 years, and that the James River Monacan and their Mannahoac allies on the Rappahannock controlled the Piedmont in 1607.",
        "label": "Monacan Indian Nation: About Us",
        "url": "https://www.monacannation.gov/about-us.html"
      },
      {
        "field": "tenure",
        "claim": "Special classifications of real estate for use-value assessment are established by section 58.1-3230 of the Code of Virginia, and apply where a county has adopted them by ordinance.",
        "label": "Code of Virginia 58.1-3230",
        "url": "https://law.lis.virginia.gov/vacode/58.1-3230/"
      },
      {
        "field": "tenure",
        "claim": "Tenants in common, joint tenants and coparceners of real property may compel partition (8.01-81); the court orders an appraisal in every partition action (8.01-81.1).",
        "label": "Code of Virginia 8.01-81 and 8.01-81.1",
        "url": "https://law.lis.virginia.gov/vacode/8.01-81.1/"
      },
      {
        "field": "entry",
        "claim": "Living Energy Farm offers tours and is looking for partners to build affordable, energy-independent cooperative housing.",
        "label": "Living Energy Farm",
        "url": "https://livingenergyfarm.org/"
      },
      {
        "field": "obligation",
        "claim": "The Monacan Indian Nation's site carries a Land Acknowledgement page.",
        "label": "Monacan Indian Nation",
        "url": "https://www.monacannation.gov/about-us.html"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "bas-saint-laurent": {
    "territoryShort": "Wolastoqiyik and Mi'gmaq territories",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "S'établir au Bas-Saint-Laurent",
        "kind": "access",
        "url": "https://www.bas-saint-laurent.org/fr/setablir/accueil-integration.html",
        "what": "The region's official welcome and integration service: support at every stage of a move.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Place aux jeunes en région",
        "kind": "access",
        "url": "https://placeauxjeunes.qc.ca/",
        "what": "Promotes migration of young adults to the regions (18-35).",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "ARTERRE",
        "kind": "access",
        "url": "https://arterre.ca/",
        "what": "Matching service between would-be farmers and farm or land owners.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Listuguj Mi'gmaq Government",
        "kind": "host",
        "url": "https://listuguj.ca/",
        "what": "The Listuguj Mi'gmaq Government's own site.",
        "checked": "2026-10-05",
        "via": "curl"
      },
      {
        "name": "Gesgapegiag Mi'gmaq First Nation",
        "kind": "host",
        "url": "https://gesgapegiag.ca/",
        "what": "The Gesgapegiag Mi'gmaq First Nation's own site.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Arriving to buy land on the south shore as though a treaty of cession had been made: Canada's own account says the Peace and Friendship Treaties signed with the Mi'kmaq and the Maliseet did not involve First Nations surrendering rights to the lands and resources they had used and occupied."
      ],
      "basis": [
        {
          "label": "Crown-Indigenous Relations and Northern Affairs Canada: Peace and Friendship Treaties",
          "url": "https://www.rcaanc-cirnac.gc.ca/eng/1100100028589/1539608999656"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "The Peace and Friendship Treaties were signed with the Mi'kmaq, Maliseet and Passamaquoddy before 1779 and did not involve First Nations surrendering rights to the lands and resources they had used and occupied.",
        "label": "CIRNAC: Peace and Friendship Treaties",
        "url": "https://www.rcaanc-cirnac.gc.ca/eng/1100100028589/1539608999656"
      },
      {
        "field": "tenure",
        "claim": "Bill 86 (2025) bars investment funds and buyers who are not a registered agricultural operation from acquiring farm land within 1,000 metres of an urbanisation perimeter without the commission's authorisation, and lets the Government lower the four-hectare non-resident threshold by regulation.",
        "label": "Bill 86 (SQ 2025, c. 5), official English text",
        "url": "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2025/2025C5A.PDF"
      },
      {
        "field": "entry",
        "claim": "The region runs an official welcome and integration service, with Place aux jeunes agents (ages 18 to 35, including immigrants with a valid work permit) in each of the eight MRCs.",
        "label": "S'établir au Bas-Saint-Laurent: accueil et intégration",
        "url": "https://www.bas-saint-laurent.org/fr/setablir/accueil-integration.html"
      },
      {
        "field": "entry",
        "claim": "ARTERRE offers accompaniment and matching between aspiring farmers and owners.",
        "label": "ARTERRE",
        "url": "https://arterre.ca/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "ne-missouri-se-iowa": {
    "territoryShort": "Sauk, Meskwaki, Ioway and Missouria lands",
    "contested": null,
    "trajectory": null,
    "firstConversations": [
      {
        "name": "Dancing Rabbit Ecovillage",
        "kind": "community",
        "url": "https://www.dancingrabbit.org/",
        "what": "Ecovillage and intentional community in northeast Missouri.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Sandhill Farm",
        "kind": "community",
        "url": "https://sandhillfarm.org/",
        "what": "Collective organic farm project and community in northeast Missouri.",
        "checked": "2026-10-05",
        "via": "curl"
      },
      {
        "name": "Practical Farmers of Iowa",
        "kind": "network",
        "url": "https://practicalfarmers.org/",
        "what": "Practical Farmers of Iowa: a farmer-led network for sustainable agriculture.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Iowa Tribe of Oklahoma",
        "kind": "host",
        "url": "https://www.iowanation.org/",
        "what": "The Iowa Tribe of Oklahoma's own site, which describes a sovereign nation located in Perkins, Oklahoma.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Meskwaki Nation (Sac & Fox Tribe of the Mississippi in Iowa)",
        "kind": "host",
        "url": "https://meskwaki.org/",
        "what": "The Meskwaki Nation's own site, with pages on who they are, council minutes, elections, news and forms.",
        "checked": "2026-10-05",
        "via": "Playwright, Wayback copy of the owner page"
      }
    ],
    "notThere": {
      "forms": [
        "Buying around neighbours in a farming country with an ageing population, or landing as a lone buyer chasing low prices rather than joining a community that already holds land in common."
      ],
      "basis": [
        {
          "label": "Dancing Rabbit Ecovillage: history (the community's own account of its land search)",
          "url": "https://www.dancingrabbit.org/about-dancing-rabbit-ecovillage/history/"
        },
        {
          "label": "Treaty with the Sauk and Foxes, 1824 (Kappler)",
          "url": "https://treaties.okstate.edu/treaties/treaty-with-the-sauk-and-foxes-1824-0207"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "In the 1824 treaty the Sauk and Fox tribes gave up their claims to lands within the state of Missouri between the Mississippi and Missouri rivers; the page names the Sac & Fox Nation of Missouri in Kansas and Nebraska, the Sac & Fox Nation of Oklahoma and the Sac & Fox Tribe of the Mississippi in Iowa as successors.",
        "label": "Treaty with the Sauk and Foxes, 1824 (Kappler)",
        "url": "https://treaties.okstate.edu/treaties/treaty-with-the-sauk-and-foxes-1824-0207"
      },
      {
        "field": "entry",
        "claim": "Dancing Rabbit's own history says its founders' land-search criteria were no zoning, no building codes, and affordable land where food could be grown without unsustainable irrigation.",
        "label": "Dancing Rabbit Ecovillage: history",
        "url": "https://www.dancingrabbit.org/about-dancing-rabbit-ecovillage/history/"
      },
      {
        "field": "obligation",
        "claim": "Dancing Rabbit's site carries a Land Acknowledgement Statement page beside its history.",
        "label": "Dancing Rabbit Ecovillage",
        "url": "https://www.dancingrabbit.org/about-dancing-rabbit-ecovillage/history/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  },
  "downeast-maine": {
    "territoryShort": "Dawnland: Wabanaki homeland",
    "contested": null,
    "trajectory": {
      "text": "The Wabanaki Tributary Land Returns are moving land back to Wabanaki communities: 11 landscapes and 50,000+ acres, returns to five tribal communities with seven non-native partner organisations, affirmed by the Wabanaki Commission on Land and Stewardship. The page gives no county breakdown, so the figure is not a Washington County figure.",
      "sources": [
        {
          "label": "Dawnland Return: Tributary Land Returns",
          "url": "https://dawnlandreturn.org/first-light/land-return"
        }
      ],
      "kind": "return"
    },
    "firstConversations": [
      {
        "name": "Dawnland Return",
        "kind": "host",
        "url": "https://dawnlandreturn.org/first-light/land-return",
        "what": "Wabanaki Tributary Land Returns: 11 landscapes and 50,000+ acres, returns to five tribal communities with seven non-native partner organisations, affirmed by the Wabanaki Commission on Land and Stewardship.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Penobscot Nation",
        "kind": "host",
        "url": "https://www.penobscotnation.org/",
        "what": "The Penobscot Nation's own site: its stated aim is to protect Penobscot people, culture and territory.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Passamaquoddy Tribe at Indian Township",
        "kind": "host",
        "url": "https://www.passamaquoddy.com/",
        "what": "The Passamaquoddy Tribe at Indian Township (Motahkomikuk): its own site, with a Treaty of 1794 page under culture and history.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Wabanaki REACH",
        "kind": "network",
        "url": "https://www.wabanakireach.org/",
        "what": "Wabanaki REACH: its site covers educational programmes and resources, truth-seeking and Wabanaki wellbeing.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Maine Farmland Trust",
        "kind": "access",
        "url": "https://www.mainefarmlandtrust.org/",
        "what": "Protects farmland and supports farmers.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      },
      {
        "name": "Maine Coast Heritage Trust",
        "kind": "access",
        "url": "https://www.mcht.org/",
        "what": "Maine Coast Heritage Trust: a conservation land trust for the Maine coast, islands and open land.",
        "checked": "2026-10-05",
        "via": "Playwright and curl"
      }
    ],
    "notThere": {
      "forms": [
        "Going after a parcel that a tribal government, the Wabanaki Commission or a Tributary conservation partner has in play for return, or putting a general-public request ahead of theirs: First Light's published process puts land requests from Chiefs and Tribal councils first and the general public last."
      ],
      "basis": [
        {
          "label": "Dawnland Return: Return (the process principles)",
          "url": "https://dawnlandreturn.org/first-light/lets-work-together/return"
        },
        {
          "label": "Dawnland Return: Tributary Land Returns",
          "url": "https://dawnlandreturn.org/first-light/land-return"
        }
      ]
    },
    "claims": [
      {
        "field": "territory",
        "claim": "The Wabanaki Tributary Land Returns cover 11 landscapes and 50,000+ acres, returns to five tribal communities with seven non-native organisations, affirmed by the Wabanaki Commission on Land and Stewardship.",
        "label": "Dawnland Return: Tributary Land Returns",
        "url": "https://dawnlandreturn.org/first-light/land-return"
      },
      {
        "field": "territory",
        "claim": "Kuwesuwi Monihq (Pine Island), 140 acres in Big Lake, is a Passamaquoddy return listed among the Wabanaki Commission projects.",
        "label": "Dawnland Return: Kuwesuwi Monihq (Pine Island)",
        "url": "https://dawnlandreturn.org/wabanaki-commission/projects/kuwesuwi-monihq-pine-island"
      },
      {
        "field": "tenure",
        "claim": "The Passamaquoddy Tribe at Indian Township publishes a page on the Treaty of 1794 under its culture and history pages.",
        "label": "Passamaquoddy Tribe at Indian Township: Treaty of 1794",
        "url": "https://www.passamaquoddy.com/?page_id=1422"
      },
      {
        "field": "entry",
        "claim": "Maine Farmland Trust runs Maine FarmLink and lists ways to access farmland.",
        "label": "Maine Farmland Trust: access farmland",
        "url": "https://www.mainefarmlandtrust.org/farmland/access-farmland"
      },
      {
        "field": "obligation",
        "claim": "First Light asks that Wabanaki participation and perspective come early in any process or decision (\"Nothing about us without us\"), and puts land recovery requests from Chiefs and Tribal councils first and the general public last.",
        "label": "Dawnland Return: Recenter; Return",
        "url": "https://dawnlandreturn.org/first-light/lets-work-together/return"
      },
      {
        "field": "obligation",
        "claim": "Sunrise County Economic Council reports that an estimated 59% of Washington County households cannot afford to purchase a home (June 2026).",
        "label": "Sunrise County Economic Council: new tools to understand the housing crisis",
        "url": "https://sunrisecounty.org/2026/06/new-tools-to-understand-washington-countys-housing-crisis/"
      }
    ],
    "reviewed": "2026-10-05",
    "status": "verified"
  }
};
