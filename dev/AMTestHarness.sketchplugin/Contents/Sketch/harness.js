// AnimateMate test harness (development only).
//
// Every command only touches a document that has a page named TEST_PAGE.
// `setup` creates a new document with that page, so your own files are never
// modified. Results are written as JSON to dev/.harness-out.json.

// AnimateMate's own nested imports are resolved relative to its commands.js and
// fail silently from here, so every library file is imported explicitly.
@import '../../../../AnimateMate.sketchplugin/Contents/Sketch/library/easing.js';
@import '../../../../AnimateMate.sketchplugin/Contents/Sketch/library/Animation.js';
@import '../../../../AnimateMate.sketchplugin/Contents/Sketch/library/Animate.js';
@import '../../../../AnimateMate.sketchplugin/Contents/Sketch/library/Gui.js';
@import '../../../../AnimateMate.sketchplugin/Contents/Sketch/library/Dialog.js';
@import '../../../../AnimateMate.sketchplugin/Contents/Sketch/library/Utils.js';

var sketch = require('sketch');
var TEST_PAGE = 'AnimateMate Test';
var BOX_A_ANIMATION = '{:linearEase;0,20,20,80,80,360,1;10,250,180,100,60,405,0.5;}';

function devFolder(context) {
  var path = NSString.stringWithString(context.scriptPath);
  for (var i = 0; i < 4; i++) path = path.stringByDeletingLastPathComponent();
  return String(path);
}

function write(context, obj) {
  var str = NSString.stringWithString(JSON.stringify(obj, null, 2));
  str.writeToFile_atomically_encoding_error(devFolder(context) + '/.harness-out.json', true, NSUTF8StringEncoding, null);
}

function readInput(context) {
  var path = devFolder(context) + '/.harness-in.json';
  if (!NSFileManager.defaultManager().fileExistsAtPath(path)) return {};
  var str = NSString.stringWithContentsOfFile_encoding_error(path, NSUTF8StringEncoding, null);
  return str ? JSON.parse(String(str)) : {};
}

function testPage(doc) {
  if (!doc) return null;
  for (var i = 0; i < doc.pages.length; i++) {
    if (doc.pages[i].name === TEST_PAGE) return doc.pages[i];
  }
  return null;
}

// Returns the test document or null (and writes the reason).
function testDocument(context) {
  var doc = context.document ? sketch.fromNative(context.document) : null;
  var page = testPage(doc);
  if (!page || doc.selectedPage.id !== page.id) {
    if (!doc) {
      write(context, { ok: false, reason: 'no document open; run setup first' });
      return null;
    }
    write(context, { ok: false, reason: 'current document/page is not "' + TEST_PAGE + '"; run setup first' });
    return null;
  }
  return doc;
}

function dumpLayers(layers, depth) {
  return layers.map(function (l) {
    var item = { name: l.name, type: l.type };
    if (l.frame) item.frame = { x: l.frame.x, y: l.frame.y, w: l.frame.width, h: l.frame.height };
    if (l.style && typeof l.style.opacity !== 'undefined') item.opacity = l.style.opacity;
    if (l.transform) item.rotation = l.transform.rotation;
    if (l.layers && depth < 4) item.layers = dumpLayers(l.layers, depth + 1);
    return item;
  });
}

function findByPrefix(layers, prefix) {
  for (var i = 0; i < layers.length; i++) {
    if (layers[i].name.indexOf(prefix) === 0) return layers[i];
    if (layers[i].layers) {
      var found = findByPrefix(layers[i].layers, prefix);
      if (found) return found;
    }
  }
  return null;
}

function select(doc, layer) {
  doc.selectedLayers.clear();
  if (layer) layer.selected = true;
}

function setup(context) {
  var doc = context.document ? sketch.fromNative(context.document) : null;
  if (!testPage(doc)) {
    doc = new sketch.Document();
    doc.pages[0].name = TEST_PAGE;
  }
  var page = testPage(doc);
  doc.selectedPage = page;
  page.layers.slice().forEach(function (l) { l.remove(); });

  var artboard = new sketch.Artboard({
    name: 'AM Test',
    parent: page,
    frame: { x: 0, y: 0, width: 400, height: 300 }
  });
  var a = new sketch.ShapePath({
    name: 'Box A',
    parent: artboard,
    shapeType: sketch.ShapePath.ShapeType.Rectangle,
    frame: { x: 20, y: 20, width: 80, height: 80 },
    style: { fills: ['#ff5500'] }
  });
  new sketch.ShapePath({
    name: 'Box B',
    parent: artboard,
    shapeType: sketch.ShapePath.ShapeType.Oval,
    frame: { x: 200, y: 120, width: 60, height: 60 },
    style: { fills: ['#0077ff'] }
  });
  select(doc, a);
  write(context, { ok: true, layers: dumpLayers(page.layers, 0) });
}

function inspect(context) {
  var doc = sketch.fromNative(context.document);
  write(context, {
    ok: !!testPage(doc),
    page: doc.selectedPage.name,
    selected: doc.selectedLayers.layers.map(function (l) { return l.name; }),
    layers: dumpLayers(doc.selectedPage.layers, 0)
  });
}

function selectA(context) {
  var doc = testDocument(context);
  if (!doc) return;
  select(doc, findByPrefix(doc.selectedPage.layers, 'Box A'));
  inspect(context);
}

function selectNone(context) {
  var doc = testDocument(context);
  if (!doc) return;
  select(doc, null);
  inspect(context);
}

// Moves, rotates and fades Box A (used to create a second keyframe by hand).
function mutate(context) {
  var doc = testDocument(context);
  if (!doc) return;
  var a = findByPrefix(doc.selectedPage.layers, 'Box A');
  a.frame = new sketch.Rectangle(250, 180, 100, 60);
  a.transform.rotation = 45;
  a.style.opacity = 0.5;
  select(doc, a);
  inspect(context);
}

// Adds Box C inside group G to test nested layers.
function setupGroup(context) {
  var doc = testDocument(context);
  if (!doc) return;
  var artboard = findByPrefix(doc.selectedPage.layers, 'AM Test');
  var c = new sketch.ShapePath({
    name: 'Box C',
    shapeType: sketch.ShapePath.ShapeType.Rectangle,
    frame: { x: 0, y: 0, width: 40, height: 40 },
    style: { fills: ['#22aa44'] }
  });
  var g = new sketch.Group({ name: 'G', parent: artboard, layers: [c] });
  g.frame = new sketch.Rectangle(40, 200, 40, 40);
  select(doc, c);
  inspect(context);
}

function mutateC(context) {
  var doc = testDocument(context);
  if (!doc) return;
  var c = findByPrefix(doc.selectedPage.layers, 'Box C');
  c.transform.rotation = 90;
  select(doc, c);
  inspect(context);
}

// Writes a known two-keyframe animation (frames 0 and 10) into Box A's name.
function animateA(context) {
  var doc = testDocument(context);
  if (!doc) return;
  var a = findByPrefix(doc.selectedPage.layers, 'Box A');
  a.name = 'Box A' + BOX_A_ANIMATION;
  select(doc, null);
  inspect(context);
}

// Runs AnimateMate's export without dialogs. Options come from
// dev/.harness-in.json, e.g. {"scale": 2, "gif": 1, "png": 1, "output": "/tmp/x"}.
function exportTest(context) {
  var doc = testDocument(context);
  if (!doc) return;
  var opts = readInput(context);
  var output = opts.output || (devFolder(context) + '/.export-out');
  NSFileManager.defaultManager().createDirectoryAtPath_withIntermediateDirectories_attributes_error(output, true, null, null);

  var result = { ok: false, output: output, options: opts };
  try {
    if (!utils.init(context, true)) {
      result.reason = 'utils.init returned false';
    } else {
      animate.exportAnimation(
        opts.name || 'AM Test',
        opts.gif ? 1 : 0,
        opts.png === 0 ? 0 : 1,
        opts.start || 0,
        typeof opts.end === 'number' ? opts.end : animate.endFrameNumber,
        opts.anchor || 0,
        typeof opts.delay === 'number' ? opts.delay : 3,
        opts.loop || 0,
        opts.scale || 1,
        opts.dither ? 1 : 0,
        typeof opts.optimize === 'number' ? opts.optimize : 3,
        opts.colors || 0,
        output
      );
      result.ok = true;
    }
  } catch (e) {
    result.error = String(e);
  }
  var listing = NSFileManager.defaultManager().contentsOfDirectoryAtPath_error(output, null);
  result.files = [];
  for (var i = 0; listing && i < listing.count(); i++) result.files.push(String(listing.objectAtIndex(i)));
  write(context, result);
}

// Quick report of the Sketch APIs AnimateMate relies on.
function probe(context) {
  var r = {};
  try {
    var nd = context.document;
    var page = nd.currentPage();
    r.version = String(NSBundle.mainBundle().objectForInfoDictionaryKey('CFBundleShortVersionString'));
    r.pageHasCurrentArtboard = !!page.respondsToSelector(NSSelectorFromString('currentArtboard'));
    r.pageArtboardsCount = Number(page.artboards().count());
    r.docHasSaveArtboardOrSlice = !!nd.respondsToSelector(NSSelectorFromString('saveArtboardOrSlice:toFile:'));
    r.MSArtboardGroup = typeof MSArtboardGroup !== 'undefined';
    r.MSExportRequest = typeof MSExportRequest !== 'undefined';
    r.sketchExport = typeof sketch.export === 'function';
    r.selectionCount = Number(context.selection.count());
  } catch (e) {
    r.error = String(e);
  }
  write(context, r);
}
