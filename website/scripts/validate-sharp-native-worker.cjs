"use strict";

const assert = require("node:assert/strict");
const sharp = require("sharp");

const EXPECTED_SHARP_VERSION = "0.35.3";
const SOURCE_WIDTH = 8;
const SOURCE_HEIGHT = 6;
const OUTPUT_WIDTH = 4;
const OUTPUT_HEIGHT = 3;
const MAX_OUTPUT_BYTES = 64 * 1024;

async function run() {
  assert.equal(
    sharp.versions?.sharp,
    EXPECTED_SHARP_VERSION,
    `Expected sharp ${EXPECTED_SHARP_VERSION}`,
  );
  sharp.cache(false);
  sharp.concurrency(1);

  try {
    const { data, info } = await sharp({
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
      `${JSON.stringify({
        version: sharp.versions.sharp,
        width: info.width,
        height: info.height,
        format: info.format,
        outputBytes: data.length,
        pngSignature: data.subarray(0, 8).toString("hex"),
      })}\n`,
    );
  } finally {
    sharp.cache(false);
  }
}

run().catch((error) => {
  const message =
    error instanceof assert.AssertionError
      ? error.message
      : "Sharp native worker failed";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
