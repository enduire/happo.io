const { VERBOSE = 'false' } = process.env;

export default async function processSnapsInBundle(
  webpackBundle,
  { viewport, DomProvider, targetName },
) {
  const [width, height] = viewport.split('x').map((s) => parseInt(s, 10));

  // TODO Remove width and height in next breaking change after puppeteer plugin
  // has been updated.
  const domProvider = new DomProvider({ webpackBundle, width, height });

  const result = {
    snapPayloads: [],
  };
  try {
    await domProvider.init({ targetName });

    // TODO remove resize guard in next breaking change and after puppeteer
    // plugin has been updated.
    if (typeof domProvider.resize !== 'undefined') {
      await domProvider.resize({ width, height });
    }

    // Disabling eslint here because we actually want to run things serially.
    /* eslint-disable no-await-in-loop */
    while (await domProvider.next()) {
      if (VERBOSE === 'true') {
        console.log(`Viewport ${viewport}`);
      }
      const payload = await domProvider.processCurrent();
      result.snapPayloads.push(payload);
    }

    result.css = await domProvider.extractCSS();
  } catch (e) {
    throw e;
  } finally {
    await domProvider.close();
  }
  return result;
}
