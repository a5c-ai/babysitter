"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ServiceTowerFloor, ServiceTowerRoom, ServiceTowerService, ServiceTowerViewData } from "./types";
import styles from "./ServiceTowerView.module.css";

/* ── constants ─────────────────────────────────────────────── */
const ISO_K = 0.55;
const ISO_OX = 980;
const ISO_OY = 500;
const COS = 0.866;
const SIN = 0.5;
const CELL = 200;
const ROOM_GAP = 4;
const FLOOR_W = 4 * CELL + 3 * ROOM_GAP;
const FLOOR_H = 4 * CELL + 3 * ROOM_GAP;
const FLOOR_GAP_Z = 180;
const SLAB_H = 22;
const WALL_H = 78;
const VB = { w: 1960, h: 1200 };

type ZoomLevel = "building" | "floor" | "room" | "desk";

const ROOM_LAYOUTS_BY_COUNT: Record<number, Array<{ x: number; y: number; w: number; h: number }>> = {
  1: [{ x: 0, y: 0, w: 4, h: 4 }],
  2: [
    { x: 0, y: 0, w: 2, h: 4 },
    { x: 2, y: 0, w: 2, h: 4 },
  ],
  3: [
    { x: 0, y: 0, w: 2, h: 2 },
    { x: 2, y: 0, w: 2, h: 2 },
    { x: 0, y: 2, w: 4, h: 2 },
  ],
  4: [
    { x: 0, y: 0, w: 3, h: 2 },
    { x: 3, y: 0, w: 1, h: 2 },
    { x: 0, y: 2, w: 2, h: 2 },
    { x: 2, y: 2, w: 2, h: 2 },
  ],
};

function getRoomLayouts(roomCount: number) {
  return ROOM_LAYOUTS_BY_COUNT[Math.min(roomCount, 4)] ?? ROOM_LAYOUTS_BY_COUNT[4];
}

/* ── isometric projection helpers ──────────────────────────── */
function iso(x: number, y: number, z = 0): readonly [number, number] {
  return [(x - y) * COS * ISO_K + ISO_OX, (x + y) * SIN * ISO_K - z * ISO_K + ISO_OY] as const;
}

function pt(p: readonly [number, number]) {
  return p.join(",");
}

function points(...values: ReadonlyArray<readonly [number, number]>) {
  return values.map((v) => v.join(",")).join(" ");
}

function shade(hex: string, ratio = 0.68, target = "#0a080d") {
  const source = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : "c98a3e";
  const targetHex = target.replace("#", "");
  const sourceRgb = [0, 2, 4].map((i) => Number.parseInt(source.slice(i, i + 2), 16));
  const targetRgb = [0, 2, 4].map((i) => Number.parseInt(targetHex.slice(i, i + 2), 16));
  const mixed = sourceRgb.map((v, i) => Math.round(v * ratio + targetRgb[i] * (1 - ratio)));
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

/* ── iso primitives ────────────────────────────────────────── */
function IsoTile({ x, y, w, h, z, fill, stroke = "rgba(240,230,209,.2)", strokeWidth = 0.7, opacity = 1 }: {
  x: number; y: number; w: number; h: number; z: number;
  fill: string; stroke?: string; strokeWidth?: number; opacity?: number;
}) {
  return (
    <polygon
      points={points(iso(x, y, z), iso(x + w, y, z), iso(x + w, y + h, z), iso(x, y + h, z))}
      fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity}
    />
  );
}

function IsoBox({ x, y, w, h, z, H, top, east, south, stroke = "rgba(240,230,209,.2)", strokeWidth = 0.5, opacity = 1 }: {
  x: number; y: number; w: number; h: number; z: number; H: number;
  top: string; east: string; south: string;
  stroke?: string; strokeWidth?: number; opacity?: number;
}) {
  const f2 = iso(x + w, y, z), f3 = iso(x + w, y + h, z), f4 = iso(x, y + h, z);
  const t1 = iso(x, y, z + H), t2 = iso(x + w, y, z + H), t3 = iso(x + w, y + h, z + H), t4 = iso(x, y + h, z + H);
  return (
    <g opacity={opacity}>
      <polygon points={`${pt(f3)} ${pt(f2)} ${pt(t2)} ${pt(t3)}`} fill={east} stroke={stroke} strokeWidth={strokeWidth} />
      <polygon points={`${pt(f4)} ${pt(f3)} ${pt(t3)} ${pt(t4)}`} fill={south} stroke={stroke} strokeWidth={strokeWidth} />
      <polygon points={`${pt(t1)} ${pt(t2)} ${pt(t3)} ${pt(t4)}`} fill={top} stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  );
}

function IsoWalls({ x, y, w, h, z, H, fill, stroke = "rgba(240,230,209,.2)", strokeWidth = 0.6, opacity = 1 }: {
  x: number; y: number; w: number; h: number; z: number; H: number;
  fill: string; stroke?: string; strokeWidth?: number; opacity?: number;
}) {
  const f2 = iso(x + w, y, z), f3 = iso(x + w, y + h, z), f4 = iso(x, y + h, z);
  const t2 = iso(x + w, y, z + H), t3 = iso(x + w, y + h, z + H), t4 = iso(x, y + h, z + H);
  const southFill = shade(/^#[0-9a-f]{6}$/i.test(fill) ? fill : "#3a3548", 0.85, "#0a080d");
  return (
    <g opacity={opacity}>
      <polygon points={`${pt(f3)} ${pt(f2)} ${pt(t2)} ${pt(t3)}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <polygon points={`${pt(f4)} ${pt(f3)} ${pt(t3)} ${pt(t4)}`} fill={southFill} stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  );
}

/* ── desk geometry ─────────────────────────────────────────── */
interface DeskGrid { cols: number; rows: number; }
function deskGrid(cellW: number, cellH: number): DeskGrid {
  const aspect = cellW / cellH;
  if (aspect > 1.6) return { cols: 4, rows: 1 };
  if (aspect < 0.7) return { cols: 1, rows: 4 };
  return { cols: 2, rows: 2 };
}

function deskSlot(
  cellX: number, cellY: number, cellW: number, cellH: number,
  grid: DeskGrid, svcIdx: number,
) {
  const padX = 10, padY = 16, gap = 6;
  const sw = (cellW - padX * 2 - gap * (grid.cols - 1)) / grid.cols;
  const sh = (cellH - padY * 2 - gap * (grid.rows - 1)) / grid.rows;
  const rIdx = Math.floor(svcIdx / grid.cols), cIdx = svcIdx % grid.cols;
  const sx = cellX + padX + cIdx * (sw + gap);
  const sy = cellY + padY + rIdx * (sh + gap);
  return { sx, sy, sw, sh };
}

/* ── ServiceDesk: individual desk within a room ────────────── */
function ServiceDesk({ service, svcIdx, x, y, w, h, z, color, lit, focused, onClick }: {
  service: ServiceTowerService; svcIdx: number;
  x: number; y: number; w: number; h: number; z: number;
  color: string; lit: boolean; focused: boolean;
  onClick: (svcIdx: number) => void;
}) {
  const dW = w * 0.62, dH = 12;
  const dx = x + (w - dW) / 2, dy = y + h * 0.42;
  const topC = focused ? color : (lit ? shade(color, 0.45) : "#1f1a2a");
  const eastC = focused ? shade(color, 0.7, "#000") : (lit ? shade(color, 0.4) : "#15121f");
  const southC = focused ? shade(color, 0.85, "#000") : (lit ? shade(color, 0.6) : "#1a1622");
  const strokeC = focused ? "#F0E6D1" : (lit ? color : shade(color, 0.5, "#3a3548"));
  const chairC = iso(x + w / 2, dy - 6, z);
  const chairColor = focused ? "#F0E6D1" : (lit ? color : shade(color, 0.6, "#3a3548"));
  const labP = iso(x + w / 2, dy + dH / 2, z + 20);

  return (
    <g style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onClick(svcIdx); }}>
      {/* cell highlight */}
      <IsoTile x={x + 4} y={y + 4} w={w - 8} h={h - 8} z={z}
        fill={focused ? shade(color, 0.18, "#0c0a12") : "transparent"}
        stroke={focused ? color : "transparent"} strokeWidth={focused ? 0.6 : 0} />
      {/* desk surface */}
      <IsoBox x={dx} y={dy} w={dW} h={dH} z={z} H={5}
        top={topC} east={eastC} south={southC} stroke={strokeC} strokeWidth={focused ? 0.7 : 0.4} />
      {/* monitor on desk */}
      {(() => {
        const mY = dy + 1.5, mH = 3.5;
        const a = iso(dx + 4, mY, z + 5), b = iso(dx + dW - 4, mY, z + 5);
        const c = iso(dx + dW - 4, mY + mH, z + 5), d = iso(dx + 4, mY + mH, z + 5);
        return <polygon points={`${pt(a)} ${pt(b)} ${pt(c)} ${pt(d)}`} fill={focused ? "#F0E6D1" : color} opacity={lit ? 0.95 : 0.6} />;
      })()}
      {/* chair */}
      <circle cx={chairC[0]} cy={chairC[1]} r={focused ? 3.2 : 2.6} fill="#1a1622" stroke={chairColor} strokeWidth={focused ? 0.7 : 0.4} />
      {/* person */}
      <IsoBox x={x + w / 2 - 2.5} y={dy - 4} w={5} h={4.5} z={z} H={focused ? 11 : 8}
        top={chairColor} east={shade(color, 0.45)} south={shade(color, 0.7)} stroke={chairColor} strokeWidth={0.3} />
      {/* potted plants / side items */}
      {([-1, 1] as const).map((side) => (
        <IsoBox key={side} x={x + w / 2 + side * (dW * 0.36) - 2} y={dy + dH + 4} w={5} h={4.5} z={z} H={lit ? 8.5 : 7}
          top={lit ? color : "#5a5468"} east={shade(color, 0.45, "#15121f")} south={shade(color, 0.7, "#1a1622")} stroke={lit ? color : "#3a3548"} strokeWidth={0.3} />
      ))}
      {/* label (visible when lit or focused) */}
      {(lit || focused) && (
        <g pointerEvents="none">
          <rect x={labP[0] - 50} y={labP[1] - 12} width="100" height="17" fill="#0a080d" opacity={focused ? 0.96 : 0.85}
            stroke={focused ? "#F0E6D1" : color} strokeWidth={focused ? 0.9 : 0.5} />
          <text x={labP[0] - 45} y={labP[1]} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="9" letterSpacing="0.8" fill={focused ? "#F0E6D1" : color}>{service.code}</text>
          <text x={labP[0] + 46} y={labP[1]} textAnchor="end" fontFamily="Georgia, serif" fontSize="11" fill="#E8DCC0">{service.name}</text>
        </g>
      )}
    </g>
  );
}

/* ── camera transforms ─────────────────────────────────────── */
interface CamTransform { tx: number; ty: number; sx: number; sy: number; }
const IDENTITY_CAM: CamTransform = { tx: 0, ty: 0, sx: 1, sy: 1 };

function computeCamera(
  zoom: ZoomLevel,
  focusFloorIdx: number | null,
  activeRoomIdx: number | null,
  focusedSvcIdx: number | null,
  roomCount = 4,
): CamTransform {
  const layouts = getRoomLayouts(roomCount);
  if (zoom === "floor" && focusFloorIdx != null) {
    const z = focusFloorIdx * FLOOR_GAP_Z;
    const c = iso(FLOOR_W / 2, FLOOR_H / 2, z + 30);
    const sx = 1.55, sy = 1.15;
    return { tx: VB.w / 2 - c[0] * sx, ty: VB.h / 2 - c[1] * sy, sx, sy };
  }
  if ((zoom === "room" || zoom === "desk") && focusFloorIdx != null && activeRoomIdx != null) {
    const layout = layouts[activeRoomIdx] ?? layouts[0];
    const z = focusFloorIdx * FLOOR_GAP_Z;
    const rx = layout.x * (CELL + ROOM_GAP) + (layout.w * CELL + (layout.w - 1) * ROOM_GAP) / 2;
    const ry = layout.y * (CELL + ROOM_GAP) + (layout.h * CELL + (layout.h - 1) * ROOM_GAP) / 2;

    if (zoom === "desk" && focusedSvcIdx != null) {
      const cellX = layout.x * (CELL + ROOM_GAP);
      const cellY = layout.y * (CELL + ROOM_GAP);
      const cellW = layout.w * CELL + (layout.w - 1) * ROOM_GAP;
      const cellH = layout.h * CELL + (layout.h - 1) * ROOM_GAP;
      const grid = deskGrid(cellW, cellH);
      const slot = deskSlot(cellX, cellY, cellW, cellH, grid, focusedSvcIdx);
      const cx = slot.sx + slot.sw / 2, cy = slot.sy + slot.sh / 2;
      const c = iso(cx, cy, z + 12);
      const SX = 4.2, SY = 3.2;
      return { tx: VB.w / 2 - c[0] * SX, ty: VB.h / 2 - c[1] * SY, sx: SX, sy: SY };
    }

    const c = iso(rx, ry, z + 20);
    const sx = 2.4, sy = 1.85;
    return { tx: VB.w / 2 - c[0] * sx, ty: VB.h / 2 - c[1] * sy, sx, sy };
  }
  return IDENTITY_CAM;
}

/* ── RoomShape ─────────────────────────────────────────────── */
function RoomShape({ room, roomIndex, roomCount, floorIndex, zoom, activeRoomIndex, focusedSvcIdx, onSelect, onPickService }: {
  room: ServiceTowerRoom;
  roomIndex: number;
  roomCount: number;
  floorIndex: number;
  zoom: ZoomLevel;
  activeRoomIndex: number | null;
  focusedSvcIdx: number | null;
  onSelect: () => void;
  onPickService: (roomIndex: number, svcIdx: number) => void;
}) {
  const layouts = getRoomLayouts(roomCount);
  const layout = layouts[roomIndex] ?? layouts[0];
  const cellX = layout.x * (CELL + ROOM_GAP);
  const cellY = layout.y * (CELL + ROOM_GAP);
  const cellW = layout.w * CELL + (layout.w - 1) * ROOM_GAP;
  const cellH = layout.h * CELL + (layout.h - 1) * ROOM_GAP;
  const z = floorIndex * FLOOR_GAP_Z;
  const selected = activeRoomIndex === roomIndex;
  const isRoomOrDeskZoom = zoom === "room" || zoom === "desk";
  const dimmed = isRoomOrDeskZoom && activeRoomIndex != null && !selected;
  const showDesks = isRoomOrDeskZoom && selected;
  const label = iso(cellX + cellW / 2, cellY + cellH / 2, z + WALL_H + 26);

  // Room slide-away: push non-focused rooms outward from the focused room
  let cellTranslate = "";
  let cellOpacity = 1;
  if (isRoomOrDeskZoom && activeRoomIndex != null && !selected) {
    const focusedLayout = layouts[activeRoomIndex] ?? layouts[0];
    const focusedCx = focusedLayout.x * (CELL + ROOM_GAP) + (focusedLayout.w * CELL) / 2;
    const focusedCy = focusedLayout.y * (CELL + ROOM_GAP) + (focusedLayout.h * CELL) / 2;
    const myCx = cellX + cellW / 2, myCy = cellY + cellH / 2;
    const dx = myCx - focusedCx, dy = myCy - focusedCy;
    const len = Math.hypot(dx, dy) || 1;
    const PUSH = 600;
    const pushed = iso(myCx + dx / len * PUSH * 0.7, myCy + dy / len * PUSH * 0.7, z);
    const current = iso(myCx, myCy, z);
    cellTranslate = `translate(${pushed[0] - current[0]}, ${pushed[1] - current[1]})`;
    cellOpacity = 0;
  }

  const fullLit = selected;
  const floorColor = room.color;
  const floorFill = fullLit ? shade(floorColor, 0.30, "#0c0a12") : shade(floorColor, 0.10, "#0e0c14");
  const floorStroke = fullLit ? floorColor : shade(floorColor, 0.55, "#5a5468");
  const wallFill = fullLit ? shade(floorColor, 0.62, "#0c0a12") : shade(floorColor, 0.28, "#15121f");
  const wallStroke = fullLit ? floorColor : shade(floorColor, 0.55, "#3a3548");

  const grid = deskGrid(cellW, cellH);
  const serviceCount = Math.min(room.services.length, grid.cols * grid.rows);

  return (
    <g
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={{
        cursor: "pointer",
        transition: "opacity 500ms ease, transform 720ms cubic-bezier(.7,.05,.25,1)",
      }}
      opacity={cellOpacity}
      transform={cellTranslate}
      pointerEvents={cellOpacity === 0 ? "none" : "auto"}
    >
      {/* glow when focused */}
      {fullLit && (
        <g filter="url(#zone-glow)" opacity="0.65">
          <IsoTile x={cellX - 4} y={cellY - 4} w={cellW + 8} h={cellH + 8} z={z}
            fill={floorColor} stroke={floorColor} strokeWidth={2} opacity={0.45} />
        </g>
      )}

      {/* floor tile */}
      <IsoTile x={cellX} y={cellY} w={cellW} h={cellH} z={z} fill={floorFill} stroke={floorStroke} strokeWidth={fullLit ? 1 : 0.6} />

      {/* desks (visible at room/desk zoom when this room is active) */}
      {showDesks && Array.from({ length: serviceCount }).map((_, i) => {
        const slot = deskSlot(cellX, cellY, cellW, cellH, grid, i);
        const isSvcFocus = focusedSvcIdx === i;
        // Desk slide-away at desk zoom
        let dT = "", dO = 1;
        if (zoom === "desk" && focusedSvcIdx != null && !isSvcFocus) {
          const fSlot = deskSlot(cellX, cellY, cellW, cellH, grid, focusedSvcIdx);
          const fx = fSlot.sx + fSlot.sw / 2, fy = fSlot.sy + fSlot.sh / 2;
          const ddx = (slot.sx + slot.sw / 2) - fx, ddy = (slot.sy + slot.sh / 2) - fy;
          const len = Math.hypot(ddx, ddy) || 1;
          const PUSH = 250;
          const a = iso(slot.sx + slot.sw / 2 + ddx / len * PUSH, slot.sy + slot.sh / 2 + ddy / len * PUSH, z);
          const b = iso(slot.sx + slot.sw / 2, slot.sy + slot.sh / 2, z);
          dT = `translate(${a[0] - b[0]}, ${a[1] - b[1]})`;
          dO = 0;
        }
        return (
          <g key={i} opacity={dO} transform={dT}
            style={{ transition: "opacity 420ms ease, transform 640ms cubic-bezier(.7,.05,.25,1)" }}
            pointerEvents={dO === 0 ? "none" : "auto"}>
            <ServiceDesk
              service={room.services[i]} svcIdx={i}
              x={slot.sx} y={slot.sy} w={slot.sw} h={slot.sh} z={z}
              color={floorColor} lit focused={isSvcFocus}
              onClick={(idx) => onPickService(roomIndex, idx)}
            />
          </g>
        );
      })}

      {/* preview desk shapes (building view — faint furniture hints) */}
      {!showDesks && Array.from({ length: serviceCount }).map((_, i) => {
        const padX = 14, padY = 20, gap = 8;
        const cols = grid.cols, rows = grid.rows;
        const sw2 = (cellW - padX * 2 - gap * (cols - 1)) / cols;
        const sh2 = (cellH - padY * 2 - gap * (rows - 1)) / rows;
        const r = Math.floor(i / cols), c = i % cols;
        const sx2 = cellX + padX + c * (sw2 + gap), sy2 = cellY + padY + r * (sh2 + gap);
        const dW = sw2 * 0.62, dH2 = 8;
        const dx2 = sx2 + (sw2 - dW) / 2, dy2 = sy2 + sh2 * 0.42;
        return (
          <IsoBox key={i} x={dx2} y={dy2} w={dW} h={dH2} z={z} H={4}
            top={shade(floorColor, 0.35, "#15121f")}
            east={shade(floorColor, 0.25, "#0e0c14")}
            south={shade(floorColor, 0.30, "#0e0c14")}
            stroke={shade(floorColor, 0.5, "#3a3548")} strokeWidth={0.3} opacity={0.75}
          />
        );
      })}

      {/* walls */}
      <IsoWalls x={cellX} y={cellY} w={cellW} h={cellH} z={z} H={WALL_H} fill={wallFill} stroke={wallStroke} strokeWidth={fullLit ? 0.9 : 0.6} />

      {/* wall top edge */}
      {(() => {
        const t1 = iso(cellX, cellY, z + WALL_H), t2 = iso(cellX + cellW, cellY, z + WALL_H);
        const t3 = iso(cellX + cellW, cellY + cellH, z + WALL_H), t4 = iso(cellX, cellY + cellH, z + WALL_H);
        return <polyline points={`${pt(t1)} ${pt(t2)} ${pt(t3)} ${pt(t4)} ${pt(t1)}`} fill="none"
          stroke={fullLit ? floorColor : shade(floorColor, 0.7, "#5a5468")} strokeWidth={fullLit ? 1.2 : 0.7} strokeOpacity="0.95" />;
      })()}

      {/* room label */}
      <g pointerEvents="none">
        <rect x={label[0] - 90} y={label[1] - 22} width="180" height="30" fill="#0a080d"
          opacity={fullLit ? 0.96 : 0.92}
          stroke={fullLit ? floorColor : shade(floorColor, 0.7, "#5a5468")}
          strokeWidth={fullLit ? 1.1 : 0.7} />
        <text x={label[0]} y={label[1] - 6} textAnchor="middle" fontFamily="Georgia, serif" fontSize="16" fontWeight="500"
          fill={fullLit ? "#F0E6D1" : "#E8DCC0"}>{room.label.slice(0, 24)}</text>
        <text x={label[0]} y={label[1] + 6} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="1.4"
          fill={fullLit ? floorColor : shade(floorColor, 0.85, "#8c7e65")}>{room.metricValue} {room.metricLabel}</text>
      </g>
    </g>
  );
}

/* ── FloorShape ────────────────────────────────────────────── */
function FloorShape({ floor, floorIndex, zoom, activeFloorIndex, activeRoomIndex, focusedSvcIdx, onFloorSelect, onRoomSelect, onPickService }: {
  floor: ServiceTowerFloor;
  floorIndex: number;
  zoom: ZoomLevel;
  activeFloorIndex: number | null;
  activeRoomIndex: number | null;
  focusedSvcIdx: number | null;
  onFloorSelect: () => void;
  onRoomSelect: (roomIndex: number) => void;
  onPickService: (roomIndex: number, svcIdx: number) => void;
}) {
  const z = floorIndex * FLOOR_GAP_Z;
  const focusedFloor = activeFloorIndex === floorIndex;
  const isZoomedIn = zoom !== "building";
  const isOtherFloor = isZoomedIn && activeFloorIndex != null && !focusedFloor;

  // Floor slide-away: other floors slide up/down and fade when zoomed in
  const slideY = isOtherFloor ? (floorIndex > (activeFloorIndex ?? 0) ? -900 : 900) : 0;
  const floorGroupOpacity = isOtherFloor ? 0 : 1;

  // Slab points
  const sP1 = iso(0, 0, z), sP2 = iso(FLOOR_W, 0, z), sP3 = iso(FLOOR_W, FLOOR_H, z), sP4 = iso(0, FLOOR_H, z);
  const sB2 = iso(FLOOR_W, 0, z - SLAB_H), sB3 = iso(FLOOR_W, FLOOR_H, z - SLAB_H), sB4 = iso(0, FLOOR_H, z - SLAB_H);

  const floorLit = focusedFloor || !isZoomedIn;
  const label = iso(-14, FLOOR_H / 2, z + 8);

  return (
    <g
      opacity={floorGroupOpacity}
      transform={`translate(0, ${slideY})`}
      style={{ transition: "opacity 600ms ease, transform 720ms cubic-bezier(.7,.05,.25,1)" }}
      pointerEvents={isOtherFloor ? "none" : "auto"}
    >
      {/* slab sides */}
      <polygon points={`${pt(sP3)} ${pt(sP2)} ${pt(sB2)} ${pt(sB3)}`}
        fill={floorLit ? shade("#3E2A1A", 0.7) : "#1a1420"} stroke="#3E2A1A" strokeWidth="0.8" />
      <polygon points={`${pt(sP4)} ${pt(sP3)} ${pt(sB3)} ${pt(sB4)}`}
        fill={floorLit ? shade("#5a3a1f", 0.55) : "#221a2c"} stroke="#3E2A1A" strokeWidth="0.8" />
      {/* slab top */}
      <polygon points={`${pt(sP1)} ${pt(sP2)} ${pt(sP3)} ${pt(sP4)}`}
        fill={floorLit ? "#1a1420" : "#0e0c14"} opacity={floorLit ? 0.30 : 0.55}
        style={{ cursor: "pointer" }}
        onClick={(e) => { e.stopPropagation(); onFloorSelect(); }} />

      {/* floor label */}
      <g pointerEvents="none">
        <rect x={label[0] - 140} y={label[1] - 15} width="130" height="30" fill="#0a080d" opacity="0.92"
          stroke={floorLit ? "#F2C88F" : "#5e5546"} strokeWidth="0.7" />
        <text x={label[0] - 131} y={label[1] - 2} fontFamily="ui-monospace, monospace" fontSize="10" letterSpacing="2" fill="#8c7e65">
          FLOOR {"·"} {["G", "I", "II", "III", "IV", "V", "VI", "VII"][floorIndex] ?? `${floorIndex}`}
        </text>
        <text x={label[0] - 131} y={label[1] + 12} fontFamily="Georgia, serif" fontSize="14" fontWeight="500"
          fill={floorLit ? "#F0E6D1" : "#a89980"}>{floor.label}</text>
      </g>

      {/* rooms */}
      {floor.rooms.map((room, roomIndex) => (
        <RoomShape
          key={room.id}
          room={room}
          roomIndex={roomIndex}
          roomCount={floor.rooms.length}
          floorIndex={floorIndex}
          zoom={focusedFloor ? zoom : "building"}
          activeRoomIndex={focusedFloor ? activeRoomIndex : null}
          focusedSvcIdx={focusedFloor ? focusedSvcIdx : null}
          onSelect={() => onRoomSelect(roomIndex)}
          onPickService={onPickService}
        />
      ))}
    </g>
  );
}

/* ── Drawer ─────────────────────────────────────────────────── */
function Drawer({ data, activeFloorIndex, activeRoomIndex, focusedSvcIdx, onFloorSelect, onRoomSelect }: {
  data: ServiceTowerViewData;
  activeFloorIndex: number | null;
  activeRoomIndex: number | null;
  focusedSvcIdx: number | null;
  onFloorSelect: (floorIndex: number | null) => void;
  onRoomSelect: (roomIndex: number) => void;
}) {
  const floor = activeFloorIndex == null ? null : data.floors[activeFloorIndex];
  const room = activeFloorIndex != null && activeRoomIndex != null
    ? data.floors[activeFloorIndex]?.rooms[activeRoomIndex] ?? null
    : null;

  // Desk-level: show single service expanded
  if (room && focusedSvcIdx != null) {
    const service = room.services[focusedSvcIdx];
    if (service) {
      return (
        <aside className={styles.drawer}>
          <div className={styles.drawerInner}>
            <div>
              <div className={styles.drawerEyebrow}><span className={styles.seal} style={{ background: room.color }} />{room.eyebrow} {"·"} DESK</div>
              <h3 className={styles.drawerName}>{service.name}</h3>
              <div className={styles.drawerId}>{service.code} {"·"} {room.label}</div>
            </div>
            <p className={styles.drawerBlurb}>{service.summary}</p>
            <section>
              <h4 className={styles.sectionTitle}>KPIs</h4>
              <ul className={styles.kpis}>{service.kpis.map((kpi) => <li key={kpi}>{kpi}</li>)}</ul>
            </section>
            {service.refs.length > 0 && (
              <section>
                <h4 className={styles.sectionTitle}>References</h4>
                <ul className={styles.recordList}>
                  {service.refs.map((ref) => (
                    <li key={ref.id} className={styles.recordCard}>
                      <Link href={ref.href}>{ref.label}</Link>
                      <span className={styles.recordKind}>{ref.kind}</span>
                      <p>{ref.summary}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </aside>
      );
    }
  }

  // Room-level drawer
  if (room) {
    return (
      <aside className={styles.drawer}>
        <div className={styles.drawerInner}>
          <div>
            <div className={styles.drawerEyebrow}><span className={styles.seal} style={{ background: room.color }} />{room.eyebrow}</div>
            <h3 className={styles.drawerName}>{room.label}</h3>
            <div className={styles.drawerId}>{room.id} {"·"} {room.metricValue} {room.metricLabel}</div>
          </div>
          <p className={styles.drawerBlurb}>{room.summary}</p>
          <section>
            <h4 className={styles.sectionTitle}>Service lines</h4>
            <ul className={styles.serviceList}>
              {room.services.map((service) => (
                <li key={service.code} className={styles.serviceCard}>
                  <div className={styles.serviceCode}>{service.code}</div>
                  <strong>{service.name}</strong>
                  <p>{service.summary}</p>
                  <ul className={styles.kpis}>{service.kpis.map((kpi) => <li key={kpi}>{kpi}</li>)}</ul>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h4 className={styles.sectionTitle}>Graph records</h4>
            <ul className={styles.recordList}>
              {room.records.map((record) => (
                <li key={record.id} className={styles.recordCard}>
                  <Link href={record.href}>{record.label}</Link>
                  <span className={styles.recordKind}>{record.kind}</span>
                  <p>{record.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    );
  }

  // Floor-level drawer
  if (floor) {
    return (
      <aside className={styles.drawer}>
        <div className={styles.drawerInner}>
          <div>
            <div className={styles.drawerEyebrow}><span className={styles.seal} />Service floor</div>
            <h3 className={styles.drawerName}>{floor.label}</h3>
            <div className={styles.drawerId}>{floor.id} {"·"} {floor.rooms.length} rooms</div>
          </div>
          <p className={styles.drawerBlurb}>{floor.subtitle}</p>
          <section>
            <h4 className={styles.sectionTitle}>Rooms</h4>
            <ul className={styles.roomList}>
              {floor.rooms.map((room, roomIndex) => (
                <li key={room.id} className={styles.roomCard}>
                  <button type="button" onClick={() => onRoomSelect(roomIndex)}>
                    <span className={styles.cardTitle}>{room.label}</span>
                    <span className={styles.recordKind}> {"·"} {room.kind} {"·"} {room.metricValue} records</span>
                  </button>
                  <p className={styles.cardText}>{room.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    );
  }

  // Building-level drawer (empty state)
  return (
    <aside className={styles.drawer}>
      <div className={styles.drawerInner}>
        <div>
          <div className={styles.drawerEyebrow}><span className={styles.seal} />A5C service catalog</div>
          <h3 className={styles.drawerName}>Walk the building.</h3>
          <div className={styles.drawerId}>cursor: idle {"·"} awaiting selection</div>
        </div>
        <p className={styles.drawerBlurb}>Click a floor to step inside. Click a room to enter. Click a desk to focus a service line. Escape steps back. Scroll to zoom.</p>
        <section>
          <h4 className={styles.sectionTitle}>Floors</h4>
          <ul className={styles.roomList}>
            {data.floors.map((floor, floorIndex) => (
              <li key={floor.id} className={styles.roomCard}>
                <button type="button" onClick={() => onFloorSelect(floorIndex)}>
                  <span className={styles.cardTitle}>{floor.label}</span>
                  <span className={styles.recordKind}> {"·"} {floor.rooms.length} rooms</span>
                </button>
                <p className={styles.cardText}>{floor.subtitle}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}

/* ── Main component ────────────────────────────────────────── */
export function ServiceTowerView({ data }: { data: ServiceTowerViewData }) {
  const [zoom, setZoom] = useState<ZoomLevel>("building");
  const [activeFloorIndex, setActiveFloorIndex] = useState<number | null>(null);
  const [activeRoomIndex, setActiveRoomIndex] = useState<number | null>(null);
  const [focusedSvcIdx, setFocusedSvcIdx] = useState<number | null>(null);
  const wheelLockRef = useRef(0);

  const activeFloorRoomCount = activeFloorIndex != null ? data.floors[activeFloorIndex]?.rooms.length ?? 4 : 4;
  const camera = useMemo(
    () => computeCamera(zoom, activeFloorIndex, activeRoomIndex, focusedSvcIdx, activeFloorRoomCount),
    [zoom, activeFloorIndex, activeRoomIndex, focusedSvcIdx, activeFloorRoomCount],
  );

  const room = activeFloorIndex != null && activeRoomIndex != null
    ? data.floors[activeFloorIndex]?.rooms[activeRoomIndex] ?? null
    : null;

  /* ── navigation handlers ──────────────────────────────────── */
  const selectFloor = useCallback((floorIndex: number | null) => {
    if (floorIndex == null) {
      setZoom("building");
      setActiveFloorIndex(null);
      setActiveRoomIndex(null);
      setFocusedSvcIdx(null);
    } else if (zoom === "building") {
      setActiveFloorIndex(floorIndex);
      setActiveRoomIndex(null);
      setFocusedSvcIdx(null);
      setZoom("floor");
    }
  }, [zoom]);

  const selectRoom = useCallback((roomIndex: number) => {
    setActiveRoomIndex(roomIndex);
    setFocusedSvcIdx(null);
    setZoom("room");
  }, []);

  const pickService = useCallback((roomIndex: number, svcIdx: number) => {
    setActiveRoomIndex(roomIndex);
    setFocusedSvcIdx(svcIdx);
    setZoom("desk");
  }, []);

  const stepBack = useCallback(() => {
    if (zoom === "desk") { setFocusedSvcIdx(null); setZoom("room"); }
    else if (zoom === "room") { setActiveRoomIndex(null); setZoom("floor"); }
    else if (zoom === "floor") { setActiveFloorIndex(null); setActiveRoomIndex(null); setZoom("building"); }
  }, [zoom]);

  /* ── keyboard: Escape steps back ──────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") stepBack(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepBack]);

  /* ── scroll-wheel zoom ────────────────────────────────────── */
  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    const now = Date.now();
    if (now - wheelLockRef.current < 380) return;
    if (Math.abs(e.deltaY) < 4) return;
    wheelLockRef.current = now;

    if (e.deltaY > 0) {
      // scroll down = zoom out
      if (zoom !== "building") stepBack();
    } else {
      // scroll up = zoom in
      if (zoom === "building") {
        const target = activeFloorIndex ?? Math.min(2, data.floors.length - 1);
        selectFloor(target);
      } else if (zoom === "floor" && activeFloorIndex != null) {
        const floor = data.floors[activeFloorIndex];
        if (floor && floor.rooms.length > 0) {
          selectRoom(activeRoomIndex ?? 0);
        }
      } else if (zoom === "room" && activeRoomIndex != null) {
        pickService(activeRoomIndex, focusedSvcIdx ?? 0);
      }
    }
  }, [zoom, activeFloorIndex, activeRoomIndex, focusedSvcIdx, stepBack, selectFloor, selectRoom, pickService, data.floors]);

  /* ── breadcrumbs ──────────────────────────────────────────── */
  const crumbs: Array<{ label: string; onClick: () => void }> = [
    { label: "Building", onClick: () => { setZoom("building"); setActiveFloorIndex(null); setActiveRoomIndex(null); setFocusedSvcIdx(null); } },
  ];
  if (activeFloorIndex != null) {
    crumbs.push({
      label: data.floors[activeFloorIndex]?.label ?? `Floor ${activeFloorIndex}`,
      onClick: () => { setZoom("floor"); setActiveRoomIndex(null); setFocusedSvcIdx(null); },
    });
  }
  if (room) {
    crumbs.push({
      label: room.label,
      onClick: () => { setZoom("room"); setFocusedSvcIdx(null); },
    });
  }
  if (focusedSvcIdx != null && room) {
    const s = room.services[focusedSvcIdx];
    if (s) crumbs.push({ label: `${s.code} · ${s.name}`, onClick: () => {} });
  }

  /* ── footer stats ─────────────────────────────────────────── */
  const computedStats = useMemo(() => {
    const floorCount = data.floors.length;
    const roomCount = data.floors.reduce((a, f) => a + f.rooms.length, 0);
    const recordCount = data.floors.reduce((a, f) => a + f.rooms.reduce((b, r) => b + r.records.length, 0), 0);
    const svcCount = data.floors.reduce((a, f) => a + f.rooms.reduce((b, r) => b + r.services.length, 0), 0);
    return [
      ...data.stats,
      ...(data.stats.length === 0 ? [
        { label: "FLOORS", value: floorCount },
        { label: "ROOMS", value: roomCount },
        { label: "RECORDS", value: recordCount },
        { label: "SERVICE LINES", value: svcCount },
      ] : []),
    ];
  }, [data.stats, data.floors]);

  /* ── camera CSS ───────────────────────────────────────────── */
  const camStyle: React.CSSProperties = {
    transform: `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.sx}, ${camera.sy})`,
    transformOrigin: "0 0",
    transition: "transform 720ms cubic-bezier(.7,.05,.25,1)",
  };

  return (
    <section className={styles.tower} id={data.id}>
      <div className={styles.layout}>
        <div className={styles.stage} id="tower-stage">
          {/* breadcrumb + domain legend */}
          <div className={styles.stageBar}>
            <div className={styles.crumbs}>
              {crumbs.map((c, i) => (
                <span key={i}>
                  {i > 0 && <span>{"›"} </span>}
                  <button type="button" className={i === crumbs.length - 1 ? styles.active : undefined} onClick={c.onClick}>{c.label}</button>
                </span>
              ))}
            </div>
            <div className={styles.domainLegend}>
              {data.domains.map((domain) => (
                <span key={domain.id}><i className={styles.swatch} style={{ background: domain.color, borderColor: domain.color }} />{domain.label}</span>
              ))}
            </div>
          </div>

          {/* SVG stage */}
          <div className={styles.svgWrap}>
            <svg
              className={styles.svg}
              viewBox={`0 0 ${VB.w} ${VB.h}`}
              role="img"
              aria-label={`${data.title} service tower`}
              onWheel={onWheel}
            >
              <defs>
                <linearGradient id={`${data.id}-sky`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#1b1724" />
                  <stop offset="1" stopColor="#0b0a0f" />
                </linearGradient>
                <filter id="zone-glow" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="9" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <pattern id="slab-grain" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse"
                  patternTransform="matrix(0.866 0.5 -0.866 0.5 0 0)">
                  <rect width="8" height="8" fill="#0e0c14" />
                  <line x1="0" y1="0" x2="8" y2="0" stroke="#1a1622" strokeWidth="0.3" />
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#1a1622" strokeWidth="0.3" />
                </pattern>
              </defs>
              <rect width={VB.w} height={VB.h} fill={`url(#${data.id}-sky)`} />

              <g style={camStyle}>
                {/* ground shadow */}
                <ellipse cx={ISO_OX} cy={iso(FLOOR_W / 2, FLOOR_H / 2, 0)[1] + 26} rx="540" ry="42" fill="#000" opacity="0.55" />

                {/* vertical columns through all floors */}
                {([[0, 0], [FLOOR_W, 0], [FLOOR_W, FLOOR_H], [0, FLOOR_H]] as const).map(([cx, cy], i) => {
                  const topZ = (data.floors.length - 1) * FLOOR_GAP_Z + WALL_H + 30;
                  const a = iso(cx, cy, -SLAB_H), b = iso(cx, cy, topZ);
                  return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#3E2A1A" strokeWidth="1.2" opacity="0.55" />;
                })}

                {/* floors (bottom to top, rendered back to front) */}
                {data.floors.map((floor, index) => (
                  <FloorShape
                    key={floor.id}
                    floor={floor}
                    floorIndex={index}
                    zoom={zoom}
                    activeFloorIndex={activeFloorIndex}
                    activeRoomIndex={activeRoomIndex}
                    focusedSvcIdx={focusedSvcIdx}
                    onFloorSelect={() => selectFloor(index)}
                    onRoomSelect={(roomIndex) => { setActiveFloorIndex(index); selectRoom(roomIndex); }}
                    onPickService={(roomIndex, svcIdx) => { setActiveFloorIndex(index); pickService(roomIndex, svcIdx); }}
                  />
                ))}
              </g>
            </svg>
          </div>

          {/* footer stats */}
          <footer className={styles.footer}>
            <div className={styles.stats}>
              {computedStats.map((stat) => (
                <span key={stat.label}><b className={styles.statValue}>{stat.value}</b><span className={styles.statLabel}>{stat.label}</span></span>
              ))}
            </div>
            <span>esc {"·"} step back {" · "} scroll {"·"} zoom</span>
          </footer>
        </div>

        <Drawer
          data={data}
          activeFloorIndex={activeFloorIndex}
          activeRoomIndex={activeRoomIndex}
          focusedSvcIdx={focusedSvcIdx}
          onFloorSelect={selectFloor}
          onRoomSelect={selectRoom}
        />
      </div>
    </section>
  );
}
