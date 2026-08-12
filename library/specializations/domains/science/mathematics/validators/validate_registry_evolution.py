#!/usr/bin/env python3
"""Preserve complete registry semantics and require append-only history for any mutation."""
import argparse,json,sys
from pathlib import Path
COLLECTIONS=['obligations','hypotheses','useSites','boundaries','randomDistributions','convergenceChecks','exactArithmetic','theoremReferences','waivers']
def load(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def rec(d):return {(name,r['id']):r for name in COLLECTIONS for r in d.get(name,[]) if isinstance(r,dict) and isinstance(r.get('id'),str)}
p=argparse.ArgumentParser();p.add_argument('before');p.add_argument('after');a=p.parse_args();errors=[]
try:old,new=load(a.before),load(a.after)
except Exception as e:print(f'ERROR: {e}',file=sys.stderr);raise SystemExit(2)
for field in ('contractVersion','profileId','profileVersion','profileCoverageRequired','semanticDetailsRequired'):
 if old.get(field)!=new.get(field):errors.append(f'top-level semantic field changed: {field}')
om,nm=rec(old),rec(new)
for key,prior in om.items():
 rid=key[1]
 if key not in nm:errors.append(f'dropped stable record {key[0]}/{rid}');continue
 current=nm[key];oh=prior.get('history',[]);nh=current.get('history',[])
 if nh[:len(oh)]!=oh:errors.append(f'{rid}: history rewritten')
 # artifactSha256 is the only process-owned binding field allowed to differ without record history.
 semantic_changed=any(prior.get(k)!=current.get(k) for k in set(prior)|set(current) if k not in {'history','artifactSha256'})
 if semantic_changed and len(nh)<=len(oh):errors.append(f'{rid}: semantic mutation without appended history')
for key in set(nm)-set(om):
 if not nm[key].get('history'):errors.append(f'{key[1]}: new record lacks creation history')
for e in errors:print('ERROR: '+e,file=sys.stderr)
print(json.dumps({'status':'fail' if errors else 'pass','preservedIds':len(om),'newIds':len(set(nm)-set(om)),'errors':errors},sort_keys=True));raise SystemExit(bool(errors))
