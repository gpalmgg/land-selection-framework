import bio_env
import json
from regions30 import R
m=json.load(open('membership100.json'))
RAD=100
# curated: place = descriptive label written by the project (not an official or Indigenous bioregional name)
# watershed: major = named drainage the footprint sits in; parts = named rivers that drain it; drains = where the water ends up
C={
'alentejo':('Alentejo plains and montado oak woodland',('Sado, Tejo (Sorraia) and Guadiana headwaters',['Sorraia','Sado','Guadiana'],'Atlantic Ocean (Tejo and Sado estuaries, Gulf of Cádiz)',True)),
'galicia':('Atlantic Galicia: coastal rias and the interior Miño–Sil valleys',('Miño–Sil and the Galician Atlantic coast catchments',['Miño','Sil','Ulla','Tambre'],'Atlantic Ocean',False)),
'transylvania':('Transylvanian Basin and the Carpathian arc',('Mureș, Târnava and Olt',['Mureș','Târnava','Olt'],'Black Sea, by way of the Danube',False)),
'connemara':('Connemara: Atlantic blanket bog, loughs and hill commonage',('Corrib and Galway Bay coastal catchments, with the Shannon to the east',['Corrib','Shannon'],'Atlantic Ocean',False)),
'pembrokeshire':('South-west Wales coast and the Preseli hills',('Cleddau, Teifi and the Pembrokeshire coastal catchments',['Eastern Cleddau','Western Cleddau','Teifi'],'Celtic Sea and Cardigan Bay',False)),
'cevennes':('Cévennes: the southern edge of the Massif Central',('Hérault, Gardon and Cèze (Mediterranean slope) with the Tarn and Lot headwaters (Atlantic slope)',['Hérault','Gardon','Cèze','Tarn','Lot'],'Mediterranean Sea and Atlantic Ocean (the region straddles the divide)',True)),
'south-tirol':('South Tyrol: the Adige (Etsch) valley and the Dolomite flanks',('Adige (Etsch), with the Drava (Drau) headwaters in the east',['Adige','Eisack','Rienz','Drau'],'Adriatic Sea, and Black Sea by way of the Drava and Danube in the far east',True)),
'asturias':('Asturias: the Cantabrian mountains and coast',('Nalón, Narcea, Sella and the Cantabrian coastal catchments',['Nalón','Narcea','Sella'],'Cantabrian Sea (Bay of Biscay)',False)),
'saxony-anhalt':('Elbe–Saale lowlands and the Harz foreland',('Elbe, Saale and Bode',['Elbe','Saale','Bode'],'North Sea, by way of the Elbe',False)),
'estonia-rural':('Central Estonian plain: hemiboreal forest, bog and farmland',('Pärnu (Gulf of Riga), with the Emajõgi and Lake Peipus catchment to the east',['Pärnu','Emajõgi'],'Gulf of Riga, and the Gulf of Finland by way of Lake Peipus and the Narva (Baltic Sea)',True)),
'cascadia':('Willamette Valley and the Cascade foothills',('Willamette',['Willamette','Santiam','Clackamas'],'Pacific Ocean, by way of the Columbia',False)),
'vermont':('Green Mountains with the Champlain and Connecticut valleys',('Connecticut and Lake Champlain (Winooski, Lamoille)',['Connecticut','Winooski','Lamoille'],'Long Island Sound, and the St Lawrence by way of Lake Champlain and the Richelieu',True)),
'southern-appalachians':('Southern Blue Ridge and the French Broad valley',('French Broad and Tennessee, with Catawba and Broad on the eastern flank',['French Broad','Nolichucky','Pigeon','Catawba'],'Gulf of Mexico, by way of the Tennessee, Ohio and Mississippi (the eastern flank drains to the Atlantic)',True)),
'driftless':('Driftless Area: the unglaciated upper Mississippi hills and coulees',('Upper Mississippi tributaries: Wisconsin, Kickapoo, Black, Turkey',['Wisconsin','Black','Turkey','Kickapoo'],'Gulf of Mexico, by way of the Mississippi',False)),
'ozarks':('Ozark Plateau: karst hills of the White River country',('White River (with the Buffalo, Current and Eleven Point nearby)',['White','North Fork White','Current'],'Gulf of Mexico, by way of the White and the Mississippi',False)),
'northern-new-mexico':('Southern Rocky Mountains meeting the Rio Grande rift and the Taos Plateau',('Upper Rio Grande (Rio Pueblo de Taos, Rio Hondo, Red River, Rio Chama)',['Rio Grande','Rio Chama'],'Gulf of Mexico, by way of the Rio Grande',False)),
'nova-scotia':('Acadian forest and the Fundy and Northumberland shores of mainland Nova Scotia',('Shubenacadie and Salmon (Bay of Fundy), with the River Philip and East River (Northumberland Strait)',['Shubenacadie','Salmon'],'Bay of Fundy and Gulf of St Lawrence',True)),
'kootenays':('Columbia Mountains: the Selkirk and Purcell ranges and the Kootenay lakes',('Kootenay and upper Columbia (Slocan, Duncan, Lardeau)',['Kootenay','Columbia','Slocan','Duncan'],'Pacific Ocean, by way of the Columbia',False)),
'quebec-eastern-townships':('Appalachian foothills south-east of the St Lawrence lowlands',('Saint-François, Yamaska and Richelieu headwaters (Memphrémagog, Missisquoi)',['Saint-François','Yamaska','Richelieu'],'St Lawrence River and Gulf',False)),
'oaxaca':('Oaxaca: central valleys between the Sierra Madre del Sur and the Sierra Norte',('Atoyac–Verde (Pacific slope) with the Papaloapan (Gulf slope) in the Sierra Norte',['Atoyac','Verde','Papaloapan'],'Pacific Ocean and Gulf of Mexico (the region straddles the divide)',True)),
'scottish-highlands':('North-west Highlands: sea-loch glens from Lochaber to Sutherland',('West-flowing sea-loch catchments, with the Oykel, Shin and Conon to the east',['Oykel','Shin','Conon'],'The Minch and Atlantic Ocean in the west, the Dornoch and Cromarty Firths in the east',True)),
'north-karelia-kainuu':('Eastern Finnish lakeland and taiga: Karelian and Kainuu uplands',('Vuoksi (Saimaa) in North Karelia and Oulujoki in Kainuu',['Vuoksi','Pielisjoki','Oulujoki'],'Gulf of Finland by way of Lake Ladoga and the Neva, and the Gulf of Bothnia by way of the Oulujoki',True)),
'millevaches':('Montagne limousine: the granite plateau of the western Massif Central',('Vienne and Creuse (Loire), Vézère, Corrèze and Dordogne headwaters',['Vienne','Creuse','Vézère','Corrèze'],'Atlantic Ocean, by way of the Loire and the Gironde',True)),
'teruel-uplands':('Iberian System uplands: Albarracín, Gúdar–Javalambre and the Maestrazgo',('Headwaters of the Tajo, Turia, Júcar, Jiloca and Mijares',['Jiloca','Turia','Mijares','Tajo'],'Mediterranean Sea (Ebro, Turia, Júcar) and Atlantic Ocean (Tajo)',True)),
'valle-maira':('Cottian Alps: the Occitan valleys of Cuneo',('Maira, with Varaita and Grana (Po basin)',['Maira','Varaita','Po'],'Adriatic Sea, by way of the Po',False)),
'finger-lakes':('Finger Lakes: the Cayuga and Seneca lake basins at the edge of the Appalachian Plateau',('Seneca–Oneida–Oswego (Lake Ontario basin)',['Seneca','Cayuga Inlet','Oswego'],'Lake Ontario and the St Lawrence',False)),
'virginia-piedmont':('Virginia Piedmont: rolling uplands below the Blue Ridge',('James (Rivanna), Rappahannock (Rapidan) and York (North Anna)',['Rivanna','Rapidan','North Anna','South Anna'],'Chesapeake Bay',True)),
'bas-saint-laurent':('Lower St Lawrence south shore and the Notre-Dame Mountains',('Rimouski, Mitis and Trois-Pistoles to the estuary; Saint John (Madawaska) inland',['Rimouski','Mitis','Madawaska','Saint John'],'St Lawrence estuary and Bay of Fundy',True)),
'ne-missouri-se-iowa':('Dissected till plains and tallgrass prairie on the Mississippi border',('Des Moines, Skunk and Salt, with the Chariton (Missouri River) to the west',['Des Moines','Skunk','Salt','Chariton'],'Gulf of Mexico, by way of the Mississippi and the Missouri',False)),
'downeast-maine':('Downeast Maine: the Gulf of Maine coast and Acadian forest',('St Croix, Machias, Narraguagus and the other Washington County coastal rivers',['Saint Croix','Machias','Narraguagus'],'Gulf of Maine (Atlantic Ocean)',False)),
}
assert set(C)=={r['id'] for r in R},set(C)^{r['id'] for r in R}
BIOMES={1:'Tropical & Subtropical Moist Broadleaf Forests',2:'Tropical & Subtropical Dry Broadleaf Forests',3:'Tropical & Subtropical Coniferous Forests',4:'Temperate Broadleaf & Mixed Forests',5:'Temperate Conifer Forests',6:'Boreal Forests/Taiga',8:'Temperate Grasslands, Savannas & Shrublands',12:'Mediterranean Forests, Woodlands & Scrub',13:'Deserts & Xeric Shrublands',14:'Mangroves'}
BN={v:k for k,v in BIOMES.items()}
out={}
for r in R:
    d=m[r['id']]['disc100']; tot=sum(x['share'] for x in d)
    es=[]
    for x in d:
        s=x['share']/tot
        if s<0.10: continue
        es.append(dict(id=x['eco_id'],name=x['eco'],biome=x['biome'],share=round(round(s/0.05)*0.05,2)))
    es.sort(key=lambda e:-e['share'])
    pl,(wm,wp,wd,sp)=C[r['id']]
    out[r['id']]=dict(place=pl,primaryEcoregion=es[0]['name'],ecoregions=es,biome=es[0]['biome'],
      pointEcoregion=m[r['id']]['centroid_ecoregion'],
      watershed=dict(major=wm,rivers=wp,drainsTo=wd,straddlesDivide=sp),
      refPoint=[r['lon'],r['lat']],
      method='RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped')
import bio_env
import unicodedata
def norm(x): return ''.join(c for c in unicodedata.normalize('NFD',x.lower()) if unicodedata.category(c)!='Mn').replace('.',' ').strip()
rv=json.load(open('rivers100.json'))
for k,v in out.items():
    have={norm(n) for n,_ in rv[k]}
    got=[r for r in v['watershed']['rivers'] if any(norm(r) in h or h in norm(r) for h in have)]
    v['watershed']['riversCheckedAgainstNaturalEarth']=got
    v['watershed']['riversFromDossierOrKnowledge']=[r for r in v['watershed']['rivers'] if r not in got]
json.dump(out,open('out/final/bioregions.json','w'),indent=1,ensure_ascii=False)
for k,v in out.items(): print(k,'|',v['primaryEcoregion'],'|',[ (e['name'],e['share']) for e in v['ecoregions'][1:]],'| point:',v['pointEcoregion'])
