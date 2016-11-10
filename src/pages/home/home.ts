import { Component, ElementRef, ViewChild } from '@angular/core';

import { NavController, Platform } from 'ionic-angular';

import {
  CameraRollWithLoc, ImageService, renderPhotoForView,
  cameraRollPhoto,
  GeoJsonPoint,
  mediaType, optionsFilter
} from "../../shared/index";

declare var cordova: any;

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
  location: {lat:number, lng:number};

  constructor(
    public navCtrl: NavController
    , public platform: Platform
    , public cameraRoll: CameraRollWithLoc
  ) {

  }

  ngOnInit() {
    this.platform.ready().then(
      () => {
        this.cameraRoll.queryPhotos({
          startDate: new Date('2016-01-01'),
          endDate: new Date('2016-12-31'),
        })
    })
  }

  clear (){
    this.items = [];
    this.location = {lat:0, lng:0};
    this.map.triggerResize();
  }

  setMarker(location: GeoJsonPoint) {
    this.location = location.toJson();
    this.map.triggerResize();
    console.log("show marker at", location)
  }

  handleClick (){
    this.cameraRoll.queryPhotos()
    .then( ()=>{
      this.items = this.cameraRoll.filterPhotos({
        startDate: new Date('2016-01-01'),
        mediaType: [mediaType.Image]
      }).getPhotos(5);

      if (this.items.length) 
        this.setMarker(this.items[0].location);
      if (this.platform.is("cordova") == false) {
        console.warn("cordova not available");
      }
    })

    console.info("handleClick");
  }

}
