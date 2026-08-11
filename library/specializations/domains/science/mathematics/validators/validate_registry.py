#!/usr/bin/env python3
"""Validate the complete proof-registry contract using Python standard library."""
import argparse, json, re, sys
from pathlib import Path
from schema_gate import validate as validate_schema
STATUSES={"open","supported","verified","failed","stale","waived"}; LEDGERS=["hypotheses","useSites","boundaries","randomDistributions","convergenceChecks","exactArithmetic","theoremReferences"]; ID_RE=re.compile(r"^[A-Z][A-Z0-9_-]+$")
DETAIL_FIELDS={
 "useSites":["lowerObject","upperObject","sideConditions","substitution"],
 "randomDistributions":["support","coordinateProbabilities","exclusions","couplingOrConditioning","interchangeJustification"],
 "convergenceChecks":["truncation","uniformBound","limitingTheorem","hypotheses"],
 "exactArithmetic":["inputEncoding","integerScaling","oracleCalls","maximumMagnitude","signedBitLength","exactComparisons","soundness","completeness","candidateCompleteness"],
 "theoremReferences":["sourceLabel","referenceCommand","targetEnvironment","numbered","compatibleKind"],
}
PATH_FIELDS=["parameterDomain","formula","startEndpoint","endEndpoint","ambientMembership","derivative","ftcBounds"]
def load(p): return json.loads(Path(p).read_text(encoding="utf-8-sig",errors="strict"))
def unique(rows,label,errors):
 s=set()
 for r in rows:
  rid=r.get("id") if isinstance(r,dict) else None
  if not isinstance(rid,str) or not ID_RE.fullmatch(rid): errors.append(f"{label}: invalid id {rid!r}")
  elif rid in s: errors.append(f"{label}: duplicate id {rid}")
  s.add(rid)
 return s
def nonempty(v): return isinstance(v,(str,list,dict)) and bool(v)
def main():
 ap=argparse.ArgumentParser(); ap.add_argument("registry"); ap.add_argument("--schema",required=True); ap.add_argument("--profile"); ap.add_argument("--applicable-modules-json"); ap.add_argument("--strict",choices=["draft","review","publication"],default="review"); a=ap.parse_args(); errors=[]
 try: d=load(a.registry); profile=load(a.profile) if a.profile else None; errors.extend(validate_schema(d,a.schema))
 except Exception as exc: print(f"cannot read JSON/schema: {exc}",file=sys.stderr); return 2
 if d.get("profileCoverageRequired") is not True: errors.append("profileCoverageRequired must be process-owned true")
 if d.get("semanticDetailsRequired") is not True: errors.append("semanticDetailsRequired must be process-owned true")
 for k in ["contractVersion","profileId","profileVersion","artifactSha256","obligations",*LEDGERS]:
  if k not in d: errors.append(f"missing top-level field {k}")
 if not re.fullmatch(r"[0-9a-f]{64}",d.get("artifactSha256","")): errors.append("artifactSha256 must be 64 lowercase hexadecimal characters")
 obligations=d.get("obligations",[]); obligations=obligations if isinstance(obligations,list) else []; ids=unique(obligations,"obligations",errors); ledger_ids={}; all_ids=set(ids)
 for name in LEDGERS:
  rows=d.get(name,[])
  if not isinstance(rows,list): errors.append(f"{name} must be an array"); rows=[]
  ledger_ids[name]=unique(rows,name,errors); overlap=all_ids&ledger_ids[name]
  if overlap: errors.append(f"IDs must be globally unique; repeated in {name}: {sorted(overlap)}")
  all_ids|=ledger_ids[name]
 for ob in obligations:
  oid=ob.get("id","<unknown>"); status=ob.get("status")
  if status not in STATUSES: errors.append(f"{oid}: invalid obligation status {status!r}")
  for k in ("kind","required","statement","evidence","verificationMethod"):
   if k not in ob: errors.append(f"{oid}: missing {k}")
  if status in {"supported","verified"} and (not ob.get("evidence") or not ob.get("verificationMethod")): errors.append(f"{oid}: {status} requires evidence and verificationMethod")
  for field,valid in [("dependencyIds",ids),("hypothesisIds",ledger_ids.get("hypotheses",set())),("useSiteIds",ledger_ids.get("useSites",set())),("boundaryIds",ledger_ids.get("boundaries",set()))]:
   for ref in ob.get(field,[]):
    if ref not in valid: errors.append(f"{oid}: unresolved {field} reference {ref}")
  if ob.get("kind")=="use-site" :
   path_tuple=ob.get("pathTuple",{})
   for f in PATH_FIELDS:
    if not nonempty(path_tuple.get(f)): errors.append(f"{oid}: pathTuple missing semantic field {f}")
   if path_tuple.get("endEndpoint") and ob.get("displayedEndpoint") and path_tuple["endEndpoint"]!=ob["displayedEndpoint"]: errors.append(f"{oid}: semantic path endpoint differs from displayed endpoint")
  if a.strict=="publication" and ob.get("required",True) and status not in {"supported","verified"}: errors.append(f"{oid}: publication requires supported/verified status, found {status}")
 for name in LEDGERS:
  for r in d.get(name,[]):
   rid=r.get("id","<unknown>"); status=r.get("status")
   for k in ("required","status","evidence"):
    if k not in r: errors.append(f"{rid}: missing {k}")
   if status in {"supported","verified","covered"} and not r.get("evidence"): errors.append(f"{rid}: {status} requires evidence")
   if status=="not-applicable" and not r.get("reason"): errors.append(f"{rid}: not-applicable requires reason")
   if True:
    for f in DETAIL_FIELDS.get(name,[]):
     present = f in r and (isinstance(r.get(f), bool) or nonempty(r.get(f)))
     if r.get("required",True) and status!="not-applicable" and not present: errors.append(f"{rid}: missing {f}")
   for oid in r.get("obligationIds",[]):
    if oid not in ids: errors.append(f"{rid}: unresolved obligation {oid}")
   if a.strict=="publication" and r.get("required",True) and status not in {"supported","verified","covered","not-applicable"}: errors.append(f"{rid}: publication status {status} is not closed")
 if profile:
  if d.get("profileId")!=profile.get("id") or d.get("profileVersion")!=profile.get("version"): errors.append("registry profile id/version does not match profile")
  module_ids=profile.get("moduleSelection",{}).get("modules",[]); classifications=d.get("applicableModules",[]); by_module={row.get("id"):row for row in classifications if isinstance(row,dict)}
  if a.applicable_modules_json:
   expected_classifications=json.loads(a.applicable_modules_json)
   if classifications!=expected_classifications: errors.append("registry applicableModules differ from process-selected applicability")
  if len(classifications)!=len(module_ids) or set(by_module)!=set(module_ids): errors.append("applicableModules must classify every profile module exactly once")
  for module_id in module_ids:
   row=by_module.get(module_id,{})
   if not isinstance(row.get("applicable"),bool) or not str(row.get("rationale","")).strip(): errors.append(f"invalid applicability classification for {module_id}")
  boundary_ids=ledger_ids.get("boundaries",set())
  for row in profile.get("edgeRows",[]):
   if row.get("id") not in boundary_ids: errors.append(f"missing profile boundary row {row.get('id')}")
  kinds={o.get("kind") for o in obligations}
  for kind in profile.get("requiredObligationKinds",[]):
   if kind not in kinds: errors.append(f"missing required obligation kind {kind}")
  required_ledger_rules=profile.get("requiredLedgers",[])
  applicable_module_ids={module_id for module_id in module_ids if by_module.get(module_id,{}).get("applicable") is True}
  templates_by_module={}
  for template in profile.get("obligationTemplates",[]): templates_by_module.setdefault(template.get("moduleId","common"),set()).add(template.get("id"))
  for rule in required_ledger_rules:
   if not isinstance(rule,dict) or not isinstance(rule.get("moduleId"),str) or not isinstance(rule.get("ledgers"),list):
    errors.append("profile requiredLedgers entries require moduleId and ledgers")
    continue
   module_id=rule["moduleId"]
   if module_id!="common" and module_id not in module_ids: errors.append(f"profile requiredLedgers names unknown module {module_id}")
   if module_id!="common" and module_id not in applicable_module_ids: continue
   applicable_template_ids=templates_by_module.get(module_id,set())
   for name in rule["ledgers"]:
    if name not in LEDGERS:
     errors.append(f"profile names unknown required ledger {name}")
     continue
    rows=d.get(name,[])
    linked_rows=[row for row in rows if isinstance(row,dict) and set(row.get("obligationIds",[])) & applicable_template_ids]
    if applicable_template_ids and not linked_rows: errors.append(f"required ledger {name} for selected module {module_id} must contain a record linked to an applicable obligation")
    if a.strict=="publication":
     for row in linked_rows:
      if row.get("status") not in {"supported","verified","covered"}: errors.append(f"required ledger {name} record {row.get('id','<unknown>')} for selected module {module_id} is not closed for publication")
  if d.get("profileCoverageRequired",False):
   profile_templates=profile.get("obligationTemplates",[]); template_ids=[t.get("id") for t in profile_templates]
   if len(template_ids)!=len(set(template_ids)): errors.append("profile obligation template IDs must be unique")
   profile_template_ids=set(template_ids); template_rows={}
   for obligation in obligations:
    template_id=obligation.get("templateId")
    if template_id in profile_template_ids: template_rows.setdefault(template_id,[]).append(obligation)
   for template in profile_templates:
    template_id=template.get("id"); module_id=template.get("moduleId","common"); selected=module_id=="common" or by_module.get(module_id,{}).get("applicable") is True; matches=template_rows.get(template_id,[])
    if selected and len(matches)!=1: errors.append(f"applicable profile obligation template {template_id} must occur exactly once")
    if not selected and matches: errors.append(f"inapplicable profile obligation template must be absent {template_id}")
    for actual in matches:
     if actual.get("id")!=template_id or actual.get("kind")!=template.get("kind") or actual.get("statement")!=template.get("statement"): errors.append(f"profile obligation template identity changed {template_id}")
 for w in d.get("waivers",[]):
  for f in ("id","owner","reason","scope","expires"):
   if not w.get(f): errors.append(f"waiver missing {f}")
 if a.strict=="publication" and d.get("waivers"): errors.append("publication mode forbids unresolved waivers")
 if errors:
  for e in errors: print(f"ERROR: {e}",file=sys.stderr)
  return 1
 print(json.dumps({"status":"pass","obligations":len(obligations),"ledgerRecords":sum(len(d.get(x,[])) for x in LEDGERS)},sort_keys=True)); return 0
if __name__=="__main__": raise SystemExit(main())
