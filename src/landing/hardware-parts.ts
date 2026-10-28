import type * as T from 'three';

/** The Facade handheld scanner concept, as grouped in its CAD export (models/facade-scanner.glb, built into
 * public/hardware by scripts/build-hardware.mjs). Reserved and TBD parts are space allowances: no radar module,
 * coil design or sensor interface has been selected or validated. */
export type HardwareMode='assembly'|'electronics';
/** `anchor` names the piece of the group that its label and leader point at. */
export type HardwarePart={id:string;number:string;name:string;role:string;color:string;anchor:string;detail:string;source?:string};
export const hardwareParts:HardwarePart[]=[
 {id:'enclosure',number:'01',name:'Shell + palm grip',role:'Housing, scan button, status lights',color:'#a9b3b7',anchor:'04_integrated_palm_grip',detail:'Lower shell and sculpted upper shell with an integrated palm grip, a thumb scan button, three status lights and four wall pads. Wall thickness, sealing and fit have not been validated.'},
 {id:'cameras',number:'02',name:'Sensor nose',role:'Service cap + optional RGB',color:'#354047',anchor:'19_flush_sensor_nose',detail:'A flush nose at the front, with a service cap and a blank that can be swapped for an optional RGB camera. No RGB camera has been selected.'},
 {id:'thermal',number:'03',name:'Thermal camera',role:'FLIR Lepton 3.5 on PureThermal 3',color:'#d69c50',anchor:'18_Lepton_3_5_envelope',detail:'A Lepton 3.5 envelope on a PureThermal 3 board, in a cradle shaped to the vendor model, looking out through the nose. Thermal images show surface temperature only.',source:'https://groupgets.com/products/purethermal-3'},
 {id:'electronics',number:'04',name:'Adafruit Feather RP2040',role:'Controller + sensor interface',color:'#277a6b',anchor:'14_Feather_RP2040_PCB_outline',detail:'Feather RP2040 on a model-specific carrier, beside space reserved for a custom inductance-to-digital (LDC) interface for the coil. Firmware and the interface board are not built.',source:'https://www.adafruit.com/product/4884'},
 {id:'cables',number:'05',name:'Rear USB panel',role:'Three USB-C ports',color:'#c13833',anchor:'24_replaceable_rear_USB_panel',detail:'A replaceable rear panel: port A for the thermal board, port B for the controller, and a blanked port C for the optional RGB camera. Internal cable routes are indicative.'},
 {id:'radar',number:'06',name:'Radar bay (reserved)',role:'Space only, no module selected',color:'#c13833',anchor:'09_RADAR_RESERVATION_ONLY',detail:'A removable RF window and an adapter frame hold space for a radar module. No module has been chosen, so its size, frequency and sensing depth are unknown.'},
 {id:'metal',number:'07',name:'Metal-sensing coil',role:'Coil window + carrier',color:'#c09c5c',anchor:'11_coil_carrier',detail:'A coil carrier behind its own window on the underside. The traces shown are illustrative and the coil envelope is still to be designed; range and accuracy are unmeasured.'},
 {id:'tracking',number:'08',name:'Measuring roller',role:'Distance along the wall',color:'#4b4c48',anchor:'22_measuring_roller',detail:'An 18 mm roller on an axle with a magnet at one end, and space allowed for an AS5600 magnetic angle sensor to count its turns. Slip and calibration are unverified.'},
 {id:'fasteners',number:'09',name:'Underside screws',role:'Four M3 screws',color:'#8b9196',anchor:'25_underside_M3_43_-66',detail:'Four M3 screws close the shell from the underside.'},
];
/** Move each group and layer to its assembled position plus `amount` of its exploded offset (metres). */
export function explodeHardware(root:T.Object3D,amount:number){root.traverse(obj=>{if(obj.userData.partId||obj.userData.layer){const {assembled:a,explode:e}=obj.userData;obj.position.set(a[0]+e[0]*amount,a[1]+e[1]*amount,a[2]+e[2]*amount)}})}
