# Builds out/final/reciprocity.js (DRAFT data for the BIO track). Verified URL list comes from standing/orgs-check.json
import bio_env
import json
chk={ (r['region'],r['url']):r for r in json.load(open('standing/orgs-check.json')) }
D='2026-10-04'
def fc(region,name,kind,url,what,verified='curl+page'):
    return dict(name=name,kind=kind,url=url,what=what,checked=D,via=verified)
FC={
'alentejo':[
 fc('alentejo','ADRAL','regional','https://www.adral.pt/','Mixed-capital public company for regional development in the Alentejo, working through public and private partnerships.'),
 fc('alentejo','CCDR Alentejo','regulator','https://www.ccdr-a.gov.pt/','The regional coordination and development commission; covers environment, land-use planning and local administration for the region.'),
 fc('alentejo','Rede Rural Nacional','network','https://www.rederural.gov.pt/','Portugal\'s national rural network: a platform for sharing information and experience between rural actors.')],
'galicia':[
 fc('galicia','Xunta de Galicia, Consellería do Medio Rural','regulator','https://mediorural.xunta.gal/gl','The regional rural ministry portal; the Banco de Terras and the montes commons regime are administered from here.','curl 200 (title only); scope sentence from reverify/galicia.md')],
'transylvania':[
 fc('transylvania','Mihai Eminescu Trust','heritage','https://www.mihaieminescutrust.ro/','Foundation working on rural revitalisation in Transylvania and Maramureș through "an integrated approach to sustainable development".'),
 fc('transylvania','Fundația ADEPT Transilvania','regional','https://fundatia-adept.org/','Biodiversity and rural-development NGO based in Saschiz, working on the farmed landscapes and farming communities of Transylvania.'),
 fc('transylvania','Democratic Forum of Germans in Romania','community','https://www.fdgr.ro/','The organisation of the German minority in Romania, including the Transylvanian Saxon villages.','curl 200 (title only)')],
'connemara':[
 fc('connemara','Údarás na Gaeltachta','language','https://udaras.ie/','The state agency responsible for the economic, social and cultural development of the Gaeltacht (Irish-speaking areas).'),
 fc('connemara','Western Development Commission','regional','https://westerndevelopment.ie/','Regional development body for the west of Ireland.'),
 fc('connemara','Galway County Council, Planning and Building','regulator','https://www.galway.ie/en/planning-building','The planning authority: rural-housing and development-plan rules are set and decided here.')],
'pembrokeshire':[
 fc('pembrokeshire','Lammas','community','https://lammas.org.uk/en/welcome-to-lammas/','An ecovillage in the Preseli hills: a collective of smallholdings and eco-dwellings, "broadly in line with" Welsh Government One Planet Development policy.'),
 fc('pembrokeshire','Welsh Language Commissioner','language','https://www.welshlanguagecommissioner.wales/','Independent body whose statutory aim is to promote and facilitate use of the Welsh language.'),
 fc('pembrokeshire','Pembrokeshire County Council','regulator','https://www.pembrokeshire.gov.uk/','The local planning authority for One Planet Development applications.','curl 200; planning role from reverify/pembrokeshire.md')],
'cevennes':[
 fc('cevennes','Parc national des Cévennes','regulator','https://www.cevennes-parcnational.fr/fr','The national park authority for Mont Lozère, Mont Aigoual, the Causses and the Gorges du Tarn and Cévenol valleys.'),
 fc('cevennes','Safer: le droit de préemption','regulator','https://www.safer.fr/les-safer/le-droit-de-preemption/','The rural land agency\'s own account of its right to buy rural sales in priority, in place of the original buyer.'),
 fc('cevennes','Terre de Liens','access','https://terredeliens.org/','Citizen-funded movement that acquires farmland and leases it to farmers.')],
'south-tirol':[
 fc('south-tirol','Südtiroler Bauernbund','community','https://www.sbb.it/de/','The South Tyrol farmers\' association: informs its members on farming topics and policy.')],
'asturias':[
 fc('asturias','Gobierno del Principado de Asturias','regulator','https://www.asturias.es/','The regional government portal; urbanism and rural-development rules are set here.','curl 200 (title only)')],
'saxony-anhalt':[
 fc('saxony-anhalt','Ökodorf Sieben Linden','community','https://siebenlinden.org/de/','A long-established eco-village in the Altmark that offers seminars and information for people thinking of joining.','curl 200 (page text)'),
 fc('saxony-anhalt','Landgesellschaft Sachsen-Anhalt','regulator','https://www.lgsa.de/','Advises farmers, handles land-use conflicts and holds a statutory pre-emption role on farmland.','curl 200; pre-emption role from reverify/saxony-anhalt.md'),
 fc('saxony-anhalt','Kulturland eG','access','https://www.kulturland.de/','Cooperative that buys farmland for regionally rooted farms: "Lebendiges Land in gemeinsamer Hand".')],
'estonia-rural':[
 fc('estonia-rural','Kodukant','community','https://kodukant.ee/','The Estonian village movement: joins associations that develop village communities and their living environment.'),
 fc('estonia-rural','Setomaa vald','community','https://setomaa.ee/','The Setomaa municipality, home of the Seto people\'s living tradition.','curl 200 (title only)'),
 fc('estonia-rural','Maainfo (AKIS)','network','https://www.maainfo.ee/','Estonia\'s agricultural knowledge and innovation system: farming and rural-life information in one place.'),
 fc('estonia-rural','Maa- ja Ruumiamet','regulator','https://maaruum.ee/','The Land and Spatial Board.','curl 200 (title only)')],
'cascadia':[
 fc('cascadia','Confederated Tribes of Grand Ronde','host','https://www.grandronde.org/','Tribal government; its own words: it unites the Umpqua, Molalla, Rogue River, Kalapuya and Chasta peoples, rooted in ancestral lands across western Oregon.'),
 fc('cascadia','Confederated Tribes of Siletz Indians','host','https://ctsi.nsn.us/','Tribal government; describes itself as a confederation of tribes and bands whose ancestral territory included all of western Oregon.','curl 200 + WebFetch of page text'),
 fc('cascadia','Oregon Agricultural Trust','access','https://www.oregonagtrust.org/','Partners with farmers and ranchers to protect agricultural land.')],
'vermont':[
 fc('vermont','Vermont Commission on Native American Affairs','host','https://vcnaa.vermont.gov/','State commission advising on and advocating for Native American communities in Vermont; lists the four state-recognised tribes.'),
 fc('vermont','W8banaki (Grand Conseil de la Nation Waban-Aki)','host','https://gcnwa.com/','Tribal council since 1979 for the Abenaki communities of Odanak and Wôlinak in Québec; runs a Ndakina territorial office.'),
 fc('vermont','Land For Good','access','https://landforgood.org/','Helps farmers access land to start, expand or transfer a farm.'),
 fc('vermont','Vermont Housing and Conservation Board','access','https://vhcb.org/','Invests in permanently affordable housing and in conservation.'),
 fc('vermont','Vermont Land Trust','access','https://vlt.org/','Protects farms, forests and community places.')],
'southern-appalachians':[
 fc('southern-appalachians','Cherokee Nation','host','https://www.cherokee.gov/','Federally recognised government of the Cherokee people (Oklahoma); the Eastern Band of Cherokee Indians, at the Qualla Boundary, is the Cherokee government in North Carolina (its own site could not be verified from here).'),
 fc('southern-appalachians','Black Family Land Trust','access','https://www.bflt.org/','North Carolina land trust dedicated to preserving land owned by Black families.'),
 fc('southern-appalachians','Organic Growers School','network','https://www.organicgrowersschool.org/','Western North Carolina non-profit: organic farming mentorship and sustainable-agriculture programmes.')],
'driftless':[
 fc('driftless','Ho-Chunk Nation','host','https://ho-chunknation.com/','Tribal government; says the Nation has been on these lands "for over three ice ages".'),
 fc('driftless','Driftless Area Land Conservancy','access','https://driftlessconservancy.org/','Conserves the Driftless Area and its ecological and community connections.'),
 fc('driftless','Marbleseed','network','https://marbleseed.org/','Supports Midwest organic and regenerative farmers (formerly MOSES).'),
 fc('driftless','Land Stewardship Project','network','https://landstewardshipproject.org/','Promotes an ethic of stewardship for farmland and healthy communities.')],
'ozarks':[
 fc('ozarks','Osage Nation','host','https://www.osagenation-nsn.gov/','Federally recognised Osage government, headquartered in Pawhuska, Oklahoma.'),
 fc('ozarks','Quapaw Nation','host','https://www.quapawnation.com/','Federally recognised Quapaw government (Quapaw territory lies to the south of the Ozarks).')],
'northern-new-mexico':[
 fc('northern-new-mexico','Taos Pueblo','host','https://taospueblo.com/','Describes itself as home to the Taos Pueblo people "for thousands of years"; has a visiting page and pages on water rights and Blue Lake.','curl 200 + WebFetch'),
 fc('northern-new-mexico','Picuris Pueblo','host','https://www.picurispueblo.org/','Pueblo in Taos County; governed by its Tribal Council.','curl 200 + WebFetch'),
 fc('northern-new-mexico','New Mexico Acequia Association','commons','https://lasacequias.org/','Statewide acequia association: protects water and acequias and honours cultural heritage.'),
 fc('northern-new-mexico','Taos Land Trust','access','https://taoslandtrust.org/','Local land trust.','curl 200 (title only)')],
'nova-scotia':[
 fc('nova-scotia','Kwilmu\'kw Maw-klusuaqn (Mi\'kmaw Rights Initiative)','host','https://mikmaqrights.com/','Works for the Mi\'kmaq of Nova Scotia, through the Assembly of Nova Scotia Mi\'kmaw Chiefs, in talks with the Province and Canada on implementing treaty rights; reports over 600 active consultations.','curl 200 + WebFetch'),
 fc('nova-scotia','Native Council of Nova Scotia','host','https://www.ncns.ca/','Representative body for Mi\'kmaq and Indigenous people living off reserve in Nova Scotia.','curl 200 (title only); role from the Council\'s name'),
 fc('nova-scotia','Peace and Friendship Treaties (CIRNAC)','protocol','https://www.rcaanc-cirnac.gc.ca/eng/1100100028589/1539608999656','Federal explainer on the Peace and Friendship Treaties signed on the East Coast with the Mi\'kmaq and others.')],
'kootenays':[
 fc('kootenays','Sinixt','host','https://sinixt.com/','Describes itself as a transboundary Indigenous tribe in the United States and an Aboriginal People of Canada; homeland is the upper Columbia River watershed.'),
 fc('kootenays','Ktunaxa Nation Council','host','https://ktunaxa.org/','Council of the Ktunaxa First Nations (ʔaq̓am, ʔakisq̓nuk, Yaqan Nuʔkiy, Yaq̓it ʔa·knuqⱡi’it).'),
 fc('kootenays','Syilx Okanagan Nation Alliance','host','https://syilx.org/','Syilx Okanagan Nation Alliance: asserts an inherent right and responsibility to enjoy, manage and protect its peoples, lands and resources.'),
 fc('kootenays','Confederated Tribes of the Colville Reservation','host','https://www.colvilletribes.com/','Colville Tribes (Washington State): the Sinixt (Lakes) are one of the peoples within the Confederation.','curl 200 (title only); Sinixt link from sinixt.com'),
 fc('kootenays','Agricultural Land Commission','regulator','https://www.alc.gov.bc.ca/','Provincial tribunal that administers the Agricultural Land Reserve and decides applications in it.'),
 fc('kootenays','Columbia Basin Trust','regional','https://ourtrust.org/','Regional trust supporting the efforts of Columbia Basin communities.')],
'quebec-eastern-townships':[
 fc('quebec-eastern-townships','W8banaki (Grand Conseil de la Nation Waban-Aki)','host','https://gcnwa.com/','Tribal council for the Abenaki communities of Odanak and Wôlinak; representation, development and administration; runs the Ndakina territorial office.'),
 fc('quebec-eastern-townships','Conseil des Abénakis d\'Odanak','host','https://caodanak.com/','Band council of Odanak.'),
 fc('quebec-eastern-townships','Conseil des Abénakis de Wôlinak','host','https://cawolinak.com/','Band council of Wôlinak.'),
 fc('quebec-eastern-townships','ARTERRE','access','https://arterre.ca/','Québec matching service between would-be farmers and farm or land owners.')],
'oaxaca':[
 fc('oaxaca','Instituto Estatal Electoral y de Participación Ciudadana de Oaxaca (IEEPCO)','regulator','https://www.ieepco.org.mx/','Autonomous public body that organises elections in Oaxaca, including in the municipalities governed by indigenous normative systems (usos y costumbres).','curl 200 + title; role from reverify/oaxaca.md')],
'scottish-highlands':[
 fc('scottish-highlands','Community Land Scotland','network','https://www.communitylandscotland.org.uk/','The national representative body for community landowners; members\' pages describe each community estate.','WebFetch'),
 fc('scottish-highlands','Crofting Commission','regulator','https://www.crofting.scotland.gov.uk/','Regulates and promotes crofting; croft assignations, residency and use duties go through it.'),
 fc('scottish-highlands','Knoydart Foundation','community','https://knoydart.org/','Community landowner of the Knoydart peninsula since 1999; rents homes to residents.'),
 fc('scottish-highlands','Isle of Eigg Heritage Trust','community','https://isleofeigg.org/','Community landowner of Eigg since 1997; the community decides where new homes go.'),
 fc('scottish-highlands','Assynt Foundation','community','https://www.assyntfoundation.scot/','Community owner of the Glencanisp and Drumrunie estates since 2005.'),
 fc('scottish-highlands','Assynt Development Trust','community','https://assyntdevelopmenttrust.org/','Works for all the communities of Assynt; runs the Glebe housing project.'),
 fc('scottish-highlands','Applecross Community Company','community','https://www.applecrosscommunitycompany.org/','Works with the Applecross community to enable a viable population to live and work there; holds affordable homes tenanted by local residents.')],
'north-karelia-kainuu':[
 fc('north-karelia-kainuu','Kainuun kylät ry','network','https://www.kainuunkylat.fi/','Umbrella association of Kainuu villages: "for the vitality of villages and residential areas".'),
 fc('north-karelia-kainuu','Pohjois-Karjalan maakuntaliitto','regional','https://pohjois-karjala.fi/','The North Karelia regional council, whose aim is to make the region a better place to live, study, work and run a business.'),
 fc('north-karelia-kainuu','Leader Suomi','network','https://leadersuomi.fi/','National list of the Leader groups that fund village, association and enterprise projects.'),
 fc('north-karelia-kainuu','Snowchange Cooperative','community','https://www.snowchange.org/','Works with Indigenous and local communities in northern regions; headquartered in Selkie village, North Karelia.')],
'millevaches':[
 fc('millevaches','Parc naturel régional de Millevaches en Limousin','regulator','https://www.pnr-millevaches.fr/','The regional park authority (charter perimeter of 124 communes).'),
 fc('millevaches','Faux-la-Montagne: nouveaux arrivants','community','https://fauxlamontagne.fr/nouveaux-arrivants/','A commune\'s own page for newcomers: "L\'accueil de nouveaux habitants est au cœur de nos préoccupations".'),
 fc('millevaches','Terre de Liens Limousin','access','https://terredeliens.org/limousin/','Regional branch: debate on the future of farmland and concrete actions; directs would-be farmers to Objectif Terres.'),
 fc('millevaches','Objectif Terres','access','https://www.objectif-terres.org/','Platform for farm projects, farm and land offers and transfers.')],
'teruel-uplands':[
 fc('teruel-uplands','Serranía Celtibérica: Bolsa de Repoblación','access','https://www.celtiberica.es/bolsaderepoblacion/index.html','Tool that connects offers and demands in rural areas to recover population.'),
 fc('teruel-uplands','Pueblos Vivos Aragón','access','https://pueblosvivosaragon.com/como-te-podemos-ayudar/','LEADER-funded service offering information, guidance and accompaniment to people moving to rural Aragón (EU nationals and people with Spanish work and residence permits).','page opened by teruel-uplands researcher; curl 200'),
 fc('teruel-uplands','Comunidad de Albarracín','commons','http://www.comunidaddealbarracin.org/index.php','The surviving historic commons community of the Sierra de Albarracín.','curl 200 (redirect page); description from teruel-uplands/standing.json sources'),
 fc('teruel-uplands','Teruel Existe','network','https://teruelexiste.info/','Citizens\' platform for the province of Teruel.','curl 200 (title only)')],
'valle-maira':[
 fc('valle-maira','Unione Montana Valle Maira','regulator','https://www.unionemontanavallemaira.it/','The union of mountain communes of the Valle Maira, province of Cuneo.'),
 fc('valle-maira','Espaci Occitan','community','https://www.espaci-occitan.org/','Occitan culture and language association; describes itself as the portal of the Occitan world, welcoming those who arrive.'),
 fc('valle-maira','Associazione Dislivelli','network','https://www.dislivelli.eu/','Research and communication on mountains; publishes on newcomers and mountain territories.'),
 fc('valle-maira','Chambra d\'Oc','network','https://www.chambradoc.it/','Occitan cultural association of the Italian valleys.','curl 200 (no page text); WebFetch certificate error')],
'finger-lakes':[
 fc('finger-lakes','Cayuga Nation','host','https://cayuganation-nsn.gov/history-culture/','The Nation\'s own account of its homeland, its land losses in 1795 and 1805, and its repurchases since 2003 (1,445 acres in 116 parcels, 2003-2024).'),
 fc('finger-lakes','Haudenosaunee Confederacy','host','https://www.haudenosauneeconfederacy.com/','The Confederacy\'s own site.'),
 fc('finger-lakes','Onondaga Nation','host','https://www.onondaganation.org/','The Onondaga Nation, "People of the Hills".'),
 fc('finger-lakes','Seneca Nation of Indians','host','https://sni.org/','Official site of the Seneca Nation.'),
 fc('finger-lakes','Finger Lakes Land Trust','access','https://www.fllt.org/','Conserves the lands and waters of the Finger Lakes region.'),
 fc('finger-lakes','Groundswell Center for Local Food and Farming','access','https://groundswellcenter.org/','Farm-training and incubator farm for beginning farmers near Ithaca.'),
 fc('finger-lakes','EcoVillage at Ithaca','community','https://ecovillageithaca.org/','Cohousing neighbourhoods built to promote experiential learning about sustainable living.')],
'virginia-piedmont':[
 fc('virginia-piedmont','Living Energy Farm','community','https://livingenergyfarm.org/','Intentional community; offers tours and is looking for partners for cooperative housing.'),
 fc('virginia-piedmont','Piedmont Environmental Council','network','https://www.pecva.org/','Regional environmental non-profit.','curl 200 (title only)'),
 fc('virginia-piedmont','Virginia Outdoors Foundation','access','https://www.vof.org/','Protects more than 910,000 acres of farmland, forest and open space in Virginia.')],
'bas-saint-laurent':[
 fc('bas-saint-laurent','S\'établir au Bas-Saint-Laurent','access','https://www.bas-saint-laurent.org/fr/setablir/accueil-integration.html','The region\'s official welcome and integration service: support at every stage of a move.'),
 fc('bas-saint-laurent','Place aux jeunes en région','access','https://placeauxjeunes.qc.ca/','Promotes migration of young adults to the regions (18-35).'),
 fc('bas-saint-laurent','ARTERRE','access','https://arterre.ca/','Matching service between would-be farmers and farm or land owners.'),
 fc('bas-saint-laurent','Listuguj Mi\'gmaq Government','host','https://listuguj.ca/','Mi\'gmaq government of Listuguj (Gespe\'gewa\'gi).','curl 200 (title only)'),
 fc('bas-saint-laurent','Gesgapegiag Mi\'gmaq First Nation','host','https://gesgapegiag.ca/','Mi\'gmaq First Nation on the Cascapédia rivers.'),
 fc('bas-saint-laurent','Wolastoqey Nation','host','https://wolastoqey.ca/','Wolastoqey Nation (New Brunswick).','curl 200 (title only)')],
'ne-missouri-se-iowa':[
 fc('ne-missouri-se-iowa','Dancing Rabbit Ecovillage','community','https://www.dancingrabbit.org/','Ecovillage and intentional community in northeast Missouri.'),
 fc('ne-missouri-se-iowa','Sandhill Farm','community','https://sandhillfarm.org/','Collective organic farm project and community in northeast Missouri.'),
 fc('ne-missouri-se-iowa','Practical Farmers of Iowa','network','https://practicalfarmers.org/','Farmer-led network supporting resilient farms and stronger communities.')],
'downeast-maine':[
 fc('downeast-maine','Dawnland Return','host','https://dawnlandreturn.org/first-light/land-return','Wabanaki Tributary Land Returns: 11 landscapes, 50,000+ acres, 5 tribal communities, 7 non-native partner organisations, affirmed by the Wabanaki Commission on Land and Stewardship.'),
 fc('downeast-maine','Penobscot Nation','host','https://www.penobscotnation.org/','Penobscot government: works to protect Penobscot people, culture and territory.'),
 fc('downeast-maine','Wabanaki REACH','network','https://www.wabanakireach.org/','Truth, healing and change work with the Wabanaki.'),
 fc('downeast-maine','Maine Farmland Trust','access','https://www.mainefarmlandtrust.org/','Protects farmland and supports farmers.'),
 fc('downeast-maine','Maine Coast Heritage Trust','access','https://www.mcht.org/','Protects islands, marshes and coastline.')],
}
SHORT={ # DRAFT territoryShort: every proper noun must appear in landStanding[id].territory (validator)
'alentejo':'Alentejo montado villages','galicia':'Galician parish commons (montes veciñais)','transylvania':'Transylvanian Saxon and Székely villages',
'connemara':'Gaeltacht communities of Connemara','pembrokeshire':'Pembrokeshire smallholding communities','cevennes':'Cévenol upland farming communities',
'south-tirol':'South Tyrolean farm families (Höfe)','asturias':'Asturian aldeas and montes comunales','saxony-anhalt':'East German villages and cooperatives',
'estonia-rural':'Estonian farmsteads and the Seto of Setomaa','cascadia':'Kalapuya homeland; Grand Ronde and Siletz peoples',
'vermont':'N\'dakinna: Western Abenaki homeland (contested)','southern-appalachians':'Cherokee homeland','driftless':'Ho-Chunk homeland',
'ozarks':'Osage homeland','northern-new-mexico':'Taos Pueblo and Hispano acequia communities','nova-scotia':'Mi\'kma\'ki (unceded)',
'kootenays':'Sinixt, Ktunaxa and Syilx territories (unceded)','quebec-eastern-townships':'Ndakina: W8banaki (Abenaki) territory','oaxaca':'Zapotec, Mixtec and Chatino comunal lands',
'scottish-highlands':'Highland crofting townships and community estates','north-karelia-kainuu':'Finnish village communities (not the Sámi homeland)',
'millevaches':'Montagne limousine villages and hamlets','teruel-uplands':'Aragonese upland villages and their commons','valle-maira':'Occitan-speaking mountain communes',
'finger-lakes':'Cayuga homeland within Haudenosaunee territory','virginia-piedmont':'Monacan and Mannahoac homeland','bas-saint-laurent':'Wolastoqiyik and Mi\'gmaq territories',
'ne-missouri-se-iowa':'Sauk, Meskwaki, Ioway and Missouria lands','downeast-maine':'Dawnland: Wabanaki homeland'}
# contested host authority (only where sourced)
CONT={
'vermont':dict(text='Whose standing counts here is disputed. Four groups in Vermont (Elnu Abenaki, Nulhegan Abenaki, Koasek, Abenaki Nation at Missisquoi) are recognised by the State of Vermont, since 2011 and 2012. The Abenaki First Nations of Odanak and Wôlinak, in Québec, carry the continuing historical connection and have contested the Indigenous identity of the Vermont groups. This page takes no side; it names both.',
 sources=[dict(label='Vermont Commission on Native American Affairs: state-recognised tribes',url='https://vcnaa.vermont.gov/recognition/recognized-tribes'),dict(label='W8banaki (Grand Conseil de la Nation Waban-Aki): Odanak and Wôlinak',url='https://gcnwa.com/'),dict(label='Re-verification note: Vermont territory (internal, human review required)',url='upgrade-2026-10/reverify/vermont.md')],
 flag='harm-sensitive: human review before publishing'),
'kootenays':dict(text='These are overlapping homelands, not three settled borders. The Sinixt say they are an Aboriginal People of Canada, as the Supreme Court of Canada held in R. v. Desautel (2021 SCC 17) after Canada had declared them extinct in 1956; the Syilx Okanagan Nation Alliance presents the Sinixt as part of the Syilx, and Ktunaxa territory also overlaps.',
 sources=[dict(label='Sinixt: the Desautel decision (the Nation\'s own account)',url='https://sinixt.com/the-desautel-decision/'),dict(label='Sinixt Nation: homeland',url='https://sinixt.com/'),dict(label='Ktunaxa Nation Council',url='https://ktunaxa.org/'),dict(label='Syilx Okanagan Nation Alliance',url='https://syilx.org/'),dict(label='Re-verification note (internal)',url='upgrade-2026-10/reverify/kootenays.md')],
 flag='source the Syilx and Ktunaxa overlap statements from their own pages before publishing'),
'finger-lakes':None,
}
TRAJ={
'finger-lakes':dict(text='The Cayuga Nation reports buying back 1,445 acres in 116 parcels between 2003 and 2024, at market prices, from land it says New York took in 1795 and 1805. A purchase near Cayuga Lake competes in the same market.',
 sources=[dict(label='Cayuga Nation: history and culture (the Nation\'s own account; quoted as the Nation\'s account, not as a legal conclusion)',url='https://cayuganation-nsn.gov/history-culture/')],kind='return'),
'downeast-maine':dict(text='The Wabanaki Tributary Land Returns are moving land back to Wabanaki communities: 11 landscapes, 50,000+ acres, five tribal communities, seven non-native partner organisations, affirmed by the Wabanaki Commission on Land and Stewardship. The page gives no county breakdown, so the figure is not a Washington County figure.',
 sources=[dict(label='Dawnland Return: Tributary Land Returns',url='https://dawnlandreturn.org/first-light/land-return')],kind='return'),
'kootenays':dict(text='The Sinixt were recognised by the Supreme Court of Canada in 2021 as an Aboriginal People of Canada with constitutionally protected rights in their traditional territory.',
 sources=[dict(label='Sinixt: the Desautel decision',url='https://sinixt.com/the-desautel-decision/')],kind='recognition'),
}
NOT={ # arrival forms for which the honest answer is "not there"; each form traces to a sourced fact
'galicia':dict(forms=['Buying freehold around the villagers who remain, instead of partnering with a comunidade de montes (the commons are inalienable and open only to residents of the settlement, admitted under each comunidade\'s statutes).'],basis=[dict(label='Lei 13/1989, arts. 2, 3.1, 16.1.c (BOE consolidated text)',url='https://www.boe.es/buscar/act.php?id=BOE-A-1990-3358')]),
'transylvania':dict(forms=['Arriving to buy farmland outside built-up areas without going through the village: relatives, co-owners, lessees, neighbours, young farmers and local residents hold first claim for 45 working days under Law 17/2014.'],basis=[dict(label='Legea 17/2014 (legislatie.just.ro)',url='https://legislatie.just.ro/Public/DetaliiDocument/156290')]),
'cevennes':dict(forms=['Buying agricultural land with no installation project a local structure can hold: Safer is told of every rural sale and can buy in place of the original purchaser.'],basis=[dict(label='Safer: le droit de préemption',url='https://www.safer.fr/les-safer/le-droit-de-preemption/')]),
'south-tirol':dict(forms=['Starting a farm of your own or detaching land from a Maso Chiuso: closed farms are indivisible and pass to one designated heir; a buyer needs commission approval and farming training or practice.'],basis=[dict(label='LP 17/2001 (Maso Chiuso), art. 6-bis',url='https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17/legge_provinciale_28_novembre_2001_n_17.aspx')]),
'saxony-anhalt':dict(forms=['Buying farmland as a non-farmer: the authority may refuse a sale that shuts a farmer out, and the Landgesellschaft holds a pre-emption right on farmland of 2 ha and up.'],basis=[dict(label='Reichssiedlungsgesetz §4',url='https://www.gesetze-im-internet.de/rsiedlg/__4.html')]),
'estonia-rural':dict(forms=['Treating e-Residency as a way to buy a farm: it grants no privilege to purchase agricultural or forest land; people who are not EEA or UK citizens may not acquire real estate in the Setomaa border parishes.'],basis=[dict(label='Restrictions on Acquisition of Immovables Act (Riigi Teataja, English)',url='https://www.riigiteataja.ee/en/akt/527122023007')]),
'oaxaca':dict(forms=['Holding land through a front-owner (prestanombre), or arriving without the consent of the comunal or ejido assembly: on ejido and comunal land the agrarian assembly decides who may use it, and comunal land is inalienable.'],basis=[dict(label='Ley Agraria (ordenjuridico.gob.mx)',url='https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf'),dict(label='Re-verification note (internal)',url='upgrade-2026-10/reverify/oaxaca.md')]),
'scottish-highlands':dict(forms=['Arriving as a buyer of an estate or township parcel: entry is by becoming a resident of a community landowner, never by outbidding it.','Skye, the tourist-core settlements and private estates, where housing is the binding constraint.'],basis=[dict(label='Scottish Highlands research brief and standing notes (internal)',url='upgrade-2026-10/regions/scottish-highlands/standing-notes.md')]),
'north-karelia-kainuu':dict(forms=['Lapland and the Sámi homeland, and the reindeer-herding municipalities of Kainuu (Hyrynsalmi, Suomussalmi, Puolanka), where herding is allowed irrespective of land ownership.'],basis=[dict(label='Act on the Sámi Parliament 974/1995 s.4; Reindeer Husbandry Act 848/1990 s.2 (Finlex)',url='upgrade-2026-10/regions/north-karelia-kainuu/standing-notes.md')]),
'millevaches':dict(forms=['A lone buyer of an isolated parcel with no local structure to hold the project.'],basis=[dict(label='Millevaches research brief and standing notes (internal)',url='upgrade-2026-10/regions/millevaches/standing-notes.md')]),
'teruel-uplands':dict(forms=['Arriving with no invitation from a municipality or a working farmer; building a new multi-household settlement on non-urban land; taking a scarce house a villager is looking for.'],basis=[dict(label='Teruel standing notes and sources (internal; Decreto Legislativo 1/2014 arts. 34-35)',url='upgrade-2026-10/regions/teruel-uplands/standing.json')]),
'valle-maira':dict(forms=['Buying a second home, or reusing a borgata the heirs or the commune have not invited anyone to reuse.'],basis=[dict(label='Valle Maira research brief (internal)',url='upgrade-2026-10/regions/briefs/valle-maira.md')]),
'finger-lakes':dict(forms=['Land the Cayuga Nation is repurchasing or has shown interest in; arriving through the Ithaca housing market.'],basis=[dict(label='Cayuga Nation: history and culture',url='https://cayuganation-nsn.gov/history-culture/'),dict(label='Finger Lakes research brief (internal)',url='upgrade-2026-10/regions/briefs/finger-lakes.md')]),
'virginia-piedmont':dict(forms=['Bidding on family land in heirs\'-property or Freedmen neighbourhoods; arriving as a lone buyer of a rural parcel.'],basis=[dict(label='Virginia Piedmont research brief (internal; heirs\'-property claim still to be sourced)',url='upgrade-2026-10/regions/briefs/virginia-piedmont.md')]),
'bas-saint-laurent':dict(forms=['Crown-land claims; arriving without French; treating Gaspésie as part of this region.'],basis=[dict(label='Bas-Saint-Laurent research brief (internal)',url='upgrade-2026-10/regions/briefs/bas-saint-laurent.md')]),
'ne-missouri-se-iowa':dict(forms=['Arriving as a lone buyer shopping on price: cheap land in shrinking farm towns is the displacement route here, not a reason to come.'],basis=[dict(label='NE Missouri and SE Iowa research brief (internal)',url='upgrade-2026-10/regions/briefs/ne-missouri-se-iowa.md')],flag='copy discipline: if this cannot be said plainly, move it to an ethics-page worked example'),
'downeast-maine':dict(forms=['Any parcel earmarked for return or under negotiation; arriving before meeting the tribal governments.'],basis=[dict(label='Dawnland Return',url='https://dawnlandreturn.org/first-light/land-return'),dict(label='Downeast Maine research brief (internal)',url='upgrade-2026-10/regions/briefs/downeast-maine.md')]),
}
CLAIMS={ # per-claim sources for BASE fields, pages opened in this session (bio) or by reverify agents
'cascadia':[dict(field='territory',claim='Grand Ronde unites the Umpqua, Molalla, Rogue River, Kalapuya and Chasta peoples, rooted in ancestral lands across western Oregon',label='Confederated Tribes of Grand Ronde (own site)',url='https://www.grandronde.org/'),dict(field='territory',claim='Siletz ancestors held more than 20 million acres of ancestral territory including all of western Oregon',label='Confederated Tribes of Siletz Indians (own site)',url='https://ctsi.nsn.us/')],
'nova-scotia':[dict(field='territory',claim='Peace and Friendship Treaties were signed on the East Coast with the Mi\'kmaq',label='CIRNAC: Peace and Friendship Treaties',url='https://www.rcaanc-cirnac.gc.ca/eng/1100100028589/1539608999656'),dict(field='territory',claim='Kwilmu\'kw Maw-klusuaqn works for the Mi\'kmaq of Nova Scotia on implementing treaty rights',label='Kwilmu\'kw Maw-klusuaqn (own site)',url='https://mikmaqrights.com/')],
'kootenays':[dict(field='territory',claim='The Sinixt homeland is the upper Columbia River watershed, Kettle Falls to the Big Bend north of Revelstoke',label='Sinixt (own site)',url='https://sinixt.com/'),dict(field='territory',claim='Ktunaxa Nation Council: four Ktunaxa First Nations',label='Ktunaxa Nation Council (own site)',url='https://ktunaxa.org/'),dict(field='territory',claim='Supreme Court of Canada decision (2021) that the Sinixt are an Aboriginal People of Canada',label='Sinixt: the Desautel decision',url='https://sinixt.com/the-desautel-decision/')],
'vermont':[dict(field='territory',claim='Four groups are recognised by the State of Vermont: Elnu Abenaki and Nulhegan Abenaki (2011); Koasek Traditional Band of the Koas Abenaki Nation and Abenaki Nation at Missisquoi (2012)',label='VCNAA: recognised tribes',url='https://vcnaa.vermont.gov/recognition/recognized-tribes'),dict(field='territory',claim='W8banaki represents the Abenaki communities of Odanak and Wôlinak and runs a Ndakina territorial office',label='W8banaki (own site)',url='https://gcnwa.com/')],
'finger-lakes':[dict(field='territory',claim='Ancestral homeland in the Finger Lakes, between the Onondaga to the east and the Seneca to the west; 1795 and 1805 sales; repurchases since 2003',label='Cayuga Nation: history and culture (own account)',url='https://cayuganation-nsn.gov/history-culture/')],
'driftless':[dict(field='territory',claim='Ho-Chunk Nation says it has been on these lands for over three ice ages',label='Ho-Chunk Nation (own site)',url='https://ho-chunknation.com/')],
'northern-new-mexico':[dict(field='territory',claim='Taos Pueblo describes itself as home to the Taos Pueblo people for thousands of years',label='Taos Pueblo (own site)',url='https://taospueblo.com/'),dict(field='tenure',claim='Acequia associations protect water and acequias',label='New Mexico Acequia Association',url='https://lasacequias.org/')],
'quebec-eastern-townships':[dict(field='territory',claim='W8banaki represents Odanak and Wôlinak and runs a Ndakina territorial office',label='W8banaki (own site)',url='https://gcnwa.com/')],
'downeast-maine':[dict(field='territory',claim='Wabanaki Tributary Land Returns: 11 landscapes, 50,000+ acres, 5 tribal communities, affirmed by the Wabanaki Commission on Land and Stewardship',label='Dawnland Return',url='https://dawnlandreturn.org/first-light/land-return')],
'galicia':[dict(field='tenure',claim='Montes veciñais are indivisible, inalienable, imprescriptible and unseizable (art. 2); owned by vecinos with an open household and habitual residence in the settlement (art. 3.1); statutes set admission of new comuneros (art. 16.1.c)',label='Lei 13/1989 (BOE consolidated text)',url='https://www.boe.es/buscar/act.php?id=BOE-A-1990-3358')],
'transylvania':[dict(field='entry',claim='45 working-day public pre-emption notice; relatives and co-owners, lessees, neighbours, young farmers and residents hold first claim',label='Legea 17/2014',url='https://legislatie.just.ro/Public/DetaliiDocument/156290')],
'cevennes':[dict(field='tenure',claim='Safer is informed of rural sales and can buy in priority in place of the original buyer; two months to decide',label='Safer: le droit de préemption',url='https://www.safer.fr/les-safer/le-droit-de-preemption/')],
'south-tirol':[dict(field='tenure',claim='Closed farms are indivisible; single designated heir; buyer needs commission approval and farming training or practice',label='LP 17/2001 (Maso Chiuso)',url='https://lexbrowser.provinz.bz.it/doc/it/lp-2001-17/legge_provinciale_28_novembre_2001_n_17.aspx')],
'saxony-anhalt':[dict(field='tenure',claim='Landgesellschaft holds a statutory pre-emption right on farmland of 2 ha and up',label='Reichssiedlungsgesetz §4',url='https://www.gesetze-im-internet.de/rsiedlg/__4.html')],
'estonia-rural':[dict(field='tenure',claim='EEA and OECD citizens may buy freely; others need authorisation for agricultural or forest land; border-parish restrictions',label='Restrictions on Acquisition of Immovables Act (English)',url='https://www.riigiteataja.ee/en/akt/527122023007')],
'oaxaca':[dict(field='obligation',claim='On ejido and comunal land the agrarian assembly decides who may use it; 418 of 570 municipalities are governed by usos y costumbres',label='Ley Agraria; SIPAZ',url='https://www.ordenjuridico.gob.mx/Documentos/Federal/pdf/wo6027.pdf'),dict(field='territory',claim='About 81% of Oaxaca is ejidal or communal land; Zapotec, Mixtec, Mixe, Chinantec, Chatino and other peoples',label='SIPAZ: facts about Oaxaca',url='https://www.sipaz.org/facts-about-oaxaca-i/?lang=en')],
}
out={}
ids=json.load(open('out/final/bioregions.json')).keys()
for i in ids:
    out[i]=dict(territoryShort=SHORT[i],contested=CONT.get(i),trajectory=TRAJ.get(i),firstConversations=FC.get(i,[]),notThere=NOT.get(i),claims=CLAIMS.get(i,[]),reviewed=D,status='draft')
json.dump(out,open('out/final/reciprocity.json','w'),indent=1,ensure_ascii=False)
print({k:(len(v['firstConversations']),bool(v['notThere']),bool(v['contested']),bool(v['trajectory']),len(v['claims'])) for k,v in out.items()})
# sanity: every firstConversations URL must be in the checked set with status 200 (or be justified)
bad=[]
for k,v in out.items():
    for f in v['firstConversations']:
        rows=[r for (rg,u),r in chk.items() if u==f['url']]
        if not rows or rows[0]['status']!='200': bad.append((k,f['url'],rows[0]['status'] if rows else 'not-checked'))
print('NOT-200 or unchecked:',bad)
