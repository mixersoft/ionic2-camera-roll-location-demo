/**
 * consolidate all location resources in one file
 * pick from:
 *  - angular2-google-maps/core/services/google-maps-types.d.ts, "SebmGoogleMaps"
 *  - custom GeoJson resources
 *  - @types/googlemaps: namespace google.maps
 */

import * as sebm from 'angular2-google-maps/core/services/google-maps-types';

declare var google:any;

export interface UuidLatLng extends google.maps.LatLng {
  uuid: string;
}

export function UuidLatLngFactory(uuid: string, LatLng: google.maps.LatLng): UuidLatLng;
export function UuidLatLngFactory(uuid: string, lat: number, lng: number): UuidLatLng;
export function UuidLatLngFactory(uuid: string, arg1: any, lng?:number): UuidLatLng {
  let LatLng = (arg1 instanceof google.maps.LatLng) ? arg1 : new google.maps.LatLng(arg1,lng);
  return Object.assign(LatLng, {uuid});
}

export interface sebmLatLng extends sebm.LatLng {
  constructor(lat: number, lng: number, noWrap?: boolean);
  equals(other: google.maps.LatLng): boolean;
  lat(): number;
  lng(): number;
  toString(): string;
  toUrlValue(precision?: number): string;
  toJSON(): google.maps.LatLngLiteral;
};
export type sebmLatLngLiteral = sebm.LatLngLiteral;
export type sebmLatLngBounds = sebm.LatLngBounds;
export type sebmLatLngBoundsLiteral = sebm.LatLngBoundsLiteral;

export interface GeoJson {
  type: string,
  coordinates: [number,number]  // [lng,lat]
}

export function isGeoJson ( obj : any) : obj is GeoJson {
  if (obj == undefined) return false;
  let {type, coordinates} = obj;
  return typeof type === 'string'
    && coordinates instanceof Array
    && typeof coordinates[0] === 'number'
    && typeof coordinates[1] === 'number';
}

export abstract class GeoJsonBase {
  protected _mathRound = (v : number, precision: number = 6) : number => {
    const scale = Math.pow(10, precision);
    return Math.round( v * scale )/scale;
  };

  constructor (public type: string, public coordinates: [number,number]) {}

  longitude() : number {
    return this.coordinates[0];
  }
  latitude() : number {
    return this.coordinates[1];
  }
}

export class GeoJsonPoint extends GeoJsonBase {
  static fromJson ( { type, coordinates } : GeoJson ) : GeoJsonPoint {
    if (type != 'Point') throw new Error("Error, expecting type=Point");
    let [longitude, latitude] = coordinates;
    return new GeoJsonPoint([longitude, latitude]);
  }


  constructor ( obj : GeoJson);
  constructor ( obj : google.maps.LatLng);
  constructor ( obj : [number, number]);
  constructor ( obj : any = {}) {
    if ( obj instanceof Array ) {
      let [longitude, latitude] = obj;
      super("Point", [longitude, latitude]);
      return
    }
    let {type, coordinates} = obj;
    if (type && coordinates) {
      if (type != 'Point') throw new Error("Error, expecting type=Point");
      if (type && coordinates) {
          super(type, coordinates);
      }
      return
    }
    if (google && obj instanceof google.maps.LatLng) {
      type = "Point";
      coordinates = [obj.lng(), obj.lat()]
      super(type, coordinates);
      return
    }
    let {lng, lat} = obj;
    if (lng && lat) {
      super("Point", [lng, lat]);
      return;
    }
    throw new Error("Error, expecting something that describes a Point");
  }



  /**
   * return "lon,lat" as decimals rounded to the 'precision' digits
   * flipped version of google.maps.LatLng.toLatLngString(), does NOT use google.maps.LatLng
   *    - google maps only uses 6 significant digits
   * @param  {int}      precision 
   * @return {string}   "lon,lat"
   */
  toLonLatString(precision: number = 6) : string {
    let rounded =  this.coordinates.map( v => this._mathRound(v, precision) )
    return rounded.join(",");
  }

  toJson() : {lat: number, lng: number} {  // same as google.maps.LatLngLiteral
    return {
      lat: this.coordinates[1],
      lng: this.coordinates[0]
    }
  }


  /**
   * NOTE: these methods depend on google.maps API
   *  loaded by `angular2-google-maps`
   */
  toLatLngLiteral() : google.maps.LatLngLiteral {
    return this.toJson();
  }
  
  toLatLng() : google.maps.LatLng {
    const [lng, lat] = this.coordinates;
    return new google.maps.LatLng(lat, lng)
  }

  toLatLngString(precision: number = 6) : string {
   return this.toLatLng().toUrlValue(precision) 
  }

  equals(other: GeoJsonPoint | google.maps.LatLng, precision?: number) : boolean {
    if (isGeoJson(other)) other = other.toLatLng()
    if (precision) {
      return this.toLatLngString(precision) == other.toUrlValue(precision);
    }
    return this.toLatLng().equals(other);
  }

}


/**
 * from package: js-marker-clusterer
 * Calculates the distance between two latlng locations in km.
 * @see http://www.movable-type.co.uk/scripts/latlong.html
 *
 * @param {google.maps.LatLng} p1 The first lat lng point.
 * @param {google.maps.LatLng} p2 The second lat lng point.
 * @return {number} The distance between the two points in m.
 * @private
*/
export function distanceBetweenLatLng (p1: GeoJsonPoint, p2:GeoJsonPoint) : number;
export function distanceBetweenLatLng (p1: google.maps.LatLng, p2:google.maps.LatLng) : number;
export function distanceBetweenLatLng (p1: sebmLatLng, p2:sebmLatLng) : number;
export function distanceBetweenLatLng (p1: any, p2:any) : number {
  if (!p1 || !p2) {
    return 0;
  }

  let lng1: number, lat1: number, lng2: number, lat2: number;
  if (isGeoJson(p1)) {
    [lng1, lat1] = p1.coordinates;
  } else {
    lng1 = p1.lng();
    lat1 = p1.lat();
  }

  if (isGeoJson(p2)) {
    [lng2, lat2] = p2.coordinates;
  } else {
    lng2 = p2.lng();
    lat2 = p2.lat();
  }

  var R = 6371000; // Radius of the Earth in m
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
};


/**
 * get a boundingBox by GPS coordinates from a proscribed circle
 * see: http://stackoverflow.com/questions/33232008/javascript-calcualate-the-geo-coordinate-points-of-four-corners-around-a-cente
 */
export interface GpsSides {
  top: number,    // lat
  right: number,  // lon
  bottom: number, // lat
  left: number    // lon
}

export interface GpsCorners {  // [NW, NE, SE, SW]
  0: [number,number]
  1: [number,number]
  2: [number,number]
  3: [number,number]
}
/**
 * getGpsBoundingBoxFromCircle() - get a boundingBox by GPS coordinates from a proscribed circle
 * @param  [number,number]  [lon, lat]      center expressed as [lon, lat] in decimals
 * @param  {number}  distance               distance in meters from center
 * @return {sides: GpsSides, corners: GpsCorners}   Object describing boundaries as GPS coordinates
 */
function getGpsBoundingBoxFromCircle([lon, lat] : [number,number], distance : number) : {sides: GpsSides, corners: GpsCorners} {
  let latRadian = lat * Math.PI / 180;

  let degLatKm = 110.574235;
  let degLongKm = 110.572833 * Math.cos(latRadian);
  let deltaLat = distance / 1000.0 / degLatKm;
  let deltaLong = distance / 1000.0 / degLongKm;


  let topLat : number = lat + deltaLat;
  let bottomLat : number = lat - deltaLat;
  let leftLng : number = lon - deltaLong;
  let rightLng : number = lon + deltaLong;

  let boundary = {top: topLat, right: rightLng, bottom: bottomLat, left: leftLng} as GpsSides

  // [lon,lat]
  let northWestCoords : [number,number] = [leftLng, topLat];
  let northEastCoords : [number,number] = [rightLng, topLat];
  let southWestCoords : [number,number] = [leftLng, bottomLat];
  let southEastCoords : [number,number] = [rightLng, bottomLat];

  let boundingBox = [northWestCoords, northEastCoords, southEastCoords, southWestCoords] as GpsCorners;
  return { sides: boundary, corners: boundingBox};
}

/**
 * use GpsRegion and subclasses to checking if a GeoJsonPoint is "nearby",
 * i.e. GpsRegion.contains( GeoJsonPoint )
 */
export abstract class GpsRegion {
  protected abstract boundaries() : GpsSides;
  /**
   * returns true if the GpsRegion contains the provided GeoJsonPoint
   * @param  {GeoJsonPoint} point
   * @return {boolean}
   */
  contains( point: GeoJsonPoint ) : boolean {
    let [lonA, latA] = point.coordinates;
    let sides = this.boundaries();

    if ((latA - sides['top']) > 0) return false
    if ((latA - sides['bottom']) < 0) return false
    // does this work with box.lon > 180?
    if ((lonA - sides['right']) > 0) return false
    if ((lonA - sides['left']) < 0) return false

    // console.log(`check if lat: ${sides['bottom']} < ${latA} < ${sides['top']} `)
    // console.log(`check if lon: ${sides['left']} < ${lonA} < ${sides['right']} `)
    return true
  }
}
export class RectangularGpsRegion extends GpsRegion {
  constructor (public sides: GpsSides) {
    super();
  }
  protected boundaries() : GpsSides {
    return this.sides;
  }
}
/**
 * uses a bounding square to determine contains()
 *  - square is centered on point with length = 2 * distance
 */
export class CircularGpsRegion extends GpsRegion {
  constructor (public point: GeoJsonPoint, public distance: number) {
    super();
  }
  protected boundaries() : GpsSides {
    let boundingBox = getGpsBoundingBoxFromCircle(this.point.coordinates, this.distance).sides;
    return boundingBox;
  }
}