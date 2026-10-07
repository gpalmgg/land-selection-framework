"""Final build of the bioregion map assets (RESOLVE Ecoregions 2017, Natural Earth rivers).
Outputs under out/final/: bioregions-europe.geojson, bioregions-na.geojson (polygons, fill + click),
bioregion-borders-{europe,na}.geojson (shared ecoregion borders only: no coastline, no frame edge),
bioregion-labels.json, rivers-{europe,na}.geojson, manifest.json"""
import bio_env
import geopandas as gpd, pandas as pd, json, sys, os, shapely, hashlib, warnings
warnings.filterwarnings('ignore')
from shapely.geometry import Point, mapping, MultiLineString, LineString
from shapely.ops import unary_union, linemerge
from shapely import set_precision
from shapely.strtree import STRtree
from regions30 import R
RADIUS=150; FRAME=4; TOL=float(sys.argv[1]) if len(sys.argv)>1 else 0.03
os.makedirs('out/final',exist_ok=True)
g=gpd.read_file('raw/eco/Ecoregions2017.shp')[['ECO_NAME','BIOME_NUM','BIOME_NAME','REALM','ECO_ID','geometry']]
rv=pd.concat([gpd.read_file(f'zip://raw/{n}.zip') for n in ('ne_10m_rivers_lake_centerlines','ne_10m_rivers_europe','ne_10m_rivers_north_america')])
rv=rv[rv.name.notna()]
man={}
def rnd(geom,p=0.001): return set_precision(geom,p)
labels={}
for cont,fn,short in (('europe','bioregions-europe','europe'),('north-america','bioregions-na','na')):
    wins=[]
    for r in R:
        if r['continent']!=cont: continue
        crs=f"+proj=aeqd +lat_0={r['lat']} +lon_0={r['lon']} +datum=WGS84 +units=m"
        wins.append(gpd.GeoSeries([Point(r['lon'],r['lat'])],crs=4326).to_crs(crs).buffer(RADIUS*1000).to_crs(4326).iloc[0])
    win=unary_union(wins)
    sub=g[g.intersects(win)].copy().reset_index(drop=True)
    sub['geometry']=sub.geometry.intersection(win.buffer(FRAME))
    simp=shapely.coverage_simplify(sub.geometry.values,TOL)
    sub['geometry']=gpd.GeoSeries(simp,crs=4326)
    sub=sub[~sub.geometry.is_empty].reset_index(drop=True)
    # polygons
    feats=[{"type":"Feature","properties":{"id":int(e.ECO_ID),"n":e.ECO_NAME,"b":int(e.BIOME_NUM)},"geometry":mapping(rnd(e.geometry))} for _,e in sub.iterrows()]
    s=json.dumps({"type":"FeatureCollection","features":feats},separators=(',',':'))
    open(f'out/final/{fn}.geojson','w').write(s); man[f'{fn}.geojson']=len(s)
    # shared borders
    geoms=list(sub.geometry.values); tree=STRtree(geoms); lines=[]
    for i,a in enumerate(geoms):
        for j in tree.query(a):
            if j<=i: continue
            inter=a.boundary.intersection(geoms[j].boundary)
            if inter.is_empty: continue
            parts=[x for x in getattr(inter,'geoms',[inter]) if x.geom_type in('LineString','MultiLineString') and x.length>0]
            for x in parts:
                lines.append((int(sub.ECO_ID[i]),int(sub.ECO_ID[j]),x))
    from collections import defaultdict
    byp=defaultdict(list)
    for a,b,x in lines: byp[(a,b)].append(x)
    bf=[]
    for (a,b),xs in byp.items():
        m=linemerge(unary_union(xs)) if len(xs)>1 else xs[0]
        bf.append({"type":"Feature","properties":{"a":a,"b":b},"geometry":mapping(rnd(m))})
    s=json.dumps({"type":"FeatureCollection","features":bf},separators=(',',':'))
    open(f'out/final/bioregion-borders-{short}.geojson','w').write(s); man[f'bioregion-borders-{short}.geojson']=len(s)
    # labels: one per ecoregion = representative point of its largest part inside the 150 km windows
    lab=[]
    for i,e in sub.iterrows():
        inside=e.geometry.intersection(win)
        if inside.is_empty or inside.area<0.02: continue
        parts=list(inside.geoms) if hasattr(inside,'geoms') else [inside]
        big=max(parts,key=lambda p:p.area); rp=big.representative_point()
        lab.append(dict(id=int(e.ECO_ID),n=e.ECO_NAME,lp=[round(rp.x,2),round(rp.y,2)]))
    labels[cont]=lab
    # rivers
    r2=rv[rv.intersects(win)].copy(); r2['geometry']=r2.geometry.intersection(win)
    r2=r2[~r2.geometry.is_empty]
    r2['geometry']=r2.geometry.simplify(0.01)
    rf=[]
    for _,e in r2.iterrows():
        rf.append({"type":"Feature","properties":{"n":e['name'],"r":int(e['scalerank']) if 'scalerank' in e and pd.notna(e['scalerank']) else 9},"geometry":mapping(rnd(e.geometry))})
    s=json.dumps({"type":"FeatureCollection","features":rf},separators=(',',':'),ensure_ascii=False)
    open(f'out/final/rivers-{short}.geojson','w').write(s); man[f'rivers-{short}.geojson']=len(s.encode())
    print(cont,len(feats),'polys',len(bf),'borders',len(lab),'labels',len(rf),'rivers')
# core = the ecoregion is listed for at least one region in bioregions.json (share >= 0.10 in a 100 km disc);
# the other labels only name the neighbouring ecoregions that the 150 km windows reach, so the map can draw them quieter.
_listed={e['id'] for v in json.load(open('out/final/bioregions.json')).values() for e in v['ecoregions']}
for _c in labels:
    for _l in labels[_c]: _l['core']=_l['id'] in _listed
s=json.dumps(labels,separators=(',',':'),ensure_ascii=False); open('out/final/bioregion-labels.json','w').write(s); man['bioregion-labels.json']=len(s.encode())
print({k:round(v/1024) for k,v in man.items()}, 'TOTAL KB',round(sum(man.values())/1024))
