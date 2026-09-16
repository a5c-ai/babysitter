#!/usr/bin/env python3
import argparse,json,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--directory',required=True);a=p.parse_args();d=Path(a.directory)
if d.exists():
 print(f'ERROR: target already exists: {d}',file=sys.stderr);raise SystemExit(1)
d.mkdir(parents=True)
print(json.dumps({'status':'pass','directory':str(d)}))
