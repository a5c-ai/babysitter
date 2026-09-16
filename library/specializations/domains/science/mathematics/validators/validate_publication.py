#!/usr/bin/env python3
"""Require complete, hash-bound deterministic evidence before publication."""
import argparse,hashlib,json,sys
from pathlib import Path
def load(p):return json.loads(Path(p).read_text(encoding='utf-8'))
def within(r,p):
 try:Path(p).resolve().relative_to(Path(r).resolve());return True
 except ValueError:return False
p=argparse.ArgumentParser();p.add_argument('--round',required=True);p.add_argument('--artifact',required=True);p.add_argument('--registry',required=True);p.add_argument('--edge',required=True);p.add_argument('--source-gate',required=True);p.add_argument('--edge-gate',required=True);p.add_argument('--artifact-gate',required=True);p.add_argument('--tex-gate',required=True);p.add_argument('--grade',action='append',default=[]);p.add_argument('--required-score',type=int,required=True);p.add_argument('--manifest',required=True);a=p.parse_args();errors=[]
try:
 digest=hashlib.sha256(Path(a.artifact).read_bytes()).hexdigest();edge_digest=hashlib.sha256(Path(a.edge).read_bytes()).hexdigest();registry=load(a.registry);source=load(a.source_gate);edge=load(a.edge_gate);artifact=load(a.artifact_gate);tex=load(a.tex_gate);grades=[load(x) for x in a.grade]
except Exception as e:print(f'ERROR: cannot read publication evidence: {e}',file=sys.stderr);raise SystemExit(2)
for label,q in [('artifact',a.artifact),('registry',a.registry),('artifact gate',a.artifact_gate),('TeX gate',a.tex_gate),*(('grade',x) for x in a.grade)]:
 if not within(a.round,q):errors.append(f'{label} outside round')
for label,m in [('source',source),('edge',edge),('artifact',artifact)]:
 if m.get('status')!='pass':errors.append(f'{label} manifest not pass')
if source.get('complete') is not True:errors.append('source inventory incomplete')
if edge.get('strictness')!='publication':errors.append('edge manifest is not a publication gate')
if edge.get('openRows'):errors.append('open edge rows cannot publish')
if edge.get('edgeSha256')!=edge_digest:errors.append('edge manifest hash is stale')
if tex.get('status') not in {'pass','not-required','unavailable'}:errors.append('TeX manifest failed')
if tex.get('policy')=='required' and tex.get('status')!='pass':errors.append('required TeX compilation unavailable')
if tex.get('status')=='unavailable' and tex.get('unavailablePolicy')!='report':errors.append('unavailable TeX allowed only under explicit report policy')
if registry.get('artifactSha256')!=digest:errors.append('registry hash mismatch')
publication_open_statuses={'open','failed','stale','waived'}
required_obligations=[row for row in registry.get('obligations',[]) if row.get('required',True)]
ledger_names=['hypotheses','useSites','boundaries','randomDistributions','convergenceChecks','exactArithmetic','theoremReferences']
required_ledger_rows=[row for name in ledger_names for row in registry.get(name,[]) if row.get('required',True)]
open_required_obligations=[row.get('id') for row in required_obligations if row.get('status') in publication_open_statuses or row.get('status') not in {'supported','verified'}]
open_required_ledger_rows=[row.get('id') for row in required_ledger_rows if row.get('status') in publication_open_statuses or row.get('status') not in {'supported','verified','covered','not-applicable'}]
if open_required_obligations:errors.append(f'open/failed/stale/waived required obligations cannot publish: {open_required_obligations}')
if open_required_ledger_rows:errors.append(f'open/failed/stale/waived required ledger records cannot publish: {open_required_ledger_rows}')
if registry.get('waivers'):errors.append('waived obligations cannot publish')
round_id=Path(a.round).name
if len(grades)!=4 or {g.get('lens') for g in grades}!={'dependency-use-site','reconstruction-counterexample','boundary-exact-complexity','ambiguity-theorem-reference'}:errors.append('complete four-lens inventory required')
expected_edge_binding={'edgeSha256':edge_digest,'profileId':edge.get('profileId'),'profileVersion':edge.get('profileVersion'),'strictness':'review','openRows':edge.get('openRows',[])}
for g in grades:
 if g.get('roundId')!=round_id or g.get('artifactSha256')!=digest:errors.append(f"stale grade {g.get('lens')}")
 binding=g.get('edgeBinding',{})
 if any(binding.get(k)!=expected_edge_binding[k] for k in ('edgeSha256','profileId','profileVersion','strictness','openRows')):errors.append(f"stale edge binding in grade {g.get('lens')}")
 if g.get('totalScore')!=100 or g.get('findings') or g.get('blockingIssues') or g.get('materialDisagreements'):errors.append(f"nonconverged grade {g.get('lens')}")
 if g.get('perfectScoreDefensible') is not True:errors.append(f"undefended perfect grade {g.get('lens')}")
m={'status':'fail' if errors else 'pass','roundId':round_id,'artifactSha256':digest,'edgeMatrixSha256':edge_digest,'requiredScore':100,'inventory':{'sources':len(source.get('artifacts',[])),'edgeRows':edge.get('rowCount',0),'grades':len(grades),'bibliographyCitations':artifact.get('citations',0)},'manifests':{'source':source.get('status'),'edge':edge.get('status'),'artifact':artifact.get('status'),'tex':tex.get('status')},'errors':errors};manifest_path=Path(a.manifest).resolve();manifest_bytes=(json.dumps(m,indent=2,sort_keys=True)+'\n').encode('utf-8');manifest_path.write_bytes(manifest_bytes);publication={'status':m['status'],'manifestPath':str(manifest_path),'manifestSha256':hashlib.sha256(manifest_bytes).hexdigest(),**m}
for e in errors:print('ERROR: '+e,file=sys.stderr)
print(json.dumps(publication,sort_keys=True));raise SystemExit(bool(errors))
