/**
 * @title Motion Triggered Dimming 
 * @description This script is designed to be used with a Shelly Dimmer Gen3 device and a Shelly BLU Motion
 * device to activate the dimmer during motion detection and set the brightness to a predefined value.
 * @status production
 * @link https://github.com/SmartHomeForAll/Altavio_Scripts/Shelly/Dimmer_Gen3/motion_triggered_dimming.shelly.js
 * @author: Konrad Herba (konrad@altav.io)
 * @version: 1.0.0
 * @license: MIT
 */

/******************* START CHANGE HERE *******************/
let CONFIG = {
  // When set to true, debug messages will be logged to the console
  debug: false,

  // When set to true the scan will be active, otherwise it will be passive. 
  // Active scan means the scanner will ping back the Bluetooth device to receive all its data, but it will drain the battery faster
  active: false,

    /* ****************************************************************************************
     * *************** THIS IS WHERE YOU NEED TO UPDATE AUTOMATION CONFIGURATION *************
     * ****************************************************************************************/
    // THIS ATTRIBUTE TELLS WHEN THE AUTOMATION IS ALLOWED TO RUN. OPTIONS ARE: 
    // "NIGHT", "SPECIFIED" or "ALWAYS". 
    // "NIGHT" is defined as a period from down to dusk
    // "SPECIFIED" uses below specifiedTimes, for defining activation hours (time interval)
    // "ALWAYS" means that the motion detected dimming runs 24/7 without any limitations 
    // it is intended to be used as a diagnostic mode
    activationTimes: "ALWAYS", // "NIGHT", "SPECIFIED" or "ALWAYS"
  
    // SPECIFIED TIMES FOR THE AUTOMATION TO RUN 
    // This is the time period when automation is active. Outside of specified hours it becomes idle
    specifiedTimes: [
      {
        start: "23:00",
        end: "07:00"
      }
    ],
    
    // PASTE YOUR SHELLY BLU MOTION DETECTOR MAC BELOW 
    // MAC is a unique device identifier and can be found in device's Settings → Device information
    allowedMacAddresses: [
      "94:B2:16:08:8D:CE" // devices with these mac addresses will be used to trigger the dimmer
    ],
  
    // LIGHTS ON TIME PERIOD (in seconds) 
    // This is the time interval for which lights will stay on, dimmed to below defined value
    lightsOnTimePeriod: 120, // seconds
  
    // CONFIGURE THE BRIGHTNESS (in percentage) TO SET AFTER MOTION DETECTION
    // This is the illuminance/lights "intensivity" when turned on. 
    lightBrightness: 3, // percentage value of the brightness to set after motion 
    
    // SHELLY BLU MOTION ROOM ILLUMINANCE THRESHOLD TO TRIGGER THE DIMMER
    // If the room illuminance level is above this value, the dimmer will not be activated.
    // This is to avoid triggering the dimmer when the room is lighted up by other sources
    illuminanceThreshold: 10, // illuminance level in lux to trigger the dimmer after motion detection

  /**
   * In the below method contains automation logic implementation. 
   * It is called when motion is reported from the filtered Shelly BLU Motion devices.
   * @param {Boolean} motion true, when there is a motion, false otherwise. 
   * @param {Object} eventData Object, containing all parameters received from the Shelly BLU Motion device. Example: {"encryption":false,"BTHome_version":2,"pid":16,"battery":100,"illuminance":109,"motion":1,"button":1,"rssi":-53,"address":"aa:bc:12:34:56:78"} 
   */
  motionHandler: function (motion, eventData) {
    // Initialization
    let allowed = false;

      // Get the current time in seconds since midnight
      let now = new Date();
      let nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      // Convert HH:MM → seconds
      function timeToSec(t) {
        if (!t || typeof t !== "string") {
          console.log("Invalid time format:", t);
          return 0;
        }
      
        if (t.indexOf(":") < 0) {
          console.log("Invalid time format:", t);
          return 0;
        }
      
        let parts = t.split(":");
        let h = Number(parts[0]);
        let m = Number(parts[1]);
      
        return h * 3600 + m * 60;
      }
   
      // Convert SPECIFIED times once
      let startSec = timeToSec(CONFIG.specifiedTimes[0].start);
      let endSec   = timeToSec(CONFIG.specifiedTimes[0].end);

      console.log("Logic triggered at time:", now.getHours(), ":", now.getMinutes(), ":", now.getSeconds());
      
            // Check if the automation is allowed to run during night
      if (CONFIG.activationTimes === "NIGHT") {

        // Get sunrise/sunset from system component
        let sys = Shelly.getComponentStatus("sys");
        let sunriseSec = sys.sunrise;   // seconds since midnight
        let sunsetSec  = sys.sunset;    // seconds since midnight

        allowed = (!((nowSec > sunriseSec ) && (nowSec < sunsetSec))) 
          && (CONFIG.illuminanceThreshold > eventData.illuminance);
        if (!allowed) {
            console.log(
            "It is either outside the night window (sunset→sunrise) or illuminance is above the threshold",
            CONFIG.illuminanceThreshold,
            "lux)"
          return;
        }
      }
      // Check if the automation is allowed to run based on the activation times and illuminance threshold during specified times 
      else if (CONFIG.activationTimes === "SPECIFIED") {
        allowed = !((nowSec > endSec) && (nowSec < startSec))
          && (CONFIG.illuminanceThreshold > eventData.illuminance);
        if (!allowed) {
          console.log("Motion detected, but not allowed to run");
          console.log(
            "It is either outside the specified times window (start→end) (start:",
            CONFIG.specifiedTimes[0].start,
            "end:",
            CONFIG.specifiedTimes[0].end,
            ") or illuminance is below the threshold (",
            CONFIG.illuminanceThreshold,
            "lux)"
          );
          return;
        }
      }
      else if (CONFIG.activationTimes === "ALWAYS"){
        allowed = true
      }
      console.log(
        "Motion detected → Motion Triggered Dimming automation is allowed to run"
      );

      // Get dimmer output state
      let lightsOn = Shelly.getComponentStatus("Light:0").output
              
      if (!lightsOn && allowed && motion) {
        console.log ("Turning on lights to specified brightnes", 
          CONFIG.lightBrightness, "for", 
          CONFIG.lightsOnTimePeriod, "seconds")
        Shelly.call("Light.Set", {'id': 0, 'brightness': CONFIG.lightBrightness,'on': true})
      
        Timer.set(CONFIG.lightsOnTimePeriod * 1000, false, function () {
          console.log(
            "Turning off the dimmer after the defined time period:",
            CONFIG.lightsOnTimePeriod,
            "seconds"
          );
          Shelly.call("Light.Set", { id: 0, 'on': false });
        });
        
      }
      else {
        if(lightsOn) {
          console.log("Automation has done nothing. Lights were ON");
        }
        if(!allowed) {
          console.log("Automation has done nothing. Automation logic prevented execution");
        }
      }
  },

  /**
   * Called when illuminance is reported from the filtered Shelly BLU Motion devices.
   * @param {Number} illuminance Current illuminance value.
   * @param {Object} eventData Object, containing all parameters received from the Shelly BLU Motion device. Example: {"encryption":false,"BTHome_version":2,"pid":16,"battery":100,"illuminance":109,"motion":1,"button":1,"rssi":-53,"address":"aa:bc:12:34:56:78"}
   */
  illuminanceHandler: function (illuminance, eventData) {
  },

  /**
   * Called when packet from filtered Shelly BLU Motion devices is received.
   * @param {Object} eventData Object, containing all parameters received from the Shelly BLU Motion device. Example: {"encryption":false,"BTHome_version":2,"pid":16,"battery":100,"illuminance":109,"motion":1,"button":1,"rssi":-53,"address":"aa:bc:12:34:56:78"}
   */
  onStatusUpdate: function (eventData) {
    // Do nothing at the moment.
  }
};
/******************* STOP CHANGE HERE *******************/

const ALLTERCO_MFD_ID_STR = "0ba9";
const BTHOME_SVC_ID_STR = "fcd2";

const uint8 = 0;
const int8 = 1;
const uint16 = 2;
const int16 = 3;
const uint24 = 4;
const int24 = 5;

// The BTH object defines the structure of the BTHome data
const BTH = {
  0x00: { n: "pid", t: uint8 },
  0x01: { n: "battery", t: uint8, u: "%" },
  0x02: { n: "temperature", t: int16, f: 0.01, u: "tC" },
  0x03: { n: "humidity", t: uint16, f: 0.01, u: "%" },
  0x05: { n: "illuminance", t: uint24, f: 0.01 },
  0x21: { n: "motion", t: uint8 },
  0x2d: { n: "window", t: uint8 },
  0x2e: { n: "humidity", t: uint8, u: "%" },
  0x3a: { n: "button", t: uint8 },
  0x3f: { n: "rotation", t: int16, f: 0.1 },
  0x45: { n: "temperature", t: int16, f: 0.1, u: "tC" },
};

function getByteSize(type) {
  if (type === uint8 || type === int8) return 1;
  if (type === uint16 || type === int16) return 2;
  if (type === uint24 || type === int24) return 3;
  //impossible as advertisements are much smaller;
  return 255;
}

// functions for decoding and unpacking the service data from Shelly BLU devices
const BTHomeDecoder = {
  utoi: function (num, bitsz) {
    const mask = 1 << (bitsz - 1);
    return num & mask ? num - (1 << bitsz) : num;
  },
  getUInt8: function (buffer) {
    return buffer.at(0);
  },
  getInt8: function (buffer) {
    return this.utoi(this.getUInt8(buffer), 8);
  },
  getUInt16LE: function (buffer) {
    return 0xffff & ((buffer.at(1) << 8) | buffer.at(0));
  },
  getInt16LE: function (buffer) {
    return this.utoi(this.getUInt16LE(buffer), 16);
  },
  getUInt24LE: function (buffer) {
    return (
      0x00ffffff & ((buffer.at(2) << 16) | (buffer.at(1) << 8) | buffer.at(0))
    );
  },
  getInt24LE: function (buffer) {
    return this.utoi(this.getUInt24LE(buffer), 24);
  },
  getBufValue: function (type, buffer) {
    if (buffer.length < getByteSize(type)) return null;
    let res = null;
    if (type === uint8) res = this.getUInt8(buffer);
    if (type === int8) res = this.getInt8(buffer);
    if (type === uint16) res = this.getUInt16LE(buffer);
    if (type === int16) res = this.getInt16LE(buffer);
    if (type === uint24) res = this.getUInt24LE(buffer);
    if (type === int24) res = this.getInt24LE(buffer);
    return res;
  },

  // Unpacks the service data buffer from a Shelly BLU device
  unpack: function (buffer) {
    //beacons might not provide BTH service data
    if (typeof buffer !== "string" || buffer.length === 0) return null;
    let result = {};
    let _dib = buffer.at(0);
    result["encryption"] = _dib & 0x1 ? true : false;
    result["BTHome_version"] = _dib >> 5;
    if (result["BTHome_version"] !== 2) return null;
    //can not handle encrypted data
    if (result["encryption"]) return result;
    buffer = buffer.slice(1);

    let _bth;
    let _value;
    while (buffer.length > 0) {
      _bth = BTH[buffer.at(0)];
      if (typeof _bth === "undefined") {
        console.log("BTH: Unknown type");
        break;
      }
      buffer = buffer.slice(1);
      _value = this.getBufValue(_bth.t, buffer);
      if (_value === null) break;
      if (typeof _bth.f !== "undefined") _value = _value * _bth.f;

      if (typeof result[_bth.n] === "undefined") {
        result[_bth.n] = _value;
      }
      else {
        if (Array.isArray(result[_bth.n])) {
          result[_bth.n].push(_value);
        }
        else {
          result[_bth.n] = [
            result[_bth.n],
            _value
          ];
        }
      }

      buffer = buffer.slice(getByteSize(_bth.t));
    }
    return result;
  },
};

function onReceivedPacket(data) {
  if (CONFIG._processedMacAddresses !== null) {
    if (CONFIG._processedMacAddresses.indexOf(data.address) < 0) {
      console.log(["Received event from", data.address, "outside of the allowed addresses"], "Info");
      return;
    }
  }

  if (
    typeof CONFIG.motionHandler === "function" &&
    typeof data.motion !== "undefined"
  ) {
    CONFIG.motionHandler(data.motion === 1, data);
    console.log("INFO: Motion handler called");
  }

  if (
    typeof CONFIG.illuminanceHandler === "function" &&
    typeof data.illuminance !== "undefined"
  ) {
    CONFIG.illuminanceHandler(data.illuminance, data);
    console.log("INFO: Illuminance handler called");
  }

  if (typeof CONFIG.onStatusUpdate === "function") {
    CONFIG.onStatusUpdate(data);
    console.log("INFO: New status update");
  }
}

//saving the id of the last packet, this is used to filter the duplicated packets
let lastPacketId = 0x100;

// Callback for the BLE scanner object
function BLEScanCallback(event, result) {
  //exit if not a result of a scan
  if (event !== BLE.Scanner.SCAN_RESULT) {
    return;
  }

  //exit if service_data member is missing
  if (
    typeof result.service_data === "undefined" ||
    typeof result.service_data[BTHOME_SVC_ID_STR] === "undefined"
  ) {
    return;
  }

  let unpackedData = BTHomeDecoder.unpack(
    result.service_data[BTHOME_SVC_ID_STR]
  );

  //exit if unpacked data is null or the device is encrypted
  if (
    unpackedData === null ||
    typeof unpackedData === "undefined" ||
    unpackedData["encryption"]
  ) {
    console.log("Encrypted devices are not supported", "Error");
    return;
  }

  //exit if the event is duplicated
  if (lastPacketId === unpackedData.pid) {
    return;
  }

  lastPacketId = unpackedData.pid;

  unpackedData.rssi = result.rssi;
  unpackedData.address = result.addr;

  onReceivedPacket(unpackedData);
}

// Initializes the script and performs the necessary checks and configurations
function init() {
  //exit if can't find the config
  if (typeof CONFIG === "undefined") {
    console.log("Error: Undefined config");
    return;
  }

  //get the config of ble component
  let BLEConfig = Shelly.getComponentConfig("ble");

  //exit if the BLE isn't enabled
  if (!BLEConfig.enable) {
    console.log(
      "Error: The Bluetooth is not enabled, please enable it from settings"
    );
    return;
  }

  //check if the scanner is already running
  if (BLE.Scanner.isRunning()) {
    console.log("Info: The BLE gateway is running, the BLE scan configuration is managed by the device");
  }
  else {
    //start the scanner
    let bleScanner = BLE.Scanner.Start({
      duration_ms: BLE.Scanner.INFINITE_SCAN,
      active: CONFIG.active
    });

    if (!bleScanner) {
      console.log("Error: Can not start new scanner");
    }
  }

  if (
    typeof CONFIG.allowedMacAddresses !== "undefined"
  ) {
    if (CONFIG.allowedMacAddresses !== null) {
      // Process configured mac addresses all to lower case and remove duplicates. 
      CONFIG._processedMacAddresses =
        CONFIG
          .allowedMacAddresses
          .map(function (mac) { return mac.toLowerCase(); })
          .filter(function (value, index, array) { return array.indexOf(value) === index; })
    }
    else {
      CONFIG._processedMacAddresses = null;
    }
  }

  //subscribe a callback to BLE scanner
  BLE.Scanner.Subscribe(BLEScanCallback);
}

init();