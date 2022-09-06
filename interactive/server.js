const storageMethods = require("../lib/storageMethods");
const textExtractorMethods = require("../lib/textExtractorMethods");
const extractor = require("../lib/extractor");
const config = require("../config/config");
const util = require("../lib/util");
const clipboardy = require('clipboardy');

let BASE = storageMethods.getTranslationFileAsData(config.ENGLISH_BASE_LANGUAGE_PATH);


const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let AUTO_COMMIT = true;
let ACTIVE_CONNECTION = null;
let ENABLED = false;
let PAUSED = false;
let ALLOW_VARIABLE_FIRST = false;

let activeFilename = null;
let activeFilenameProcessed = null;
let processedClipboard = null;

setInterval(() => {
  let clipboardData = clipboardy.readSync();
  if (!ENABLED || PAUSED) { processedClipboard = clipboardData; return; }
  if (!(ACTIVE_CONNECTION)) { console.log(new Date(), "NOT CONNECTED"); return; }
  if (clipboardData !== processedClipboard) {
    processedClipboard = clipboardData;
    if (activeFilename) {
      if (clipboardData !== '') {
        let initial  = [":"," "];
        let trailing = [",",";"];

        let removedInitials = {};
        let removedTrailing = {};

        let stringToProcess = clipboardData;
        if (BASE[activeFilenameProcessed] === undefined) {
          BASE[activeFilenameProcessed] = {}
        }

        for (let i = 0; i < initial.length; i++) {
          let str = initial[i];
          if (stringToProcess[0] === str) {
            stringToProcess = stringToProcess.substr(1);
            removedInitials[str] = true;
          }
        };
        for (let i = 0; i < trailing.length; i++) {
          let str = trailing[i];
          if (stringToProcess[stringToProcess.length-1] === str) {
            stringToProcess = stringToProcess.substr(0,stringToProcess.length-1);
            removedTrailing[str] = true;
          }
        };

        if (stringToProcess[0] !== '"' && stringToProcess[0] !== "'" && ALLOW_VARIABLE_FIRST === false)  {
          console.log("invalid selection")
          return
        }
        console.log("valid selection")

        let extractData = extractor.extractAndConvert(stringToProcess, true);
        console.log(extractData)
        let textKey = util.prepareTextKey(BASE, activeFilenameProcessed, extractData.pureText);
        let functionCallVariables = util.getFunctionCall(extractData)
        let functionCall = 'lang("' + textKey + '"';

        if (functionCallVariables.length !== 2) {
          functionCall += ", " + functionCallVariables.substr(1);
        }
        else {
          functionCall += ")"
        }


        for (let i = initial.length - 1; i >= 0; i--) {
          let str = initial[i];
          if (removedInitials[str]) { functionCall = str + functionCall; }
        };
        for (let i = trailing.length - 1; i >= 0; i--) {
          let str = trailing[i];
          if (removedTrailing[str]) { functionCall = functionCall + str; }
        };

        BASE[activeFilenameProcessed][textKey] = textExtractorMethods.wrap(extractData.text);
        clipboardy.writeSync(functionCall);
        if (ACTIVE_CONNECTION) {
          ACTIVE_CONNECTION.send(JSON.stringify({
            type: "processed",
            filename: activeFilename,
            original: stringToProcess,
            replaced: functionCall
          }));
        }
        if (AUTO_COMMIT) {
          storageMethods.stringifyAndStore(BASE, config.ENGLISH_BASE_LANGUAGE_PATH);
          console.log("Store changes!")
        }

        processedClipboard = functionCall;
        return
      }
    }
    else {
      let contentArray = clipboardData.split(".");
      if (contentArray[contentArray.length-1] === "ts" || contentArray[contentArray.length-1] === "tsx") {
        activeFilename = clipboardData;
        contentArray.pop()
        activeFilenameProcessed = contentArray.join()
        console.log("New file selected", activeFilename, activeFilenameProcessed)
        if (ACTIVE_CONNECTION) {
          ACTIVE_CONNECTION.send(JSON.stringify({type: "newFile", filename: activeFilename}));
        }
      }
    }
  }
  processedClipboard = clipboardData;
}, 100);

wss.on('connection', function connection(ws) {
  ACTIVE_CONNECTION = ws;
  console.log(new Date(), "CONNECTED")
  ws.on('message', function incoming(data) {
    try {
      let message = JSON.parse(data);
      handleMessage(message)
    }
    catch(err) {
      console.log('invalid message:', err);
    }
  });
});

function autoExtractFile() {
  if (activeFilename) {
    console.log(activeFilename)
  }
  else {
    console.log("NO FILE SELECTED")
  }
}

function handleMessage(messageObj) {
  if (messageObj && !messageObj.type) { console.log("invalid message type missing", type); }

  switch (messageObj.type) {
    case 'setEnabled':
      console.log("SETTING ENABLED", messageObj.value)
      ENABLED = messageObj.value;
      if (!ENABLED) {
        activeFilenameProcessed = null;
        activeFilename = null
      }
      break;
    case 'setPaused':
      console.log("SETTING PAUSED", messageObj.value)
      PAUSED = messageObj.value;
      break;
    case 'reset':
      console.log("RESET", messageObj.value)
      activeFilenameProcessed = null;
      activeFilename = null
      break;
    case 'setAutoCommit':
      AUTO_COMMIT = messageObj.value;
      break;
    case 'autoExtractFile':
      autoExtractFile()
      break;
    case 'setAllowVarFirst':
      console.log("setAllowVarFirst", messageObj.value)
      ALLOW_VARIABLE_FIRST = messageObj.value;
      break;
    case 'commit':
      storageMethods.stringifyAndStore(BASE,pathToBaseLanguageFile);
      console.log("Store changes!")
      break;
  }

}