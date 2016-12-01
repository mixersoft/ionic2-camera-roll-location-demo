import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgmCoreModule } from 'angular2-google-maps/core';


/**
 * Do not specify providers for modules that might be imported by a lazy loaded module.
 */

@NgModule({
  imports: [
    CommonModule,
    AgmCoreModule.forRoot({
      apiKey: null
      ,libraries: []
    })
  ],
  declarations: [
  ],
  exports: [
    CommonModule,
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: []
    };
  }
}
