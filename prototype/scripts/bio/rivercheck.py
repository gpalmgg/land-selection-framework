import bio_env
import geopandas as gpd, pandas as pd, warnings, json
warnings.filterwarnings('ignore')
from shapely.geometry import Point
from regions30 import R
rv=pd.concat([gpd.read_file(f'zip://raw/{n}.zip') for n in ('ne_10m_rivers_lake_centerlines','ne_10m_rivers_europe','ne_10m_rivers_north_america')])
rv=rv[rv.name.notna()]
out={}
for r in R:
    crs=f"+proj=aeqd +lat_0={r['lat']} +lon_0={r['lon']} +datum=WGS84 +units=m"
    disc=gpd.GeoSeries([Point(r['lon'],r['lat'])],crs=4326).to_crs(crs).buffer(100000).to_crs(4326).iloc[0]
    sub=rv[rv.intersects(disc)].copy()
    sub['len']=[x.intersection(disc).length for x in sub.geometry]
    top=sub.groupby('name')['len'].sum().sort_values(ascending=False)
    out[r['id']]=[ (k,round(v,2)) for k,v in top.head(12).items()]
    print(r['id'],'|',', '.join(f'{k}' for k,v in top.head(12).items()))
json.dump(out,open('rivers100.json','w'),indent=1)
