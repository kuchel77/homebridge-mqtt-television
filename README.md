# homebridge-mqtt-television

# Capture remote control code
You can control the remote control and view the captured remote control code in the web interface.
![](https://github.com/hassbian-ABC/homebridge-mqtt-television/blob/master/images/test.png)

Required: 
    input: home_screen
Optional:
    input: hdmi1, hdmi2, hdmi3, hdmi4
    pinghost
    

```
{
    "bridge": {
        "name": "mqttTV",
        "username": "B1:07:FA:91:FA:7E",
        "port": 52010,
        "pin": "123-11-678"
    },
    "accessories": [
        {
            "accessory": "television",
            "name": "LETV",
            "pinghost": "10.0.0.45",
            "mqtt": {
               "server": "10.0.0.50:1883",
               "prefix": "homebridge",
               "username": "pi",
               "password": "raspberry"
            },
            "input": {
                "screenName": "home_screen",
                "home_screen": "3,32A66897,32",
                "HdmiName1": "Hdmi 1",
                "hdmi1": "3,32A66897,32",
                "HdmiName2": "Hdmi 2",
                "hdmi2": "3,32A66897,32",
                "HdmiName3": "Hdmi 3",
                "hdmi3": "3,32A66897,32",
                "HdmiName4": "Hdmi 4",
                "hdmi4": "3,32A66897,32"
            },
            "remote": {
                "on_off": "3,32A66897,32",
                "arrow_up": "3,32A66897,32",
                "arrow_right": "3,32A66897,32",
                "arrow_down": "3,32A66897,32",
                "arrow_left": "3,32A66897,32",
                "select": "3,32A66897,32",
                "play_pause": "3,32A66897,32",
                "back": "3,32A66897,32",
                "information": "3,32A66897,32",
                "powerModeSelection": "3,32A66897,32"
            },
            "volume": {
                "increment": "3,32A66897,32",
                "decrement": "3,32A66897,32"
            }
        }
    ]
}
```
