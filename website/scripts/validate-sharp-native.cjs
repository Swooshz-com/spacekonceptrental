"use strict";

const assert = require("node:assert/strict");
const sharp = require("sharp");

const EXPECTED_SHARP_VERSION = "0.35.3";
const SOURCE_WIDTH = 8;
const SOURCE_HEIGHT = 6;
const OUTPUT_WIDTH = 4;
const OUTPUT_HEIGHT = 3;
const MAX_OUTPUT_BYTES = 64 * 1024;
const OPERATION_TIMEOUT_MS = 5_000;

async function run() {
  assert.equal(
    sharp.versions?.sharp,
    EXPECTED_SHARP_VERSION,
    `Expected sharp ${EXPECTED_SHARP_VERSION}, received ${sharp.versions?.sharp ?? "unknown"}`,
  );

  sharp.cache(false);
  sharp.concurrency(1);

  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error(`Sharp operation exceeded ${OPERATION_TIMEOUT_MS} ms`)),
      OPERATION_TIMEOUT_MS,
    );
  });

  try {
    const operation = sharp({
      create: {
        width: SOURCE_WIDTH,
        height: SOURCE_HEIGHT,
        channels: 4,
        background: { r: 32, g: 96, b: 160, alpha: 1 },
      },
    })
      .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, { fit: "fill" })
      .png()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = await Promise.race([operation, timeoutPromise]);

    assert.equal(info.width, OUTPUT_WIDTH);
    assert.equal(info.height, OUTPUT_HEIGHT);
    assert.equal(info.format, "png");
    assert.equal(info.size, data.length);
    assert.ok(data.length > 8, "Expected a non-empty PNG output");
    assert.ok(
      data.length <= MAX_OUTPUT_BYTES,
      `PNG output exceeded ${MAX_OUTPUT_BYTES} bytes`,
    );
    assert.deepEqual(
      [...data.subarray(0, 8)],
      [137, 80, 78, 71, 13, 10, 26, 10],
      "Expected the PNG file signature",
    );

    process.stdout.write(
      [
        "Sharp native validation: PASS",
        `Version: ${sharp.versions.sharp}`,
        `Operation: synthetic ${SOURCE_WIDTH}x${SOURCE_HEIGHT} RGBA -> ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT} PNG`,
        `Output bytes: ${data.length}`,
      ].join("\n") + "\n",
    );
  } finally {
    clearTimeout(timeout);
    sharp.cache(false);
  }
}

run().catch((error) => {
  process.stderr.write(`Sharp native validation: FAIL\n${error.message}\n`);
  process.exitCode = 1;
});
