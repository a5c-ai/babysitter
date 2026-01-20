"use strict";

const { openDb, initDb } = require("../api/db");
const { claimJobs, completeJob, failJob, processJob } = require("./queue");
const extensions = require("../extensions");

const POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_MS || "2000", 10);
const BATCH_SIZE = parseInt(process.env.WORKER_BATCH_SIZE || "10", 10);

async function runOnce() {
  const db = openDb();
  try {
    await initDb(db);
    if (process.env.TELEGRAM_DEBUG === "1") {
      // eslint-disable-next-line no-console
      console.log("[worker] tick");
    }
    const jobs = await claimJobs(db, BATCH_SIZE);
    for (const job of jobs) {
      try {
        await processJob(db, job);
        await completeJob(db, job.id);
      } catch (err) {
        await failJob(db, job.id, err);
      }
    }
    await extensions.poll(db);
  } finally {
    db.close();
  }
}

async function loop() {
  // eslint-disable-next-line no-console
  console.log(`Worker running. Poll every ${POLL_INTERVAL_MS}ms.`);
  if (process.env.TELEGRAM_DEBUG === "1") {
    // eslint-disable-next-line no-console
    console.log("[telegram] debug enabled");
  }

  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 10;

  while (true) {
    try {
      await runOnce();
      consecutiveErrors = 0;
    } catch (err) {
      consecutiveErrors++;
      // eslint-disable-next-line no-console
      console.error(`[worker] error in runOnce (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, err.message);

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        // eslint-disable-next-line no-console
        console.error(`[worker] too many consecutive errors, exiting`);
        process.exitCode = 1;
        break;
      }

      const backoffDelay = Math.min(1000 * Math.pow(2, consecutiveErrors - 1), 30000);
      // eslint-disable-next-line no-console
      console.log(`[worker] backing off for ${backoffDelay}ms before retry`);
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

loop();
