#!/usr/bin/env node

const logging = require('yalm')
const config = require(process.argv[2] || './config.json')

var exec = require('child_process').exec
import { PollingWatchKind } from "typescript"
import {bridgeToMqttBroker} from "./MqttBroker"

logging.setLevel(config.logLevel)

logging.info('apcusbd MQTT pusher starting...')

var cacheValues = {}; // keep values cached

var bdgMqtt = new bridgeToMqttBroker(config.mqttBroker.url, config.mqttBroker.topic, config.mqttBroker.subscriptions);

function executeCmd(command:string, callback:any)
{

    exec( command, function (execption, stdout, stderror)
                   {
                       if (execption)
                           callback(execption);
                       else if (stderror)
                                callback(stderror);
                            else if (stdout)
                                     callback(null,stdout);
                                 else callback(null, null);
                   }
    );
}

function pollData()
{

    var parameters = ['upsname', 'serialno', 'status', 'linev', 'linefreq', 'loadpct', 'battv', 'bcharge'];

    executeCmd('apcaccess.cmd', function(execption, response) {
      if ( execption )
      {
        logging.error(execption);
      }
      else
      {
        //logging.debug(response);
        var lines = response.trim().split("\n");
        
        lines.forEach(function (line){

          var tmpStr : string = line.split(' : ');
          var key = tmpStr[0].toLowerCase();
          var value = tmpStr[1];

          key = key.replace(/(^\s+|\s+$)/g, '');

          if ( parameters.indexOf(key) > -1 )
          {
            value = value.replace(/(^\s+|\s+$)/g, '');

            if ( cacheValues[key] != value ) 
            {
                cacheValues[key] = value;
                logging.debug("send " + key + " = " + value + " to MQTT Broker");
                bdgMqtt.sendToMqttBroker(config.mqttBroker.topic+"/"+config.devicename+"/"+key,value)
            }
          }
        });
      }
      setTimeout(pollData, config.pollInterval);
    })
}

pollData();
