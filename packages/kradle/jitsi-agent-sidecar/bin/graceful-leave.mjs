#!/usr/bin/env node
import net from 'node:net';
import { loadConfig } from '../src/config.js';

const config = loadConfig();
const socket = net.createConnection(config.socketPath);
const timer = setTimeout(() => process.exit(0), 1500);

socket.on('connect', () => {
  socket.end(`${JSON.stringify({ action: 'disconnect', reason: 'preStop' })}\n`);
});
socket.on('close', () => {
  clearTimeout(timer);
  process.exit(0);
});
socket.on('error', () => {
  clearTimeout(timer);
  process.exit(0);
});
