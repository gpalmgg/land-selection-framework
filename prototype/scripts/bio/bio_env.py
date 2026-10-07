"""Shared environment for the bioregion pipeline.

Every script in this folder does `import bio_env` first. That puts this folder on
sys.path and changes the working directory to the data workdir, because the scripts
use relative paths (raw/..., out/final/..., standing/...).

BIO_DATA (env) overrides the workdir. Default: upgrade-2026-10/tracks/bio-data, which holds
the 433 MB of raw downloads (RESOLVE Ecoregions 2017, HydroBASINS, Natural Earth rivers),
the intermediate JSON and out/final/ (the build output that is copied into prototype/data/).
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
BIO_DATA = os.environ.get('BIO_DATA') or os.path.join(REPO, 'upgrade-2026-10', 'tracks', 'bio-data')
if HERE not in sys.path:
    sys.path.insert(0, HERE)
os.chdir(BIO_DATA)
