import e, { Fragment as t, useEffect as n, useLayoutEffect as r, useMemo as i, useRef as a, useState as o } from "react";
import { createPortal as s } from "react-dom";
import { Fragment as c, jsx as l, jsxs as u } from "react/jsx-runtime";
//#region src/game/selectors.ts
function d(e) {
	let t = [], n = [];
	for (let r of e.selection.ids) {
		let i = e.world.units[r];
		if (i !== void 0) {
			t.push(i);
			continue;
		}
		let a = e.world.tasks[r];
		a !== void 0 && n.push(a);
	}
	return {
		units: t,
		tasks: n
	};
}
function f(e) {
	return e.alerts[e.alerts.length - 1];
}
function p(e, t) {
	return e.alerts.find((e) => t.includes(e.unitId));
}
function m(e) {
	let { units: t, tasks: n } = d(e), r = [];
	for (let e of n) r.push(e.id);
	for (let e of t) {
		let t = e.view.taskId;
		t !== null && !r.includes(t) && r.push(t);
	}
	return r.length === 0 ? [] : r.flatMap((t) => {
		let n = e.board.cards[t];
		return n === void 0 ? [] : [{
			taskId: t,
			taskKind: n.view.taskKind,
			column: n.view.column,
			runStage: n.runStage,
			inquiryPending: n.view.hasPendingInquiry,
			workspaceDirty: n.view.dirtyFileCount > 0,
			yolo: n.view.yolo,
			merged: n.view.merged,
			agentRoles: n.view.agentIds.flatMap((t) => {
				let n = e.board.agents[t];
				return n === void 0 ? [] : [n.role];
			})
		}];
	});
}
function h(e) {
	let { units: t, tasks: n } = d(e), r = [];
	return t.length > 0 && r.push("unit"), n.length > 0 && r.push("task"), {
		selection: {
			count: t.length + n.length,
			kinds: r,
			states: [...new Set(t.map((e) => e.view.state))],
			adapters: [...new Set(t.map((e) => e.view.agent))],
			taskStates: [...new Set(n.map((e) => e.view.state))],
			pausedUnits: t.filter((e) => e.view.paused).length
		},
		alerts: e.alerts.map((e) => ({
			hookRequestId: e.hookRequestId,
			unitId: e.unitId,
			kind: e.kind
		})),
		fleet: {
			totalUnits: e.meta.resources.unitCount,
			idleUnits: e.meta.resources.idleCount,
			busyUnits: e.meta.resources.busyCount,
			pendingAlerts: e.meta.resources.alertCount,
			simPaused: e.meta.paused
		},
		cards: m(e)
	};
}
function g(e, t) {
	let n = Math.max(0, e - t), r = Math.floor(n / 1e3), i = r % 60, a = Math.floor(r / 60) % 60, o = Math.floor(r / 3600), s = String(a).padStart(2, "0"), c = String(i).padStart(2, "0");
	return o > 0 ? `T+${o}:${s}:${c}` : `T+${s}:${c}`;
}
function _(e) {
	return String(Math.round(e));
}
function v(e) {
	return `$${e.toFixed(2)}`;
}
function y(e) {
	return `${Math.round(e * 100)}%`;
}
//#endregion
//#region src/microagent/mock/completionGen.ts
function b(e) {
	let t = 2166136261;
	for (let n = 0; n < e.length; n += 1) t ^= e.charCodeAt(n), t = Math.imul(t, 16777619);
	return t >>> 0;
}
var x = [
	"Gauge = calibrate(12);",
	"Relay = engageClutch(7);",
	"Manifold = readPressure();",
	"Index = registry.size + 1;",
	"Spool = windCoil(3, 9);"
], S = [
	" // torque within tolerance",
	" // verified against the rubric",
	" // gauge steady at 0.96"
], C = [
	"\"calibration\": \"0.96\",",
	"\"verified\": true,",
	"\"pressure\": 12,"
], w = [
	" color: var(--color-amber-glow);",
	" border: 1px solid rgb(185 145 63 / 0.4);",
	" letter-spacing: 0.08em;"
], T = [
	" — observed by the cogitator.",
	" (see the trial-rites ledger).",
	" as inscribed in the charter."
];
function E(e, t) {
	return e[t % e.length];
}
function D(e) {
	let t = e.lastIndexOf(".");
	return t >= 0 ? e.slice(t + 1).toLowerCase() : "";
}
function O(e) {
	let t = e.lineText, n = t.trim();
	if (n === "" || /^[}\])];?$/.test(n)) return "";
	let r = b(`${e.path}::${t}`), i = D(e.path);
	return i === "json" ? E(C, r) : i === "css" ? E(w, r) : i === "md" || i === "markdown" ? E(T, r) : /(?:const|let|var|function|return|=)\s*[\w$]*$/.test(n) ? E(x, r) : /[;{,)]$/.test(n) ? E(S, r) : E(x, r);
}
//#endregion
//#region src/microagent/mock/glyphs.ts
var k = "#d8b561", A = "#c25a5a";
function j(e, t = k) {
	return {
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="100%" height="100%" aria-hidden="true"><g fill="none" stroke="${t}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${e}</g></svg>`,
		palette: [t]
	};
}
//#endregion
//#region src/backend/mock/prng.ts
function M(e) {
	let t = e >>> 0;
	return () => {
		t = t + 1831565813 >>> 0;
		let e = t;
		return e = Math.imul(e ^ e >>> 15, e | 1), e ^= e + Math.imul(e ^ e >>> 7, e | 61), ((e ^ e >>> 14) >>> 0) / 4294967296;
	};
}
var N = class {
	seed;
	rng;
	drawCount = 0;
	constructor(e) {
		this.seed = e >>> 0, this.rng = M(this.seed);
	}
	get draws() {
		return this.drawCount;
	}
	next() {
		return this.drawCount += 1, this.rng();
	}
	int(e, t) {
		if (t < e) throw Error(`Prng.int: max (${t}) < min (${e})`);
		return e + Math.floor(this.next() * (t - e + 1));
	}
	chance(e) {
		return this.next() < e;
	}
	pick(e) {
		if (e.length === 0) throw Error("Prng.pick: empty array");
		return e[this.int(0, e.length - 1)];
	}
	shuffle(e) {
		let t = [...e];
		for (let e = t.length - 1; e > 0; --e) {
			let n = this.int(0, e), r = t[e];
			t[e] = t[n], t[n] = r;
		}
		return t;
	}
};
function P(e) {
	let t = 2166136261;
	for (let n = 0; n < e.length; n += 1) t ^= e.charCodeAt(n), t = Math.imul(t, 16777619);
	return t >>> 0;
}
//#endregion
//#region src/microagent/mock/iconGen.ts
var F = {
	"claude-code": [
		"#2f8d80",
		"#c39b4e",
		"#f3e7c5",
		"#3a2e18",
		"#e8b54a"
	],
	codex: [
		"#a93e4c",
		"#c39b4e",
		"#f3e7c5",
		"#3a2e18",
		"#e8b54a"
	],
	"gemini-cli": [
		"#cd8a1f",
		"#c39b4e",
		"#f3e7c5",
		"#3a2e18",
		"#e8b54a"
	],
	pi: [
		"#7f9b2e",
		"#c39b4e",
		"#f3e7c5",
		"#3a2e18",
		"#e8b54a"
	]
}, ee = [
	"#8a7a5c",
	"#ab9263",
	"#efe2c0",
	"#3a2e18",
	"#d9b25f"
], I = [
	[
		"#d98e7a",
		"#7c2b30",
		"#f3e7c5"
	],
	[
		"#7cc4b2",
		"#1f5a50",
		"#f3e7c5"
	],
	[
		"#e3b765",
		"#8a5a14",
		"#f3e7c5"
	],
	[
		"#b9c873",
		"#4f6020",
		"#f3e7c5"
	],
	[
		"#9aa9c9",
		"#2e3f5c",
		"#f3e7c5"
	],
	[
		"#c79ab8",
		"#5e2f4f",
		"#f3e7c5"
	]
], te = "#c39b4e", ne = "#e3c87f", L = "#6d5120", re = /* @__PURE__ */ new Map();
function R(e) {
	let t = `${e.kind}|${e.entityId}|${e.adapter ?? ""}|${e.taskKind ?? ""}`, n = re.get(t);
	if (n !== void 0) return n;
	let r = e.kind === "unit" ? oe(e) : ue(e);
	return re.set(t, r), r;
}
function ie() {
	return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\" width=\"100%\" height=\"100%\" aria-hidden=\"true\">";
}
function ae(e, t, n, r, i, a) {
	return `<circle cx="${e}" cy="${t}" r="${(n * 1.25).toFixed(2)}" fill="none" stroke="${r}" stroke-width="${(n * .55).toFixed(2)}" stroke-dasharray="${(n * .58).toFixed(2)} ${(n * .5).toFixed(2)}"/><circle cx="${e}" cy="${t}" r="${n}" fill="${r}" stroke="${i}" stroke-width="1.5"/><circle cx="${e}" cy="${t}" r="${(n * .4).toFixed(2)}" fill="${a ?? i}"/>`;
}
function oe(e) {
	let t = F[e.adapter ?? ""] ?? ee, [n, r, i, a, o] = t, s = P(`unit:${e.entityId}`), c = P(`cog:${e.entityId}`), l = s % 5, u = (s >>> 3) % 4, d = (s >>> 6) % 4, f = (s >>> 9) % 3, p = (s >>> 12) % 3, m = (s >>> 15) % 2, h = (s >>> 17) % 2 == 0, g = (s >>> 18) % 2 == 0, _ = 7 + c % 4, v = (c >>> 3) % 5 - 2, y = 23 + (c >>> 6) % 18, b = 34 + v, x = b + 8, S = `<ellipse cx="32" cy="57.5" rx="13" ry="2.4" fill="${a}" opacity="0.3"/>`, C = "";
	C = m === 0 ? `<path d="M26 52 V58 M38 52 V58" fill="none" stroke="${a}" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="26" cy="58.2" rx="2.6" ry="1.3" fill="${a}"/><ellipse cx="38" cy="58.2" rx="2.6" ry="1.3" fill="${a}"/>` : `<circle cx="25" cy="56.5" r="2.7" fill="${a}"/><circle cx="39" cy="56.5" r="2.7" fill="${a}"/><circle cx="25" cy="56.5" r="1" fill="${r}"/><circle cx="39" cy="56.5" r="1" fill="${r}"/>`;
	let w = "";
	w = p === 0 ? `<ellipse cx="14.5" cy="27.5" rx="10.5" ry="3.9" transform="rotate(-32 14.5 27.5)" fill="${n}" opacity="0.62" stroke="${a}" stroke-width="0.9"/><ellipse cx="49.5" cy="27.5" rx="10.5" ry="3.9" transform="rotate(32 49.5 27.5)" fill="${n}" opacity="0.62" stroke="${a}" stroke-width="0.9"/><ellipse cx="15.5" cy="33.5" rx="8.5" ry="3.2" transform="rotate(-12 15.5 33.5)" fill="${n}" opacity="0.42" stroke="${a}" stroke-width="0.8"/><ellipse cx="48.5" cy="33.5" rx="8.5" ry="3.2" transform="rotate(12 48.5 33.5)" fill="${n}" opacity="0.42" stroke="${a}" stroke-width="0.8"/>` : p === 1 ? ae(13.5, 36, 4.2, r, a) + ae(50.5, 36, 4.2, r, a) : `<path d="M16 30 L8.5 26 L12 38 Z" fill="${n}" opacity="0.72" stroke="${a}" stroke-width="0.9" stroke-linejoin="round"/><path d="M48 30 L55.5 26 L52 38 Z" fill="${n}" opacity="0.72" stroke="${a}" stroke-width="0.9" stroke-linejoin="round"/>`;
	let T = "";
	switch (u) {
		case 0:
			T = `<path d="M32 19 V9" fill="none" stroke="${a}" stroke-width="2.2" stroke-linecap="round"/><circle cx="32" cy="7.5" r="2.8" fill="${o}" stroke="${a}" stroke-width="1"/>`;
			break;
		case 1:
			T = ae(32, 13, 4.6, r, a, o);
			break;
		case 2:
			T = `<path d="M32 19 V12" fill="none" stroke="${a}" stroke-width="2.2" stroke-linecap="round"/><circle cx="28.8" cy="9.5" r="3.1" fill="none" stroke="${a}" stroke-width="2"/><circle cx="35.2" cy="9.5" r="3.1" fill="none" stroke="${a}" stroke-width="2"/>`;
			break;
		default:
			T = `<path d="M24 19 V15 M40 19 V15" fill="none" stroke="${a}" stroke-width="2.2" stroke-linecap="round"/><circle cx="24" cy="13.5" r="2.3" fill="${o}" stroke="${a}" stroke-width="0.9"/><circle cx="40" cy="13.5" r="2.3" fill="${o}" stroke="${a}" stroke-width="0.9"/>`;
			break;
	}
	let E = "";
	switch (l) {
		case 0:
			E = `<circle cx="32" cy="37" r="18" fill="${r}" stroke="${a}" stroke-width="2.5"/><rect x="16" y="30" width="32" height="4" rx="2" fill="${a}" opacity="0.18"/>`;
			break;
		case 1:
			E = `<path d="M16 34 Q9 34 10.5 41 Q11.5 45.5 17 45.5" fill="none" stroke="${a}" stroke-width="2.2" stroke-linecap="round"/><path d="M48 34 Q57 32 57 25 Q53 29 47 29 Z" fill="${r}" stroke="${a}" stroke-width="1.5" stroke-linejoin="round"/><rect x="15" y="22" width="34" height="33" rx="13" fill="${r}" stroke="${a}" stroke-width="2.5"/><ellipse cx="32" cy="22.5" rx="10" ry="3" fill="${r}" stroke="${a}" stroke-width="1.5"/>`;
			break;
		case 2:
			E = `<path d="M32 17 Q47 23 47 37 Q47 50 32 55 Q17 50 17 37 Q17 23 32 17 Z" fill="${r}" stroke="${a}" stroke-width="2.5" stroke-linejoin="round"/>`;
			break;
		case 3:
			E = `<path d="M14 41 a18 21 0 1 1 36 0 a18 13 0 1 1 -36 0 Z" fill="${r}" stroke="${a}" stroke-width="2.5"/><ellipse cx="32" cy="26" rx="13" ry="6" fill="${n}" opacity="0.38"/>`;
			break;
		default:
			E = `<rect x="17" y="17" width="30" height="39" rx="15" fill="${r}" stroke="${a}" stroke-width="2.5"/><rect x="18.5" y="24" width="27" height="3" rx="1.5" fill="${a}" opacity="0.15"/>`;
			break;
	}
	let D = `<circle cx="20.5" cy="48" r="0.9" fill="${i}" opacity="0.75"/><circle cx="43.5" cy="48" r="0.9" fill="${i}" opacity="0.75"/><circle cx="${y}" cy="52" r="0.8" fill="${a}" opacity="0.85"/>`, O = `<ellipse cx="32" cy="${b + 2}" rx="12.5" ry="10.5" fill="${i}" stroke="${a}" stroke-width="1.2"/>`, k = "", A = 32 - _, j = 32 + _;
	switch (d) {
		case 0:
			k = `<circle cx="${A}" cy="${b}" r="4.1" fill="${i}" stroke="${a}" stroke-width="1.5"/><circle cx="${j}" cy="${b}" r="4.1" fill="${i}" stroke="${a}" stroke-width="1.5"/><circle cx="${A + .8}" cy="${b + .5}" r="1.8" fill="${a}"/><circle cx="${j + .8}" cy="${b + .5}" r="1.8" fill="${a}"/><circle cx="${A - 1.3}" cy="${b - 1.4}" r="0.8" fill="${i}"/><circle cx="${j - 1.3}" cy="${b - 1.4}" r="0.8" fill="${i}"/>`;
			break;
		case 1:
			k = `<ellipse cx="${A}" cy="${b}" rx="3.3" ry="4.5" fill="${a}"/><ellipse cx="${j}" cy="${b}" rx="3.3" ry="4.5" fill="${a}"/><circle cx="${A - 1}" cy="${b - 1.6}" r="1" fill="${i}"/><circle cx="${j - 1}" cy="${b - 1.6}" r="1" fill="${i}"/><circle cx="${A + .9}" cy="${b + 1.6}" r="0.8" fill="${n}"/><circle cx="${j + .9}" cy="${b + 1.6}" r="0.8" fill="${n}"/>`;
			break;
		case 2:
			k = `<path d="M${A - 3.6} ${b + 1.6} Q${A} ${b - 3.4} ${A + 3.6} ${b + 1.6}" fill="none" stroke="${a}" stroke-width="2.3" stroke-linecap="round"/><path d="M${j - 3.6} ${b + 1.6} Q${j} ${b - 3.4} ${j + 3.6} ${b + 1.6}" fill="none" stroke="${a}" stroke-width="2.3" stroke-linecap="round"/>`;
			break;
		default:
			k = `<circle cx="${A}" cy="${b}" r="5.6" fill="none" stroke="${r}" stroke-width="1.5"/><circle cx="${A}" cy="${b}" r="4" fill="${i}" stroke="${a}" stroke-width="1.4"/><circle cx="${A + .7}" cy="${b + .4}" r="1.8" fill="${a}"/><path d="M${A + 4.4} ${b + 3.6} Q${A + 7} ${b + 7} ${A + 5.6} ${b + 10}" fill="none" stroke="${r}" stroke-width="1.1"/><circle cx="${j}" cy="${b}" r="2.1" fill="${a}"/><circle cx="${j - .8}" cy="${b - .8}" r="0.7" fill="${i}"/>`;
			break;
	}
	let M = "";
	switch (f) {
		case 0:
			M = `<path d="M28.5 ${x} a3.5 2.8 0 0 0 7 0" fill="none" stroke="${a}" stroke-width="1.7" stroke-linecap="round"/>`;
			break;
		case 1:
			M = `<circle cx="32" cy="${x + .5}" r="1.5" fill="${a}" opacity="0.9"/>`;
			break;
		default:
			M = `<path d="M29 ${x + .5} h6" fill="none" stroke="${a}" stroke-width="1.7" stroke-linecap="round"/>`;
			break;
	}
	let N = h ? `<circle cx="${A - 2.5}" cy="${b + 5.5}" r="1.8" fill="${o}" opacity="0.55"/><circle cx="${j + 2.5}" cy="${b + 5.5}" r="1.8" fill="${o}" opacity="0.55"/>` : "", I = g ? `<circle cx="32" cy="${x + 7.5}" r="2" fill="${n}" stroke="${a}" stroke-width="0.8" opacity="0.9"/>` : "";
	return {
		svg: ie() + S + C + w + T + E + D + O + k + N + M + I + "</svg>",
		palette: [...t]
	};
}
function se(e, t, n, r) {
	let i = (e, t = 2.4) => `<path d="${e}" fill="none" stroke="${r}" stroke-width="${t}" stroke-linecap="round" stroke-linejoin="round"/>`;
	switch (e) {
		case "ci-repair": return `<circle cx="32" cy="32" r="5" fill="none" stroke="${r}" stroke-width="2.4"/>` + i("M32 21.5 V25 M32 39 V42.5 M21.5 32 H25 M39 32 H42.5 M24.6 24.6 L27 27 M37 37 L39.4 39.4 M39.4 24.6 L37 27 M27 37 L24.6 39.4", 2.2);
		case "feature-dev": return `<path d="M32 21 L34.7 29.3 L43 32 L34.7 34.7 L32 43 L29.3 34.7 L21 32 L29.3 29.3 Z" fill="${r}"/>`;
		case "code-review": return `<circle cx="29.5" cy="29.5" r="6.5" fill="none" stroke="${r}" stroke-width="2.4"/>` + i("M34.5 34.5 L41 41");
		case "bug-fix": return i("M25.5 28.5 L21.5 26 M25.5 33.5 H21 M25.5 38.5 L21.5 41 M38.5 28.5 L42.5 26 M38.5 33.5 H43 M38.5 38.5 L42.5 41", 2) + `<circle cx="32" cy="24.5" r="3.2" fill="${r}"/><ellipse cx="32" cy="34" rx="6" ry="7.5" fill="${r}"/><path d="M32 27.5 V40.5" fill="none" stroke="${n}" stroke-width="1.6"/>`;
		case "refactor": return i("M39.5 26.5 a9.5 9.5 0 0 0 -15.5 3.5") + i("M22.7 25.7 L23.6 31.3 L29 30") + i("M24.5 37.5 a9.5 9.5 0 0 0 15.5 -3.5") + i("M41.3 38.3 L40.4 32.7 L35 34");
		case "docs": return i("M25 20.5 H35 L40 25.5 V43.5 H25 Z", 2.2) + i("M35 20.5 V25.5 H40", 1.8) + i("M28.5 31 H36.5 M28.5 36 H36.5", 2);
		case "test-coverage": return i("M32 20.5 L41.5 24 V32 Q41.5 40.5 32 44.5 Q22.5 40.5 22.5 32 V24 Z", 2.2) + i("M27.5 32.5 L31 36 L37 27.5");
		case "perf-tuning": return `<path d="M34.5 20.5 L24.5 34 H31 L29.5 43.5 L39.5 30 H33 Z" fill="${r}"/>`;
		case "security-audit": return i("M27 29 V26.5 a5 5 0 0 1 10 0 V29") + `<rect x="24.5" y="29" width="15" height="12.5" rx="3" fill="${r}"/><circle cx="32" cy="34" r="1.8" fill="${n}"/><path d="M32 34 V38" fill="none" stroke="${n}" stroke-width="1.8" stroke-linecap="round"/>`;
		case "release-prep": return `<path d="M32 19.5 Q37.5 25.5 37.5 33 L37.5 38 H26.5 L26.5 33 Q26.5 25.5 32 19.5 Z" fill="${r}"/><circle cx="32" cy="30" r="2.4" fill="${n}"/><path d="M26.5 33.5 L22 40 L26.5 38.7 Z" fill="${r}"/><path d="M37.5 33.5 L42 40 L37.5 38.7 Z" fill="${r}"/><path d="M30 40.5 Q32 44.5 34 40.5" fill="none" stroke="${t}" stroke-width="2.2" stroke-linecap="round"/>`;
		default: return i("M32 22 L42 32 L32 42 L22 32 Z", 2.4);
	}
}
var ce = [
	[51, 32],
	[45.4, 45.4],
	[32, 51],
	[18.6, 45.4],
	[13, 32],
	[18.6, 18.6],
	[32, 13],
	[45.4, 18.6]
], le = [
	[53, 32],
	[46.9, 46.9],
	[32, 53],
	[17.1, 46.9],
	[11, 32],
	[17.1, 17.1],
	[32, 11],
	[46.9, 17.1]
];
function ue(e) {
	let t = e.taskKind ?? "task", n = I[P(`kind:${t}`) % I.length] ?? I[0], [r, i, a] = n, o = P(`task:${e.entityId}`), s = ce[o % ce.length] ?? ce[0], c = le[(o >>> 4) % le.length] ?? le[0];
	return {
		svg: ie() + `<circle cx="32" cy="32" r="26" fill="none" stroke="${ne}" stroke-width="2.6" stroke-dasharray="4.2 3.4"/><circle cx="32" cy="32" r="23" fill="${te}" stroke="${L}" stroke-width="1.6"/><circle cx="32" cy="11.5" r="1.2" fill="${L}"/><circle cx="52.5" cy="32" r="1.2" fill="${L}"/><circle cx="32" cy="52.5" r="1.2" fill="${L}"/><circle cx="11.5" cy="32" r="1.2" fill="${L}"/><circle cx="${c[0]}" cy="${c[1]}" r="1" fill="${ne}" opacity="0.9"/><circle cx="${s[0]}" cy="${s[1]}" r="2.6" fill="${i}"/><circle cx="32" cy="32" r="17.5" fill="${i}" stroke="${L}" stroke-width="0.8"/><ellipse cx="26" cy="25.5" rx="6.5" ry="4" fill="${a}" opacity="0.18"/><circle cx="32" cy="32" r="13.5" fill="none" stroke="${a}" stroke-width="1" opacity="0.3"/>` + se(t, r, i, a) + "</svg>",
		palette: [...n]
	};
}
//#endregion
//#region src/microagent/mock/optionIconGen.ts
var de = [
	{
		match: /strateg|branch|fork|route|path|approach|plan\b/,
		paths: "<path d=\"M10 17 V11 M10 11 Q10 7 5.5 6 M10 11 Q10 7 14.5 6\"/><circle cx=\"5.5\" cy=\"4.5\" r=\"1.6\"/><circle cx=\"14.5\" cy=\"4.5\" r=\"1.6\"/><circle cx=\"10\" cy=\"17\" r=\"1.4\"/>"
	},
	{
		match: /version|pin|upgrade|bump|depend|lts|latest|major|minor/,
		paths: "<ellipse cx=\"10\" cy=\"5.5\" rx=\"6\" ry=\"2.2\"/><path d=\"M4 5.5 V10 a6 2.2 0 0 0 12 0 V5.5 M4 10 V14.5 a6 2.2 0 0 0 12 0 V10\"/>"
	},
	{
		match: /approve|proceed|allow|accept|confirm|yes\b|adopt|go\b/,
		paths: "<circle cx=\"10\" cy=\"10\" r=\"7\"/><path d=\"M6.5 10.5 L9 13 L13.8 7\"/>"
	},
	{
		match: /reject|deny|stand[- ]?down|refuse|block|halt|abort|stop|no\b/,
		paths: "<path d=\"M10 3 L16 5.5 V10 Q16 15 10 17.5 Q4 15 4 10 V5.5 Z\"/><path d=\"M6.5 12.5 L13.5 7.5\"/>"
	},
	{
		match: /test|suite|verif|validate|assert|check\b|parity/,
		paths: "<path d=\"M8 3 H12 M8.7 3 V8 L5 14.5 a2 2 0 0 0 1.8 2.8 H13.2 a2 2 0 0 0 1.8 -2.8 L11.3 8 V3\"/><path d=\"M7 12.5 H13\"/>"
	},
	{
		match: /patch|stitch|fix|repair|hotfix|mend/,
		paths: "<rect x=\"3.5\" y=\"5\" width=\"13\" height=\"10\" rx=\"2\"/><path d=\"M10 5 V15 M7.5 8 H12.5 M7.5 12 H12.5\"/>"
	},
	{
		match: /rollback|revert|undo|restore|back[- ]?out/,
		paths: "<path d=\"M5 6.5 a6 6 0 1 1 -1 6.5 M5 6.5 L4.5 2.8 M5 6.5 L8.6 5.6\"/>"
	},
	{
		match: /expand|contract|migrat|dual[- ]?write|phase/,
		paths: "<path d=\"M3 7 H12 M9 4 L12.5 7 L9 10 M17 13 H8 M11 10 L7.5 13 L11 16\"/>"
	},
	{
		match: /bisect|split|half|divide/,
		paths: "<path d=\"M10 3 L17 10 L10 17 L3 10 Z M10 3 V17\"/>"
	},
	{
		match: /rewrite|draft|edit|author|rephrase|document/,
		paths: "<path d=\"M4 16 L13.5 6.5 a2.1 2.1 0 0 1 3 3 L7 19 H4 Z M12 8 L15 11\"/>"
	},
	{
		match: /cache|memo|store|persist/,
		paths: "<circle cx=\"10\" cy=\"8\" r=\"4.5\"/><circle cx=\"10\" cy=\"8\" r=\"1.5\"/><path d=\"M4 15.5 H16\"/>"
	},
	{
		match: /inspect|investigat|inquir|examine|review|audit/,
		paths: "<circle cx=\"8.6\" cy=\"8.6\" r=\"5\"/><path d=\"M12.4 12.4 L17 17\"/>"
	},
	{
		match: /escalat|ask|owner|human|defer|consult/,
		paths: "<path d=\"M10 17 V8\"/><circle cx=\"10\" cy=\"5.5\" r=\"2\"/><path d=\"M5.8 9.8 a6 6 0 0 1 0 -8.6 M14.2 1.2 a6 6 0 0 1 0 8.6\"/>"
	},
	{
		match: /ship|deploy|release|launch|publish/,
		paths: "<path d=\"M3.5 12 H16.5 L14.5 16 H5.5 Z M10 12 V4 M10 4 L14.5 8.5 H10\"/>"
	}
], fe = [
	"<circle cx=\"10\" cy=\"10\" r=\"6.5\"/><path d=\"M10 3.5 V10 L14 13\"/>",
	"<rect x=\"4\" y=\"4\" width=\"12\" height=\"12\" rx=\"2.5\"/><circle cx=\"10\" cy=\"10\" r=\"2.6\"/>",
	"<path d=\"M10 3 L17 10 L10 17 L3 10 Z\"/><circle cx=\"10\" cy=\"10\" r=\"1.6\"/>",
	"<path d=\"M4 14 Q7 5 10 10 Q13 15 16 6\"/><circle cx=\"4\" cy=\"14\" r=\"1.2\"/><circle cx=\"16\" cy=\"6\" r=\"1.2\"/>",
	"<circle cx=\"6.5\" cy=\"10\" r=\"3.4\"/><circle cx=\"13.5\" cy=\"10\" r=\"3.4\"/>",
	"<path d=\"M5 16 V8 M10 16 V4 M15 16 V11\"/>"
], pe = /* @__PURE__ */ new Map();
function me(e) {
	let t = `${e.id}|${e.caption}|${e.tone ?? "normal"}`, n = pe.get(t);
	if (n !== void 0) return n;
	let r = e.tone === "danger" ? A : k, i = `${e.id} ${e.caption}`.toLowerCase(), a = de.find((e) => e.match.test(i)), o;
	if (a !== void 0) o = a.paths;
	else {
		let t = P(`opt:${e.id}`);
		o = `${fe[t % fe.length] ?? fe[0]}<circle cx="${(3 + (t >>> 4) % 15).toFixed(0)}" cy="${(16 + (t >>> 8) % 3).toFixed(0)}" r="0.7"/>`;
	}
	let s = j(o, r);
	return pe.set(t, s), s;
}
//#endregion
//#region src/microagent/mock/commandGen.ts
var he = [
	"Q",
	"W",
	"E",
	"R",
	"A",
	"S",
	"D",
	"F",
	"Z",
	"X",
	"C",
	"V"
], ge = {
	steer: j("<path d=\"M4 6 L9 10 L4 14 M10 6 L15 10 L10 14\"/>"),
	"pause-unit": j("<circle cx=\"10\" cy=\"10\" r=\"7\"/><path d=\"M8 7 V13 M12 7 V13\"/>"),
	inspect: j("<circle cx=\"9\" cy=\"9\" r=\"5\"/><path d=\"M13 13 L17 17\"/>"),
	abort: j("<circle cx=\"10\" cy=\"10\" r=\"7\"/><path d=\"M6.5 6.5 L13.5 13.5\"/>"),
	approve: j("<path d=\"M4 10.5 L8.5 15 L16 5\"/>"),
	deny: j("<path d=\"M5 5 L15 15 M15 5 L5 15\"/>"),
	"commission-task": j("<rect x=\"3.5\" y=\"3.5\" width=\"13\" height=\"13\" rx=\"2.5\"/><path d=\"M10 6.5 V13.5 M6.5 10 H13.5\"/>"),
	"jump-to-alert": j("<circle cx=\"10\" cy=\"10\" r=\"6.5\"/><circle cx=\"10\" cy=\"10\" r=\"1.2\"/><path d=\"M10 3.5 V6 M10 14 V16.5 M3.5 10 H6 M14 10 H16.5\"/>"),
	"toggle-sim": j("<path d=\"M7 4 V16 M13 4 V16\"/>"),
	"start-work": j("<path d=\"M6 4 L15 10 L6 16 Z\"/><path d=\"M3.5 4 V16\"/>"),
	"set-yolo": j("<circle cx=\"10\" cy=\"10\" r=\"7.5\"/><path d=\"M11.5 4.5 L7 10.5 H10 L8.5 15.5 L13 9.5 H10 Z\"/>"),
	prioritize: j("<path d=\"M10 16 V4 M5 9 L10 4 L15 9\"/>"),
	"inspect-review": j("<path d=\"M5 3.5 H13 L15.5 6 V12\"/><circle cx=\"9\" cy=\"11.5\" r=\"3.6\"/><path d=\"M11.8 14.3 L15 17.5\"/>"),
	expedite: j("<path d=\"M5 11 L10 5.5 L15 11 M5 16 L10 10.5 L15 16\"/>"),
	"open-review": j("<path d=\"M10 5 Q6.5 3 3 4.5 V15.5 Q6.5 14 10 16 Q13.5 14 17 15.5 V4.5 Q13.5 3 10 5 Z M10 5 V16\"/>"),
	"approve-all": j("<path d=\"M3 10.5 L6.5 14 L12 6.5 M8.5 11 L11.5 14 L17 6.5\"/>"),
	"request-changes": j("<path d=\"M14 5 a5.5 5.5 0 0 1 0 10 H6\"/><path d=\"M8.5 12 L5.5 15 L8.5 18\"/><path d=\"M5 5 H10\"/>"),
	"revert-card": j("<circle cx=\"10\" cy=\"10\" r=\"7.5\"/><path d=\"M13.5 7.5 H8.4 a2.6 2.6 0 0 0 0 5.2 H12\"/><path d=\"M10 5 L7.5 7.5 L10 10\"/>"),
	release: j("<path d=\"M4 16.5 H16\"/><path d=\"M10 16.5 V10.5\"/><path d=\"M10 10.5 L14.2 5.2\"/><circle cx=\"15.2\" cy=\"4\" r=\"1.7\"/><path d=\"M4.5 12.5 a5.5 5.5 0 0 1 4 -4.6\"/>"),
	"rollback-prod": j("<path d=\"M5 8.5 L4.5 4 L7.3 6.4 L10 2.8 L12.7 6.4 L15.5 4 L15 8.5 Z\"/><path d=\"M14.5 14 a4.5 4.5 0 1 1 -1.3 -3.2\"/><path d=\"M15 8.6 L14.5 11.4 L11.7 10.9\"/>"),
	"open-terminal": j("<rect x=\"3\" y=\"4\" width=\"14\" height=\"12\" rx=\"1.6\"/><path d=\"M5.8 8 L8.8 10.4 L5.8 12.8\"/><path d=\"M10.4 13.2 H14.2\"/>"),
	"edit-card": j("<rect x=\"3\" y=\"3.5\" width=\"14\" height=\"13\" rx=\"1.8\"/><path d=\"M6.2 14 L6.9 11.2 L12.6 5.5 a1.15 1.15 0 0 1 1.65 1.6 L8.6 12.9 Z\"/><path d=\"M6.9 11.2 L8.6 12.9\"/>"),
	"open-ide": j("<rect x=\"3\" y=\"3.5\" width=\"14\" height=\"13\" rx=\"1.6\"/><path d=\"M7.5 3.5 V16.5\"/><path d=\"M9.8 8 L11.6 10 L9.8 12 M14.2 8 L12.4 10 L14.2 12\"/><path d=\"M4.5 6.5 H6 M4.5 9.5 H6 M4.5 12.5 H6\"/>"),
	"hold-merge": j("<path d=\"M6 3.5 V9 a4 4 0 0 0 4 4 a4 4 0 0 1 4 4\"/><path d=\"M3.5 7 H8.5 M11.5 14 H16.5\"/>"),
	"force-rebase": j("<circle cx=\"5.5\" cy=\"5\" r=\"1.8\"/><circle cx=\"5.5\" cy=\"15\" r=\"1.8\"/><path d=\"M5.5 7 V13 M7.5 5 H12 a3 3 0 0 1 3 3 V11 M12.5 9 L15 11.5 L17.5 9\"/>"),
	"approve-review": j("<circle cx=\"10\" cy=\"8.5\" r=\"5\"/><path d=\"M7.8 8.5 L9.6 10.3 L12.5 6.8\"/><path d=\"M7.5 13 L6 17 M12.5 13 L14 17\"/>"),
	"review-request-changes": j("<rect x=\"3.5\" y=\"4\" width=\"13\" height=\"10\" rx=\"2\"/><path d=\"M7 17.5 L9 14\"/><path d=\"M6.5 7.5 H13.5 M6.5 10.5 H10.5\"/>"),
	"add-comment": j("<path d=\"M3.5 4.5 H16.5 V13 H9 L5.5 16.5 V13 H3.5 Z\"/><path d=\"M10 6.5 V11 M7.8 8.8 H12.2\"/>"),
	"open-diff": j("<rect x=\"3\" y=\"3.5\" width=\"6\" height=\"13\" rx=\"1.5\"/><rect x=\"11\" y=\"3.5\" width=\"6\" height=\"13\" rx=\"1.5\"/><path d=\"M6 7 V10 M4.5 8.5 H7.5 M12.5 11.5 H15.5\"/>"),
	"run-tests": j("<path d=\"M8 3 H12 M8.7 3 V8 L5 14.5 a2 2 0 0 0 1.8 2.8 H13.2 a2 2 0 0 0 1.8 -2.8 L11.3 8 V3\"/><path d=\"M7 12.5 H13\"/>"),
	"root-cause": j("<circle cx=\"10\" cy=\"8\" r=\"5\"/><circle cx=\"10\" cy=\"8\" r=\"1.4\"/><path d=\"M10 13 V17 M7 17 Q10 14.5 13 17\"/>"),
	"apply-patch": j("<rect x=\"3.5\" y=\"5\" width=\"13\" height=\"10\" rx=\"2\"/><path d=\"M10 5 V15 M7.5 8 H12.5 M7.5 12 H12.5\"/>"),
	rollback: j("<path d=\"M5 6.5 a6 6 0 1 1 -1 6.5 M5 6.5 L4.5 2.8 M5 6.5 L8.6 5.6\"/>"),
	hypothesize: j("<path d=\"M6.5 8 a3.5 4 0 1 1 7 0 Q13.5 10.5 10 12 V13.5\"/><path d=\"M8.5 16 H11.5\"/>"),
	bisect: j("<path d=\"M10 3 L17 10 L10 17 L3 10 Z M10 3 V17\"/>"),
	instrument: j("<path d=\"M3.5 14 a6.5 6.5 0 0 1 13 0\"/><path d=\"M10 14 L13.5 9.5\"/><circle cx=\"10\" cy=\"14\" r=\"1.3\"/>"),
	conclude: j("<path d=\"M5 17 V3.5 M5 4 H15 L12 7.5 L15 11 H5\"/>"),
	"capture-plates": j("<rect x=\"3\" y=\"6\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M7 6 L8.5 3.5 H11.5 L13 6\"/><circle cx=\"10\" cy=\"11\" r=\"2.8\"/>"),
	score: j("<path d=\"M10 3 L12 7.8 L17 8.2 L13.2 11.5 L14.5 16.5 L10 13.8 L5.5 16.5 L6.8 11.5 L3 8.2 L8 7.8 Z\"/>"),
	"apply-findings": j("<rect x=\"4.5\" y=\"4\" width=\"11\" height=\"13\" rx=\"2\"/><path d=\"M8 4 V2.5 H12 V4\"/><path d=\"M7 10.5 L9.2 12.7 L13 7.8\"/>"),
	checkpoint: j("<path d=\"M6 17 V3.5 M6 4 H14.5 V10.5 H6\"/><circle cx=\"10.5\" cy=\"7.2\" r=\"1.2\"/>"),
	"run-suite": j("<path d=\"M6.5 3.5 H9.5 M8 3.5 V7 L5 12.5 a1.8 1.8 0 0 0 1.6 2.6 H10\"/><path d=\"M11.5 6 H14.5 M13 6 V9 L16 14.5 a1.8 1.8 0 0 1 -1.6 2.6 H10\"/>"),
	"coverage-report": j("<path d=\"M3.5 16.5 H16.5\"/><path d=\"M5.5 16 V10 M9.5 16 V5 M13.5 16 V8\"/>"),
	"add-cases": j("<path d=\"M10 3 L16.5 5.5 V10 Q16.5 14.8 10 17.5 Q3.5 14.8 3.5 10 V5.5 Z\"/><path d=\"M10 7 V13 M7 10 H13\"/>"),
	preview: j("<path d=\"M2.5 10 Q10 3 17.5 10 Q10 17 2.5 10 Z\"/><circle cx=\"10\" cy=\"10\" r=\"2.4\"/>"),
	"spell-gauge": j("<path d=\"M3.5 13.5 a6.5 6.5 0 0 1 13 0\"/><path d=\"M6 13.5 L8 11.5 M10 13.5 L11.8 9\"/><path d=\"M5 17 Q7.5 15.5 10 17 Q12.5 18.5 15 17\"/>"),
	"publish-draft": j("<path d=\"M3 10 L17 3.5 L13 16.5 L9.5 12 Z M9.5 12 L17 3.5\"/>"),
	"dry-run": j("<path d=\"M6 4 L15 10 L6 16 Z\" stroke-dasharray=\"2.4 1.8\"/>"),
	"ship-it": j("<path d=\"M3.5 12 H16.5 L14.5 16 H5.5 Z M10 12 V4 M10 4 L14.5 8.5 H10\"/>"),
	"hold-the-line": j("<path d=\"M10 3 L16 5.5 V10 Q16 15 10 17.5 Q4 15 4 10 V5.5 Z\"/><path d=\"M6.5 10 H13.5\"/>"),
	summarize: j("<path d=\"M4 5 H16 M4 9 H13 M4 13 H10 M4 17 H7\"/>"),
	"cite-sources": j("<path d=\"M5 6 Q3.5 8 4 11 H7.5 V7.5 H5.5 Q5.3 6.6 6 6 Z M12 6 Q10.5 8 11 11 H14.5 V7.5 H12.5 Q12.3 6.6 13 6 Z\"/><path d=\"M4.5 15 H15.5\"/>"),
	"archive-to-brain": j("<rect x=\"3.5\" y=\"4\" width=\"13\" height=\"4\" rx=\"1\"/><path d=\"M5 8 V15 a1.5 1.5 0 0 0 1.5 1.5 H13.5 a1.5 1.5 0 0 0 1.5 -1.5 V8\"/><path d=\"M10 9.5 V14 M8 12 L10 14 L12 12\"/>"),
	"plan-steps": j("<path d=\"M3.5 16.5 H8 V12.5 H12 V8.5 H16.5 V4.5\"/><circle cx=\"5.5\" cy=\"14\" r=\"0.9\"/><circle cx=\"9.8\" cy=\"10.2\" r=\"0.9\"/><circle cx=\"14.2\" cy=\"6.4\" r=\"0.9\"/>"),
	"execute-step": j("<path d=\"M3.5 15.5 H9 V10.5 H14.5\"/><path d=\"M12 8 L15 10.5 L12 13\"/>"),
	"verify-parity": j("<path d=\"M10 3.5 V16.5 M4 6 H16\"/><path d=\"M4 6 L2.5 10.5 a2.5 2 0 0 0 5 0 Z M16 6 L14.5 10.5 a2.5 2 0 0 0 5 0 Z\"/>")
}, _e = {
	"resume-unit": j("<circle cx=\"10\" cy=\"10\" r=\"7\"/><path d=\"M8.2 7 L13.5 10 L8.2 13 Z\"/>"),
	"resume-sim": j("<path d=\"M6 4 L16 10 L6 16 Z\"/>"),
	"unset-yolo": j("<circle cx=\"10\" cy=\"10\" r=\"7.5\"/><path d=\"M11.5 4.5 L7 10.5 H10 L8.5 15.5 L13 9.5 H10 Z\"/><path d=\"M4.5 15.5 L15.5 4.5\"/>")
};
function ve() {
	return j("<circle cx=\"10\" cy=\"10\" r=\"6\"/>");
}
function ye(e, t, n) {
	return {
		id: e.id,
		label: e.label,
		...n === void 0 ? {} : { hotkey: n },
		icon: ge[e.id] ?? ve(),
		intent: e.intent,
		enabled: e.enabled === void 0 ? !0 : e.enabled(t),
		tooltip: e.tooltip,
		...e.severity === void 0 ? {} : { severity: e.severity }
	};
}
function z(e, t, n, r, i) {
	return {
		id: e,
		label: t,
		intent: {
			kind: "task-action",
			action: e,
			prompt: n
		},
		tooltip: r,
		...i === void 0 ? {} : { severity: i }
	};
}
var be = [
	{
		id: "commission-task",
		label: "Commission Task",
		intent: { kind: "commission-task" },
		tooltip: "Commission a new task into the backlog (the Foundry, §V2-6)"
	},
	{
		id: "jump-to-alert",
		label: "Jump to Alert",
		intent: { kind: "jump-to-alert" },
		tooltip: "Center the camera on the most recent pending inquiry",
		enabled: (e) => e.fleet.pendingAlerts > 0,
		severity: "urgent"
	},
	{
		id: "toggle-sim",
		label: "Pause Sim",
		intent: { kind: "toggle-sim" },
		tooltip: "Pause or resume the simulation clock"
	}
], xe = [
	{
		id: "steer",
		label: "Steer…",
		intent: { kind: "steer" },
		tooltip: "Send a steering prompt to the attending agents"
	},
	{
		id: "pause-unit",
		label: "Pause",
		intent: { kind: "pause-unit" },
		tooltip: "Hold the attending agents — their runs freeze until resumed"
	},
	{
		id: "inspect",
		label: "Inspect",
		intent: { kind: "inspect" },
		tooltip: "Open the session transcript inspector"
	},
	{
		id: "abort",
		label: "Abort",
		intent: { kind: "abort" },
		tooltip: "Abort the active run — the card bounces back to the backlog",
		severity: "danger"
	}
], Se = [
	{
		id: "approve",
		label: "Approve",
		intent: { kind: "approve" },
		tooltip: "Allow the gated action and unblock the agent",
		severity: "urgent"
	},
	{
		id: "deny",
		label: "Deny",
		intent: { kind: "deny" },
		tooltip: "Deny the gated action",
		severity: "danger"
	},
	{
		id: "inspect",
		label: "Inspect",
		intent: { kind: "inspect" },
		tooltip: "Open the session transcript inspector"
	}
], Ce = [{
	id: "inspect",
	label: "Inspect",
	intent: { kind: "inspect" },
	tooltip: "Open the inspector for the first selected entity"
}, {
	id: "abort",
	label: "Abort",
	intent: { kind: "abort" },
	tooltip: "Abort the active runs in the selection",
	severity: "danger"
}], we = {
	review: [
		z("approve-review", "Approve Review", "Approve the review and record the verdict", "Approve the review under way"),
		z("review-request-changes", "Request Changes", "Request changes on the reviewed work", "Send the work back with change requests", "danger"),
		z("add-comment", "Add Comment", "Add a review comment to the open thread", "Annotate the review thread"),
		{
			id: "open-diff",
			label: "Open Diff",
			intent: { kind: "open-diff" },
			tooltip: "Jump to the Workspace tab diff plates (§V2-7)"
		}
	],
	fix: [
		z("run-tests", "Run Tests", "Run the test suite against the patch (vitest)", "Execute the test suite now"),
		z("root-cause", "Root-Cause", "Trace the defect to its root cause before patching", "Drive the diagnosis to the root cause"),
		z("apply-patch", "Apply Patch", "Apply the prepared patch to the workspace", "Apply the prepared patch"),
		z("rollback", "Rollback", "Roll the workspace back to the last good state", "Revert to the last good state", "danger")
	],
	"root-cause-analysis": [
		z("hypothesize", "Hypothesize", "Form the next failure hypothesis", "Record a fresh failure hypothesis"),
		z("bisect", "Bisect", "Bisect the history to isolate the breaking change", "Binary-search the breaking change"),
		z("instrument", "Instrument", "Add instrumentation around the suspect path", "Wire probes around the suspect path"),
		z("conclude", "Conclude", "Conclude the analysis and write up the finding", "Close the analysis with a finding")
	],
	polish: [
		z("capture-plates", "Capture Plates", "Capture fresh screenshot plates of the surfaces", "Capture screenshot plates"),
		z("score", "Score", "Score the current polish pass against the rubric", "Score the polish pass"),
		z("apply-findings", "Apply Findings", "Apply the scored findings to the surfaces", "Apply the scored findings")
	],
	implement: [
		z("run-tests", "Run Tests", "Run the test suite against the implementation (vitest)", "Execute the test suite now"),
		{
			id: "open-diff",
			label: "Open Diff",
			intent: { kind: "open-diff" },
			tooltip: "Jump to the Workspace tab diff plates (§V2-7)"
		},
		z("checkpoint", "Checkpoint", "Checkpoint the working state before continuing", "Snapshot the working state")
	],
	"test-coverage": [
		z("run-suite", "Run Suite", "Run the full coverage suite", "Execute the full suite"),
		z("coverage-report", "Coverage Report", "Produce a coverage report for the touched modules", "Report coverage on touched modules"),
		z("add-cases", "Add Cases", "Add test cases for the uncovered branches", "Author cases for uncovered branches")
	],
	docs: [
		z("preview", "Preview", "Render a preview of the drafted pages", "Preview the drafted pages"),
		z("spell-gauge", "Spell-Gauge", "Run the spell-gauge over the prose", "Measure the prose with the spell-gauge"),
		z("publish-draft", "Publish Draft", "Publish the current draft for review", "Publish the draft")
	],
	deploy: [
		z("dry-run", "Dry Run", "Execute a deployment dry run", "Rehearse the deployment"),
		z("ship-it", "Ship It", "Ship the release into the cold void", "Execute the deployment for real", "danger"),
		z("hold-the-line", "Hold the Line", "Hold the deployment — keep the current release pinned", "Freeze the rollout where it stands")
	],
	research: [
		z("summarize", "Summarize", "Summarize the findings so far", "Condense the findings"),
		z("cite-sources", "Cite Sources", "Attach citations to every claim", "Pin citations to the claims"),
		z("archive-to-brain", "Archive to Brain", "Archive the findings to the company brain (§V2-3)", "Write the findings back to memory")
	],
	migrate: [
		z("plan-steps", "Plan Steps", "Plan the migration steps end to end", "Lay out the migration steps"),
		z("execute-step", "Execute Step", "Execute the next migration step", "Run the next migration step"),
		z("verify-parity", "Verify Parity", "Verify data parity between old and new paths", "Check parity across both paths")
	]
}, Te = {
	id: "edit-card",
	label: "Edit Card",
	intent: { kind: "edit-card" },
	tooltip: "Open the card editor — title, kind, description, yolo, parent, workspace, agent stack (§V4-5)"
}, Ee = {
	id: "open-terminal",
	label: "Terminal",
	intent: { kind: "open-terminal" },
	tooltip: "Open a cogitator terminal bound to the card’s workspace (§V4-7)"
}, De = {
	id: "open-ide",
	label: "Open in IDE",
	intent: { kind: "open-ide" },
	tooltip: "Open the web IDE on the card’s workspace — explorer, tabs, ghost completion (§V4-11)"
}, Oe = [
	{
		id: "start-work",
		label: "Start Work",
		intent: {
			kind: "move-card",
			column: "do"
		},
		tooltip: "Move the card to DO — a worker agent spawns and begins (§V3-2)"
	},
	{
		id: "set-yolo",
		label: "Set Yolo",
		intent: {
			kind: "set-yolo",
			on: !0
		},
		tooltip: "Yolo flag: passing AI review auto-approves, skipping human review"
	},
	{
		id: "prioritize",
		label: "Prioritize",
		intent: { kind: "prioritize" },
		tooltip: "Bump the card to the top of the backlog lane"
	},
	{
		id: "commission-task",
		label: "Commission Task",
		intent: { kind: "commission-task" },
		tooltip: "Commission a new task into the backlog (the Foundry, §V2-6)"
	},
	Te
], ke = [
	{
		id: "inspect-review",
		label: "Inspect Review",
		intent: { kind: "inspect" },
		tooltip: "Open the attending reviewer’s transcript inspector"
	},
	{
		id: "expedite",
		label: "Expedite",
		intent: {
			kind: "task-action",
			action: "expedite",
			prompt: "Expedite the review verdict — converge now"
		},
		tooltip: "Press the reviewers toward an immediate verdict",
		enabled: (e) => e.cards.some((e) => e.agentRoles.includes("reviewer"))
	},
	{
		id: "abort",
		label: "Abort",
		intent: { kind: "abort" },
		tooltip: "Abort the review — the card bounces back to the backlog",
		severity: "danger"
	},
	Te,
	Ee
], Ae = [
	{
		id: "open-review",
		label: "Open Review",
		intent: { kind: "open-review" },
		tooltip: "Open the human-review side panel (§V3-4)"
	},
	{
		id: "approve-all",
		label: "Approve All",
		intent: {
			kind: "move-card",
			column: "approved"
		},
		tooltip: "Approve the change set — the card moves to APPROVED",
		severity: "urgent"
	},
	{
		id: "request-changes",
		label: "Request Changes",
		intent: {
			kind: "move-card",
			column: "do",
			danger: !0
		},
		tooltip: "Send the card back to DO with feedback",
		severity: "danger"
	},
	Te,
	Ee,
	De
], je = [
	{
		id: "hold-merge",
		label: "Hold Merge",
		intent: { kind: "hold-merge" },
		tooltip: "Hold (or release) the integration agent mid-merge",
		enabled: (e) => e.cards.some((e) => e.agentRoles.includes("integration"))
	},
	{
		id: "force-rebase",
		label: "Force Rebase",
		intent: {
			kind: "task-action",
			action: "force-rebase",
			prompt: "Force a rebase onto the base branch before merging"
		},
		tooltip: "Order an immediate rebase onto the base branch",
		enabled: (e) => e.cards.some((e) => e.agentRoles.includes("integration"))
	},
	{
		id: "inspect",
		label: "Inspect",
		intent: { kind: "inspect" },
		tooltip: "Open the integration agent’s transcript inspector"
	},
	Te,
	Ee
], Me = [{
	id: "inspect",
	label: "Inspect",
	intent: { kind: "inspect" },
	tooltip: "Inspect the merged card’s record"
}], Ne = [
	{
		id: "revert-card",
		label: "Revert",
		intent: { kind: "revert-card" },
		tooltip: "Revert the change from staging — the card returns to DO and a fresh worker iterates",
		severity: "danger"
	},
	{
		id: "release",
		label: "Release",
		intent: { kind: "release" },
		tooltip: "Throw the release lever — ALL merged cards ship to production as one train (rel-NN)"
	},
	{
		id: "inspect",
		label: "Inspect",
		intent: { kind: "inspect" },
		tooltip: "Inspect the merged card’s record"
	},
	{
		id: "open-terminal",
		label: "Terminal",
		intent: { kind: "open-terminal" },
		tooltip: "Open a cogitator terminal bound to the card’s workspace (§V4-7)"
	}
], Pe = [
	{
		id: "rollback-prod",
		label: "Rollback",
		intent: { kind: "rollback-card" },
		tooltip: "Withdraw the change from production back to staging (MERGED)",
		severity: "danger"
	},
	{
		id: "inspect",
		label: "Inspect",
		intent: { kind: "inspect" },
		tooltip: "Inspect the production card’s record"
	},
	{
		id: "open-terminal",
		label: "Terminal",
		intent: { kind: "open-terminal" },
		tooltip: "Open a cogitator terminal bound to the card’s workspace (§V4-7)"
	}
], Fe = new Set([
	"dispatching",
	"thinking",
	"tool_running",
	"blocked"
]);
function Ie(e) {
	let t = [...new Set(e.map((e) => e.taskKind))], n = [];
	if (t.length === 1) n = we[t[0]] ?? [];
	else if (t.length > 1) {
		let e = t.map((e) => we[e] ?? []);
		n = (e[0] ?? []).filter((t) => e.every((e) => e.some((e) => e.id === t.id)));
	}
	let r = [...n], i = [
		...xe,
		Te,
		Ee,
		De
	];
	for (let e of i) r.some((t) => t.id === e.id) || r.push(e);
	if (r.length > he.length) {
		let e = r.filter((e) => i.some((t) => t.id === e.id));
		return [...r.filter((e) => !i.some((t) => t.id === e.id)).slice(0, he.length - e.length), ...e];
	}
	return r;
}
function Le(e, t) {
	switch (e) {
		case "backlog": return Oe;
		case "do": return Ie(t);
		case "ai-review": return ke;
		case "human-review": return Ae;
		case "approved": return t.every((e) => e.merged) ? Me : je;
		case "merged": return Ne;
		case "in-production": return Pe;
	}
}
function Re(e) {
	let t = [...new Set(e.map((e) => e.column))];
	if (t.length === 1) return Le(t[0], e);
	let n = e.map((e) => Le(e.column, [e])), r = (n[0] ?? []).filter((e) => n.every((t) => t.some((t) => t.id === e.id)));
	return r.length > 0 ? r : Ce;
}
function ze(e) {
	let t = e.selection.states;
	if (t.length === 1 && t[0] === "awaiting_approval") return Se;
	if (t.every((e) => Fe.has(e) || e === "awaiting_approval")) {
		let t = e.cards.filter((e) => e.column === "do");
		return t.length > 0 ? Ie(t) : [...xe, Ee];
	}
	return Ce;
}
function Be(e) {
	let t;
	return t = e.selection.count === 0 ? be : e.selection.kinds.length === 1 && e.selection.kinds[0] === "task" && e.cards.length > 0 ? Re(e.cards) : e.selection.kinds.length === 1 && e.selection.kinds[0] === "unit" ? ze(e) : Ce, t.slice(0, he.length).map((t, n) => ye(t, e, he[n])).map((t) => Ve(t, e));
}
function Ve(e, t) {
	return e.id === "toggle-sim" ? t.fleet.simPaused ? {
		...e,
		label: "Resume Sim",
		icon: _e["resume-sim"] ?? e.icon,
		tooltip: "Resume the simulation clock"
	} : {
		...e,
		label: "Pause Sim",
		tooltip: "Pause the simulation clock"
	} : e.id === "pause-unit" && t.selection.pausedUnits > 0 && t.selection.pausedUnits === t.selection.count ? {
		...e,
		label: "Resume",
		icon: _e["resume-unit"] ?? e.icon,
		tooltip: "Release the hold and let the agents continue their runs"
	} : e.id === "set-yolo" && t.cards.length > 0 && t.cards.every((e) => e.yolo) ? {
		...e,
		label: "Unset Yolo",
		icon: _e["unset-yolo"] ?? e.icon,
		intent: {
			kind: "set-yolo",
			on: !1
		},
		tooltip: "Clear the yolo flag — AI-review passes go to human review again"
	} : e;
}
var He = {
	generateCommands: Be,
	generateIcon: (e) => R(e),
	generateOptionIcon: (e) => me(e),
	suggestCompletion: (e) => O(e)
}, Ue = he.length, We = new Set(he);
function Ge(e) {
	let t = /^Key([A-Z])$/.exec(e)?.[1];
	return t !== void 0 && We.has(t) ? t : null;
}
function Ke(e) {
	return He.generateCommands(h(e)).slice(0, Ue);
}
function qe(e, t) {
	return Ke(e).find((e) => e.hotkey === t);
}
function Je(e) {
	let { units: t, tasks: n } = d(e), r = t.map((e) => e.id);
	for (let e of n) for (let t of e.view.assigneeIds) r.includes(t) || r.push(t);
	return r;
}
function Ye(e, t, n) {
	let r = n.map((t) => e.world.units[t]).filter((e) => e !== void 0 && e.view.runId !== null);
	r.length !== 0 && (r.every((e) => e.view.paused) ? t.resumeUnits(r.map((e) => e.id)) : t.pauseUnits(r.filter((e) => !e.view.paused).map((e) => e.id)));
}
function Xe(e, t, n) {
	let r = t.getState(), { tasks: i } = d(r), a = Je(r);
	switch (e.kind) {
		case "steer":
			r.openSteer();
			return;
		case "pause-unit":
			Ye(r, n, a);
			return;
		case "inspect":
		case "open-diff": {
			let n = a[0], o = i[0];
			if (n !== void 0) r.openInspector(n);
			else if (o !== void 0) r.openInspectorCard(o.id);
			else return;
			e.kind === "open-diff" && t.getState().setInspectorTab("workspace");
			return;
		}
		case "abort":
			n.abort(a);
			return;
		case "approve":
		case "deny": {
			let t = p(r, a) ?? f(r);
			t !== void 0 && n.decide(t.hookRequestId, e.kind === "approve" ? "allow" : "deny");
			return;
		}
		case "task-action": {
			if (a.length === 0) return;
			n.steer(a, e.prompt);
			let t = i[0]?.view.title ?? `${a.length} agent(s)`;
			r.pushEvent(`Order relayed — ${e.prompt} (${t})`, "info", i[0]?.id);
			return;
		}
		case "move-card":
			for (let t of i) n.moveCard(t.id, e.column);
			return;
		case "set-yolo":
			for (let t of i) n.setYolo(t.id, e.on);
			return;
		case "prioritize": {
			let e = i[0];
			e !== void 0 && n.prioritize(e.id);
			return;
		}
		case "commission-task":
			n.createTask({ taskKind: "implement" });
			return;
		case "open-review": {
			let e = i[0];
			e !== void 0 && r.openReview(e.id);
			return;
		}
		case "hold-merge":
			Ye(r, n, a);
			return;
		case "revert-card":
			for (let e of i) n.revertCard(e.id);
			return;
		case "release":
			n.release();
			return;
		case "rollback-card":
			for (let e of i) n.rollbackCard(e.id);
			return;
		case "open-terminal": {
			let e = a[0], n = i[0];
			if (e !== void 0) r.openInspector(e);
			else if (n !== void 0) r.openInspectorCard(n.id);
			else return;
			t.getState().setInspectorTab("terminal");
			return;
		}
		case "open-ide": {
			let e = i[0]?.id ?? r.world.units[a[0] ?? ""]?.view.taskId ?? null;
			e !== null && r.openIde(e);
			return;
		}
		case "edit-card": {
			let e = i[0]?.id ?? r.world.units[a[0] ?? ""]?.view.taskId ?? null;
			e !== null && r.openCardEditor(e);
			return;
		}
		case "jump-to-alert":
			r.jumpToLatestAlert();
			return;
		case "toggle-sim":
			n.toggleSim();
			return;
	}
}
function Ze(e, t, n) {
	let r = qe(t.getState(), e);
	return r === void 0 ? !1 : (r.enabled && Xe(r.intent, t, n), !0);
}
//#endregion
//#region src/game/input.ts
function Qe(e) {
	if (!(e instanceof HTMLElement)) return !1;
	let t = e.tagName;
	return t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || e.isContentEditable;
}
function $e(e) {
	return e instanceof HTMLElement && e.closest("button, a, [role=\"button\"]") !== null;
}
function et({ store: e, orders: t }) {
	let n = (n) => {
		if (Qe(n.target)) return;
		switch (n.code) {
			case "Escape":
				e.getState().escape();
				return;
			case "Space":
				if ($e(n.target)) return;
				n.preventDefault(), n.repeat || (e.getState().jumpToLatestAlert(), e.getState().pulseDock());
				return;
			case "KeyM": {
				if (n.ctrlKey || n.metaKey || n.altKey) break;
				let t = e.getState().meta;
				if (t.foundryOpen || t.steerOpen || t.cardEditorTaskId !== null || t.runsOpen || t.ideTaskId !== null) return;
				t.archiveOpen ? e.getState().closeArchive() : e.getState().openArchive();
				return;
			}
			case "KeyN": {
				if (n.ctrlKey || n.metaKey || n.altKey) break;
				let t = e.getState().meta;
				if (t.archiveOpen || t.steerOpen || t.cardEditorTaskId !== null || t.runsOpen || t.ideTaskId !== null) return;
				t.foundryOpen ? e.getState().closeFoundry() : e.getState().openFoundry();
				return;
			}
			default: break;
		}
		if (n.ctrlKey || n.metaKey || n.altKey) return;
		let r = Ge(n.code);
		if (r === null) return;
		let i = e.getState();
		i.meta.foundryOpen || i.meta.archiveOpen || i.meta.steerOpen || i.meta.cardEditorTaskId !== null || i.meta.ideTaskId !== null || (n.repeat || Ze(r, e, t)) && n.preventDefault();
	};
	return window.addEventListener("keydown", n), () => {
		window.removeEventListener("keydown", n);
	};
}
//#endregion
//#region node_modules/zustand/esm/vanilla.mjs
var tt = (e) => {
	let t, n = /* @__PURE__ */ new Set(), r = (e, r) => {
		let i = typeof e == "function" ? e(t) : e;
		if (!Object.is(i, t)) {
			let e = t;
			t = r ?? (typeof i != "object" || !i) ? i : Object.assign({}, t, i), n.forEach((n) => n(t, e));
		}
	}, i = () => t, a = {
		setState: r,
		getState: i,
		getInitialState: () => o,
		subscribe: (e) => (n.add(e), () => n.delete(e))
	}, o = t = e(r, i, a);
	return a;
}, nt = ((e) => e ? tt(e) : tt), rt = (e) => e;
function B(t, n = rt) {
	let r = e.useSyncExternalStore(t.subscribe, e.useCallback(() => n(t.getState()), [t, n]), e.useCallback(() => n(t.getInitialState()), [t, n]));
	return e.useDebugValue(r), r;
}
//#endregion
//#region node_modules/clsx/dist/clsx.mjs
function it(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") if (Array.isArray(e)) {
		var i = e.length;
		for (t = 0; t < i; t++) e[t] && (n = it(e[t])) && (r && (r += " "), r += n);
	} else for (n in e) e[n] && (r && (r += " "), r += n);
	return r;
}
function V() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = it(e)) && (r && (r += " "), r += t);
	return r;
}
//#endregion
//#region src/contracts/kradle-resources.ts
var at = "kradle.a5c.ai/v1alpha1", ot = 177e10, st = [
	"claude-code",
	"codex",
	"gemini-cli",
	"pi"
], H = {
	"claude-code": ["claude-sonnet-4-5", "claude-opus-4-6"],
	codex: ["gpt-5.2-codex", "gpt-5.1-codex-mini"],
	"gemini-cli": ["gemini-3-pro", "gemini-3-flash"],
	pi: ["pi-2.5"]
}, U = [
	"implement",
	"review",
	"fix",
	"root-cause-analysis",
	"polish",
	"test-coverage",
	"docs",
	"deploy",
	"research",
	"migrate"
], ct = {
	implement: "claude-code",
	fix: "claude-code",
	migrate: "claude-code",
	review: "codex",
	"root-cause-analysis": "pi",
	"test-coverage": "pi",
	docs: "gemini-cli",
	research: "gemini-cli",
	polish: "codex",
	deploy: "codex"
}, lt = "kradle.a5c.ai/parent-task";
function ut(e, t, n, r, i) {
	return {
		stackRef: e,
		stack: {
			apiVersion: at,
			kind: "AgentStack",
			metadata: {
				name: t,
				namespace: "kradle-system",
				labels: { "a5c.ai/owner": "commander" }
			},
			spec: {
				baseAgent: n,
				adapter: n,
				model: H[n][0],
				prompt: {
					system: r,
					developer: i
				},
				approvalMode: "prompt",
				runnerPool: "untrusted-linux"
			},
			status: { phase: "ready" }
		}
	};
}
var dt = [
	ut("stk-01", "Meticulous Reviewer", "claude-code", "A meticulous reviewer who reads every diff line twice and trusts nothing without a failing test first. It cites the exact file and line for every finding and never waves a change through on vibes.", "Prefer small reviewed steps; demand a regression test for every fix."),
	ut("stk-02", "Bold Refactorer", "codex", "A bold refactorer who would rather rebuild the mechanism than patch around it. It moves fast, deletes dead weight without sentiment, and leaves the architecture simpler than it found it.", "When duplication appears twice, extract; when a module fights you, replace it."),
	ut("stk-03", "Careful Archivist", "gemini-cli", "A careful archivist who documents every decision before acting and never lets a finding go unrecorded. It writes prose first, code second, and keeps the ledgers immaculate.", "Every change ships with updated docs and a one-line rationale in the changelog."),
	ut("stk-04", "Swift Scout", "pi", "A swift scout that maps the territory in minutes and reports back before committing to anything heavy. It favors the smallest probe that answers the question and abandons dead ends without regret.", "Time-box every investigation; surface findings early and often.")
], ft = Object.fromEntries(U.map((e) => [e, dt.find((t) => t.stack.spec.adapter === ct[e]).stackRef])), pt = {
	implement: "Forge the new mechanism",
	review: "Audit the incoming diff",
	fix: "Hunt the regression",
	"root-cause-analysis": "Trace the fault to its origin",
	polish: "Burnish the brasswork",
	"test-coverage": "Fortify the test perimeter",
	docs: "Chart the territory",
	deploy: "Stage the launch sequence",
	research: "Survey the unknown plateau",
	migrate: "Relocate the archive vault"
}, mt = [
	{
		name: "frontier",
		repository: "a5c-ai/frontier"
	},
	{
		name: "bastion",
		repository: "a5c-ai/bastion"
	},
	{
		name: "relay",
		repository: "a5c-ai/relay"
	}
];
function ht(e, t, n, r, i, a) {
	return {
		resource: {
			apiVersion: at,
			kind: "AgentDispatchRun",
			metadata: {
				name: t,
				namespace: "kradle-system",
				labels: {
					"a5c.ai/title": i,
					"kradle.a5c.ai/repository": r.repository,
					"kradle.a5c.ai/agent-stack": "commander-fleet",
					"kradle.a5c.ai/runner-pool": "untrusted-linux",
					...a === null ? {} : { [lt]: a }
				}
			},
			spec: {
				repository: r.repository,
				ref: "refs/heads/main",
				branch: "main",
				sha: bt(e),
				sourceRefs: { triggerRule: "commander-manual-dispatch" },
				agentStack: "commander-fleet",
				taskKind: n,
				workspaceRef: r.workspaceId,
				runnerPool: "untrusted-linux",
				approvalPolicy: { requireWriteBackApproval: !0 }
			},
			status: {
				storage: "postgres",
				phase: "Pending",
				conditions: []
			}
		},
		taskKind: n,
		parentId: a
	};
}
var gt = [
	{
		kind: "Repository",
		prefix: "repository",
		stems: [
			"frontier",
			"bastion",
			"relay",
			"kradle"
		]
	},
	{
		kind: "Team",
		prefix: "team",
		stems: [
			"platform",
			"cogwheel",
			"lampwrights",
			"archivists"
		]
	},
	{
		kind: "Service",
		prefix: "service",
		stems: [
			"gateway",
			"dispatcher",
			"indexer",
			"beacon"
		]
	},
	{
		kind: "Package",
		prefix: "package",
		stems: [
			"sdk",
			"adapters",
			"catalog",
			"observer"
		]
	},
	{
		kind: "Runbook",
		prefix: "runbook",
		stems: [
			"ci-flake-triage",
			"rollback-drill",
			"lockfile-repair",
			"release-night"
		]
	},
	{
		kind: "Decision",
		prefix: "decision",
		stems: [
			"git-backed-memory",
			"event-sourcing",
			"monorepo-split",
			"brass-theme"
		]
	},
	{
		kind: "Incident",
		prefix: "incident",
		stems: [
			"ci-outage-05",
			"token-leak-03",
			"replay-drift-11",
			"gateway-stall-07"
		]
	},
	{
		kind: "AgentPractice",
		prefix: "agent-practice",
		stems: [
			"focused-tests-first",
			"small-diffs",
			"cite-sources",
			"verify-before-merge"
		]
	},
	{
		kind: "Skill",
		prefix: "skill",
		stems: [
			"diff-review",
			"bisect",
			"coverage-audit",
			"doc-weaving"
		]
	},
	{
		kind: "Tool",
		prefix: "tool",
		stems: [
			"memory-grep",
			"vitest",
			"playwright",
			"patch-press"
		]
	},
	{
		kind: "Customer",
		prefix: "customer",
		stems: ["aether-works", "gilded-gears"]
	},
	{
		kind: "ProductArea",
		prefix: "product-area",
		stems: [
			"orchestration",
			"observability",
			"memory"
		]
	},
	{
		kind: "Term",
		prefix: "term",
		stems: [
			"cogitator",
			"effect",
			"journal",
			"silo"
		]
	},
	{
		kind: "PromptFragment",
		prefix: "prompt-fragment",
		stems: [
			"review-checklist",
			"fix-protocol",
			"docs-voice"
		]
	}
], _t = [
	"documents",
	"implements",
	"depends_on",
	"supersedes",
	"owned_by",
	"applies_to_repo",
	"mentions",
	"derived_from",
	"resolved_by"
];
function vt(e, t) {
	let n = [], r = [
		"team:platform",
		"team:cogwheel",
		"team:lampwrights",
		"team:archivists"
	], i = [
		"approved",
		"approved",
		"approved",
		"draft",
		"deprecated"
	];
	for (let t of gt) for (let a of t.stems) n.push({
		nodeKind: t.kind,
		id: `${t.prefix}:${a}`,
		attributes: {
			title: a.replace(/-/g, " "),
			status: e.pick(i),
			owners: [e.pick(r)],
			summary: `Canonical ${t.kind} record for ${a}.`,
			tags: [t.prefix, e.pick([
				"ci",
				"agents",
				"memory",
				"release",
				"ops"
			])],
			updatedAt: (/* @__PURE__ */ new Date(ot - e.int(1, 90) * 864e5)).toISOString()
		}
	});
	for (let t of n) {
		let r = e.int(1, 3), i = {};
		for (let a = 0; a < r; a += 1) {
			let r = e.pick(_t), a = e.pick(n).id;
			a === t.id && (a = n[(n.indexOf(t) + 1) % n.length].id);
			let o = i[r] ?? [];
			o.push({ target: a }), i[r] = o;
		}
		t.edges = i;
	}
	let a = e.int(3, 4);
	return {
		silos: [
			"brain-frontier",
			"brain-bastion",
			"brain-relay",
			"brain-shared"
		].slice(0, a).map((i, o) => {
			let s = t[o % t.length], c = r[o % r.length], l = n.filter((e, t) => t % a === o || t % 7 == 0 && (t + 1) % a === o).map((e) => e.id);
			return {
				repository: {
					apiVersion: at,
					kind: "AgentMemoryRepository",
					metadata: {
						name: i,
						namespace: "kradle-system",
						labels: { "a5c.ai/owner": c.slice(5) }
					},
					spec: {
						repositoryRef: `${s.repository}-brain`,
						defaultBranch: "main",
						layoutProfile: "company-brain-v1"
					},
					status: {
						storage: "etcd",
						phase: "Ready",
						conditions: [],
						currentCommit: bt(e),
						indexDigest: `sha256:${bt(e)}${bt(e)}`
					}
				},
				source: {
					apiVersion: at,
					kind: "AgentMemorySource",
					metadata: {
						name: `${i}-source`,
						namespace: "kradle-system"
					},
					spec: {
						repositoryRef: i,
						appliesTo: {
							repositories: [s.repository],
							teams: [c]
						},
						include: {
							graphKinds: [
								"Runbook",
								"Decision",
								"AgentPractice",
								"Skill",
								"Tool"
							],
							paths: [
								"graph/**",
								"runbooks/**",
								"decisions/**"
							]
						},
						maxContextBytes: 75e4
					},
					status: {
						storage: "etcd",
						phase: "Ready",
						conditions: []
					}
				},
				recordIds: l
			};
		}),
		records: n
	};
}
function yt(e) {
	let t = new N((e ^ 1592639710) >>> 0), n = t.int(2, 3), r = mt.slice(0, n).map((e, t) => ({
		workspaceId: `ws-${String(t + 1).padStart(2, "0")}-${e.name}`,
		name: e.name,
		repository: e.repository
	})), i = [], a = 0, o = (e) => (a += 1, `adr-${String(a).padStart(2, "0")}-${e}`), s = t.shuffle(U), c = t.int(6, 8);
	for (let e = 0; e < c; e += 1) {
		let n = s[e % s.length], a = r[e % r.length];
		i.push(ht(t, o(n), n, a, pt[n], null));
	}
	for (let e = 0; e < 2; e += 1) {
		let n = s[(c + e) % s.length], a = r[e % r.length], l = o(n);
		i.push(ht(t, l, n, a, pt[n], null));
		let u = t.int(2, 3);
		for (let n = 0; n < u; n += 1) {
			let r = s[(c + e + n + 1) % s.length];
			i.push(ht(t, o(r), r, a, `${pt[r]} (${n + 1})`, l));
		}
	}
	return {
		seed: e,
		epochMs: ot,
		workspaces: r,
		cards: i,
		memory: vt(t, r)
	};
}
function bt(e) {
	let t = "";
	for (let n = 0; n < 12; n += 1) t += "0123456789abcdef"[e.int(0, 15)];
	return t;
}
//#endregion
//#region src/backend/mock/simulation.ts
function xt(e) {
	switch (e) {
		case "Ready":
		case "Pending":
		case "Blocked":
		case "Error": return e;
		case "succeeded":
		case "Succeeded":
		case "Completed": return "Ready";
		case "failed":
		case "cancelled":
		case "Cancelled": return "Error";
		case "waiting-for-approval":
		case "AwaitingApproval": return "Blocked";
		default: return "Pending";
	}
}
var St = [
	.5,
	1,
	2
], Ct = [
	"backlog",
	"do",
	"ai-review",
	"human-review",
	"approved",
	"merged",
	"in-production"
], wt = {
	fix: [
		"reproduce",
		"diagnose",
		"patch",
		"verify"
	],
	review: [
		"survey",
		"annotate",
		"verdict"
	],
	"root-cause-analysis": [
		"reproduce",
		"hypothesize",
		"bisect",
		"conclude"
	],
	"test-coverage": [
		"map gaps",
		"add cases",
		"run suite"
	],
	docs: [
		"outline",
		"draft",
		"polish prose"
	],
	research: [
		"survey",
		"synthesize",
		"cite sources"
	],
	polish: [
		"capture plates",
		"score",
		"apply findings"
	],
	deploy: [
		"dry run",
		"ship",
		"watch"
	],
	migrate: [
		"plan steps",
		"execute step",
		"verify parity"
	],
	implement: [
		"plan",
		"implement",
		"verify",
		"review"
	]
}, Tt = [
	{
		inquiryKind: "strategy",
		question: (e) => `Choose the working strategy for "${e}"`,
		options: [
			{
				id: "incremental",
				caption: "Incremental",
				detail: "Small reviewed steps, slower but safe",
				tone: "primary"
			},
			{
				id: "big-bang",
				caption: "Big Bang",
				detail: "One sweeping change, fastest path",
				tone: "danger"
			},
			{
				id: "expand-contract",
				caption: "Expand-Contract",
				detail: "Parallel structures, migrate, then prune",
				tone: "normal"
			}
		]
	},
	{
		inquiryKind: "fix-approach",
		question: (e) => `Pick the fix approach for "${e}"`,
		options: [
			{
				id: "patch-forward",
				caption: "Patch Forward",
				detail: "Repair in place on the current branch",
				tone: "primary"
			},
			{
				id: "revert-redo",
				caption: "Revert & Redo",
				detail: "Back out the regression, reland cleanly",
				tone: "normal"
			},
			{
				id: "quarantine",
				caption: "Quarantine",
				detail: "Isolate the failure behind a flag for now",
				tone: "danger"
			}
		]
	},
	{
		inquiryKind: "dependency-version",
		question: (e) => `Select the dependency version for "${e}"`,
		options: [
			{
				id: "pin-current",
				caption: "Pin Current",
				detail: "Freeze the working version",
				tone: "normal"
			},
			{
				id: "minor-bump",
				caption: "Minor Bump",
				detail: "Take the latest compatible minor",
				tone: "primary"
			},
			{
				id: "major-upgrade",
				caption: "Major Upgrade",
				detail: "Cross the breaking-change line",
				tone: "danger"
			},
			{
				id: "hold",
				caption: "Hold",
				detail: "Defer the decision to the next cycle",
				tone: "normal"
			}
		]
	},
	{
		inquiryKind: "tool-approval",
		question: (e) => `Agent wants to run \`git push\` for "${e}" — proceed?`,
		options: [{
			id: "proceed",
			caption: "Proceed",
			detail: "Allow the gated tool call",
			tone: "primary"
		}, {
			id: "stand-down",
			caption: "Stand Down",
			detail: "Deny and rethink",
			tone: "danger"
		}]
	}
], Et = {
	implement: [
		"src/core/mechanism.ts",
		"src/core/mechanism.test.ts",
		"src/index.ts",
		"src/core/registry.ts"
	],
	review: [
		"REVIEW_NOTES.md",
		"src/review/checklist.ts",
		"docs/review-log.md"
	],
	fix: [
		"src/engine/regulator.ts",
		"src/engine/regulator.test.ts",
		"src/engine/valves.ts",
		"CHANGELOG.md"
	],
	"root-cause-analysis": [
		"docs/rca/findings.md",
		"src/diagnostics/probe.ts",
		"src/diagnostics/probe.test.ts"
	],
	polish: [
		"src/ui/plates.css",
		"src/ui/ornament.tsx",
		"docs/style-ledger.md"
	],
	"test-coverage": [
		"src/core/mechanism.test.ts",
		"src/engine/valves.test.ts",
		"vitest.config.ts"
	],
	docs: [
		"docs/atlas.md",
		"README.md",
		"docs/glossary.md"
	],
	deploy: [
		"deploy/manifest.yaml",
		"scripts/launch.sh",
		"deploy/rollback.md"
	],
	research: [
		"docs/research/survey.md",
		"docs/research/citations.md",
		"notes/leads.md"
	],
	migrate: [
		"migrations/0007-vault.sql",
		"src/storage/vault.ts",
		"src/storage/vault.test.ts",
		"docs/migration-plan.md"
	]
}, Dt = [
	"manifold",
	"regulator",
	"flywheel",
	"servo",
	"plenum",
	"dynamo",
	"lattice",
	"gimbal",
	"capacitor",
	"aether"
], Ot = [
	"calibrate",
	"engage",
	"temper",
	"align",
	"transmute",
	"regulate",
	"prime",
	"anneal"
], kt = [
	[
		"Scanning the objective perimeter... ",
		"Sweeping the objective perimeter a second time... ",
		"Re-walking the objective perimeter for stragglers... "
	],
	[
		"Cross-referencing the failing assertions... ",
		"Collating the failing assertions against the ledger... ",
		"Sifting the failing assertions for a common root... "
	],
	[
		"The diff suggests a deeper structural issue. ",
		"The diff hints the rot runs beneath this module. ",
		"The diff points at a seam the tests never pressed. "
	],
	[
		"Weighing two repair strategies... ",
		"Balancing a quick patch against a proper mend... ",
		"Holding both repair routes up to the light... "
	],
	[
		"Tracing the regression to its origin commit. ",
		"Following the regression back through the log. ",
		"Bisecting the history toward the offending change. "
	],
	[
		"Formulating a minimal patch plan. ",
		"Sketching the smallest cut that heals the fault. ",
		"Drafting a patch plan that touches nothing it need not. "
	]
], At = [
	[
		"Applying the fix to the affected module. ",
		"Landing the fix in the affected module. ",
		"Threading the fix through the affected module. "
	],
	[
		"Updating tests to cover the new branch. ",
		"Adding a regression test over the new branch. ",
		"Extending the suite to pin the new branch. "
	],
	[
		"Refactoring the helper for clarity. ",
		"Untangling the helper so it reads plainly. ",
		"Tidying the helper before it calcifies. "
	],
	[
		"Verifying the change against the spec. ",
		"Checking the change clause by clause against the spec. ",
		"Re-reading the spec to confirm the change holds. "
	],
	[
		"Documenting the decision inline. ",
		"Inscribing the rationale beside the code. ",
		"Leaving a note for the next unfortunate reader. "
	],
	[
		"Consolidating duplicate logic. ",
		"Folding the duplicated logic into one place. ",
		"Retiring the second copy of this logic. "
	]
];
function jt(e, t, n) {
	let r = e[t];
	return r[n % r.length];
}
var Mt = [
	"Bash",
	"Read",
	"Edit",
	"Grep",
	"WebFetch"
], Nt = [
	(e) => `Consider tightening the error handling in ${e}.`,
	(e) => `${e}: naming is clear; add a regression test for the edge case.`,
	(e) => `The diff in ${e} looks correct; verify the rollback path.`,
	(e) => `${e} duplicates logic from the registry — extract a helper.`,
	(e) => `Second pass over ${e}: the boundary condition still worries me.`,
	(e) => `${e} reads well now; document the invariant inline before merge.`
];
function Pt(e, t, n, r) {
	let i = Nt.length, a = (r + Math.max(0, t - 1)) % i;
	for (let t = 0; t < i; t += 1) {
		let r = Nt[(a + t) % i](e);
		if (!n.includes(r)) return r;
	}
	return Nt[a](e);
}
var Ft = [
	"Changes requested: the verify phase is missing coverage for the failure path.",
	"Changes requested: the patch leaks state across iterations — isolate it.",
	"Changes requested: documentation does not match the implemented behavior."
], It = {
	"claude-code": {
		input: 3e-6,
		output: 15e-6
	},
	codex: {
		input: 25e-7,
		output: 1e-5
	},
	"gemini-cli": {
		input: 15e-7,
		output: 7e-6
	},
	pi: {
		input: 1e-6,
		output: 5e-6
	}
}, Lt = 15e3, Rt = "mock-commander/3.0.0", zt = 100, Bt = /* @__PURE__ */ "Brassbeak.Cogsworth.Pinion.Gearhart.Sprocketta.Tinwhistle.Boilerbun.Flywheel.Copperdove.Ratchet.Camshaft.Steamwick.Gimbal.Soldera.Rivetta.Clankston.Pendula.Axleby.Vapoura.Dynamo.Quillgear.Ironmoth.Bellowsby.Cinderlatch.Mainspring.Thimblecog.Valvette.Smokestack.Borewell.Latchkey.Turbina.Weldwyn".split("."), Vt = {
	worker: "the Worker",
	reviewer: "the Reviewer",
	integration: "the Integrator"
};
function Ht(e) {
	let t = "created";
	for (let n of e) switch (n.type) {
		case "RUN_CREATED":
			t = "created";
			break;
		case "EFFECT_REQUESTED":
		case "EFFECT_RESOLVED":
		case "EFFECT_CANCELLED":
			t = "waiting";
			break;
		case "RUN_COMPLETED":
			t = "completed";
			break;
		case "RUN_HALTED":
			t = "halted";
			break;
		case "RUN_FAILED":
		case "PROCESS_RUNTIME_ERROR":
			t = "failed";
			break;
	}
	return t;
}
var Ut = class {
	seed;
	scenario;
	rng;
	cards = /* @__PURE__ */ new Map();
	agents = /* @__PURE__ */ new Map();
	sessions = /* @__PURE__ */ new Map();
	usedCreatureNames = /* @__PURE__ */ new Set();
	sessionOrderCounter = 0;
	runs = /* @__PURE__ */ new Map();
	inquiries = /* @__PURE__ */ new Map();
	listeners = /* @__PURE__ */ new Set();
	tickCount = 0;
	pausedFlag = !1;
	interval = null;
	runCounter = 0;
	hookCounter = 0;
	toolCounter = 0;
	agentCounter = 0;
	creationCounter = 0;
	ulidCounter = 0;
	orderCounter = 0;
	rosterAgents = /* @__PURE__ */ new Map();
	rosterCounter = 0;
	stacks = /* @__PURE__ */ new Map();
	stackCounter = 0;
	releaseCounter = 0;
	templates = /* @__PURE__ */ new Map();
	memoryUpdateCounter = 0;
	speedValue = 1;
	constructor(e) {
		this.seed = e.seed >>> 0, this.scenario = e.scenario ?? yt(this.seed), this.rng = new N(this.seed);
		for (let e of dt) this.stacks.set(e.stackRef, {
			stackRef: e.stackRef,
			custom: !1,
			stack: JSON.parse(JSON.stringify(e.stack))
		});
		for (let e of U) this.templates.set(e, {
			revision: 1,
			phases: [...wt[e]]
		});
		let t = [
			{
				stackRef: dt[0].stackRef,
				name: "Cogsworth",
				role: "worker"
			},
			{
				stackRef: dt[1].stackRef,
				name: "Pendula",
				role: "reviewer"
			},
			{
				stackRef: dt[2].stackRef,
				name: "Brassbeak",
				role: "worker"
			}
		];
		for (let e of t) {
			this.rosterCounter += 1;
			let t = `ra-${String(this.rosterCounter).padStart(3, "0")}`;
			this.rosterAgents.set(t, {
				agentId: t,
				name: e.name,
				stackRef: e.stackRef,
				role: e.role,
				assignedTaskId: null,
				assignedRole: null
			});
		}
		for (let e of this.scenario.cards) this.addCard(e.resource, e.taskKind, e.parentId);
	}
	get paused() {
		return this.pausedFlag;
	}
	get tickIndex() {
		return this.tickCount;
	}
	now() {
		return this.scenario.epochMs + this.tickCount * 250;
	}
	pause() {
		this.pausedFlag = !0;
	}
	resume() {
		this.pausedFlag = !1;
	}
	tick(e = 1) {
		for (let t = 0; t < e; t += 1) this.stepOnce();
	}
	start(e) {
		this.interval === null && (this.intervalOverride = e ?? null, this.interval = setInterval(() => {
			this.pausedFlag || this.stepOnce();
		}, e ?? this.tickIntervalMs));
	}
	stop() {
		this.interval !== null && (clearInterval(this.interval), this.interval = null);
	}
	intervalOverride = null;
	get speed() {
		return this.speedValue;
	}
	get tickIntervalMs() {
		return 800 / this.speedValue;
	}
	setSpeed(e) {
		return St.includes(e) ? (this.speedValue = e, this.interval !== null && (this.stop(), this.start(this.intervalOverride ?? void 0)), !0) : (this.emit({
			type: "error",
			code: "invalid_speed",
			message: `Speed must be one of ${St.join("/")}; got ${String(e)}`
		}), !1);
	}
	onFrame(e) {
		return this.listeners.add(e), () => {
			this.listeners.delete(e);
		};
	}
	handleClientFrame(e) {
		switch (e.type) {
			case "auth":
				this.emit({
					type: "hello",
					protocolVersions: ["1"],
					serverVersion: Rt,
					serverTime: new Date(this.now()).toISOString()
				});
				return;
			case "ping":
				this.emit({ type: "pong" });
				return;
			case "subscribe":
				this.runs.has(e.runId) || this.emit({
					type: "error",
					code: "run_not_found",
					message: `Unknown run: ${e.runId}`,
					runId: e.runId
				});
				return;
			case "unsubscribe":
			case "session.subscribe":
			case "session.unsubscribe":
			case "pairing.register":
			case "pairing.consume": return;
			case "session.start":
				this.emit({
					type: "error",
					code: "unsupported_in_v3",
					message: "session.start is retired: agents spawn on demand when a card enters DO"
				});
				return;
			case "session.message":
				this.handleSessionMessage(e);
				return;
			case "hook.decision":
				this.answerInquiry(e.hookRequestId, e.optionId ?? null, e.decision, e.reason);
				return;
		}
	}
	moveCard(e, t) {
		let n = this.cards.get(e);
		if (!n || !Ct.includes(t)) return this.emit({
			type: "error",
			code: "task_not_found",
			message: `Unknown task: ${e}`
		}), !1;
		if (n.parentId !== null) return this.emit({
			type: "error",
			code: "illegal_move",
			message: `Card ${e} is a stack child — drag its parent (the whole stack moves)`
		}), !1;
		if (n.merged) return this.emit({
			type: "error",
			code: "illegal_move",
			message: `Card ${e} is merged (terminal)`
		}), !1;
		let r = n.column;
		return r === "backlog" && (t === "do" || t === "backlog") || r === "human-review" && (t === "do" || t === "ai-review" || t === "approved") ? r === "backlog" && t === "backlog" ? (this.orderCounter += 1, n.order = this.orderCounter, !0) : (this.transitionCard(n, t, "user-move"), !0) : (this.emit({
			type: "error",
			code: "illegal_move",
			message: `Illegal user move ${r} -> ${t} for ${e} (allowed: backlog->do, backlog reorder, human-review->do|ai-review|approved)`
		}), !1);
	}
	setYolo(e, t) {
		let n = this.cards.get(e);
		return n ? n.yolo === t ? !0 : (n.yolo = t, this.emitSimEvent(n, {
			type: "yolo_set",
			runId: n.run?.runId ?? "run-none",
			agent: "commander",
			timestamp: this.now(),
			taskId: e,
			on: t
		}), !0) : (this.emit({
			type: "error",
			code: "task_not_found",
			message: `Unknown task: ${e}`
		}), !1);
	}
	createTask(e) {
		if (!U.includes(e.taskKind)) return this.emit({
			type: "error",
			code: "invalid_task_kind",
			message: `Unknown task kind: ${String(e.taskKind)}`
		}), null;
		let t = e.parentId === void 0 ? void 0 : this.cards.get(e.parentId);
		if (e.parentId !== void 0 && !t) return this.emit({
			type: "error",
			code: "task_not_found",
			message: `Unknown parent task: ${e.parentId}`
		}), null;
		this.creationCounter += 1;
		let n = `adr-c${String(this.creationCounter).padStart(2, "0")}-${e.taskKind}`, r = this.scenario.workspaces.find((t) => t.workspaceId === e.workspaceId) ?? this.scenario.workspaces[0], i = e.title ?? pt[e.taskKind], a = {
			apiVersion: "kradle.a5c.ai/v1alpha1",
			kind: "AgentDispatchRun",
			metadata: {
				name: n,
				namespace: "kradle-system",
				labels: {
					"a5c.ai/title": i,
					"kradle.a5c.ai/repository": r.repository,
					"kradle.a5c.ai/agent-stack": "commander-fleet",
					"kradle.a5c.ai/runner-pool": "untrusted-linux",
					...t ? { [lt]: t.taskId } : {}
				}
			},
			spec: {
				repository: r.repository,
				ref: "refs/heads/main",
				branch: "main",
				sha: this.deterministicSha(n),
				sourceRefs: { triggerRule: "commander-foundry" },
				agentStack: "commander-fleet",
				taskKind: e.taskKind,
				workspaceRef: r.workspaceId,
				runnerPool: "untrusted-linux",
				approvalPolicy: { requireWriteBackApproval: !0 }
			},
			status: {
				storage: "postgres",
				phase: "Pending",
				conditions: []
			}
		}, o = this.addCard(a, e.taskKind, t ? t.taskId : null);
		return this.emitSimEvent(o, {
			type: "task_created",
			runId: "run-none",
			agent: "commander",
			timestamp: this.now(),
			taskId: n,
			taskKind: e.taskKind,
			title: i
		}), n;
	}
	answerInquiry(e, t, n = "allow", r) {
		let i = this.inquiries.get(e);
		if (!i) return this.emit({
			type: "error",
			code: "hook_not_found",
			message: `Unknown hook request: ${e}`
		}), !1;
		let a = n === "deny" ? i.options.find((e) => e.tone === "danger") ?? i.options[i.options.length - 1] : i.options[0], o = i.options.find((e) => e.id === t) ?? a;
		this.inquiries.delete(e);
		let s = this.cards.get(i.taskId), c = this.agents.get(i.unitId);
		if (this.emit({
			type: "hook.resolved",
			hookRequestId: e,
			resolvedBy: "operator",
			decision: o.tone === "danger" && i.inquiryKind === "tool-approval" ? "deny" : "allow"
		}), !s || !s.run) return !0;
		if (this.resolveEffect(s.run, i.effectId, "EFFECT_RESOLVED", {
			optionId: o.id,
			caption: o.caption,
			...r === void 0 ? {} : { reason: r }
		}), this.emitSimEvent(s, {
			type: "inquiry_resolved",
			runId: s.run.runId,
			agent: c?.agent ?? "commander",
			timestamp: this.now(),
			taskId: s.taskId,
			hookRequestId: e,
			inquiryKind: i.inquiryKind,
			optionId: o.id,
			caption: o.caption,
			question: i.question
		}), i.inquiryKind !== "tool-approval") {
			let e = s.run.phaseIndex + 1;
			e < s.run.phases.length ? s.run.phases[e] = `${s.run.phases[e]} via ${o.id}` : s.run.phases.push(`settle ${o.id}`), s.pendingFollowUps.push({
				text: `[${o.id}] ${o.caption} path engaged — ${o.detail ?? "committing to the branch"}`,
				optionId: o.id
			}, {
				text: `[${o.id}] replanning remaining phases for the ${o.caption} route`,
				optionId: o.id
			});
		} else o.id === "proceed" ? s.pendingFollowUps.push({
			text: "[proceed] gated tool call released — `git push` executing",
			optionId: o.id
		}) : s.pendingFollowUps.push({
			text: "[stand-down] gated tool call denied — agent rethinking",
			optionId: o.id
		});
		return c && (this.pushTranscript(c.session, "event", `Inquiry resolved: ${o.caption} (${o.id}).`), c.pendingHookId = null, c.state = "thinking", c.stateTicks = 0, c.stateDuration = this.rng.int(2, 5), c.updatedAt = this.now()), !0;
	}
	revertCard(e) {
		let t = this.cards.get(e);
		if (!t) return this.emit({
			type: "error",
			code: "task_not_found",
			message: `Unknown task: ${e}`
		}), !1;
		if (t.parentId !== null || t.column !== "merged") return this.emit({
			type: "error",
			code: "illegal_move",
			message: `Revert requires a top-level card in MERGED; ${e} is in ${t.column}`
		}), !1;
		let n = `Reverted from staging: release verification flagged "${this.titleOf(t)}" — iterate and re-land.`;
		return t.feedback = n, t.releaseId = null, this.unseal(t), this.emitSimEvent(t, {
			type: "reverted",
			runId: t.run?.runId ?? "run-none",
			agent: "commander",
			timestamp: this.now(),
			taskId: e,
			feedback: n
		}), this.transitionCard(t, "do", "reverted"), !0;
	}
	release() {
		let e = [...this.cards.values()].filter((e) => e.parentId === null && e.column === "merged");
		if (e.length === 0) return this.emit({
			type: "error",
			code: "empty_release",
			message: "No merged cards to release"
		}), null;
		this.releaseCounter += 1;
		let t = `rel-${String(this.releaseCounter).padStart(2, "0")}`;
		return e.forEach((e, n) => {
			this.shipCard(e, t, n);
		}), t;
	}
	rollbackCard(e) {
		let t = this.cards.get(e);
		if (!t) return this.emit({
			type: "error",
			code: "task_not_found",
			message: `Unknown task: ${e}`
		}), !1;
		if (t.parentId !== null || t.column !== "in-production") return this.emit({
			type: "error",
			code: "illegal_move",
			message: `Rollback requires a top-level card in IN PRODUCTION; ${e} is in ${t.column}`
		}), !1;
		let n = t.releaseId;
		return t.releaseId = null, t.inProductionAtTick = null, this.emitSimEvent(t, {
			type: "rolled_back",
			runId: t.run?.runId ?? "run-none",
			agent: "commander",
			timestamp: this.now(),
			taskId: e,
			releaseId: n
		}), this.transitionCard(t, "merged", "rolled-back"), !0;
	}
	updateTask(e, t) {
		let n = this.cards.get(e);
		if (!n) return this.emit({
			type: "error",
			code: "task_not_found",
			message: `Unknown task: ${e}`
		}), !1;
		if (t.taskKind !== void 0 && !U.includes(t.taskKind)) return this.emit({
			type: "error",
			code: "invalid_task_kind",
			message: `Unknown task kind: ${String(t.taskKind)}`
		}), !1;
		if (t.stackRef !== void 0 && !this.stacks.has(t.stackRef)) return this.emit({
			type: "error",
			code: "stack_not_found",
			message: `Unknown agent stack: ${t.stackRef}`
		}), !1;
		if (t.parentId !== void 0 && t.parentId !== null) {
			let r = this.cards.get(t.parentId);
			if (!r || r.taskId === e || r.parentId !== null) return this.emit({
				type: "error",
				code: "task_not_found",
				message: `Invalid parent task: ${String(t.parentId)}`
			}), !1;
			if (n.column !== "backlog") return this.emit({
				type: "error",
				code: "illegal_move",
				message: `Parent reassignment is legal only while in backlog; ${e} is in ${n.column}`
			}), !1;
		}
		let r = t.workspaceId === void 0 ? void 0 : this.scenario.workspaces.find((e) => e.workspaceId === t.workspaceId);
		if (t.workspaceId !== void 0 && !r) return this.emit({
			type: "error",
			code: "workspace_not_found",
			message: `Unknown workspace: ${t.workspaceId}`
		}), !1;
		let i = {};
		if (t.title !== void 0 && (n.resource.metadata.labels = {
			...n.resource.metadata.labels,
			"a5c.ai/title": t.title
		}, i.title = t.title), t.taskKind !== void 0 && t.taskKind !== n.taskKind && (n.taskKind = t.taskKind, n.resource.spec.taskKind = t.taskKind, i.taskKind = t.taskKind), t.description !== void 0 && (n.description = t.description, i.description = t.description), t.yolo !== void 0 && t.yolo !== n.yolo && (n.yolo = t.yolo, i.yolo = t.yolo), t.parentId !== void 0) {
			let r = n.parentId === null ? void 0 : this.cards.get(n.parentId);
			if (r && (r.childIds = r.childIds.filter((t) => t !== e)), n.parentId = t.parentId, t.parentId !== null) {
				let r = this.cards.get(t.parentId);
				r.childIds.includes(e) || r.childIds.push(e), n.resource.metadata.labels = {
					...n.resource.metadata.labels,
					[lt]: t.parentId
				};
			} else n.resource.metadata.labels && delete n.resource.metadata.labels[lt];
			i.parentId = t.parentId;
		}
		return r && (n.resource.spec.workspaceRef = r.workspaceId, n.resource.spec.repository = r.repository, n.resource.metadata.labels = {
			...n.resource.metadata.labels,
			"kradle.a5c.ai/repository": r.repository
		}, i.workspaceId = r.workspaceId), t.stackRef !== void 0 && (n.stackRefOverride = t.stackRef, i.stackRef = t.stackRef), this.emitSimEvent(n, {
			type: "task_updated",
			runId: n.run?.runId ?? "run-none",
			agent: "commander",
			timestamp: this.now(),
			taskId: e,
			patch: i,
			stackRef: this.stackRefOf(n)
		}), !0;
	}
	upsertStack(e) {
		let t = e.metadata?.name?.trim() ?? "", n = e.spec;
		if (t === "" || !n || typeof n.baseAgent != "string" || typeof n.adapter != "string") return this.emit({
			type: "error",
			code: "invalid_stack",
			message: "upsertStack requires metadata.name and spec.{baseAgent, adapter}"
		}), null;
		let r = e.stackRef !== void 0 && this.stacks.has(e.stackRef) ? e.stackRef : null;
		r === null && (this.stackCounter += 1, r = `stk-c${String(this.stackCounter).padStart(2, "0")}`);
		let i = {
			apiVersion: e.apiVersion ?? "kradle.a5c.ai/v1alpha1",
			kind: "AgentStack",
			metadata: {
				name: t,
				namespace: e.metadata.namespace ?? "kradle-system",
				labels: { ...e.metadata.labels }
			},
			spec: {
				baseAgent: n.baseAgent,
				adapter: n.adapter,
				...n.provider === void 0 ? {} : { provider: n.provider },
				model: n.model ?? H[this.adapterOfStackSpec(n)][0],
				prompt: {
					system: n.prompt?.system ?? "",
					developer: n.prompt?.developer
				},
				approvalMode: n.approvalMode ?? "prompt",
				...n.toolProfileRef === void 0 ? {} : { toolProfileRef: n.toolProfileRef },
				...n.skillRefs === void 0 ? {} : { skillRefs: [...n.skillRefs] },
				...n.subagentRefs === void 0 ? {} : { subagentRefs: [...n.subagentRefs] },
				...n.runnerPool === void 0 ? {} : { runnerPool: n.runnerPool }
			},
			status: { phase: e.status?.phase ?? "ready" }
		}, a = this.stacks.get(r);
		return this.stacks.set(r, {
			stackRef: r,
			custom: a ? a.custom : !0,
			stack: i
		}), this.emitEnveloped("run-none", "commander", {
			type: "stack_forged",
			runId: "run-none",
			agent: "commander",
			timestamp: this.now(),
			taskId: "",
			stackRef: r,
			name: t,
			adapter: i.spec.adapter,
			model: i.spec.model,
			updated: a !== void 0
		}), r;
	}
	updateProcessTemplate(e, t) {
		let n = this.templates.get(e);
		if (!n) return this.emit({
			type: "error",
			code: "invalid_task_kind",
			message: `Unknown task kind: ${String(e)}`
		}), null;
		let r = t.map((e) => String(e).trim()).filter((e) => e.length > 0);
		return r.length < 2 || r.length !== t.length ? (this.emit({
			type: "error",
			code: "invalid_template",
			message: `A process template needs >=2 non-empty phases; got ${JSON.stringify(t)}`
		}), null) : (n.revision += 1, n.phases = r, this.emitEnveloped("run-none", "commander", {
			type: "process_updated",
			runId: "run-none",
			agent: "commander",
			timestamp: this.now(),
			taskId: "",
			kind: e,
			processId: `commander/${e}@v${n.revision}`,
			revision: n.revision,
			phases: [...r]
		}), n.revision);
	}
	writeFile(e, t, n) {
		let r = this.cards.get(e);
		if (!r) return this.emit({
			type: "error",
			code: "task_not_found",
			message: `Unknown task: ${e}`
		}), !1;
		let i = this.getFileContent(e, t) ?? "";
		r.fileOverrides.set(t, n);
		let a = i === "" ? [] : i.split("\n"), o = n.split("\n"), s = new Set(a), c = new Set(o), l = a.filter((e) => !c.has(e)), u = o.filter((e) => !s.has(e)), d = [
			`@@ -1,${a.length} +1,${o.length} @@ manual edit`,
			` // edited via commander: ${t}`,
			...l.slice(0, 10).map((e) => `-${e}`),
			...u.slice(0, 10).map((e) => `+${e}`),
			` // end: ${t}`
		], f = r.ws.files.find((e) => e.path === t), p = f || i !== "" ? "M" : "A";
		return f ? (f.status = "M", f.additions += u.length, f.deletions += l.length, f.diff = d.slice(0, 25).join("\n")) : r.ws.files.push({
			path: t,
			status: p,
			additions: Math.max(u.length, 1),
			deletions: l.length,
			diff: d.slice(0, 25).join("\n")
		}), r.ws.dirty = !0, this.emitSimEvent(r, {
			type: "workspace_change",
			runId: r.run?.runId ?? "run-none",
			agent: "commander",
			timestamp: this.now(),
			taskId: e,
			path: t,
			status: p,
			source: "editor"
		}), !0;
	}
	retireUnit(e) {
		return this.emit({
			type: "error",
			code: "unit_busy",
			message: `Unit ${e} is lifecycle-owned under V3 — agents despawn with their card`
		}), !1;
	}
	pauseUnit(e) {
		let t = this.agents.get(e);
		return !t || t.held || t.state === "awaiting_input" ? !1 : (t.held = !0, t.updatedAt = this.now(), this.emitAgentEvent(t, {
			type: "paused",
			runId: this.runIdOf(t),
			agent: t.agent,
			timestamp: this.now()
		}), !0);
	}
	resumeUnit(e) {
		let t = this.agents.get(e);
		return !t || !t.held ? !1 : (t.held = !1, t.updatedAt = this.now(), this.emitAgentEvent(t, {
			type: "resumed",
			runId: this.runIdOf(t),
			agent: t.agent,
			timestamp: this.now()
		}), !0);
	}
	prioritizeTask(e) {
		let t = this.cards.get(e);
		return t ? t.column === "backlog" ? (t.order = Math.min(0, ...[...this.cards.values()].map((e) => e.order)) - 1, this.emitSimEvent(t, {
			type: "task_prioritized",
			runId: t.run?.runId ?? "run-none",
			agent: "commander",
			timestamp: this.now(),
			taskId: e
		}), !0) : !1 : (this.emit({
			type: "error",
			code: "task_not_found",
			message: `Unknown task: ${e}`
		}), !1);
	}
	listAgents() {
		return st.map((e) => ({
			agent: e,
			displayName: e,
			adapterType: "subprocess",
			structuredSessionTransport: "persistent",
			sessionControlPlane: "self-managed",
			supportsInteractiveMode: !0,
			canResume: !0,
			supportsImageInput: e !== "pi",
			supportsFileAttachments: !0,
			approvalModes: [
				"yolo",
				"prompt",
				"deny"
			]
		}));
	}
	listSessionEntries() {
		return [...this.agents.values()].map((e) => {
			let t = this.runIdOf(e), n = this.runs.get(t);
			return {
				sessionId: e.unitId,
				agent: e.agent,
				status: "active",
				activeRunId: t,
				latestRunId: t,
				createdAt: e.createdAt,
				updatedAt: e.updatedAt,
				latestRunStartedAt: n ? n.entry.startedAt : null,
				latestRunEndedAt: n ? n.entry.endedAt : null,
				title: `${e.role}:${e.taskId}`,
				turnCount: e.session.turnCount,
				messageCount: e.session.messageCount,
				model: e.model,
				cost: this.costOf(e),
				cwd: `/ws/${this.workspaceOf(e.taskId)}`,
				workspaceId: this.workspaceOf(e.taskId),
				source: "gateway"
			};
		});
	}
	listRunEntries() {
		return [...this.runs.values()].map((e) => ({ ...e.entry }));
	}
	listRuns() {
		return [...this.runs.values()].map((e) => this.runViewOf(e)).reverse();
	}
	listSessions(e) {
		return [...this.sessions.values()].filter((t) => e === void 0 || t.taskId === e).sort((e, t) => t.order - e.order).map((e) => this.sessionViewOf(e));
	}
	getSession(e) {
		let t = this.sessions.get(e);
		return t ? {
			record: this.sessionViewOf(t),
			transcript: t.transcript.map((e) => ({ ...e }))
		} : null;
	}
	listStacks() {
		return [...this.stacks.values()].map((e) => ({
			stackRef: e.stackRef,
			name: e.stack.metadata.name,
			custom: e.custom,
			stack: JSON.parse(JSON.stringify(e.stack))
		}));
	}
	listPersonas() {
		return [];
	}
	listDefinitions() {
		return [];
	}
	listRosterAgents() {
		return [...this.rosterAgents.values()].map((e) => this.rosterAgentView(e));
	}
	rosterAgentView(e) {
		let t = this.stacks.get(e.stackRef), n = t ? this.adapterOfStackSpec(t.stack.spec) : "claude-code", r = t?.stack.spec.model || H[n][0];
		return {
			agentId: e.agentId,
			name: e.name,
			stackRef: e.stackRef,
			stackName: t?.stack.metadata.name ?? e.stackRef,
			adapter: n,
			model: r,
			role: e.role,
			status: e.assignedTaskId === null ? "available" : "assigned",
			assignedTaskId: e.assignedTaskId,
			assignedRole: e.assignedRole
		};
	}
	createRosterAgent(e) {
		let t = this.stacks.get(e.stackRef);
		if (!t) return null;
		this.rosterCounter += 1;
		let n = `ra-${String(this.rosterCounter).padStart(3, "0")}`, r = this.adapterOfStackSpec(t.stack.spec), i = e.name?.trim() || `${Bt[this.rosterCounter % Bt.length]}`;
		return this.rosterAgents.set(n, {
			agentId: n,
			name: i,
			stackRef: e.stackRef,
			role: e.role,
			assignedTaskId: null,
			assignedRole: null
		}), this.emitSimEvent(null, {
			type: "agent_recruited",
			runId: "run-none",
			agent: r,
			timestamp: this.now(),
			taskId: "",
			agentId: n,
			name: i,
			stackRef: e.stackRef
		}), n;
	}
	deleteRosterAgent(e) {
		let t = this.rosterAgents.get(e);
		if (!t) return !1;
		if (t.assignedTaskId !== null) {
			let n = this.cards.get(t.assignedTaskId);
			n && (n.workerAgentId === e && (n.workerAgentId = null), n.reviewerAgentId === e && (n.reviewerAgentId = null));
		}
		return this.rosterAgents.delete(e), this.emitSimEvent(null, {
			type: "agent_released",
			runId: "run-none",
			agent: "commander",
			timestamp: this.now(),
			taskId: "",
			agentId: e,
			name: t.name
		}), !0;
	}
	assignTaskAgent(e, t, n) {
		let r = this.cards.get(e);
		if (!r) return !1;
		let i = t === "worker" ? r.workerAgentId : r.reviewerAgentId;
		if (i !== null && i !== n) {
			let t = this.rosterAgents.get(i);
			t && t.assignedTaskId === e && (t.assignedTaskId = null, t.assignedRole = null);
		}
		if (n !== null) {
			let r = this.rosterAgents.get(n);
			if (!r) return !1;
			if (r.assignedTaskId !== null && r.assignedTaskId !== e) {
				let e = this.cards.get(r.assignedTaskId);
				e && (e.workerAgentId === n && (e.workerAgentId = null), e.reviewerAgentId === n && (e.reviewerAgentId = null));
			}
			r.assignedTaskId = e, r.assignedRole = t;
		}
		return t === "worker" ? r.workerAgentId = n : r.reviewerAgentId = n, this.emitSimEvent(r, {
			type: "task_agent_assigned",
			runId: r.run?.runId ?? "run-none",
			agent: "commander",
			timestamp: this.now(),
			taskId: e,
			role: t,
			agentId: n
		}), !0;
	}
	assignTaskHuman(e, t) {
		let n = this.cards.get(e);
		return n ? (n.humanAssigneeId = t ? "user" : null, this.emitSimEvent(n, {
			type: "task_human_assigned",
			runId: n.run?.runId ?? "run-none",
			agent: "commander",
			timestamp: this.now(),
			taskId: e,
			assigned: t
		}), !0) : !1;
	}
	listProcessTemplates() {
		return U.map((e) => {
			let t = this.templates.get(e);
			return {
				kind: e,
				processId: `commander/${e}@v${t.revision}`,
				revision: t.revision,
				phases: [...t.phases]
			};
		});
	}
	getWorkspaceTree(e) {
		let t = this.cards.get(e);
		if (!t) return null;
		let n = this.workspacePathsOf(t), r = {
			name: this.workspaceOf(e) || e,
			path: "",
			type: "dir",
			children: []
		};
		for (let e of n) {
			let t = r, n = e.split("/");
			n.forEach((e, r) => {
				let i = n.slice(0, r + 1).join("/"), a = r === n.length - 1;
				t.children = t.children ?? [];
				let o = t.children.find((e) => e.path === i);
				o || (o = a ? {
					name: e,
					path: i,
					type: "file"
				} : {
					name: e,
					path: i,
					type: "dir",
					children: []
				}, t.children.push(o)), t = o;
			});
		}
		return Gt(r), r;
	}
	getFileContent(e, t) {
		let n = this.cards.get(e);
		if (!n) return null;
		let r = n.fileOverrides.get(t);
		if (r !== void 0) return r;
		if (!(this.workspacePathsOf(n).includes(t) || n.ws.files.some((e) => e.path === t))) return null;
		let i = new N(P(`${this.seed}:content:${n.taskId}:${t}`)), a = this.titleOf(n), o = [], s = t.includes(".") ? t.slice(t.lastIndexOf(".") + 1) : "", c = i.int(20, 56), l = () => i.pick(Dt), u = () => i.pick(Ot), d = (e) => e.charAt(0).toUpperCase() + e.slice(1);
		if (s === "json") {
			o.push("{", `  "name": "${this.workspaceOf(n.taskId) || "workspace"}",`, `  "version": "0.${i.int(1, 9)}.${i.int(0, 9)}",`);
			for (let e = o.length; e < c - 1; e += 1) o.push(`  "${l()}-${e}": "${u()}-${i.int(100, 999)}",`);
			o.push("  \"private\": true", "}");
		} else if (s === "md") {
			o.push(`# ${t.split("/").pop() ?? t}`, "", `Notes for "${a}".`, "");
			for (let e = o.length; e < c; e += 1) {
				let e = i.int(0, 3);
				e === 0 ? o.push(`## ${d(u())} the ${l()}`) : e === 1 ? o.push(`- the ${l()} must ${u()} before the ${l()} engages`) : e === 2 ? o.push(`> the cogitator records: ${l()} ${i.int(100, 999)} holds within tolerance`) : o.push(`See \`src/core/${l()}.ts\` for how we ${u()} the ${l()}.`);
			}
		} else if (s === "css") for (o.push(`/* ${t} — plates for "${a}" */`, ""); o.length < c;) o.push(`.wr-${l()}-${i.int(1, 9)} {`, `  --${l()}-gauge: ${i.int(2, 24)}px;`, `  ${i.pick([
			"margin",
			"padding",
			"gap"
		])}: ${i.int(1, 12)}px;`, "}");
		else if (s === "sh") for (o.push("#!/usr/bin/env bash", `# ${t} — rites for "${a}"`, "set -euo pipefail", ""); o.length < c;) o.push(`echo "${u()} the ${l()}…"`, `./scripts/${u()}.sh --target ${l()} --retries ${i.int(1, 5)}`, `[ -f .${l()}.lock ] && rm .${l()}.lock`);
		else if (s === "sql") for (o.push(`-- ${t} — vault rites for "${a}"`, ""); o.length < c;) o.push(`CREATE TABLE IF NOT EXISTS ${l()}_${i.int(1, 9)} (`, "  id INTEGER PRIMARY KEY,", `  ${l()}_state TEXT NOT NULL DEFAULT '${u()}ed'`, ");");
		else if (s === "yaml" || s === "yml") for (o.push(`# ${t} — manifest for "${a}"`, `apiVersion: cogitator/v${i.int(1, 3)}`, `kind: ${d(l())}`); o.length < c;) o.push(`${l()}:`, `  ${u()}: true`, `  gauge: ${i.int(1, 99)}`, `  notes: "${u()} the ${l()} before dispatch"`);
		else for (o.push(`// ${t} — part of "${a}"`, `import { ${u()} } from '../util/${l()}s';`, "", `export interface ${d(l())}Spec {`, "  gauge: number;", `  ${u()}ed: boolean;`, "}", ""); o.length < c;) {
			let e = i.int(0, 3);
			e === 0 ? o.push(`export function ${u()}${d(l())}(spec: ${d(l())}Spec): number {`, `  return ${u()}(spec.gauge) * ${i.int(2, 9)};`, "}") : e === 1 ? o.push(`const ${l()}Gauge = ${u()}(${i.int(1, 12)});`) : e === 2 ? o.push(`// ${l()}: torque within tolerance (${i.int(1, 99)} Nm)`) : o.push(`registry.set('${l()}-${i.int(1, 60)}', ${l()}Gauge);`);
		}
		let f = n.ws.files.find((e) => e.path === t);
		if (f) {
			let e = f.diff.split("\n").filter((e) => e.startsWith("+")).map((e) => e.slice(1)), n = Math.min(o.length, 3 + P(`${this.seed}:hunk:${t}`) % 10);
			o.splice(n, 0, ...e);
		}
		return o.slice(0, 80).join("\n");
	}
	getMemoryIO(e) {
		let t = [], n = [];
		for (let r of this.cards.values()) {
			let i = r.taskId === e;
			for (let n of r.memoryReads) (i || n.unitId === e) && t.push({ ...n });
			for (let t of r.memoryWrites) (i || t.unitId === e) && n.push({
				...t,
				changes: t.changes.map((e) => ({ ...e }))
			});
		}
		return {
			read: t,
			written: n
		};
	}
	getGitLog(e) {
		let t = this.cards.get(e);
		if (!t) return [];
		let n = [{
			sha: this.deterministicSha(`${e}:git:base`),
			message: `chore: cut branch agent/${e} from main`,
			tick: 0
		}];
		if (t.run) for (let r of t.run.journal) {
			if (r.type !== "EFFECT_RESOLVED" || r.data.kind !== "node") continue;
			let i = String(r.data.label ?? "work");
			n.push({
				sha: this.deterministicSha(`${e}:git:${t.run.runId}:${r.seq}`),
				message: `feat(${t.taskKind}): complete ${i}`,
				tick: Math.max(0, Math.round((r.recordedAt - this.scenario.epochMs) / 250))
			});
		}
		return n.reverse();
	}
	listTasks() {
		return [...this.cards.values()].map((e) => JSON.parse(JSON.stringify(e.resource)));
	}
	listCardViews() {
		return [...this.cards.values()].map((e) => ({
			taskId: e.taskId,
			taskKind: e.taskKind,
			title: e.resource.metadata.labels?.["a5c.ai/title"] ?? e.taskId,
			repository: e.resource.spec.repository,
			workspaceId: e.resource.spec.workspaceRef ?? "",
			column: e.column,
			order: e.order,
			yolo: e.yolo,
			merged: e.merged,
			progress: Wt(this.progressOf(e), 4),
			parentId: e.parentId,
			childIds: [...e.childIds],
			agentIds: [...this.agents.values()].filter((t) => t.taskId === e.taskId).map((e) => e.unitId),
			attempt: e.attempt,
			feedback: e.feedback,
			dirtyFileCount: e.ws.dirty ? e.ws.files.length : 0,
			hasPendingInquiry: [...this.inquiries.values()].some((t) => t.taskId === e.taskId),
			stackRef: this.stackRefOf(e),
			description: e.description,
			releaseId: e.releaseId,
			compacted: e.column === "in-production" && e.inProductionAtTick !== null && this.tickCount - e.inProductionAtTick >= 30,
			workerAgentId: e.workerAgentId,
			reviewerAgentId: e.reviewerAgentId,
			humanAssigneeId: e.humanAssigneeId
		}));
	}
	listActiveAgentViews() {
		return [...this.agents.values()].map((e) => ({
			unitId: e.unitId,
			agent: e.agent,
			model: e.model,
			creatureName: e.session.creatureName,
			stackRef: e.stackRef,
			stackName: e.stackName,
			role: e.role,
			taskId: e.taskId,
			state: e.state,
			paused: e.held,
			runId: this.runIdOf(e),
			pendingHookId: e.pendingHookId,
			heldPieces: [...e.heldPieces],
			tokenUsage: { ...e.session.tokenUsage },
			cost: this.costOf(e),
			turnCount: e.session.turnCount,
			messageCount: e.session.messageCount,
			createdAt: e.createdAt,
			updatedAt: e.updatedAt
		}));
	}
	listInquiries() {
		return [...this.inquiries.values()].map((e) => ({
			hookRequestId: e.hookRequestId,
			runId: e.runId,
			taskId: e.taskId,
			unitId: e.unitId,
			inquiryKind: e.inquiryKind,
			question: e.question,
			options: e.options.map((e) => ({ ...e })),
			deadlineTs: e.deadlineTs
		}));
	}
	getWorkspaceView(e) {
		let t = this.cards.get(e);
		return t ? {
			taskId: e,
			phase: t.ws.phase,
			gitStatus: {
				branch: t.ws.branch,
				headSha: t.ws.headSha,
				ahead: t.ws.ahead,
				behind: t.ws.behind,
				dirty: t.ws.dirty,
				uncommittedCount: t.ws.dirty ? t.ws.files.length : 0
			},
			files: t.ws.files.map((e) => ({ ...e })),
			testEvidence: { ...t.ws.testEvidence },
			reviewerNotes: [...t.ws.reviewerNotes]
		} : null;
	}
	listWorkspaces() {
		let e = /* @__PURE__ */ new Map();
		for (let t of this.cards.values()) {
			let n = t.resource.spec.workspaceRef ?? "";
			if (n === "") continue;
			let r = e.get(n);
			r ? r.push(t) : e.set(n, [t]);
		}
		return this.scenario.workspaces.map((t) => {
			let n = (e.get(t.workspaceId) ?? []).sort((e, t) => e.taskId.localeCompare(t.taskId)), r = n[0], i = n.map((e) => e.taskId), a = new Set(i), o = [...this.sessions.values()].filter((e) => e.status === "active" && a.has(e.taskId)).sort((e, t) => e.order - t.order).map((e) => e.sessionId);
			return {
				workspaceId: t.workspaceId,
				name: t.name,
				repository: t.repository,
				phase: r === void 0 ? "ready" : r.ws.phase,
				gitStatus: r === void 0 ? null : {
					branch: r.ws.branch,
					headSha: r.ws.headSha,
					ahead: r.ws.ahead,
					behind: r.ws.behind,
					dirty: r.ws.dirty,
					uncommittedCount: r.ws.dirty ? r.ws.files.length : 0
				},
				dirty: n.some((e) => e.ws.dirty),
				cardIds: i,
				cards: n.map((e) => ({
					taskId: e.taskId,
					title: e.resource.metadata.labels?.["a5c.ai/title"] ?? e.taskId,
					branch: e.ws.branch,
					headSha: e.ws.headSha,
					dirty: e.ws.dirty,
					dirtyFileCount: e.ws.dirty ? e.ws.files.length : 0
				})),
				activeSessionIds: o
			};
		});
	}
	getRunObservation(e) {
		let t = this.cards.get(e);
		if (!t || !t.run) return null;
		let n = t.run, r = {};
		for (let e of n.openEffects) r[e.kind] = (r[e.kind] ?? 0) + 1;
		return {
			runId: n.runId,
			taskId: e,
			observedState: n.terminal === "completed" ? "completed" : n.terminal === "failed" ? "failed" : Ht(n.journal),
			pendingEffectsByKind: r,
			phases: n.phases.map((e, t) => ({
				label: e,
				status: t < n.phaseIndex ? "done" : t === n.phaseIndex ? "current" : "pending"
			})),
			journal: n.journal.map((e) => ({
				...e,
				data: { ...e.data }
			}))
		};
	}
	listMemorySilos() {
		return this.scenario.memory.silos.map((e) => ({
			name: e.repository.metadata.name,
			phase: e.repository.status.phase,
			currentCommit: e.repository.status.currentCommit ?? "",
			recordCount: e.recordIds.length,
			owner: e.source.spec.appliesTo.teams[0] ?? "",
			recordIds: [...e.recordIds]
		}));
	}
	listMemoryRecords() {
		return JSON.parse(JSON.stringify(this.scenario.memory.records));
	}
	listUnitViews() {
		return [...this.agents.values()].map((e) => ({
			unitId: e.unitId,
			agent: e.agent,
			model: e.model,
			title: `${e.role}:${e.taskId}`,
			workspaceId: this.workspaceOf(e.taskId),
			state: e.state === "awaiting_input" ? "awaiting_approval" : e.state,
			paused: e.held,
			taskId: e.taskId,
			runId: this.runIdOf(e),
			turnIndex: e.session.turnCount,
			turnCount: e.session.turnCount,
			messageCount: e.session.messageCount,
			pendingHookId: e.pendingHookId,
			tokenUsage: { ...e.session.tokenUsage },
			cost: this.costOf(e),
			createdAt: e.createdAt,
			updatedAt: e.updatedAt
		}));
	}
	listTaskViews() {
		return [...this.cards.values()].map((e) => ({
			taskId: e.taskId,
			taskKind: e.taskKind,
			repository: e.resource.spec.repository,
			workspaceId: e.resource.spec.workspaceRef ?? "",
			title: e.resource.metadata.labels?.["a5c.ai/title"] ?? e.taskId,
			state: this.compatTaskState(e),
			phase: xt(e.resource.status.phase),
			progress: Wt(this.progressOf(e), 4),
			assigneeIds: [...this.agents.values()].filter((t) => t.taskId === e.taskId).map((e) => e.unitId),
			priority: -e.order
		}));
	}
	listPendingHooks() {
		return [...this.inquiries.values()].map((e) => ({
			hookRequestId: e.hookRequestId,
			runId: e.runId,
			unitId: e.unitId,
			hookKind: "inquiry",
			payload: {
				question: e.question,
				options: e.options.map((e) => ({ ...e })),
				inquiryKind: e.inquiryKind,
				taskId: e.taskId,
				unitId: e.unitId
			},
			deadlineTs: e.deadlineTs
		}));
	}
	snapshot() {
		return {
			seed: this.seed,
			tick: this.tickCount,
			simTimeMs: this.now(),
			rngDraws: this.rng.draws,
			counters: {
				runs: this.runCounter,
				hooks: this.hookCounter,
				tools: this.toolCounter,
				agents: this.agentCounter,
				creations: this.creationCounter,
				stacks: this.stackCounter,
				releases: this.releaseCounter,
				memoryUpdates: this.memoryUpdateCounter
			},
			cards: this.listCardViews(),
			agents: this.listActiveAgentViews(),
			inquiries: this.listInquiries(),
			workspaces: [...this.cards.keys()].map((e) => this.getWorkspaceView(e)).filter((e) => e !== null),
			runs: this.listRunEntries(),
			stacks: this.listStacks(),
			processTemplates: this.listProcessTemplates(),
			runLedger: this.listRuns(),
			sessions: this.listSessions()
		};
	}
	handleSessionMessage(e) {
		let t = this.agents.get(e.sessionId);
		if (!t) {
			this.emit({
				type: "error",
				code: "session_not_found",
				message: `Unknown session: ${e.sessionId}`
			});
			return;
		}
		let n = e.prompt.trim(), r = this.cards.get(t.taskId);
		if (n === "/abort" || n === "/stop") {
			r && this.abortCard(this.topLevelOf(r));
			return;
		}
		t.session.messageCount += 1, this.pushTranscript(t.session, "user", n), t.held && this.resumeUnit(t.unitId), t.stateDuration = Math.max(t.stateDuration, t.stateTicks + this.rng.int(1, 3)), t.updatedAt = this.now(), this.emitAgentEvent(t, {
			type: "turn_start",
			runId: this.runIdOf(t),
			agent: t.agent,
			timestamp: this.now(),
			turnIndex: t.session.turnCount
		});
	}
	stepOnce() {
		this.tickCount += 1;
		for (let e of [...this.cards.values()]) this.advanceCard(e);
	}
	advanceCard(e) {
		for (let t of [...this.inquiries.values()]) t.taskId === e.taskId && this.now() >= t.deadlineTs && (this.answerInquiry(t.hookRequestId, null, "allow", "auto-default at deadline"), e.inquiriesThisAttempt = Math.max(0, e.inquiriesThisAttempt - 1));
		if (e.pendingFollowUps.length > 0 && e.run) {
			let t = e.pendingFollowUps.shift();
			this.emitSimEvent(e, {
				type: "inquiry_followup",
				runId: e.run.runId,
				agent: e.workerAdapter ?? "commander",
				timestamp: this.now(),
				taskId: e.taskId,
				optionId: t.optionId,
				text: t.text
			});
		}
		switch (e.column) {
			case "backlog": return;
			case "do":
				this.advanceWork(e);
				return;
			case "ai-review":
				e.parentId === null && this.advanceAiReview(e);
				return;
			case "human-review": return;
			case "approved":
				e.parentId === null && !e.merged && this.advanceIntegration(e);
				return;
			case "merged": return;
			case "in-production": return;
		}
	}
	advanceWork(e) {
		if (e.parentId === null && e.childIds.length > 0) {
			e.childIds.map((e) => this.cards.get(e)).filter(Boolean).every((e) => e.run !== null && e.run.phaseIndex >= e.run.phases.length) && this.completeWork(e);
			return;
		}
		let t = e.run;
		if (!t || t.phaseIndex >= t.phases.length) return;
		let n = [...this.agents.values()].find((t) => t.taskId === e.taskId && t.role === "worker");
		if (!n || n.held || n.state === "awaiting_input" || (this.streamAgentTick(n), --t.phaseTicksLeft, t.phaseTicksLeft > 0)) return;
		let r = t.phases[t.phaseIndex], i = t.openEffects.find((e) => e.kind !== "breakpoint");
		if (i && this.resolveEffect(t, i.effectId, "EFFECT_RESOLVED", { phase: r }), this.emitSimEvent(e, {
			type: "phase_completed",
			runId: t.runId,
			agent: n.agent,
			timestamp: this.now(),
			taskId: e.taskId,
			phase: r
		}), this.addWorkspaceChange(e, t.phaseIndex), t.phaseIndex += 1, e.progress = t.phaseIndex / t.phases.length, t.phaseIndex >= t.phases.length) {
			if (e.ws.testEvidence = {
				status: this.rng.chance(.85) ? "passed" : "unknown",
				summary: `vitest: suite green for ${e.taskId}`
			}, this.emitMemoryUpdate(e, n), e.parentId === null) this.completeWork(e);
			else {
				let t = this.cards.get(e.parentId), r = t !== void 0 && t.coordSessionId !== null ? this.sessions.get(t.coordSessionId) : void 0;
				r !== void 0 && this.pushTranscript(r, "event", `${e.taskId} completed by ${n.session.title} — folded into the stack.`), this.despawnAgent(n.unitId);
			}
			return;
		}
		this.requestPhaseEffect(e, t), this.emitSimEvent(e, {
			type: "phase_started",
			runId: t.runId,
			agent: n.agent,
			timestamp: this.now(),
			taskId: e.taskId,
			phase: t.phases[t.phaseIndex]
		}), this.rng.chance(.6) && this.emitMemoryQuery(e, n);
		let a = [...this.inquiries.values()].some((t) => t.taskId === e.taskId), o = t.phaseIndex >= t.phases.length - 1;
		!a && e.inquiriesThisAttempt < 1 && (this.rng.chance(.45) || o) && (e.inquiriesThisAttempt += 1, this.raiseInquiry(e, n));
	}
	completeWork(e) {
		this.transitionCard(e, "ai-review", "work-complete");
	}
	advanceAiReview(e) {
		let t = [...this.agents.values()].filter((t) => t.taskId === e.taskId && t.role === "reviewer");
		for (let e of t) e.held || this.streamAgentTick(e);
		if (--e.reviewTicksLeft, e.reviewTicksLeft === 4 && t[0]) {
			let n = e.ws.files[0]?.path ?? "src/index.ts", r = this.rng.int(0, Nt.length - 1), i = Pt(n, e.attempt, e.ws.reviewerNotes, r);
			e.ws.reviewerNotes.push(i), this.emitSimEvent(e, {
				type: "review_note",
				runId: e.run?.runId ?? "run-none",
				agent: t[0].agent,
				timestamp: this.now(),
				taskId: e.taskId,
				note: i
			});
		}
		if (e.reviewTicksLeft > 0) return;
		let n = e.attempt >= 2 || this.rng.chance(.6), r = t[0]?.agent ?? "codex";
		if (e.run) {
			let t = e.run.openEffects.find((e) => e.kind === "agent");
			t && this.resolveEffect(e.run, t.effectId, "EFFECT_RESOLVED", { verdict: n ? "pass" : "reject" });
		}
		for (let r of t) this.pushTranscript(r.session, "event", `Review verdict on ${e.taskId} (attempt ${e.attempt}): ${n ? "pass" : "reject"}.`);
		if (this.emitSimEvent(e, {
			type: "review_verdict",
			runId: e.run?.runId ?? "run-none",
			agent: r,
			timestamp: this.now(),
			taskId: e.taskId,
			verdict: n ? "pass" : "reject"
		}), n) t[0] !== void 0 && (e.approvingReviewSessionId = t[0].session.sessionId), e.yolo ? this.transitionCard(e, "approved", "review-pass-yolo") : this.transitionCard(e, "human-review", "review-pass");
		else {
			let t = this.rng.pick(Ft);
			e.feedback = t, this.emitSimEvent(e, {
				type: "review_feedback",
				runId: e.run?.runId ?? "run-none",
				agent: r,
				timestamp: this.now(),
				taskId: e.taskId,
				feedback: t
			}), this.transitionCard(e, "do", "review-rejected");
		}
	}
	advanceIntegration(e) {
		let t = [...this.agents.values()].find((t) => t.taskId === e.taskId && t.role === "integration");
		if (!t || t.held || (this.streamAgentTick(t), --e.integrationTicksLeft, e.integrationTicksLeft > 0)) return;
		let n = e.integrationSteps[e.integrationIndex];
		if (this.pushTranscript(t.session, "event", `Integration step: ${n}.`), this.emitSimEvent(e, {
			type: "integration_step",
			runId: e.run?.runId ?? "run-none",
			agent: t.agent,
			timestamp: this.now(),
			taskId: e.taskId,
			step: n
		}), e.integrationIndex += 1, e.integrationIndex < e.integrationSteps.length) {
			e.integrationTicksLeft = this.rng.int(6, 12);
			return;
		}
		e.merged = !0, e.progress = 1, e.ws.dirty = !1, e.ws.ahead = 0, e.ws.phase = "archived", e.resource.status.phase = "Ready";
		for (let t of e.childIds) {
			let e = this.cards.get(t);
			e && (e.merged = !0, e.ws.dirty = !1, e.resource.status.phase = "Ready", e.run && e.run.terminal === null && this.terminateRun(e, e.run, "RUN_COMPLETED"));
		}
		e.run && e.run.terminal === null && this.terminateRun(e, e.run, "RUN_COMPLETED"), this.emitSimEvent(e, {
			type: "card_merged",
			runId: e.run?.runId ?? "run-none",
			agent: t.agent,
			timestamp: this.now(),
			taskId: e.taskId
		}), this.despawnAgent(t.unitId), this.transitionCard(e, "merged", "integration-complete");
	}
	transitionCard(e, t, n, r) {
		let i = e.column;
		if (i === t) return;
		let a = n === "aborted" ? "aborted" : "completed";
		this.despawnAgentsOf(e, a), this.cancelInquiriesOf(e), i === "do" && e.coordSessionId !== null && (this.closeSession(e.coordSessionId, a), e.coordSessionId = null), e.column = t;
		for (let n of e.childIds) {
			let e = this.cards.get(n);
			e && (e.column = t, this.despawnAgentsOf(e, a), this.cancelInquiriesOf(e));
		}
		switch (this.emitSimMove(e, i, t, n, r), t) {
			case "do":
				this.enterDo(e);
				break;
			case "ai-review":
				this.enterAiReview(e);
				break;
			case "human-review":
				e.resource.status.phase = "Pending";
				break;
			case "approved":
				this.enterApproved(e);
				break;
			case "merged":
				e.resource.status.phase = "Ready", e.inProductionAtTick = null;
				break;
			case "in-production":
				e.inProductionAtTick = this.tickCount, e.resource.status.phase = "Ready";
				for (let t of e.childIds) {
					let e = this.cards.get(t);
					e && (e.inProductionAtTick = this.tickCount);
				}
				break;
			case "backlog": break;
		}
	}
	enterDo(e) {
		e.attempt += 1, e.inquiriesThisAttempt = 0;
		let t = e.childIds.length > 0 ? e.childIds.map((e) => this.cards.get(e)) : [e], n = e.childIds.length > 0 ? this.openCoordinationSession(e) : null;
		for (let r of t) {
			r.attempt = e.attempt, r.inquiriesThisAttempt = 0, this.ensureRun(r), this.initWorkspace(r);
			let t = (e.workerAgentId ? this.rosterAgents.get(e.workerAgentId) : null)?.stackRef ?? this.stackRefOf(r), i = this.stacks.get(t) ?? this.stacks.get(this.stackRefOf(r)), a = this.adapterOfStackSpec(i.stack.spec);
			r.workerAdapter = a;
			let o = this.spawnAgent(a, "worker", r.taskId, i, n === null ? void 0 : { parentSessionId: n.sessionId });
			n !== null && this.pushTranscript(n, "event", `Assigned ${r.taskId} (attempt ${e.attempt}) to ${o.session.title}.`);
			let s = r.run;
			s.phaseIndex >= s.phases.length && (s.phases.push(`rework ${e.attempt}`), r.progress = s.phaseIndex / s.phases.length), this.requestPhaseEffect(r, s);
		}
		e.workerAdapter = e.childIds.length > 0 ? this.cards.get(e.childIds[0])?.workerAdapter ?? null : e.workerAdapter;
	}
	enterAiReview(e) {
		let t = e.reviewerAgentId ? this.rosterAgents.get(e.reviewerAgentId) : null, n = e.workerAdapter ?? ct[e.taskKind], r = t ? 1 : this.rng.int(1, 2), i = st.filter((e) => e !== n), a = this.latestSession((t) => t.taskId === e.taskId && t.role === "worker");
		for (let n = 0; n < r; n += 1) {
			let n = t ? this.stacks.get(t.stackRef) : void 0, r = n ? this.adapterOfStackSpec(n.stack.spec) : this.rng.pick(i);
			this.spawnAgent(r, "reviewer", e.taskId, n, a === void 0 ? void 0 : { reviewOfSessionId: a.sessionId });
		}
		e.reviewTicksLeft = this.rng.int(16, 28), e.run && this.requestEffect(e.run, "agent", "ai-review");
	}
	enterApproved(e) {
		let t = this.rng.pick(st), n = (e.approvingReviewSessionId === null ? void 0 : this.sessions.get(e.approvingReviewSessionId)) ?? this.latestSession((t) => t.taskId === e.taskId && t.role === "worker");
		if (this.spawnAgent(t, "integration", e.taskId, void 0, n === void 0 ? void 0 : { parentSessionId: n.sessionId }), e.integrationSteps = this.rng.chance(.4) ? [
			"rebase onto main",
			"conflict-fix",
			"integration-test",
			"merge"
		] : [
			"rebase onto main",
			"integration-test",
			"merge"
		], e.integrationIndex = 0, e.integrationTicksLeft = this.rng.int(6, 12), e.run) {
			let t = e.run.openEffects.find((e) => e.kind === "agent");
			t && this.resolveEffect(e.run, t.effectId, "EFFECT_RESOLVED", { verdict: "approved" }), this.requestEffect(e.run, "node", "integration");
		}
	}
	abortCard(e) {
		if (!(e.column === "backlog" || e.merged)) {
			if (e.run) for (let t of [...e.run.openEffects]) this.resolveEffect(e.run, t.effectId, "EFFECT_CANCELLED", { reason: "aborted" });
			this.transitionCard(e, "backlog", "aborted");
		}
	}
	spawnAgent(e, t, n, r, i) {
		let a = r ?? this.stacks.get(dt.find((t) => t.stack.spec.adapter === e).stackRef);
		this.agentCounter += 1;
		let o = this.now(), s = `agt-${String(this.agentCounter).padStart(3, "0")}-${t}`, c = a.stack.spec.model || H[e][0], l = this.rng.int(2, 5), u = this.cards.get(n), d = this.createSession({
			sessionId: s,
			role: t,
			coordination: !1,
			taskId: n,
			agent: e,
			model: c,
			stackRef: a.stackRef,
			stackName: a.stack.metadata.name,
			attempt: u?.attempt ?? 0,
			runId: u?.run?.runId ?? null,
			parentSessionId: i?.parentSessionId ?? null,
			reviewOfSessionId: i?.reviewOfSessionId ?? null
		});
		d.tokenUsage.inputTokens = this.rng.int(400, 1600);
		let f = {
			unitId: s,
			agent: e,
			model: c,
			stackRef: a.stackRef,
			stackName: a.stack.metadata.name,
			role: t,
			taskId: n,
			state: "thinking",
			held: !1,
			stateTicks: 0,
			stateDuration: l,
			pendingHookId: null,
			activeToolName: null,
			heldPieces: [],
			accumulatedText: "",
			accumulatedThinking: "",
			session: d,
			createdAt: o,
			updatedAt: o
		};
		this.agents.set(f.unitId, f), this.emitAgentEvent(f, {
			type: "session_start",
			runId: this.runIdOf(f),
			agent: e,
			timestamp: o,
			sessionId: f.unitId,
			resumed: !1
		});
		let p = a.stack.spec.prompt.system.split(". ")[0]?.trim() ?? "", m = `[${a.stack.metadata.name}] ${p === "" ? "Stack engaged." : `${p}.`} Taking up ${t} duty on ${n}. `;
		return f.accumulatedText = m, this.appendStreamEntry(d, "message", m), this.emitAgentEvent(f, {
			type: "text_delta",
			runId: this.runIdOf(f),
			agent: e,
			timestamp: o,
			delta: m,
			accumulated: f.accumulatedText
		}), f;
	}
	despawnAgent(e, t = "completed") {
		let n = this.agents.get(e);
		if (!n) return;
		let r = this.runs.get(this.runIdOf(n));
		r && (r.tokens.inputTokens += n.session.tokenUsage.inputTokens, r.tokens.outputTokens += n.session.tokenUsage.outputTokens, r.tokens.thinkingTokens += n.session.tokenUsage.thinkingTokens, r.tokens.cachedTokens += n.session.tokenUsage.cachedTokens, r.costUsd = Wt(r.costUsd + this.costOf(n).totalUsd, 6)), this.emitAgentEvent(n, {
			type: "session_end",
			runId: this.runIdOf(n),
			agent: n.agent,
			timestamp: this.now(),
			sessionId: n.unitId,
			turnCount: n.session.turnCount,
			cost: this.costOf(n)
		}), this.closeSession(n.session.sessionId, t), this.agents.delete(e);
	}
	despawnAgentsOf(e, t = "completed") {
		for (let n of [...this.agents.values()]) n.taskId === e.taskId && this.despawnAgent(n.unitId, t);
	}
	mintCreatureName() {
		let e = P(`${this.seed}:creature:${this.sessionOrderCounter}`) % Bt.length;
		for (let t = 0; t < Bt.length; t += 1) {
			let n = Bt[(e + t) % Bt.length];
			if (!this.usedCreatureNames.has(n)) return this.usedCreatureNames.add(n), n;
		}
		return `${Bt[e]} ${Math.floor(this.sessionOrderCounter / Bt.length) + 1}`;
	}
	createSession(e) {
		this.sessionOrderCounter += 1;
		let t = this.mintCreatureName(), n = {
			sessionId: e.sessionId,
			order: this.sessionOrderCounter,
			title: `${t} ${e.coordination ? "the Coordinator" : Vt[e.role]}`,
			creatureName: t,
			agent: e.agent,
			model: e.model,
			stackRef: e.stackRef,
			stackName: e.stackName,
			role: e.role,
			coordination: e.coordination,
			taskId: e.taskId,
			attempt: e.attempt,
			runId: e.runId,
			parentSessionId: e.parentSessionId ?? null,
			reviewOfSessionId: e.reviewOfSessionId ?? null,
			status: "active",
			startedTick: this.tickCount,
			endedTick: null,
			turnCount: 0,
			messageCount: 1,
			tokenUsage: {
				inputTokens: 0,
				outputTokens: 0,
				thinkingTokens: 0,
				cachedTokens: 0
			},
			cost: {
				totalUsd: 0,
				inputTokens: 0,
				outputTokens: 0,
				thinkingTokens: 0
			},
			transcript: [],
			transcriptSeq: 0
		};
		return this.sessions.set(n.sessionId, n), n;
	}
	closeSession(e, t) {
		let n = this.sessions.get(e);
		!n || n.status !== "active" || (n.status = t, n.endedTick = this.tickCount, this.pushTranscript(n, "event", t === "aborted" ? "Session aborted — duty cut short." : "Session completed — duty discharged."));
	}
	pushTranscript(e, t, n, r) {
		e.transcriptSeq += 1, e.transcript.push({
			seq: e.transcriptSeq,
			tick: this.tickCount,
			timestamp: this.now(),
			kind: t,
			text: n,
			...r === void 0 ? {} : { toolName: r }
		}), e.transcript.length > 200 && e.transcript.splice(0, e.transcript.length - 200);
	}
	appendStreamEntry(e, t, n) {
		let r = e.transcript[e.transcript.length - 1];
		if (r && r.kind === t) {
			r.text += n;
			return;
		}
		this.pushTranscript(e, t, n);
	}
	latestSession(e) {
		let t;
		for (let n of this.sessions.values()) e(n) && (t === void 0 || n.order > t.order) && (t = n);
		return t;
	}
	openCoordinationSession(e) {
		let t = this.stackRefOf(e), n = this.stacks.get(t), r = this.adapterOfStackSpec(n.stack.spec);
		this.agentCounter += 1;
		let i = this.createSession({
			sessionId: `agt-${String(this.agentCounter).padStart(3, "0")}-coordinator`,
			role: "worker",
			coordination: !0,
			taskId: e.taskId,
			agent: r,
			model: n.stack.spec.model || H[r][0],
			stackRef: t,
			stackName: n.stack.metadata.name,
			attempt: e.attempt,
			runId: e.run?.runId ?? null
		});
		return e.coordSessionId = i.sessionId, this.pushTranscript(i, "event", `Coordination opened for attempt ${e.attempt}: marshalling ${e.childIds.length} child cards of ${e.taskId}.`), i;
	}
	sessionViewOf(e) {
		return this.accrueSessionCost(e), {
			sessionId: e.sessionId,
			title: e.title,
			creatureName: e.creatureName,
			agent: e.agent,
			model: e.model,
			stackRef: e.stackRef,
			stackName: e.stackName,
			role: e.role,
			coordination: e.coordination,
			taskId: e.taskId,
			attempt: e.attempt,
			runId: e.runId,
			parentSessionId: e.parentSessionId,
			reviewOfSessionId: e.reviewOfSessionId,
			status: e.status,
			startedTick: e.startedTick,
			endedTick: e.endedTick,
			turnCount: e.turnCount,
			messageCount: e.messageCount,
			tokenUsage: { ...e.tokenUsage },
			cost: { ...e.cost },
			transcriptLength: e.transcript.length
		};
	}
	cancelInquiriesOf(e) {
		for (let t of [...this.inquiries.values()]) t.taskId === e.taskId && (this.inquiries.delete(t.hookRequestId), this.emit({
			type: "hook.resolved",
			hookRequestId: t.hookRequestId,
			resolvedBy: "system:card-left-column",
			decision: "deny"
		}), e.run && this.resolveEffect(e.run, t.effectId, "EFFECT_CANCELLED", { reason: "card left column" }));
	}
	streamAgentTick(e) {
		if (e.state === "awaiting_input") return;
		e.stateTicks += 1;
		let t = this.now();
		if (e.state === "tool_running") {
			e.stateTicks >= e.stateDuration && (this.emitAgentEvent(e, {
				type: "tool_result",
				runId: this.runIdOf(e),
				agent: e.agent,
				timestamp: t,
				toolCallId: `tc-${this.seed}-${String(this.toolCounter).padStart(4, "0")}`,
				toolName: e.activeToolName ?? "Bash",
				output: {
					ok: !0,
					summary: `${e.activeToolName ?? "Bash"} finished cleanly`
				},
				durationMs: e.stateDuration * 250
			}), this.pushTranscript(e.session, "tool_result", `${e.activeToolName ?? "Bash"} finished cleanly`, e.activeToolName ?? "Bash"), e.session.tokenUsage.inputTokens += this.rng.int(60, 400), e.activeToolName = null, e.state = "thinking", e.stateTicks = 0, e.stateDuration = this.rng.int(2, 6)), this.accrueCost(e), e.updatedAt = t;
			return;
		}
		if (this.rng.chance(.5)) {
			let n = jt(kt, this.rng.int(0, kt.length - 1), this.tickCount + e.session.transcriptSeq);
			e.accumulatedThinking += n, this.appendStreamEntry(e.session, "thinking", n), e.session.tokenUsage.thinkingTokens += this.rng.int(6, 28), this.emitAgentEvent(e, {
				type: "thinking_delta",
				runId: this.runIdOf(e),
				agent: e.agent,
				timestamp: t,
				delta: n,
				accumulated: e.accumulatedThinking
			});
		} else {
			let n = jt(At, this.rng.int(0, At.length - 1), this.tickCount + e.session.transcriptSeq);
			e.accumulatedText += n, this.appendStreamEntry(e.session, "message", n), e.session.tokenUsage.outputTokens += this.rng.int(8, 40), this.emitAgentEvent(e, {
				type: "text_delta",
				runId: this.runIdOf(e),
				agent: e.agent,
				timestamp: t,
				delta: n,
				accumulated: e.accumulatedText
			});
		}
		if (e.stateTicks >= e.stateDuration) if (this.rng.chance(.5)) {
			this.toolCounter += 1;
			let n = this.rng.pick(Mt);
			e.activeToolName = n, e.state = "tool_running", e.stateTicks = 0, e.stateDuration = this.rng.int(2, 5), this.emitAgentEvent(e, {
				type: "tool_call_start",
				runId: this.runIdOf(e),
				agent: e.agent,
				timestamp: t,
				toolCallId: `tc-${this.seed}-${String(this.toolCounter).padStart(4, "0")}`,
				toolName: n,
				inputAccumulated: JSON.stringify({ description: `${n} sweep over the card` })
			}), this.pushTranscript(e.session, "tool_call", `${n} sweep over the card`, n);
		} else this.emitAgentEvent(e, {
			type: "turn_end",
			runId: this.runIdOf(e),
			agent: e.agent,
			timestamp: t,
			turnIndex: e.session.turnCount,
			cost: this.costOf(e)
		}), e.session.turnCount += 1, e.session.messageCount += 2, e.stateTicks = 0, e.stateDuration = this.rng.int(2, 6);
		e.stateTicks % 4 == 0 && this.emitAgentEvent(e, {
			type: "token_usage",
			runId: this.runIdOf(e),
			agent: e.agent,
			timestamp: t,
			inputTokens: e.session.tokenUsage.inputTokens,
			outputTokens: e.session.tokenUsage.outputTokens,
			thinkingTokens: e.session.tokenUsage.thinkingTokens
		}), this.accrueCost(e), e.updatedAt = t;
	}
	raiseInquiry(e, t) {
		this.hookCounter += 1;
		let n = Tt[(this.hookCounter - 1) % Tt.length], r = `hook-${this.seed}-${String(this.hookCounter).padStart(4, "0")}`, i = e.resource.metadata.labels?.["a5c.ai/title"] ?? e.taskId, a = e.run, o = this.requestEffect(a, "breakpoint", `inquiry:${n.inquiryKind}`), s = {
			hookRequestId: r,
			runId: a.runId,
			taskId: e.taskId,
			unitId: t.unitId,
			inquiryKind: n.inquiryKind,
			question: n.question(i),
			options: n.options.map((e) => ({ ...e })),
			deadlineTs: this.now() + Lt,
			effectId: o
		};
		this.inquiries.set(r, s), this.pushTranscript(t.session, "event", `Inquiry raised: ${s.question}`), t.state = "awaiting_input", t.pendingHookId = r, t.stateTicks = 0, t.updatedAt = this.now();
		let c = {
			question: s.question,
			options: s.options.map((e) => ({ ...e })),
			inquiryKind: s.inquiryKind,
			taskId: e.taskId,
			unitId: t.unitId
		}, l = {
			type: "hook.request",
			hookRequestId: r,
			runId: a.runId,
			hookKind: "inquiry",
			payload: c,
			deadlineTs: s.deadlineTs
		};
		this.emit(l);
	}
	siloFor(e) {
		let t = this.scenario.memory.silos, n = t[P(e.resource.spec.workspaceRef ?? e.taskId) % t.length];
		return {
			name: n.repository.metadata.name,
			recordIds: n.recordIds
		};
	}
	emitMemoryQuery(e, t) {
		let n = this.siloFor(e);
		if (n.recordIds.length === 0) return;
		let r = this.rng.int(1, 3), i = [];
		for (let e = 0; e < r; e += 1) {
			let e = n.recordIds[this.rng.int(0, n.recordIds.length - 1)];
			i.includes(e) || i.push(e), t.heldPieces.includes(e) || t.heldPieces.push(e);
		}
		for (let r of i) e.memoryReads.push({
			recordId: r,
			kind: this.scenario.memory.records.find((e) => e.id === r)?.nodeKind ?? "Term",
			silo: n.name,
			tick: this.tickCount,
			unitId: t.unitId
		});
		this.emitSimEvent(e, {
			type: "memory_query",
			runId: e.run?.runId ?? "run-none",
			agent: t.agent,
			timestamp: this.now(),
			taskId: e.taskId,
			unitId: t.unitId,
			silo: n.name,
			matchedIds: i,
			totalMatches: i.length,
			queryText: `${e.taskKind} practice for ${e.resource.spec.repository}`
		});
	}
	emitMemoryUpdate(e, t) {
		let n = this.siloFor(e), r = e.ws.files.slice(0, 2).map((t) => ({
			path: `notes/${e.taskId}.md`,
			action: "add",
			reason: `Lessons from ${t.path}`
		}));
		this.memoryUpdateCounter += 1;
		let i = `mu-${this.seed}-${String(this.memoryUpdateCounter).padStart(4, "0")}`, a = e.run === null ? "work" : e.run.phases[Math.min(e.run.phaseIndex, e.run.phases.length - 1)] ?? "work";
		e.memoryWrites.push({
			updateId: i,
			silo: n.name,
			changes: r.map((e) => ({ ...e })),
			phase: a,
			tick: this.tickCount,
			unitId: t.unitId
		}), this.emitSimEvent(e, {
			type: "memory_update",
			runId: e.run?.runId ?? "run-none",
			agent: t.agent,
			timestamp: this.now(),
			taskId: e.taskId,
			unitId: t.unitId,
			silo: n.name,
			updateId: i,
			updateKind: "proposed-pr",
			branchName: `memory/${e.taskId}`,
			phase: a,
			changes: r
		});
	}
	ensureRun(e) {
		if (e.run && e.run.terminal === null) return;
		this.runCounter += 1;
		let t = `run-${this.seed}-${String(this.runCounter).padStart(4, "0")}`, n = this.now(), r = this.templates.get(e.taskKind), i = {
			runId: t,
			entry: {
				runId: t,
				agent: ct[e.taskKind],
				model: H[ct[e.taskKind]][0],
				cwd: `/ws/${e.resource.spec.workspaceRef ?? ""}`,
				status: "running",
				createdAt: n,
				startedAt: n,
				endedAt: null,
				sessionId: e.taskId,
				owner: {
					tokenId: "mock-token",
					name: "commander",
					remoteAddress: null
				},
				workspaceId: e.resource.spec.workspaceRef ?? ""
			},
			seq: 0,
			journal: [],
			journalSeq: 0,
			phases: [...r.phases],
			phaseIndex: 0,
			phaseTicksLeft: 0,
			openEffects: [],
			effectCounter: 0,
			terminal: null,
			taskId: e.taskId,
			taskKind: e.taskKind,
			processId: `commander/${e.taskKind}@v${r.revision}`,
			processRevision: r.revision,
			tokens: {
				inputTokens: 0,
				outputTokens: 0,
				thinkingTokens: 0,
				cachedTokens: 0
			},
			costUsd: 0
		};
		this.runs.set(t, i), e.run = i, this.appendJournal(i, "RUN_CREATED", {
			processId: i.processId,
			processRevision: i.processRevision,
			taskId: e.taskId
		});
	}
	requestPhaseEffect(e, t) {
		t.phaseTicksLeft = this.rng.int(12, 24), this.requestEffect(t, "node", t.phases[t.phaseIndex] ?? "work");
	}
	requestEffect(e, t, n) {
		e.effectCounter += 1;
		let r = `S${String(e.effectCounter).padStart(6, "0")}`;
		return e.openEffects.push({
			effectId: r,
			kind: t,
			label: n
		}), this.appendJournal(e, "EFFECT_REQUESTED", {
			effectId: r,
			kind: t,
			label: n
		}), r;
	}
	resolveEffect(e, t, n, r) {
		let i = e.openEffects.findIndex((e) => e.effectId === t);
		if (i === -1) return;
		let [a] = e.openEffects.splice(i, 1);
		this.appendJournal(e, n, {
			effectId: t,
			kind: a.kind,
			label: a.label,
			...r
		});
	}
	terminateRun(e, t, n) {
		for (let e of [...t.openEffects]) this.resolveEffect(t, e.effectId, "EFFECT_RESOLVED", { reason: "terminal" });
		this.appendJournal(t, n, { taskId: e.taskId }), t.terminal = n === "RUN_COMPLETED" ? "completed" : "failed", t.entry.status = n === "RUN_COMPLETED" ? "completed" : "failed", t.entry.endedAt = this.now(), t.entry.exitReason = n === "RUN_COMPLETED" ? "completed" : "crashed";
	}
	appendJournal(e, t, n) {
		e.journalSeq += 1, this.ulidCounter += 1;
		let r = {
			seq: e.journalSeq,
			ulid: this.deterministicUlid(),
			type: t,
			recordedAt: this.now(),
			data: n
		};
		e.journal.push(r), e.journal.length > zt && e.journal.splice(0, e.journal.length - zt);
	}
	initWorkspace(e) {
		if (e.ws.phase === "ready" && e.ws.files.length > 0) {
			e.ws.dirty = !0;
			return;
		}
		e.ws = {
			phase: "ready",
			branch: `agent/${e.taskId}`,
			headSha: this.deterministicSha(`${e.taskId}:head:${e.attempt}`),
			ahead: 0,
			behind: this.rng.int(0, 2),
			dirty: !1,
			files: [],
			testEvidence: { status: "unknown" },
			reviewerNotes: []
		};
	}
	addWorkspaceChange(e, t) {
		let n = Et[e.taskKind], r = n[(t + e.attempt - 1) % n.length], i = e.resource.metadata.labels?.["a5c.ai/title"] ?? e.taskId, a = e.ws.files.find((e) => e.path === r), o = a || t === 0 ? "M" : this.rng.chance(.2) ? "D" : "A", s = this.rng.int(2, 9), c = o === "D" ? 0 : this.rng.int(1, s), l = o === "A" ? this.rng.int(0, 1) : this.rng.int(1, s), u = [`@@ -${this.rng.int(1, 40)},${l + 2} +${this.rng.int(1, 40)},${c + 2} @@`];
		u.push(` // context: ${i}`);
		for (let e = 0; e < l; e += 1) u.push(`-  const legacy${e} = previousMechanism('${i}');`);
		for (let e = 0; e < c; e += 1) u.push(`+  const forged${e} = rebuildMechanism('${i}', ${e});`);
		u.push(` // end: ${r}`);
		let d = u.slice(0, 25).join("\n");
		a ? (a.status = "M", a.additions += c, a.deletions += l, a.diff = d) : e.ws.files.push({
			path: r,
			status: o,
			additions: Math.max(c, 1),
			deletions: Math.max(l, o === "A" ? 0 : 1),
			diff: d
		}), e.ws.dirty = !0, e.ws.ahead += 1, this.emitSimEvent(e, {
			type: "workspace_change",
			runId: e.run?.runId ?? "run-none",
			agent: e.workerAdapter ?? "commander",
			timestamp: this.now(),
			taskId: e.taskId,
			path: r,
			status: o
		});
	}
	addCard(e, t, n) {
		this.orderCounter += 1;
		let r = {
			taskId: e.metadata.name,
			resource: e,
			taskKind: t,
			parentId: n,
			childIds: [],
			column: "backlog",
			order: this.orderCounter,
			yolo: !1,
			merged: !1,
			progress: 0,
			attempt: 0,
			feedback: null,
			run: null,
			ws: {
				phase: "created",
				branch: "",
				headSha: "",
				ahead: 0,
				behind: 0,
				dirty: !1,
				files: [],
				testEvidence: { status: "unknown" },
				reviewerNotes: []
			},
			reviewTicksLeft: 0,
			integrationSteps: [],
			integrationIndex: 0,
			integrationTicksLeft: 0,
			pendingFollowUps: [],
			inquiriesThisAttempt: 0,
			workerAdapter: null,
			coordSessionId: null,
			approvingReviewSessionId: null,
			stackRefOverride: null,
			description: "",
			releaseId: null,
			inProductionAtTick: null,
			fileOverrides: /* @__PURE__ */ new Map(),
			memoryReads: [],
			memoryWrites: [],
			workerAgentId: null,
			reviewerAgentId: null,
			humanAssigneeId: null
		};
		if (this.cards.set(r.taskId, r), n !== null) {
			let e = this.cards.get(n);
			e && !e.childIds.includes(r.taskId) && e.childIds.push(r.taskId);
		}
		return r;
	}
	topLevelOf(e) {
		return e.parentId === null ? e : this.cards.get(e.parentId) ?? e;
	}
	titleOf(e) {
		return e.resource.metadata.labels?.["a5c.ai/title"] ?? e.taskId;
	}
	stackRefOf(e) {
		return e.stackRefOverride !== null && this.stacks.has(e.stackRefOverride) ? e.stackRefOverride : ft[e.taskKind];
	}
	adapterOfStackSpec(e) {
		let t = [
			e.adapter,
			e.adapter.replace(/^adapters\./, ""),
			e.baseAgent
		];
		for (let e of t) if (st.includes(e)) return e;
		return "claude-code";
	}
	unseal(e) {
		e.merged = !1, e.progress = 0, e.resource.status.phase = "Pending", e.inProductionAtTick = null;
		for (let t of e.childIds) {
			let e = this.cards.get(t);
			e && (e.merged = !1, e.progress = 0, e.resource.status.phase = "Pending", e.inProductionAtTick = null);
		}
	}
	shipCard(e, t, n) {
		e.releaseId = t;
		for (let n of e.childIds) {
			let e = this.cards.get(n);
			e && (e.releaseId = t);
		}
		this.emitSimEvent(e, {
			type: "release_shipped",
			runId: e.run?.runId ?? "run-none",
			agent: "commander",
			timestamp: this.now(),
			taskId: e.taskId,
			releaseId: t,
			stagger: n
		}), this.transitionCard(e, "in-production", "release-shipped", n);
	}
	runViewOf(e) {
		let t = {};
		for (let n of e.openEffects) t[n.kind] = (t[n.kind] ?? 0) + 1;
		let n = { ...e.tokens }, r = e.costUsd;
		for (let t of this.agents.values()) this.runIdOf(t) === e.runId && (n.inputTokens += t.session.tokenUsage.inputTokens, n.outputTokens += t.session.tokenUsage.outputTokens, n.thinkingTokens += t.session.tokenUsage.thinkingTokens, n.cachedTokens += t.session.tokenUsage.cachedTokens, r += this.costOf(t).totalUsd);
		return {
			runId: e.runId,
			taskId: e.taskId,
			taskKind: e.taskKind,
			processId: e.processId,
			processRevision: e.processRevision,
			observedState: e.terminal === "completed" ? "completed" : e.terminal === "failed" ? "failed" : Ht(e.journal),
			pendingEffectsByKind: t,
			phases: e.phases.map((t, n) => ({
				label: t,
				status: n < e.phaseIndex ? "done" : n === e.phaseIndex ? "current" : "pending"
			})),
			tokens: n,
			costUsd: Wt(r, 6),
			startedAt: e.entry.startedAt ?? e.entry.createdAt,
			endedAt: e.entry.endedAt
		};
	}
	workspacePathsOf(e) {
		let t = new N(P(`${this.seed}:tree:${e.taskId}`)), n = new Set([
			"package.json",
			"README.md",
			"tsconfig.json",
			"src/index.ts",
			"src/core/registry.ts",
			"tests/core.test.ts",
			"docs/overview.md"
		]);
		for (let t of Et[e.taskKind]) n.add(t);
		let r = [
			"src/core/mechanism.ts",
			"src/engine/valves.ts",
			"src/util/gauges.ts",
			"tests/engine.test.ts",
			"docs/decisions.md",
			"scripts/build.sh",
			".gitignore",
			"vitest.config.ts"
		], i = t.int(2, Math.min(5, 20 - n.size));
		for (let e = 0; e < i; e += 1) n.add(r[t.int(0, r.length - 1)]);
		for (let t of e.ws.files) n.add(t.path);
		for (let t of e.fileOverrides.keys()) n.add(t);
		return [...n].sort();
	}
	progressOf(e) {
		if (e.merged) return 1;
		if (e.childIds.length > 0) {
			let t = e.childIds.map((e) => this.cards.get(e)).filter((e) => e !== void 0);
			return t.length === 0 ? e.progress : t.reduce((e, t) => e + this.progressOf(t), 0) / t.length;
		}
		return e.progress;
	}
	compatTaskState(e) {
		if (e.merged) return "done";
		switch (e.column) {
			case "backlog": return "queued";
			case "do": return e.progress > 0 ? "in_progress" : "assigned";
			case "ai-review":
			case "human-review":
			case "approved": return "review";
			case "merged":
			case "in-production": return "done";
		}
	}
	workspaceOf(e) {
		return this.cards.get(e)?.resource.spec.workspaceRef ?? "";
	}
	runIdOf(e) {
		return this.cards.get(e.taskId)?.run?.runId ?? "run-none";
	}
	accrueSessionCost(e) {
		let t = It[e.agent] ?? {
			input: 2e-6,
			output: 8e-6
		}, n = e.tokenUsage;
		e.cost = {
			totalUsd: Wt(n.inputTokens * t.input + (n.outputTokens + n.thinkingTokens) * t.output, 6),
			inputTokens: n.inputTokens,
			outputTokens: n.outputTokens,
			thinkingTokens: n.thinkingTokens
		};
	}
	accrueCost(e) {
		this.accrueSessionCost(e.session);
	}
	costOf(e) {
		return this.accrueCost(e), { ...e.session.cost };
	}
	deterministicSha(e) {
		let t = P(`${this.seed}:${e}`), n = "";
		for (let e = 0; e < 12; e += 1) n += "0123456789abcdef"[t & 15], t = (Math.imul(t, 16777619) ^ t >>> 7) >>> 0;
		return n;
	}
	deterministicUlid() {
		let e = this.now().toString(32).toUpperCase().padStart(10, "0"), t = P(`${this.seed}:ulid:${this.ulidCounter}`).toString(32).toUpperCase().padStart(8, "0");
		return `${e}${String(this.ulidCounter % 1024).padStart(4, "0")}${t}`.slice(0, 26);
	}
	emit(e) {
		for (let t of [...this.listeners]) t(e);
	}
	emitSimMove(e, t, n, r, i) {
		let a = {
			type: "card_moved",
			runId: e.run?.runId ?? "run-none",
			agent: e.workerAdapter ?? "commander",
			timestamp: this.now(),
			taskId: e.taskId,
			from: t,
			to: n,
			reason: r,
			...i === void 0 ? {} : { stagger: i }
		};
		this.emitEnveloped(a.runId, a.agent, { ...a });
	}
	emitSimEvent(e, t) {
		this.emitEnveloped(t.runId, t.agent, { ...t });
	}
	emitAgentEvent(e, t) {
		this.emitEnveloped(t.runId === "" ? this.runIdOf(e) : t.runId, e.agent, {
			...t,
			sessionId: e.unitId
		});
	}
	emitEnveloped(e, t, n) {
		let r = this.runs.get(e), i = r ? r.seq += 1 : 0;
		this.emit({
			type: "run.event",
			runId: e,
			seq: i,
			source: t,
			event: { ...n }
		});
	}
};
function Wt(e, t) {
	let n = 10 ** t;
	return Math.round(e * n) / n;
}
function Gt(e) {
	if (e.children) {
		e.children.sort((e, t) => e.type === t.type ? e.name < t.name ? -1 : +(e.name > t.name) : e.type === "dir" ? -1 : 1);
		for (let t of e.children) Gt(t);
	}
}
//#endregion
//#region src/game/board.ts
var Kt = {
	backlog: "Backlog",
	do: "Do",
	"ai-review": "AI Review",
	"human-review": "Human Review",
	approved: "Approved",
	merged: "Merged",
	"in-production": "In Production"
};
function qt(e, t) {
	return e === "backlog" ? t === "do" || t === "backlog" : e === "human-review" ? t === "do" || t === "ai-review" || t === "approved" : !1;
}
function Jt(e) {
	return e.parentId !== null || e.merged ? !1 : e.column === "backlog" || e.column === "human-review";
}
function Yt(e, t) {
	return t === null || !Jt(e) || !qt(e.column, t) ? null : {
		taskId: e.taskId,
		column: t
	};
}
function Xt(e, t) {
	let n = e.filter((e) => e.parentId === null && e.column === t);
	return n.sort((e, n) => t === "approved" && e.merged !== n.merged ? e.merged ? 1 : -1 : t === "backlog" && e.order !== n.order ? e.order - n.order : e.taskId < n.taskId ? -1 : +(e.taskId > n.taskId)), n;
}
function Zt(e, t) {
	let n = new Map(e.map((e) => [e.taskId, e]));
	return t.childIds.map((e) => n.get(e)).filter((e) => e !== void 0);
}
function Qt(e) {
	for (let t of e) {
		if (t.closest("[data-drag-ghost]") !== null) continue;
		let e = t.closest("[data-testid^=\"kanban-col-\"]")?.getAttribute("data-testid")?.slice(11) ?? "";
		return Ct.includes(e) ? e : null;
	}
	return null;
}
function $t(e) {
	return e.replace(/\s+data-testid="[^"]*"/g, "");
}
//#endregion
//#region src/components/board/KanbanBoard.tsx
var en = 4, tn = 600, nn = 140, rn = 220, an = 450, on = 250;
function sn() {
	return typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function cn(e) {
	let t = e.getBoundingClientRect(), n = getComputedStyle(e).transform;
	if (n === "none" || n === "") return t;
	let r = new DOMMatrixReadOnly(n);
	return r.e === 0 && r.f === 0 ? t : new DOMRect(t.x - r.e, t.y - r.f, t.width, t.height);
}
function ln(e, t) {
	return Qt(document.elementsFromPoint(e, t));
}
var un = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><path d=\"M4.2 13 L3.4 5.6 L7.2 8.6 L10 4 L12.8 8.6 L16.6 5.6 L15.8 13 Z\" fill=\"currentColor\"/><path d=\"M4.6 15.4 H15.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\"/></svg>", dn = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 16.5 H16 M10 16.5 V10.5 M10 10.5 L14.2 5.2\"/><circle cx=\"15.2\" cy=\"4\" r=\"1.7\"/></g></svg>";
function fn({ progress: e }) {
	let t = 2 * Math.PI * 8, n = Math.max(0, Math.min(1, e));
	return /* @__PURE__ */ l("span", {
		className: "wr-card-ring",
		title: `progress ${y(n)}`,
		"aria-label": `progress ${y(n)}`,
		children: /* @__PURE__ */ u("svg", {
			viewBox: "0 0 22 22",
			width: "100%",
			height: "100%",
			"aria-hidden": "true",
			children: [/* @__PURE__ */ l("circle", {
				className: "wr-ring-track",
				cx: "11",
				cy: "11",
				r: 8,
				fill: "none",
				stroke: "currentColor",
				strokeOpacity: "0.3",
				strokeWidth: "3.2"
			}), /* @__PURE__ */ l("circle", {
				className: "wr-ring-arc",
				cx: "11",
				cy: "11",
				r: 8,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "3.2",
				strokeLinecap: "round",
				strokeDasharray: `${t * n} ${t}`,
				transform: "rotate(-90 11 11)"
			})]
		})
	});
}
function pn({ agentIds: e, agents: t, store: r }) {
	let i = a(/* @__PURE__ */ new Map()), [s, c] = o([]);
	n(() => {
		let n = i.current, r = /* @__PURE__ */ new Map();
		for (let i of e) {
			let e = t[i]?.agent ?? n.get(i) ?? "claude-code";
			r.set(i, e);
		}
		let a = [];
		for (let [e, t] of n) r.has(e) || a.push({
			unitId: e,
			adapter: t
		});
		if (i.current = r, a.length > 0 && !sn()) {
			c((e) => [...e, ...a]);
			let e = window.setTimeout(() => {
				c((e) => e.filter((e) => !a.some((t) => t.unitId === e.unitId)));
			}, an);
			return () => window.clearTimeout(e);
		}
	}, [e, t]);
	let d = e.slice(0, 3), f = e.length - d.length;
	return /* @__PURE__ */ u("span", {
		className: "wr-card-agents",
		children: [
			d.map((e) => {
				let n = t[e], i = n?.agent ?? "claude-code", a = R({
					entityId: e,
					kind: "unit",
					adapter: i
				});
				return /* @__PURE__ */ l("button", {
					type: "button",
					"data-testid": `card-agent-${e}`,
					"data-adapter": i,
					"data-role": n?.role ?? "worker",
					className: V("wr-card-agent", `wr-card-agent--${i}`, "is-spawning"),
					title: n === void 0 ? `agent · ${i} — click to select, double-click to inspect` : `${n.creatureName} — session of ${n.stackName}`,
					onPointerDown: (e) => e.stopPropagation(),
					onClick: (t) => {
						t.stopPropagation(), r.getState().clickSelect(e, t.shiftKey);
					},
					onDoubleClick: (t) => {
						t.stopPropagation(), r.getState().openInspector(e);
					},
					children: /* @__PURE__ */ l("span", {
						className: "wr-card-agent-portrait",
						dangerouslySetInnerHTML: { __html: a.svg }
					})
				}, e);
			}),
			f > 0 && /* @__PURE__ */ u("span", {
				className: "wr-card-agent-overflow",
				children: ["+", f]
			}),
			s.map((e) => /* @__PURE__ */ l("span", {
				className: "wr-card-agent wr-card-agent--ghost",
				"aria-hidden": !0,
				children: /* @__PURE__ */ l("span", {
					className: "wr-card-agent-portrait",
					dangerouslySetInnerHTML: { __html: R({
						entityId: e.unitId,
						kind: "unit",
						adapter: e.adapter
					}).svg }
				})
			}, `ghost-${e.unitId}`))
		]
	});
}
function mn({ card: e, rosterAgents: t, orders: n }) {
	let [r, i] = o(null), a = t.filter((e) => e.role === "worker"), s = t.filter((e) => e.role === "reviewer"), c = e.workerAgentId ? t.find((t) => t.agentId === e.workerAgentId)?.name ?? e.workerAgentId : null, d = e.reviewerAgentId ? t.find((t) => t.agentId === e.reviewerAgentId)?.name ?? e.reviewerAgentId : null, f = e.humanAssigneeId !== null, p = (e) => {
		e.key === "Escape" && i(null);
	};
	return /* @__PURE__ */ u("div", {
		className: "wr-assign-chips",
		onPointerDown: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ u("div", {
				className: "wr-assign-slot",
				children: [/* @__PURE__ */ l("button", {
					type: "button",
					className: V("wr-assign-chip", "wr-assign-chip--worker", c !== null && "is-set"),
					title: c === null ? "Assign worker agent" : `Worker: ${c}`,
					onClick: (e) => {
						e.stopPropagation(), i(r === "worker" ? null : "worker");
					},
					onKeyDown: p,
					children: /* @__PURE__ */ l("span", {
						className: "wr-assign-chip-label",
						children: c ?? "wrkr"
					})
				}), r === "worker" && /* @__PURE__ */ u("div", {
					className: "wr-assign-popover",
					children: [
						/* @__PURE__ */ l("button", {
							type: "button",
							className: "wr-assign-pop-opt wr-assign-pop-opt--clear",
							onClick: (t) => {
								t.stopPropagation(), n.assignTaskAgent(e.taskId, "worker", null), i(null);
							},
							children: "— unassign —"
						}),
						a.map((t) => /* @__PURE__ */ u("button", {
							type: "button",
							className: V("wr-assign-pop-opt", e.workerAgentId === t.agentId && "is-selected", t.status === "assigned" && t.agentId !== e.workerAgentId && "is-busy"),
							onClick: (r) => {
								r.stopPropagation(), n.assignTaskAgent(e.taskId, "worker", t.agentId), i(null);
							},
							children: [/* @__PURE__ */ l("span", {
								className: `wr-assign-pop-adapter wr-faction-text--${t.adapter}`,
								children: t.adapter
							}), t.name]
						}, t.agentId)),
						a.length === 0 && /* @__PURE__ */ l("span", {
							className: "wr-assign-pop-empty",
							children: "No workers — recruit in Foundry"
						})
					]
				})]
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-assign-slot",
				children: [/* @__PURE__ */ l("button", {
					type: "button",
					className: V("wr-assign-chip", "wr-assign-chip--reviewer", d !== null && "is-set"),
					title: d === null ? "Assign reviewer agent" : `Reviewer: ${d}`,
					onClick: (e) => {
						e.stopPropagation(), i(r === "reviewer" ? null : "reviewer");
					},
					onKeyDown: p,
					children: /* @__PURE__ */ l("span", {
						className: "wr-assign-chip-label",
						children: d ?? "revr"
					})
				}), r === "reviewer" && /* @__PURE__ */ u("div", {
					className: "wr-assign-popover",
					children: [
						/* @__PURE__ */ l("button", {
							type: "button",
							className: "wr-assign-pop-opt wr-assign-pop-opt--clear",
							onClick: (t) => {
								t.stopPropagation(), n.assignTaskAgent(e.taskId, "reviewer", null), i(null);
							},
							children: "— unassign —"
						}),
						s.map((t) => /* @__PURE__ */ u("button", {
							type: "button",
							className: V("wr-assign-pop-opt", e.reviewerAgentId === t.agentId && "is-selected", t.status === "assigned" && t.agentId !== e.reviewerAgentId && "is-busy"),
							onClick: (r) => {
								r.stopPropagation(), n.assignTaskAgent(e.taskId, "reviewer", t.agentId), i(null);
							},
							children: [/* @__PURE__ */ l("span", {
								className: `wr-assign-pop-adapter wr-faction-text--${t.adapter}`,
								children: t.adapter
							}), t.name]
						}, t.agentId)),
						s.length === 0 && /* @__PURE__ */ l("span", {
							className: "wr-assign-pop-empty",
							children: "No reviewers — recruit in Foundry"
						})
					]
				})]
			}),
			/* @__PURE__ */ l("div", {
				className: "wr-assign-slot",
				children: /* @__PURE__ */ l("button", {
					type: "button",
					className: V("wr-assign-chip", "wr-assign-chip--human", f && "is-set"),
					title: f ? "Human review assigned" : "Assign for human review",
					onClick: (t) => {
						t.stopPropagation(), n.assignTaskHuman(e.taskId, !f);
					},
					children: /* @__PURE__ */ l("span", {
						className: "wr-assign-chip-label",
						children: f ? "you" : "hmn"
					})
				})
			})
		]
	});
}
function hn({ card: e, orders: t, mini: n }) {
	let r = R({
		entityId: e.taskId,
		kind: "task",
		taskKind: e.taskKind
	});
	return /* @__PURE__ */ u("div", {
		className: V("wr-card-body", n && "wr-card-body--mini"),
		children: [
			/* @__PURE__ */ l("span", {
				className: "wr-card-seal",
				"aria-hidden": !0,
				dangerouslySetInnerHTML: { __html: r.svg }
			}),
			/* @__PURE__ */ u("span", {
				className: "wr-card-main",
				children: [/* @__PURE__ */ l("span", {
					className: "wr-card-title",
					children: e.title
				}), /* @__PURE__ */ u("span", {
					className: "wr-card-chips",
					children: [
						/* @__PURE__ */ l("span", {
							className: "wr-card-kind",
							children: e.taskKind
						}),
						e.dirtyFileCount > 0 && /* @__PURE__ */ u("span", {
							className: "wr-card-dirty",
							title: `${e.dirtyFileCount} uncommitted file(s)`,
							children: [e.dirtyFileCount, "Δ"]
						}),
						e.feedback !== null && !n && /* @__PURE__ */ l("span", {
							className: "wr-card-feedback",
							title: e.feedback,
							children: "feedback"
						}),
						e.hasPendingInquiry && /* @__PURE__ */ l("span", {
							className: "wr-card-inquiry",
							title: "inquiry pending",
							children: "?"
						})
					]
				})]
			}),
			/* @__PURE__ */ l(fn, { progress: e.progress }),
			/* @__PURE__ */ l("button", {
				type: "button",
				"data-testid": `card-yolo-${e.taskId}`,
				className: V("wr-card-yolo", e.yolo && "is-on"),
				"aria-pressed": e.yolo,
				title: e.yolo ? "Yolo ON — review passes auto-approve" : "Yolo OFF — review passes go to human review",
				disabled: e.merged,
				onPointerDown: (e) => e.stopPropagation(),
				onClick: (n) => {
					n.stopPropagation(), t.setYolo(e.taskId, !e.yolo);
				},
				children: "yolo"
			})
		]
	});
}
function gn({ card: e, allCards: t, agents: r, rosterAgents: i, store: c, orders: d, selected: f, onHoverLane: p }) {
	let m = a(null), h = a(null), g = a(!1), _ = a(null);
	n(() => () => {
		_.current !== null && window.clearTimeout(_.current);
	}, []);
	let v = a(null), [y, b] = o(null), [x, S] = o(!1), C = Jt(e), w = Zt(t, e), T = w.length > 0, E = (t) => {
		let n = Yt(e, t);
		if (p(null, null), h.current = null, v.current = null, m.current?.style.removeProperty("pointer-events"), n !== null) {
			b(null), d.moveCard(n.taskId, n.column);
			return;
		}
		if (sn()) {
			b(null);
			return;
		}
		S(!0), b(null), window.setTimeout(() => S(!1), rn);
	}, D = (t) => {
		if (!C || t.button !== 0 || t.target instanceof HTMLElement && t.target.closest("button")) return;
		h.current = {
			pointerId: t.pointerId,
			startX: t.clientX,
			startY: t.clientY,
			dx: 0,
			dy: 0,
			dragging: !1
		};
		let n = (t) => {
			let n = h.current;
			if (n === null || t.pointerId !== n.pointerId) return;
			if (n.dx = t.clientX - n.startX, n.dy = t.clientY - n.startY, !n.dragging) {
				if (Math.abs(n.dx) < en && Math.abs(n.dy) < en) return;
				n.dragging = !0, g.current = !0;
				let e = m.current;
				if (e !== null) {
					let t = e.getBoundingClientRect();
					v.current = {
						html: $t(e.outerHTML),
						left: t.left,
						top: t.top,
						width: t.width
					}, e.style.setProperty("pointer-events", "none");
				}
			}
			b({
				dx: n.dx,
				dy: n.dy
			});
			let r = ln(t.clientX, t.clientY);
			p(e.column, r);
		}, r = (e) => {
			let t = h.current;
			if (window.removeEventListener("pointermove", n), window.removeEventListener("pointerup", r), window.removeEventListener("pointercancel", i), !(t === null || e.pointerId !== t.pointerId)) {
				if (!t.dragging) {
					h.current = null;
					return;
				}
				E(ln(e.clientX, e.clientY)), window.setTimeout(() => {
					g.current = !1;
				}, 0);
			}
		}, i = () => {
			window.removeEventListener("pointermove", n), window.removeEventListener("pointerup", r), window.removeEventListener("pointercancel", i), E(null), g.current = !1;
		};
		window.addEventListener("pointermove", n), window.addEventListener("pointerup", r), window.addEventListener("pointercancel", i);
	}, O = (t) => {
		if (t.stopPropagation(), !g.current && (c.getState().clickSelect(e.taskId, t.shiftKey), !t.shiftKey)) if (e.column === "human-review" && !e.merged && t.detail === 1) _.current !== null && window.clearTimeout(_.current), _.current = window.setTimeout(() => {
			_.current = null, c.getState().openReview(e.taskId);
		}, on);
		else {
			let t = e.agentIds[0];
			t === void 0 ? c.getState().openInspectorCard(e.taskId) : c.getState().openInspector(t);
		}
	}, k = (t) => {
		if (t.stopPropagation(), _.current !== null && (window.clearTimeout(_.current), _.current = null), g.current) return;
		let n = e.agentIds[0];
		n === void 0 ? c.getState().openInspectorCard(e.taskId) : c.getState().openInspector(n);
	}, A = y !== null, j = v.current, M = A ? { pointerEvents: "none" } : void 0, N = e.column === "in-production";
	return /* @__PURE__ */ u("div", {
		ref: m,
		"data-testid": `card-${e.taskId}`,
		"data-card-column": e.column,
		role: "button",
		tabIndex: 0,
		className: V("wr-card", T && "wr-card--stack", e.merged && "wr-card--merged", e.compacted && "wr-card--compact", f.has(e.taskId) && "is-selected", C && "is-draggable", A && "is-dragging", x && "is-snapback"),
		style: M,
		onPointerDown: D,
		onClick: O,
		onDoubleClick: k,
		onKeyDown: (t) => {
			t.key === "Enter" && c.getState().clickSelect(e.taskId, t.shiftKey);
		},
		children: [
			y !== null && j !== null && s(/* @__PURE__ */ l("div", {
				className: "wr-drag-ghost-layer",
				"data-drag-ghost": "true",
				"aria-hidden": "true",
				children: /* @__PURE__ */ l("div", {
					className: "wr-drag-ghost",
					style: {
						left: j.left + y.dx,
						top: j.top + y.dy,
						width: j.width
					},
					dangerouslySetInnerHTML: { __html: j.html }
				})
			}), document.body),
			e.merged && !N && /* @__PURE__ */ l("span", {
				className: "wr-card-sealstamp",
				title: "merged",
				"aria-label": "merged"
			}),
			N && /* @__PURE__ */ l("span", {
				className: "wr-card-crown",
				title: "in production",
				"aria-label": "in production",
				dangerouslySetInnerHTML: { __html: un }
			}),
			!e.merged && e.agentIds.length > 0 && /* @__PURE__ */ l("span", {
				className: "wr-card-eye",
				"aria-hidden": !0
			}),
			/* @__PURE__ */ l(hn, {
				card: e,
				orders: d,
				mini: !1
			}),
			e.column === "backlog" && /* @__PURE__ */ l(mn, {
				card: e,
				rosterAgents: i,
				orders: d
			}),
			/* @__PURE__ */ l(pn, {
				agentIds: e.agentIds,
				agents: r,
				store: c
			}),
			T && /* @__PURE__ */ l("div", {
				className: "wr-card-children",
				children: w.map((e, t) => /* @__PURE__ */ u("div", {
					"data-testid": `card-${e.taskId}`,
					role: "button",
					tabIndex: 0,
					className: V("wr-card wr-card--mini", f.has(e.taskId) && "is-selected"),
					style: { marginLeft: `${(t + 1) * 8}px` },
					onClick: (t) => {
						t.stopPropagation(), g.current || c.getState().clickSelect(e.taskId, t.shiftKey);
					},
					onDoubleClick: (t) => {
						let n = e.agentIds[0];
						n !== void 0 && (t.stopPropagation(), c.getState().openInspector(n));
					},
					onKeyDown: (t) => {
						t.key === "Enter" && c.getState().clickSelect(e.taskId, t.shiftKey);
					},
					children: [/* @__PURE__ */ l(hn, {
						card: e,
						orders: d,
						mini: !0
					}), /* @__PURE__ */ l(pn, {
						agentIds: e.agentIds,
						agents: r,
						store: c
					})]
				}, e.taskId))
			})
		]
	});
}
function _n({ store: e, orders: t }) {
	let i = B(e, (e) => e.board), s = B(e, (e) => e.selection.ids), c = B(e, (e) => e.meta.movingCards), d = B(e, (e) => e.meta.reviewTaskId), f = a(null), p = a(/* @__PURE__ */ new Map()), m = a(/* @__PURE__ */ new Map()), h = a(/* @__PURE__ */ new Map()), [g, _] = o(null), v = i.cardIds.map((e) => i.cards[e]?.view).filter((e) => e !== void 0), y = new Set(s);
	r(() => {
		let t = f.current;
		if (t === null) return;
		let n = /* @__PURE__ */ new Map();
		for (let e of Array.from(t.querySelectorAll("[data-testid^=\"card-\"]"))) {
			let t = e.getAttribute("data-testid") ?? "";
			t.startsWith("card-agent-") || t.startsWith("card-yolo-") || n.set(t.slice(5), e);
		}
		for (let [r, i] of Object.entries(c)) {
			if (m.current.get(r) === i.seq) continue;
			m.current.set(r, i.seq);
			let a = n.get(r);
			if (a === void 0) {
				e.getState().clearMoving(r);
				continue;
			}
			let o = h.current.get(r);
			o !== void 0 && (h.current.delete(r), o.cancel());
			let s = p.current.get(r), c = cn(a), l = () => {
				a.classList.remove("is-moving"), e.getState().clearMoving(r);
			};
			if (sn() || s === void 0) {
				a.classList.add("is-moving", "wr-card--arrive-glow"), window.setTimeout(() => {
					a.classList.remove("wr-card--arrive-glow"), l();
				}, 50);
				continue;
			}
			let u = t.getBoundingClientRect(), d = Math.min(Math.max(s.left, u.left + 4), Math.max(u.left + 4, u.right - c.width - 4)), f = Math.min(Math.max(s.top, u.top + 4), Math.max(u.top + 4, u.bottom - c.height - 4)), g = d - c.left, _ = f - c.top;
			if (g === 0 && _ === 0) {
				l();
				continue;
			}
			a.classList.add("is-moving");
			let v = Math.max(0, Math.min(f, c.top) - (u.top + 4)), y = Math.min(64, Math.max(24, Math.hypot(g, _) * .18), Math.max(8, v)), b = i.stagger * nn, x = a.animate([
				{ transform: `translate(${g}px, ${_}px)` },
				{
					transform: `translate(${g * .5}px, ${_ * .5 - y}px)`,
					offset: .5
				},
				{
					transform: "translate(0px, 3px)",
					offset: .88
				},
				{ transform: "translate(0px, 0px)" }
			], {
				duration: tn,
				delay: b,
				fill: "backwards",
				easing: "ease-in-out"
			});
			h.current.set(r, x);
			let S = () => {
				h.current.get(r) === x && (h.current.delete(r), l());
			};
			x.addEventListener("finish", S), x.addEventListener("cancel", S);
		}
		let r = /* @__PURE__ */ new Map();
		for (let [e, t] of n) r.set(e, cn(t));
		p.current = r;
	}), n(() => {
		for (let e of [...m.current.keys()]) c[e] === void 0 && m.current.delete(e);
		for (let e of [...h.current.keys()]) c[e] === void 0 && h.current.delete(e);
	}, [c]);
	let b = (e, t) => {
		_(e !== null && t !== null ? {
			from: e,
			lane: t
		} : null);
	};
	return /* @__PURE__ */ l("div", {
		ref: f,
		className: "wr-board",
		"data-testid": "kanban-board",
		"aria-label": "The Cogitator Board",
		children: Ct.map((n) => {
			let r = Xt(v, n), a = r.reduce((e, t) => e + 1 + t.childIds.length, 0), o = g !== null && g.lane === n, s = g !== null && qt(g.from, n);
			return /* @__PURE__ */ u("section", {
				"data-testid": `kanban-col-${n}`,
				className: V("wr-lane", `wr-lane--${n}`, g !== null && s && "is-drop-legal", o && s && "is-drop-target", o && !s && "is-drop-illegal"),
				"aria-label": Kt[n],
				children: [
					/* @__PURE__ */ u("header", {
						className: "wr-lane-head",
						children: [
							/* @__PURE__ */ l("span", {
								className: "wr-lane-title",
								children: Kt[n]
							}),
							n === "merged" && /* @__PURE__ */ u("button", {
								type: "button",
								"data-testid": "col-release",
								className: "wr-release-lever",
								disabled: r.length === 0,
								title: r.length === 0 ? "The release lever waits — staging holds no merged cards" : "Throw the release lever — ship every merged card to production as one train (§V4-1)",
								onClick: (e) => {
									e.stopPropagation(), t.release();
								},
								children: [/* @__PURE__ */ l("span", {
									className: "wr-release-lever-glyph",
									"aria-hidden": !0,
									dangerouslySetInnerHTML: { __html: dn }
								}), "Release"]
							}),
							/* @__PURE__ */ l("span", {
								className: "wr-lane-count",
								"data-testid": `kanban-count-${n}`,
								children: a
							})
						]
					}),
					n === "merged" && /* @__PURE__ */ l("div", {
						className: "wr-lane-caption",
						children: "staging"
					}),
					n === "in-production" && /* @__PURE__ */ l("div", {
						className: "wr-lane-caption",
						children: "live"
					}),
					/* @__PURE__ */ u("div", {
						className: "wr-lane-cards",
						children: [r.map((r) => {
							let a = /* @__PURE__ */ l(gn, {
								card: r,
								allCards: v,
								agents: i.agents,
								rosterAgents: i.rosterAgents,
								store: e,
								orders: t,
								selected: y,
								onHoverLane: b
							}, r.taskId);
							return n === "do" || n === "human-review" && r.taskId === d ? /* @__PURE__ */ l("div", {
								className: "wr-card-slot",
								"data-testid": `card-slot-${r.taskId}`,
								children: a
							}, r.taskId) : a;
						}), r.length === 0 && (n === "merged" || n === "in-production" ? /* @__PURE__ */ l("div", {
							className: "wr-lane-empty wr-lane-empty--rail",
							children: "awaiting the release train"
						}) : /* @__PURE__ */ l("div", {
							className: "wr-lane-empty",
							children: "— empty plate —"
						}))]
					})
				]
			}, n);
		})
	});
}
function vn(e, t = 3) {
	let n = [...e].reverse();
	return {
		visible: n.slice(0, t),
		overflow: Math.max(0, n.length - t)
	};
}
//#endregion
//#region src/components/hud/ChatDock.tsx
var yn = 650, bn = 900;
function xn({ inquiry: e, onChoose: t, withTestIds: n }) {
	return /* @__PURE__ */ l("div", {
		className: "wr-inq-options",
		role: "group",
		"aria-label": "Inquiry options",
		children: e.options.map((r) => {
			let i = me(r);
			return /* @__PURE__ */ u("button", {
				type: "button",
				...n ? { "data-testid": `inquiry-opt-${e.hookRequestId}-${r.id}` } : {},
				className: V("wr-inq-opt", r.tone === "danger" && "wr-inq-opt--danger", r.tone === "primary" && "wr-inq-opt--primary"),
				title: r.detail ?? r.caption,
				onClick: () => t(r),
				children: [/* @__PURE__ */ l("span", {
					className: "wr-inq-opt-icon",
					"aria-hidden": !0,
					dangerouslySetInnerHTML: { __html: i.svg }
				}), /* @__PURE__ */ l("span", {
					className: "wr-inq-opt-caption",
					children: r.caption
				})]
			}, r.id);
		})
	});
}
function Sn({ store: e, orders: t }) {
	let r = B(e, (e) => e.board.inquiries), i = B(e, (e) => e.board.agents), s = B(e, (e) => e.meta.dockPulse), c = a(null), [d, f] = o([]), [p, m] = o(!1);
	n(() => {
		if (s === 0) return;
		c.current?.scrollIntoView({ block: "nearest" }), m(!0);
		let e = window.setTimeout(() => m(!1), bn);
		return () => window.clearTimeout(e);
	}, [s]);
	let { visible: h, overflow: g } = vn(r), _ = h.length === 0 && d.length === 0, v = (n, r) => {
		let a = i[n.unitId]?.agent ?? "claude-code";
		e.getState().recordResolvedInquiry({
			hookRequestId: n.hookRequestId,
			unitId: n.unitId,
			taskId: n.taskId,
			question: n.question,
			optionId: r.id,
			caption: r.caption,
			...r.tone === void 0 ? {} : { tone: r.tone }
		}), t.answerInquiry(n.hookRequestId, r.id);
		let o = {
			hookRequestId: n.hookRequestId,
			question: n.question,
			caption: r.caption,
			unitId: n.unitId,
			adapter: a
		};
		f((e) => [o, ...e]), window.setTimeout(() => {
			f((e) => e.filter((e) => e.hookRequestId !== o.hookRequestId));
		}, yn);
	};
	return /* @__PURE__ */ u("div", {
		ref: c,
		className: V("wr-dock", p && "is-pulsing", _ && "wr-dock--empty"),
		"data-testid": "chat-dock",
		"aria-label": "Inquiry dock",
		children: [
			/* @__PURE__ */ u("div", {
				className: "wr-dock-title",
				children: ["INQUIRIES", g > 0 && /* @__PURE__ */ u("span", {
					className: "wr-dock-more",
					children: [
						"+",
						g,
						" more"
					]
				})]
			}),
			_ ? /* @__PURE__ */ u("div", {
				className: "wr-dock-empty-state",
				"aria-label": "No active inquiries",
				children: [
					/* @__PURE__ */ u("svg", {
						className: "wr-dock-empty-gear",
						viewBox: "0 0 64 64",
						xmlns: "http://www.w3.org/2000/svg",
						"aria-hidden": !0,
						children: [/* @__PURE__ */ l("path", { d: "M29 4h6l1 6.2a18 18 0 0 1 4.6 1.9l5.2-3.4 4.2 4.2-3.4 5.2A18 18 0 0 1 48.8 23l6.2 1v6l-6.2 1a18 18 0 0 1-1.9 4.6l3.4 5.2-4.2 4.2-5.2-3.4A18 18 0 0 1 36 43.8L35 50h-6l-1-6.2a18 18 0 0 1-4.6-1.9l-5.2 3.4-4.2-4.2 3.4-5.2A18 18 0 0 1 15.2 31L9 30v-6l6.2-1a18 18 0 0 1 1.9-4.6l-3.4-5.2 4.2-4.2 5.2 3.4A18 18 0 0 1 28 10.2z" }), /* @__PURE__ */ l("path", { d: "M32 22a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" })]
					}),
					/* @__PURE__ */ u("svg", {
						className: "wr-dock-empty-quill",
						viewBox: "0 0 32 32",
						xmlns: "http://www.w3.org/2000/svg",
						"aria-hidden": !0,
						children: [/* @__PURE__ */ l("path", { d: "M28 2C21 2 14 7 10 14 7.5 18 6 22 6 26l2 2c4 0 8-1.5 12-4 7-4 12-11 12-18 0-2.8-1.6-4-4-4zm-4 4c1.5 0 2 .8 2 2-1 5-5 10-11 13-2 1-4 1.8-6 2.2.4-2 1.2-4 2.2-6 3-6 8-10 13-11z" }), /* @__PURE__ */ l("path", {
							d: "M8 24 4 28M6 26l-3 4",
							strokeLinecap: "round",
							strokeWidth: "1.5",
							stroke: "currentColor",
							fill: "none"
						})]
					}),
					/* @__PURE__ */ l("p", {
						className: "wr-dock-empty-label",
						children: "No pending inquiries"
					}),
					/* @__PURE__ */ l("p", {
						className: "wr-dock-empty-sub",
						children: "Agents will submit breakpoints & decisions here"
					})
				]
			}) : null,
			/* @__PURE__ */ u("div", {
				className: "wr-dock-stack",
				children: [d.map((e) => /* @__PURE__ */ u("div", {
					className: "wr-inq wr-inq--stamped",
					"aria-hidden": !0,
					children: [
						/* @__PURE__ */ l("span", {
							className: "wr-inq-portrait",
							dangerouslySetInnerHTML: { __html: R({
								entityId: e.unitId,
								kind: "unit",
								adapter: e.adapter
							}).svg }
						}),
						/* @__PURE__ */ u("div", {
							className: "wr-inq-main",
							children: [/* @__PURE__ */ l("div", {
								className: "wr-inq-question",
								children: e.question
							}), /* @__PURE__ */ l("div", {
								className: "wr-inq-resolved",
								children: e.caption
							})]
						}),
						/* @__PURE__ */ l("span", { className: "wr-inq-stamp" })
					]
				}, `ghost-${e.hookRequestId}`)), h.map((e) => {
					let n = i[e.unitId]?.agent ?? "claude-code", r = R({
						entityId: e.unitId,
						kind: "unit",
						adapter: n
					});
					return /* @__PURE__ */ u("div", {
						className: "wr-inq",
						"data-testid": `inquiry-${e.hookRequestId}`,
						children: [/* @__PURE__ */ u("button", {
							type: "button",
							className: "wr-inq-focus-btn",
							title: "Open card context",
							onClick: () => t.focusInquiryCard(e.taskId),
							children: [/* @__PURE__ */ l("span", {
								className: `wr-inq-portrait wr-faction-text--${n}`,
								title: e.unitId,
								dangerouslySetInnerHTML: { __html: r.svg }
							}), /* @__PURE__ */ l("div", {
								className: "wr-inq-question",
								children: e.question
							})]
						}), /* @__PURE__ */ l("div", {
							className: "wr-inq-main",
							children: /* @__PURE__ */ l(xn, {
								inquiry: e,
								onChoose: (t) => v(e, t),
								withTestIds: !0
							})
						})]
					}, e.hookRequestId);
				})]
			})
		]
	});
}
//#endregion
//#region src/components/hud/CommandCard.tsx
function Cn({ store: e, orders: t }) {
	let n = Ke({
		world: B(e, (e) => e.world),
		board: B(e, (e) => e.board),
		selection: B(e, (e) => e.selection),
		alerts: B(e, (e) => e.alerts),
		meta: B(e, (e) => e.meta)
	}), r = Math.max(0, Ue - n.length), i = (n) => {
		n.enabled && Xe(n.intent, e, t);
	};
	return /* @__PURE__ */ u("section", {
		className: "wr-panel wr-commands",
		"data-testid": "command-card",
		"aria-label": "Commands",
		children: [/* @__PURE__ */ l("div", {
			className: "wr-panel-title",
			children: "ORDERS"
		}), /* @__PURE__ */ u("div", {
			className: "wr-cmd-grid",
			children: [n.map((e) => /* @__PURE__ */ u("button", {
				type: "button",
				"data-testid": `cmd-${e.id}`,
				className: V("wr-cmd", e.severity === "danger" && "wr-cmd--danger", e.severity === "urgent" && "wr-cmd--urgent"),
				disabled: !e.enabled,
				title: `${e.tooltip}${e.hotkey === void 0 ? "" : ` [${e.hotkey}]`}`,
				onClick: () => i(e),
				children: [
					/* @__PURE__ */ l("span", {
						className: "wr-cmd-icon",
						dangerouslySetInnerHTML: { __html: e.icon.svg }
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-cmd-label",
						children: e.label
					}),
					e.hotkey !== void 0 && /* @__PURE__ */ l("span", {
						className: "wr-cmd-sep",
						"aria-hidden": !0,
						children: " "
					}),
					e.hotkey !== void 0 && /* @__PURE__ */ l("kbd", {
						className: "wr-cmd-hotkey",
						children: e.hotkey
					})
				]
			}, e.id)), Array.from({ length: r }, (e, t) => /* @__PURE__ */ l("span", {
				className: "wr-cmd wr-cmd--empty",
				"aria-hidden": !0,
				children: /* @__PURE__ */ l("kbd", {
					className: "wr-cmd-hotkey",
					children: he[n.length + t]
				})
			}, `empty-${t}`))]
		})]
	});
}
//#endregion
//#region src/components/hud/EventTicker.tsx
var wn = {
	info: "<path d=\"M7 1.8 A5.2 5.2 0 1 0 7 12.2 A5.2 5.2 0 1 0 7 1.8 Z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\"/><path d=\"M7 6.4 V10 M7 4 V4.6\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\"/>",
	success: "<path d=\"M2.4 7.4 L5.6 10.6 L11.6 3.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
	warn: "<path d=\"M7 1.8 L13 12 H1 Z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/><path d=\"M7 5.4 V8.4 M7 10 V10.6\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"/>",
	alert: "<path d=\"M7 1.4 L12.6 7 L7 12.6 L1.4 7 Z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/><path d=\"M4.8 4.8 L9.2 9.2 M9.2 4.8 L4.8 9.2\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\"/>"
};
function Tn(e) {
	return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 14 14\" width=\"100%\" height=\"100%\" aria-hidden=\"true\">" + wn[e] + "</svg>";
}
function En({ store: e }) {
	let t = B(e, (e) => e.events), n = B(e, (e) => e.meta.simStartMs), [r, i] = o(null), a = t, s = r ?? a, c = (t) => {
		t.entityId !== void 0 && e.getState().clickSelect(t.entityId, !1);
	};
	return /* @__PURE__ */ u("section", {
		className: "wr-panel wr-ticker",
		"data-testid": "event-ticker",
		"aria-label": "Event stream",
		children: [/* @__PURE__ */ u("div", {
			className: "wr-panel-title",
			children: ["COMMS", r !== null && /* @__PURE__ */ l("span", {
				className: "wr-ticker-hold",
				children: "HOLD"
			})]
		}), /* @__PURE__ */ u("ol", {
			className: "wr-ticker-list",
			onMouseEnter: () => i(a),
			onMouseLeave: () => i(null),
			children: [s.map((e) => /* @__PURE__ */ l("li", { children: /* @__PURE__ */ u("button", {
				type: "button",
				"data-testid": "ticker-item",
				className: V("wr-ticker-item", `wr-ticker-item--${e.severity}`, e.entityId !== void 0 && "wr-ticker-item--linked"),
				onClick: () => c(e),
				children: [
					/* @__PURE__ */ l("span", {
						className: "wr-ticker-glyph",
						dangerouslySetInnerHTML: { __html: Tn(e.severity) }
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-ticker-ts",
						children: g(e.ts, n)
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-ticker-text",
						children: e.text
					})
				]
			}) }, e.id)), s.length === 0 && /* @__PURE__ */ l("li", {
				className: "wr-ticker-empty",
				children: "awaiting fleet activity…"
			})]
		})]
	});
}
//#endregion
//#region src/game/sessions.ts
var Dn = new Set([
	"ai-review",
	"human-review",
	"approved",
	"merged",
	"in-production"
]), On = new Set([
	"sessions",
	"process",
	"workspace",
	"memory",
	"terminal"
]);
function kn(e, t) {
	return t === 0 && e !== void 0 && Dn.has(e) ? "sessions" : "process";
}
function An(e, t, n) {
	let r = new Set([t, ...n]);
	return e.filter((e) => r.has(e.taskId));
}
function jn(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) t.set(n.sessionId, {
		session: n,
		children: []
	});
	let n = [], r = /* @__PURE__ */ new Map();
	for (let i of e) {
		let e = t.get(i.sessionId), a = i.parentSessionId, o = a !== null && a !== i.sessionId ? t.get(a) : void 0;
		if (o !== void 0) {
			o.children.push(e);
			continue;
		}
		let s = r.get(i.attempt);
		s === void 0 && (s = {
			attempt: i.attempt,
			rows: []
		}, r.set(i.attempt, s), n.push(s)), s.rows.push(e);
	}
	return n;
}
var Mn = { mode: "list" };
function Nn(e) {
	return {
		mode: "transcript",
		sessionId: e
	};
}
function Pn() {
	return Mn;
}
//#endregion
//#region src/game/store.ts
var Fn = "0.4.0-board", In = 2e5, Ln = 2.5, Rn = 5e3;
function zn(e, t, n) {
	return n ? e.includes(t) ? e.filter((e) => e !== t) : [...e, t] : [t];
}
var Bn = new Set([
	"dispatching",
	"thinking",
	"tool_running",
	"awaiting_approval",
	"blocked"
]);
function Vn(e) {
	let t = e.tokenUsage;
	return t.inputTokens + t.outputTokens + t.thinkingTokens;
}
function Hn(e, t) {
	return e.unitId === t.unitId && e.agent === t.agent && e.model === t.model && e.title === t.title && e.workspaceId === t.workspaceId && e.state === t.state && e.paused === t.paused && e.taskId === t.taskId && e.runId === t.runId && e.turnIndex === t.turnIndex && e.turnCount === t.turnCount && e.messageCount === t.messageCount && e.pendingHookId === t.pendingHookId && e.tokenUsage.inputTokens === t.tokenUsage.inputTokens && e.tokenUsage.outputTokens === t.tokenUsage.outputTokens && e.tokenUsage.thinkingTokens === t.tokenUsage.thinkingTokens && e.tokenUsage.cachedTokens === t.tokenUsage.cachedTokens && e.cost.totalUsd === t.cost.totalUsd && e.updatedAt === t.updatedAt;
}
function Un(e, t) {
	return e.taskId === t.taskId && e.taskKind === t.taskKind && e.repository === t.repository && e.workspaceId === t.workspaceId && e.title === t.title && e.state === t.state && e.phase === t.phase && e.progress === t.progress && e.priority === t.priority && e.assigneeIds.length === t.assigneeIds.length && e.assigneeIds.every((e, n) => t.assigneeIds[n] === e);
}
function Wn(e, t) {
	return e.taskId === t.taskId && e.taskKind === t.taskKind && e.title === t.title && e.column === t.column && e.order === t.order && e.yolo === t.yolo && e.merged === t.merged && e.progress === t.progress && e.parentId === t.parentId && e.attempt === t.attempt && e.feedback === t.feedback && e.dirtyFileCount === t.dirtyFileCount && e.hasPendingInquiry === t.hasPendingInquiry && e.workerAgentId === t.workerAgentId && e.reviewerAgentId === t.reviewerAgentId && e.humanAssigneeId === t.humanAssigneeId && e.childIds.length === t.childIds.length && e.childIds.every((e, n) => t.childIds[n] === e) && e.agentIds.length === t.agentIds.length && e.agentIds.every((e, n) => t.agentIds[n] === e);
}
function W(e) {
	return typeof e == "string" ? e : void 0;
}
function Gn(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function Kn(e) {
	return Array.isArray(e) ? e.filter((e) => typeof e == "string") : [];
}
function qn(e, t, n, r, i) {
	let a = {
		tickerEntries: [],
		transcriptOps: /* @__PURE__ */ new Map(),
		cardMoves: [],
		pulses: [],
		runToUnit: t,
		connected: !1
	}, o = null, s = (e, n) => {
		a.runToUnit[e] !== n && (o === null && (o = { ...t }, a.runToUnit = o), o[e] = n);
	}, c = (e, t) => {
		let n = a.transcriptOps.get(e);
		n ? n.push(t) : a.transcriptOps.set(e, [t]);
	}, l = (e) => {
		a.tickerEntries.push(e);
	};
	for (let t of e) switch (t.type) {
		case "hello":
			a.connected = !0;
			break;
		case "error":
			l({
				ts: i,
				severity: "alert",
				text: `Command rejected — ${t.code}: ${t.message}`
			});
			break;
		case "hook.request": {
			let e = W(t.payload.taskId);
			l({
				ts: i,
				severity: "warn",
				text: `Inquiry raised — ${W(t.payload.question) ?? "the agent needs a decision"}`,
				...e === void 0 ? {} : { entityId: e }
			});
			break;
		}
		case "hook.resolved": break;
		case "pong":
		case "pairing.consumed": break;
		case "run.event":
			Xn(t, a, s, c, l, n, r);
			break;
	}
	return a;
}
var Jn = new Set([
	"user-move",
	"reverted",
	"release-shipped",
	"rolled-back"
]);
function Yn(e, t, n) {
	switch (e) {
		case "work-complete": return `Work complete — ${t} advances to AI REVIEW`;
		case "review-pass": return `Review passed — ${t} awaits human review`;
		case "review-pass-yolo": return `Yolo pass — ${t} auto-approved, skipping human review`;
		case "review-rejected": return `Review rejected — ${t} returns to DO for rework`;
		case "aborted": return `Abort executed — ${t} returns to the backlog`;
		case "integration-complete": return `Integration complete — ${t} lands on staging (MERGED)`;
		default: return `${t} moved to ${n.toUpperCase()}`;
	}
}
function Xn(e, t, n, r, i, a, o) {
	let s = e.event, c = W(s.type);
	if (c === void 0) return;
	let l = Gn(s.timestamp) ?? 0, u = W(s.sessionId), d = W(s.unitId);
	u !== void 0 && e.runId !== "run-none" && n(e.runId, u);
	let f = u ?? d ?? t.runToUnit[e.runId], p = W(s.taskId);
	switch (c) {
		case "session_start": {
			let t = s.resumed === !0;
			f !== void 0 && (r(f, {
				kind: "note",
				text: `session ${t ? "resumed" : "started"} (${e.runId})`
			}), i({
				ts: l,
				severity: "info",
				text: `${a(f)} attends${t ? " (resumed)" : ""}`,
				entityId: f
			}));
			break;
		}
		case "turn_start": {
			let e = Gn(s.turnIndex) ?? 0;
			f !== void 0 && r(f, {
				kind: "turn",
				text: `— turn ${e + 1} —`
			});
			break;
		}
		case "text_delta": {
			let e = W(s.accumulated) ?? "";
			f !== void 0 && r(f, {
				kind: "text",
				text: e
			});
			break;
		}
		case "thinking_delta": {
			let e = W(s.accumulated) ?? "";
			f !== void 0 && r(f, {
				kind: "thinking",
				text: e
			});
			break;
		}
		case "tool_call_start": {
			let e = W(s.toolName) ?? "tool";
			f !== void 0 && r(f, {
				kind: "tool",
				text: `> ${e} running…`,
				toolName: e,
				toolStatus: "running"
			});
			break;
		}
		case "tool_result": {
			let e = W(s.toolName) ?? "tool", t = Gn(s.durationMs) ?? 0;
			f !== void 0 && r(f, {
				kind: "tool",
				text: `> ${e} finished (${t}ms)`,
				toolName: e,
				durationMs: t,
				toolStatus: "done"
			});
			break;
		}
		case "tool_error": {
			let e = W(s.toolName) ?? "tool", t = W(s.error) ?? "tool failed";
			f !== void 0 && (r(f, {
				kind: "tool",
				text: `> ${e} FAILED: ${t}`,
				toolName: e,
				toolStatus: "failed"
			}), i({
				ts: l,
				severity: "warn",
				text: `${a(f)}: ${t}`,
				entityId: f
			}));
			break;
		}
		case "paused":
			f !== void 0 && (r(f, {
				kind: "note",
				text: "holding — paused by operator"
			}), i({
				ts: l,
				severity: "info",
				text: `${a(f)} holding — paused by operator`,
				entityId: f
			}));
			break;
		case "resumed":
			f !== void 0 && (r(f, {
				kind: "note",
				text: "resumed"
			}), i({
				ts: l,
				severity: "info",
				text: `${a(f)} back online`,
				entityId: f
			}));
			break;
		case "task_prioritized":
			i({
				ts: l,
				severity: "info",
				text: `Priority — ${o(p)} bumped to the top of the backlog`,
				...p === void 0 ? {} : { entityId: p }
			});
			break;
		case "error": {
			let e = W(s.message) ?? "unknown error", t = s.recoverable === !0;
			f !== void 0 && (r(f, {
				kind: "note",
				text: `ERROR: ${e}`
			}), i({
				ts: l,
				severity: t ? "warn" : "alert",
				text: `${a(f)}: ${e}`,
				entityId: f
			}));
			break;
		}
		case "session_end":
			f !== void 0 && r(f, {
				kind: "note",
				text: "session ended"
			});
			break;
		case "card_moved": {
			let e = W(s.from), n = W(s.to), r = W(s.reason) ?? "user-move", a = typeof s.stagger == "number" ? s.stagger : 0;
			p !== void 0 && e !== void 0 && n !== void 0 && (t.cardMoves.push({
				taskId: p,
				from: e,
				to: n,
				reason: r,
				stagger: a
			}), Jn.has(r) || i({
				ts: l,
				severity: "info",
				text: Yn(r, o(p), n),
				entityId: p
			}));
			break;
		}
		case "reverted":
			i({
				ts: l,
				severity: "warn",
				text: `Reverted — ${o(p)} pulled from staging, returns to DO`,
				...p === void 0 ? {} : { entityId: p }
			});
			break;
		case "release_shipped":
			i({
				ts: l,
				severity: "success",
				text: `Release ${W(s.releaseId) ?? "rel-??"} — ${o(p)} ships to production`,
				...p === void 0 ? {} : { entityId: p }
			});
			break;
		case "rolled_back":
			i({
				ts: l,
				severity: "warn",
				text: `Rolled back — ${o(p)} withdrawn from production to staging`,
				...p === void 0 ? {} : { entityId: p }
			});
			break;
		case "task_updated":
			i({
				ts: l,
				severity: "info",
				text: `Card updated — ${o(p)}`,
				...p !== void 0 && p !== "" ? { entityId: p } : {}
			});
			break;
		case "stack_forged": {
			let e = W(s.name) ?? "unnamed stack", t = W(s.stackRef) ?? "stk-c??";
			i({
				ts: l,
				severity: "success",
				text: s.updated === !0 ? `Stack re-forged — ${e} (${t}) updated in the foundry` : `Stack forged — ${e} (${t}) joins the roster`
			});
			break;
		}
		case "process_updated":
			i({
				ts: l,
				severity: "success",
				text: `Process amended — ${W(s.processId) ?? "commander/?@v?"} inscribed; future runs only`
			});
			break;
		case "card_merged":
			i({
				ts: l,
				severity: "success",
				text: `Merged — ${o(p)} sealed into the base branch`,
				...p === void 0 ? {} : { entityId: p }
			});
			break;
		case "integration_step":
			i({
				ts: l,
				severity: "info",
				text: `Integration — ${W(s.step) ?? "integration step"} (${o(p)})`,
				...p === void 0 ? {} : { entityId: p }
			});
			break;
		case "review_feedback": {
			let e = W(s.feedback) ?? "changes requested";
			i({
				ts: l,
				severity: "warn",
				text: `Feedback — ${o(p)}: ${e}`,
				...p === void 0 ? {} : { entityId: p }
			});
			break;
		}
		case "review_note":
			i({
				ts: l,
				severity: "info",
				text: `Reviewer — ${W(s.note) ?? "reviewer note"}`,
				...p === void 0 ? {} : { entityId: p }
			});
			break;
		case "inquiry_resolved":
			i({
				ts: l,
				severity: "success",
				text: `Inquiry resolved — ${W(s.caption) ?? "option chosen"} (${o(p)})`,
				...p === void 0 ? {} : { entityId: p }
			});
			break;
		case "inquiry_followup":
			i({
				ts: l,
				severity: "info",
				text: W(s.text) ?? "branch engaged",
				...p === void 0 ? {} : { entityId: p }
			});
			break;
		case "memory_query": {
			let e = W(s.silo) ?? "", n = Kn(s.matchedIds), r = W(s.unitId);
			t.pulses.push({
				kind: "query",
				silo: e,
				recordIds: n,
				unitId: r ?? null,
				taskId: p ?? null,
				ts: l
			}), i({
				ts: l,
				severity: "info",
				text: `Memory query — ${a(r)} drew ${n.length} piece(s) from ${e}`,
				...r === void 0 ? {} : { entityId: r }
			});
			break;
		}
		case "memory_update": {
			let e = W(s.silo) ?? "", n = W(s.unitId);
			t.pulses.push({
				kind: "update",
				silo: e,
				recordIds: [],
				unitId: n ?? null,
				taskId: p ?? null,
				ts: l
			}), i({
				ts: l,
				severity: "info",
				text: `Memory update — ${a(n)} proposes changes to ${e}`,
				...n === void 0 ? {} : { entityId: n }
			});
			break;
		}
		default: break;
	}
}
function Zn() {
	return {
		unitCount: 0,
		busyCount: 0,
		idleCount: 0,
		tokensBurned: 0,
		costUsd: 0,
		tasksDone: 0,
		tasksTotal: 0,
		alertCount: 0
	};
}
function Qn() {
	return nt((e, t) => ({
		world: {
			units: {},
			unitIds: [],
			tasks: {},
			taskIds: [],
			runToUnit: {}
		},
		board: {
			cards: {},
			cardIds: [],
			agents: {},
			agentIds: [],
			inquiries: [],
			resolvedInquiries: {},
			memory: {
				silos: [],
				records: []
			},
			heldByCard: {},
			rosterAgents: [],
			personas: [],
			definitions: []
		},
		selection: { ids: [] },
		events: [],
		alerts: [],
		meta: {
			resources: Zn(),
			speed: 1,
			simTimeMs: 0,
			simStartMs: 0,
			tickIndex: 0,
			connection: "connecting",
			paused: !1,
			viewport: {
				width: 1280,
				height: 720
			},
			inspectorUnitId: null,
			inspectorTaskId: null,
			inspectorTab: "transcript",
			reviewTaskId: null,
			cardEditorTaskId: null,
			dockPulse: 0,
			steerOpen: !1,
			foundryOpen: !1,
			archiveOpen: !1,
			archiveFocusId: null,
			runsOpen: !1,
			runsFocusRunId: null,
			registryOpen: !1,
			registryStackRef: null,
			foundryTab: "commission",
			ideTaskId: null,
			movingCards: {},
			moveSeq: 0,
			memoryPulses: [],
			pulseSeq: 0,
			eventSeq: 0,
			version: Fn
		},
		commitTick(t) {
			e((e) => {
				let n = e.world, r = e.board, i = new Map(t.units.map((e) => [e.unitId, e])), a = qn(t.frames, n.runToUnit, (e) => e === void 0 ? "unknown agent" : i.get(e)?.title ?? n.units[e]?.view.title ?? e, (e) => e === void 0 ? "unknown task" : t.cards.find((t) => t.taskId === e)?.title ?? r.cards[e]?.view.title ?? e, t.nowMs), o = {}, s = !1;
				for (let e of t.tasks) {
					let t = n.tasks[e.taskId];
					t && Un(t.view, e) ? o[e.taskId] = t : (o[e.taskId] = {
						kind: "task",
						id: e.taskId,
						view: e
					}, s = !0);
				}
				let c = Object.keys(o).sort(), l = c.length === n.taskIds.length && c.every((e, t) => n.taskIds[t] === e), u = {}, d = !1;
				for (let e of t.units) {
					let t = n.units[e.unitId], r = a.transcriptOps.get(e.unitId), i = t?.transcript ?? [], o = t?.transcriptSeq ?? 0;
					if (r !== void 0 && r.length > 0) {
						let t = [...i];
						for (let n of r) {
							let r = t[t.length - 1];
							r !== void 0 && (n.kind === "text" || n.kind === "thinking") && r.kind === n.kind ? t[t.length - 1] = {
								...r,
								text: n.text
							} : t.push({
								id: `tr-${e.unitId}-${o += 1}`,
								...n
							});
						}
						i = t.slice(-100);
					}
					if (t && i === t.transcript && Hn(t.view, e)) u[e.unitId] = t;
					else {
						let t = Vn(e) + e.tokenUsage.cachedTokens;
						u[e.unitId] = {
							kind: "unit",
							id: e.unitId,
							view: e,
							contextPct: Math.min(1, t / In),
							energyPct: Math.max(0, 1 - e.cost.totalUsd / Ln),
							transcript: i,
							transcriptSeq: o
						}, d = !0;
					}
				}
				let f = Object.keys(u).sort(), p = f.length === n.unitIds.length && f.every((e, t) => n.unitIds[t] === e), m = {}, h = !1;
				for (let e of t.cards) {
					let n = r.cards[e.taskId], i = t.runStages[e.taskId] ?? null;
					n && n.runStage === i && Wn(n.view, e) ? m[e.taskId] = n : (m[e.taskId] = {
						id: e.taskId,
						view: e,
						runStage: i
					}, h = !0);
				}
				let g = Object.keys(m).sort(), _ = g.length === r.cardIds.length && g.every((e, t) => r.cardIds[t] === e), v = {}, y = !1;
				for (let e of t.agents) {
					let t = r.agents[e.unitId];
					t && t.updatedAt === e.updatedAt && t.state === e.state && t.paused === e.paused && t.heldPieces.length === e.heldPieces.length ? v[e.unitId] = t : (v[e.unitId] = e, y = !0);
				}
				let b = Object.keys(v).sort(), x = b.length === r.agentIds.length && b.every((e, t) => r.agentIds[t] === e), S = t.inquiries.length === r.inquiries.length && t.inquiries.every((e, t) => r.inquiries[t]?.hookRequestId === e.hookRequestId) ? r.inquiries : t.inquiries, C = new Map(e.alerts.map((e) => [e.hookRequestId, e])), w = t.hooks.map((e) => {
					let t = C.get(e.hookRequestId);
					return t === void 0 ? {
						hookRequestId: e.hookRequestId,
						runId: e.runId,
						unitId: e.unitId,
						kind: e.hookKind,
						payload: e.payload,
						deadlineTs: e.deadlineTs
					} : t;
				}), T = w.length === e.alerts.length && w.every((t, n) => e.alerts[n] === t), E = e.meta.eventSeq, D = e.events;
				if (a.tickerEntries.length > 0) {
					let t = a.tickerEntries.map((e) => ({
						id: `evt-${E += 1}`,
						...e
					}));
					D = [...e.events, ...t].slice(-2e3);
				}
				let O = e.meta.movingCards, k = e.meta.moveSeq;
				if (a.cardMoves.length > 0) {
					O = { ...O };
					for (let e of a.cardMoves) k += 1, O[e.taskId] = {
						from: e.from,
						to: e.to,
						reason: e.reason,
						seq: k,
						stagger: e.stagger
					};
				}
				let A = r.heldByCard;
				for (let e of a.pulses) {
					if (e.kind !== "query" || e.taskId === null || e.recordIds.length === 0) continue;
					let t = A[e.taskId] ?? [], n = e.recordIds.filter((e) => !t.includes(e));
					n.length !== 0 && (A === r.heldByCard && (A = { ...A }), A[e.taskId] = [...t, ...n]);
				}
				let j = e.meta.pulseSeq, M = e.meta.memoryPulses.filter((e) => t.nowMs - e.ts < Rn);
				M.length === e.meta.memoryPulses.length && a.pulses.length === 0 && (M = e.meta.memoryPulses), a.pulses.length > 0 && (M = [...M, ...a.pulses.map((e) => ({
					id: `pulse-${j += 1}`,
					...e
				}))].slice(-24));
				let N = e.selection, P = N.ids.filter((e) => u[e] !== void 0 || m[e] !== void 0);
				P.length !== N.ids.length && (N = {
					...N,
					ids: P
				});
				let F = 0, ee = 0, I = 0;
				for (let e of t.units) Bn.has(e.state) && (F += 1), ee += Vn(e), I += e.cost.totalUsd;
				let te = t.tasks.filter((e) => e.state === "done").length, ne = {
					unitCount: t.units.length,
					busyCount: F,
					idleCount: t.units.filter((e) => e.state === "idle").length,
					tokensBurned: ee,
					costUsd: Math.round(I * 100) / 100,
					tasksDone: te,
					tasksTotal: t.tasks.length,
					alertCount: w.length
				}, L = d || s || !p || !l || a.runToUnit !== n.runToUnit ? {
					units: u,
					unitIds: p ? n.unitIds : f,
					tasks: o,
					taskIds: l ? n.taskIds : c,
					runToUnit: a.runToUnit
				} : n, re = t.rosterAgents, R = re !== r.rosterAgents && (re.length !== r.rosterAgents.length || re.some((e, t) => e !== r.rosterAgents[t])), ie = t.personas.length !== r.personas.length || t.personas.some((e, t) => e !== r.personas[t]), ae = ie ? t.personas : r.personas, oe = t.definitions.length !== r.definitions.length || t.definitions.some((e, t) => e !== r.definitions[t]), se = oe ? t.definitions : r.definitions;
				return {
					world: L,
					board: h || y || !_ || !x || S !== r.inquiries || A !== r.heldByCard || R || ie || oe ? {
						cards: m,
						cardIds: _ ? r.cardIds : g,
						agents: v,
						agentIds: x ? r.agentIds : b,
						inquiries: S,
						resolvedInquiries: r.resolvedInquiries,
						memory: r.memory,
						heldByCard: A,
						rosterAgents: re,
						personas: ae,
						definitions: se
					} : r,
					selection: N,
					events: D,
					alerts: T ? e.alerts : w,
					meta: {
						...e.meta,
						resources: ne,
						simTimeMs: t.nowMs,
						simStartMs: e.meta.simStartMs === 0 ? t.nowMs - t.tickIndex * 250 : e.meta.simStartMs,
						tickIndex: t.tickIndex,
						connection: a.connected ? "connected" : e.meta.connection,
						paused: t.paused,
						movingCards: O,
						moveSeq: k,
						memoryPulses: M,
						pulseSeq: j,
						eventSeq: E
					}
				};
			});
		},
		select(t) {
			e((e) => ({ selection: {
				...e.selection,
				ids: [...t]
			} }));
		},
		clickSelect(t, n) {
			e((e) => ({ selection: {
				...e.selection,
				ids: zn(e.selection.ids, t, n)
			} }));
		},
		clearSelection() {
			e((e) => e.selection.ids.length === 0 ? e : { selection: {
				...e.selection,
				ids: []
			} });
		},
		escape() {
			let n = t();
			if (n.meta.ideTaskId !== null) {
				e({ meta: {
					...n.meta,
					ideTaskId: null
				} });
				return;
			}
			if (n.meta.cardEditorTaskId !== null) {
				e({ meta: {
					...n.meta,
					cardEditorTaskId: null
				} });
				return;
			}
			if (n.meta.runsOpen) {
				e({ meta: {
					...n.meta,
					runsOpen: !1,
					runsFocusRunId: null
				} });
				return;
			}
			if (n.meta.registryOpen) {
				e({ meta: {
					...n.meta,
					registryOpen: !1,
					registryStackRef: null
				} });
				return;
			}
			if (n.meta.foundryOpen) {
				e({ meta: {
					...n.meta,
					foundryOpen: !1
				} });
				return;
			}
			if (n.meta.archiveOpen) {
				e({ meta: {
					...n.meta,
					archiveOpen: !1
				} });
				return;
			}
			if (n.meta.reviewTaskId !== null) {
				e({ meta: {
					...n.meta,
					reviewTaskId: null
				} });
				return;
			}
			if (n.meta.steerOpen) {
				e({ meta: {
					...n.meta,
					steerOpen: !1
				} });
				return;
			}
			if (n.meta.inspectorUnitId !== null || n.meta.inspectorTaskId !== null) {
				e({ meta: {
					...n.meta,
					inspectorUnitId: null,
					inspectorTaskId: null
				} });
				return;
			}
			t().clearSelection();
		},
		jumpToLatestAlert() {
			let n = t(), r = n.alerts[n.alerts.length - 1];
			if (r === void 0) return;
			let i = n.board.cards[String(r.payload.taskId ?? "")]?.id ?? n.world.units[r.unitId]?.view.taskId ?? null ?? (n.world.units[r.unitId] === void 0 ? null : r.unitId);
			i !== null && e({ selection: {
				...n.selection,
				ids: [i]
			} });
		},
		setViewport(t) {
			e((e) => e.meta.viewport.width === t.width && e.meta.viewport.height === t.height ? e : { meta: {
				...e.meta,
				viewport: t
			} });
		},
		openInspector(t) {
			e((e) => {
				let n = e.meta.inspectorUnitId !== null || e.meta.inspectorTaskId !== null ? e.meta.inspectorTab : "transcript";
				return { meta: {
					...e.meta,
					inspectorUnitId: t,
					inspectorTaskId: null,
					inspectorTab: n,
					reviewTaskId: null
				} };
			});
		},
		openInspectorCard(t) {
			e((e) => {
				let n = e.meta.inspectorUnitId !== null || e.meta.inspectorTaskId !== null, r = e.board.cards[t], i = kn(r?.view.column, r?.view.agentIds.length ?? 0), a = n && On.has(e.meta.inspectorTab) ? e.meta.inspectorTab : i;
				return { meta: {
					...e.meta,
					inspectorUnitId: null,
					inspectorTaskId: t,
					inspectorTab: a,
					reviewTaskId: null
				} };
			});
		},
		openInspectorSessions(t) {
			e((e) => ({ meta: {
				...e.meta,
				inspectorUnitId: null,
				inspectorTaskId: t,
				inspectorTab: "sessions",
				reviewTaskId: null
			} }));
		},
		openRegistryStack(t) {
			e((e) => ({ meta: {
				...e.meta,
				registryOpen: !0,
				registryStackRef: t
			} }));
		},
		openRegistry() {
			e((e) => ({ meta: {
				...e.meta,
				registryOpen: !0,
				registryStackRef: null
			} }));
		},
		closeRegistry() {
			e((e) => ({ meta: {
				...e.meta,
				registryOpen: !1,
				registryStackRef: null
			} }));
		},
		openRunsAt(t) {
			e((e) => ({ meta: {
				...e.meta,
				runsOpen: !0,
				runsFocusRunId: t
			} }));
		},
		openFoundryStacks() {
			e((e) => ({ meta: {
				...e.meta,
				foundryOpen: !0,
				foundryTab: "stacks",
				registryOpen: !1,
				registryStackRef: null
			} }));
		},
		closeInspector() {
			e((e) => ({ meta: {
				...e.meta,
				inspectorUnitId: null,
				inspectorTaskId: null
			} }));
		},
		setInspectorTab(t) {
			e((e) => e.meta.inspectorTab === t ? e : { meta: {
				...e.meta,
				inspectorTab: t
			} });
		},
		pulseDock() {
			e((e) => ({ meta: {
				...e.meta,
				dockPulse: e.meta.dockPulse + 1
			} }));
		},
		recordResolvedInquiry(t) {
			e((e) => {
				let n = e.board.resolvedInquiries[t.unitId] ?? [];
				return n.some((e) => e.hookRequestId === t.hookRequestId) ? e : { board: {
					...e.board,
					resolvedInquiries: {
						...e.board.resolvedInquiries,
						[t.unitId]: [...n, t].slice(-12)
					}
				} };
			});
		},
		openReview(t) {
			e((e) => ({ meta: {
				...e.meta,
				reviewTaskId: t
			} }));
		},
		closeReview() {
			e((e) => ({ meta: {
				...e.meta,
				reviewTaskId: null
			} }));
		},
		openCardEditor(t) {
			e((e) => ({ meta: {
				...e.meta,
				cardEditorTaskId: t
			} }));
		},
		closeCardEditor() {
			e((e) => ({ meta: {
				...e.meta,
				cardEditorTaskId: null
			} }));
		},
		openSteer() {
			e((e) => ({ meta: {
				...e.meta,
				steerOpen: !0
			} }));
		},
		closeSteer() {
			e((e) => ({ meta: {
				...e.meta,
				steerOpen: !1
			} }));
		},
		openFoundry() {
			e((e) => ({ meta: {
				...e.meta,
				foundryOpen: !0,
				foundryTab: "commission"
			} }));
		},
		closeFoundry() {
			e((e) => ({ meta: {
				...e.meta,
				foundryOpen: !1
			} }));
		},
		openArchive() {
			e((e) => ({ meta: {
				...e.meta,
				archiveOpen: !0,
				archiveFocusId: null
			} }));
		},
		closeArchive() {
			e((e) => ({ meta: {
				...e.meta,
				archiveOpen: !1,
				archiveFocusId: null
			} }));
		},
		openArchiveAt(t) {
			e((e) => ({ meta: {
				...e.meta,
				archiveOpen: !0,
				archiveFocusId: t,
				inspectorUnitId: null,
				inspectorTaskId: null
			} }));
		},
		openRuns() {
			e((e) => ({ meta: {
				...e.meta,
				runsOpen: !0,
				runsFocusRunId: null
			} }));
		},
		closeRuns() {
			e((e) => ({ meta: {
				...e.meta,
				runsOpen: !1,
				runsFocusRunId: null
			} }));
		},
		openIde(t) {
			e((e) => ({ meta: {
				...e.meta,
				ideTaskId: t
			} }));
		},
		closeIde() {
			e((e) => ({ meta: {
				...e.meta,
				ideTaskId: null
			} }));
		},
		clearMoving(t) {
			e((e) => {
				if (e.meta.movingCards[t] === void 0) return e;
				let n = { ...e.meta.movingCards };
				return delete n[t], { meta: {
					...e.meta,
					movingCards: n
				} };
			});
		},
		setMemory(t) {
			e((e) => ({ board: {
				...e.board,
				memory: t
			} }));
		},
		setPaused(t) {
			e((e) => e.meta.paused === t ? e : { meta: {
				...e.meta,
				paused: t
			} });
		},
		setSimSpeed(t) {
			e((e) => e.meta.speed === t ? e : { meta: {
				...e.meta,
				speed: t
			} });
		},
		pushEvent(t, n, r) {
			e((e) => {
				let i = e.meta.eventSeq + 1, a = {
					id: `evt-${i}`,
					ts: e.meta.simTimeMs,
					severity: n,
					text: t,
					...r === void 0 ? {} : { entityId: r }
				};
				return {
					events: [...e.events, a].slice(-2e3),
					meta: {
						...e.meta,
						eventSeq: i
					}
				};
			});
		}
	}));
}
function $n(e, t) {
	let n = t.sim, r = [], i = !1, a = !1, o = -1, s = () => {
		if (a || r.length === 0 && n.tickIndex === o) return;
		let t = r;
		r = [], o = n.tickIndex;
		let i = n.listCardViews(), s = {};
		for (let e of i) {
			if (e.agentIds.length === 0) continue;
			let t = n.getRunObservation(e.taskId);
			s[e.taskId] = t?.phases.find((e) => e.status === "current")?.label ?? null;
		}
		e.getState().commitTick({
			frames: t,
			units: n.listUnitViews(),
			tasks: n.listTaskViews(),
			hooks: n.listPendingHooks(),
			cards: i,
			agents: n.listActiveAgentViews(),
			inquiries: n.listInquiries(),
			runStages: s,
			rosterAgents: n.listRosterAgents(),
			personas: n.listPersonas(),
			definitions: n.listDefinitions(),
			nowMs: n.now(),
			tickIndex: n.tickIndex,
			paused: n.paused
		});
	}, c = t.onFrame((e) => {
		r.push(e), i || (i = !0, queueMicrotask(() => {
			i = !1, s();
		}));
	});
	return e.getState().setMemory({
		silos: n.listMemorySilos(),
		records: n.listMemoryRecords()
	}), s(), {
		flush: s,
		orders: {
			abort(n) {
				let r = e.getState(), i = n.filter((e) => r.world.units[e]?.view.runId !== null);
				for (let e of i) t.send({
					type: "session.message",
					sessionId: e,
					prompt: "/abort"
				});
				s();
			},
			steer(e, n) {
				for (let r of e) t.send({
					type: "session.message",
					sessionId: r,
					prompt: n
				});
				s();
			},
			decide(e, n) {
				t.send({
					type: "hook.decision",
					hookRequestId: e,
					decision: n
				}), s();
			},
			pauseUnits(e) {
				for (let t of e) n.pauseUnit(t);
				s();
			},
			resumeUnits(e) {
				for (let t of e) n.resumeUnit(t);
				s();
			},
			prioritize(e) {
				n.prioritizeTask(e), s();
			},
			toggleSim() {
				n.paused ? (n.resume(), e.getState().setPaused(!1), e.getState().pushEvent("Simulation resumed", "info")) : (n.pause(), e.getState().setPaused(!0), e.getState().pushEvent("Simulation paused", "info"));
			},
			moveCard(t, r) {
				let i = e.getState().board.cards[t]?.view.title ?? t;
				n.moveCard(t, r) && e.getState().pushEvent(`Card order — ${i} moved to ${r.toUpperCase()}`, "info", t), s();
			},
			setYolo(t, r) {
				let i = e.getState().board.cards[t]?.view.title ?? t;
				n.setYolo(t, r) && e.getState().pushEvent(r ? `Yolo flag raised — ${i} will auto-approve on review pass` : `Yolo flag struck — ${i} returns to human review`, "warn", t), s();
			},
			createTask(t) {
				let r = n.createTask(t);
				return s(), r !== null && e.getState().pushEvent(`Commissioned — ${t.taskKind} task ${r} enters the backlog`, "info", r), r;
			},
			answerInquiry(e, n) {
				t.send({
					type: "hook.decision",
					hookRequestId: e,
					decision: "allow",
					...n === null ? {} : { optionId: n }
				}), s();
			},
			revertCard(e) {
				n.revertCard(e), s();
			},
			release() {
				let e = n.release();
				return s(), e;
			},
			rollbackCard(e) {
				n.rollbackCard(e), s();
			},
			setSpeed(t) {
				let r = n.setSpeed(t);
				return r && (e.getState().setSimSpeed(t), e.getState().pushEvent(`Cogitator pacing — ${t}x`, "info")), r;
			},
			updateTask(e, t) {
				let r = n.updateTask(e, t);
				return s(), r;
			},
			upsertStack(e) {
				let t = n.upsertStack(e);
				return s(), t;
			},
			upsertDefinition() {
				return null;
			},
			createAgentIdentity() {
				return null;
			},
			updateProcessTemplate(e, t) {
				let r = n.updateProcessTemplate(e, t);
				return s(), r;
			},
			writeFile(e, t, r) {
				let i = n.writeFile(e, t, r);
				return s(), i;
			},
			createRosterAgent(t) {
				let r = n.createRosterAgent(t);
				return s(), r !== null && e.getState().pushEvent(`Agent recruited — ${t.role} ${r} joins the roster`, "info"), r;
			},
			deleteRosterAgent(t) {
				n.deleteRosterAgent(t), s(), e.getState().pushEvent(`Agent released — ${t} departs the roster`, "info");
			},
			assignTaskAgent(t, r, i) {
				n.assignTaskAgent(t, r, i), s();
				let a = e.getState().board.cards[t]?.view.title ?? t, o = i === null ? `Unassigned ${r} from ${a}` : `Assigned ${i} as ${r} to ${a}`;
				e.getState().pushEvent(o, "info", t);
			},
			assignTaskHuman(t, r) {
				n.assignTaskHuman(t, r), s();
				let i = e.getState().board.cards[t]?.view.title ?? t;
				e.getState().pushEvent(r ? `Human review assigned to ${i}` : `Human review unassigned from ${i}`, "info", t);
			},
			focusInquiryCard(t) {
				let n = e.getState(), r = n.board.cards[t];
				r && (r.view.column === "human-review" ? n.openReview(t) : (n.openInspectorCard(t), n.setInspectorTab("transcript")));
			}
		},
		dispose() {
			a = !0, c();
		}
	};
}
//#endregion
//#region src/components/hud/SelectionPanel.tsx
var er = 5, tr = {
	idle: "IDLE",
	dispatching: "MOVING",
	thinking: "THINKING",
	tool_running: "TOOLING",
	awaiting_approval: "NEEDS OK",
	blocked: "BLOCKED",
	completed: "DONE",
	failed: "FAILED"
};
function nr(e) {
	return tr[e] ?? e.replace(/_/g, " ").toUpperCase();
}
function rr(e, t, n) {
	e.getState().clickSelect(t, n);
}
function ir({ turnCount: e }) {
	let t = Math.min(er, e);
	return /* @__PURE__ */ l("span", {
		className: "wr-rank",
		title: `${e} turns served`,
		"aria-label": `rank ${t}`,
		children: Array.from({ length: er }, (e, n) => /* @__PURE__ */ l("span", { className: V("wr-rank-chevron", n < t && "is-earned") }, n))
	});
}
function ar({ store: e, unit: t }) {
	let n = t.view.taskId, r = B(e, (e) => n === null ? void 0 : e.world.tasks[n]);
	return /* @__PURE__ */ u("div", {
		className: "wr-sel-single",
		children: [
			/* @__PURE__ */ l("div", {
				className: "wr-sel-portrait",
				dangerouslySetInnerHTML: { __html: R({
					entityId: t.id,
					kind: "unit",
					adapter: t.view.agent
				}).svg }
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-sel-info",
				children: [
					/* @__PURE__ */ l("div", {
						className: "wr-sel-name",
						children: t.view.title
					}),
					/* @__PURE__ */ u("div", {
						className: "wr-sel-sub",
						children: [/* @__PURE__ */ l("span", {
							className: `wr-sel-adapter wr-faction-text--${t.view.agent}`,
							children: t.view.agent
						}), /* @__PURE__ */ l("span", {
							className: "wr-sel-model",
							children: t.view.model
						})]
					}),
					/* @__PURE__ */ u("div", {
						className: "wr-sel-staterow",
						children: [/* @__PURE__ */ l("span", {
							className: `wr-sel-state wr-sel-state--${t.view.state}`,
							children: t.view.state
						}), t.view.paused && /* @__PURE__ */ l("span", {
							className: "wr-sel-paused",
							children: "paused"
						})]
					}),
					n !== null && /* @__PURE__ */ u("button", {
						type: "button",
						className: "wr-sel-tasklink",
						title: "Select the assigned objective",
						onClick: (t) => rr(e, n, t.shiftKey),
						children: ["› ", r?.view.title ?? n]
					})
				]
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-sel-vitals",
				children: [
					/* @__PURE__ */ u("div", {
						className: "wr-vital",
						children: [
							/* @__PURE__ */ l("span", {
								className: "wr-vital-label",
								children: "CTX"
							}),
							/* @__PURE__ */ l("div", {
								className: "wr-bar wr-bar--health",
								children: /* @__PURE__ */ l("div", {
									className: "wr-bar-fill",
									style: { width: y(1 - t.contextPct) }
								})
							}),
							/* @__PURE__ */ l("span", {
								className: "wr-vital-value",
								children: y(1 - t.contextPct)
							})
						]
					}),
					/* @__PURE__ */ u("div", {
						className: "wr-vital",
						children: [
							/* @__PURE__ */ l("span", {
								className: "wr-vital-label",
								children: "BUDGET"
							}),
							/* @__PURE__ */ l("div", {
								className: "wr-bar wr-bar--energy",
								children: /* @__PURE__ */ l("div", {
									className: "wr-bar-fill",
									style: { width: y(t.energyPct) }
								})
							}),
							/* @__PURE__ */ u("span", {
								className: "wr-vital-value",
								title: `${v(t.view.cost.totalUsd)} of ${v(Ln)} spent`,
								children: [v(Ln * t.energyPct), " left"]
							})
						]
					}),
					/* @__PURE__ */ u("div", {
						className: "wr-vital",
						children: [
							/* @__PURE__ */ l("span", {
								className: "wr-vital-label",
								children: "TURNS"
							}),
							/* @__PURE__ */ l(ir, { turnCount: t.view.turnCount }),
							/* @__PURE__ */ l("span", {
								className: "wr-vital-value",
								children: _(t.view.turnCount)
							})
						]
					})
				]
			})
		]
	});
}
function or({ store: e, units: t }) {
	return /* @__PURE__ */ l("div", {
		className: "wr-sel-grid",
		children: t.map((t) => {
			let n = R({
				entityId: t.id,
				kind: "unit",
				adapter: t.view.agent
			});
			return /* @__PURE__ */ u("button", {
				type: "button",
				className: `wr-sel-card wr-sel-card--${t.view.state}`,
				title: `${t.view.title} (${t.view.state}) — click to select only this unit`,
				onClick: (n) => rr(e, t.id, n.shiftKey),
				children: [
					/* @__PURE__ */ l("div", {
						className: "wr-sel-card-portrait",
						dangerouslySetInnerHTML: { __html: n.svg }
					}),
					/* @__PURE__ */ l("div", {
						className: "wr-sel-card-name",
						children: t.view.title
					}),
					/* @__PURE__ */ u("div", {
						className: "wr-sel-card-state",
						children: [nr(t.view.state), t.view.paused && /* @__PURE__ */ l("span", {
							className: "wr-sel-paused",
							children: "paused"
						})]
					})
				]
			}, t.id);
		})
	});
}
function sr({ store: e, views: t, task: n }) {
	let r = B(e, (e) => e.world.units), i = B(e, (e) => e.board.cards[n.id]?.runStage ?? null);
	B(e, (e) => e.meta.tickIndex);
	let a = t.listSessions(n.id).find((e) => e.status === "active");
	return /* @__PURE__ */ u("div", {
		className: "wr-sel-single",
		children: [
			/* @__PURE__ */ l("div", {
				className: "wr-sel-portrait",
				dangerouslySetInnerHTML: { __html: R({
					entityId: n.id,
					kind: "task",
					taskKind: n.view.taskKind
				}).svg }
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-sel-info",
				children: [
					/* @__PURE__ */ l("div", {
						className: "wr-sel-name",
						children: n.view.title
					}),
					/* @__PURE__ */ u("div", {
						className: "wr-sel-sub",
						children: [
							/* @__PURE__ */ l("span", { children: n.view.taskKind }),
							/* @__PURE__ */ l("span", { children: n.view.repository }),
							/* @__PURE__ */ l("span", {
								className: "wr-sel-phase",
								children: n.view.phase
							})
						]
					}),
					/* @__PURE__ */ u("div", {
						className: "wr-sel-staterow",
						children: [
							/* @__PURE__ */ l("span", {
								className: `wr-sel-state wr-sel-state--task-${n.view.state}`,
								children: n.view.state
							}),
							i !== null && /* @__PURE__ */ l("span", {
								className: "wr-sel-stage",
								"data-testid": "sel-stage",
								title: "current process stage",
								children: i
							}),
							n.view.priority > 0 && /* @__PURE__ */ l("span", {
								className: "wr-sel-priority",
								children: "priority"
							}),
							/* @__PURE__ */ l("button", {
								type: "button",
								className: "wr-sel-edit",
								title: "Open the card editor (§V4-5)",
								onClick: () => e.getState().openCardEditor(n.id),
								children: "EDIT CARD"
							})
						]
					}),
					a !== void 0 && /* @__PURE__ */ u("div", {
						className: "wr-sel-agentline",
						children: [/* @__PURE__ */ u("button", {
							type: "button",
							"data-testid": "sel-session-link",
							className: "wr-sel-entitylink",
							title: `${a.creatureName} — session of ${a.stackName}`,
							onClick: () => e.getState().openInspectorSessions(n.id),
							children: [a.creatureName, " · view session"]
						}), /* @__PURE__ */ u("button", {
							type: "button",
							"data-testid": "sel-stack-link",
							className: "wr-sel-entitylink wr-sel-entitylink--stack",
							title: `open the agent stack "${a.stackName}" in the Registry (§V5-4)`,
							onClick: () => e.getState().openRegistryStack(a.stackRef),
							children: [a.stackName, " · view stack"]
						})]
					})
				]
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-sel-vitals",
				children: [/* @__PURE__ */ u("div", {
					className: "wr-vital",
					children: [
						/* @__PURE__ */ l("span", {
							className: "wr-vital-label",
							children: "PROGRESS"
						}),
						/* @__PURE__ */ l("div", {
							className: "wr-bar wr-bar--progress",
							children: /* @__PURE__ */ l("div", {
								className: "wr-bar-fill",
								style: { width: y(n.view.progress) }
							})
						}),
						/* @__PURE__ */ l("span", {
							className: "wr-vital-value",
							children: y(n.view.progress)
						})
					]
				}), /* @__PURE__ */ u("div", {
					className: "wr-vital wr-vital--assignees",
					children: [/* @__PURE__ */ l("span", {
						className: "wr-vital-label",
						children: "ASSIGNEES"
					}), n.view.assigneeIds.length === 0 ? /* @__PURE__ */ l("span", {
						className: "wr-vital-value",
						children: "none"
					}) : /* @__PURE__ */ l("span", {
						className: "wr-sel-assignees",
						children: n.view.assigneeIds.map((t) => /* @__PURE__ */ l("button", {
							type: "button",
							className: "wr-sel-assignee",
							title: "Select this unit",
							onClick: (n) => rr(e, t, n.shiftKey),
							children: r[t]?.view.title ?? t
						}, t))
					})]
				})]
			})
		]
	});
}
function cr({ store: e, views: t }) {
	let { units: n, tasks: r } = d({
		world: B(e, (e) => e.world),
		selection: B(e, (e) => e.selection)
	}), i = n.length + r.length, a;
	if (i === 0) a = /* @__PURE__ */ l("div", {
		className: "wr-sel-empty",
		children: "no selection — click a unit or drag a marquee"
	});
	else if (n.length === 1 && r.length === 0) {
		let t = n[0];
		a = t === void 0 ? /* @__PURE__ */ l("div", {}) : /* @__PURE__ */ l(ar, {
			store: e,
			unit: t
		});
	} else if (n.length > 1 && r.length === 0) a = /* @__PURE__ */ l(or, {
		store: e,
		units: n
	});
	else if (r.length === 1 && n.length === 0) {
		let n = r[0];
		a = n === void 0 ? /* @__PURE__ */ l("div", {}) : /* @__PURE__ */ l(sr, {
			store: e,
			views: t,
			task: n
		});
	} else a = /* @__PURE__ */ u("div", {
		className: "wr-sel-mixed",
		children: [/* @__PURE__ */ l(or, {
			store: e,
			units: n
		}), r.map((n) => /* @__PURE__ */ l(sr, {
			store: e,
			views: t,
			task: n
		}, n.id))]
	});
	return /* @__PURE__ */ u("section", {
		className: "wr-panel wr-selection",
		"data-testid": "selection-panel",
		"aria-label": "Selection",
		children: [/* @__PURE__ */ u("div", {
			className: "wr-panel-title",
			children: ["SELECTION", i > 0 && /* @__PURE__ */ l("span", {
				className: "wr-panel-count",
				children: i
			})]
		}), a]
	});
}
//#endregion
//#region src/components/hud/TopBar.tsx
function lr(e) {
	return St[(St.indexOf(e) + 1 + St.length) % St.length];
}
function ur({ text: e }) {
	return /* @__PURE__ */ l("span", {
		className: "wr-stat-num",
		children: e
	}, e);
}
function dr({ store: e, orders: t }) {
	let n = B(e, (e) => e.meta), r = n.resources;
	return /* @__PURE__ */ u("header", {
		className: "wr-topbar",
		"data-testid": "topbar",
		children: [
			/* @__PURE__ */ u("div", {
				className: "wr-topbar-logo",
				children: [
					"A5C ",
					/* @__PURE__ */ l("span", { children: "Commander" }),
					/* @__PURE__ */ l("em", {
						className: "wr-topbar-cogitator",
						children: "The Aegis Cogitator"
					})
				]
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-topbar-stats",
				children: [
					/* @__PURE__ */ u("div", {
						className: "wr-stat",
						"data-testid": "topbar-units",
						title: "Active agents / busy agents",
						children: [/* @__PURE__ */ l("span", {
							className: "wr-stat-label",
							children: "AGENTS"
						}), /* @__PURE__ */ u("span", {
							className: "wr-stat-value",
							children: [/* @__PURE__ */ l(ur, { text: _(r.unitCount) }), /* @__PURE__ */ u("em", { children: [
								"/",
								/* @__PURE__ */ l(ur, { text: _(r.busyCount) }),
								" busy"
							] })]
						})]
					}),
					/* @__PURE__ */ u("div", {
						className: "wr-stat",
						"data-testid": "topbar-tokens",
						title: "Total tokens burned by the fleet",
						children: [/* @__PURE__ */ l("span", {
							className: "wr-stat-label",
							children: "TOKENS"
						}), /* @__PURE__ */ l("span", {
							className: "wr-stat-value",
							children: /* @__PURE__ */ l(ur, { text: _(r.tokensBurned) })
						})]
					}),
					/* @__PURE__ */ u("div", {
						className: "wr-stat",
						"data-testid": "topbar-tasks",
						title: "Objectives done / total",
						children: [/* @__PURE__ */ l("span", {
							className: "wr-stat-label",
							children: "OBJECTIVES"
						}), /* @__PURE__ */ u("span", {
							className: "wr-stat-value",
							children: [
								/* @__PURE__ */ l(ur, { text: _(r.tasksDone) }),
								"/",
								/* @__PURE__ */ l(ur, { text: _(r.tasksTotal) })
							]
						})]
					}),
					/* @__PURE__ */ u("div", {
						className: `wr-stat${r.alertCount > 0 ? " wr-stat--alert" : ""}`,
						"data-testid": "topbar-alerts",
						title: "Pending approvals",
						children: [/* @__PURE__ */ l("span", {
							className: "wr-stat-label",
							children: "ALERTS"
						}), /* @__PURE__ */ l("span", {
							className: "wr-stat-value",
							children: /* @__PURE__ */ l(ur, { text: _(r.alertCount) })
						})]
					})
				]
			}),
			/* @__PURE__ */ l("button", {
				type: "button",
				className: "wr-sim-toggle",
				"data-testid": "topbar-memory",
				title: "Open the Archive — the company brain (M)",
				onClick: () => {
					n.archiveOpen ? e.getState().closeArchive() : e.getState().openArchive();
				},
				children: "ARCHIVE"
			}),
			/* @__PURE__ */ l("button", {
				type: "button",
				className: "wr-sim-toggle",
				"data-testid": "topbar-runs",
				title: "Open the Runs Ledger — every rite of the cogitator (§V4-6)",
				onClick: () => {
					n.runsOpen ? e.getState().closeRuns() : e.getState().openRuns();
				},
				children: "RUNS"
			}),
			/* @__PURE__ */ l("button", {
				type: "button",
				className: "wr-sim-toggle",
				"data-testid": "topbar-registry",
				title: "Open the Registry — stacks, agents, tasks and workspaces (§V5-3)",
				onClick: () => {
					n.registryOpen ? e.getState().closeRegistry() : e.getState().openRegistry();
				},
				children: "REGISTRY"
			}),
			/* @__PURE__ */ l("button", {
				type: "button",
				className: "wr-sim-toggle",
				"data-testid": "topbar-create",
				title: "Open the Foundry — commission a task (N)",
				onClick: () => {
					n.foundryOpen ? e.getState().closeFoundry() : e.getState().openFoundry();
				},
				children: "FOUNDRY"
			}),
			/* @__PURE__ */ u("button", {
				type: "button",
				className: "wr-sim-toggle wr-speed-control",
				"data-testid": "topbar-speed",
				title: `Cogitator pacing — ${n.speed}x (click to cycle 0.5x / 1x / 2x, §V4-4)`,
				onClick: () => t.setSpeed(lr(n.speed)),
				children: [n.speed, "x"]
			}),
			/* @__PURE__ */ l("button", {
				type: "button",
				className: `wr-sim-toggle${n.paused ? " wr-sim-toggle--paused" : ""}`,
				"data-testid": "topbar-sim-toggle",
				title: n.paused ? "Resume the simulation clock" : "Pause the simulation clock",
				onClick: () => t.toggleSim(),
				children: n.paused ? "RESUME" : "PAUSE"
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-topbar-clock",
				"data-testid": "topbar-clock",
				title: "Sim clock",
				children: [g(n.simTimeMs, n.simStartMs), n.paused && /* @__PURE__ */ l("span", {
					className: "wr-clock-paused",
					children: "PAUSED"
				})]
			})
		]
	});
}
//#endregion
//#region src/game/cardEditor.ts
function fr(e) {
	return {
		title: e.title,
		taskKind: e.taskKind,
		description: e.description,
		yolo: e.yolo,
		parentId: e.parentId ?? "",
		workspaceId: e.workspaceId,
		stackRef: e.stackRef
	};
}
function pr(e) {
	return e.column === "backlog";
}
function mr(e, t) {
	return t.filter((t) => t.taskId !== e && t.column === "backlog" && t.parentId === null).map((e) => e.taskId);
}
function hr(e) {
	return [...new Set(e.map((e) => e.workspaceId))].sort();
}
function gr(e, t) {
	let n = {}, r = t.title.trim();
	r !== "" && r !== e.title && (n.title = r), t.taskKind !== e.taskKind && (n.taskKind = t.taskKind), t.description !== e.description && (n.description = t.description), t.yolo !== e.yolo && (n.yolo = t.yolo);
	let i = t.parentId === "" ? null : t.parentId;
	return pr(e) && i !== e.parentId && (n.parentId = i), t.workspaceId !== e.workspaceId && (n.workspaceId = t.workspaceId), t.stackRef !== e.stackRef && (n.stackRef = t.stackRef), n;
}
function _r(e) {
	return Object.keys(e).length === 0;
}
//#endregion
//#region src/components/panels/CardEditor.tsx
function vr({ store: e, orders: t, views: n, card: r }) {
	let i = B(e, (e) => e.board.cards), a = B(e, (e) => e.board.cardIds), [s, c] = o(() => fr(r.view)), d = a.map((e) => i[e]?.view).filter((e) => e !== void 0), f = mr(r.id, d), p = hr(d), m = n.listStacks(), h = pr(r.view), g = () => e.getState().closeCardEditor();
	return /* @__PURE__ */ l("div", {
		className: "wr-modal-backdrop",
		"data-testid": "card-editor",
		onKeyDown: (e) => {
			e.key === "Escape" && (e.stopPropagation(), g());
		},
		children: /* @__PURE__ */ u("div", {
			className: "wr-modal wr-foundry wr-card-editor",
			role: "dialog",
			"aria-label": "Card editor",
			children: [
				/* @__PURE__ */ u("div", {
					className: "wr-panel-title",
					children: ["CARD EDITOR — ", r.id.toUpperCase()]
				}),
				/* @__PURE__ */ u("label", {
					className: "wr-foundry-field",
					children: [/* @__PURE__ */ l("span", {
						className: "wr-foundry-label",
						children: "title"
					}), /* @__PURE__ */ l("input", {
						className: "wr-foundry-input",
						type: "text",
						value: s.title,
						onChange: (e) => c({
							...s,
							title: e.target.value
						})
					})]
				}),
				/* @__PURE__ */ u("label", {
					className: "wr-foundry-field",
					children: [/* @__PURE__ */ l("span", {
						className: "wr-foundry-label",
						children: "task kind"
					}), /* @__PURE__ */ l("select", {
						className: "wr-foundry-input",
						value: s.taskKind,
						onChange: (e) => c({
							...s,
							taskKind: e.target.value
						}),
						children: U.map((e) => /* @__PURE__ */ l("option", {
							value: e,
							children: e
						}, e))
					})]
				}),
				/* @__PURE__ */ u("label", {
					className: "wr-foundry-field",
					children: [/* @__PURE__ */ l("span", {
						className: "wr-foundry-label",
						children: "description"
					}), /* @__PURE__ */ l("textarea", {
						className: "wr-foundry-input wr-card-editor-desc",
						rows: 3,
						value: s.description,
						onChange: (e) => c({
							...s,
							description: e.target.value
						})
					})]
				}),
				/* @__PURE__ */ u("div", {
					className: "wr-foundry-field",
					children: [/* @__PURE__ */ l("span", {
						className: "wr-foundry-label",
						children: "yolo posture"
					}), /* @__PURE__ */ u("button", {
						type: "button",
						role: "switch",
						"aria-checked": s.yolo,
						className: V("wr-card-editor-yolo", s.yolo && "is-on"),
						onClick: () => c({
							...s,
							yolo: !s.yolo
						}),
						children: [/* @__PURE__ */ l("span", {
							className: "wr-yolo-lever",
							"aria-hidden": !0,
							children: /* @__PURE__ */ l("span", { className: "wr-yolo-lever-knob" })
						}), /* @__PURE__ */ u("span", {
							className: "wr-yolo-caption",
							children: ["yolo ", s.yolo ? "engaged — auto-approve on review pass" : "off — human review stands"]
						})]
					})]
				}),
				/* @__PURE__ */ u("label", {
					className: "wr-foundry-field",
					children: [/* @__PURE__ */ u("span", {
						className: "wr-foundry-label",
						children: ["parent task", h ? "" : " (locked — backlog only)"]
					}), /* @__PURE__ */ u("select", {
						className: "wr-foundry-input",
						value: s.parentId,
						disabled: !h,
						onChange: (e) => c({
							...s,
							parentId: e.target.value
						}),
						children: [/* @__PURE__ */ l("option", {
							value: "",
							children: "— none —"
						}), f.map((e) => /* @__PURE__ */ l("option", {
							value: e,
							children: i[e]?.view.title ?? e
						}, e))]
					})]
				}),
				/* @__PURE__ */ u("label", {
					className: "wr-foundry-field",
					children: [/* @__PURE__ */ l("span", {
						className: "wr-foundry-label",
						children: "workspace"
					}), /* @__PURE__ */ l("select", {
						className: "wr-foundry-input",
						value: s.workspaceId,
						onChange: (e) => c({
							...s,
							workspaceId: e.target.value
						}),
						children: p.map((e) => /* @__PURE__ */ l("option", {
							value: e,
							children: e
						}, e))
					})]
				}),
				/* @__PURE__ */ u("label", {
					className: "wr-foundry-field",
					children: [/* @__PURE__ */ l("span", {
						className: "wr-foundry-label",
						children: "agent stack"
					}), /* @__PURE__ */ l("select", {
						className: "wr-foundry-input",
						value: s.stackRef,
						onChange: (e) => c({
							...s,
							stackRef: e.target.value
						}),
						children: m.map((e) => /* @__PURE__ */ u("option", {
							value: e.stackRef,
							children: [
								e.name,
								" — ",
								e.stack.spec.adapter,
								e.custom ? ` (${e.stackRef})` : ""
							]
						}, e.stackRef))
					})]
				}),
				/* @__PURE__ */ l("div", {
					className: "wr-modal-hint",
					children: "saves only the changed fields · Esc to discard"
				}),
				/* @__PURE__ */ u("div", {
					className: "wr-modal-actions",
					children: [/* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-alert-btn",
						onClick: g,
						children: "Cancel"
					}), /* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-alert-btn wr-alert-btn--approve",
						onClick: () => {
							let e = gr(r.view, s);
							_r(e) || t.updateTask(r.id, e), g();
						},
						children: "Save"
					})]
				})
			]
		})
	});
}
function yr({ store: e, orders: t, views: n }) {
	let r = B(e, (e) => e.meta.cardEditorTaskId), i = B(e, (e) => e.meta.cardEditorTaskId === null ? void 0 : e.board.cards[e.meta.cardEditorTaskId]);
	return r === null || i === void 0 ? null : /* @__PURE__ */ l(vr, {
		store: e,
		orders: t,
		views: n,
		card: i
	}, r);
}
//#endregion
//#region src/components/panels/GraphLayerPicker.tsx
function br({ label: e, kinds: t, selectedId: r, onSelect: i }) {
	let [a, s] = o(""), [c, d] = o([]), [f, p] = o("idle");
	return n(() => {
		let e = !1, n = encodeURIComponent(t.join(",")), r = a.trim() ? `/api/atlas/search?q=${encodeURIComponent(a.trim())}&kinds=${n}&limit=25` : `/api/atlas/search?mode=browse&kinds=${n}&limit=50`;
		p("loading");
		let i = setTimeout(() => {
			fetch(r).then((e) => e.ok ? e.json() : Promise.reject(Error(String(e.status)))).then((t) => {
				e || (d(Array.isArray(t.hits) ? t.hits : []), p("idle"));
			}).catch(() => {
				e || (d([]), p("error"));
			});
		}, a.trim() ? 250 : 0);
		return () => {
			e = !0, clearTimeout(i);
		};
	}, [a, t.join(",")]), /* @__PURE__ */ u("div", {
		className: "wr-graph-picker",
		"data-testid": `graph-picker-${e.toLowerCase()}`,
		children: [
			/* @__PURE__ */ l("span", {
				className: "wr-foundry-label",
				children: e
			}),
			/* @__PURE__ */ l("input", {
				className: "wr-foundry-input",
				type: "text",
				value: a,
				placeholder: `search ${e.toLowerCase()} in the graph…`,
				onChange: (e) => s(e.target.value)
			}),
			/* @__PURE__ */ u("ul", {
				className: "wr-graph-picker-results",
				role: "listbox",
				"aria-label": `${e} graph objects`,
				style: {
					maxHeight: "9rem",
					overflowY: "auto",
					margin: "0.25rem 0 0",
					padding: 0,
					listStyle: "none",
					border: "1px solid var(--border, #3a3a3a)",
					borderRadius: 4
				},
				children: [
					f === "loading" && /* @__PURE__ */ l("li", {
						className: "wr-graph-picker-note",
						children: "loading…"
					}),
					f === "error" && /* @__PURE__ */ l("li", {
						className: "wr-graph-picker-note",
						children: "graph unavailable"
					}),
					f === "idle" && c.length === 0 && /* @__PURE__ */ l("li", {
						className: "wr-graph-picker-note",
						children: "no graph objects found"
					}),
					c.map((e) => /* @__PURE__ */ l("li", { children: /* @__PURE__ */ u("button", {
						type: "button",
						className: `wr-graph-picker-item${r === e.id ? " is-selected" : ""}`,
						onClick: () => i(e),
						role: "option",
						"aria-selected": r === e.id,
						style: {
							display: "flex",
							justifyContent: "space-between",
							gap: "0.5rem",
							width: "100%",
							padding: "0.3rem 0.5rem",
							background: r === e.id ? "var(--accent, #c98a3e)" : "transparent",
							border: "none",
							color: "inherit",
							cursor: "pointer",
							fontSize: "0.8125rem",
							textAlign: "left"
						},
						children: [/* @__PURE__ */ l("span", {
							className: "wr-graph-picker-name",
							children: e.displayName
						}), /* @__PURE__ */ l("span", {
							className: "wr-graph-picker-kind",
							children: e.nodeKind
						})]
					}) }, `${e.nodeKind}:${e.id}`))
				]
			})
		]
	});
}
//#endregion
//#region src/game/stackForge.ts
var xr = [
	"prompt",
	"yolo",
	"deny"
];
function Sr(e) {
	return e ? e.split(",").map((e) => e.trim()).filter(Boolean) : [];
}
function Cr(e) {
	return (e ?? []).join(", ");
}
function wr() {
	return {
		stackRef: null,
		name: "",
		baseAgent: "claude-code",
		adapter: "claude-code",
		provider: "",
		model: H["claude-code"][0],
		approvalMode: "prompt",
		system: "",
		developer: "",
		serviceAccountRef: "",
		toolProfileRef: "",
		mcpServerRefs: "",
		cliToolRefs: "",
		skillRefs: "",
		subagentRefs: "",
		contextLabelRefs: "",
		workspacePolicyRef: "",
		runnerPool: "",
		roleBindings: "",
		secretGrants: "",
		configGrants: "",
		memoryRepositoryRefs: "",
		displayName: "",
		agentRole: ""
	};
}
function Tr(e) {
	let t = e.stack.spec;
	return {
		baseAgent: t.baseAgent,
		adapter: t.adapter,
		provider: t.provider ?? "",
		model: t.model,
		approvalMode: t.approvalMode,
		system: t.prompt.system,
		developer: t.prompt.developer ?? "",
		serviceAccountRef: t.runtimeIdentity?.serviceAccountRef ?? "",
		toolProfileRef: t.toolProfileRef ?? "",
		mcpServerRefs: Cr(t.externalTools?.mcpServerRefs),
		cliToolRefs: Cr(t.externalTools?.cliToolRefs),
		skillRefs: Cr(t.skillRefs),
		subagentRefs: Cr(t.subagentRefs),
		contextLabelRefs: Cr(t.contextLabelRefs),
		workspacePolicyRef: t.workspacePolicyRef ?? "",
		runnerPool: t.runnerPool ?? "",
		roleBindings: Cr(t.permissionRefs?.roleBindings),
		secretGrants: Cr(t.permissionRefs?.secretGrants),
		configGrants: Cr(t.permissionRefs?.configGrants),
		memoryRepositoryRefs: Cr(t.memoryRepositoryRefs),
		displayName: t.displayName ?? "",
		agentRole: Cr(t.agentRole?.refs)
	};
}
function Er(e) {
	return {
		stackRef: null,
		name: `${e.name} Mk II`,
		...Tr(e)
	};
}
function Dr(e) {
	return {
		stackRef: e.stackRef,
		name: e.name,
		...Tr(e)
	};
}
function Or(e, t) {
	let n = st.includes(t) ? t : null;
	return {
		...e,
		adapter: t,
		baseAgent: t,
		model: n === null ? e.model : H[n][0]
	};
}
function kr(e) {
	let t = e.name.trim();
	if (t === "") return null;
	let n = Sr(e.mcpServerRefs), r = Sr(e.cliToolRefs), i = Sr(e.skillRefs), a = Sr(e.subagentRefs), o = Sr(e.contextLabelRefs), s = Sr(e.memoryRepositoryRefs), c = Sr(e.roleBindings), l = Sr(e.secretGrants), u = Sr(e.configGrants), d = Sr(e.agentRole), f = {
		...n.length > 0 ? { mcpServerRefs: n } : {},
		...r.length > 0 ? { cliToolRefs: r } : {}
	}, p = {
		...c.length > 0 ? { roleBindings: c } : {},
		...l.length > 0 ? { secretGrants: l } : {},
		...u.length > 0 ? { configGrants: u } : {}
	};
	return {
		...e.stackRef === null ? {} : { stackRef: e.stackRef },
		metadata: { name: t },
		spec: {
			baseAgent: e.baseAgent,
			adapter: e.adapter,
			...e.provider.trim() === "" ? {} : { provider: e.provider.trim() },
			model: e.model,
			prompt: {
				system: e.system,
				...e.developer.trim() === "" ? {} : { developer: e.developer }
			},
			approvalMode: e.approvalMode,
			...e.serviceAccountRef.trim() === "" ? {} : { runtimeIdentity: { serviceAccountRef: e.serviceAccountRef.trim() } },
			...e.toolProfileRef.trim() === "" ? {} : { toolProfileRef: e.toolProfileRef.trim() },
			...Object.keys(f).length > 0 ? { externalTools: f } : {},
			...i.length > 0 ? { skillRefs: i } : {},
			...a.length > 0 ? { subagentRefs: a } : {},
			...o.length > 0 ? { contextLabelRefs: o } : {},
			...e.workspacePolicyRef.trim() === "" ? {} : { workspacePolicyRef: e.workspacePolicyRef.trim() },
			...e.runnerPool.trim() === "" ? {} : { runnerPool: e.runnerPool.trim() },
			...Object.keys(p).length > 0 ? { permissionRefs: p } : {},
			...s.length > 0 ? { memoryRepositoryRefs: s } : {},
			...e.displayName.trim() === "" ? {} : { displayName: e.displayName.trim() },
			...d.length > 0 ? { agentRole: { refs: d } } : {}
		},
		status: { phase: "ready" }
	};
}
function Ar(e, t = 90) {
	let n = e.trim();
	if (n === "") return "— no personality inscribed —";
	let r = (/^[^.!?]*[.!?]/.exec(n)?.[0] ?? n).trim();
	return r.length > t ? `${r.slice(0, t - 1)}…` : r;
}
//#endregion
//#region src/components/panels/Foundry.tsx
function jr(e, t) {
	let n = (e || "").split(",").map((e) => e.trim()).filter(Boolean);
	return !t || n.includes(t) ? e : [...n, t].join(", ");
}
var Mr = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><path d=\"M3 6.5 H17 C16.4 9.2 14.2 10.6 11.6 10.9 L11.6 13.2 H13.6 C14.3 13.2 14.8 13.7 14.8 14.4 V15.4 H5.2 V14.4 C5.2 13.7 5.7 13.2 6.4 13.2 H8.4 L8.4 10.9 C6.6 10.7 5.4 9.9 4.8 8.6 L3 8.2 Z\" fill=\"currentColor\"/></svg>";
function Nr({ store: e, orders: t }) {
	let n = B(e, (e) => e.board.cardIds), r = B(e, (e) => e.board.cards), [i, a] = o("implement"), [s, d] = o(""), [f, p] = o(""), m = n.filter((e) => r[e]?.view.parentId === null), h = pt[i], g = () => {
		t.createTask({
			taskKind: i,
			...s.trim() === "" ? {} : { title: s.trim() },
			...f === "" ? {} : { parentId: f }
		}) !== null && (d(""), p(""), e.getState().closeFoundry());
	};
	return /* @__PURE__ */ u(c, { children: [
		/* @__PURE__ */ u("label", {
			className: "wr-foundry-field",
			children: [/* @__PURE__ */ l("span", {
				className: "wr-foundry-label",
				children: "task kind"
			}), /* @__PURE__ */ l("select", {
				className: "wr-foundry-input",
				value: i,
				onChange: (e) => a(e.target.value),
				children: U.map((e) => /* @__PURE__ */ l("option", {
					value: e,
					children: e
				}, e))
			})]
		}),
		/* @__PURE__ */ u("label", {
			className: "wr-foundry-field",
			children: [/* @__PURE__ */ l("span", {
				className: "wr-foundry-label",
				children: "title"
			}), /* @__PURE__ */ l("input", {
				className: "wr-foundry-input",
				type: "text",
				value: s,
				placeholder: h,
				onChange: (e) => d(e.target.value),
				onKeyDown: (t) => {
					t.key === "Enter" && g(), t.key === "Escape" && e.getState().closeFoundry();
				}
			})]
		}),
		/* @__PURE__ */ u("label", {
			className: "wr-foundry-field",
			children: [/* @__PURE__ */ l("span", {
				className: "wr-foundry-label",
				children: "parent task (optional)"
			}), /* @__PURE__ */ u("select", {
				className: "wr-foundry-input",
				value: f,
				onChange: (e) => p(e.target.value),
				children: [/* @__PURE__ */ l("option", {
					value: "",
					children: "— none —"
				}), m.map((e) => /* @__PURE__ */ l("option", {
					value: e,
					children: r[e]?.view.title ?? e
				}, e))]
			})]
		}),
		/* @__PURE__ */ l("div", {
			className: "wr-modal-hint",
			children: "lands in BACKLOG · deterministic adr-cXX id · Esc to close"
		}),
		/* @__PURE__ */ u("div", {
			className: "wr-modal-actions",
			children: [/* @__PURE__ */ l("button", {
				type: "button",
				className: "wr-alert-btn",
				onClick: () => e.getState().closeFoundry(),
				children: "Cancel"
			}), /* @__PURE__ */ l("button", {
				type: "button",
				"data-testid": "foundry-commission",
				className: "wr-alert-btn wr-alert-btn--approve",
				onClick: g,
				children: "Commission"
			})]
		})
	] });
}
function Pr({ stack: e, onForgeFrom: t, onEdit: n }) {
	let r = e.stack.spec;
	return /* @__PURE__ */ u("li", {
		className: "wr-stack-row",
		children: [
			/* @__PURE__ */ u("div", {
				className: "wr-stack-row-main",
				children: [
					/* @__PURE__ */ l("span", {
						className: "wr-stack-name",
						children: e.name
					}),
					/* @__PURE__ */ l("span", {
						className: `wr-stack-adapter wr-faction-text--${r.adapter}`,
						children: r.adapter
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-stack-model",
						children: r.model
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-stack-phase",
						children: e.stack.status.phase
					}),
					e.custom && /* @__PURE__ */ l("span", {
						className: "wr-stack-custom",
						children: "CUSTOM"
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-stack-id",
						children: e.stackRef
					})
				]
			}),
			/* @__PURE__ */ l("div", {
				className: "wr-stack-row-excerpt",
				children: Ar(r.prompt.system)
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-stack-row-actions",
				children: [/* @__PURE__ */ u("button", {
					type: "button",
					className: "wr-alert-btn wr-stack-btn wr-stack-btn--forge",
					onClick: t,
					children: [/* @__PURE__ */ l("span", {
						className: "wr-forge-glyph",
						"aria-hidden": !0,
						dangerouslySetInnerHTML: { __html: Mr }
					}), "Forge From"]
				}), e.custom && /* @__PURE__ */ l("button", {
					type: "button",
					className: "wr-alert-btn wr-stack-btn",
					onClick: n,
					children: "Edit"
				})]
			})
		]
	});
}
function Fr({ orders: e, views: t }) {
	let [n, r] = o(wr), [, i] = o(0), a = t.listStacks(), s = xr.includes(n.approvalMode) ? xr : [n.approvalMode, ...xr];
	return /* @__PURE__ */ u("div", {
		className: "wr-foundry-stacks-body",
		children: [/* @__PURE__ */ l("ul", {
			className: "wr-stack-roster",
			"aria-label": "Agent stack roster",
			children: a.map((e) => /* @__PURE__ */ l(Pr, {
				stack: e,
				onForgeFrom: () => r(Er(e)),
				onEdit: () => r(Dr(e))
			}, e.stackRef))
		}), /* @__PURE__ */ u("div", {
			className: "wr-stack-editor",
			"aria-label": "Stack editor",
			children: [
				/* @__PURE__ */ l("div", {
					className: "wr-stack-editor-title",
					children: n.stackRef === null ? "FORGE A NEW STACK" : `RE-FORGE ${n.stackRef.toUpperCase()}`
				}),
				/* @__PURE__ */ u("label", {
					className: "wr-foundry-field",
					children: [/* @__PURE__ */ l("span", {
						className: "wr-foundry-label",
						children: "name"
					}), /* @__PURE__ */ l("input", {
						className: "wr-foundry-input",
						type: "text",
						value: n.name,
						placeholder: "name the stack",
						onChange: (e) => r({
							...n,
							name: e.target.value
						})
					})]
				}),
				/* @__PURE__ */ u("label", {
					className: "wr-foundry-field",
					children: [/* @__PURE__ */ l("span", {
						className: "wr-foundry-label",
						children: "display name"
					}), /* @__PURE__ */ l("input", {
						className: "wr-foundry-input",
						type: "text",
						value: n.displayName,
						placeholder: "human label (spec.displayName)",
						onChange: (e) => r({
							...n,
							displayName: e.target.value
						})
					})]
				}),
				/* @__PURE__ */ u("div", {
					className: "wr-stack-editor-grid",
					children: [
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [
								/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "adapter"
								}),
								/* @__PURE__ */ l("select", {
									className: "wr-foundry-input",
									value: n.adapter,
									onChange: (e) => r(Or(n, e.target.value)),
									children: st.map((e) => /* @__PURE__ */ l("option", {
										value: e,
										children: e
									}, e))
								}),
								/* @__PURE__ */ l(br, {
									label: "Platform",
									kinds: [
										"AgentProduct",
										"AgentPlatformImpl",
										"AgentRuntimeImpl",
										"Platform"
									],
									selectedId: n.adapter,
									onSelect: (e) => r(Or(n, e.displayName || e.id))
								})
							]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [
								/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "model"
								}),
								/* @__PURE__ */ l("input", {
									className: "wr-foundry-input",
									type: "text",
									value: n.model,
									onChange: (e) => r({
										...n,
										model: e.target.value
									})
								}),
								/* @__PURE__ */ l(br, {
									label: "Model",
									kinds: [
										"ModelFamily",
										"ModelVersion",
										"SessionModel"
									],
									selectedId: n.model,
									onSelect: (e) => r({
										...n,
										model: e.displayName || e.id
									})
								})
							]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [
								/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "provider"
								}),
								/* @__PURE__ */ l("input", {
									className: "wr-foundry-input",
									type: "text",
									value: n.provider,
									placeholder: "anthropic",
									onChange: (e) => r({
										...n,
										provider: e.target.value
									})
								}),
								/* @__PURE__ */ l(br, {
									label: "Provider",
									kinds: [
										"Provider",
										"ModelProviderProduct",
										"ModelProviderVersion"
									],
									selectedId: n.provider,
									onSelect: (e) => r({
										...n,
										provider: e.displayName || e.id
									})
								})
							]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [/* @__PURE__ */ l("span", {
								className: "wr-foundry-label",
								children: "approval mode"
							}), /* @__PURE__ */ l("select", {
								className: "wr-foundry-input",
								value: n.approvalMode,
								onChange: (e) => r({
									...n,
									approvalMode: e.target.value
								}),
								children: s.map((e) => /* @__PURE__ */ l("option", {
									value: e,
									children: e
								}, e))
							})]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [/* @__PURE__ */ l("span", {
								className: "wr-foundry-label",
								children: "service account"
							}), /* @__PURE__ */ l("input", {
								className: "wr-foundry-input",
								type: "text",
								value: n.serviceAccountRef,
								placeholder: "runtimeIdentity.serviceAccountRef",
								onChange: (e) => r({
									...n,
									serviceAccountRef: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [/* @__PURE__ */ l("span", {
								className: "wr-foundry-label",
								children: "tool profile"
							}), /* @__PURE__ */ l("input", {
								className: "wr-foundry-input",
								type: "text",
								value: n.toolProfileRef,
								placeholder: "toolProfileRef",
								onChange: (e) => r({
									...n,
									toolProfileRef: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [/* @__PURE__ */ l("span", {
								className: "wr-foundry-label",
								children: "runner pool"
							}), /* @__PURE__ */ l("input", {
								className: "wr-foundry-input",
								type: "text",
								value: n.runnerPool,
								placeholder: "runnerPool",
								onChange: (e) => r({
									...n,
									runnerPool: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [/* @__PURE__ */ l("span", {
								className: "wr-foundry-label",
								children: "workspace policy"
							}), /* @__PURE__ */ l("input", {
								className: "wr-foundry-input",
								type: "text",
								value: n.workspacePolicyRef,
								placeholder: "workspacePolicyRef",
								onChange: (e) => r({
									...n,
									workspacePolicyRef: e.target.value
								})
							})]
						})
					]
				}),
				/* @__PURE__ */ u("div", {
					className: "wr-stack-editor-grid",
					children: [
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [
								/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "mcp servers (csv)"
								}),
								/* @__PURE__ */ l("input", {
									className: "wr-foundry-input",
									type: "text",
									value: n.mcpServerRefs,
									placeholder: "kradle-mcp, atlas-mcp",
									onChange: (e) => r({
										...n,
										mcpServerRefs: e.target.value
									})
								}),
								/* @__PURE__ */ l(br, {
									label: "Tools / MCP",
									kinds: [
										"Tool",
										"ToolServer",
										"MCPPrompt",
										"MCPResource"
									],
									onSelect: (e) => r({
										...n,
										mcpServerRefs: jr(n.mcpServerRefs, e.displayName || e.id)
									})
								})
							]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [
								/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "cli tools (csv)"
								}),
								/* @__PURE__ */ l("input", {
									className: "wr-foundry-input",
									type: "text",
									value: n.cliToolRefs,
									placeholder: "gh, kubectl",
									onChange: (e) => r({
										...n,
										cliToolRefs: e.target.value
									})
								}),
								/* @__PURE__ */ l(br, {
									label: "CLI Tools",
									kinds: ["Tool", "ToolDescriptor"],
									onSelect: (e) => r({
										...n,
										cliToolRefs: jr(n.cliToolRefs, e.displayName || e.id)
									})
								})
							]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [
								/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "skills (csv)"
								}),
								/* @__PURE__ */ l("input", {
									className: "wr-foundry-input",
									type: "text",
									value: n.skillRefs,
									placeholder: "skill-x, skill-y",
									onChange: (e) => r({
										...n,
										skillRefs: e.target.value
									})
								}),
								/* @__PURE__ */ l(br, {
									label: "Skills",
									kinds: [
										"Skill",
										"LibrarySkill",
										"SkillArea",
										"Capability"
									],
									onSelect: (e) => r({
										...n,
										skillRefs: jr(n.skillRefs, e.displayName || e.id)
									})
								})
							]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [/* @__PURE__ */ l("span", {
								className: "wr-foundry-label",
								children: "subagents (csv)"
							}), /* @__PURE__ */ l("input", {
								className: "wr-foundry-input",
								type: "text",
								value: n.subagentRefs,
								placeholder: "subagent-1, subagent-2",
								onChange: (e) => r({
									...n,
									subagentRefs: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [/* @__PURE__ */ l("span", {
								className: "wr-foundry-label",
								children: "context labels (csv)"
							}), /* @__PURE__ */ l("input", {
								className: "wr-foundry-input",
								type: "text",
								value: n.contextLabelRefs,
								placeholder: "label-a, label-b",
								onChange: (e) => r({
									...n,
									contextLabelRefs: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [/* @__PURE__ */ l("span", {
								className: "wr-foundry-label",
								children: "memory repositories (csv)"
							}), /* @__PURE__ */ l("input", {
								className: "wr-foundry-input",
								type: "text",
								value: n.memoryRepositoryRefs,
								placeholder: "repo-brain",
								onChange: (e) => r({
									...n,
									memoryRepositoryRefs: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [
								/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "agent role (csv)"
								}),
								/* @__PURE__ */ l("input", {
									className: "wr-foundry-input",
									type: "text",
									value: n.agentRole,
									placeholder: "reviewer, backend-team",
									onChange: (e) => r({
										...n,
										agentRole: e.target.value
									})
								}),
								/* @__PURE__ */ l(br, {
									label: "Agent Role",
									kinds: [
										"Role",
										"Responsibility",
										"AgentTeam",
										"OrgUnit"
									],
									onSelect: (e) => r({
										...n,
										agentRole: jr(n.agentRole, e.displayName || e.id)
									})
								})
							]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [/* @__PURE__ */ l("span", {
								className: "wr-foundry-label",
								children: "role bindings (csv)"
							}), /* @__PURE__ */ l("input", {
								className: "wr-foundry-input",
								type: "text",
								value: n.roleBindings,
								placeholder: "permissionRefs.roleBindings",
								onChange: (e) => r({
									...n,
									roleBindings: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [/* @__PURE__ */ l("span", {
								className: "wr-foundry-label",
								children: "secret grants (csv)"
							}), /* @__PURE__ */ l("input", {
								className: "wr-foundry-input",
								type: "text",
								value: n.secretGrants,
								placeholder: "permissionRefs.secretGrants",
								onChange: (e) => r({
									...n,
									secretGrants: e.target.value
								})
							})]
						}),
						/* @__PURE__ */ u("label", {
							className: "wr-foundry-field",
							children: [/* @__PURE__ */ l("span", {
								className: "wr-foundry-label",
								children: "config grants (csv)"
							}), /* @__PURE__ */ l("input", {
								className: "wr-foundry-input",
								type: "text",
								value: n.configGrants,
								placeholder: "permissionRefs.configGrants",
								onChange: (e) => r({
									...n,
									configGrants: e.target.value
								})
							})]
						})
					]
				}),
				/* @__PURE__ */ u("label", {
					className: "wr-foundry-field",
					children: [/* @__PURE__ */ l("span", {
						className: "wr-foundry-label",
						children: "system personality"
					}), /* @__PURE__ */ l("textarea", {
						className: "wr-foundry-input wr-stack-prompt",
						rows: 3,
						value: n.system,
						placeholder: "inscribe the personality (prompt.system)",
						onChange: (e) => r({
							...n,
							system: e.target.value
						})
					})]
				}),
				/* @__PURE__ */ u("label", {
					className: "wr-foundry-field",
					children: [/* @__PURE__ */ l("span", {
						className: "wr-foundry-label",
						children: "developer prompt (optional)"
					}), /* @__PURE__ */ l("textarea", {
						className: "wr-foundry-input wr-stack-prompt",
						rows: 2,
						value: n.developer,
						onChange: (e) => r({
							...n,
							developer: e.target.value
						})
					})]
				}),
				/* @__PURE__ */ l("div", {
					className: "wr-modal-hint",
					children: "deterministic stk-cNN id · honored on the next spawn"
				}),
				/* @__PURE__ */ u("div", {
					className: "wr-modal-actions",
					children: [/* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-alert-btn",
						onClick: () => r(wr()),
						children: "Clear"
					}), /* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-alert-btn wr-alert-btn--approve",
						disabled: n.name.trim() === "",
						onClick: () => {
							let t = kr(n);
							if (t === null) return;
							let a = e.upsertStack(t);
							a !== null && (r({
								...n,
								stackRef: a
							}), i((e) => e + 1));
						},
						children: "Save Stack"
					})]
				})
			]
		})]
	});
}
function Ir(e, t) {
	return e?.emoji != null && e.emoji !== "" ? e.emoji : (t.trim()[0] ?? "?").toUpperCase();
}
function Lr({ def: e }) {
	let t = e.roleContext ?? e.persona?.roleTitle ?? null, n = e.persona?.displayName ?? e.personaRef ?? e.name;
	return /* @__PURE__ */ u("li", {
		className: "wr-stack-row wr-definition-row",
		children: [/* @__PURE__ */ u("div", {
			className: "wr-stack-row-main",
			children: [
				/* @__PURE__ */ l("span", {
					className: "wr-persona-glyph",
					"aria-hidden": !0,
					children: Ir(e.persona, n)
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-stack-name",
					children: n
				}),
				t != null && t !== "" && /* @__PURE__ */ l("span", {
					className: "wr-definition-role",
					children: t
				}),
				e.stackRef !== "" && /* @__PURE__ */ l("span", {
					className: "wr-stack-adapter",
					title: "bound stack",
					children: e.stackRef
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-stack-id",
					children: e.name
				})
			]
		}), e.persona === null && e.personaRef !== "" && /* @__PURE__ */ u("div", {
			className: "wr-stack-row-excerpt",
			children: [
				"persona “",
				e.personaRef,
				"” not found"
			]
		})]
	});
}
function Rr({ persona: e }) {
	return /* @__PURE__ */ u("li", {
		className: "wr-persona-card",
		children: [/* @__PURE__ */ l("span", {
			className: "wr-persona-glyph wr-persona-glyph--lg",
			"aria-hidden": !0,
			children: Ir(e, e.displayName)
		}), /* @__PURE__ */ u("div", {
			className: "wr-persona-card-body",
			children: [
				/* @__PURE__ */ l("span", {
					className: "wr-persona-name",
					children: e.displayName
				}),
				e.roleTitle != null && e.roleTitle !== "" && /* @__PURE__ */ l("span", {
					className: "wr-persona-role",
					children: e.roleTitle
				}),
				e.tagline != null && e.tagline !== "" && /* @__PURE__ */ l("span", {
					className: "wr-persona-tagline",
					children: e.tagline
				})
			]
		})]
	});
}
function zr({ orders: e, views: t }) {
	let n = t.listDefinitions(), r = t.listPersonas(), i = t.listStacks(), [, a] = o(0), [s, c] = o(""), [d, f] = o(r[0]?.name ?? ""), [p, m] = o(i[0]?.stackRef ?? ""), [h, g] = o(""), [_, v] = o(""), [y, b] = o(""), [x, S] = o(""), [C, w] = o(""), [T, E] = o("direct"), [D, O] = o("professional"), [k, A] = o(""), [j, M] = o(""), [N, P] = o("nova"), [F, ee] = o(""), I = s.trim() !== "" && d !== "" && p !== "", te = () => {
		I && e.upsertDefinition({
			name: s.trim(),
			personaRef: d,
			stackRef: p,
			...h.trim() === "" ? {} : { roleContext: h.trim() }
		}) !== null && (c(""), g(""), a((e) => e + 1));
	}, ne = _.trim() !== "";
	return /* @__PURE__ */ u("div", {
		className: "wr-foundry-stacks-body",
		children: [
			/* @__PURE__ */ u("ul", {
				className: "wr-stack-roster",
				"aria-label": "Agent definitions",
				children: [n.length === 0 && /* @__PURE__ */ l("li", {
					className: "wr-roster-empty",
					children: "No agent definitions"
				}), n.map((e) => /* @__PURE__ */ l(Lr, { def: e }, e.name))]
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-persona-gallery-wrap",
				"aria-label": "Agent personas",
				children: [/* @__PURE__ */ l("div", {
					className: "wr-stack-editor-title",
					children: "PERSONAS"
				}), /* @__PURE__ */ u("ul", {
					className: "wr-persona-gallery",
					children: [r.length === 0 && /* @__PURE__ */ l("li", {
						className: "wr-roster-empty",
						children: "No personas"
					}), r.map((e) => /* @__PURE__ */ l(Rr, { persona: e }, e.name))]
				})]
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-stack-editor",
				"aria-label": "New persona",
				children: [
					/* @__PURE__ */ l("div", {
						className: "wr-stack-editor-title",
						children: "NEW PERSONA"
					}),
					/* @__PURE__ */ u("div", {
						className: "wr-stack-editor-grid",
						children: [
							/* @__PURE__ */ u("label", {
								className: "wr-foundry-field",
								children: [/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "display name"
								}), /* @__PURE__ */ l("input", {
									className: "wr-foundry-input",
									type: "text",
									value: _,
									placeholder: "Ada the Reviewer",
									onChange: (e) => v(e.target.value)
								})]
							}),
							/* @__PURE__ */ u("label", {
								className: "wr-foundry-field",
								children: [/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "tagline"
								}), /* @__PURE__ */ l("input", {
									className: "wr-foundry-input",
									type: "text",
									value: y,
									placeholder: "meticulous code auditor",
									onChange: (e) => b(e.target.value)
								})]
							}),
							/* @__PURE__ */ u("label", {
								className: "wr-foundry-field",
								children: [/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "role title"
								}), /* @__PURE__ */ l("input", {
									className: "wr-foundry-input",
									type: "text",
									value: x,
									placeholder: "Senior Reviewer",
									onChange: (e) => S(e.target.value)
								})]
							}),
							/* @__PURE__ */ u("label", {
								className: "wr-foundry-field",
								children: [/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "role domain"
								}), /* @__PURE__ */ l("input", {
									className: "wr-foundry-input",
									type: "text",
									value: C,
									placeholder: "backend",
									onChange: (e) => w(e.target.value)
								})]
							}),
							/* @__PURE__ */ u("label", {
								className: "wr-foundry-field",
								children: [/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "communication style"
								}), /* @__PURE__ */ l("select", {
									className: "wr-foundry-input",
									value: T,
									onChange: (e) => E(e.target.value),
									children: [
										"direct",
										"gentle",
										"formal",
										"casual"
									].map((e) => /* @__PURE__ */ l("option", {
										value: e,
										children: e
									}, e))
								})]
							}),
							/* @__PURE__ */ u("label", {
								className: "wr-foundry-field",
								children: [/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "tone"
								}), /* @__PURE__ */ l("select", {
									className: "wr-foundry-input",
									value: D,
									onChange: (e) => O(e.target.value),
									children: [
										"professional",
										"friendly",
										"academic",
										"playful"
									].map((e) => /* @__PURE__ */ l("option", {
										value: e,
										children: e
									}, e))
								})]
							}),
							/* @__PURE__ */ u("label", {
								className: "wr-foundry-field",
								children: [/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "emoji"
								}), /* @__PURE__ */ l("input", {
									className: "wr-foundry-input",
									type: "text",
									value: k,
									placeholder: "🔍",
									onChange: (e) => A(e.target.value)
								})]
							}),
							/* @__PURE__ */ u("label", {
								className: "wr-foundry-field",
								children: [/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "tts voice"
								}), /* @__PURE__ */ l("input", {
									className: "wr-foundry-input",
									type: "text",
									value: N,
									placeholder: "nova",
									onChange: (e) => P(e.target.value)
								})]
							}),
							/* @__PURE__ */ u("label", {
								className: "wr-foundry-field",
								children: [
									/* @__PURE__ */ l("span", {
										className: "wr-foundry-label",
										children: "skills (csv)"
									}),
									/* @__PURE__ */ l("input", {
										className: "wr-foundry-input",
										type: "text",
										value: F,
										placeholder: "code-review, security",
										onChange: (e) => ee(e.target.value)
									}),
									/* @__PURE__ */ l(br, {
										label: "Skills",
										kinds: [
											"Skill",
											"LibrarySkill",
											"SkillArea",
											"Capability"
										],
										onSelect: (e) => ee(jr(F, e.displayName || e.id))
									})
								]
							})
						]
					}),
					/* @__PURE__ */ u("label", {
						className: "wr-foundry-field",
						children: [/* @__PURE__ */ l("span", {
							className: "wr-foundry-label",
							children: "soul (behavioral document, markdown)"
						}), /* @__PURE__ */ l("textarea", {
							className: "wr-foundry-input wr-stack-prompt",
							rows: 3,
							value: j,
							placeholder: "# Identity\nValues, boundaries, and communication principles.",
							onChange: (e) => M(e.target.value)
						})]
					}),
					/* @__PURE__ */ l("div", {
						className: "wr-modal-hint",
						children: "creates AgentPersona + AgentSoul + AgentAppearance + AgentVoiceProfile · reconciles on the next refresh"
					}),
					/* @__PURE__ */ l("div", {
						className: "wr-modal-actions",
						children: /* @__PURE__ */ l("button", {
							type: "button",
							"data-testid": "foundry-new-persona",
							className: "wr-alert-btn wr-alert-btn--approve",
							disabled: !ne,
							onClick: () => {
								if (!ne) return;
								let t = _.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "new-agent", n = F.split(",").map((e) => e.trim()).filter(Boolean);
								e.createAgentIdentity({
									name: t,
									displayName: _.trim(),
									...y.trim() === "" ? {} : { tagline: y.trim() },
									...x.trim() === "" ? {} : { roleTitle: x.trim() },
									...C.trim() === "" ? {} : { roleDomain: C.trim() },
									communicationStyle: T,
									tone: D,
									...k.trim() === "" ? {} : { emoji: k.trim() },
									...j.trim() === "" ? {} : { soul: j },
									ttsProvider: "openai",
									ttsVoice: N,
									...n.length > 0 ? { skillRefs: n } : {}
								}) !== null && (v(""), b(""), S(""), w(""), A(""), M(""), ee(""), a((e) => e + 1));
							},
							children: "Create Persona"
						})
					})
				]
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-stack-editor",
				"aria-label": "New definition",
				children: [
					/* @__PURE__ */ l("div", {
						className: "wr-stack-editor-title",
						children: "NEW DEFINITION"
					}),
					/* @__PURE__ */ u("div", {
						className: "wr-stack-editor-grid",
						children: [
							/* @__PURE__ */ u("label", {
								className: "wr-foundry-field",
								children: [/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "name"
								}), /* @__PURE__ */ l("input", {
									className: "wr-foundry-input",
									type: "text",
									value: s,
									placeholder: "reviewer-on-main",
									onChange: (e) => c(e.target.value),
									onKeyDown: (e) => {
										e.key === "Enter" && te();
									}
								})]
							}),
							/* @__PURE__ */ u("label", {
								className: "wr-foundry-field",
								children: [/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "persona"
								}), /* @__PURE__ */ u("select", {
									className: "wr-foundry-input",
									value: d,
									onChange: (e) => f(e.target.value),
									disabled: r.length === 0,
									children: [r.length === 0 && /* @__PURE__ */ l("option", {
										value: "",
										children: "— no personas —"
									}), r.map((e) => /* @__PURE__ */ l("option", {
										value: e.name,
										children: e.displayName
									}, e.name))]
								})]
							}),
							/* @__PURE__ */ u("label", {
								className: "wr-foundry-field",
								children: [/* @__PURE__ */ l("span", {
									className: "wr-foundry-label",
									children: "stack"
								}), /* @__PURE__ */ u("select", {
									className: "wr-foundry-input",
									value: p,
									onChange: (e) => m(e.target.value),
									disabled: i.length === 0,
									children: [i.length === 0 && /* @__PURE__ */ l("option", {
										value: "",
										children: "— no stacks —"
									}), i.map((e) => /* @__PURE__ */ l("option", {
										value: e.stackRef,
										children: e.name
									}, e.stackRef))]
								})]
							})
						]
					}),
					/* @__PURE__ */ u("label", {
						className: "wr-foundry-field",
						children: [/* @__PURE__ */ l("span", {
							className: "wr-foundry-label",
							children: "role context (optional)"
						}), /* @__PURE__ */ l("textarea", {
							className: "wr-foundry-input wr-stack-prompt",
							rows: 2,
							value: h,
							placeholder: "deployment-specific role framing (spec.roleContext)",
							onChange: (e) => g(e.target.value)
						})]
					}),
					/* @__PURE__ */ l("div", {
						className: "wr-modal-hint",
						children: "binds a persona to a stack · reconciles on the next refresh"
					}),
					/* @__PURE__ */ l("div", {
						className: "wr-modal-actions",
						children: /* @__PURE__ */ l("button", {
							type: "button",
							"data-testid": "foundry-new-definition",
							className: "wr-alert-btn wr-alert-btn--approve",
							disabled: !I,
							onClick: te,
							children: "Apply Definition"
						})
					})
				]
			})
		]
	});
}
function Br({ store: e, orders: t, views: r }) {
	let i = B(e, (e) => e.meta.foundryOpen), a = B(e, (e) => e.meta.foundryTab), [s, c] = o("commission");
	return n(() => {
		i && c(a);
	}, [i, a]), i ? /* @__PURE__ */ l("div", {
		className: "wr-modal-backdrop",
		"data-testid": "foundry",
		children: /* @__PURE__ */ u("div", {
			className: V("wr-modal wr-foundry", (s === "stacks" || s === "agents") && "wr-foundry--wide"),
			role: "dialog",
			"aria-label": "The Foundry",
			children: [
				/* @__PURE__ */ l("div", {
					className: "wr-panel-title",
					children: "THE FOUNDRY"
				}),
				/* @__PURE__ */ u("div", {
					className: "wr-foundry-tabs",
					role: "tablist",
					"aria-label": "Foundry tabs",
					children: [
						/* @__PURE__ */ l("div", {
							role: "tab",
							tabIndex: 0,
							"aria-selected": s === "commission",
							className: V("wr-foundry-tab", s === "commission" && "is-active"),
							onClick: () => c("commission"),
							onKeyDown: (e) => {
								(e.key === "Enter" || e.key === " ") && c("commission");
							},
							children: "Commission Task"
						}),
						/* @__PURE__ */ l("div", {
							role: "tab",
							tabIndex: 0,
							"data-testid": "foundry-stacks",
							"aria-selected": s === "stacks",
							className: V("wr-foundry-tab", s === "stacks" && "is-active"),
							onClick: () => c("stacks"),
							onKeyDown: (e) => {
								(e.key === "Enter" || e.key === " ") && c("stacks");
							},
							children: "Stacks"
						}),
						/* @__PURE__ */ l("div", {
							role: "tab",
							tabIndex: 0,
							"data-testid": "foundry-agents",
							"aria-selected": s === "agents",
							className: V("wr-foundry-tab", s === "agents" && "is-active"),
							onClick: () => c("agents"),
							onKeyDown: (e) => {
								(e.key === "Enter" || e.key === " ") && c("agents");
							},
							children: "Agents"
						})
					]
				}),
				s === "commission" ? /* @__PURE__ */ l(Nr, {
					store: e,
					orders: t
				}) : l(s === "stacks" ? Fr : zr, {
					orders: t,
					views: r
				})
			]
		})
	}) : null;
}
//#endregion
//#region src/game/ideView.ts
function Vr(e) {
	return e.replace(/[^a-zA-Z0-9]/g, "-");
}
function Hr(e, t) {
	let n = Math.max(0, Math.min(e.length, t)), r = e.slice(0, n), i = r.lastIndexOf("\n") + 1, a = i === 0 ? 0 : r.split("\n").length - 1, o = e.indexOf("\n", n), s = o === -1 ? e.length : o;
	return {
		lineIndex: a,
		lineText: e.slice(i, s),
		beforeCaret: e.slice(i, n),
		atLineEnd: n === s
	};
}
function Ur(e, t, n) {
	let r = Math.max(0, Math.min(e.length, t));
	return {
		text: e.slice(0, r) + n.text + e.slice(r),
		caret: r + n.text.length
	};
}
function Wr(e) {
	return {
		ghost: null,
		cascade: e === null
	};
}
//#endregion
//#region src/game/syntax.ts
function Gr(e) {
	let t = e.lastIndexOf(".");
	switch (t >= 0 ? e.slice(t + 1).toLowerCase() : "") {
		case "ts":
		case "tsx": return "ts";
		case "js":
		case "jsx":
		case "mjs":
		case "cjs": return "js";
		case "json": return "json";
		case "css": return "css";
		case "md":
		case "markdown": return "md";
		default: return "plain";
	}
}
var Kr = "const|let|var|function|return|if|else|for|while|do|import|export|from|new|class|extends|implements|interface|type|enum|async|await|switch|case|break|continue|typeof|instanceof|in|of|this|null|undefined|true|false|throw|try|catch|finally|readonly|public|private|protected|static|void|never|unknown|number|string|boolean|default|as|satisfies|keyof|yield|delete|get|set", qr = {
	ts: {
		re: new RegExp([
			String.raw`(\/\/.*$|\/\*[\s\S]*?\*\/)`,
			String.raw`('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|` + "`(?:[^`\\\\]|\\\\.)*`)",
			String.raw`(\b\d(?:[\d_]*\.?[\d_]*)\b)`,
			String.raw`(\b(?:${Kr})\b)`,
			String.raw`(\b[A-Z][A-Za-z0-9_]*\b)`
		].join("|"), "gm"),
		classes: [
			"comment",
			"string",
			"number",
			"keyword",
			"type"
		]
	},
	js: {
		re: new RegExp([
			String.raw`(\/\/.*$|\/\*[\s\S]*?\*\/)`,
			String.raw`('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|` + "`(?:[^`\\\\]|\\\\.)*`)",
			String.raw`(\b\d(?:[\d_]*\.?[\d_]*)\b)`,
			String.raw`(\b(?:${Kr})\b)`,
			String.raw`(\b[A-Z][A-Za-z0-9_]*\b)`
		].join("|"), "gm"),
		classes: [
			"comment",
			"string",
			"number",
			"keyword",
			"type"
		]
	},
	json: {
		re: new RegExp([
			String.raw`("(?:[^"\\]|\\.)*"(?=\s*:))`,
			String.raw`("(?:[^"\\]|\\.)*")`,
			String.raw`(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)`,
			String.raw`(\b(?:true|false|null)\b)`
		].join("|"), "gm"),
		classes: [
			"type",
			"string",
			"number",
			"keyword"
		]
	},
	css: {
		re: new RegExp([
			String.raw`(\/\*[\s\S]*?\*\/)`,
			String.raw`('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")`,
			String.raw`(#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms)?\b)`,
			String.raw`(@[a-z-]+|\b[a-z-]+(?=\s*:))`,
			String.raw`(\.[A-Za-z_-][\w-]*|::?[a-z-]+)`
		].join("|"), "gm"),
		classes: [
			"comment",
			"string",
			"number",
			"keyword",
			"type"
		]
	},
	md: {
		re: new RegExp([
			String.raw`(^#{1,6}\s.*$)`,
			String.raw`(` + "`[^`]*`" + String.raw`)`,
			String.raw`(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)`,
			String.raw`(^\s*[-*+]\s|\b\d+\.\s)`
		].join("|"), "gm"),
		classes: [
			"keyword",
			"string",
			"type",
			"number"
		]
	}
};
function Jr(e, t) {
	if (e.length === 0) return [];
	if (t === "plain") return [{
		text: e,
		cls: "plain"
	}];
	let n = qr[t], r = [], i = 0;
	for (n.re.lastIndex = 0;;) {
		let t = n.re.exec(e);
		if (t === null) break;
		t.index > i && r.push({
			text: e.slice(i, t.index),
			cls: "plain"
		});
		let a = "plain";
		for (let e = 0; e < n.classes.length; e += 1) if (t[e + 1] !== void 0) {
			a = n.classes[e];
			break;
		}
		r.push({
			text: t[0],
			cls: a
		}), i = t.index + t[0].length, t[0].length === 0 && (n.re.lastIndex += 1);
	}
	return i < e.length && r.push({
		text: e.slice(i),
		cls: "plain"
	}), r;
}
//#endregion
//#region src/components/panels/IdeOverlay.tsx
var Yr = 400, Xr = 80;
function Zr({ node: e, depth: t, changed: n, collapsed: r, onToggleDir: i, onOpenFile: a, activePath: o }) {
	let s = { paddingLeft: `${8 + t * 14}px` };
	if (e.type === "dir") {
		let d = !r.has(e.path);
		return /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ u("div", {
			className: "wr-ide-entry wr-ide-entry--dir",
			style: s,
			role: "treeitem",
			"aria-expanded": d,
			onClick: () => i(e.path),
			children: [/* @__PURE__ */ l("span", {
				className: "wr-ide-disclosure",
				"aria-hidden": !0,
				children: d ? "▾" : "▸"
			}), /* @__PURE__ */ u("span", {
				className: "wr-ide-entry-dirname",
				children: [e.name, "/"]
			})]
		}), d && (e.children ?? []).map((e) => /* @__PURE__ */ l(Zr, {
			node: e,
			depth: t + 1,
			changed: n,
			collapsed: r,
			onToggleDir: i,
			onOpenFile: a,
			activePath: o
		}, e.path))] });
	}
	let d = n.get(e.path);
	return /* @__PURE__ */ u("div", {
		className: V("wr-ide-entry wr-ide-entry--file", o === e.path && "is-open"),
		style: s,
		role: "treeitem",
		onClick: () => a(e.path),
		children: [/* @__PURE__ */ l("span", {
			className: "wr-ide-entry-name",
			children: e.name
		}), d !== void 0 && /* @__PURE__ */ l("span", {
			className: `wr-ide-badge wr-ide-badge--${d.toLowerCase()}`,
			children: d
		})]
	});
}
function Qr({ store: e, orders: t, views: r }) {
	let i = B(e, (e) => e.meta.ideTaskId);
	B(e, (e) => e.meta.tickIndex);
	let [s, c] = o([]), [d, f] = o(null), [p, m] = o({}), [h, g] = o({}), [_, v] = o(/* @__PURE__ */ new Set()), [y, b] = o(null), [x, S] = o(0), [C, w] = o(""), T = a(null), E = a(null), D = a(null), O = a(null), k = a(null);
	n(() => {
		if (c([]), f(null), m({}), g({}), v(/* @__PURE__ */ new Set()), b(null), S(0), w(""), i === null) return;
		let e = r.getWorkspaceView(i)?.files ?? [], t = e.find((e) => /\.tsx?$/.test(e.path) && e.status !== "D") ?? e.find((e) => e.status !== "D");
		if (t === void 0) return;
		let n = r.getFileContent(i, t.path) ?? "";
		c([t.path]), f(t.path), m({ [t.path]: n }), w(n);
	}, [i, r]);
	let A = d === null ? "" : p[d] ?? "";
	if (n(() => (E.current !== null && window.clearTimeout(E.current), E.current = window.setTimeout(() => w(A), Xr), () => {
		E.current !== null && window.clearTimeout(E.current);
	}), [A]), n(() => {
		k.current !== null && D.current !== null && (D.current.setSelectionRange(k.current, k.current), k.current = null);
	}), n(() => () => {
		T.current !== null && window.clearTimeout(T.current);
	}, []), i === null) return null;
	let j = r.getWorkspaceTree(i), M = r.getWorkspaceView(i), N = /* @__PURE__ */ new Map();
	for (let e of M?.files ?? []) N.set(e.path, e.status);
	let P = (e) => {
		e === null || h[e] !== !0 || t.writeFile(i, e, p[e] ?? "");
	}, F = (e) => {
		b(null), d !== null && d !== e && P(d), m((t) => t[e] === void 0 ? {
			...t,
			[e]: r.getFileContent(i, e) ?? ""
		} : t), c((t) => t.includes(e) ? t : [...t, e]), f(e), w(p[e] ?? r.getFileContent(i, e) ?? ""), S(0);
	}, ee = (e) => {
		P(e), b(null), c((t) => {
			let n = t.filter((t) => t !== e);
			if (d === e) {
				let e = n[n.length - 1] ?? null;
				f(e), w(e === null ? "" : p[e] ?? "");
			}
			return n;
		});
	}, I = (e, t, n) => {
		T.current !== null && window.clearTimeout(T.current), T.current = window.setTimeout(() => {
			let r = Hr(e, t);
			if (!r.atLineEnd || r.lineText.trim() === "") return;
			let i = He.suggestCompletion({
				path: n,
				lineText: r.lineText,
				lineIndex: r.lineIndex
			});
			i !== "" && b({
				path: n,
				lineIndex: r.lineIndex,
				text: i
			});
		}, Yr);
	}, te = (e) => {
		if (d === null) return;
		let t = e.target.value, n = e.target.selectionStart;
		m((e) => ({
			...e,
			[d]: t
		})), g((e) => e[d] === !0 ? e : {
			...e,
			[d]: !0
		}), S(n), b(null), I(t, n, d);
	}, ne = (n) => {
		if (d !== null) {
			if (n.key === "Tab" && y !== null && y.path === d) {
				n.preventDefault();
				let e = Ur(p[d] ?? "", n.currentTarget.selectionStart, y);
				m((t) => ({
					...t,
					[d]: e.text
				})), g((e) => ({
					...e,
					[d]: !0
				})), b(null), k.current = e.caret, S(e.caret), t.writeFile(i, d, e.text);
				return;
			}
			if (n.key === "Escape") {
				n.preventDefault(), n.stopPropagation();
				let t = Wr(y);
				b(t.ghost), t.cascade && (P(d), e.getState().escape());
				return;
			}
			T.current !== null && window.clearTimeout(T.current);
		}
	}, L = (e) => {
		S(e.currentTarget.selectionStart);
	}, re = (e) => {
		let t = e.currentTarget, n = O.current;
		n !== null && (n.style.transform = `translate(${-t.scrollLeft}px, ${-t.scrollTop}px)`);
	}, R = d === null ? "plain" : Gr(d), ie = Hr(A, x).lineIndex, ae = C.split("\n"), oe = ae.length > 400, se = oe ? ae.slice(0, 400) : ae;
	return /* @__PURE__ */ u("div", {
		className: "wr-ide",
		"data-testid": "ide-overlay",
		role: "dialog",
		"aria-label": "Web IDE",
		children: [/* @__PURE__ */ u("header", {
			className: "wr-ide-head",
			children: [
				/* @__PURE__ */ u("span", {
					className: "wr-ide-title",
					children: ["COGITATOR LENS — ", i]
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-ide-sub",
					children: M?.gitStatus.branch ?? ""
				}),
				/* @__PURE__ */ l("button", {
					type: "button",
					className: "wr-inspector-close",
					"aria-label": "Close IDE",
					onClick: () => {
						P(d), e.getState().closeIde();
					},
					children: "CLOSE"
				})
			]
		}), /* @__PURE__ */ u("div", {
			className: "wr-ide-body",
			children: [/* @__PURE__ */ u("nav", {
				className: "wr-ide-explorer",
				"data-testid": "ide-explorer",
				role: "tree",
				"aria-label": "Workspace explorer",
				children: [j === null && /* @__PURE__ */ l("div", {
					className: "wr-ide-empty",
					children: "the workspace shrine is dark"
				}), j !== null && (j.children ?? []).map((e) => /* @__PURE__ */ l(Zr, {
					node: e,
					depth: 0,
					changed: N,
					collapsed: _,
					onToggleDir: (e) => v((t) => {
						let n = new Set(t);
						return n.has(e) ? n.delete(e) : n.add(e), n;
					}),
					onOpenFile: F,
					activePath: d
				}, e.path))]
			}), /* @__PURE__ */ u("section", {
				className: "wr-ide-center",
				children: [/* @__PURE__ */ u("div", {
					className: "wr-ide-tabbar",
					role: "tablist",
					children: [s.map((e) => /* @__PURE__ */ u("span", {
						"data-testid": `ide-tab-${Vr(e)}`,
						role: "tab",
						"aria-selected": e === d,
						className: V("wr-ide-tab", e === d && "is-active", h[e] === !0 && "is-dirty"),
						onClick: () => {
							e !== d && F(e);
						},
						children: [
							/* @__PURE__ */ l("span", {
								className: "wr-ide-tab-name",
								children: e.split("/").pop()
							}),
							h[e] === !0 && /* @__PURE__ */ l("span", {
								className: "wr-ide-dirty-dot",
								"aria-label": "unsaved edits"
							}),
							/* @__PURE__ */ l("button", {
								type: "button",
								className: "wr-ide-tab-close",
								"aria-label": `Close ${e}`,
								onClick: (t) => {
									t.stopPropagation(), ee(e);
								},
								children: "×"
							})
						]
					}, e)), s.length === 0 && /* @__PURE__ */ l("span", {
						className: "wr-ide-tabbar-empty",
						children: "choose a scroll from the gallery"
					})]
				}), d === null ? /* @__PURE__ */ l("div", {
					className: "wr-ide-editor wr-ide-editor--empty",
					children: /* @__PURE__ */ l("div", {
						className: "wr-ide-empty",
						children: "the lens awaits a scroll — open a file from the explorer"
					})
				}) : /* @__PURE__ */ u("div", {
					className: "wr-ide-editor",
					children: [/* @__PURE__ */ u("div", {
						className: "wr-ide-backdrop",
						ref: O,
						"aria-hidden": !0,
						children: [/* @__PURE__ */ l("div", {
							className: "wr-ide-gutter",
							children: se.map((e, t) => /* @__PURE__ */ l("div", {
								className: V("wr-ide-lineno", t === ie && "is-lit"),
								children: t + 1
							}, t))
						}), /* @__PURE__ */ l("pre", {
							className: "wr-ide-highlight",
							children: /* @__PURE__ */ u("code", { children: [se.map((e, t) => /* @__PURE__ */ u("div", {
								className: V("wr-ide-line", t === ie && "is-lit"),
								children: [
									Jr(e, R).map((e, t) => e.cls === "plain" ? /* @__PURE__ */ l("span", { children: e.text }, t) : /* @__PURE__ */ l("span", {
										className: `tok-${e.cls}`,
										children: e.text
									}, t)),
									y !== null && y.path === d && y.lineIndex === t && /* @__PURE__ */ l("span", {
										className: "wr-ide-ghost",
										"data-testid": "ide-ghost",
										children: y.text
									}),
									e.length === 0 ? "​" : ""
								]
							}, t)), oe && /* @__PURE__ */ l("div", {
								className: "wr-ide-cap-notice",
								children: "the cogitator abridges the scroll here — the remaining verses exceed its plate"
							})] })
						})]
					}), /* @__PURE__ */ l("textarea", {
						ref: D,
						className: "wr-ide-buffer",
						value: A,
						wrap: "off",
						spellCheck: !1,
						autoComplete: "off",
						"aria-label": `Editor buffer for ${d}`,
						onChange: te,
						onKeyDown: ne,
						onSelect: L,
						onClick: L,
						onKeyUp: L,
						onScroll: re
					})]
				})]
			})]
		})]
	});
}
//#endregion
//#region src/game/memoryIO.ts
function $r(e, t) {
	return e ?? t;
}
function ei(e, t) {
	return e.find((e) => e.name === t)?.recordIds[0] ?? null;
}
function ti(e, t = 8) {
	let n = /* @__PURE__ */ new Set(), r = [];
	for (let i of e) if (!n.has(i.recordId) && (n.add(i.recordId), r.push(i.recordId), r.length >= t)) break;
	return r;
}
function ni(e, t = 8) {
	return e.slice(0, t).map((e) => e.updateId);
}
function ri(e) {
	return e.reduce((e, t) => e + t.changes.length, 0);
}
//#endregion
//#region src/game/memoryLayout.ts
var G = {
	width: 1200,
	height: 760
}, ii = 34, ai = 30, oi = 2.399963229728653;
function si(e) {
	return e.replace(/:/g, "-");
}
var ci = [
	168,
	352,
	42,
	75
];
function li(e) {
	let t = 0;
	for (let n = 0; n < e.length; n += 1) t = t * 31 + e.charCodeAt(n) >>> 0;
	return ci[t % ci.length] ?? 42;
}
function K(e) {
	return Math.round(e * 100) / 100;
}
function ui(e, t) {
	let n = G.width / 2, r = G.height / 2, i = (e.x + t.x) / 2, a = (e.y + t.y) / 2, o = i + (n - i) * .22, s = a + (r - a) * .22;
	return `M ${K(e.x)} ${K(e.y)} Q ${K(o)} ${K(s)} ${K(t.x)} ${K(t.y)}`;
}
function di(e) {
	let t = e <= 1 ? 1 : e <= 4 ? 2 : Math.ceil(Math.sqrt(e)), n = Math.ceil(e / t), r = (G.width - ii * (t + 1)) / t, i = (G.height - ii * (n + 1)) / n, a = [];
	for (let n = 0; n < e; n += 1) {
		let e = n % t, o = Math.floor(n / t);
		a.push({
			x: ii + e * (r + ii),
			y: ii + o * (i + ii),
			width: r,
			height: i
		});
	}
	return a;
}
function fi(e, t = []) {
	let n = [...new Set(e.map((e) => e.nodeKind))].sort(), r = /* @__PURE__ */ new Map();
	for (let e of t) for (let t of e.recordIds) r.has(t) || r.set(t, e.name);
	let i = t.map((e) => e.name), a = e.filter((e) => !r.has(e.id));
	if (i.length === 0 || a.length > 0) {
		let t = i.length === 0 ? "" : "archive";
		i.push(t);
		for (let e of a) r.set(e.id, t);
		if (i.length === 1 && t === "") for (let t of e) r.set(t.id, "");
	}
	let o = new Map(i.map((e) => [e, []])), s = [...e].sort((e, t) => e.id < t.id ? -1 : 1);
	for (let e of s) o.get(r.get(e.id) ?? i[i.length - 1])?.push(e);
	let c = di(i.length), l = [], u = /* @__PURE__ */ new Map(), d = [];
	i.forEach((e, t) => {
		let n = c[t];
		e !== "" && d.push({
			silo: e,
			x: K(n.x + 14),
			y: K(n.y + 20),
			rect: {
				x: K(n.x),
				y: K(n.y),
				width: K(n.width),
				height: K(n.height)
			}
		});
		let r = o.get(e) ?? [], i = n.x + n.width / 2, a = n.y + (n.height + ai) / 2, s = Math.min(n.width, n.height - ai) / 2 - 26, f = Math.sqrt(Math.max(1, r.length));
		r.forEach((t, n) => {
			let r = Math.sqrt(n + .55) / f * s, o = n * oi, c = {
				id: t.id,
				nodeKind: t.nodeKind,
				silo: e,
				x: K(i + Math.cos(o) * r),
				y: K(a + Math.sin(o) * r)
			};
			l.push(c), u.set(t.id, c);
		});
	});
	let f = [];
	for (let e of s) {
		let t = u.get(e.id);
		if (t === void 0 || e.edges === void 0) continue;
		let n = e.edges;
		for (let r of Object.keys(n).sort()) for (let i of n[r] ?? []) {
			let n = u.get(i.target);
			n !== void 0 && f.push({
				key: `${r}:${e.id}->${i.target}`,
				edgeKind: r,
				src: e.id,
				dst: i.target,
				d: ui(t, n)
			});
		}
	}
	return {
		nodes: l,
		edges: f,
		kinds: n,
		captions: d
	};
}
//#endregion
//#region src/components/panels/MemoryIOTab.tsx
function pi({ beads: e }) {
	if (e.length === 0) return null;
	let t = e.length * 34 + 8;
	return /* @__PURE__ */ u("svg", {
		className: "wr-memio-strip",
		viewBox: `0 0 ${t} 34`,
		style: { width: `${t}px` },
		"aria-hidden": !0,
		children: [/* @__PURE__ */ l("g", {
			className: "wr-memio-strip-edges",
			children: e.slice(0, -1).map((e, t) => {
				let n = 21 + t * 34, r = n + 34;
				return /* @__PURE__ */ l("path", {
					className: "wr-mem-edge wr-memio-strip-edge",
					d: `M ${n} 17 Q ${(n + r) / 2} 7 ${r} 17`,
					fill: "none"
				}, `edge-${e.key}`);
			})
		}), e.map((e, t) => /* @__PURE__ */ u("g", {
			className: "wr-mem-node wr-memio-strip-node",
			transform: `translate(${21 + t * 34} 17)`,
			style: { "--mem-hue": String(e.hue) },
			children: [
				/* @__PURE__ */ l("circle", {
					className: "wr-mem-node-ring",
					r: "8"
				}),
				/* @__PURE__ */ l("circle", {
					className: "wr-mem-node-dot",
					r: "6.2"
				}),
				/* @__PURE__ */ l("circle", {
					className: "wr-mem-node-gloss",
					cx: "-1.8",
					cy: "-2.1",
					r: "2"
				})
			]
		}, e.key))]
	});
}
function mi({ store: e, views: t, taskId: n, unitId: r }) {
	let i = B(e, (e) => e.board.memory.silos), a = $r(n, r);
	if (a === null) return /* @__PURE__ */ l("div", {
		className: "wr-inspector-body wr-tab-empty",
		children: "no memory traffic — nothing to inspect"
	});
	let o = t.getMemoryIO(a), s = new Map(o.read.map((e) => [e.recordId, e.kind])), d = ti(o.read).map((e) => ({
		key: e,
		hue: li(s.get(e) ?? "")
	})), f = ni(o.written).map((e) => ({
		key: e,
		hue: li("proposal")
	})), p = (t) => {
		e.getState().openArchiveAt(t);
	};
	return /* @__PURE__ */ u("div", {
		className: "wr-inspector-body wr-memio",
		children: [/* @__PURE__ */ u("section", {
			className: "wr-memio-sec",
			"aria-label": "Memory read ledger",
			children: [
				/* @__PURE__ */ l("h4", {
					className: "wr-memio-cap",
					children: "Read"
				}),
				/* @__PURE__ */ l(pi, { beads: d }),
				o.read.length === 0 ? /* @__PURE__ */ l("div", {
					className: "wr-tab-empty",
					children: "no pieces obtained yet — the cogitator has not queried"
				}) : /* @__PURE__ */ l("ul", {
					className: "wr-memio-list",
					children: o.read.map((e, t) => /* @__PURE__ */ u("li", {
						className: "wr-memio-piece",
						role: "button",
						tabIndex: 0,
						title: "open in the Archive",
						onClick: () => p(e.recordId),
						onKeyDown: (t) => {
							(t.key === "Enter" || t.key === " ") && p(e.recordId);
						},
						children: [
							/* @__PURE__ */ l("span", {
								className: "wr-memio-id",
								children: e.recordId
							}),
							" ",
							/* @__PURE__ */ l("span", {
								className: "wr-memio-kind",
								style: { "--mem-hue": String(li(e.kind)) },
								children: e.kind
							}),
							" ",
							/* @__PURE__ */ l("span", {
								className: "wr-memio-silo",
								children: e.silo
							}),
							" ",
							/* @__PURE__ */ u("span", {
								className: "wr-memio-tick",
								children: ["t", e.tick]
							})
						]
					}, `${e.recordId}-${e.tick}-${t}`))
				})
			]
		}), /* @__PURE__ */ u("section", {
			className: "wr-memio-sec",
			"aria-label": "Memory written ledger",
			children: [
				/* @__PURE__ */ l("h4", {
					className: "wr-memio-cap",
					children: "Written"
				}),
				/* @__PURE__ */ l(pi, { beads: f }),
				o.written.length === 0 ? /* @__PURE__ */ l("div", {
					className: "wr-tab-empty",
					children: "no proposals inscribed yet — completion sends updates"
				}) : /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ u("div", {
					className: "wr-memio-meta",
					children: [ri(o.written), " proposed changes"]
				}), /* @__PURE__ */ l("ul", {
					className: "wr-memio-list",
					children: o.written.map((e, t) => /* @__PURE__ */ u("li", {
						className: "wr-memio-piece",
						role: "button",
						tabIndex: 0,
						title: "open the target silo in the Archive",
						onClick: () => p(ei(i, e.silo)),
						onKeyDown: (t) => {
							(t.key === "Enter" || t.key === " ") && p(ei(i, e.silo));
						},
						children: [
							/* @__PURE__ */ l("span", {
								className: "wr-memio-id",
								children: e.updateId
							}),
							" ",
							/* @__PURE__ */ u("span", {
								className: "wr-memio-silo",
								children: ["→ ", e.silo]
							}),
							" ",
							/* @__PURE__ */ l("span", {
								className: "wr-memio-phase",
								children: e.phase
							}),
							" ",
							/* @__PURE__ */ u("span", {
								className: "wr-memio-changes",
								children: [e.changes.length, " changes"]
							}),
							" ",
							/* @__PURE__ */ u("span", {
								className: "wr-memio-tick",
								children: ["t", e.tick]
							})
						]
					}, `${e.updateId}-${t}`))
				})] })
			]
		})]
	});
}
//#endregion
//#region src/components/panels/SessionsTab.tsx
function hi({ session: e }) {
	return /* @__PURE__ */ u(c, { children: [
		/* @__PURE__ */ l("span", {
			className: V("wr-sess-role", `wr-sess-role--${e.role}`),
			children: e.role
		}),
		e.coordination && /* @__PURE__ */ l("span", {
			className: "wr-sess-role wr-sess-role--coordination",
			children: "coordination"
		}),
		/* @__PURE__ */ l("span", {
			className: "wr-sess-stack",
			title: "agent stack",
			children: e.stackName
		})
	] });
}
function gi({ session: e }) {
	return /* @__PURE__ */ l("span", {
		className: V("wr-sess-status", `wr-sess-status--${e.status}`),
		children: e.status
	});
}
function _i({ session: e }) {
	return /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l(hi, { session: e }), /* @__PURE__ */ l(gi, { session: e })] });
}
function vi(e) {
	return `T${_(e.startedTick)} → ${e.endedTick === null ? "now" : `T${_(e.endedTick)}`}`;
}
function yi({ node: e, views: t, onOpen: n }) {
	let r = e.session, i = R({
		entityId: r.sessionId,
		kind: "unit",
		adapter: r.agent
	}), a = r.reviewOfSessionId === null ? void 0 : t.getSession(r.reviewOfSessionId)?.record, o = r.tokenUsage.inputTokens + r.tokenUsage.outputTokens + r.tokenUsage.thinkingTokens;
	return /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ u("div", {
		"data-testid": `session-row-${r.sessionId}`,
		className: "wr-sess-row",
		role: "button",
		tabIndex: 0,
		onClick: () => n(r.sessionId),
		onKeyDown: (e) => {
			(e.key === "Enter" || e.key === " ") && n(r.sessionId);
		},
		children: [
			/* @__PURE__ */ l("span", {
				className: "wr-sess-portrait",
				"aria-hidden": !0,
				dangerouslySetInnerHTML: { __html: i.svg }
			}),
			/* @__PURE__ */ u("span", {
				className: "wr-sess-main",
				children: [
					/* @__PURE__ */ l("span", {
						className: "wr-sess-title",
						children: r.title
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-sess-chiprow wr-sess-chiprow--line",
						children: /* @__PURE__ */ l(hi, { session: r })
					}),
					/* @__PURE__ */ u("span", {
						className: "wr-sess-chiprow wr-sess-chiprow--line",
						children: [/* @__PURE__ */ l(gi, { session: r }), a !== void 0 && /* @__PURE__ */ u("button", {
							type: "button",
							className: "wr-sess-reviewed",
							title: `open the reviewed session — ${a.title}`,
							onClick: (e) => {
								e.stopPropagation(), n(a.sessionId);
							},
							children: ["reviewed ⟶ ", a.creatureName]
						})]
					})
				]
			}),
			/* @__PURE__ */ u("span", {
				className: "wr-sess-meta",
				children: [/* @__PURE__ */ u("span", {
					className: "wr-sess-meta-line",
					children: [
						_(r.turnCount),
						" turns · ",
						_(o),
						" tok · ",
						v(r.cost.totalUsd)
					]
				}), /* @__PURE__ */ l("span", {
					className: "wr-sess-meta-line wr-sess-ticks",
					children: vi(r)
				})]
			})
		]
	}), e.children.length > 0 && /* @__PURE__ */ l("div", {
		className: "wr-sess-children",
		children: e.children.map((e) => /* @__PURE__ */ l(yi, {
			node: e,
			views: t,
			onOpen: n
		}, e.session.sessionId))
	})] });
}
function bi({ sessions: e, views: n, onOpen: r }) {
	let i = jn(e);
	return i.length === 0 ? /* @__PURE__ */ l("div", {
		className: "wr-inspector-body wr-tab-empty",
		children: "no sessions yet — no agent has attended this card"
	}) : /* @__PURE__ */ l("div", {
		className: "wr-inspector-body wr-sessions",
		children: /* @__PURE__ */ l("div", {
			className: "wr-sess-scroll",
			children: i.map((e) => /* @__PURE__ */ u(t, { children: [/* @__PURE__ */ u("div", {
				className: "wr-sess-divider",
				children: ["ATTEMPT ", e.attempt]
			}), e.rows.map((e) => /* @__PURE__ */ l(yi, {
				node: e,
				views: n,
				onOpen: r
			}, e.session.sessionId))] }, e.attempt))
		})
	});
}
function xi({ entry: e }) {
	switch (e.kind) {
		case "thinking": return /* @__PURE__ */ u("li", {
			className: "wr-tr wr-tr--thinking",
			children: [/* @__PURE__ */ l("span", {
				className: "wr-tr-role",
				children: "THINKING"
			}), e.text]
		});
		case "tool_call":
		case "tool_result": return /* @__PURE__ */ u("li", {
			className: "wr-tr wr-tr--tool",
			children: [
				/* @__PURE__ */ l("span", {
					className: "wr-tr-tool-glyph",
					dangerouslySetInnerHTML: { __html: Gi }
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-tr-tool-name",
					children: e.toolName ?? "tool"
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-tr-tool-meta",
					children: e.kind === "tool_call" ? e.text : `→ ${e.text}`
				})
			]
		});
		case "user": return /* @__PURE__ */ u("li", {
			className: "wr-tr wr-tr--text wr-tr--user",
			children: [/* @__PURE__ */ l("span", {
				className: "wr-tr-role",
				children: "OPERATOR"
			}), e.text]
		});
		case "event": return /* @__PURE__ */ l("li", {
			className: "wr-sess-event",
			children: e.text
		});
		default: return /* @__PURE__ */ u("li", {
			className: "wr-tr wr-tr--text",
			children: [/* @__PURE__ */ l("span", {
				className: "wr-tr-role",
				children: "AGENT"
			}), e.text]
		});
	}
}
function Si({ sessionId: e, views: t, onOpen: r, onBack: i, hideParentLink: o = !1 }) {
	let s = t.getSession(e), c = a(null), d = s?.transcript.length ?? 0, f = s?.record.status === "active";
	if (n(() => {
		let e = c.current;
		e !== null && f && (e.scrollTop = e.scrollHeight);
	}, [
		d,
		e,
		f
	]), s === null) return /* @__PURE__ */ l("div", {
		className: "wr-inspector-body wr-tab-empty",
		"data-testid": "session-transcript",
		children: "unknown session — the archive holds no such record"
	});
	let p = s.record, m = R({
		entityId: p.sessionId,
		kind: "unit",
		adapter: p.agent
	}), h = p.parentSessionId === null ? void 0 : t.getSession(p.parentSessionId)?.record, g = p.reviewOfSessionId === null ? void 0 : t.getSession(p.reviewOfSessionId)?.record;
	return /* @__PURE__ */ u("div", {
		className: "wr-inspector-body wr-sess-transcript",
		"data-testid": "session-transcript",
		children: [
			/* @__PURE__ */ u("div", {
				className: "wr-sess-tr-head",
				children: [
					/* @__PURE__ */ l("span", {
						className: "wr-sess-portrait wr-sess-portrait--lg",
						"aria-hidden": !0,
						dangerouslySetInnerHTML: { __html: m.svg }
					}),
					/* @__PURE__ */ u("div", {
						className: "wr-sess-tr-id",
						children: [/* @__PURE__ */ l("div", {
							className: "wr-sess-tr-title",
							children: p.title
						}), /* @__PURE__ */ l("div", {
							className: "wr-sess-chiprow",
							children: /* @__PURE__ */ l(_i, { session: p })
						})]
					}),
					/* @__PURE__ */ u("span", {
						className: "wr-sess-meta",
						children: [/* @__PURE__ */ u("span", {
							className: "wr-sess-meta-line",
							children: [
								_(p.turnCount),
								" turns · ",
								v(p.cost.totalUsd)
							]
						}), /* @__PURE__ */ l("span", {
							className: "wr-sess-meta-line wr-sess-ticks",
							children: vi(p)
						})]
					})
				]
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-sess-linkrow",
				children: [
					/* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-sess-back",
						onClick: i,
						children: "‹ back to sessions"
					}),
					h !== void 0 && !o && /* @__PURE__ */ u("button", {
						type: "button",
						className: "wr-sess-linkchip",
						title: `open the parent session — ${h.title}`,
						onClick: () => r(h.sessionId),
						children: ["parent ⟶ ", h.title]
					}),
					g !== void 0 && /* @__PURE__ */ u("button", {
						type: "button",
						className: "wr-sess-linkchip",
						title: `open the reviewed session — ${g.title}`,
						onClick: () => r(g.sessionId),
						children: ["reviewed ⟶ ", g.creatureName]
					})
				]
			}),
			/* @__PURE__ */ u("ol", {
				ref: c,
				className: "wr-inspector-stream wr-sess-stream",
				"aria-label": "Session transcript (read-only)",
				children: [s.transcript.length === 0 && /* @__PURE__ */ l("li", {
					className: "wr-tr wr-tr--note",
					children: "an empty ledger — the session logged nothing"
				}), s.transcript.map((e) => /* @__PURE__ */ l(xi, { entry: e }, e.seq))]
			})
		]
	});
}
function Ci({ views: e, taskId: t, childIds: r }) {
	let [i, a] = o(Mn);
	if (n(() => {
		a(Mn);
	}, [t]), t === null) return /* @__PURE__ */ l("div", {
		className: "wr-inspector-body wr-tab-empty",
		children: "no card — sessions attach to cards"
	});
	let s = (e) => a(Nn(e));
	return i.mode === "transcript" ? /* @__PURE__ */ l(Si, {
		sessionId: i.sessionId,
		views: e,
		onOpen: s,
		onBack: () => a(Pn())
	}) : /* @__PURE__ */ l(bi, {
		sessions: An(e.listSessions(), t, r),
		views: e,
		onOpen: s
	});
}
//#endregion
//#region src/game/cogitatorShell.ts
var wi = "the cogitator does not know this incantation";
function Ti(e) {
	return {
		lines: e,
		clear: !1
	};
}
function Ei(e, t) {
	let n = t.replace(/^\.?\/?/, "").replace(/\/+$/, "");
	if (n === "" || n === ".") return e;
	let r = e;
	for (let e of n.split("/")) {
		let t = (r.children ?? []).find((t) => t.name === e);
		if (t === void 0 || t.type !== "dir") return null;
		r = t;
	}
	return r;
}
function Di(e) {
	return e?.gitStatus.branch ?? "main";
}
function Oi() {
	return [
		"the cogitator answers these incantations:",
		"  help            this litany",
		"  pwd             where the workspace shrine stands",
		"  ls [dir]        list the gallery (dirs suffixed /)",
		"  cat <path>      recite a scroll",
		"  git status      changed files (A/M/D)",
		"  git diff [path] the diff plates",
		"  git log         the commit ledger",
		"  npm test        replay the trial rites",
		"  clear           wipe the slate"
	];
}
function ki(e, t) {
	let n = e.getWorkspaceTree(e.taskId);
	if (n === null) return ["ls: the workspace shrine is dark — no tree observed"];
	let r = Ei(n, t);
	if (r === null) return [`ls: no such gallery: ${t}`];
	let i = r.children ?? [];
	return i.length === 0 ? ["(an empty gallery)"] : i.map((e) => e.type === "dir" ? `${e.name}/` : e.name);
}
function Ai(e, t) {
	if (t === "") return ["cat: name the scroll to recite"];
	let n = e.getFileContent(e.taskId, t);
	return n === null ? [`cat: the cogitator finds no scroll at ${t}`] : n.split("\n");
}
function ji(e) {
	let t = e.getWorkspaceView(e.taskId);
	if (t === null) return ["git status: no workspace consecrated for this card"];
	let n = [`on branch ${Di(t)}`];
	if (t.files.length === 0) return n.push("the shrine is clean — nothing to commit"), n;
	n.push("changes scribed on the workspace:");
	for (let e of t.files) n.push(`  ${e.status}  ${e.path}`);
	return n.push(`${t.files.length} file(s) changed`), n;
}
function Mi(e, t) {
	let n = e.getWorkspaceView(e.taskId);
	if (n === null) return ["git diff: no workspace consecrated for this card"];
	let r = t === "" ? n.files : n.files.filter((e) => e.path === t);
	if (r.length === 0) return [t === "" ? "no diff plates etched yet" : `git diff: no plate for ${t}`];
	let i = [];
	for (let e of r) i.push(`--- a/${e.path}`, `+++ b/${e.path}`, ...e.diff.split("\n"));
	return i;
}
function Ni(e) {
	let t = e.getGitLog(e.taskId);
	return t.length === 0 ? ["the ledger is blank — no commits observed"] : t.map((e) => `${e.sha.slice(0, 7)}  ${e.message}  (tick ${e.tick})`);
}
function Pi(e) {
	let t = e.getWorkspaceView(e.taskId)?.testEvidence ?? { status: "unknown" }, n = ["> invoking the trial rites…", "  [/] gears engage  [-] plates warm  [\\] runes settle"];
	switch (t.status) {
		case "passed":
			n.push(`tests: PASSED — ${t.summary ?? "every rite satisfied"}`);
			break;
		case "failed":
			n.push(`tests: FAILED — ${t.summary ?? "a rite was found wanting"}`);
			break;
		default:
			n.push("tests: no evidence inscribed yet");
			break;
	}
	return n;
}
function Fi(e, t) {
	let n = e.trim();
	if (n === "") return Ti([]);
	let [r = "", ...i] = n.split(/\s+/), a = i.join(" ");
	switch (r) {
		case "help": return Ti(Oi());
		case "pwd": {
			let e = t.getWorkspaceView(t.taskId);
			return Ti([`/workspaces/${t.workspaceId}/${Di(e)}`]);
		}
		case "ls": return Ti(ki(t, a));
		case "cat": return Ti(Ai(t, a));
		case "git": {
			let [e = "", ...n] = i;
			return Ti(e === "status" ? ji(t) : e === "diff" ? Mi(t, n.join(" ")) : e === "log" ? Ni(t) : [`${wi}: git ${e}`.trimEnd()]);
		}
		case "npm": return i[0] === "test" ? Ti(Pi(t)) : Ti([`${wi}: ${n}`]);
		case "clear": return {
			lines: [],
			clear: !0
		};
		default: return Ti([`${wi}: ${n}`]);
	}
}
function Ii(e, t, n) {
	if (e.length === 0) return {
		index: -1,
		text: ""
	};
	let r = e.length, i = Math.max(0, Math.min(r, (t < 0 ? r : t) + n));
	return i >= r ? {
		index: -1,
		text: ""
	} : {
		index: i,
		text: e[i]
	};
}
//#endregion
//#region src/components/panels/TerminalTab.tsx
var Li = ["AEGIS COGITATOR — remote shell consecrated", "speak `help` for the litany of incantations"];
function Ri({ taskId: e, workspaceId: t, views: r }) {
	let [i, s] = o(() => Li.map((e, t) => ({
		id: t,
		kind: "out",
		text: e
	}))), [c, d] = o(""), [f, p] = o([]), [m, h] = o(-1), g = a(Li.length), _ = a(null), v = a(null);
	if (n(() => {
		s(Li.map((e, t) => ({
			id: t,
			kind: "out",
			text: e
		}))), d(""), p([]), h(-1), g.current = Li.length;
	}, [e]), n(() => {
		let e = _.current;
		e !== null && (e.scrollTop = e.scrollHeight);
	}, [i]), e === null) return /* @__PURE__ */ l("div", {
		className: "wr-inspector-body wr-tab-empty",
		children: "no workspace — the terminal has nothing to consecrate"
	});
	let y = `cogitator:${t || e}$`, b = () => {
		let n = c, i = Fi(n, {
			taskId: e,
			workspaceId: t,
			getWorkspaceTree: (e) => r.getWorkspaceTree(e),
			getFileContent: (e, t) => r.getFileContent(e, t),
			getGitLog: (e) => r.getGitLog(e),
			getWorkspaceView: (e) => r.getWorkspaceView(e)
		});
		s((e) => {
			if (i.clear) return [];
			let t = [...e, {
				id: g.current += 1,
				kind: "echo",
				text: `${y} ${n}`
			}];
			for (let e of i.lines) t.push({
				id: g.current += 1,
				kind: "out",
				text: e
			});
			return t;
		}), n.trim() !== "" && p((e) => [...e, n]), h(-1), d("");
	};
	return /* @__PURE__ */ u("div", {
		className: "wr-inspector-body wr-terminal",
		onClick: () => v.current?.focus(),
		children: [/* @__PURE__ */ l("div", {
			className: "wr-terminal-output",
			"data-testid": "terminal-output",
			ref: _,
			children: i.map((e) => /* @__PURE__ */ l("div", {
				className: `wr-terminal-line wr-terminal-line--${e.kind}`,
				children: e.text
			}, e.id))
		}), /* @__PURE__ */ u("div", {
			className: "wr-terminal-inputrow",
			children: [
				/* @__PURE__ */ l("span", {
					className: "wr-terminal-prompt",
					"aria-hidden": !0,
					children: y
				}),
				/* @__PURE__ */ l("input", {
					ref: v,
					"data-testid": "terminal-input",
					className: "wr-terminal-input",
					type: "text",
					value: c,
					spellCheck: !1,
					autoComplete: "off",
					"aria-label": "Cogitator terminal input",
					onChange: (e) => d(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Enter") {
							e.preventDefault(), b();
							return;
						}
						if (e.key === "ArrowUp" || e.key === "ArrowDown") {
							e.preventDefault();
							let t = Ii(f, m, e.key === "ArrowUp" ? -1 : 1);
							h(t.index), d(t.text);
						}
					}
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-terminal-cursor",
					"aria-hidden": !0
				})
			]
		})]
	});
}
//#endregion
//#region src/game/diff.ts
function zi(e) {
	return e.startsWith("+++") || e.startsWith("---") || e.startsWith("@@") || e.startsWith("diff ") ? "meta" : e.startsWith("+") ? "add" : e.startsWith("-") ? "del" : "context";
}
function Bi(e) {
	return e.split("\n").filter((e) => e.length > 0).map((e) => {
		let t = zi(e);
		switch (t) {
			case "add": return {
				kind: t,
				text: e.slice(1),
				marker: "+"
			};
			case "del": return {
				kind: t,
				text: e.slice(1),
				marker: "-"
			};
			case "meta": return {
				kind: t,
				text: e,
				marker: "@"
			};
			default: return {
				kind: t,
				text: e,
				marker: ""
			};
		}
	});
}
//#endregion
//#region src/components/panels/WorkspaceView.tsx
function Vi(e) {
	return e.slice(0, 8);
}
function Hi({ ws: e }) {
	let t = e.gitStatus;
	return /* @__PURE__ */ u("div", {
		className: "wr-ws-head",
		children: [
			/* @__PURE__ */ l("span", {
				className: "wr-ws-branch",
				title: "branch",
				children: t.branch
			}),
			/* @__PURE__ */ l("span", {
				className: "wr-ws-sha",
				title: t.headSha,
				children: Vi(t.headSha)
			}),
			(t.ahead !== void 0 || t.behind !== void 0) && /* @__PURE__ */ l("span", {
				className: "wr-ws-aheadbehind",
				title: "ahead / behind base",
				children: `↑${t.ahead ?? 0} ↓${t.behind ?? 0}`
			}),
			/* @__PURE__ */ u("span", {
				className: V("wr-ws-evidence", `wr-ws-evidence--${e.testEvidence.status}`),
				title: e.testEvidence.summary ?? "test evidence",
				children: ["tests ", e.testEvidence.status]
			}),
			t.dirty ? /* @__PURE__ */ u("span", {
				className: "wr-ws-dirty",
				title: `${t.uncommittedCount ?? 0} uncommitted file(s)`,
				children: ["dirty ", t.uncommittedCount ?? 0]
			}) : /* @__PURE__ */ l("span", {
				className: "wr-ws-clean",
				children: "clean"
			}),
			/* @__PURE__ */ l("span", {
				className: "wr-ws-phase",
				children: e.phase
			})
		]
	});
}
function Ui({ diff: e }) {
	return /* @__PURE__ */ l("div", {
		className: "wr-diff-plate",
		children: /* @__PURE__ */ l("div", {
			className: "wr-diff-scroll",
			children: Bi(e).map((e, t) => /* @__PURE__ */ u("div", {
				className: V("wr-diff-row", e.kind === "add" && "wr-diff-add", e.kind === "del" && "wr-diff-del", e.kind === "meta" && "wr-diff-meta"),
				children: [
					/* @__PURE__ */ l("span", {
						className: "wr-diff-num",
						"data-n": t + 1,
						"aria-hidden": !0
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-diff-marker",
						children: e.marker
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-diff-text",
						children: e.text
					})
				]
			}, t))
		})
	});
}
function Wi({ files: e, openIndex: t, onToggle: n }) {
	return e.length === 0 ? /* @__PURE__ */ l("div", {
		className: "wr-ws-empty",
		children: "no workspace changes yet"
	}) : /* @__PURE__ */ l("div", {
		className: "wr-ws-files",
		children: e.map((e, r) => /* @__PURE__ */ u("div", {
			className: "wr-ws-fileblock",
			children: [/* @__PURE__ */ u("button", {
				type: "button",
				"data-testid": `ws-file-${r}`,
				className: V("wr-ws-file", t === r && "is-open"),
				onClick: () => n(r),
				title: `${e.path} — click to ${t === r ? "close" : "open"} the diff plate`,
				children: [
					/* @__PURE__ */ l("span", {
						className: V("wr-ws-status", `wr-ws-status--${e.status}`),
						children: e.status
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-ws-path",
						children: e.path
					}),
					/* @__PURE__ */ u("span", {
						className: "wr-ws-counts",
						children: [/* @__PURE__ */ u("em", {
							className: "wr-ws-adds",
							children: ["+", e.additions]
						}), /* @__PURE__ */ u("em", {
							className: "wr-ws-dels",
							children: ["-", e.deletions]
						})]
					})
				]
			}), t === r && /* @__PURE__ */ l(Ui, { diff: e.diff })]
		}, e.path))
	});
}
//#endregion
//#region src/components/panels/Inspector.tsx
var Gi = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><path d=\"M8 5.2 A2.8 2.8 0 1 0 8 10.8 A2.8 2.8 0 1 0 8 5.2 Z M8 1.5 V3.5 M8 12.5 V14.5 M1.5 8 H3.5 M12.5 8 H14.5 M3.4 3.4 L4.8 4.8 M11.2 11.2 L12.6 12.6 M12.6 3.4 L11.2 4.8 M4.8 11.2 L3.4 12.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\"/></svg>", Ki = 28, qi = [
	{
		id: "transcript",
		label: "Transcript"
	},
	{
		id: "sessions",
		label: "Sessions"
	},
	{
		id: "process",
		label: "Process"
	},
	{
		id: "workspace",
		label: "Workspace"
	},
	{
		id: "memory",
		label: "Memory"
	},
	{
		id: "terminal",
		label: "Terminal"
	}
];
function Ji({ entry: e, live: t }) {
	switch (e.kind) {
		case "turn": return /* @__PURE__ */ l("li", {
			className: "wr-tr wr-tr--turn",
			children: e.text
		});
		case "tool": return /* @__PURE__ */ u("li", {
			className: V("wr-tr wr-tr--tool", e.toolStatus === "failed" && "wr-tr--tool-failed", e.toolStatus === "running" && "wr-tr--tool-running"),
			children: [
				/* @__PURE__ */ l("span", {
					className: "wr-tr-tool-glyph",
					dangerouslySetInnerHTML: { __html: Gi }
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-tr-tool-name",
					children: e.toolName ?? "tool"
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-tr-tool-meta",
					children: e.durationMs === void 0 ? e.toolStatus === "failed" ? "FAILED" : "running…" : `${_(e.durationMs)}ms`
				})
			]
		});
		case "thinking": return /* @__PURE__ */ u("li", {
			className: V("wr-tr wr-tr--thinking", t && "is-live"),
			children: [/* @__PURE__ */ l("span", {
				className: "wr-tr-role",
				children: "THINKING"
			}), e.text]
		});
		case "text": return /* @__PURE__ */ u("li", {
			className: "wr-tr wr-tr--text",
			children: [/* @__PURE__ */ l("span", {
				className: "wr-tr-role",
				children: "AGENT"
			}), e.text]
		});
		default: return /* @__PURE__ */ l("li", {
			className: "wr-tr wr-tr--note",
			children: e.text
		});
	}
}
function Yi({ resolved: e }) {
	let t = me({
		id: e.optionId,
		caption: e.caption,
		...e.tone === void 0 ? {} : { tone: e.tone }
	});
	return /* @__PURE__ */ u("li", {
		className: "wr-tr wr-tr--inquiry is-resolved",
		children: [/* @__PURE__ */ l("div", {
			className: "wr-inq-question",
			children: e.question
		}), /* @__PURE__ */ u("div", {
			className: "wr-inq-resolved",
			children: [/* @__PURE__ */ l("span", {
				className: "wr-inq-opt-icon",
				"aria-hidden": !0,
				dangerouslySetInnerHTML: { __html: t.svg }
			}), /* @__PURE__ */ l("span", {
				className: "wr-inq-resolved-caption",
				children: e.caption
			})]
		})]
	});
}
function Xi({ unit: e, inquiries: t, resolved: r, onChoose: i }) {
	let s = a(null), c = a(!0), [d, f] = o(!0), p = e.transcript.length + t.length + r.length;
	n(() => {
		c.current = !0, f(!0);
	}, [e.id]), n(() => {
		let e = s.current;
		e !== null && c.current && (e.scrollTop = e.scrollHeight);
	}, [p, e.id]);
	let m = e.transcript[e.transcript.length - 1];
	return /* @__PURE__ */ u("div", {
		className: "wr-inspector-body",
		children: [/* @__PURE__ */ u("ol", {
			ref: s,
			className: "wr-inspector-stream",
			onScroll: (e) => {
				let t = e.currentTarget, n = t.scrollHeight - t.scrollTop - t.clientHeight < Ki;
				c.current !== n && (c.current = n, f(n));
			},
			children: [
				e.transcript.length === 0 && /* @__PURE__ */ l("li", {
					className: "wr-tr wr-tr--note",
					children: "no transcript yet — unit has not run"
				}),
				e.transcript.map((t) => /* @__PURE__ */ l(Ji, {
					entry: t,
					live: t === m && e.view.state === "thinking"
				}, t.id)),
				r.map((e) => /* @__PURE__ */ l(Yi, { resolved: e }, `res-${e.hookRequestId}`)),
				t.map((e) => /* @__PURE__ */ u("li", {
					className: "wr-tr wr-tr--inquiry",
					children: [/* @__PURE__ */ l("div", {
						className: "wr-inq-question",
						children: e.question
					}), /* @__PURE__ */ l(xn, {
						inquiry: e,
						withTestIds: !1,
						onChoose: (t) => i(e, t.id, t.caption, t.tone)
					})]
				}, `inq-${e.hookRequestId}`))
			]
		}), !d && /* @__PURE__ */ l("button", {
			type: "button",
			className: "wr-inspector-jump",
			onClick: () => {
				let e = s.current;
				e !== null && (e.scrollTop = e.scrollHeight), c.current = !0, f(!0);
			},
			children: "LATEST"
		})]
	});
}
function Zi({ observation: e, simStartMs: t }) {
	let r = a(null), i = a(!0), [s, c] = o(!0);
	if (n(() => {
		let e = r.current;
		e !== null && i.current && (e.scrollTop = e.scrollHeight);
	}, [e?.journal.length ?? 0]), e === null) return /* @__PURE__ */ l("div", {
		className: "wr-inspector-body wr-tab-empty",
		children: "no run observed — the card has not started work"
	});
	let d = (e) => {
		let t = e.currentTarget, n = t.scrollHeight - t.scrollTop - t.clientHeight < Ki;
		i.current !== n && (i.current = n, c(n));
	}, f = Object.entries(e.pendingEffectsByKind).sort(([e], [t]) => e.localeCompare(t));
	return /* @__PURE__ */ u("div", {
		className: "wr-inspector-body wr-process",
		children: [
			/* @__PURE__ */ u("div", {
				className: "wr-process-head",
				children: [/* @__PURE__ */ l("span", {
					className: `wr-runstate wr-runstate--${e.observedState}`,
					children: e.observedState
				}), /* @__PURE__ */ l("span", {
					className: "wr-process-runid",
					title: e.runId,
					children: e.runId
				})]
			}),
			/* @__PURE__ */ l("div", {
				className: "wr-stage-pipeline",
				"aria-label": "Process stages",
				children: e.phases.map((e) => /* @__PURE__ */ u("span", {
					className: V("wr-stage", e.status === "done" && "wr-stage--done", e.status === "current" && "wr-stage--now", e.status === "pending" && "wr-stage--pending"),
					...e.status === "current" ? { "data-current": "true" } : {},
					children: [e.status === "current" && /* @__PURE__ */ l("span", {
						className: "wr-stage-gear",
						"aria-hidden": !0,
						dangerouslySetInnerHTML: { __html: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"100%\" height=\"100%\" aria-hidden=\"true\"><path d=\"M8 5.2 A2.8 2.8 0 1 0 8 10.8 A2.8 2.8 0 1 0 8 5.2 Z M8 1.5 V3.5 M8 12.5 V14.5 M1.5 8 H3.5 M12.5 8 H14.5 M3.4 3.4 L4.8 4.8 M11.2 11.2 L12.6 12.6 M12.6 3.4 L11.2 4.8 M4.8 11.2 L3.4 12.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\"/></svg>" }
					}), e.label]
				}, e.label))
			}),
			f.length > 0 && /* @__PURE__ */ l("div", {
				className: "wr-effect-chips",
				"aria-label": "Pending effects",
				children: f.map(([e, t]) => /* @__PURE__ */ u("span", {
					className: V("wr-effect-chip", e === "breakpoint" && t > 0 && "wr-effect-chip--pulse"),
					children: [
						e,
						" ×",
						t
					]
				}, e))
			}),
			/* @__PURE__ */ l("ol", {
				ref: r,
				className: "wr-journal",
				onScroll: d,
				"aria-label": "Run journal",
				children: e.journal.map((e) => /* @__PURE__ */ u("li", {
					className: "wr-journal-row",
					children: [
						/* @__PURE__ */ l("span", {
							className: "wr-journal-seq",
							children: String(e.seq).padStart(3, "0")
						}),
						/* @__PURE__ */ l("span", {
							className: `wr-journal-type wr-journal-type--${e.type.toLowerCase()}`,
							children: e.type
						}),
						/* @__PURE__ */ l("span", {
							className: "wr-journal-label",
							children: typeof e.data.label == "string" ? e.data.label : ""
						}),
						/* @__PURE__ */ l("span", {
							className: "wr-journal-ts",
							children: g(e.recordedAt, t)
						})
					]
				}, e.seq))
			}),
			!s && /* @__PURE__ */ l("button", {
				type: "button",
				className: "wr-inspector-jump",
				onClick: () => {
					let e = r.current;
					e !== null && (e.scrollTop = e.scrollHeight), i.current = !0, c(!0);
				},
				children: "LATEST"
			})
		]
	});
}
function Qi({ taskId: e, views: t }) {
	let [n, r] = o(null), i = e === null ? null : t.getWorkspaceView(e);
	return i === null ? /* @__PURE__ */ l("div", {
		className: "wr-inspector-body wr-tab-empty",
		children: "no workspace — the card has no working copy"
	}) : /* @__PURE__ */ u("div", {
		className: "wr-inspector-body wr-workspace",
		children: [/* @__PURE__ */ l(Hi, { ws: i }), /* @__PURE__ */ l("div", {
			className: "wr-workspace-scroll",
			children: /* @__PURE__ */ l(Wi, {
				files: i.files,
				openIndex: n,
				onToggle: (e) => r((t) => t === e ? null : e)
			})
		})]
	});
}
function $i({ unit: e }) {
	let t = e.view.tokenUsage;
	return /* @__PURE__ */ u("footer", {
		className: "wr-inspector-foot",
		"aria-label": "Token usage",
		children: [
			/* @__PURE__ */ u("span", {
				className: "wr-foot-cell",
				children: [/* @__PURE__ */ l("em", { children: "IN" }), _(t.inputTokens)]
			}),
			/* @__PURE__ */ u("span", {
				className: "wr-foot-cell",
				children: [/* @__PURE__ */ l("em", { children: "OUT" }), _(t.outputTokens)]
			}),
			/* @__PURE__ */ u("span", {
				className: "wr-foot-cell",
				children: [/* @__PURE__ */ l("em", { children: "THINK" }), _(t.thinkingTokens)]
			}),
			/* @__PURE__ */ u("span", {
				className: "wr-foot-cell",
				children: [/* @__PURE__ */ l("em", { children: "CACHE" }), _(t.cachedTokens)]
			}),
			/* @__PURE__ */ u("span", {
				className: "wr-foot-cell wr-foot-cell--cost",
				children: [/* @__PURE__ */ l("em", { children: "COST" }), v(e.view.cost.totalUsd)]
			})
		]
	});
}
function ea({ store: e, orders: t, views: n }) {
	let r = B(e, (e) => e.meta.inspectorUnitId), i = B(e, (e) => e.meta.inspectorTaskId), a = B(e, (e) => e.meta.inspectorTab), o = B(e, (e) => e.world.units), s = B(e, (e) => e.board), d = B(e, (e) => e.meta.simStartMs);
	B(e, (e) => e.meta.tickIndex);
	let f = r === null ? void 0 : o[r];
	if (r === null && i === null || r !== null && f === void 0 && i === null) return null;
	let p = i ?? f?.view.taskId ?? null, m = p === null ? void 0 : s.cards[p], h = p === null ? null : n.getRunObservation(p), g;
	if (f !== void 0) {
		let t = R({
			entityId: f.id,
			kind: "unit",
			adapter: f.view.agent
		}), n = s.agents[f.id];
		g = /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("div", {
			className: "wr-inspector-portrait",
			dangerouslySetInnerHTML: { __html: t.svg }
		}), /* @__PURE__ */ u("div", {
			className: "wr-inspector-id",
			children: [
				/* @__PURE__ */ l("div", {
					className: "wr-inspector-name",
					children: f.view.title
				}),
				/* @__PURE__ */ u("div", {
					className: "wr-inspector-sub",
					children: [
						f.view.agent,
						" · ",
						f.view.model,
						n !== void 0 && /* @__PURE__ */ l("button", {
							type: "button",
							className: "wr-inspector-stack",
							title: "agent stack — view in the Registry",
							onClick: () => e.getState().openRegistryStack(n.stackRef),
							children: n.stackName
						})
					]
				}),
				m !== void 0 && /* @__PURE__ */ l("div", {
					className: "wr-inspector-sub wr-inspector-attended",
					title: "attended card",
					children: m.view.title
				}),
				/* @__PURE__ */ l("div", {
					className: `wr-sel-state wr-sel-state--${f.view.state}`,
					children: f.view.state
				})
			]
		})] });
	} else if (m !== void 0) g = /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("div", {
		className: "wr-inspector-portrait",
		dangerouslySetInnerHTML: { __html: R({
			entityId: m.id,
			kind: "task",
			taskKind: m.view.taskKind
		}).svg }
	}), /* @__PURE__ */ u("div", {
		className: "wr-inspector-id",
		children: [/* @__PURE__ */ l("div", {
			className: "wr-inspector-name",
			children: m.view.title
		}), /* @__PURE__ */ u("div", {
			className: "wr-inspector-sub",
			children: [
				m.view.taskKind,
				" · ",
				m.view.column
			]
		})]
	})] });
	else return null;
	let _ = f === void 0 ? [] : s.inquiries.filter((e) => e.unitId === f.id), v = f === void 0 ? [] : s.resolvedInquiries[f.id] ?? [];
	return /* @__PURE__ */ u("aside", {
		className: "wr-inspector",
		"data-testid": "inspector",
		"aria-label": "Session inspector",
		children: [
			/* @__PURE__ */ u("header", {
				className: "wr-inspector-head",
				children: [g, /* @__PURE__ */ l("button", {
					type: "button",
					className: "wr-inspector-close",
					"aria-label": "Close inspector",
					onClick: () => e.getState().closeInspector(),
					children: "CLOSE"
				})]
			}),
			/* @__PURE__ */ l("nav", {
				className: "wr-inspector-tabs",
				"aria-label": "Inspector tabs",
				children: qi.map(({ id: t, label: n }) => /* @__PURE__ */ l("button", {
					type: "button",
					"data-testid": `inspector-tab-${t}`,
					className: V("wr-inspector-tab", a === t && "is-active"),
					onClick: () => e.getState().setInspectorTab(t),
					children: n
				}, t))
			}),
			a === "transcript" && (f === void 0 ? /* @__PURE__ */ l("div", {
				className: "wr-inspector-body wr-tab-empty",
				children: "no attending agent — no transcript"
			}) : /* @__PURE__ */ l(Xi, {
				unit: f,
				inquiries: _,
				resolved: v,
				onChoose: (n, r, i, a) => {
					e.getState().recordResolvedInquiry({
						hookRequestId: n.hookRequestId,
						unitId: n.unitId,
						taskId: n.taskId,
						question: n.question,
						optionId: r,
						caption: i,
						...a === void 0 ? {} : { tone: a }
					}), t.answerInquiry(n.hookRequestId, r);
				}
			})),
			a === "sessions" && /* @__PURE__ */ l(Ci, {
				views: n,
				taskId: p,
				childIds: m?.view.childIds ?? []
			}),
			a === "process" && /* @__PURE__ */ l(Zi, {
				observation: h,
				simStartMs: d
			}),
			a === "workspace" && /* @__PURE__ */ l(Qi, {
				taskId: p,
				views: n
			}),
			a === "memory" && /* @__PURE__ */ l(mi, {
				store: e,
				views: n,
				taskId: p,
				unitId: f?.id ?? null
			}),
			a === "terminal" && /* @__PURE__ */ l(Ri, {
				taskId: p,
				workspaceId: m?.view.workspaceId ?? f?.view.workspaceId ?? "",
				views: n
			}),
			f !== void 0 && /* @__PURE__ */ l($i, { unit: f })
		]
	});
}
//#endregion
//#region src/game/archiveView.ts
var ta = .5, na = 2.5, ra = {
	k: 1,
	tx: 0,
	ty: 0
};
function ia(e) {
	return Math.min(na, Math.max(ta, e));
}
function aa(e) {
	return 1.25 ** (-e / 120);
}
function oa(e, t, n) {
	let r = ia(e.k * t);
	if (r === e.k) return e;
	let i = r / e.k;
	return {
		k: r,
		tx: n.x - (n.x - e.tx) * i,
		ty: n.y - (n.y - e.ty) * i
	};
}
function sa(e, t, n, r) {
	if (e.k <= 1) return e;
	let i = (t.minX + t.maxX) / 2, a = (t.minY + t.maxY) / 2, o = e.tx + e.k * i, s = e.ty + e.k * a, c = Math.min(1, (e.k - 1) / (na - 1)), l = n * .35 * c, u = r * .35 * c, d = Math.min(n - l, Math.max(l, o)), f = Math.min(r - u, Math.max(u, s));
	return d === o && f === s ? e : {
		k: e.k,
		tx: e.tx + (d - o),
		ty: e.ty + (f - s)
	};
}
function ca(e, t, n = 120) {
	if (t.length === 0) return e;
	let r = t[0], i = Math.hypot(r.x - e.x, r.y - e.y);
	for (let n = 1; n < t.length; n += 1) {
		let a = t[n], o = Math.hypot(a.x - e.x, a.y - e.y);
		o < i && (i = o, r = a);
	}
	if (i <= n) return e;
	let a = Math.min(1, (i - n) / n) * 1;
	return {
		x: e.x + (r.x - e.x) * a,
		y: e.y + (r.y - e.y) * a
	};
}
function la(e, t, n) {
	return t === 0 && n === 0 ? e : {
		k: e.k,
		tx: e.tx + t,
		ty: e.ty + n
	};
}
function ua(e, t, n, r, i) {
	let a = Math.min(e.width / r, e.height / i) || 1, o = (e.width - r * a) / 2, s = (e.height - i * a) / 2;
	return {
		x: (t - e.left - o) / a,
		y: (n - e.top - s) / a,
		scale: a
	};
}
function da(e) {
	return e.toLowerCase().replace(/:/g, "-");
}
function fa(e, t) {
	let n = da(t.trim()), r = /* @__PURE__ */ new Set();
	if (n.length === 0) return r;
	for (let t of e) (da(t.id).includes(n) || da(t.attributes.title).includes(n)) && r.add(t.id);
	return r;
}
function pa(e, t, n, r, i, a = 32) {
	let o = e.tx + e.k * t, s = e.ty + e.k * n;
	return o >= -a && o <= r + a && s >= -a && s <= i + a;
}
function ma(e, t, n, r, i, a, o = !0, s = !0) {
	for (let e of a) if (e !== null && (r === e || i === e)) return !0;
	return !(t !== n || e > 1 && !o && !s);
}
//#endregion
//#region src/components/panels/MemoryOverlay.tsx
function ha({ store: e }) {
	let t = B(e, (e) => e.meta.archiveOpen), r = B(e, (e) => e.meta.archiveFocusId), s = B(e, (e) => e.board.memory), c = B(e, (e) => e.board.agents), d = B(e, (e) => e.selection.ids), f = B(e, (e) => e.meta.memoryPulses), p = B(e, (e) => e.board.heldByCard), [m, h] = o(null), [g, _] = o(null), [v, y] = o(null), [b, x] = o(ra), [S, C] = o(""), w = a(null), T = a(null), E = i(() => fi(s.records, s.silos), [s.records, s.silos]), D = i(() => {
		let e = /* @__PURE__ */ new Map();
		for (let t of E.nodes) {
			let n = e.get(t.silo) ?? {
				x: 0,
				y: 0,
				n: 0
			};
			n.x += t.x, n.y += t.y, n.n += 1, e.set(t.silo, n);
		}
		return Array.from(e.values()).map((e) => ({
			x: e.x / e.n,
			y: e.y / e.n
		}));
	}, [E.nodes]), O = i(() => {
		if (E.nodes.length === 0) return {
			minX: 0,
			minY: 0,
			maxX: G.width,
			maxY: G.height
		};
		let e = Infinity, t = Infinity, n = -Infinity, r = -Infinity;
		for (let i of E.nodes) i.x < e && (e = i.x), i.y < t && (t = i.y), i.x > n && (n = i.x), i.y > r && (r = i.y);
		return {
			minX: e,
			minY: t,
			maxX: n,
			maxY: r
		};
	}, [E.nodes]);
	if (n(() => {
		t && (x(ra), C(""), _(r));
	}, [t, r]), n(() => {
		let e = w.current;
		if (!t || e === null) return;
		let n = (t) => {
			t.preventDefault();
			let n = ua(e.getBoundingClientRect(), t.clientX, t.clientY, G.width, G.height), r = aa(t.deltaY);
			x((e) => {
				let t = r > 1 ? ca(n, D.map((t) => ({
					x: e.tx + e.k * t.x,
					y: e.ty + e.k * t.y
				}))) : n, i = oa(e, r, t);
				return t === n ? sa(i, O, G.width, G.height) : i;
			});
		};
		return e.addEventListener("wheel", n, { passive: !1 }), () => e.removeEventListener("wheel", n);
	}, [
		t,
		O,
		D
	]), !t) return null;
	let k = new Map(s.records.map((e) => [e.id, e])), A = g === null ? void 0 : k.get(g), j = new Map(E.nodes.map((e) => [e.id, e.silo])), M = new Map(E.nodes.map((e) => [e.id, {
		x: e.x,
		y: e.y
	}])), N = new Map(E.nodes.map((e) => [e.id, pa(b, e.x, e.y, G.width, G.height)])), P = 1 / Math.max(1, b.k), F = fa(s.records, S), ee = S.trim().length > 0, I = /* @__PURE__ */ new Set(), te = !1;
	for (let e of d) {
		let t = c[e];
		if (t !== void 0) {
			te = !0;
			for (let e of t.heldPieces) I.add(e);
		}
		let n = p[e];
		if (n !== void 0) {
			te = !0;
			for (let e of n) I.add(e);
		}
	}
	let ne = new Set(f.flatMap((e) => e.recordIds)), L = new Set(f.map((e) => e.silo)), re = (e) => {
		e.button === 0 && e.target.closest("[data-testid^=\"memory-node-\"]") === null && (T.current = {
			pointerId: e.pointerId,
			lastX: e.clientX,
			lastY: e.clientY
		});
	}, R = (e) => {
		let t = T.current, n = w.current;
		if (t === null || n === null || t.pointerId !== e.pointerId) return;
		let { scale: r } = ua(n.getBoundingClientRect(), e.clientX, e.clientY, G.width, G.height), i = (e.clientX - t.lastX) / r, a = (e.clientY - t.lastY) / r;
		t.lastX = e.clientX, t.lastY = e.clientY, x((e) => la(e, i, a));
	}, ie = () => {
		T.current = null;
	};
	return /* @__PURE__ */ l("div", {
		className: "wr-overlay-backdrop",
		"data-testid": "memory-overlay",
		children: /* @__PURE__ */ u("div", {
			className: "wr-memory",
			role: "dialog",
			"aria-label": "The Archive — Company Brain",
			children: [/* @__PURE__ */ u("header", {
				className: "wr-memory-head",
				children: [
					/* @__PURE__ */ l("span", {
						className: "wr-panel-title",
						children: "THE ARCHIVE — COMPANY BRAIN"
					}),
					/* @__PURE__ */ u("span", {
						className: "wr-mem-search-cell",
						children: [/* @__PURE__ */ l("input", {
							type: "search",
							"data-testid": "memory-search",
							className: "wr-mem-search",
							placeholder: "search the archive…",
							value: S,
							onChange: (e) => C(e.target.value),
							"aria-label": "Search memory records"
						}), ee && /* @__PURE__ */ l("span", {
							className: "wr-mem-matches",
							children: F.size === 1 ? "1 match" : `${F.size} matches`
						})]
					}),
					/* @__PURE__ */ u("span", {
						className: "wr-memory-filters",
						children: [/* @__PURE__ */ l("button", {
							type: "button",
							className: V("wr-mem-chip", m === null && "is-active"),
							onClick: () => h(null),
							children: "all"
						}), E.kinds.map((e) => /* @__PURE__ */ l("button", {
							type: "button",
							"data-testid": `memory-filter-${e}`,
							className: V("wr-mem-chip", m === e && "is-active"),
							style: { "--mem-hue": String(li(e)) },
							onClick: () => h(m === e ? null : e),
							children: e
						}, e))]
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-mem-chip wr-mem-reset",
						onClick: () => x(ra),
						children: "RESET VIEW"
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-inspector-close",
						onClick: () => e.getState().closeArchive(),
						children: "CLOSE"
					})
				]
			}), /* @__PURE__ */ u("div", {
				className: "wr-memory-body",
				children: [/* @__PURE__ */ l("aside", {
					className: "wr-memory-silos",
					children: s.silos.map((e) => /* @__PURE__ */ u("div", {
						"data-testid": `memory-silo-${e.name}`,
						className: V("wr-mem-silo", L.has(e.name) && "is-pulsing"),
						children: [
							/* @__PURE__ */ l("div", {
								className: "wr-mem-silo-name",
								children: e.name
							}),
							/* @__PURE__ */ u("div", {
								className: "wr-mem-silo-meta",
								children: [/* @__PURE__ */ l("span", {
									className: "wr-mem-silo-phase",
									children: e.phase
								}), /* @__PURE__ */ l("span", {
									className: "wr-mem-silo-sha",
									children: e.currentCommit.slice(0, 7)
								})]
							}),
							/* @__PURE__ */ u("div", {
								className: "wr-mem-silo-meta",
								children: [/* @__PURE__ */ u("span", { children: [e.recordCount, " records"] }), /* @__PURE__ */ l("span", { children: e.owner })]
							}),
							L.has(e.name) && /* @__PURE__ */ l("span", {
								className: "wr-mem-pulse memory-pulse",
								"aria-hidden": !0
							})
						]
					}, e.name))
				}), /* @__PURE__ */ u("div", {
					className: "wr-memory-plate",
					children: [/* @__PURE__ */ l("svg", {
						ref: w,
						className: V("wr-memory-graph", T.current !== null && "is-panning"),
						viewBox: `0 0 ${G.width} ${G.height}`,
						role: "img",
						"aria-label": "Unified memory graph",
						onPointerDown: re,
						onPointerMove: R,
						onPointerUp: ie,
						onPointerLeave: ie,
						children: /* @__PURE__ */ u("g", {
							transform: `translate(${b.tx} ${b.ty}) scale(${b.k})`,
							children: [
								/* @__PURE__ */ l("g", {
									className: "wr-mem-sectors",
									"aria-hidden": !0,
									children: E.captions.map((e) => /* @__PURE__ */ u("g", {
										className: "wr-mem-sector",
										children: [
											/* @__PURE__ */ u("g", {
												className: "wr-mem-sector-sigil",
												transform: `translate(${e.rect.x + e.rect.width / 2} ${e.rect.y + e.rect.height / 2})`,
												"aria-hidden": !0,
												children: [
													/* @__PURE__ */ l("circle", {
														className: "wr-mem-sigil-teeth",
														r: "46"
													}),
													/* @__PURE__ */ l("circle", {
														className: "wr-mem-sigil-rim",
														r: "29"
													}),
													/* @__PURE__ */ l("circle", {
														className: "wr-mem-sigil-hub",
														r: "9"
													})
												]
											}),
											/* @__PURE__ */ l("path", {
												className: "wr-mem-sector-plate",
												d: `M ${e.rect.x} ${e.rect.y} h ${e.rect.width} v ${e.rect.height} h ${-e.rect.width} Z`,
												fill: "none"
											}),
											/* @__PURE__ */ l("text", {
												className: "wr-mem-sector-caption",
												x: e.x,
												y: e.y,
												children: e.silo
											})
										]
									}, e.silo))
								}),
								/* @__PURE__ */ l("g", {
									className: "wr-mem-edges",
									children: E.edges.map((e) => {
										let t = v ?? g;
										if (!ma(b.k, j.get(e.src) ?? "", j.get(e.dst) ?? "", e.src, e.dst, [v, g], N.get(e.src) ?? !0, N.get(e.dst) ?? !0)) return null;
										if (t !== null && (e.src === t || e.dst === t) && t !== null) {
											let n = M.get(t), r = M.get(e.src === t ? e.dst : e.src), i = `memg-${e.key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
											return /* @__PURE__ */ u("g", { children: [n !== void 0 && r !== void 0 && /* @__PURE__ */ l("defs", { children: /* @__PURE__ */ u("linearGradient", {
												id: i,
												gradientUnits: "userSpaceOnUse",
												x1: n.x,
												y1: n.y,
												x2: r.x,
												y2: r.y,
												children: [
													/* @__PURE__ */ l("stop", {
														offset: "0",
														stopColor: "#947030",
														stopOpacity: "0.55"
													}),
													/* @__PURE__ */ l("stop", {
														offset: "0.55",
														stopColor: "#947030",
														stopOpacity: "0.32"
													}),
													/* @__PURE__ */ l("stop", {
														offset: "1",
														stopColor: "#947030",
														stopOpacity: "0.1"
													})
												]
											}) }), /* @__PURE__ */ l("path", {
												className: "wr-mem-edge is-incident",
												d: e.d,
												fill: "none",
												style: n !== void 0 && r !== void 0 ? { stroke: `url(#${i})` } : void 0
											})] }, e.key);
										}
										return /* @__PURE__ */ l("path", {
											className: V("wr-mem-edge", t !== null && "is-faded"),
											d: e.d,
											fill: "none"
										}, e.key);
									})
								}),
								/* @__PURE__ */ l("g", {
									className: "wr-mem-nodes",
									children: E.nodes.map((e) => {
										if (m !== null && e.nodeKind !== m) return null;
										let t = I.has(e.id), n = ne.has(e.id), r = ee && F.has(e.id), i = b.k >= 1 || v === e.id || g === e.id;
										return /* @__PURE__ */ u("g", {
											"data-testid": `memory-node-${si(e.id)}`,
											className: V("wr-mem-node", t && "is-held", te && I.size > 0 && !t && "is-dimmed", n && "is-pulsing", g === e.id && "is-focused", r && "is-match", ee && !r && "is-filtered"),
											transform: `translate(${e.x} ${e.y})`,
											style: { "--mem-hue": String(li(e.nodeKind)) },
											onClick: (t) => {
												t.stopPropagation(), _(e.id === g ? null : e.id);
											},
											onMouseEnter: () => y(e.id),
											onMouseLeave: () => y((t) => t === e.id ? null : t),
											children: [
												/* @__PURE__ */ l("circle", {
													className: "wr-mem-node-ring",
													r: "11.5"
												}),
												/* @__PURE__ */ l("circle", {
													className: "wr-mem-node-dot",
													r: "9"
												}),
												/* @__PURE__ */ l("circle", {
													className: "wr-mem-node-gloss",
													cx: "-2.5",
													cy: "-3",
													r: "3"
												}),
												n && /* @__PURE__ */ l("circle", {
													className: "wr-mem-node-pulse memory-pulse",
													r: "9"
												}),
												i && /* @__PURE__ */ l("text", {
													className: "wr-mem-node-label",
													textAnchor: "middle",
													transform: `translate(0 ${13 + 9 * P}) scale(${P})`,
													children: e.id.split(":").pop()
												})
											]
										}, e.id);
									})
								})
							]
						})
					}), A !== void 0 && /* @__PURE__ */ u("div", {
						className: "wr-mem-card",
						"data-testid": "memory-node-card",
						children: [
							/* @__PURE__ */ l("div", {
								className: "wr-mem-card-title",
								children: A.attributes.title
							}),
							/* @__PURE__ */ u("div", {
								className: "wr-mem-card-row",
								children: [/* @__PURE__ */ l("span", {
									className: "wr-mem-card-kind",
									children: A.nodeKind
								}), /* @__PURE__ */ l("span", {
									className: `wr-mem-card-status wr-mem-card-status--${A.attributes.status}`,
									children: A.attributes.status
								})]
							}),
							/* @__PURE__ */ u("div", {
								className: "wr-mem-card-row",
								children: ["owners: ", A.attributes.owners.join(", ") || "—"]
							}),
							A.attributes.tags !== void 0 && A.attributes.tags.length > 0 && /* @__PURE__ */ u("div", {
								className: "wr-mem-card-row",
								children: ["tags: ", A.attributes.tags.join(", ")]
							}),
							A.attributes.summary !== void 0 && /* @__PURE__ */ l("div", {
								className: "wr-mem-card-summary",
								children: A.attributes.summary
							})
						]
					})]
				})]
			})]
		})
	});
}
//#endregion
//#region src/game/registry.ts
var ga = [
	"stacks",
	"agents",
	"tasks",
	"workspaces"
];
function _a(e = "stacks") {
	return {
		current: {
			tab: e,
			detailId: null
		},
		trail: []
	};
}
function va(e) {
	return {
		current: {
			tab: "stacks",
			detailId: e
		},
		trail: [{
			tab: "stacks",
			detailId: null
		}]
	};
}
function ya(e, t) {
	return e.current.tab === t && e.current.detailId === null && e.trail.length === 0 ? e : _a(t);
}
function ba(e, t, n) {
	return e.current.tab === t && e.current.detailId === n ? e : {
		current: {
			tab: t,
			detailId: n
		},
		trail: [...e.trail, e.current]
	};
}
function xa(e) {
	let t = e.trail[e.trail.length - 1];
	return t === void 0 ? e.current.detailId === null ? e : _a(e.current.tab) : {
		current: t,
		trail: e.trail.slice(0, -1)
	};
}
function Sa(e) {
	return e.trail.length > 0 || e.current.detailId !== null;
}
function Ca(e, t = 96) {
	let n = e.stack.spec.prompt.system.trim().replace(/\s+/g, " ");
	return n.length <= t ? n : `${n.slice(0, t).trimEnd()}…`;
}
function wa(e, t) {
	return e.filter((e) => e.stackRef === t);
}
function Ta(e, t) {
	return e.find((e) => e.stackRef === t);
}
function Ea(e) {
	let t = e.tokenUsage;
	return t.inputTokens + t.outputTokens + t.thinkingTokens;
}
//#endregion
//#region src/components/panels/RegistryOverlay.tsx
var Da = {
	stacks: "Stacks",
	agents: "Agents",
	tasks: "Tasks",
	workspaces: "Workspaces"
};
function Oa(e, t) {
	return e.find((e) => e.taskId === t)?.title ?? t;
}
function ka(e) {
	return e.slice(0, 8);
}
function Aa({ stack: e }) {
	let t = e.stack.spec;
	return /* @__PURE__ */ u(c, { children: [
		/* @__PURE__ */ l("span", {
			className: `wr-sel-adapter wr-faction-text--${t.adapter}`,
			children: t.adapter
		}),
		/* @__PURE__ */ l("span", {
			className: "wr-reg-model",
			children: t.model
		}),
		/* @__PURE__ */ u("span", {
			className: "wr-reg-approval",
			title: "approval mode",
			children: ["approval: ", t.approvalMode]
		}),
		/* @__PURE__ */ u("span", {
			className: "wr-reg-phase",
			title: "stack phase",
			children: ["phase: ", e.stack.status.phase]
		}),
		e.custom && /* @__PURE__ */ l("span", {
			className: "wr-reg-custom",
			children: "CUSTOM"
		})
	] });
}
function ja({ views: e, nav: t }) {
	let n = e.listStacks();
	return /* @__PURE__ */ u("ul", {
		className: "wr-reg-table",
		"aria-label": "Agent stacks",
		children: [/* @__PURE__ */ u("li", {
			className: "wr-reg-captions wr-reg-grid-stacks",
			"aria-hidden": !0,
			children: [
				/* @__PURE__ */ l("span", {
					className: "wr-reg-cap",
					children: "stack"
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-reg-cap",
					children: "adapter"
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-reg-cap",
					children: "model"
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-reg-cap",
					children: "approval"
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-reg-cap",
					children: "phase"
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-reg-cap",
					children: "personality (prompt.system)"
				})
			]
		}), n.map((e) => {
			let n = e.stack.spec;
			return /* @__PURE__ */ u("li", {
				"data-testid": `registry-row-${e.stackRef}`,
				className: "wr-reg-row wr-reg-grid-stacks",
				role: "button",
				tabIndex: 0,
				onClick: () => t.openDetail("stacks", e.stackRef),
				onKeyDown: (n) => {
					(n.key === "Enter" || n.key === " ") && t.openDetail("stacks", e.stackRef);
				},
				children: [
					/* @__PURE__ */ u("span", {
						className: "wr-reg-cell",
						children: [/* @__PURE__ */ l("span", {
							className: "wr-reg-name",
							children: e.name
						}), e.custom && /* @__PURE__ */ l("span", {
							className: "wr-reg-custom",
							children: "CUSTOM"
						})]
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-cell",
						children: /* @__PURE__ */ l("span", {
							className: `wr-sel-adapter wr-faction-text--${n.adapter}`,
							children: n.adapter
						})
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-cell",
						children: /* @__PURE__ */ l("span", {
							className: "wr-reg-model",
							children: n.model
						})
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-cell",
						children: /* @__PURE__ */ l("span", {
							className: "wr-reg-approval",
							title: "approval mode",
							children: n.approvalMode
						})
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-cell",
						children: /* @__PURE__ */ l("span", {
							className: "wr-reg-phase",
							title: "stack phase",
							children: e.stack.status.phase
						})
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-excerpt",
						title: "personality (prompt.system)",
						children: Ca(e)
					})
				]
			}, e.stackRef);
		})]
	});
}
function Ma({ stackRef: e, store: t, views: n, nav: r }) {
	let i = Ta(n.listStacks(), e);
	if (i === void 0) return /* @__PURE__ */ u("div", {
		className: "wr-tab-empty",
		children: [
			"no such stack — the roster holds no “",
			e,
			"”"
		]
	});
	let a = wa(n.listSessions(), e), o = i.stack.spec.prompt;
	return /* @__PURE__ */ u("div", {
		className: "wr-reg-detail",
		"data-testid": "registry-stack-detail",
		children: [
			/* @__PURE__ */ u("div", {
				className: "wr-reg-detail-head",
				children: [
					/* @__PURE__ */ l("span", {
						className: "wr-reg-detail-title",
						children: i.name
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-chiprow",
						children: /* @__PURE__ */ l(Aa, { stack: i })
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-reg-foundry",
						title: "open this roster in the Foundry's Stacks tab (§V5-3)",
						onClick: () => t.getState().openFoundryStacks(),
						children: "OPEN IN FOUNDRY"
					})
				]
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-reg-plates",
				children: [/* @__PURE__ */ u("div", {
					className: "wr-reg-plate-block",
					children: [/* @__PURE__ */ l("div", {
						className: "wr-reg-plate-label",
						children: "prompt.system"
					}), /* @__PURE__ */ l("pre", {
						className: "wr-reg-plate",
						children: o.system
					})]
				}), o.developer !== void 0 && o.developer !== "" && /* @__PURE__ */ u("div", {
					className: "wr-reg-plate-block",
					children: [/* @__PURE__ */ l("div", {
						className: "wr-reg-plate-label",
						children: "prompt.developer"
					}), /* @__PURE__ */ l("pre", {
						className: "wr-reg-plate",
						children: o.developer
					})]
				})]
			}),
			/* @__PURE__ */ l("div", {
				className: "wr-reg-section",
				children: "SPAWNED SESSIONS"
			}),
			a.length === 0 && /* @__PURE__ */ l("div", {
				className: "wr-tab-empty",
				children: "no sessions yet — this stack has not attended a card"
			}),
			/* @__PURE__ */ l("ul", {
				className: "wr-reg-sublist",
				"aria-label": "Sessions spawned by this stack",
				children: a.map((e) => /* @__PURE__ */ u("li", {
					className: V("wr-reg-subrow", `wr-reg-subrow--${e.status}`),
					role: "button",
					tabIndex: 0,
					onClick: () => r.openDetail("agents", e.sessionId),
					onKeyDown: (t) => {
						(t.key === "Enter" || t.key === " ") && r.openDetail("agents", e.sessionId);
					},
					children: [
						/* @__PURE__ */ l("span", {
							className: "wr-reg-name",
							children: e.title
						}),
						/* @__PURE__ */ l("span", {
							className: V("wr-sess-status", `wr-sess-status--${e.status}`),
							children: e.status
						}),
						/* @__PURE__ */ u("span", {
							className: "wr-reg-dim",
							children: [
								_(e.turnCount),
								" turns · ",
								v(e.cost.totalUsd)
							]
						})
					]
				}, e.sessionId))
			})
		]
	});
}
function Na({ views: e, cards: t, nav: n }) {
	let r = e.listSessions();
	return r.length === 0 ? /* @__PURE__ */ l("div", {
		className: "wr-tab-empty",
		children: "no sessions recorded — start a card working"
	}) : /* @__PURE__ */ l("ul", {
		className: "wr-reg-table",
		"aria-label": "All agent sessions",
		children: r.map((e) => {
			let r = R({
				entityId: e.sessionId,
				kind: "unit",
				adapter: e.agent
			});
			return /* @__PURE__ */ u("li", {
				"data-testid": `registry-row-${e.sessionId}`,
				className: V("wr-reg-row", "wr-reg-row--agent", `wr-reg-row--${e.status}`),
				role: "button",
				tabIndex: 0,
				onClick: () => n.openDetail("agents", e.sessionId),
				onKeyDown: (t) => {
					(t.key === "Enter" || t.key === " ") && n.openDetail("agents", e.sessionId);
				},
				children: [
					/* @__PURE__ */ l("span", {
						className: "wr-sess-portrait",
						"aria-hidden": !0,
						dangerouslySetInnerHTML: { __html: r.svg }
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-name",
						children: e.title
					}),
					/* @__PURE__ */ l("span", {
						className: V("wr-sess-role", `wr-sess-role--${e.role}`),
						children: e.role
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-reg-link",
						title: `open the stack "${e.stackName}"`,
						onClick: (t) => {
							t.stopPropagation(), n.openDetail("stacks", e.stackRef);
						},
						children: e.stackName
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-reg-link",
						title: "open the attended task",
						onClick: (t) => {
							t.stopPropagation(), n.openDetail("tasks", e.taskId);
						},
						children: Oa(t, e.taskId)
					}),
					/* @__PURE__ */ l("span", {
						className: V("wr-sess-status", `wr-sess-status--${e.status}`),
						children: e.status
					}),
					/* @__PURE__ */ u("span", {
						className: "wr-reg-dim",
						children: [
							_(e.turnCount),
							" turns · ",
							_(Ea(e)),
							" tok ·",
							" ",
							v(e.cost.totalUsd)
						]
					})
				]
			}, e.sessionId);
		})
	});
}
function Pa({ session: e, cards: t, views: n, nav: r }) {
	let i = t.find((t) => t.taskId === e.taskId), a = e.parentSessionId === null ? void 0 : n.getSession(e.parentSessionId)?.record, o = e.reviewOfSessionId === null ? void 0 : n.getSession(e.reviewOfSessionId)?.record;
	return /* @__PURE__ */ u("div", {
		className: "wr-reg-chiprow wr-reg-linkrow",
		children: [
			/* @__PURE__ */ u("button", {
				type: "button",
				className: "wr-reg-link",
				title: `open the stack "${e.stackName}"`,
				onClick: () => r.openDetail("stacks", e.stackRef),
				children: ["stack ⟶ ", e.stackName]
			}),
			/* @__PURE__ */ u("button", {
				type: "button",
				className: "wr-reg-link",
				title: "open the attended task",
				onClick: () => r.openDetail("tasks", e.taskId),
				children: ["task ⟶ ", Oa(t, e.taskId)]
			}),
			e.runId !== null && /* @__PURE__ */ u("button", {
				type: "button",
				className: "wr-reg-link",
				title: "open this run in the Runs ledger (§V5-3: run links exit to the Runs overlay)",
				onClick: () => r.openRun(e.runId),
				children: ["run ⟶ ", e.runId]
			}),
			i !== void 0 && i.workspaceId !== "" && /* @__PURE__ */ u("button", {
				type: "button",
				className: "wr-reg-link",
				title: "open the workspace",
				onClick: () => r.openDetail("workspaces", i.workspaceId),
				children: ["workspace ⟶ ", i.workspaceId]
			}),
			a !== void 0 && /* @__PURE__ */ u("button", {
				type: "button",
				className: "wr-reg-link",
				title: `open the parent session — ${a.title}`,
				onClick: () => r.openDetail("agents", a.sessionId),
				children: ["parent ⟶ ", a.title]
			}),
			o !== void 0 && /* @__PURE__ */ u("button", {
				type: "button",
				className: "wr-reg-link",
				title: `open the reviewed session — ${o.title}`,
				onClick: () => r.openDetail("agents", o.sessionId),
				children: ["reviewed ⟶ ", o.title]
			})
		]
	});
}
function Fa({ sessionId: e, cards: t, views: n, nav: r, onBack: i }) {
	let a = n.getSession(e)?.record;
	return /* @__PURE__ */ u("div", {
		className: "wr-reg-detail wr-reg-detail--agent",
		"data-testid": "registry-agent-detail",
		children: [a !== void 0 && /* @__PURE__ */ l(Pa, {
			session: a,
			cards: t,
			views: n,
			nav: r
		}), /* @__PURE__ */ l(Si, {
			sessionId: e,
			views: n,
			onOpen: (e) => r.openDetail("agents", e),
			onBack: i,
			hideParentLink: !0
		})]
	});
}
function Ia({ cards: e, views: t, nav: n }) {
	let r = t.listStacks();
	return /* @__PURE__ */ l("ul", {
		className: "wr-reg-table",
		"aria-label": "All tasks",
		children: e.map((e) => /* @__PURE__ */ u("li", {
			"data-testid": `registry-row-${e.taskId}`,
			className: "wr-reg-row",
			role: "button",
			tabIndex: 0,
			onClick: () => n.openDetail("tasks", e.taskId),
			onKeyDown: (t) => {
				(t.key === "Enter" || t.key === " ") && n.openDetail("tasks", e.taskId);
			},
			children: [
				/* @__PURE__ */ l("span", {
					className: `wr-card-kind wr-card-kind--${e.taskKind}`,
					children: e.taskKind
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-reg-name",
					children: e.title
				}),
				/* @__PURE__ */ l("span", {
					className: "wr-reg-column",
					children: e.column
				}),
				/* @__PURE__ */ u("span", {
					className: "wr-reg-dim",
					title: "attempts",
					children: ["attempt ", _(e.attempt)]
				}),
				e.yolo && /* @__PURE__ */ l("span", {
					className: "wr-reg-yolo",
					children: "yolo"
				}),
				/* @__PURE__ */ l("button", {
					type: "button",
					className: "wr-reg-link",
					title: "open the bound agent stack",
					onClick: (t) => {
						t.stopPropagation(), n.openDetail("stacks", e.stackRef);
					},
					children: Ta(r, e.stackRef)?.name ?? e.stackRef
				}),
				e.workspaceId !== "" && /* @__PURE__ */ l("button", {
					type: "button",
					className: "wr-reg-link",
					title: "open the workspace",
					onClick: (t) => {
						t.stopPropagation(), n.openDetail("workspaces", e.workspaceId);
					},
					children: e.workspaceId
				})
			]
		}, e.taskId))
	});
}
function La({ taskId: e, cards: t, views: n, nav: r }) {
	let i = t.find((t) => t.taskId === e);
	if (i === void 0) return /* @__PURE__ */ u("div", {
		className: "wr-tab-empty",
		children: [
			"no such task — the board holds no “",
			e,
			"”"
		]
	});
	let a = i.parentId === null ? void 0 : t.find((e) => e.taskId === i.parentId), o = i.childIds.map((e) => t.find((t) => t.taskId === e)).filter((e) => e !== void 0), s = n.listRuns().filter((t) => t.taskId === e), d = n.getWorkspaceView(e), f = An(n.listSessions(), e, i.childIds);
	return /* @__PURE__ */ u("div", {
		className: "wr-reg-detail",
		"data-testid": "registry-task-detail",
		children: [
			/* @__PURE__ */ u("div", {
				className: "wr-reg-detail-head",
				children: [
					/* @__PURE__ */ l("span", {
						className: `wr-card-kind wr-card-kind--${i.taskKind}`,
						children: i.taskKind
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-detail-title",
						children: i.title
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-column",
						children: i.column
					}),
					/* @__PURE__ */ u("span", {
						className: "wr-reg-dim",
						children: ["attempt ", _(i.attempt)]
					}),
					i.yolo && /* @__PURE__ */ l("span", {
						className: "wr-reg-yolo",
						children: "yolo"
					})
				]
			}),
			(a !== void 0 || o.length > 0) && /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("div", {
				className: "wr-reg-section",
				children: "HIERARCHY"
			}), /* @__PURE__ */ u("ul", {
				className: "wr-reg-sublist",
				"aria-label": "Task hierarchy",
				children: [a !== void 0 && /* @__PURE__ */ u("li", {
					className: "wr-reg-subrow",
					role: "button",
					tabIndex: 0,
					onClick: () => r.openDetail("tasks", a.taskId),
					onKeyDown: (e) => {
						(e.key === "Enter" || e.key === " ") && r.openDetail("tasks", a.taskId);
					},
					children: [/* @__PURE__ */ l("span", {
						className: "wr-reg-dim",
						children: "parent ⟶"
					}), /* @__PURE__ */ l("span", {
						className: "wr-reg-name",
						children: a.title
					})]
				}), o.map((e) => /* @__PURE__ */ u("li", {
					className: "wr-reg-subrow",
					role: "button",
					tabIndex: 0,
					onClick: () => r.openDetail("tasks", e.taskId),
					onKeyDown: (t) => {
						(t.key === "Enter" || t.key === " ") && r.openDetail("tasks", e.taskId);
					},
					children: [
						/* @__PURE__ */ l("span", {
							className: "wr-reg-dim",
							children: "child ⟶"
						}),
						/* @__PURE__ */ l("span", {
							className: "wr-reg-name",
							children: e.title
						}),
						/* @__PURE__ */ l("span", {
							className: "wr-reg-column",
							children: e.column
						})
					]
				}, e.taskId))]
			})] }),
			/* @__PURE__ */ l("div", {
				className: "wr-reg-section",
				children: "SESSIONS"
			}),
			/* @__PURE__ */ l(bi, {
				sessions: f,
				views: n,
				onOpen: (e) => r.openDetail("agents", e)
			}),
			/* @__PURE__ */ l("div", {
				className: "wr-reg-section",
				children: "RUNS"
			}),
			s.length === 0 && /* @__PURE__ */ l("div", {
				className: "wr-tab-empty",
				children: "no rites recorded for this card"
			}),
			/* @__PURE__ */ l("ul", {
				className: "wr-reg-sublist",
				"aria-label": "Runs of this task",
				children: s.map((e) => /* @__PURE__ */ u("li", {
					className: "wr-reg-subrow",
					role: "button",
					tabIndex: 0,
					title: "open this run in the Runs ledger (§V5-3)",
					onClick: () => r.openRun(e.runId),
					onKeyDown: (t) => {
						(t.key === "Enter" || t.key === " ") && r.openRun(e.runId);
					},
					children: [
						/* @__PURE__ */ l("span", {
							className: "wr-reg-dim",
							children: "run ⟶"
						}),
						/* @__PURE__ */ l("span", {
							className: "wr-reg-name",
							children: e.runId
						}),
						/* @__PURE__ */ l("span", {
							className: "wr-reg-dim",
							children: e.processId
						}),
						/* @__PURE__ */ l("span", {
							className: `wr-runstate wr-runstate--${e.observedState}`,
							children: e.observedState
						})
					]
				}, e.runId))
			}),
			/* @__PURE__ */ l("div", {
				className: "wr-reg-section",
				children: "WORKSPACE"
			}),
			d === null ? /* @__PURE__ */ l("div", {
				className: "wr-tab-empty",
				children: "no workspace bound"
			}) : /* @__PURE__ */ u("div", {
				className: "wr-reg-ws-summary",
				children: [
					i.workspaceId !== "" && /* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-reg-link",
						title: "open the workspace",
						onClick: () => r.openDetail("workspaces", i.workspaceId),
						children: i.workspaceId
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-dim",
						children: "branch"
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-mono",
						children: d.gitStatus.branch
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-mono",
						children: ka(d.gitStatus.headSha)
					}),
					/* @__PURE__ */ l("span", {
						className: V("wr-reg-dirty", d.gitStatus.dirty && "is-dirty"),
						children: d.gitStatus.dirty ? "dirty" : "clean"
					}),
					/* @__PURE__ */ u("span", {
						className: "wr-reg-dim",
						children: [_(d.files.length), " file(s) changed"]
					})
				]
			})
		]
	});
}
function Ra({ views: e, nav: t }) {
	return /* @__PURE__ */ l("ul", {
		className: "wr-reg-table",
		"aria-label": "All workspaces",
		children: e.listWorkspaces().map((e) => /* @__PURE__ */ u("li", {
			"data-testid": `registry-row-${e.workspaceId}`,
			className: "wr-reg-row wr-reg-row--ws",
			role: "button",
			tabIndex: 0,
			onClick: () => t.openDetail("workspaces", e.workspaceId),
			onKeyDown: (n) => {
				(n.key === "Enter" || n.key === " ") && t.openDetail("workspaces", e.workspaceId);
			},
			children: [/* @__PURE__ */ u("span", {
				className: "wr-reg-ws-head",
				children: [
					/* @__PURE__ */ l("span", {
						className: "wr-reg-name",
						children: e.workspaceId
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-mono",
						children: e.repository
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-phase",
						children: e.phase
					}),
					/* @__PURE__ */ l("span", {
						className: V("wr-reg-dirty", e.dirty && "is-dirty"),
						children: e.dirty ? "dirty" : "clean"
					}),
					e.gitStatus !== null && e.gitStatus.branch !== "" && /* @__PURE__ */ u(c, { children: [
						/* @__PURE__ */ l("span", {
							className: "wr-reg-dim",
							children: "branch"
						}),
						/* @__PURE__ */ l("span", {
							className: "wr-reg-mono",
							children: e.gitStatus.branch
						}),
						/* @__PURE__ */ l("span", {
							className: "wr-reg-mono",
							children: ka(e.gitStatus.headSha)
						})
					] }),
					/* @__PURE__ */ u("span", {
						className: "wr-reg-dim",
						children: [_(e.activeSessionIds.length), " active session(s)"]
					})
				]
			}), /* @__PURE__ */ l("span", {
				className: "wr-reg-ws-cards",
				children: e.cards.map((e) => /* @__PURE__ */ u("span", {
					className: "wr-reg-ws-cardline",
					children: [
						/* @__PURE__ */ l("span", {
							className: "wr-reg-name",
							children: e.title
						}),
						e.branch !== "" && /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("span", {
							className: "wr-reg-mono",
							children: e.branch
						}), /* @__PURE__ */ l("span", {
							className: "wr-reg-mono",
							children: ka(e.headSha)
						})] }),
						/* @__PURE__ */ l("span", {
							className: V("wr-reg-dirty", e.dirty && "is-dirty"),
							children: e.dirty ? "dirty" : "clean"
						})
					]
				}, e.taskId))
			})]
		}, e.workspaceId))
	});
}
function za({ workspaceId: e, cards: t, views: n, nav: r }) {
	let i = n.listWorkspaces().find((t) => t.workspaceId === e);
	if (i === void 0) return /* @__PURE__ */ u("div", {
		className: "wr-tab-empty",
		children: [
			"no such workspace — “",
			e,
			"” is unknown"
		]
	});
	let a = i.activeSessionIds.map((e) => n.getSession(e)?.record).filter((e) => e !== void 0);
	return /* @__PURE__ */ u("div", {
		className: "wr-reg-detail",
		"data-testid": "registry-workspace-detail",
		children: [
			/* @__PURE__ */ u("div", {
				className: "wr-reg-detail-head",
				children: [
					/* @__PURE__ */ l("span", {
						className: "wr-reg-detail-title",
						children: i.workspaceId
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-mono",
						children: i.repository
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-reg-phase",
						children: i.phase
					}),
					/* @__PURE__ */ l("span", {
						className: V("wr-reg-dirty", i.dirty && "is-dirty"),
						children: i.dirty ? "dirty" : "clean"
					})
				]
			}),
			/* @__PURE__ */ l("div", {
				className: "wr-reg-section",
				children: "LINKED CARDS"
			}),
			i.cards.length === 0 && /* @__PURE__ */ l("div", {
				className: "wr-tab-empty",
				children: "no cards bound to this workspace"
			}),
			/* @__PURE__ */ l("ul", {
				className: "wr-reg-sublist",
				"aria-label": "Cards in this workspace",
				children: i.cards.map((e) => /* @__PURE__ */ u("li", {
					className: "wr-reg-subrow",
					role: "button",
					tabIndex: 0,
					onClick: () => r.openDetail("tasks", e.taskId),
					onKeyDown: (t) => {
						(t.key === "Enter" || t.key === " ") && r.openDetail("tasks", e.taskId);
					},
					children: [
						/* @__PURE__ */ l("span", {
							className: "wr-reg-name",
							children: e.title
						}),
						e.branch !== "" && /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("span", {
							className: "wr-reg-mono",
							children: e.branch
						}), /* @__PURE__ */ l("span", {
							className: "wr-reg-mono",
							children: ka(e.headSha)
						})] }),
						/* @__PURE__ */ l("span", {
							className: V("wr-reg-dirty", e.dirty && "is-dirty"),
							children: e.dirty ? "dirty" : "clean"
						})
					]
				}, e.taskId))
			}),
			/* @__PURE__ */ l("div", {
				className: "wr-reg-section",
				children: "ACTIVE SESSIONS"
			}),
			a.length === 0 && /* @__PURE__ */ l("div", {
				className: "wr-tab-empty",
				children: "no agent attends this workspace"
			}),
			/* @__PURE__ */ l("ul", {
				className: "wr-reg-sublist",
				"aria-label": "Active sessions in this workspace",
				children: a.map((e) => /* @__PURE__ */ u("li", {
					className: "wr-reg-subrow wr-reg-subrow--active",
					role: "button",
					tabIndex: 0,
					onClick: () => r.openDetail("agents", e.sessionId),
					onKeyDown: (t) => {
						(t.key === "Enter" || t.key === " ") && r.openDetail("agents", e.sessionId);
					},
					children: [
						/* @__PURE__ */ l("span", {
							className: "wr-reg-name",
							children: e.title
						}),
						/* @__PURE__ */ l("span", {
							className: V("wr-sess-status", `wr-sess-status--${e.status}`),
							children: e.status
						}),
						/* @__PURE__ */ l("span", {
							className: "wr-reg-dim",
							children: Oa(t, e.taskId)
						})
					]
				}, e.sessionId))
			}),
			/* @__PURE__ */ l("div", {
				className: "wr-reg-section",
				children: "CHANGED FILES"
			}),
			/* @__PURE__ */ l("ul", {
				className: "wr-reg-sublist",
				"aria-label": "Changed files across this workspace's cards",
				children: i.cardIds.flatMap((e) => {
					let r = n.getWorkspaceView(e);
					return r === null || !r.gitStatus.dirty ? [] : r.files.map((n) => /* @__PURE__ */ u("li", {
						className: "wr-reg-subrow wr-reg-subrow--file",
						children: [
							/* @__PURE__ */ l("span", {
								className: "wr-reg-filestatus",
								children: n.status
							}),
							/* @__PURE__ */ l("span", {
								className: "wr-reg-mono",
								children: n.path
							}),
							/* @__PURE__ */ u("span", {
								className: "wr-reg-dim",
								children: [
									"+",
									_(n.additions),
									" −",
									_(n.deletions),
									" · ",
									Oa(t, e)
								]
							})
						]
					}, `${e}:${n.path}`));
				})
			})
		]
	});
}
function Ba({ store: e, views: t }) {
	let r = B(e, (e) => e.meta.registryOpen), i = B(e, (e) => e.meta.registryStackRef);
	B(e, (e) => e.meta.tickIndex);
	let [a, s] = o(_a());
	if (n(() => {
		r && s(i === null ? _a() : va(i));
	}, [r, i]), !r) return null;
	let c = {
		openDetail: (e, t) => s((n) => ba(n, e, t)),
		openRun: (t) => e.getState().openRunsAt(t)
	}, d = () => s((e) => xa(e)), f = t.listCardViews(), { tab: p, detailId: m } = a.current, h;
	return h = m === null ? p === "stacks" ? /* @__PURE__ */ l(ja, {
		views: t,
		nav: c
	}) : p === "agents" ? /* @__PURE__ */ l(Na, {
		views: t,
		cards: f,
		nav: c
	}) : p === "tasks" ? /* @__PURE__ */ l(Ia, {
		cards: f,
		views: t,
		nav: c
	}) : /* @__PURE__ */ l(Ra, {
		views: t,
		nav: c
	}) : p === "stacks" ? /* @__PURE__ */ l(Ma, {
		stackRef: m,
		store: e,
		views: t,
		nav: c
	}) : p === "agents" ? /* @__PURE__ */ l(Fa, {
		sessionId: m,
		cards: f,
		views: t,
		nav: c,
		onBack: d
	}) : p === "tasks" ? /* @__PURE__ */ l(La, {
		taskId: m,
		cards: f,
		views: t,
		nav: c
	}) : /* @__PURE__ */ l(za, {
		workspaceId: m,
		cards: f,
		views: t,
		nav: c
	}), /* @__PURE__ */ l("div", {
		className: "wr-overlay-backdrop",
		"data-testid": "registry-overlay",
		children: /* @__PURE__ */ u("div", {
			className: "wr-memory wr-runs wr-registry",
			role: "dialog",
			"aria-label": "The Registry",
			children: [
				/* @__PURE__ */ u("header", {
					className: "wr-memory-head",
					children: [
						/* @__PURE__ */ l("span", {
							className: "wr-panel-title",
							children: "THE REGISTRY — ROSTER OF THE COGITATOR"
						}),
						/* @__PURE__ */ l("div", {
							className: "wr-foundry-tabs wr-runs-tabs",
							role: "tablist",
							"aria-label": "Registry tabs",
							children: ga.map((e) => /* @__PURE__ */ l("div", {
								role: "tab",
								tabIndex: 0,
								"data-testid": `registry-tab-${e}`,
								"aria-selected": p === e,
								className: V("wr-foundry-tab", p === e && "is-active"),
								onClick: () => s((t) => ya(t, e)),
								onKeyDown: (t) => {
									(t.key === "Enter" || t.key === " ") && s((t) => ya(t, e));
								},
								children: Da[e]
							}, e))
						}),
						Sa(a) && /* @__PURE__ */ l("button", {
							type: "button",
							className: "wr-runs-back",
							"data-testid": "registry-back",
							title: "back one level (breadcrumb)",
							onClick: d,
							children: "← BACK"
						}),
						/* @__PURE__ */ l("button", {
							type: "button",
							className: "wr-inspector-close",
							onClick: () => e.getState().closeRegistry(),
							children: "CLOSE"
						})
					]
				}),
				/* @__PURE__ */ l("div", {
					className: "wr-runs-body wr-reg-body",
					children: h
				}),
				/* @__PURE__ */ u("footer", {
					className: "wr-runs-colophon",
					"aria-hidden": !0,
					children: [
						/* @__PURE__ */ l("svg", {
							className: "wr-runs-colophon-orn",
							viewBox: "0 0 60 10",
							role: "presentation",
							children: /* @__PURE__ */ l("path", {
								d: "M2 5 H22 M38 5 H58 M26 5 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M30 3.4 a1.6 1.6 0 1 0 0 3.2 a1.6 1.6 0 1 0 0 -3.2",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1"
							})
						}),
						/* @__PURE__ */ l("span", {
							className: "wr-runs-colophon-text",
							children: "inscribed by the cogitator · roster of stacks, agents, tasks and workspaces"
						}),
						/* @__PURE__ */ l("svg", {
							className: "wr-runs-colophon-orn",
							viewBox: "0 0 60 10",
							role: "presentation",
							children: /* @__PURE__ */ l("path", {
								d: "M2 5 H22 M38 5 H58 M26 5 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M30 3.4 a1.6 1.6 0 1 0 0 3.2 a1.6 1.6 0 1 0 0 -3.2",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1"
							})
						})
					]
				})
			]
		})
	});
}
//#endregion
//#region src/game/review.ts
function Va(e, t, n) {
	t.moveCard(n, "approved"), e.getState().closeReview();
}
function Ha(e, t, n, r) {
	let i = r.trim();
	if (i.length > 0) {
		let t = e.getState().board.cards[n]?.view.title ?? n;
		e.getState().pushEvent(`Changes requested — ${t}: ${i}`, "warn", n);
	}
	t.moveCard(n, "do"), e.getState().closeReview();
}
//#endregion
//#region src/components/panels/ReviewPanel.tsx
function Ua({ store: e, orders: t, views: r }) {
	let i = B(e, (e) => e.meta.reviewTaskId), a = B(e, (e) => i === null ? void 0 : e.board.cards[i]);
	B(e, (e) => e.meta.tickIndex);
	let [s, d] = o(null), [f, p] = o(!1), [m, h] = o("");
	if (n(() => {
		d(null), p(!1), h("");
	}, [i]), i === null || a === void 0) return null;
	let g = r.getWorkspaceView(i);
	return g === null ? null : /* @__PURE__ */ u("aside", {
		className: "wr-review",
		"data-testid": "review-panel",
		"aria-label": "Human review",
		children: [
			/* @__PURE__ */ u("header", {
				className: "wr-review-head",
				children: [
					/* @__PURE__ */ l("span", {
						className: "wr-review-seal",
						"aria-hidden": !0,
						dangerouslySetInnerHTML: { __html: R({
							entityId: i,
							kind: "task",
							taskKind: a.view.taskKind
						}).svg }
					}),
					/* @__PURE__ */ l("div", {
						className: "wr-review-id",
						children: /* @__PURE__ */ l("div", {
							className: "wr-review-title",
							title: a.view.title,
							children: a.view.title
						})
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-review-btn wr-review-btn--sessions",
						title: "Open the Sessions tab for this card (§V5-2)",
						onClick: () => e.getState().openInspectorSessions(i),
						children: "Sessions"
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						"data-testid": "review-open-ide",
						className: "wr-review-btn wr-review-btn--ide",
						"aria-label": "Open in IDE",
						onClick: () => e.getState().openIde(i),
						children: "Open in IDE"
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-inspector-close wr-review-close",
						"aria-label": "Close review panel",
						title: "Close review panel",
						onClick: () => e.getState().closeReview(),
						children: /* @__PURE__ */ l("svg", {
							viewBox: "0 0 12 12",
							role: "presentation",
							"aria-hidden": "true",
							children: /* @__PURE__ */ l("path", {
								d: "M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1.5",
								strokeLinecap: "round"
							})
						})
					})
				]
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-review-body",
				children: [
					/* @__PURE__ */ l(Hi, { ws: g }),
					g.reviewerNotes.length > 0 && /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("div", {
						className: "wr-review-section",
						children: "REVIEWER NOTES"
					}), /* @__PURE__ */ l("ul", {
						className: "wr-review-notes",
						children: g.reviewerNotes.map((e, t) => /* @__PURE__ */ l("li", {
							className: "wr-review-note",
							children: e
						}, t))
					})] }),
					/* @__PURE__ */ l("div", {
						className: "wr-review-section",
						children: "CHANGED FILES"
					}),
					/* @__PURE__ */ l(Wi, {
						files: g.files,
						openIndex: s,
						onToggle: (e) => d((t) => t === e ? null : e)
					})
				]
			}),
			/* @__PURE__ */ l("footer", {
				className: "wr-review-bar",
				children: f ? /* @__PURE__ */ u("div", {
					className: "wr-review-feedback",
					children: [/* @__PURE__ */ l("textarea", {
						className: "wr-review-feedback-input",
						placeholder: "what must change before approval…",
						value: m,
						onChange: (e) => h(e.target.value),
						rows: 2
					}), /* @__PURE__ */ u("div", {
						className: "wr-review-feedback-actions",
						children: [/* @__PURE__ */ l("button", {
							type: "button",
							"data-testid": "review-request-changes",
							className: "wr-review-btn wr-review-btn--reject",
							onClick: () => Ha(e, t, i, m),
							children: "Send back to DO"
						}), /* @__PURE__ */ l("button", {
							type: "button",
							className: "wr-review-btn",
							onClick: () => p(!1),
							children: "Cancel"
						})]
					})]
				}) : /* @__PURE__ */ u(c, { children: [/* @__PURE__ */ l("button", {
					type: "button",
					"data-testid": "review-approve-all",
					className: "wr-review-btn wr-review-btn--approve",
					onClick: () => Va(e, t, i),
					children: "Approve All"
				}), /* @__PURE__ */ l("button", {
					type: "button",
					className: "wr-review-btn wr-review-btn--reject",
					onClick: () => p(!0),
					children: "Request Changes"
				})] })
			})
		]
	});
}
var Wa = "The cogitator refuses the amendment — a rite requires at least two phases.", Ga = "The cogitator cannot inscribe an empty phase — name every step of the rite.", Ka = "Amendments bind future runs only — rites already underway keep their pinned revision.";
function qa(e, t, n) {
	return e.map((e, r) => r === t ? n : e);
}
function Ja(e) {
	let t = 1, n = "new-phase";
	for (; e.includes(n);) t += 1, n = `new-phase-${t}`;
	return [...e, n];
}
function Ya(e, t) {
	return e.length <= 2 ? {
		ok: !1,
		phases: [...e],
		error: Wa
	} : {
		ok: !0,
		phases: e.filter((e, n) => n !== t),
		error: null
	};
}
function Xa(e, t, n) {
	let r = t + n;
	if (t < 0 || t >= e.length || r < 0 || r >= e.length) return [...e];
	let i = [...e], a = i[t];
	return i[t] = i[r], i[r] = a, i;
}
function Za(e) {
	return e.length < 2 ? Wa : e.some((e) => e.trim().length === 0) ? Ga : null;
}
//#endregion
//#region src/game/runsView.ts
function Qa(e, t) {
	let n = t !== null && t.runId === e.runId;
	return {
		run: e,
		journal: n ? t.journal : [],
		journalLive: n
	};
}
function $a(e) {
	return e.length <= 12 ? e : `${e.slice(0, 12)}…`;
}
function eo(e) {
	let t = e.tokens;
	return t.inputTokens + t.outputTokens + t.thinkingTokens;
}
//#endregion
//#region src/components/panels/RunsOverlay.tsx
function to({ phases: e }) {
	return /* @__PURE__ */ l("span", {
		className: "wr-runs-pipeline",
		"aria-label": "phase pipeline",
		children: e.map((e) => /* @__PURE__ */ l("i", {
			className: V("wr-runs-stage", e.status === "done" && "is-done", e.status === "current" && "is-now"),
			title: e.label
		}, e.label))
	});
}
function no({ run: e }) {
	let t = Object.entries(e.pendingEffectsByKind).filter(([, e]) => e > 0).sort(([e], [t]) => e.localeCompare(t));
	return t.length === 0 ? null : /* @__PURE__ */ l("span", {
		className: "wr-runs-effects",
		children: t.map(([e, t]) => /* @__PURE__ */ u("span", {
			className: "wr-effect-chip",
			children: [
				e,
				" ×",
				t
			]
		}, e))
	});
}
function ro({ run: e, title: t, simStartMs: n, onOpen: r }) {
	return /* @__PURE__ */ u("li", {
		className: "wr-runs-row",
		role: "button",
		tabIndex: 0,
		onClick: r,
		onKeyDown: (e) => {
			(e.key === "Enter" || e.key === " ") && r();
		},
		children: [
			/* @__PURE__ */ l("span", {
				className: "wr-runs-id",
				title: e.runId,
				children: $a(e.runId)
			}),
			/* @__PURE__ */ l("span", {
				className: "wr-runs-title",
				children: t
			}),
			/* @__PURE__ */ l("span", {
				className: `wr-card-kind wr-card-kind--${e.taskKind}`,
				children: e.taskKind
			}),
			/* @__PURE__ */ l("span", {
				className: "wr-runs-process",
				children: e.processId
			}),
			/* @__PURE__ */ l("span", {
				className: `wr-runstate wr-runstate--${e.observedState}`,
				children: e.observedState
			}),
			/* @__PURE__ */ l(to, { phases: e.phases }),
			/* @__PURE__ */ l(no, { run: e }),
			/* @__PURE__ */ u("span", {
				className: "wr-runs-tokens",
				children: [
					_(eo(e)),
					" tok · ",
					v(e.costUsd)
				]
			}),
			/* @__PURE__ */ u("span", {
				className: "wr-runs-times",
				children: [
					g(e.startedAt, n),
					" →",
					" ",
					e.endedAt === null ? "—" : g(e.endedAt, n)
				]
			})
		]
	});
}
function io({ run: e, title: t, views: n, simStartMs: r, onBack: i }) {
	let a = Qa(e, n.getRunObservation(e.taskId)), o = {
		runId: e.runId,
		taskId: e.taskId,
		observedState: e.observedState,
		pendingEffectsByKind: e.pendingEffectsByKind,
		phases: e.phases,
		journal: a.journal
	};
	return /* @__PURE__ */ u("div", {
		className: "wr-run-detail",
		"data-testid": "run-detail",
		children: [
			/* @__PURE__ */ u("div", {
				className: "wr-run-detail-head",
				children: [
					/* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-runs-back",
						onClick: i,
						children: "← LEDGER"
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-runs-title",
						children: t
					}),
					/* @__PURE__ */ l("span", {
						className: `wr-card-kind wr-card-kind--${e.taskKind}`,
						children: e.taskKind
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-runs-process",
						children: e.processId
					}),
					/* @__PURE__ */ u("span", {
						className: "wr-runs-tokens",
						children: [
							_(eo(e)),
							" tok · ",
							v(e.costUsd)
						]
					}),
					/* @__PURE__ */ u("span", {
						className: "wr-runs-times",
						children: [
							g(e.startedAt, r),
							" →",
							" ",
							e.endedAt === null ? "—" : g(e.endedAt, r)
						]
					})
				]
			}),
			/* @__PURE__ */ l(Zi, {
				observation: o,
				simStartMs: r
			}),
			!a.journalLive && /* @__PURE__ */ l("div", {
				className: "wr-runs-note",
				children: "journal sealed — a newer attempt owns the live stream"
			})
		]
	});
}
function ao({ template: e, orders: t, onClose: n }) {
	let [r, i] = o([...e.phases]), [a, s] = o(null), c = () => {
		let i = Za(r);
		if (i !== null) {
			s(i);
			return;
		}
		t.updateProcessTemplate(e.kind, r.map((e) => e.trim())) !== null && n();
	}, d = (e) => {
		let t = Ya(r, e);
		s(t.error), t.ok && i(t.phases);
	};
	return /* @__PURE__ */ u("div", {
		className: "wr-process-editor",
		"data-testid": "process-editor",
		children: [
			/* @__PURE__ */ u("div", {
				className: "wr-process-editor-head",
				children: [/* @__PURE__ */ l("span", {
					className: "wr-process-editor-id",
					children: e.processId
				}), /* @__PURE__ */ u("span", {
					className: "wr-process-editor-kind",
					children: [e.kind, " rite"]
				})]
			}),
			/* @__PURE__ */ l("ol", {
				className: "wr-process-editor-phases",
				children: r.map((e, t) => /* @__PURE__ */ u("li", {
					className: "wr-process-editor-phase",
					children: [
						/* @__PURE__ */ l("input", {
							type: "text",
							value: e,
							"aria-label": `phase ${t + 1} label`,
							onChange: (e) => {
								s(null), i(qa(r, t, e.target.value));
							}
						}),
						/* @__PURE__ */ l("button", {
							type: "button",
							"aria-label": `move phase ${t + 1} up`,
							disabled: t === 0,
							onClick: () => i(Xa(r, t, -1)),
							children: "↑"
						}),
						/* @__PURE__ */ l("button", {
							type: "button",
							"aria-label": `move phase ${t + 1} down`,
							disabled: t === r.length - 1,
							onClick: () => i(Xa(r, t, 1)),
							children: "↓"
						}),
						/* @__PURE__ */ l("button", {
							type: "button",
							"aria-label": `remove phase ${t + 1}`,
							onClick: () => d(t),
							children: "REMOVE"
						})
					]
				}, t))
			}),
			a !== null && /* @__PURE__ */ l("div", {
				className: "wr-process-editor-error",
				children: a
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-process-editor-actions",
				children: [
					/* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-process-editor-add",
						onClick: () => {
							s(null), i(Ja(r));
						},
						children: "ADD PHASE"
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-process-editor-save",
						onClick: c,
						children: "SAVE"
					}),
					/* @__PURE__ */ l("button", {
						type: "button",
						onClick: n,
						children: "CANCEL"
					})
				]
			}),
			/* @__PURE__ */ l("div", {
				className: "wr-process-editor-note",
				children: Ka
			})
		]
	});
}
function oo({ views: e, orders: t }) {
	let [n, r] = o(null), i = e.listProcessTemplates(), a = n === null ? void 0 : i.find((e) => e.kind === n);
	return /* @__PURE__ */ u("div", {
		className: "wr-process-lib",
		children: [/* @__PURE__ */ l("ul", {
			className: "wr-process-cards",
			"aria-label": "Process templates",
			children: i.map((e) => /* @__PURE__ */ u("li", {
				className: V("wr-process-card", n === e.kind && "is-open"),
				role: "button",
				tabIndex: 0,
				onClick: () => r(e.kind),
				onKeyDown: (t) => {
					(t.key === "Enter" || t.key === " ") && r(e.kind);
				},
				children: [
					/* @__PURE__ */ l("span", {
						className: "wr-process-card-id",
						children: e.processId
					}),
					/* @__PURE__ */ l("span", {
						className: `wr-card-kind wr-card-kind--${e.kind}`,
						children: e.kind
					}),
					/* @__PURE__ */ l("span", {
						className: "wr-process-card-phases",
						children: e.phases.join(" → ")
					})
				]
			}, e.kind))
		}), a !== void 0 && /* @__PURE__ */ l(ao, {
			template: a,
			orders: t,
			onClose: () => r(null)
		}, `${a.kind}@v${a.revision}`)]
	});
}
function so({ store: e, orders: t, views: r }) {
	let i = B(e, (e) => e.meta.runsOpen), a = B(e, (e) => e.meta.runsFocusRunId), s = B(e, (e) => e.board.cards), c = B(e, (e) => e.meta.simStartMs);
	B(e, (e) => e.meta.tickIndex);
	let [d, f] = o("runs"), [p, m] = o(null);
	if (n(() => {
		i && (f("runs"), m(a));
	}, [i, a]), !i) return null;
	let h = [...r.listRuns()].reverse(), g = (e) => s[e.taskId]?.view.title ?? e.taskId, _ = p === null ? void 0 : h.find((e) => e.runId === p);
	return /* @__PURE__ */ l("div", {
		className: "wr-overlay-backdrop",
		"data-testid": "runs-overlay",
		children: /* @__PURE__ */ u("div", {
			className: "wr-memory wr-runs",
			role: "dialog",
			"aria-label": "The Runs Ledger",
			children: [
				/* @__PURE__ */ u("header", {
					className: "wr-memory-head",
					children: [
						/* @__PURE__ */ l("span", {
							className: "wr-panel-title",
							children: "THE RUNS LEDGER — RITES OF THE COGITATOR"
						}),
						/* @__PURE__ */ u("div", {
							className: "wr-foundry-tabs wr-runs-tabs",
							role: "tablist",
							"aria-label": "Runs ledger tabs",
							children: [/* @__PURE__ */ l("div", {
								role: "tab",
								tabIndex: 0,
								"aria-selected": d === "runs",
								className: V("wr-foundry-tab", d === "runs" && "is-active"),
								onClick: () => f("runs"),
								onKeyDown: (e) => {
									(e.key === "Enter" || e.key === " ") && f("runs");
								},
								children: "Runs"
							}), /* @__PURE__ */ l("div", {
								role: "tab",
								tabIndex: 0,
								"data-testid": "process-library",
								"aria-selected": d === "processes",
								className: V("wr-foundry-tab", d === "processes" && "is-active"),
								onClick: () => f("processes"),
								onKeyDown: (e) => {
									(e.key === "Enter" || e.key === " ") && f("processes");
								},
								children: "Processes"
							})]
						}),
						/* @__PURE__ */ l("button", {
							type: "button",
							className: "wr-inspector-close",
							onClick: () => e.getState().closeRuns(),
							children: "CLOSE"
						})
					]
				}),
				/* @__PURE__ */ u("div", {
					className: "wr-runs-body",
					children: [d === "runs" && (_ === void 0 ? /* @__PURE__ */ u("ul", {
						className: "wr-runs-table",
						"aria-label": "All runs",
						children: [
							/* @__PURE__ */ u("li", {
								className: "wr-runs-row wr-runs-colhead",
								"aria-hidden": !0,
								children: [
									/* @__PURE__ */ l("span", { children: "rite" }),
									/* @__PURE__ */ l("span", { children: "card" }),
									/* @__PURE__ */ l("span", { children: "kind" }),
									/* @__PURE__ */ l("span", { children: "process" }),
									/* @__PURE__ */ l("span", { children: "state" }),
									/* @__PURE__ */ l("span", { children: "phases" }),
									/* @__PURE__ */ l("span", { children: "pending effects" }),
									/* @__PURE__ */ l("span", { children: "tokens · cost" }),
									/* @__PURE__ */ l("span", { children: "started → ended" })
								]
							}),
							h.length === 0 && /* @__PURE__ */ l("li", {
								className: "wr-tab-empty",
								children: "no rites recorded — start a card working"
							}),
							h.map((e) => /* @__PURE__ */ l(ro, {
								run: e,
								title: g(e),
								simStartMs: c,
								onOpen: () => m(e.runId)
							}, e.runId))
						]
					}) : /* @__PURE__ */ l(io, {
						run: _,
						title: g(_),
						views: r,
						simStartMs: c,
						onBack: () => m(null)
					})), d === "processes" && /* @__PURE__ */ l(oo, {
						views: r,
						orders: t
					})]
				}),
				/* @__PURE__ */ u("footer", {
					className: "wr-runs-colophon",
					"aria-hidden": !0,
					children: [
						/* @__PURE__ */ l("svg", {
							className: "wr-runs-colophon-orn",
							viewBox: "0 0 60 10",
							role: "presentation",
							children: /* @__PURE__ */ l("path", {
								d: "M2 5 H22 M38 5 H58 M26 5 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M30 3.4 a1.6 1.6 0 1 0 0 3.2 a1.6 1.6 0 1 0 0 -3.2",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1"
							})
						}),
						/* @__PURE__ */ l("span", {
							className: "wr-runs-colophon-text",
							children: "inscribed by the cogitator · ledger of rites · seal of the magos"
						}),
						/* @__PURE__ */ l("svg", {
							className: "wr-runs-colophon-orn",
							viewBox: "0 0 60 10",
							role: "presentation",
							children: /* @__PURE__ */ l("path", {
								d: "M2 5 H22 M38 5 H58 M26 5 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M30 3.4 a1.6 1.6 0 1 0 0 3.2 a1.6 1.6 0 1 0 0 -3.2",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1"
							})
						})
					]
				})
			]
		})
	});
}
//#endregion
//#region src/components/panels/SteerModal.tsx
function co({ store: e, orders: t }) {
	let n = B(e, (e) => e.meta.steerOpen), r = B(e, (e) => e.world), i = B(e, (e) => e.selection), [a, s] = o("");
	if (!n) return null;
	let { units: c } = d({
		world: r,
		selection: i
	}), f = () => {
		let n = a.trim(), r = e.getState();
		n !== "" && c.length > 0 && (t.steer(c.map((e) => e.id), n), r.pushEvent(`Steering ${c.length} unit(s): ${n}`, "info", c[0]?.id), s("")), r.closeSteer();
	};
	return /* @__PURE__ */ l("div", {
		className: "wr-modal-backdrop",
		"data-testid": "steer-modal",
		children: /* @__PURE__ */ u("div", {
			className: "wr-modal",
			role: "dialog",
			"aria-label": "Steer units",
			children: [
				/* @__PURE__ */ l("div", {
					className: "wr-panel-title",
					children: "STEER SELECTED UNITS"
				}),
				/* @__PURE__ */ l("div", {
					className: "wr-modal-targets",
					children: c.length === 0 ? /* @__PURE__ */ l("span", {
						className: "wr-modal-target wr-modal-target--none",
						children: "no units selected"
					}) : c.map((e) => /* @__PURE__ */ l("span", {
						className: "wr-modal-target",
						children: e.view.title
					}, e.id))
				}),
				/* @__PURE__ */ l("textarea", {
					autoFocus: !0,
					className: "wr-modal-input",
					rows: 3,
					value: a,
					placeholder: "new orders for the selection…",
					onChange: (e) => s(e.target.value),
					onKeyDown: (t) => {
						t.key === "Enter" && (t.ctrlKey || t.metaKey) && (t.preventDefault(), f()), t.key === "Escape" && e.getState().closeSteer();
					}
				}),
				/* @__PURE__ */ l("div", {
					className: "wr-modal-hint",
					children: "Ctrl+Enter to transmit · Esc to close"
				}),
				/* @__PURE__ */ u("div", {
					className: "wr-modal-actions",
					children: [/* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-alert-btn",
						onClick: () => e.getState().closeSteer(),
						children: "Cancel"
					}), /* @__PURE__ */ l("button", {
						type: "button",
						className: "wr-alert-btn wr-alert-btn--approve",
						disabled: c.length === 0 || a.trim() === "",
						onClick: f,
						children: "Transmit"
					})]
				})
			]
		})
	});
}
//#endregion
//#region src/components/WarRoom.tsx
function lo({ store: e, orders: t, views: r }) {
	return n(() => et({
		store: e,
		orders: t
	}), [e, t]), /* @__PURE__ */ u("div", {
		className: "wr-root",
		"data-testid": "war-room",
		children: [
			/* @__PURE__ */ l(dr, {
				store: e,
				orders: t
			}),
			/* @__PURE__ */ l(_n, {
				store: e,
				orders: t
			}),
			/* @__PURE__ */ l(Sn, {
				store: e,
				orders: t
			}),
			/* @__PURE__ */ u("div", {
				className: "wr-bottom-row",
				children: [
					/* @__PURE__ */ l(En, { store: e }),
					/* @__PURE__ */ l(cr, {
						store: e,
						views: r
					}),
					/* @__PURE__ */ l(Cn, {
						store: e,
						orders: t
					})
				]
			}),
			/* @__PURE__ */ l(ea, {
				store: e,
				orders: t,
				views: r
			}),
			/* @__PURE__ */ l(Ua, {
				store: e,
				orders: t,
				views: r
			}),
			/* @__PURE__ */ l(co, {
				store: e,
				orders: t
			}),
			/* @__PURE__ */ l(Br, {
				store: e,
				orders: t,
				views: r
			}),
			/* @__PURE__ */ l(yr, {
				store: e,
				orders: t,
				views: r
			}),
			/* @__PURE__ */ l(ha, { store: e }),
			/* @__PURE__ */ l(Ba, {
				store: e,
				views: r
			}),
			/* @__PURE__ */ l(so, {
				store: e,
				orders: t,
				views: r
			}),
			/* @__PURE__ */ l(Qr, {
				store: e,
				orders: t,
				views: r
			}),
			/* @__PURE__ */ l("div", {
				className: "wr-narrow-gate",
				role: "note",
				children: /* @__PURE__ */ u("div", {
					className: "wr-narrow-gate-card",
					children: [/* @__PURE__ */ l("h1", { children: "A5C Commander" }), /* @__PURE__ */ l("p", { children: "the cogitator requires a wider plate — widen the window to at least 1100px." })]
				})
			})
		]
	});
}
var uo = class {
	sim;
	tickIntervalMs;
	autoStart;
	connected = !1;
	constructor(e = {}) {
		this.sim = new Ut({ seed: e.seed ?? 42 }), this.tickIntervalMs = e.tickIntervalMs, this.autoStart = e.autoStart ?? !0;
	}
	async connect() {
		this.connected || (this.connected = !0, this.sim.handleClientFrame({
			type: "auth",
			token: "mock-token"
		}), this.autoStart && this.sim.start(this.tickIntervalMs), await Promise.resolve());
	}
	disconnect() {
		this.connected = !1, this.sim.stop();
	}
	send(e) {
		this.sim.handleClientFrame(e);
	}
	onFrame(e) {
		return this.sim.onFrame(e);
	}
	moveCard(e, t) {
		return this.sim.moveCard(e, t);
	}
	setYolo(e, t) {
		return this.sim.setYolo(e, t);
	}
	createTask(e) {
		return this.sim.createTask(e);
	}
	revertCard(e) {
		return this.sim.revertCard(e);
	}
	release() {
		return this.sim.release();
	}
	rollbackCard(e) {
		return this.sim.rollbackCard(e);
	}
	updateTask(e, t) {
		return this.sim.updateTask(e, t);
	}
	upsertStack(e) {
		return this.sim.upsertStack(e);
	}
	updateProcessTemplate(e, t) {
		return this.sim.updateProcessTemplate(e, t);
	}
	writeFile(e, t, n) {
		return this.sim.writeFile(e, t, n);
	}
	setSpeed(e) {
		return this.sim.setSpeed(e);
	}
	createRosterAgent(e) {
		return this.sim.createRosterAgent(e);
	}
	deleteRosterAgent(e) {
		return this.sim.deleteRosterAgent(e);
	}
	assignTaskAgent(e, t, n) {
		return this.sim.assignTaskAgent(e, t, n);
	}
	assignTaskHuman(e, t) {
		return this.sim.assignTaskHuman(e, t);
	}
	listRosterAgents() {
		return this.sim.listRosterAgents();
	}
	listStacks() {
		return this.sim.listStacks();
	}
	listProcessTemplates() {
		return this.sim.listProcessTemplates();
	}
	listRunLedger() {
		return this.sim.listRuns();
	}
	listSessions(e) {
		return this.sim.listSessions(e);
	}
	getSession(e) {
		return this.sim.getSession(e);
	}
	listWorkspaces() {
		return this.sim.listWorkspaces();
	}
	getWorkspaceTree(e) {
		return this.sim.getWorkspaceTree(e);
	}
	getFileContent(e, t) {
		return this.sim.getFileContent(e, t);
	}
	getMemoryIO(e) {
		return this.sim.getMemoryIO(e);
	}
	getGitLog(e) {
		return this.sim.getGitLog(e);
	}
	listAgents() {
		return Promise.resolve(this.sim.listAgents());
	}
	listSessionEntries() {
		return Promise.resolve(this.sim.listSessionEntries());
	}
	listRuns() {
		return Promise.resolve(this.sim.listRunEntries());
	}
	listTasks() {
		return Promise.resolve(this.sim.listTasks());
	}
}, fo = "1", po = 15e3, mo = 1e4, ho = 500, go = 3e4, _o = 256, vo = class extends Error {
	status;
	constructor(e, t, n) {
		super(`GET ${e} failed: HTTP ${t}${n ? ` — ${n}` : ""}`), this.name = "RealBackendRestError", this.status = t;
	}
};
function yo(e) {
	let t = globalThis.WebSocket;
	if (typeof t != "function") throw Error("RealBackend: no ambient WebSocket; inject webSocketFactory");
	return new t(e);
}
function bo() {
	let e = globalThis.fetch;
	if (typeof e != "function") throw Error("RealBackend: no ambient fetch; inject fetch");
	return e;
}
function xo(e) {
	let t = new URL(e);
	return t.protocol = t.protocol === "wss:" ? "https:" : t.protocol === "ws:" ? "http:" : t.protocol, t.pathname = "", t.search = "", t.hash = "", t.origin;
}
var So = new Set([
	"hello",
	"error",
	"pong",
	"run.event",
	"hook.request",
	"hook.resolved",
	"pairing.consumed"
]);
function Co(e) {
	if (typeof e != "object" || !e) return null;
	let t = e.type;
	return typeof t != "string" || !So.has(t) ? null : e;
}
var wo = class {
	config;
	gatewayUrl;
	token;
	restBaseUrl;
	webSocketFactory;
	fetchImpl;
	pingIntervalMs;
	pongTimeoutMs;
	baseDelayMs;
	maxDelayMs;
	maxReconnectAttempts;
	state = "idle";
	socket = null;
	subscribers = /* @__PURE__ */ new Set();
	runSubscriptions = /* @__PURE__ */ new Map();
	sessionSubscriptions = /* @__PURE__ */ new Set();
	outboundBuffer = [];
	pingTimer = null;
	pongTimer = null;
	reconnectTimer = null;
	reconnectAttempt = 0;
	pendingConnect = null;
	warnedVerbs = /* @__PURE__ */ new Set();
	constructor(e, t = {}) {
		if (e.gatewayUrl === void 0 || e.token === void 0) throw Error("RealBackend requires a resolved real config (gatewayUrl + token)");
		this.config = e, this.gatewayUrl = e.gatewayUrl, this.token = e.token, this.restBaseUrl = xo(e.gatewayUrl), this.webSocketFactory = t.webSocketFactory ?? yo, this.fetchImpl = t.fetch ?? bo(), this.pingIntervalMs = e.pingIntervalMs ?? po, this.pongTimeoutMs = e.pongTimeoutMs ?? mo, this.baseDelayMs = e.baseDelayMs ?? ho, this.maxDelayMs = e.maxDelayMs ?? go, this.maxReconnectAttempts = e.maxReconnectAttempts;
	}
	connect() {
		return this.state === "ready" ? Promise.resolve() : this.state === "connecting" || this.state === "authenticating" ? new Promise((e, t) => {
			let n = this.pendingConnect;
			this.pendingConnect = {
				resolve: () => {
					n?.resolve(), e();
				},
				reject: (e) => {
					n?.reject(e), t(e);
				}
			};
		}) : new Promise((e, t) => {
			this.pendingConnect = {
				resolve: e,
				reject: t
			}, this.openSocket();
		});
	}
	openSocket() {
		this.state = "connecting";
		let e;
		try {
			e = this.webSocketFactory(this.gatewayUrl);
		} catch (e) {
			this.failConnect(e instanceof Error ? e : Error(String(e)));
			return;
		}
		this.socket = e, e.onopen = () => {
			this.state = "authenticating", this.writeToSocket({
				type: "auth",
				token: this.token
			});
		}, e.onmessage = (e) => {
			this.handleRawMessage(e.data);
		}, e.onerror = () => {
			this.handleSocketDown();
		}, e.onclose = () => {
			this.handleSocketDown();
		};
	}
	handleRawMessage(e) {
		let t;
		try {
			t = JSON.parse(typeof e == "string" ? e : String(e));
		} catch {
			return;
		}
		let n = Co(t);
		if (n !== null) {
			if (n.type === "hello" && this.state === "authenticating") {
				if (!n.protocolVersions.includes(fo)) {
					let e = /* @__PURE__ */ Error(`gateway does not support protocol v${fo} (got ${n.protocolVersions.join(",")})`);
					this.teardownSocket(), this.failConnect(e);
					return;
				}
				this.becomeReady();
			}
			if (n.type === "pong" && this.clearPongTimer(), n.type === "run.event") {
				let e = this.runSubscriptions.get(n.runId);
				e !== void 0 && n.seq > e && this.runSubscriptions.set(n.runId, n.seq);
			}
			this.fanOut(n);
		}
	}
	becomeReady() {
		this.state = "ready", this.reconnectAttempt = 0, this.startKeepalive(), this.resubscribeAll(), this.flushOutbound();
		let e = this.pendingConnect;
		this.pendingConnect = null, e?.resolve();
	}
	resubscribeAll() {
		for (let [e, t] of this.runSubscriptions) {
			let n = t >= 0 ? {
				type: "subscribe",
				runId: e,
				sinceSeq: t
			} : {
				type: "subscribe",
				runId: e
			};
			this.writeToSocket(n);
		}
		for (let e of this.sessionSubscriptions) {
			let t = {
				type: "session.subscribe",
				sessionId: e
			};
			this.writeToSocket(t);
		}
	}
	handleSocketDown() {
		if (this.state !== "disconnected") {
			if (this.state === "connecting" || this.state === "authenticating") {
				this.teardownSocket(), this.failConnect(/* @__PURE__ */ Error("gateway socket closed before hello"));
				return;
			}
			(this.state === "ready" || this.state === "reconnecting") && (this.teardownSocket(), this.scheduleReconnect());
		}
	}
	scheduleReconnect() {
		if (this.state = "reconnecting", this.maxReconnectAttempts !== void 0 && this.reconnectAttempt >= this.maxReconnectAttempts) {
			this.state = "disconnected";
			return;
		}
		let e = Math.min(this.baseDelayMs * 2 ** this.reconnectAttempt, this.maxDelayMs), t = Math.random() * e;
		this.reconnectAttempt += 1, this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null, this.state === "reconnecting" && this.openSocket();
		}, t);
	}
	failConnect(e) {
		this.state = "disconnected";
		let t = this.pendingConnect;
		this.pendingConnect = null, t?.reject(e);
	}
	send(e) {
		let t = this.trackSubscription(e);
		if (this.state === "ready") {
			this.writeToSocket(e);
			return;
		}
		t || (this.outboundBuffer.push(e), this.outboundBuffer.length > _o && this.outboundBuffer.shift());
	}
	trackSubscription(e) {
		switch (e.type) {
			case "subscribe": {
				let t = e;
				return this.runSubscriptions.has(t.runId) || this.runSubscriptions.set(t.runId, t.sinceSeq ?? -1), !0;
			}
			case "unsubscribe": {
				let t = e;
				return this.runSubscriptions.delete(t.runId), !0;
			}
			case "session.subscribe": {
				let t = e;
				return this.sessionSubscriptions.add(t.sessionId), !0;
			}
			case "session.unsubscribe": {
				let t = e;
				return this.sessionSubscriptions.delete(t.sessionId), !0;
			}
			default: return !1;
		}
	}
	flushOutbound() {
		if (this.outboundBuffer.length === 0) return;
		let e = this.outboundBuffer;
		this.outboundBuffer = [];
		for (let t of e) this.writeToSocket(t);
	}
	writeToSocket(e) {
		let t = this.socket;
		if (t !== null) try {
			t.send(JSON.stringify(e));
		} catch {}
	}
	onFrame(e) {
		this.subscribers.add(e);
		let t = !0;
		return () => {
			t && (t = !1, this.subscribers.delete(e));
		};
	}
	fanOut(e) {
		for (let t of [...this.subscribers]) try {
			t(e);
		} catch (e) {
			console.error("RealBackend: onFrame subscriber threw", e);
		}
	}
	startKeepalive() {
		this.clearKeepalive(), this.pingTimer = setInterval(() => {
			this.state === "ready" && (this.writeToSocket({ type: "ping" }), this.armPongTimeout());
		}, this.pingIntervalMs);
	}
	armPongTimeout() {
		this.pongTimer === null && (this.pongTimer = setTimeout(() => {
			this.pongTimer = null, this.handleSocketDown();
		}, this.pongTimeoutMs));
	}
	clearPongTimer() {
		this.pongTimer !== null && (clearTimeout(this.pongTimer), this.pongTimer = null);
	}
	clearKeepalive() {
		this.pingTimer !== null && (clearInterval(this.pingTimer), this.pingTimer = null), this.clearPongTimer();
	}
	teardownSocket() {
		this.clearKeepalive();
		let e = this.socket;
		if (this.socket = null, e !== null) {
			e.onopen = null, e.onclose = null, e.onerror = null, e.onmessage = null;
			try {
				e.close();
			} catch {}
		}
	}
	disconnect() {
		if (this.state = "disconnected", this.reconnectTimer !== null && (clearTimeout(this.reconnectTimer), this.reconnectTimer = null), this.reconnectAttempt = 0, this.outboundBuffer = [], this.runSubscriptions.clear(), this.sessionSubscriptions.clear(), this.teardownSocket(), this.pendingConnect !== null) {
			let e = this.pendingConnect;
			this.pendingConnect = null, e.reject(/* @__PURE__ */ Error("disconnected before connect resolved"));
		}
	}
	async getJson(e) {
		let t = await this.fetchImpl(`${this.restBaseUrl}/api/v1/${e}`, { headers: {
			Authorization: `Bearer ${this.token}`,
			Accept: "application/json"
		} });
		if (!t.ok) {
			let n = "";
			try {
				n = (await t.text()).slice(0, 200);
			} catch {
				n = "";
			}
			throw new vo(`/api/v1/${e}`, t.status, n);
		}
		return await t.json();
	}
	listAgents() {
		return this.getJson("agents");
	}
	listSessionEntries() {
		return this.getJson("sessions");
	}
	listRuns() {
		return this.getJson("runs");
	}
	listTasks() {
		return Promise.resolve([]);
	}
	noopVerb(e) {
		this.warnedVerbs.has(e) || (this.warnedVerbs.add(e), console.warn(`RealBackend: '${e}' is a v1-protocol gap (no-op in real mode)`));
	}
	moveCard(e, t) {
		return this.noopVerb("moveCard"), !1;
	}
	setYolo(e, t) {
		return this.noopVerb("setYolo"), !1;
	}
	createTask(e) {
		return this.noopVerb("createTask"), null;
	}
	revertCard(e) {
		return this.noopVerb("revertCard"), !1;
	}
	release() {
		return this.noopVerb("release"), null;
	}
	rollbackCard(e) {
		return this.noopVerb("rollbackCard"), !1;
	}
	updateTask(e, t) {
		return this.noopVerb("updateTask"), !1;
	}
	upsertStack(e) {
		return this.noopVerb("upsertStack"), null;
	}
	updateProcessTemplate(e, t) {
		return this.noopVerb("updateProcessTemplate"), null;
	}
	writeFile(e, t, n) {
		return this.noopVerb("writeFile"), !1;
	}
	setSpeed(e) {
		return this.noopVerb("setSpeed"), !1;
	}
	createRosterAgent(e) {
		return this.noopVerb("createRosterAgent"), null;
	}
	deleteRosterAgent(e) {
		return this.noopVerb("deleteRosterAgent"), !1;
	}
	assignTaskAgent(e, t, n) {
		return this.noopVerb("assignTaskAgent"), !1;
	}
	assignTaskHuman(e, t) {
		return this.noopVerb("assignTaskHuman"), !1;
	}
	getConfig() {
		return this.config;
	}
}, To = class {
	connect() {
		return Promise.resolve();
	}
	disconnect() {}
	send(e) {}
	onFrame(e) {
		return () => {};
	}
	listAgents() {
		return Promise.resolve([]);
	}
	listSessionEntries() {
		return Promise.resolve([]);
	}
	listRuns() {
		return Promise.resolve([]);
	}
	listTasks() {
		return Promise.resolve([]);
	}
};
function Eo(e, t) {
	return e.mode === "real" ? e.gatewayUrl !== void 0 && e.token !== void 0 ? new wo(e, t) : new To() : new uo({ seed: e.seed });
}
//#endregion
//#region src/backend/kradle/controllerClient.ts
var Do = 5e3, Oo = 3e4, ko = "X-Kradle-Request", Ao = "commander", jo = "default", Mo = 500, No = class extends Error {
	status;
	endpoint;
	bodyExcerpt;
	constructor(e, t, n) {
		super(`kradle ${t} failed: HTTP ${e}${n ? ` — ${n}` : ""}`), this.name = "KradleControlPlaneError", this.status = e, this.endpoint = t, this.bodyExcerpt = n;
	}
}, Po = class extends Error {
	action;
	constructor(e) {
		super(`kradle ${e} is a proposed (not-live) route — gated per SPEC §3.2 / E-RUNACTIONS`), this.name = "KradleProposedRouteError", this.action = e;
	}
};
function Fo() {
	let e = globalThis.fetch;
	if (typeof e != "function") throw Error("KradleControllerClient: no ambient fetch; inject deps.fetch");
	return e;
}
function Io() {
	let e = globalThis.EventSource;
	return typeof e == "function" ? (t, n) => new e(t, n) : null;
}
function Lo(e) {
	return e.endsWith("/") ? e.slice(0, -1) : e;
}
function Ro(e, t = {}) {
	let n = Lo((e.kradleApiUrl ?? "").trim());
	if (!n) throw Error("KradleControllerClient: kradleApiUrl is required");
	let r = (e.kradleOrg ?? "").trim() || jo, i = e.kradleToken?.trim() || void 0, a = typeof e.requestTimeoutMs == "number" && e.requestTimeoutMs > 0 ? e.requestTimeoutMs : Oo, o = t.fetch ?? Fo(), s = t.eventSourceFactory ?? Io();
	function c() {
		let e = { Accept: "application/json" };
		return i && (e.Authorization = `Bearer ${i}`), e;
	}
	async function l(e, t, r) {
		let i = t.toUpperCase(), s = i !== "GET" && i !== "HEAD" && i !== "OPTIONS", l = c(), u = {
			method: i,
			headers: l,
			credentials: "include"
		};
		s ? (l["Content-Type"] = "application/json", l[ko] = Ao, r !== void 0 && (u.body = JSON.stringify(r))) : u.cache = "no-store";
		let d = new AbortController();
		u.signal = d.signal;
		let f = setTimeout(() => d.abort(), s ? Do : a), p;
		try {
			p = await o(`${n}${e}`, u);
		} finally {
			clearTimeout(f);
		}
		if (!p.ok) {
			let t = "";
			try {
				t = (await p.text()).slice(0, Mo);
			} catch {
				t = "";
			}
			throw new No(p.status, e, t);
		}
		return await p.json();
	}
	return {
		org: r,
		snapshot() {
			return l(`/api/controller?org=${encodeURIComponent(r)}`, "GET");
		},
		listResources(e, t) {
			let n = new URLSearchParams({ kind: e });
			return t?.limit !== void 0 && n.set("limit", String(t.limit)), t?.offset !== void 0 && n.set("offset", String(t.offset)), l(`${f()}?${n.toString()}`, "GET");
		},
		applyResource(e) {
			return l(f(), "POST", e);
		},
		getResource(e, t) {
			return l(`${f()}/${encodeURIComponent(e)}/${encodeURIComponent(t)}`, "GET");
		},
		deleteResource(e, t) {
			return l(`${f()}/${encodeURIComponent(e)}/${encodeURIComponent(t)}`, "DELETE");
		},
		listDefinitions() {
			return l(d("/definitions"), "GET");
		},
		createDefinition(e) {
			return l(d("/definitions"), "POST", e);
		},
		getDefinition(e) {
			return l(d(`/definitions/${encodeURIComponent(e)}`), "GET");
		},
		patchDefinition(e, t) {
			return l(d(`/definitions/${encodeURIComponent(e)}`), "PATCH", t);
		},
		deleteDefinition(e) {
			return l(d(`/definitions/${encodeURIComponent(e)}`), "DELETE");
		},
		dispatch(e) {
			return l(d("/dispatch"), "POST", e);
		},
		cancelRun(e) {
			return l(d(`/runs/${encodeURIComponent(e)}/cancel`), "POST");
		},
		retryRun(e) {
			return l(d("/dispatch"), "POST", e);
		},
		resumeRun(e, t) {
			return Promise.reject(new Po("runs/<run>/resume"));
		},
		forkRun(e, t) {
			return Promise.reject(new Po("runs/<run>/fork"));
		},
		continueRun(e, t) {
			return Promise.reject(new Po("runs/<run>/continue"));
		},
		queryMemory(e) {
			return l(d("/memory/query"), "POST", e);
		},
		decideApproval(e, t, n) {
			let r = n ? {
				decision: t,
				decidedBy: n
			} : { decision: t };
			return l(d(`/approvals/${encodeURIComponent(e)}/decide`), "POST", r);
		},
		openEventStream(e) {
			return u(`${n}${d("/events/stream")}?korg=${encodeURIComponent(r)}`, e, !0);
		},
		openResourceWatch(e, t) {
			return u(`${n}/api/watch/orgs/${encodeURIComponent(r)}/${encodeURIComponent(e)}`, t, !1);
		}
	};
	function u(e, t, n) {
		if (!s) return () => {};
		let r = s(e, { withCredentials: !0 });
		return r.onmessage = (e) => {
			let r;
			try {
				r = JSON.parse(e.data);
			} catch {
				return;
			}
			if (typeof r != "object" || !r) return;
			let i = r.type;
			n && typeof i != "string" || i !== "heartbeat" && t(typeof i == "string" ? r : {
				type: "resource",
				...r
			});
		}, () => r.close();
	}
	function d(e) {
		return `/api/orgs/${encodeURIComponent(r)}/agents${e}`;
	}
	function f() {
		return `/api/orgs/${encodeURIComponent(r)}/resources`;
	}
}
//#endregion
//#region src/backend/kradle/mappers.ts
var zo = "kradle.a5c.ai/origin", Bo = "commander.a5c.ai/default-for", Vo = "commander.a5c.ai/coordination", Ho = 15e3, Uo = {
	totalUsd: 0,
	inputTokens: 0,
	outputTokens: 0,
	thinkingTokens: 0,
	cachedTokens: 0
}, Wo = {
	inputTokens: 0,
	outputTokens: 0,
	thinkingTokens: 0,
	cachedTokens: 0
};
function Go(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function q(e) {
	return typeof e == "string" ? e : void 0;
}
function J(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function Ko(e) {
	return typeof e == "boolean" ? e : void 0;
}
function Y(e) {
	return Go(e) ? e : void 0;
}
function qo(e) {
	return Array.isArray(e) ? e : void 0;
}
function X(e) {
	return Y(e.spec) ?? {};
}
function Z(e) {
	return Y(e.status) ?? {};
}
function Jo(e) {
	let t = e.metadata.labels;
	if (!Go(t)) return {};
	let n = {};
	for (let [e, r] of Object.entries(t)) typeof r == "string" && (n[e] = r);
	return n;
}
function Q(e) {
	return q(Z(e).phase);
}
function Yo(e) {
	let t = q(e);
	if (t === void 0) return;
	let n = Date.parse(t);
	return Number.isFinite(n) ? n : void 0;
}
function Xo(e) {
	return Yo(e.metadata.creationTimestamp);
}
var Zo = new Set(st), Qo = new Set(U);
function $o(e, t = "claude-code") {
	return e !== void 0 && Zo.has(e) ? e : t;
}
function es(e) {
	if (e !== void 0 && Qo.has(e)) return e;
	switch (e) {
		case "ci-repair":
		case "diagnostic": return "fix";
		default: return "implement";
	}
}
function $(e, t) {
	let n = e.agents?.[t]?.items;
	return Array.isArray(n) && n.length > 0 ? n : [];
}
function ts(e, t) {
	let n = e.agents?.[t]?.pending;
	return Array.isArray(n) ? n : [];
}
function ns(e, t) {
	let n = [];
	for (let r of e.resources ?? []) if (r.kind === t && Array.isArray(r.items)) for (let e of r.items) Go(e) && Go(e.metadata) && n.push(e);
	return n;
}
function rs(e) {
	let t = X(e), n = q(t.adapter) ?? "claude-code", r = q(t.baseAgent) ?? n, i = H[$o(n)] ?? [], a = q(t.model) ?? i[0] ?? "", o = Y(t.prompt) ?? Y(t.promptTemplates), s = q(o?.system) ?? q(t.systemPrompt) ?? "", c = q(o?.developer) ?? q(t.developerPrompt), l = (e) => {
		let t = qo(e);
		return t === void 0 ? void 0 : t.filter((e) => typeof e == "string");
	}, u = q(Y(t.runtimeIdentity)?.serviceAccountRef), d = Y(t.externalTools), f = l(d?.mcpServerRefs) ?? l(t.mcpServerRefs), p = l(d?.cliToolRefs), m = f !== void 0 || p !== void 0 ? {
		...f === void 0 ? {} : { mcpServerRefs: f },
		...p === void 0 ? {} : { cliToolRefs: p }
	} : void 0, h = Y(t.permissionRefs), g = l(h?.roleBindings), _ = l(h?.secretGrants), v = l(h?.configGrants), y = g !== void 0 || _ !== void 0 || v !== void 0 ? {
		...g === void 0 ? {} : { roleBindings: g },
		..._ === void 0 ? {} : { secretGrants: _ },
		...v === void 0 ? {} : { configGrants: v }
	} : void 0;
	return {
		apiVersion: q(e.apiVersion) ?? "kradle.a5c.ai/v1alpha1",
		kind: "AgentStack",
		metadata: {
			name: e.metadata.name,
			...q(e.metadata.namespace) === void 0 ? {} : { namespace: e.metadata.namespace },
			labels: Jo(e)
		},
		spec: {
			...q(t.organizationRef) === void 0 ? {} : { organizationRef: q(t.organizationRef) },
			baseAgent: r,
			adapter: n,
			...q(t.provider) === void 0 ? {} : { provider: q(t.provider) },
			model: a,
			prompt: c === void 0 ? { system: s } : {
				system: s,
				developer: c
			},
			approvalMode: q(t.approvalMode) ?? "prompt",
			...u === void 0 ? {} : { runtimeIdentity: { serviceAccountRef: u } },
			...q(t.toolProfileRef) === void 0 ? {} : { toolProfileRef: q(t.toolProfileRef) },
			...m === void 0 ? {} : { externalTools: m },
			...l(t.skillRefs) === void 0 ? {} : { skillRefs: l(t.skillRefs) },
			...l(t.subagentRefs) === void 0 ? {} : { subagentRefs: l(t.subagentRefs) },
			...l(t.contextLabelRefs) === void 0 ? {} : { contextLabelRefs: l(t.contextLabelRefs) },
			...q(t.workspacePolicyRef) === void 0 ? {} : { workspacePolicyRef: q(t.workspacePolicyRef) },
			...q(t.runnerPool) === void 0 ? {} : { runnerPool: q(t.runnerPool) },
			...y === void 0 ? {} : { permissionRefs: y },
			...l(t.memoryRepositoryRefs) === void 0 ? {} : { memoryRepositoryRefs: l(t.memoryRepositoryRefs) }
		},
		status: { phase: Q(e) ?? "Ready" }
	};
}
function is(e) {
	let t = q(X(e).displayName) ?? e.metadata.name, n = Jo(e)[zo] === "foundry";
	return {
		stackRef: e.metadata.name,
		name: t,
		custom: n,
		stack: rs(e)
	};
}
function as(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of ns(e, "AgentDefinition")) t.set(n.metadata.name, is(n));
	for (let n of $(e, "stacks")) t.set(n.metadata.name, is(n));
	return [...t.values()].sort((e, t) => e.name.localeCompare(t.name));
}
function os(e) {
	let t = $(e, "personas");
	return t.length > 0 ? t : ns(e, "AgentPersona");
}
function ss(e) {
	let t = $(e, "definitions");
	return t.length > 0 ? t : ns(e, "AgentDefinition");
}
function cs(e) {
	let t = $(e, "processTemplates");
	return t.length > 0 ? t : ns(e, "AgentProcessTemplate");
}
function ls(e) {
	let t = /* @__PURE__ */ new Map(), n = [...cs(e)].sort((e, t) => e.metadata.name.localeCompare(t.metadata.name));
	for (let e of n) {
		let n = X(e), r = q(n.taskKind);
		if (r === void 0 || !Qo.has(r)) continue;
		let i = (Array.isArray(n.phases) ? n.phases : []).map((e) => typeof e == "string" ? e.trim() : "").filter((e) => e.length > 0);
		i.length !== 0 && t.set(r, {
			taskKind: r,
			phases: i,
			processId: e.metadata.name,
			revision: us(e),
			displayName: q(n.displayName) ?? null
		});
	}
	return t;
}
function us(e) {
	let { generation: t, resourceVersion: n } = e.metadata;
	if (typeof t == "number" && Number.isFinite(t)) return t;
	if (typeof n == "string") {
		let e = Number.parseInt(n, 10);
		if (Number.isFinite(e)) return e;
	}
	return typeof n == "number" && Number.isFinite(n) ? n : 1;
}
function ds(e) {
	let t = $(e, "appearances");
	return t.length > 0 ? t : ns(e, "AgentAppearance");
}
function fs(e) {
	let t = $(e, "voiceProfiles");
	return t.length > 0 ? t : ns(e, "AgentVoiceProfile");
}
function ps(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of os(e)) t.set(n.metadata.name, n);
	let n = /* @__PURE__ */ new Map();
	for (let t of ds(e)) {
		let e = q(X(t).personaRef);
		e !== void 0 && n.set(e, t);
	}
	let r = /* @__PURE__ */ new Map();
	for (let t of fs(e)) {
		let e = q(X(t).personaRef);
		e !== void 0 && r.set(e, t);
	}
	return {
		personaByName: t,
		appearanceByPersona: n,
		voiceByPersona: r,
		personaViewByName: /* @__PURE__ */ new Map()
	};
}
function ms(e, t) {
	let n = t.personaViewByName.get(e.metadata.name);
	if (n !== void 0) return n;
	let r = X(e), i = q(r.displayName) ?? e.metadata.name, a = q(r.tagline) ?? null, o = q(Y(r.role)?.title) ?? null, s = Y(r.appearance), c = t.appearanceByPersona.get(e.metadata.name), l = s ?? (c === void 0 ? void 0 : X(c)), u = q(l?.emoji) ?? null, d = Y(l?.avatar) ?? null, f = Y(r.voiceProfile), p = t.voiceByPersona.get(e.metadata.name), m = q((f ?? (p === void 0 ? void 0 : X(p)))?.ttsProvider) ?? null, h = {
		name: e.metadata.name,
		displayName: i,
		roleTitle: o,
		tagline: a,
		emoji: u,
		avatar: d,
		ttsProvider: m
	};
	return t.personaViewByName.set(e.metadata.name, h), h;
}
function hs(e) {
	let t = ps(e);
	return [...t.personaByName.values()].map((e) => ms(e, t)).sort((e, t) => e.displayName.localeCompare(t.displayName));
}
function gs(e) {
	let t = ps(e), n = [];
	for (let r of ss(e)) {
		let e = X(r), i = q(e.personaRef) ?? "", a = i === "" ? void 0 : t.personaByName.get(i);
		n.push({
			name: r.metadata.name,
			personaRef: i,
			stackRef: q(e.stackRef) ?? "",
			roleContext: q(e.roleContext) ?? null,
			persona: a === void 0 ? null : ms(a, t)
		});
	}
	return n.sort((e, t) => e.name.localeCompare(t.name));
}
function _s(e, t, n, r) {
	if (r !== void 0) {
		let t = e.personaByName.get(r);
		if (t !== void 0) return ms(t, e);
	}
	if (n !== void 0) {
		let r = t.get(n), i = r === void 0 ? void 0 : q(X(r).personaRef);
		if (i !== void 0) {
			let t = e.personaByName.get(i);
			if (t !== void 0) return ms(t, e);
		}
	}
	return null;
}
var vs = new Set(Ct);
function ys(e) {
	let t = q(Z(e).boardColumn);
	return t !== void 0 && vs.has(t) ? t : void 0;
}
function bs(e) {
	let t = J(Z(e).progress);
	if (t !== void 0) return Math.min(1, Math.max(0, t));
}
function xs(e, t) {
	switch (e) {
		case "pending":
		case "Pending":
		case "queued":
		case "Queued": return "backlog";
		case "running":
		case "Running": return t.hasPendingReviewApproval || t.taskKind === "review" ? "ai-review" : "do";
		case "waiting-for-approval":
		case "AwaitingApproval": return "human-review";
		case "succeeded":
		case "Succeeded":
		case "Completed": return t.released ? "in-production" : t.merged ? "merged" : (t.hasApprovedWriteBack, "approved");
		case "failed":
		case "Failed":
		case "cancelled":
		case "Cancelled": return "backlog";
		default: return "backlog";
	}
}
var Ss = new Set([
	"succeeded",
	"Succeeded",
	"Completed",
	"failed",
	"Failed",
	"cancelled",
	"Cancelled"
]);
function Cs(e) {
	return e !== void 0 && Ss.has(e);
}
function ws(e) {
	return q(X(e).agentDispatchRun) ?? q(X(e).dispatchRun);
}
function Ts(e) {
	let t = ns(e, "AgentDispatchAttempt");
	return t.length > 0 ? t : [];
}
function Es(e) {
	let t = /* @__PURE__ */ new Map(), n = 0;
	for (let r of Ts(e)) {
		let e = ws(r);
		if (e === void 0) {
			n += 1;
			continue;
		}
		(t.get(e) ?? t.set(e, []).get(e)).push({
			item: r,
			seq: n
		}), n += 1;
	}
	let r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
	for (let [e, n] of t) {
		n.sort((e, t) => (Xo(e.item) ?? e.seq) - (Xo(t.item) ?? t.seq) || e.seq - t.seq);
		let t = n.map((e) => e.item);
		r.set(e, t);
		let a;
		for (let e = t.length - 1; e >= 0; --e) if (!Cs(Q(t[e]))) {
			a = t[e];
			break;
		}
		a ??= t[t.length - 1], a !== void 0 && i.set(e, a.metadata.name);
	}
	return {
		byRun: r,
		activeByRun: i
	};
}
function Ds(e) {
	return q(X(e).dispatchRun);
}
function Os(e) {
	let t = X(e).action, n = q(t);
	return n === void 0 ? q(Y(t)?.type) : n;
}
function ks(e) {
	let t = Q(e);
	return t === void 0 || t === "Pending";
}
function As(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = $(e, "approvals"), i = ts(e, "approvals");
	for (let e of r) {
		let n = Ds(e);
		n !== void 0 && (t.get(n) ?? t.set(n, []).get(n)).push(e);
	}
	let a = i.length > 0 ? i : r.filter(ks);
	for (let e of a) {
		let t = Ds(e);
		t !== void 0 && (n.get(t) ?? n.set(t, []).get(t)).push(e);
	}
	return {
		byRun: t,
		pendingByRun: n
	};
}
var js = new Set(["review", "ai-review"]), Ms = new Set([
	"write-back",
	"release",
	"tool-use"
]);
function Ns(e) {
	return q(X(e).dispatchRun);
}
function Ps(e) {
	return q(X(e).dispatchAttempt);
}
function Fs(e) {
	return Q(e) === "Active";
}
function Is(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of $(e, "sessions")) {
		if (!Fs(n)) continue;
		let e = Ns(n);
		e !== void 0 && (t.get(e) ?? t.set(e, []).get(e)).push(n);
	}
	return t;
}
function Ls(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of $(e, "sessions")) {
		let e = Ps(n);
		e !== void 0 && (t.get(e) ?? t.set(e, []).get(e)).push(n);
	}
	return t;
}
function Rs(e, t, n, r) {
	let i = t.activeByRun.get(e);
	if (i !== void 0) {
		let n = (r.get(i) ?? []).filter(Fs);
		if (n.length > 0) return n;
		if (t.byRun.has(e)) return [];
	}
	return n.get(e) ?? [];
}
var zs = {
	Pending: "created",
	Provisioning: "created",
	Ready: "ready",
	InUse: "ready",
	Released: "ready",
	Archived: "archived",
	Terminating: "missing"
};
function Bs(e) {
	return e !== void 0 && e in zs ? zs[e] : "missing";
}
function Vs(e) {
	let t = Y(Z(e).gitStatus), n = {
		branch: q(t?.branch) ?? "main",
		headSha: q(t?.headSha) ?? "",
		dirty: t?.dirty === !0
	}, r = J(t?.ahead), i = J(t?.behind), a = J(t?.uncommittedCount);
	return r !== void 0 && (n.ahead = r), i !== void 0 && (n.behind = i), a !== void 0 && (n.uncommittedCount = a), n;
}
function Hs(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of $(e, "workspaces")) t.set(n.metadata.name, n);
	return t;
}
function Us(e) {
	switch (Ks(e)) {
		case "running": return .5;
		case "succeeded": return 1;
		default: return 0;
	}
}
function Ws(e) {
	let t = $(e, "runs"), n = As(e), r = Hs(e), i = Is(e), a = Es(e), o = Ls(e), s = /* @__PURE__ */ new Map();
	for (let e of t) {
		let t = q(X(e).parentRunRef) ?? Jo(e)["commander.a5c.ai/parent"];
		t !== void 0 && (s.get(t) ?? s.set(t, []).get(t)).push(e.metadata.name);
	}
	let c = [], l = 0;
	for (let e of t) {
		let t = X(e), u = Jo(e), d = e.metadata.name, f = es(q(t.taskKind)), p = Q(e), m = n.pendingByRun.get(d) ?? [], h = m.some((e) => js.has(Os(e) ?? "")), g = m.some((e) => Ms.has(Os(e) ?? "")), _ = (n.byRun.get(d) ?? []).some((e) => Ms.has(Os(e) ?? "") && (Q(e) === "Approved" || q(Z(e).decision) === "approved")), v = q(Z(e).mergedAt) !== void 0 || u["commander.a5c.ai/merged"] === "true", y = q(Z(e).releasedAt) !== void 0 || u["commander.a5c.ai/release-id"] !== void 0, b = ys(e) ?? xs(p, {
			taskKind: f,
			hasPendingReviewApproval: h,
			hasPendingWriteBackApproval: g,
			hasApprovedWriteBack: _,
			merged: v,
			released: y
		}), x = b === "merged" || b === "in-production" || b === "approved" ? b : h ? "ai-review" : g ? "human-review" : b, S = q(t.workspaceRef) ?? "", C = S === "" ? void 0 : r.get(S), w = C === void 0 ? 0 : Vs(C).uncommittedCount ?? 0, T = q(Y(t.sourceRefs)?.pullRequest), E = q(t.repository) ?? "", D = q(t.title) ?? T ?? (E === "" ? d : `${E}:${f}`), O = Y(t.sourceEvent), k = q(t.description) ?? q(O?.name) ?? "", A = (n.byRun.get(d) ?? []).find((e) => q(Z(e).feedback) !== void 0), j = A ? q(Z(A).feedback) ?? null : null, M = Rs(d, a, i, o).map((e) => e.metadata.name), N = (a.byRun.get(d) ?? []).length || 1, P = {
			taskId: d,
			taskKind: f,
			title: D,
			repository: E,
			workspaceId: S,
			column: x,
			order: 0,
			yolo: Ko(Y(t.approvalPolicy)?.autoApprove) ?? u["commander.a5c.ai/yolo"] === "true",
			merged: x === "merged" || x === "in-production",
			progress: bs(e) ?? Us(p),
			parentId: q(t.parentRunRef) ?? u["commander.a5c.ai/parent"] ?? null,
			childIds: s.get(d) ?? [],
			agentIds: M,
			attempt: N,
			feedback: j,
			dirtyFileCount: w,
			hasPendingInquiry: m.length > 0,
			stackRef: q(t.agentStack) ?? "",
			description: k,
			releaseId: u["commander.a5c.ai/release-id"] ?? null,
			compacted: !1,
			workerAgentId: u["commander.a5c.ai/worker"] ?? null,
			reviewerAgentId: u["commander.a5c.ai/reviewer"] ?? null,
			humanAssigneeId: u["commander.a5c.ai/human"] ?? null
		};
		c.push({
			view: P,
			sortKey: Xo(e) ?? l,
			seq: l
		}), l += 1;
	}
	let u = /* @__PURE__ */ new Map();
	for (let e of c) (u.get(e.view.column) ?? u.set(e.view.column, []).get(e.view.column)).push(e);
	for (let e of u.values()) e.sort((e, t) => e.sortKey - t.sortKey || e.seq - t.seq), e.forEach((e, t) => {
		e.view.order = t;
	});
	return c.map((e) => e.view);
}
var Gs = {
	Pending: "pending",
	Queued: "queued",
	Running: "running",
	AwaitingApproval: "waiting-for-approval",
	Succeeded: "succeeded",
	Completed: "succeeded",
	Failed: "failed",
	Cancelled: "cancelled"
};
function Ks(e) {
	return e === void 0 ? "pending" : Gs[e] ?? e;
}
var qs = {
	pending: "Pending",
	queued: "Queued",
	running: "Running",
	"waiting-for-approval": "AwaitingApproval",
	succeeded: "Succeeded",
	Completed: "Succeeded",
	completed: "Succeeded",
	failed: "Failed",
	cancelled: "Cancelled"
};
function Js(e) {
	if (e !== void 0) return qs[e] ?? e;
}
var Ys = {
	Running: "waiting",
	Succeeded: "completed",
	Failed: "failed",
	Cancelled: "failed",
	Pending: "created",
	Queued: "created",
	AwaitingApproval: "waiting"
};
function Xs(e) {
	let t = Js(e);
	return t !== void 0 && t in Ys ? Ys[t] : "created";
}
function Zs(e, t, n) {
	let r = n?.get(e), i = r === void 0 ? wt[e] : r.phases, a = Us(t);
	if (a >= 1) return i.map((e) => ({
		label: e,
		status: "done"
	}));
	let o = a <= 0 ? 0 : Math.min(i.length - 1, Math.floor(i.length / 2));
	return i.map((e, t) => ({
		label: e,
		status: t < o ? "done" : t === o ? "current" : "pending"
	}));
}
function Qs(e, t) {
	let n = As(e).pendingByRun.get(t) ?? [];
	return n.length === 0 ? {} : { breakpoint: n.length };
}
function $s(e, t) {
	let n = t?.get(e);
	return n === void 0 ? `commander/${e}@v1` : n.processId;
}
function ec(e) {
	let t = $(e, "runs"), n = ls(e);
	return t.map((t) => {
		let r = X(t), i = Z(t), a = es(q(r.taskKind)), o = Q(t), s = Yo(i.queuedAt) ?? Xo(t) ?? 0, c = Yo(i.completedAt) ?? Yo(i.failedAt);
		return {
			runId: t.metadata.name,
			taskId: t.metadata.name,
			taskKind: a,
			processId: $s(a, n),
			processRevision: n.get(a)?.revision ?? 1,
			observedState: Xs(o),
			phases: Zs(a, o, n),
			pendingEffectsByKind: Qs(e, t.metadata.name),
			tokens: { ...Wo },
			costUsd: J(i.cost) ?? 0,
			startedAt: s,
			endedAt: c ?? null
		};
	}).sort((e, t) => t.startedAt - e.startedAt);
}
function tc(e, t) {
	let n = $(e, "runs").find((e) => e.metadata.name === t);
	if (n === void 0) return null;
	let r = es(q(X(n).taskKind)), i = Q(n), a = ls(e);
	return {
		runId: n.metadata.name,
		taskId: n.metadata.name,
		observedState: Xs(i),
		pendingEffectsByKind: Qs(e, t),
		phases: Zs(r, i, a),
		journal: []
	};
}
var nc = {
	Active: "active",
	Completed: "completed",
	Failed: "aborted",
	Cancelled: "aborted"
};
function rc(e) {
	return e !== void 0 && e in nc ? nc[e] : "active";
}
function ic(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of $(e, "transcripts")) {
		let e = q(X(n).sessionRef);
		e !== void 0 && t.set(e, n);
	}
	return { bySession: t };
}
function ac(e) {
	if (e === void 0) return {
		tokenUsage: { ...Wo },
		cost: { ...Uo },
		messageCount: 0,
		transcriptLength: 0
	};
	let t = X(e), n = Y(t.cost), r = qo(t.messages) ?? [], i = J(n?.inputTokens) ?? 0, a = J(n?.outputTokens) ?? 0, o = J(n?.thinkingTokens) ?? 0, s = J(n?.cachedTokens) ?? 0, c = J(n?.totalUsd) ?? 0;
	return {
		tokenUsage: {
			inputTokens: i,
			outputTokens: a,
			thinkingTokens: o,
			cachedTokens: s
		},
		cost: {
			totalUsd: c,
			inputTokens: i,
			outputTokens: a,
			thinkingTokens: o
		},
		messageCount: r.length,
		transcriptLength: r.length
	};
}
function oc(e, t) {
	if (t === void 0) return "";
	let n = $(e, "runs").find((e) => e.metadata.name === t);
	return n === void 0 ? "" : q(X(n).agentStack) ?? "";
}
function sc(e, t, n, r) {
	let i = X(t), a = q(i.dispatchRun), o = a === void 0 ? void 0 : $(e, "runs").find((e) => e.metadata.name === a), s = o === void 0 ? {} : X(o);
	return _s(n, r, q(i.agentDefinition) ?? q(s.agentDefinition), q(i.personaRef) ?? q(s.personaRef));
}
function cc(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of ss(e)) t.set(n.metadata.name, n);
	return t;
}
function lc(e, t, n, r, i, a) {
	let o = X(t), s = Jo(t), c = t.metadata.name, l = q(o.dispatchRun), u = sc(e, t, i, a)?.displayName ?? s["commander.a5c.ai/creature"] ?? c, d = $o(q(o.adapter)), f = q(o.model) ?? H[d][0] ?? "", p = s["kradle.a5c.ai/agent-role"] === "reviewer" ? "reviewer" : s["kradle.a5c.ai/agent-role"] === "integration" ? "integration" : "worker", m = rc(Q(t)), h = oc(e, l), g = ac(n.bySession.get(c)), _ = q(o.title) ?? `${u} — ${p}`, v = m === "active" ? null : 0;
	return {
		sessionId: c,
		title: _,
		creatureName: u,
		agent: d,
		model: f,
		stackRef: h,
		stackName: r.get(h) ?? h,
		role: p,
		coordination: s[Vo] === "true",
		taskId: l ?? "",
		attempt: J(o.attempt) ?? 1,
		runId: l ?? null,
		parentSessionId: s["commander.a5c.ai/parent-session"] ?? q(o.parentSession) ?? null,
		reviewOfSessionId: s["commander.a5c.ai/review-of"] ?? q(o.reviewOfSession) ?? null,
		status: m,
		startedTick: 0,
		endedTick: v,
		turnCount: 0,
		messageCount: g.messageCount,
		tokenUsage: g.tokenUsage,
		cost: g.cost,
		transcriptLength: g.transcriptLength
	};
}
function uc(e, t) {
	let n = ic(e), r = new Map(as(e).map((e) => [e.stackRef, e.name])), i = ps(e), a = cc(e), o = $(e, "sessions"), s = [], c = 0;
	for (let l of o) {
		if (t !== void 0 && Ns(l) !== t) {
			c += 1;
			continue;
		}
		s.push({
			view: lc(e, l, n, r, i, a),
			sortKey: Xo(l) ?? c,
			seq: c
		}), c += 1;
	}
	return s.sort((e, t) => t.sortKey - e.sortKey || t.seq - e.seq), s.map((e) => e.view);
}
var dc = {
	user: "user",
	assistant: "message",
	system: "event",
	tool: "tool_call"
};
function fc(e, t) {
	let n = $(e, "sessions").find((e) => e.metadata.name === t);
	if (n === void 0) return null;
	let r = ic(e), i = lc(e, n, r, new Map(as(e).map((e) => [e.stackRef, e.name])), ps(e), cc(e)), a = r.bySession.get(t);
	return {
		record: i,
		transcript: (a === void 0 ? [] : qo(X(a).messages) ?? []).map((e, t) => {
			let n = Y(e) ?? {}, r = dc[q(n.role) ?? "assistant"] ?? "message", i = {
				seq: t,
				tick: 0,
				timestamp: Yo(n.timestamp) ?? 0,
				kind: r,
				text: q(n.content) ?? ""
			}, a = q(n.toolName);
			return a !== void 0 && (i.toolName = a), i;
		})
	};
}
function pc(e, t) {
	let n = $(e, "runs").find((e) => e.metadata.name === t);
	if (n === void 0) return null;
	let r = q(X(n).workspaceRef), i = r === void 0 ? void 0 : Hs(e).get(r), a = (As(e).byRun.get(t) ?? []).map((e) => q(Z(e).feedback)).filter((e) => e !== void 0);
	return {
		taskId: t,
		phase: i === void 0 ? "missing" : Bs(Q(i)),
		gitStatus: i === void 0 ? {
			branch: "main",
			headSha: "",
			dirty: !1
		} : Vs(i),
		files: [],
		testEvidence: { status: "unknown" },
		reviewerNotes: a
	};
}
function mc(e) {
	let t = Ws(e), n = $(e, "workspaces"), r = Is(e);
	return n.map((e) => {
		let n = e.metadata.name, i = Vs(e), a = Bs(Q(e)), o = t.filter((e) => e.workspaceId === n), s = o.map((e) => e.taskId), c = o.map((e) => ({
			taskId: e.taskId,
			title: e.title,
			branch: i.branch,
			headSha: i.headSha,
			dirty: i.dirty,
			dirtyFileCount: e.dirtyFileCount
		})), l = o.flatMap((e) => (r.get(e.taskId) ?? []).map((e) => e.metadata.name));
		return {
			workspaceId: n,
			name: n,
			repository: q(X(e).repository) ?? "",
			phase: a,
			gitStatus: o.length > 0 ? i : null,
			dirty: i.dirty,
			cardIds: s,
			cards: c,
			activeSessionIds: l
		};
	});
}
function hc(e) {
	let t = e.indexOf(":");
	return t > 0 ? e.slice(0, t) : e;
}
function gc(e, t, n) {
	let r = (n?.matches ?? []).map((e) => ({
		recordId: e.record.id,
		kind: e.record.nodeKind,
		silo: hc(e.record.id),
		tick: 0,
		unitId: t
	})), i = [], a = [...$(e, "memoryImports"), ...ns(e, "AgentMemoryUpdate")];
	for (let e of a) {
		let n = X(e);
		if (q(n.sourceRun) !== t) continue;
		let r = (qo(n.changes) ?? []).map((e) => {
			let t = Y(e) ?? {};
			return {
				path: q(t.path) ?? "",
				action: q(t.action) ?? "modify",
				reason: q(t.reason) ?? ""
			};
		});
		i.push({
			updateId: e.metadata.name,
			silo: q(n.memoryRepository) ?? "",
			changes: r,
			phase: Q(e) ?? "Pending",
			tick: 0,
			unitId: t
		});
	}
	return {
		read: r,
		written: i
	};
}
function _c(e) {
	let t = ls(e);
	return U.map((e) => {
		let n = t.get(e);
		return n === void 0 ? {
			kind: e,
			processId: $s(e),
			revision: 1,
			phases: [...wt[e]]
		} : {
			kind: e,
			processId: n.processId,
			revision: n.revision,
			phases: [...n.phases]
		};
	});
}
function vc(e, t, n, r, i, a, o) {
	let s = X(t), c = Jo(t), l = q(s.dispatchRun), u = $o(q(s.adapter)), d = q(s.model) ?? H[u][0] ?? "", f = oc(e, l), p = c["kradle.a5c.ai/agent-role"] === "reviewer" ? "reviewer" : c["kradle.a5c.ai/agent-role"] === "integration" ? "integration" : "worker", m = ac(r.bySession.get(t.metadata.name)), h = sc(e, t, i, a);
	return {
		unitId: t.metadata.name,
		agent: u,
		model: d,
		creatureName: h?.displayName ?? c["commander.a5c.ai/creature"] ?? t.metadata.name,
		stackRef: f,
		stackName: n.get(f) ?? f,
		role: p,
		taskId: l ?? "",
		state: "thinking",
		paused: !1,
		runId: l ?? "",
		pendingHookId: null,
		heldPieces: [],
		tokenUsage: m.tokenUsage,
		cost: m.cost,
		turnCount: 0,
		messageCount: m.messageCount,
		createdAt: Xo(t) ?? o,
		updatedAt: o
	};
}
var yc = {
	Running: "in_progress",
	Succeeded: "done",
	Failed: "failed",
	Cancelled: "failed",
	Pending: "queued",
	Queued: "queued",
	AwaitingApproval: "review"
};
function bc(e) {
	let t = Js(e);
	return t !== void 0 && t in yc ? yc[t] : "queued";
}
function xc(e) {
	let t = X(e), n = Q(e), r = es(q(t.taskKind)), i = n === "Succeeded" || n === "succeeded" ? "Ready" : n === "Failed" || n === "failed" || n === "Cancelled" || n === "cancelled" ? "Error" : "Pending";
	return {
		taskId: e.metadata.name,
		taskKind: r,
		repository: q(t.repository) ?? "",
		workspaceId: q(t.workspaceRef) ?? "",
		title: q(t.title) ?? q(Y(t.sourceRefs)?.pullRequest) ?? e.metadata.name,
		state: bc(n),
		phase: i,
		progress: bs(e) ?? Us(n),
		assigneeIds: [],
		priority: J(t.priority) ?? 0
	};
}
function Sc(e, t, n) {
	let r = X(e), i = q(r.dispatchRun), a = $o(q(r.adapter)), o = q(r.model) ?? H[a][0] ?? "", s = ac(t.bySession.get(e.metadata.name));
	return {
		unitId: e.metadata.name,
		agent: a,
		model: o,
		title: q(r.title) ?? e.metadata.name,
		workspaceId: "",
		state: "thinking",
		paused: !1,
		taskId: i ?? null,
		runId: i ?? null,
		turnIndex: 0,
		turnCount: 0,
		messageCount: s.messageCount,
		pendingHookId: null,
		tokenUsage: s.tokenUsage,
		cost: s.cost,
		createdAt: Xo(e) ?? n,
		updatedAt: n
	};
}
function Cc(e, t) {
	let n = As(e), r = Is(e), i = [];
	for (let [e, a] of n.pendingByRun) {
		let n = r.get(e)?.[0]?.metadata.name ?? "";
		for (let r of a) {
			let a = Y(X(r).action), o = q(a?.summary) ?? "Approval requested";
			i.push({
				hookRequestId: r.metadata.name,
				runId: e,
				unitId: n,
				hookKind: q(a?.type) ?? "breakpoint",
				payload: {
					taskId: e,
					question: o,
					options: [{
						id: "approve",
						caption: "Approve"
					}, {
						id: "deny",
						caption: "Deny"
					}]
				},
				deadlineTs: t + Ho
			});
		}
	}
	return i;
}
function wc(e, t) {
	let n = As(e), r = Is(e), i = [];
	for (let [e, a] of n.pendingByRun) {
		let n = r.get(e)?.[0]?.metadata.name ?? "";
		for (let r of a) {
			let a = q(Y(X(r).action)?.summary) ?? "Approval requested";
			i.push({
				hookRequestId: r.metadata.name,
				runId: e,
				taskId: e,
				unitId: n,
				inquiryKind: "tool-approval",
				question: a,
				options: [{
					id: "approve",
					caption: "Approve",
					tone: "primary"
				}, {
					id: "deny",
					caption: "Deny",
					tone: "danger"
				}],
				deadlineTs: t + Ho
			});
		}
	}
	return i;
}
function Tc(e, t) {
	let n = Ws(e), r = ic(e), i = new Map(as(e).map((e) => [e.stackRef, e.name])), a = ps(e), o = cc(e), s = $(e, "sessions").filter(Fs), c = s.map((n) => vc(e, n, i, r, a, o, t)), l = s.map((e) => Sc(e, r, t)), u = $(e, "runs").map((e) => xc(e)), d = Cc(e, t), f = wc(e, t), p = {};
	for (let t of n) {
		if (t.agentIds.length === 0) continue;
		let n = tc(e, t.taskId);
		p[t.taskId] = n?.phases.find((e) => e.status === "current")?.label ?? null;
	}
	return {
		cards: n,
		agents: c,
		units: l,
		tasks: u,
		hooks: d,
		inquiries: f,
		runStages: p,
		personas: hs(e),
		definitions: gs(e)
	};
}
//#endregion
//#region src/backend/kradle/kradleOrders.ts
function Ec(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function Dc(e) {
	return typeof e == "string" ? e : void 0;
}
function Oc(e) {
	return Ec(e.spec) ? e.spec : {};
}
function kc(e) {
	let t = e.metadata.labels;
	if (!Ec(t)) return {};
	let n = {};
	for (let [e, r] of Object.entries(t)) typeof r == "string" && (n[e] = r);
	return n;
}
function Ac(e) {
	return e?.agents?.runs?.items ?? [];
}
function jc(e) {
	let t = e?.agents?.approvals?.pending;
	return Array.isArray(t) ? t : (e?.agents?.approvals?.items ?? []).filter((e) => {
		let t = Ec(e.status) ? Dc(e.status.phase) : void 0;
		return t === void 0 || t === "Pending";
	});
}
function Mc(e) {
	return e?.agents?.stacks?.items ?? [];
}
function Nc(e) {
	return e?.agents?.definitions?.items ?? [];
}
var Pc = {
	"claude-code": "claude-code",
	codex: "codex",
	"gemini-cli": "gemini-cli",
	pi: "pi"
};
function Fc(e) {
	if (e !== void 0) {
		for (let t of Object.keys(Pc)) if (e === t || e.includes(t)) return t;
		return e;
	}
}
function Ic(e, t) {
	let n = Mc(e);
	if (n.length === 0) return ft[t] ?? null;
	let r = n.find((e) => kc(e)[Bo] === t);
	if (r !== void 0) return r.metadata.name;
	let i = ct[t], a = n.find((e) => Fc(Dc(Oc(e).adapter)) === i);
	return a === void 0 ? n[0].metadata.name : a.metadata.name;
}
function Lc(e, t, n) {
	let r = Nc(e);
	return n != null && n !== "" ? r.find((e) => e.metadata.name === n)?.metadata.name ?? n : r.find((e) => kc(e)["commander.a5c.ai/default-for"] === t)?.metadata.name ?? null;
}
var Rc = "default";
function zc(e, t) {
	let n = e.spec, r = e.metadata.name, i = { ...e.metadata.labels ?? {} }, a = n.runtimeIdentity?.serviceAccountRef ?? Rc, o = {
		organizationRef: n.organizationRef ?? t,
		baseAgent: n.baseAgent,
		adapter: n.adapter,
		model: n.model,
		prompt: n.prompt,
		approvalMode: n.approvalMode,
		runtimeIdentity: {
			...n.runtimeIdentity ?? {},
			serviceAccountRef: a
		}
	};
	return n.provider !== void 0 && (o.provider = n.provider), n.toolProfileRef !== void 0 && (o.toolProfileRef = n.toolProfileRef), n.externalTools !== void 0 && (o.externalTools = n.externalTools), n.skillRefs !== void 0 && (o.skillRefs = n.skillRefs), n.subagentRefs !== void 0 && (o.subagentRefs = n.subagentRefs), n.contextLabelRefs !== void 0 && (o.contextLabelRefs = n.contextLabelRefs), n.workspacePolicyRef !== void 0 && (o.workspacePolicyRef = n.workspacePolicyRef), n.runnerPool !== void 0 && (o.runnerPool = n.runnerPool), n.permissionRefs !== void 0 && (o.permissionRefs = n.permissionRefs), n.memoryRepositoryRefs !== void 0 && (o.memoryRepositoryRefs = n.memoryRepositoryRefs), n.displayName !== void 0 && (o.displayName = n.displayName), n.agentRole !== void 0 && (o.agentRole = n.agentRole), {
		apiVersion: e.apiVersion ?? "kradle.a5c.ai/v1alpha1",
		kind: "AgentStack",
		metadata: {
			name: r,
			labels: i
		},
		spec: o
	};
}
function Bc(e, t) {
	let { personaRef: n, stackRef: r, roleContext: i, scope: a, triggerRefs: o, meetingConfig: s, limits: c } = e.spec, l = {
		organizationRef: e.spec.organizationRef ?? t,
		personaRef: n,
		stackRef: r
	};
	return i !== void 0 && (l.roleContext = i), a !== void 0 && (l.scope = a), o !== void 0 && (l.triggerRefs = o), s !== void 0 && (l.meetingConfig = s), c !== void 0 && (l.limits = c), {
		apiVersion: "kradle.a5c.ai/v1alpha1",
		kind: "AgentDefinition",
		metadata: {
			name: e.name,
			...e.labels ? { labels: e.labels } : {}
		},
		spec: l
	};
}
async function Vc(e, t) {
	let n = Bc(t, e.org);
	return await e.applyResource(n), t.name;
}
function Hc(e, t) {
	let n = e.name, r = `${n}-soul`, i = `${n}-appearance`, a = `${n}-voice`;
	return [
		{
			apiVersion: "kradle.a5c.ai/v1alpha1",
			kind: "AgentPersona",
			metadata: { name: n },
			spec: {
				organizationRef: t,
				displayName: e.displayName,
				...e.tagline ? { tagline: e.tagline } : {},
				role: {
					title: e.roleTitle ?? "",
					domain: e.roleDomain ?? ""
				},
				personality: {
					communicationStyle: e.communicationStyle ?? "direct",
					tone: e.tone ?? "professional",
					traits: []
				},
				...e.skillRefs && e.skillRefs.length > 0 ? { skillRefs: e.skillRefs } : {},
				soul: { ref: r },
				appearance: { ref: i },
				voiceProfile: { ref: a }
			}
		},
		{
			apiVersion: "kradle.a5c.ai/v1alpha1",
			kind: "AgentSoul",
			metadata: { name: r },
			spec: {
				organizationRef: t,
				personaRef: n,
				format: "markdown",
				content: e.soul && e.soul.trim() !== "" ? e.soul : `# ${e.displayName}`
			}
		},
		{
			apiVersion: "kradle.a5c.ai/v1alpha1",
			kind: "AgentAppearance",
			metadata: { name: i },
			spec: {
				organizationRef: t,
				personaRef: n,
				avatar: { type: "initials" },
				theme: { primaryColor: "var(--accent)" },
				...e.emoji ? { emoji: e.emoji } : {}
			}
		},
		{
			apiVersion: "kradle.a5c.ai/v1alpha1",
			kind: "AgentVoiceProfile",
			metadata: { name: a },
			spec: {
				organizationRef: t,
				personaRef: n,
				ttsProvider: e.ttsProvider ?? "openai",
				ttsConfig: {
					voice: e.ttsVoice ?? "nova",
					speed: 1
				}
			}
		}
	];
}
async function Uc(e, t) {
	let n = Hc(t, e.org);
	for (let t of n) await e.applyResource(t);
	return t.name;
}
function Wc(e) {
	return `process-${e}`;
}
function Gc(e, t) {
	let n = {
		organizationRef: t,
		taskKind: e.taskKind,
		phases: e.phases
	};
	return e.displayName !== void 0 && e.displayName !== "" && (n.displayName = e.displayName), {
		apiVersion: "kradle.a5c.ai/v1alpha1",
		kind: "AgentProcessTemplate",
		metadata: { name: e.name ?? Wc(e.taskKind) },
		spec: n
	};
}
async function Kc(e, t) {
	let n = Gc(t, e.org);
	return await e.applyResource(n), n.metadata.name;
}
function qc(e, t) {
	return jc(e).some((e) => e.metadata.name === t);
}
function Jc(e, t) {
	return Ac(e).some((e) => e.metadata.name === t);
}
function Yc(e, t) {
	let { getSnapshot: n, scheduleRefresh: r, gatewayOrders: i } = t, a = t.repo || "default", o = /* @__PURE__ */ new Set();
	function s(e) {
		o.has(e) || (o.add(e), console.warn(`kradleOrders: '${e}' has no kradle write path (documented no-op)`));
	}
	function c(e, t) {
		t().then(() => {
			r();
		}, (t) => {
			console.warn(`kradleOrders: '${e}' failed`, t);
		});
	}
	return {
		abort(t) {
			let r = n();
			for (let n of t) Jc(r, n) ? c("abort/cancelRun", () => e.cancelRun(n)) : i ? i.abort([n]) : s("abort");
		},
		steer(e, t) {
			i ? i.steer(e, t) : s("steer");
		},
		decide(t, r) {
			if (qc(n(), t)) {
				let n = r === "allow" ? "approve" : "deny";
				c("decide/decideApproval", () => e.decideApproval(t, n));
				return;
			}
			if (i) {
				i.decide(t, r);
				return;
			}
			s("decide");
		},
		answerInquiry(t, r) {
			let a = n();
			if (i && !qc(a, t)) {
				i.answerInquiry(t, r);
				return;
			}
			if (qc(a, t)) {
				let n = r === null || /^(approve|proceed|allow|yes|continue|ship|go)$/i.test(r) ? "approve" : "deny";
				c("answerInquiry/decideApproval", () => e.decideApproval(t, n));
				return;
			}
			if (i) {
				i.answerInquiry(t, r);
				return;
			}
			s("answerInquiry");
		},
		createTask(t) {
			let r = n(), i = Lc(r, t.taskKind);
			if (i !== null) {
				let n = {
					agentDefinition: i,
					repository: a,
					ref: "main",
					...t.title ? { task: t.title } : {},
					taskKind: t.taskKind,
					actor: "owner"
				};
				return c("createTask/dispatch(definition)", () => e.dispatch(n)), `dispatched:${i}`;
			}
			let o = Ic(r, t.taskKind);
			if (o === null) return s("createTask"), null;
			let l = {
				agentStack: o,
				stackRef: o,
				repository: a,
				ref: "main",
				...t.title ? { task: t.title } : {},
				taskKind: t.taskKind,
				actor: "owner"
			};
			return c("createTask/dispatch", () => e.dispatch(l)), `dispatched:${o}`;
		},
		upsertStack(t) {
			let n = zc(t, e.org);
			return t.stackRef !== void 0 && t.stackRef !== "" ? (n.metadata.name = t.stackRef, c("upsertStack/applyResource", () => e.applyResource(n)), t.stackRef) : (c("upsertStack/applyResource", () => e.applyResource(n)), t.metadata.name);
		},
		upsertDefinition(t) {
			return c("upsertDefinition/applyDefinition", () => Vc(e, {
				name: t.name,
				spec: {
					personaRef: t.personaRef,
					stackRef: t.stackRef,
					...t.roleContext !== void 0 && t.roleContext !== "" ? { roleContext: t.roleContext } : {}
				}
			})), t.name;
		},
		createAgentIdentity(t) {
			return c("createAgentIdentity/applyAgentIdentity", () => Uc(e, t)), t.name;
		},
		createRosterAgent() {
			return s("createRosterAgent"), null;
		},
		deleteRosterAgent() {
			s("deleteRosterAgent");
		},
		pauseUnits() {
			s("pauseUnits");
		},
		resumeUnits() {
			s("resumeUnits");
		},
		prioritize() {
			s("prioritize");
		},
		toggleSim() {
			s("toggleSim");
		},
		moveCard(e, t) {
			s("moveCard");
		},
		setYolo() {
			s("setYolo");
		},
		revertCard() {
			s("revertCard");
		},
		release() {
			return s("release"), null;
		},
		rollbackCard() {
			s("rollbackCard");
		},
		setSpeed() {
			return s("setSpeed"), !1;
		},
		updateTask(e, t) {
			return s("updateTask"), !1;
		},
		updateProcessTemplate(t, n) {
			let r = n.map((e) => e.trim()).filter((e) => e.length > 0);
			return r.length === 0 ? null : (c("updateProcessTemplate/applyProcessTemplate", () => Kc(e, {
				taskKind: t,
				phases: r
			})), 1);
		},
		writeFile() {
			return s("writeFile"), !1;
		},
		assignTaskAgent(e, t, n) {
			s("assignTaskAgent");
		},
		assignTaskHuman() {
			s("assignTaskHuman");
		},
		focusInquiryCard() {}
	};
}
//#endregion
//#region src/backend/real/realBoot.ts
var Xc = {
	getWorkspaceView() {
		return null;
	},
	getRunObservation() {
		return null;
	},
	listStacks() {
		return [];
	},
	listRosterAgents() {
		return [];
	},
	listPersonas() {
		return [];
	},
	listDefinitions() {
		return [];
	},
	listRuns() {
		return [];
	},
	listProcessTemplates() {
		return [];
	},
	getMemoryIO() {
		return {
			read: [],
			written: []
		};
	},
	getWorkspaceTree() {
		return null;
	},
	getFileContent() {
		return null;
	},
	getGitLog() {
		return [];
	},
	listSessions() {
		return [];
	},
	getSession() {
		return null;
	},
	listCardViews() {
		return [];
	},
	listWorkspaces() {
		return [];
	}
};
function Zc(e, t) {
	return {
		abort(n) {
			for (let t of n) e.send({
				type: "session.message",
				sessionId: t,
				prompt: "/abort"
			});
			t();
		},
		steer(n, r) {
			for (let t of n) e.send({
				type: "session.message",
				sessionId: t,
				prompt: r
			});
			t();
		},
		decide(n, r) {
			e.send({
				type: "hook.decision",
				hookRequestId: n,
				decision: r
			}), t();
		},
		answerInquiry(n, r) {
			e.send({
				type: "hook.decision",
				hookRequestId: n,
				decision: "allow",
				...r === null ? {} : { optionId: r }
			}), t();
		},
		pauseUnits() {},
		resumeUnits() {},
		prioritize() {},
		toggleSim() {},
		moveCard() {},
		setYolo() {},
		createTask() {
			return null;
		},
		revertCard() {},
		release() {
			return null;
		},
		rollbackCard() {},
		setSpeed() {
			return !1;
		},
		updateTask() {
			return !1;
		},
		upsertStack() {
			return null;
		},
		upsertDefinition() {
			return null;
		},
		createAgentIdentity() {
			return null;
		},
		updateProcessTemplate() {
			return null;
		},
		writeFile() {
			return !1;
		},
		createRosterAgent() {
			return null;
		},
		deleteRosterAgent() {},
		assignTaskAgent() {},
		assignTaskHuman() {},
		focusInquiryCard() {}
	};
}
var Qc = 5e3, $c = 500, el = class {
	snapshot = null;
	deps;
	pollHandle = null;
	debounceHandle = null;
	streamUnsub = null;
	disposed = !1;
	inFlight = !1;
	memoryIo = /* @__PURE__ */ new Map();
	memoryInFlight = /* @__PURE__ */ new Set();
	constructor(e) {
		this.deps = e;
	}
	getSnapshot() {
		return this.snapshot;
	}
	views() {
		return {
			getWorkspaceView: (e) => this.snapshot ? pc(this.snapshot, e) : null,
			getRunObservation: (e) => this.snapshot ? tc(this.snapshot, e) : null,
			listStacks: () => this.snapshot ? as(this.snapshot) : [],
			listRosterAgents: () => [],
			listPersonas: () => this.snapshot ? hs(this.snapshot) : [],
			listDefinitions: () => this.snapshot ? gs(this.snapshot) : [],
			listRuns: () => this.snapshot ? ec(this.snapshot) : [],
			listProcessTemplates: () => this.snapshot ? _c(this.snapshot) : [],
			getMemoryIO: (e) => {
				if (!this.snapshot) return {
					read: [],
					written: []
				};
				let t = this.memoryIo.get(e);
				return t === void 0 && this.fetchMemory(e), gc(this.snapshot, e, t);
			},
			getWorkspaceTree: () => null,
			getFileContent: () => null,
			getGitLog: () => [],
			listSessions: (e) => this.snapshot ? uc(this.snapshot, e) : [],
			getSession: (e) => this.snapshot ? fc(this.snapshot, e) : null,
			listCardViews: () => this.snapshot ? Tc(this.snapshot, this.deps.now()).cards : [],
			listWorkspaces: () => this.snapshot ? mc(this.snapshot) : []
		};
	}
	start() {
		this.refresh(), this.pollHandle = this.deps.setTimer(() => this.tickPoll(), Qc), this.streamUnsub = this.deps.client.openEventStream(() => this.scheduleRefresh());
	}
	scheduleRefresh() {
		this.disposed || this.debounceHandle === null && (this.debounceHandle = this.deps.setTimer(() => {
			this.debounceHandle = null, this.refresh();
		}, $c));
	}
	tickPoll() {
		this.disposed || (this.refresh(), this.pollHandle = this.deps.setTimer(() => this.tickPoll(), Qc));
	}
	refresh() {
		this.disposed || this.inFlight || (this.inFlight = !0, this.deps.client.snapshot().then((e) => {
			this.inFlight = !1, !this.disposed && (this.snapshot = e, this.memoryIo.clear(), this.memoryInFlight.clear(), this.deps.onSnapshot(e));
		}, (e) => {
			this.inFlight = !1, console.warn("KradleControllerCache: snapshot refresh failed", e);
		}));
	}
	fetchMemory(e) {
		this.disposed || this.memoryInFlight.has(e) || (this.memoryInFlight.add(e), this.deps.client.queryMemory({
			snapshotRef: e,
			requester: {
				kind: "commander",
				name: "board"
			},
			query: {
				text: "",
				modes: ["graph-only"]
			}
		}).then((t) => {
			this.memoryInFlight.delete(e), !this.disposed && (this.memoryIo.set(e, t), this.snapshot && this.deps.onSnapshot(this.snapshot));
		}, () => {
			this.memoryInFlight.delete(e);
		}));
	}
	dispose() {
		this.disposed = !0, this.pollHandle !== null && this.deps.clearTimer(this.pollHandle), this.debounceHandle !== null && this.deps.clearTimer(this.debounceHandle), this.streamUnsub !== null && this.streamUnsub(), this.pollHandle = null, this.debounceHandle = null, this.streamUnsub = null;
	}
};
function tl(e, t, n, r = {}) {
	let i = [], a = !1, o = !1, s = 0, c = r.now ?? (() => Date.now()), l = r.setTimer ?? ((e, t) => setTimeout(e, t)), u = r.clearTimer ?? ((e) => clearTimeout(e)), d = () => {
		if (o || i.length === 0) return;
		let t = i;
		i = [], s += 1, e.getState().commitTick({
			frames: t,
			units: [],
			tasks: [],
			hooks: [],
			cards: [],
			agents: [],
			inquiries: [],
			runStages: {},
			rosterAgents: [],
			personas: [],
			definitions: [],
			nowMs: c(),
			tickIndex: s,
			paused: !1
		});
	}, f = t.onFrame((e) => {
		i.push(e), a || (a = !0, queueMicrotask(() => {
			a = !1, d();
		}));
	}), p = Zc(t, d);
	if (!(n?.kradleApiUrl !== void 0 && n.kradleApiUrl !== "")) return {
		flush: d,
		orders: p,
		views: Xc,
		dispose() {
			o = !0, f();
		}
	};
	let m = r.createClient === void 0 ? Ro({
		kradleApiUrl: n.kradleApiUrl,
		...n.kradleToken === void 0 ? {} : { kradleToken: n.kradleToken },
		...n.kradleOrg === void 0 ? {} : { kradleOrg: n.kradleOrg },
		...n.kradleRepo === void 0 ? {} : { kradleRepo: n.kradleRepo }
	}) : r.createClient(n), h = new el({
		client: m,
		onSnapshot: (t) => {
			if (o) return;
			let n = c(), r = Tc(t, n);
			s += 1, e.getState().commitTick({
				frames: [],
				units: r.units,
				tasks: r.tasks,
				hooks: r.hooks,
				cards: r.cards,
				agents: r.agents,
				inquiries: r.inquiries,
				runStages: r.runStages,
				rosterAgents: [],
				personas: r.personas,
				definitions: r.definitions,
				nowMs: n,
				tickIndex: s,
				paused: !1
			});
		},
		now: c,
		setTimer: l,
		clearTimer: u
	}), g = n.gatewayUrl !== void 0 && n.gatewayUrl !== "", _ = Yc(m, {
		repo: n.kradleRepo ?? "default",
		getSnapshot: () => h.getSnapshot(),
		scheduleRefresh: () => h.scheduleRefresh(),
		...g ? { gatewayOrders: p } : {}
	});
	return h.start(), {
		flush: d,
		orders: _,
		views: h.views(),
		dispose() {
			o = !0, f(), h.dispose();
		}
	};
}
//#endregion
//#region src/lib.tsx
function nl(e) {
	return e.mock === !0 ? {
		mode: "mock",
		seed: 42
	} : {
		mode: "real",
		seed: 42,
		kradleApiUrl: e.kradleApiUrl !== void 0 && e.kradleApiUrl !== "" ? e.kradleApiUrl : window.location.origin,
		kradleOrg: e.org,
		kradleRepo: e.kradleRepo ?? "default",
		...e.kradleToken ? { kradleToken: e.kradleToken } : {},
		...e.gatewayUrl ? { gatewayUrl: e.gatewayUrl } : {}
	};
}
function rl(e) {
	let t = nl(e), n = Eo(t), r = Qn(), i, a, o = !1;
	if (n instanceof uo) i = $n(r, n), a = n.sim, e.mock === !0 && (window.__commander = {
		store: r,
		version: Fn
	}, o = !0);
	else {
		let e = tl(r, n, t);
		i = e, a = e.views;
	}
	return n.connect().catch((e) => {
		console.error("A5C Commander: backend failed to connect", e);
	}), {
		store: r,
		orders: i.orders,
		views: a,
		dispose() {
			i.dispose(), n.disconnect(), o && typeof window < "u" && delete window.__commander;
		}
	};
}
function il(e) {
	let [t, r] = o(null);
	return n(() => {
		if (typeof window > "u") return;
		let t = rl(e);
		return r(t), () => {
			t.dispose();
		};
	}, [
		e.org,
		e.kradleApiUrl,
		e.mock,
		e.gatewayUrl,
		e.kradleToken,
		e.kradleRepo
	]), t === null ? /* @__PURE__ */ l("div", { style: {
		width: "100vw",
		height: "100vh"
	} }) : /* @__PURE__ */ l(lo, {
		store: t.store,
		orders: t.orders,
		views: t.views
	});
}
//#endregion
export { il as CommanderRoot, il as default };
