type Point = [number, number];
type Ring = Point[];
type Polygon = Ring[];

type GeoFeature = {
  properties: {
    adcode: number | string;
    name?: string;
    center?: Point;
    centroid?: Point;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: Polygon | Polygon[];
  };
};

const sourceUrl = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';
const sourcePath = process.argv[2];
const source = (sourcePath
  ? await Bun.file(sourcePath).json()
  : await fetch(sourceUrl).then((response) => {
      if (!response.ok) throw new Error(`failed to fetch map geometry: ${response.status}`);
      return response.json();
    })) as { features: GeoFeature[] };
const outputPath = new URL('../src/data/chinaProvinceGeometry.ts', import.meta.url).pathname;

const radians = (degrees: number) => (degrees * Math.PI) / 180;
const phi1 = radians(25);
const phi2 = radians(47);
const phi0 = 0;
const lambda0 = radians(105);
const n = (Math.sin(phi1) + Math.sin(phi2)) / 2;
const c = Math.cos(phi1) ** 2 + 2 * n * Math.sin(phi1);
const rho0 = Math.sqrt(c - 2 * n * Math.sin(phi0)) / n;

const albersRaw = ([longitude, latitude]: Point): Point => {
  const lambda = radians(longitude);
  const phi = radians(latitude);
  const rho = Math.sqrt(c - 2 * n * Math.sin(phi)) / n;
  const theta = n * (lambda - lambda0);
  return [rho * Math.sin(theta), rho0 - rho * Math.cos(theta)];
};

const polygonsFor = (feature: GeoFeature): Polygon[] =>
  feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates as Polygon]
    : feature.geometry.coordinates as Polygon[];

const allMainPoints = source.features
  .filter((feature) => String(feature.properties.adcode) !== '100000_JD')
  .flatMap(polygonsFor)
  .filter((polygon) => {
    if (String(source.features.find((feature) => polygonsFor(feature).includes(polygon))?.properties.adcode) !== '460000') return true;
    return polygon[0].reduce((sum, point) => sum + point[1], 0) / polygon[0].length >= 15;
  })
  .flatMap((polygon) => polygon.flat())
  .map(albersRaw);

const minRawX = Math.min(...allMainPoints.map((point) => point[0]));
const maxRawX = Math.max(...allMainPoints.map((point) => point[0]));
const minRawY = Math.min(...allMainPoints.map((point) => point[1]));
const maxRawY = Math.max(...allMainPoints.map((point) => point[1]));
const frame = { width: 1200, height: 760, left: 46, top: 62, mapWidth: 1080, mapHeight: 650 };
const scale = Math.min(frame.mapWidth / (maxRawX - minRawX), frame.mapHeight / (maxRawY - minRawY));
const projectedWidth = (maxRawX - minRawX) * scale;
const projectedHeight = (maxRawY - minRawY) * scale;
const offsetX = frame.left + (frame.mapWidth - projectedWidth) / 2;
const offsetY = frame.top + (frame.mapHeight - projectedHeight) / 2;

const project = (point: Point): Point => {
  const [rawX, rawY] = albersRaw(point);
  return [offsetX + (rawX - minRawX) * scale, offsetY + (maxRawY - rawY) * scale];
};

const insetFrame = { x: 982, y: 468, width: 178, height: 260 };
const insetProject = ([longitude, latitude]: Point): Point => [
  8 + ((longitude - 106) / 20) * (insetFrame.width - 16),
  10 + ((25.5 - latitude) / 23) * (insetFrame.height - 20),
];

const segmentDistance = (point: Point, start: Point, end: Point) => {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;
  if (dx || dy) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = end[0];
      y = end[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
};

const simplifyRing = (ring: Ring, tolerance = 0.018): Ring => {
  if (ring.length <= 8) return ring;
  const points = ring.slice(0, -1);
  const threshold = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let maxDistance = threshold;
    let maxIndex = 0;
    for (let index = first + 1; index < last; index += 1) {
      const distance = segmentDistance(points[index], points[first], points[last]);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = index;
      }
    }
    if (maxIndex) {
      keep[maxIndex] = 1;
      stack.push([first, maxIndex], [maxIndex, last]);
    }
  }
  const simplified = points.filter((_, index) => keep[index]);
  if (simplified.length < 3) return ring;
  simplified.push(simplified[0]);
  return simplified;
};

const pathForRing = (ring: Ring, projection: (point: Point) => Point) => {
  const points = simplifyRing(ring).map(projection);
  return points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('') + 'Z';
};

const pathForPolygon = (polygon: Polygon, projection: (point: Point) => Point) =>
  polygon.map((ring) => pathForRing(ring, projection)).join('');

const averageLatitude = (polygon: Polygon) =>
  polygon[0].reduce((sum, point) => sum + point[1], 0) / polygon[0].length;

const regions = source.features
  .filter((feature) => String(feature.properties.adcode) !== '100000_JD')
  .map((feature) => {
    const polygons = polygonsFor(feature);
    const isHainan = String(feature.properties.adcode) === '460000';
    const mainPolygons = isHainan ? polygons.filter((polygon) => averageLatitude(polygon) >= 15) : polygons;
    const insetPolygons = isHainan ? polygons.filter((polygon) => averageLatitude(polygon) < 15) : [];
    const labelSource = feature.properties.centroid || feature.properties.center || mainPolygons[0][0][0];
    return {
      adcode: String(feature.properties.adcode),
      name: feature.properties.name || '',
      label: project(labelSource),
      paths: mainPolygons.map((polygon) => pathForPolygon(polygon, project)),
      insetPaths: insetPolygons.map((polygon) => pathForPolygon(polygon, insetProject)),
    };
  });

const jdFeature = source.features.find((feature) => String(feature.properties.adcode) === '100000_JD');
const southChinaSeaPaths = jdFeature ? polygonsFor(jdFeature).map((polygon) => pathForPolygon(polygon, insetProject)) : [];

const graticules = [
  ...[80, 90, 100, 110, 120, 130].map((longitude) => ({
    label: `${longitude}°E`,
    path: Array.from({ length: 73 }, (_, index) => project([longitude, 18 + index * 0.5] as Point)),
  })),
  ...[20, 30, 40, 50].map((latitude) => ({
    label: `${latitude}°N`,
    path: Array.from({ length: 127 }, (_, index) => project([73 + index * 0.5, latitude] as Point)),
  })),
].map((line) => ({
  label: line.label,
  d: line.path.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(''),
}));

const file = `/* eslint-disable */\n// Generated from https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json\n// Projection: Albers equal-area (standard parallels 25°N / 47°N). Do not edit by hand.\n\nexport interface ChinaMapRegionGeometry {\n  adcode: string;\n  name: string;\n  label: [number, number];\n  paths: string[];\n  insetPaths: string[];\n}\n\nexport const CHINA_MAP_FRAME = ${JSON.stringify({ viewBox: '0 0 1200 760', inset: insetFrame })} as const;\n\nexport const CHINA_MAP_REGIONS: ChinaMapRegionGeometry[] = ${JSON.stringify(regions)};\n\nexport const CHINA_MAP_GRATICULES = ${JSON.stringify(graticules)};\n\nexport const SOUTH_CHINA_SEA_PATHS: string[] = ${JSON.stringify(southChinaSeaPaths)};\n`;

await Bun.write(outputPath, file);
console.log(`generated ${regions.length} regions, ${southChinaSeaPaths.length} South China Sea paths -> ${outputPath}`);
