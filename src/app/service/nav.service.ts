import { Injectable, NgZone } from '@angular/core';
import { ToastController, LoadingController, MenuController, ModalController } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { LatLngBounds } from '@agm/core/map-types';
import { HelperService } from './helper.service';

declare var google;

@Injectable({
  providedIn: 'root'
})
export class NavService {

  latitude: number;
  longitude: number;
  marker : {
    latitude: number
    longitude: number
    };
  pickup: {
    latitude: number
    longitude: number
  };
  dropoff: {
    latitude: number
    longitude: number
  };
  markers = [];
  zoom: number;
  dropoffAutocompleteItems: any;
  dropoffAutocomplete: any;

  pickupAutocompleteItems: any;
  pickupAutocomplete:any;

  geo: any

  service = new google.maps.places.AutocompleteService();

  constructor(public loadingCtrl: LoadingController,
    public toastCtrl: ToastController,
    public geolocation: Geolocation,
    public zone: NgZone,
    private helper: HelperService,
    public modalCtrl: ModalController) { 
      this.dropoffAutocompleteItems = [];
      this.dropoffAutocomplete = {
        query: ''
      };

      this.pickupAutocompleteItems = [];
      this.pickupAutocomplete = {
        query: ''
      };

    }

    async locateMe() {
      let loader = await this.loadingCtrl.create({
         message: 'Où vous cachez vous..?',
         duration: 9000
       });
       loader.present();
       this.geolocation.getCurrentPosition().then((resp) => {
           loader.dismiss();
           this.latitude = resp.coords.latitude;
           this.longitude = resp.coords.longitude;
           this.marker = {
             latitude: resp.coords.latitude,
             longitude: resp.coords.longitude,
           }
           this.zoom = 17;
           console.log(this.marker.latitude, this.marker.longitude);
         }).catch(
            (error) => {
             loader.dismiss();
             this.toastCtrl.create({
               message: error,
             });
           });
         let watch = this.geolocation.watchPosition();
         watch.subscribe((data) => {
           this.latitude = data.coords.latitude;
           this.longitude = data.coords.longitude;
         });
     }
   
  /*dismiss() {
    this.modalCtrl.dismiss(this.autocompleteItems);
  }*/

  dropoffChooseItem(item: any) {
   // this.modalCtrl.dismiss(item);
    this.geo = item;
    this.dropoffGeoCode(this.geo);//convert Address to lat and long
    this.markers.push(this.marker);
  }

  dropoffUpdateSearch() {
    if (this.dropoffAutocomplete.query == '') {
     this.dropoffAutocompleteItems = [];
     return;
    }
    let me = this;
    this.service.getPlacePredictions({
    input: this.dropoffAutocomplete.query,
    componentRestrictions: {
      country: 'fr'
    }
   }, (predictions, status) => {
     me.dropoffAutocompleteItems = [];

   me.zone.run(() => {
     if (predictions != null) {
        predictions.forEach((prediction) => {
          me.dropoffAutocompleteItems.push(prediction.description);
        });
       }
     });
   });
  }

  //convert Address string to lat and long
  dropoffGeoCode(address:any) {
    let geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': address }, (results, status) => {
    this.latitude = results[0].geometry.location.lat();
    this.longitude = results[0].geometry.location.lng();
    this.marker = {
      latitude: results[0].geometry.location.lat(),
      longitude: results[0].geometry.location.lng(),
    }
    this.dropoff = {
      latitude : this.latitude,
      longitude: this.longitude
    }
    console.log("dropoff : ", this.dropoff);
    localStorage.setItem('dropoff',JSON.stringify(this.dropoff))
    this.zoom = 17;
    this.markers.push(this.marker);
  });
 }


pickupChooseItem(item: any) {
 // this.modalCtrl.dismiss(item);
  this.geo = item;
  this.pickupGeoCode(this.geo);//convert Address to lat and long
  this.markers.push(this.marker);
}

pickupUpdateSearch() {
  if (this.pickupAutocomplete.query == '') {
   this.pickupAutocompleteItems = [];
   return;
  }
  let me = this;
  this.service.getPlacePredictions({
  input: this.pickupAutocomplete.query,
  componentRestrictions: {
    country: 'fr'
  }
 }, (predictions, status) => {
   me.pickupAutocompleteItems = [];

 me.zone.run(() => {
   if (predictions != null) {
      predictions.forEach((prediction) => {
        me.pickupAutocompleteItems.push(prediction.description);
      });
     }
   });
 });
}

//convert Address string to lat and long
  pickupGeoCode(address:any) {
     let geocoder = new google.maps.Geocoder();
   geocoder.geocode({ 'address': address }, (results, status) => {
   this.latitude = results[0].geometry.location.lat();
   this.longitude = results[0].geometry.location.lng();
   this.marker = {
     latitude: results[0].geometry.location.lat(),
      longitude: results[0].geometry.location.lng(),
   }
   this.pickup = {
    latitude : this.latitude,
    longitude: this.longitude
  }
  console.log("pickup : ", this.pickup);
  localStorage.setItem('pickup',JSON.stringify(this.pickup));
    this.zoom = 17;
    this.markers.push(this.marker);
  });
  }

  getGeoLocation(lat: number, lng: number) {
    if (navigator.geolocation) {
        let geocoder = new google.maps.Geocoder();
        let latlng = new google.maps.LatLng(lat, lng);
        let request = { latLng: latlng };
    
        geocoder.geocode(request, (results, status) => {
          if (status == google.maps.GeocoderStatus.OK) {
            let result = results[0];
            let rsltAdrComponent = result.address_components;
            let resultLength = rsltAdrComponent.length;
            console.log(rsltAdrComponent)
            if (result != null) {
              // let  buildingNum = rsltAdrComponent.find(x => x.types == 'street_number').long_name;
              // let streetName = rsltAdrComponent.find(x => x.types == 'route').long_name;
              let code = rsltAdrComponent.filter(data => data.types[0]==="postal_code");
              if(code.length >0){
                localStorage.setItem('code',code[0].long_name);
                this.helper.setCode(code[0].long_name);
              }
              console.log(code);
            } else {
              alert("No address available!");
            }
          }
        });
    }
    }
}
