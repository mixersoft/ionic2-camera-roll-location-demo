import { NgModule } from '@angular/core';
import { IonicApp, IonicModule, Platform } from 'ionic-angular';
import { MyApp } from './app.component';
import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';

import { SharedModule } from '../shared/shared.module';
import { AgmCoreModule } from 'angular2-google-maps/core';
import {
  CameraRollWithLoc, MockCameraRollWithLoc,
  ImageService, CordovaImageService, renderPhotoForView
} from "../shared/camera-roll/index";

@NgModule({
  declarations: [
    MyApp,
    AboutPage,
    ContactPage,
    HomePage,
    TabsPage,
    renderPhotoForView
  ],
  imports: [
    IonicModule.forRoot(MyApp),
    SharedModule.forRoot(),
    AgmCoreModule.forRoot({
      apiKey: null // add your google.maps API Key here
      ,libraries: []
    }),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AboutPage,
    ContactPage,
    HomePage,
    TabsPage
  ],
  providers: [{
    provide: ImageService
    , deps: [Platform]
    , useFactory: (platform: Platform)=>{
        if (platform.is("cordova"))
          return new CordovaImageService(platform)
        else
          return new ImageService(platform)
      }
  },
  , {
    provide: CameraRollWithLoc
    , deps: [Platform]
    , useFactory: (platform: Platform)=>{
        if (platform.is("cordova"))
          return new CameraRollWithLoc()
        else
          return new MockCameraRollWithLoc()
      }
  }
]
})
export class AppModule {}
