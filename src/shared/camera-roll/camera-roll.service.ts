import { Platform } from 'ionic-angular';
import _ from "lodash";


import {cameraRoll as cameraRollAsJsonString} from "./mock-camera-roll";
import {
  // sebmLatLng, sebmLatLngBounds,
  LatLngSpeedLiteral,
  GeoJson, GeoJsonPoint, isGeoJson,
  GpsRegion, CircularGpsRegion,
  distanceBetweenLatLng
} from '../location/index';

declare var window;

export enum mediaType {
  Unknown, Image, Video, Audio
}

export enum mediaSubtype {
  // TODO: these are bitmasked values in IOS
  // see: https://developer.apple.com/library/ios/documentation/Photos/Reference/Photos_Constants/index.html#//apple_ref/c/tdef/PHAssetMediaSubtype
  None, PhotoPanorama, PhotoHDR, PhotoScreenshot, PhotoLive, VideoStreamed, VideoHighFrameRate, VideoTimelapse
}

export interface optionsQuery {
  from?: Date;
  to?: Date;
  mediaType?: mediaType;
  mediaSubtype?: mediaSubtype;
  [propName: string]: any;    // map startDate=>from, endDate=>to as convenience
}

export interface optionsFilter {
  startDate?: Date,
  endDate?: Date,
  locationName?: string
  mediaType?: mediaType[]
  isFavorite?: boolean
  near?: {point: GeoJsonPoint, distance: number},
  contains?: (location: GeoJson) => boolean   // google maps
}

export interface optionsSort {
  key: string;
  descending?: boolean;
}

export interface cameraRollPhoto {
  uuid: string,
  filename: string,
  dateTaken: string, // isoDate
  localTime: string | Date, // YYYY-MM-DD HH:MM:SS.SSS
  mediaType: number,
  mediaSubtype: number,

  width: number,
  height: number,
  duration: number,

  location?: GeoJsonPoint,      // deprecate
  position?: LatLngSpeedLiteral,
  
  momentId?: string,
  momentLocationName?: string
}

/**
 * convert a cameraRollPhoto.localTime string to Date() in local timezone
 * e.g. cameraRollPhoto.localTime = "2014-10-24 04:45:04.000" => Date()
 */
export function localTimeAsDate(arg:string | {localTime: string}): Date {
  let localTime: string;
  if (typeof arg == "string") {
    localTime = arg;
  } else {
    localTime = arg.localTime;
  }
  if (!localTime) return;
  
  try {
    let dt = new Date(localTime);
    if (isNaN(dt as any as number) == false)
      return dt;

    // BUG: Safari does not parse time strings to Date correctly  
    const [,d,h,m,s] = localTime.match( /(.*)\s(\d*):(\d*):(\d*)\./)
    dt = new Date(d);
    dt.setHours(parseInt(h), parseInt(m), parseInt(s));
    // console.log(`localTimeAsDate=${dt.toISOString()}`)
    return dt;
  } catch (err) {
    throw new Error(`Invalid localTime string, value=${localTime}`);
  }
}

/**
 * factory function to create CameraRollWithLoc stub when platform is NOT cordova
 */
export function CameraRollWithLocFactory (platform: Platform) : CameraRollWithLoc {
  if (platform.is("cordova"))
    return new CameraRollWithLoc()
  else
    return new MockCameraRollWithLoc()
}

export class CameraRollWithLoc {
  public isCordova = true;

  protected _photos : cameraRollPhoto[] = [];
  protected _filter : optionsFilter = {};
  protected _filteredPhotos : cameraRollPhoto[];

  private _isProcessing: Promise<cameraRollPhoto[]>;

  static sortPhotos(
    photos : cameraRollPhoto[]
    , options : optionsSort[] = [{key:'dateTaken', descending: false}]
    , replace: boolean = true) : cameraRollPhoto[]
  {
    // TODO: only use first sort option right now
    const sort : optionsSort = options[0];
    // console.log(`>>> _.keys(_): ${_.keys(_).slice(10,20)}`);
    const sorted = _.sortBy( photos, (o) =>  {
      return (o as any)[ sort.key ]
    } );
    if (sort.descending) sorted.reverse();
    return sorted;
  }


  constructor ( ) {
  }

  /**
   * get cameraRollPhoto[] from CameraRoll using Plugin,
   * uses cached values by default, ignore with force==true
   * @param  optionsQuery
   * @param  {boolean = false}      refresh
   * @return {Promise<cameraRollPhoto[]>}         [description]
   */
  queryPhotos(options?: optionsQuery, force:boolean = false) : Promise<cameraRollPhoto[]>{
    if (!this._isProcessing && this._photos.length && !options && force==false) {
      // resolve immediately with cached value
      return Promise.resolve(this._photos);
    }
    
    if (this._isProcessing && !options && force==false){
      // wait for promise to resolve
      return this._isProcessing;
    }

    const plugin : any = _.get( window, "cordova.plugins.CameraRollLocation");
    if (!plugin) {
      const err = "cordova.plugins.CameraRollLocation not available.";
      console.error(err);
      throw new Error(err);
    }
    // map startDate=>from, endDate=>to as a convenience
    if (options && !options.from && options['startDate']) options.from = options['startDate']
    if (options && !options.to && options['endDate']) options.to = options['endDate']
    this._isProcessing = plugin['getCameraRoll'](options)
    .then( (photos)=>{
      console.log(`cameraRollLocation.queryPhotos(), rows=${photos.length}`);
      photos.forEach( (o)=> {
        if (o.location && o.location instanceof GeoJsonPoint == false ) {
          o.location = new GeoJsonPoint(o.location);
        }
      });
      this._isProcessing = null;
      return this._photos = photos;
    })
    return this._isProcessing;
  }

  /**
   * filter photos in cameraRoll
   * @param  {optionsFilter  = {}}          options, filter options
   * @param  {boolean        = true}        replace, replaces existing filter by default
   *                                          use replace=false to merge with current filter
   * @return {CameraRollWithLoc}            filtered CameraRollWithLoc
   */
  filterPhotos (options : optionsFilter = {}, replace: boolean = true) : CameraRollWithLoc {
    if (replace) {
      Object.assign(this._filter, options)
    } else {
      this._filter = options
    }
    let {
      startDate : from, endDate : to,
      locationName,
      mediaType, isFavorite,
      near, contains
    } = this._filter;
    let result = this._photos;

    // cache value outside filter() loop
    let gpsRegion : GpsRegion;

    // from, to expressed in localTime via from = new Date([date string])
    // let fromAsLocalTime = new Date(from.valueOf() - from.getTimezoneOffset()*60000).toJSON()
    result = result.filter( (o : any) => {
      // filter on localTime
      if (from && localTimeAsDate(o['localTime']) < from) return false;
      if (to && localTimeAsDate(o['localTime']) > to) return false;
      if (locationName
        && false === o['momentLocationName'].startsWith(locationName)
        ) return false;

      if (mediaType
        && false === _.includes(mediaType, o['mediaType'])
        ) return false;
      if (isFavorite && false === o['isFavorite']) return false;

      if (near) {
        if (!o['location']) return false;
        gpsRegion = gpsRegion || new CircularGpsRegion(near.point, near.distance)
        let loc = new GeoJsonPoint(o['location'].coordinates)
        if (gpsRegion.contains(loc) == false) return false;
      }

      if (contains && contains( o['location'] ) == false) return false

      // everything good
      return true;
    });
    this._filteredPhotos = result || [];
    // console.log(`cameraRollLocation.filterPhotos(), rows=${this._filteredPhotos.length}`);
    return this;
  }


  /**
   * [sortPhotos description]
   * @param  {'dateTaken'}       options    [description]
   * @param  {true]}}            descending [description]
   * @param  {boolean        =          true}        replace [description]
   * @return {CameraRollWithLoc}            [description]
   */
  sortPhotos (
    options : optionsSort[] = [{key:'dateTaken', descending: true}]
    , replace: boolean = true) : CameraRollWithLoc
  {
    this._filteredPhotos = CameraRollWithLoc.sortPhotos(this._filteredPhotos, options, replace);
    return this;
  }


  getPhotos ( limit : number = 10 ) : cameraRollPhoto[] {
    let result = this._filteredPhotos || this._photos || [];
    if (!result.length) {
      console.warn("CameraRoll: no photos found. check query/filter");
    }

    result = result.slice(0, limit);
    result.forEach( (o)=> {
      if (o.location && o.location instanceof GeoJsonPoint == false ) {
        o.location = new GeoJsonPoint(o.location);
      }
    });
    console.log(`cameraRollLocation.getPhotos(), rows=${result.length}`);
    return result
  }

}



/**
 * use static data for testing without Cordova
 */
export class MockCameraRollWithLoc extends CameraRollWithLoc {
  isCordova: boolean = false;
  constructor(){
    super();
    console.warn("cordova.plugins.CameraRollLocation not available, using sample data");
    try {
      let parsed = JSON.parse( cameraRollAsJsonString ) as cameraRollPhoto[];
      this._photos = parsed;
    } catch (e) {
      console.error( "Error parsing JSON" );
    }
    this._photos.forEach( (o)=> {
      if (o.location && o.location instanceof GeoJsonPoint == false ) {
        o.location = new GeoJsonPoint(o.location);
      }
    });
  }

  /**
   * get cameraRollPhoto[] from CameraRoll using Plugin,
   * uses cached values by default, ignore with force==true
   * @param  {optionsQuery}         interface optionsQuery
   * @param  {boolean = false}      refresh
   * @return {Promise<cameraRollPhoto[]>}         [description]
   */
  queryPhotos(options?: optionsQuery, force:boolean = false) : Promise<cameraRollPhoto[]>{
    return Promise.resolve(this._photos);
  }
}
