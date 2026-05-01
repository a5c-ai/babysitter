import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

type Params = Record<string, string | number>;
type Translate = (key: string, fallback: string, params?: Params) => string;

let translate: Translate = (_key, fallback, params) => format(fallback, params);

function format(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_match, key: string) => String(params[key] ?? `{${key}}`));
}

export function t(key: string, fallback: string, params?: Params): string {
  return translate(key, fallback, params);
}

const bundles = [
  {
    locale: "ja",
    namespace: "babysitter-pi",
    messages: {
      "cmd.babysit.description": "Babysitter のオーケストレーションスキルを読み込む",
      "cmd.babysitter.description": "/babysit のエイリアス",
      "cmd.skill.description": "Babysitter の {name} スキルを開く",
      "cmd.skill.alias": "/{name} のエイリアス",
    },
  },
  {
    locale: "zh-CN",
    namespace: "babysitter-pi",
    messages: {
      "cmd.babysit.description": "加载 Babysitter 编排技能",
      "cmd.babysitter.description": "/babysit 的别名",
      "cmd.skill.description": "打开 Babysitter {name} 技能",
      "cmd.skill.alias": "/{name} 的别名",
    },
  },
  {
    locale: "es",
    namespace: "babysitter-pi",
    messages: {
      "cmd.babysit.description": "Cargar la skill de orquestación de Babysitter",
      "cmd.babysitter.description": "Alias de /babysit",
      "cmd.skill.description": "Abrir la skill {name} de Babysitter",
      "cmd.skill.alias": "Alias de /{name}",
    },
  },
];

export function initI18n(pi: ExtensionAPI): void {
  const events = pi.events;
  if (!events) return;
  for (const bundle of bundles) events.emit("pi-core/i18n/registerBundle", bundle);
  events.emit("pi-core/i18n/requestApi", {
    namespace: "babysitter-pi",
    callback(api: { t?: Translate } | undefined) {
      if (typeof api?.t === "function") translate = api.t;
    },
  });
}
