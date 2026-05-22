export type AtlasReusableView = ServiceTowerReusableView;

export interface ServiceTowerReusableView {
  type: "service-tower";
  data: ServiceTowerViewData;
}

export interface ServiceTowerViewData {
  id: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  ctaLabel: string;
  floors: ServiceTowerFloor[];
  domains: ServiceTowerDomain[];
  stats: ServiceTowerStat[];
}

export interface ServiceTowerDomain {
  id: string;
  label: string;
  color: string;
}

export interface ServiceTowerStat {
  label: string;
  value: string | number;
}

export interface ServiceTowerFloor {
  id: string;
  label: string;
  subtitle: string;
  rooms: ServiceTowerRoom[];
}

export interface ServiceTowerRoom {
  id: string;
  label: string;
  eyebrow: string;
  kind: string;
  color: string;
  summary: string;
  metricLabel: string;
  metricValue: string | number;
  records: ServiceTowerRecord[];
  services: ServiceTowerService[];
}

export interface ServiceTowerRecord {
  id: string;
  label: string;
  kind: string;
  href: string;
  summary: string;
}

export interface ServiceTowerService {
  code: string;
  name: string;
  summary: string;
  kpis: string[];
  refs: ServiceTowerRecord[];
}
