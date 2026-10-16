/**
 * @title Random Light Switching Local and Remote
 * @description This script is designed to be used with a Shelly PRO 4PM device to randomly switch on a random light on the local and remote devices.
 * @status production
 * @link https://github.com/SmartHomeForAll/Altavio_Scripts/Shelly/PRO_4PM/random_light_switching_local_remote.shelly.js
 * @author: Konrad Herba (konrad@altav.io)
 * @version: 1.0.0
 * @license: MIT
 */

////////////////////////////////////////////////////////////
// START OF SCRIPT CONFIGURATION
////////////////////////////////////////////////////////////

// CONFIGURE THE DEVICES AND RELAYS TO CONTROL
// The devices are configured as local or remote
// The relays are configured as the relay ID on the device
// The device IP is configured as the IP address of the device
// The relay ID is configured as the relay ID on the device
// The device IP is configured as the IP address of the device
let relays_to_control = [

  // local devices
  { device_ip: "local", relay_id: 0 },
  { device_ip: "local", relay_id: 1 },
  { device_ip: "local", relay_id: 2 },
  { device_ip: "local", relay_id: 3 }/* ,

  // remote devices
  { device_ip: "192.168.1.195", relay_id: 0 },
  { device_ip: "192.168.1.195", relay_id: 1 },
  { device_ip: "192.168.1.195", relay_id: 2 },

  { device_ip: "192.168.1.253", relay_id: 0 },
  { device_ip: "192.168.1.253", relay_id: 1 },

  { device_ip: "192.168.1.96", relay_id: 0 },
  { device_ip: "192.168.1.96", relay_id: 1 },
  { device_ip: "192.168.1.96", relay_id: 2 },
  { device_ip: "192.168.1.96", relay_id: 3 } */
];

let time_on = 5; // time in minutes to keep the light on

// How often to attempt a random light switch (minutes). Uses Timer.set — safe to Stop in Shelly UI.
let loop_interval_minutes = 5;

// Weekly schedule (Mon-Sun). Automation runs only during these time windows per day.
let active_schedule = {
mon: [
  { start: "08:00", end: "17:00" }
],
tue: [
  { start: "08:00", end: "17:00" }
],
wed: [
  { start: "08:00", end: "17:00" }
],
thu: [    
  { start: "08:00", end: "17:00" }
],
fri: [
  { start: "08:00", end: "14:00" }
],
sun: [
  { start: "09:30", end: "12:00" }
]
};

////////////////////////////////////////////////////////////
// END OF SCRIPT CONFIGURATION
////////////////////////////////////////////////////////////

// Maps Date.getDay() (0=Sun … 6=Sat) to active_schedule keys
let DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Format time as HH:MM:SS (mJS-safe — no toLocaleTimeString)
function formatTime(now) {
let h = now.getHours();
let m = now.getMinutes();
let s = now.getSeconds();
let hh = h < 10 ? "0" + h : "" + h;
let mm = m < 10 ? "0" + m : "" + m;
let ss = s < 10 ? "0" + s : "" + s;
return hh + ":" + mm + ":" + ss;
}

// Convert "HH:MM" to seconds since midnight (mJS-safe, no destructuring)
function timeToSec(t) {
if (!t || typeof t !== "string" || t.indexOf(":") < 0) {
  return 0;
}
let parts = t.split(":");
let h = Number(parts[0]);
let m = Number(parts[1]);
return h * 3600 + m * 60;
}

// True if nowSec falls within [startSec, endSec], including overnight windows
function isInTimeWindow(nowSec, startSec, endSec) {
if (startSec <= endSec) {
  return nowSec >= startSec && nowSec <= endSec;
}
return nowSec >= startSec || nowSec <= endSec;
}

function isWithinActiveSchedule() {
let now = new Date();
let dayKey = DAY_KEYS[now.getDay()];
let periods = active_schedule[dayKey];

if (!periods || periods.length === 0) {
  print("isWithinActiveSchedule: No active schedule for " + dayKey + ", light will not be switched on");
  return false;
}

let nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

for (let i = 0; i < periods.length; i++) {
  let startSec = timeToSec(periods[i].start);
  let endSec = timeToSec(periods[i].end);
  if (isInTimeWindow(nowSec, startSec, endSec)) {
    return true;
  }
}

return false;
} 

function switchOnRandomLight() {
let relays_to_control_copy = relays_to_control.slice();
let now = new Date();
print("switchOnRandomLight: Initial relay count: " + relays_to_control.length);

for (let i = 0; i < relays_to_control.length; i++) {
  if (!isWithinActiveSchedule()) {
    print("switchOnRandomLight: Current time is not within the active time period, light will not be switched on");
    print("switchOnRandomLight: Current time: " + formatTime(now));
    print("switchOnRandomLight: Current day of week: " + DAY_KEYS[now.getDay()]);
    return;
  }
  print("switchOnRandomLight: Current time is within the active time period");
  print("switchOnRandomLight: Current time: " + formatTime(now));
  print("switchOnRandomLight: Current day of week: " + DAY_KEYS[now.getDay()]);

  let randomIndex = Math.floor(Math.random() * relays_to_control_copy.length);
  let relay = relays_to_control_copy[randomIndex];
  print("switchOnRandomLight: Random index: " + randomIndex);
  print("switchOnRandomLight: Device IP: " + relay.device_ip + ", relay ID: " + relay.relay_id);

  print("switchOnRandomLight: Turning on the light");

  if (relay.device_ip == "local") {
    print("switchOnRandomLight: Switch.Set ON relay " + relay.relay_id);
    Shelly.call("Switch.Set", {id: relay.relay_id, 'on': true});

  } else {
    print("switchOnRandomLight: HTTP.Request ON " + relay.device_ip + " relay " + relay.relay_id);
    let rpcBody = {};
    rpcBody.id = relay.relay_id;
    rpcBody["on"] = true;
    let httpParams = {};
    httpParams.method = "POST";
    httpParams.url = "http://" + relay.device_ip + "/rpc/Switch.Set";
    httpParams.body = JSON.stringify(rpcBody);
    httpParams.timeout = 5;
    //Shelly.call("HTTP.Request", httpParams);
  }

  print("switchOnRandomLight: Waiting for " + time_on + " minutes to keep the light on");

/*     Timer.set(time_on * 60 * 1000, false, function() {
    print("switchOnRandomLight: turning OFF relay " + pickedId);
    if (pickedIp == "local") {
      //Shelly.call("Switch.Set", {"id": pickedId, "on": false});
    } else {
      let offBody = {};
      offBody.id = pickedId;
      offBody["on"] = false;
      let offHttp = {};
      offHttp.method = "POST";
      offHttp.url = "http://" + pickedIp + "/rpc/Switch.Set";
      offHttp.body = JSON.stringify(offBody);
      offHttp.timeout = 5;
      //Shelly.call("HTTP.Request", offHttp);
    }
  }); */

  relays_to_control_copy.splice(randomIndex, 1);
}

return;
}

function startScript() {
print("startScript: Script started");
for (let i = 0; i < 3; i++) {
  switchOnRandomLight();
}
}

////////////////////////////////////////////////////////////
// END OF FUNCTIONS
////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////
// RUN THE SCRIPT
////////////////////////////////////////////////////////////
startScript();
