import * as storage from "azure-storage";
import tl = require('vsts-task-lib/task');

let connectionString = tl.getInput("connectionString", true);
let versionEnv = tl.getInput("versionEnv", true);
let method = tl.getInput("method", true);

let blobService = storage.createBlobService(connectionString);
const containerName = 'release';
blobService.createContainerIfNotExists(containerName, function (error, result, response) {
    if (!error) {
        tl.debug("container created or exist");
    } else {
        tl.debug(error.message);
    }
});
const blobName = "lastversion.txt";

function setLastVersionToEnv() {
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

function setCurrentVersionToBlob() {
    let currentVersion: string = (process.env[versionEnv]) as string;
    currentVersion = typeof currentVersion !== undefined ? currentVersion : "";


    blobService.createAppendBlobFromText(containerName, blobName, Buffer.from(currentVersion), (error, result, response) => {
        if (!error) {
            tl.debug(`current version has been set to ${currentVersion}`);
        } else {
            tl.debug("Update the version Error: " + error);
            throw error;
        }
    });
}

if (method == "get") {
    setLastVersionToEnv();
} else {
    setCurrentVersionToBlob();
}