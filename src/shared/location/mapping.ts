/**
 * consolidate all mapping resources in one file
 * pick from:
 *  - @types/googlemaps: namespace google.maps
 *  - angular2-google-maps/core/services/google-maps-types.d.ts, "SebmGoogleMaps"
 * 
 */

import * as sebm from 'angular2-google-maps/core/services/google-maps-types';

export interface UuidMarker extends google.maps.Marker {
  uuid: string;
  detail?: string;
}

export function UuidMarkerFactory(uuid: string, marker: google.maps.Marker): UuidMarker;
export function UuidMarkerFactory(uuid: string, options?: google.maps.MarkerOptions): UuidMarker;
export function UuidMarkerFactory(uuid: string, arg1?: any): UuidMarker {
  let marker = (arg1 instanceof google.maps.Marker) ? arg1 : new google.maps.Marker(arg1);
  return Object.assign(marker, {uuid});
}

export interface sebmMarkerOptions extends sebm.MarkerOptions{
  // position: sebm.LatLng | sebm.LatLngLiteral;
  uuid: string;
  detail?: string;
}  



/***********************************************************************************************
 * additional helper methods
 ***********************************************************************************************/

/**
 * create SebmMarker object from UuidMarker or google.maps.Marker with extra uuid property
 * @param  {UuidMarker} marker [description]
 * @return {sebmMarkerOptions}        [description]
 */
export function getSebmMarker(marker: UuidMarker | sebmMarkerOptions) : sebmMarkerOptions {
  const m = marker as any;
  const sebm : any = {
    'lat': m.position.lat(),
    'lng': m.position.lng(),
    'draggable': false
  }
  ['uuid', 'label', 'detail', 'icon'].forEach( (k: string)=> {
    if (m.hasOwnProperty(k)) sebm[k] = m[k];
  })
  return sebm as sebmMarkerOptions;
}

