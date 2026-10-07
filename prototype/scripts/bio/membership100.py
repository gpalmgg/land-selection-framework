import bio_env
import geopandas as gpd, json
from shapely.geometry import Point
from regions30 import R
g=gpd.read_file('raw/eco/Ecoregions2017.shp')
out={}
for r in R:
    pt=gpd.GeoSeries([Point(r['lon'],r['lat'])],crs=4326)
    crs=f"+proj=aeqd +lat_0={r['lat']} +lon_0={r['lon']} +datum=WGS84 +units=m"
    disc=pt.to_crs(crs).buffer(100000).to_crs(4326).iloc[0]
    cand=g[g.intersects(disc)]
    dproj=gpd.GeoSeries([disc],crs=4326).to_crs(crs).iloc[0]
    rows=[]
    for _,e in cand.iterrows():
        inter=gpd.GeoSeries([e.geometry.intersection(disc)],crs=4326).to_crs(crs).iloc[0]
        rows.append((inter.area/dproj.area,e.ECO_NAME,e.BIOME_NAME,e.REALM,int(e.ECO_ID)))
    rows.sort(reverse=True)
    cont=g[g.contains(Point(r['lon'],r['lat']))]
    cname=cont.iloc[0].ECO_NAME if len(cont) else None
    out[r['id']]=dict(centroid_ecoregion=cname,disc100=[dict(share=round(a,2),eco=n,biome=b,realm=re_,eco_id=i) for a,n,b,re_,i in rows if a>0.02])
    print(r['id'],'| centroid:',cname)
    for x in out[r['id']]['disc100']: print('    ',x['share'],x['eco'],'|',x['biome'],'|',x['realm'])
json.dump(out,open('membership100.json','w'),indent=1)
