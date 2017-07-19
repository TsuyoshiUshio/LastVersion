import * as storage from "azure-storage";
import tl = require('vsts-task-lib/task');


let connectionString = tl.getInput("connectionString", true);
let versionEnv = tl.getInput("versionEnv", true);
let method = tl.getInput("method", true);

const containerName = 'release';
const blobName = "lastversion.txt";


let blobService = storage.createBlobService(connectionString);

function createBlobService(): Promise<storage.BlobService> {
    return new Promise<storage.BlobService> ((resolve, reject)=> {
blobService.createContainerIfNotExists(containerName, function (error, result, response) {
    if (!error) {
        tl.debug("container created or exist");
        resolve(blobService);
        
    } else {
        tl.debug(error.message);
        reject(error);
    }
    })

});
}


function setLastVersionToEnv(blobService: storage.BlobService) {
    blobService.getBlobToText(containerName, blobName, function (error, result) {
        if (!error) {
            tl.debug("result: " + result);
            let lastVersionVariable = "LAST_" + versionEnv;
            tl.setVariable(lastVersionVariable, result);
            tl.debug(`${lastVersionVariable} has been set to ${result}`);
        } else {
            tl.debug("Get Last Version Error: " + error);
            throw error;
        }
    });
}

function setCurrentVersionToBlob(blobService: storage.BlobService) {
    let currentVersion: string = (process.env[versionEnv]) as string;
    currentVersion = typeof currentVersion !== undefined ? currentVersion : "";


    blobService.createBlockBlobFromText(containerName, blobName, currentVersion, (error, result, response) => {
        if (!error) {
            tl.debug(`current version has been set to ${currentVersion}`);
        } else {
            tl.debug("Update the version Error: " + error);
            throw error;
        }
    });
}


createBlobService().then((blobService) => {
    if (method == "get") {   
    setLastVersionToEnv(blobService);
} else {
    setCurrentVersionToBlob(blobService);
}
})
