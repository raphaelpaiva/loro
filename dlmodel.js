const shell = require('shelljs');
const path  = require('path');
const fs    = require('fs');
const NODE_MODULES_MODELS_PATH = require('whisper-node/dist/constants').NODE_MODULES_MODELS_PATH;

function downloadModel(modelName) {
  try {
    
    const modelPath = path.resolve(__dirname, NODE_MODULES_MODELS_PATH);
    console.log('cd into', modelPath);
    shell.cd(modelPath);
    // ensure running in correct path
    if (!shell.which("./download-ggml-model.sh")) {
      throw "whisper-node downloader is not being run from the correct path! cd to project root and run again."
    }

    // default is .sh
    let scriptPath = "./download-ggml-model.sh"
    // windows .cmd version
    if(process.platform === 'win32') scriptPath = "download-ggml-model.cmd";

    shell.exec(`${scriptPath} ${modelName}`);

    // TODO: add check in case download-ggml-model doesn't return a successful download.
    // to prevent continuing to compile; that makes it harder for user to see which script failed.

    console.log("[whisper-node] Attempting to compile model...");

    // move up directory, run make in whisper.cpp
    shell.cd(path.resolve(modelPath, "../"));
    // this has to run in whichever directory the model is located in??
    if (process.platform === 'darwin' && process.arch === 'arm64') {
      shell.exec("UNAME_M=arm64 UNAME_p=arm LLAMA_NO_METAL=1 make");
    } else {
      shell.exec("make");
    }
  
  } catch (error) {
    throw error;
  }
}

function loadConfig(filePath) {
  const defaultConf = {
    "whisperOptions": {
      "modelName": "small"
    }
  };

  
  const confFromFile = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  return {...defaultConf, ...confFromFile};
}

const conf = loadConfig(path.resolve(__dirname, 'loro.json'));

downloadModel(conf.whisperOptions.modelName);
