import { Component, ElementRef, ViewChild } from '@angular/core';

import { NavController, Platform } from 'ionic-angular';

import {
  CameraRollWithLoc, ImageService, add$ImgAttrs,
  cameraRollPhoto,
  GeoJsonPoint,
  mediaType, optionsFilter
} from "../../shared/index";

declare var cordova: any;
declare var google: any;

let _googleplexLatLng: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  styles: [`
    .sebm-google-map-container {
       height: 300px;
     }
  `]
})
export class HomePage {
  @ViewChild('sebmMap') map: any;
  items : cameraRollPhoto[] = [];
  position: google.maps.LatLng;

  constructor(
    public navCtrl: NavController
    , public platform: Platform
    , public cameraRoll: CameraRollWithLoc
  ) {}

  ngOnInit() {
    this.platform.ready().then(
      () => {
        
        this.cameraRoll.queryPhotos({
          startDate: new Date('2016-01-01'),
          endDate: new Date('2016-12-31'),
        })
    })
  }

  mapReady() {
    _googleplexLatLng = new google.maps.LatLng(37.4220041,-122.0862515);
    this.position = _googleplexLatLng;
  }

  clear (){
    this.items = [];
    this.position = _googleplexLatLng;
    this.map.triggerResize();
  }

  setMarker(position: google.maps.LatLng) {
    this.position = position;
    this.map.triggerResize();
    console.log("show marker at", position.toUrlValue())
  }

  handleClick (){
    this.cameraRoll.queryPhotos()
    .then( ()=>{
      this.items = this.cameraRoll.filterPhotos({
        startDate: new Date('2016-01-01'),
        mediaType: [mediaType.Image]
      }).getPhotos(5);

      if (this.items.length) 
        this.setMarker(this.items[0].location.toLatLng());
      if (this.platform.is("cordova") == false) {
        console.warn("cordova not available");
      }
    })

    console.info("handleClick");
  }

}
