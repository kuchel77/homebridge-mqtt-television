const mqtt = require("mqtt");
const ping = require("ping");
const fs = require('fs');
const sys = require('sys');
    exec = require('child_process').exec;
var Service, Characteristic, VolumeCharacteristic;



module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory(
    "homebridge-mqtt-television",
    "television",
    television
  );
};

function television(log, config) {
  this.log = log;
  this.config = config;
  this.name = config["name"];
  this.host = config["pinghost"];
  var that = this;
  var mqttCfg = config["mqtt"];
  var mqttHost = "mqtt://" + (mqttCfg && mqttCfg['server'] || "127.0.0.1");
  var mqttPrefix = mqttCfg && mqttCfg['prefix'] || "homebridge";
  var mqttUsername = mqttCfg && mqttCfg['username'] || "mqtt";
  var mqttPassword = mqttCfg && mqttCfg['password'] || "mqtt";
  var mqttOptions = {
        clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
        username: mqttUsername,
        password: mqttPassword
  };
  
  this.mqttTopic = {
        "abc": mqttPrefix + "/send",
        "bca": mqttPrefix + "/received"
        
    };
    
  try {
        this.mqttClient = mqtt.connect(mqttHost, mqttOptions);
        that.mqttClient.subscribe(that.mqttTopic['bca']);
        that.mqttClient.subscribe(that.mqttTopic['abc']);
    } catch(e) {
    };

  this.enabledServices = [];

  this.power = 0;
  this.mode = 1;
  
  this.screenName = config.input["screenName"];
  this.HdmiName1 = config.input["HdmiName1"];
  this.HdmiName2 = config.input["HdmiName2"];
  this.HdmiName3 = config.input["HdmiName3"];
  this.HdmiName4 = config.input["HdmiName4"];
  this.on_off = config.remote["on_off"];
  this.powerModeSelection = config.remote["powerModeSelection"];
  this.txt = config["txt"];
  
  const inputMap = {
  1: config.input["home_screen"],
  2: config.input["hdmi1"],
  3: config.input["hdmi2"],
  4: config.input["hdmi3"],
  5: config.input["hdmi4"]
  };

  const tvRemoteMap = {
  4: config.remote["arrow_up"],
  7: config.remote["arrow_right"],
  5: config.remote["arrow_down"],
  6: config.remote["arrow_left"],
  8: config.remote["select"],
  11: config.remote["play_pause"],
  9: config.remote["back"],
  //10: '3,32A6D02F,32', // TODO....
  15: config.remote["information"]// TODO...
  };

  const volumeMap = {
  0: config.volume["increment"],
  1: config.volume["decrement"]
  };

  this.tvService = new Service.Television(this.name, "Television");

  this.tvService.setCharacteristic(Characteristic.ConfiguredName, this.name);

  this.tvService.setCharacteristic(
    Characteristic.SleepDiscoveryMode,
    Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
  );
  var power = this.tvService
    .getCharacteristic(Characteristic.Active);

  power
    .on('set', (value, callback) => {
        var valueStr = this.on_off.toString();
        if (power.value == value) {
           callback(null);
        } else {
           this.mqttClient.publish(this.mqttTopic['abc'], valueStr);
           callback(null);
       }
    });
    
  if (this.host) { 
  setInterval(() => {
        ping.promise.probe(this.host)
            .then(function (res, err) {
            this.power = res.alive ? 1 : 0;
            console.log("power", this.power);
            power.updateValue(this.power);
            if (this.power == 0) {
               var txt = "echo '1' > " + this.txt;
               exec(txt); 
            };             
        });    
  }, 10000);
  };
  
  this.tvService.setCharacteristic(Characteristic.ActiveIdentifier, 1);

  var activeIdentifier = this.tvService
    .getCharacteristic(Characteristic.ActiveIdentifier);
  activeIdentifier
      .on('set', (value, callback) => {
        console.log("value", value);
        var txt =  "echo " + value + " > " + this.txt;
        exec(txt);
        var valueStr = inputMap[value].toString();
        this.mqttClient.publish(this.mqttTopic['abc'], valueStr);
        callback(null);
    })
    .on('get', function(callback) {
        var command = "cat " + this.txt";
        var stdout = "none";  
           exec(command, function (error, stdout, stderr) {
           var Value=stdout.trim().toLowerCase();
           callback(null, Value);
        });
    });
  
  this.mqttClient.on('message', (topic, message) => {
      if(topic == that.mqttTopic['bca']) {
          var stat = message.toString();
          //console.log("stat", stat);
          if (stat === config.input["home_screen"]) {
              this.mode = 1;
              activeIdentifier.updateValue(1);
              var txt = "echo '1' > " + this.txt;
              console.log(txt);
              exec(txt);
          } else if (stat === config.input["HdmiName1"]) {
              if (this.HdmiName1) {
              this.mode = 2;
              activeIdentifier.updateValue(2);
              var txt = "echo '2' > " + this.txt;
               exec(txt);
              }
          } else if (stat === config.input["HdmiName2"]) {
              if (this.HdmiName2) {
              this.mode = 3;
              activeIdentifier.updateValue(3);
              var txt = "echo '3' > " + this.txt;
              console.log(txt);
              exec(txt);
              }
          } else if (stat === config.input["HdmiName3"]) {
              if (this.HdmiName3) {
              this.mode = 4;
              activeIdentifier.updateValue(4);
              var txt = "echo '4' > " + this.txt;
              console.log(txt);
              exec(txt);
              }
          } else if (stat === config.input["HdmiName4"]) {
              if (this.HdmiName4) {
              this.mode = 5;
              activeIdentifier.updateValue(5);
              var txt = "echo '4' > " + this.txt;
              exec(txt);
              }
          } else if (stat === config.remote["on_off"]) {
              if (!this.host) {
                if (power.value == 0) {
                    power.updateValue(1);
                } else {
                   power.updateValue(0);
                }                   
              }
          }
      } 
  });
  
  var powerModeSelection = this.tvService
      .getCharacteristic(Characteristic.PowerModeSelection);
      
  powerModeSelection
    .on('set', (value, callback) => {
        var valueStr = this.powerModeSelection.toString();
        this.mqttClient.publish(this.mqttTopic['abc'], valueStr);
        callback(null);
    });

  var remoteKey = this.tvService
    .getCharacteristic(Characteristic.RemoteKey);
    //.on("set", this.setInput.bind(this, tvRemoteMap));
    
  remoteKey
     .on('set', (value, callback) => {
        var valueStr = tvRemoteMap[value].toString();
        this.mqttClient.publish(this.mqttTopic['abc'], valueStr);
        callback(null);
    }); 

  this.inputHDMI1Service = createInputSource(this.screenName, this.screenName, 1);
  if (this.HdmiName1) {
  this.inputHDMI2Service = createInputSource(this.HdmiName1, this.HdmiName1, 2);
  };
  if (this.HdmiName2) {
  this.inputHDMI3Service = createInputSource(this.HdmiName2, this.HdmiName2, 3);
  };
  if (this.HdmiName3) {
  this.inputHDMI4Service = createInputSource(this.HdmiName3, this.HdmiName3, 4);
  };
  if (this.HdmiName4) {
  this.inputNetflixService = createInputSource(
    this.HdmiName4,
    this.HdmiName4,
    5,
    Characteristic.InputSourceType.APPLICATION
  );
  };

  this.tvService.addLinkedService(this.inputHDMI1Service);
  if (this.HdmiName1) {
  this.tvService.addLinkedService(this.inputHDMI2Service);
  };
  if (this.HdmiName2) {
  this.tvService.addLinkedService(this.inputHDMI3Service);
  };
  if (this.HdmiName3) {
  this.tvService.addLinkedService(this.inputHDMI4Service);
  };
  if (this.HdmiName4) {
  this.tvService.addLinkedService(this.inputNetflixService);
  };

  this.speakerService = new Service.TelevisionSpeaker(
    this.name + " Volume",
    "volumeService"
  );

  this.speakerService
    .setCharacteristic(Characteristic.Active, Characteristic.Active.ACTIVE)
    .setCharacteristic(
      Characteristic.VolumeControlType,
      Characteristic.VolumeControlType.ABSOLUTE
    );

  var speaker = this.speakerService
    .getCharacteristic(Characteristic.VolumeSelector);
    //.on("set", this.setInput.bind(this, volumeMap));
  speaker
    .on('set', (value, callback) => {
        var valueStr = volumeMap[value].toString();
        this.mqttClient.publish(this.mqttTopic['abc'], valueStr);
        callback(null);
    });

  this.tvService.addLinkedService(this.speakerService);

  this.enabledServices.push(this.tvService);
  this.enabledServices.push(this.speakerService);
  this.enabledServices.push(this.inputHDMI1Service);
  if (this.HdmiName1) {
  this.enabledServices.push(this.inputHDMI2Service);
  };
  if (this.HdmiName2) {
  this.enabledServices.push(this.inputHDMI3Service);
  };
  if (this.HdmiName3) {
  this.enabledServices.push(this.inputHDMI4Service);
  };
  if (this.HdmiName4) {
  this.enabledServices.push(this.inputNetflixService);
  }
  

}



television.prototype.getServices = function() {
  return this.enabledServices;
};


function createInputSource(
  id,
  name,
  number,
  type = Characteristic.InputSourceType.HDMI
) {
  var input = new Service.InputSource(id, name);
  input
    .setCharacteristic(Characteristic.Identifier, number)
    .setCharacteristic(Characteristic.ConfiguredName, name)
    .setCharacteristic(
      Characteristic.IsConfigured,
      Characteristic.IsConfigured.CONFIGURED
    )
    .setCharacteristic(Characteristic.InputSourceType, type);
  return input;
}
